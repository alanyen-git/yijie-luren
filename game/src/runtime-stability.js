/* CURRENT-1.118.0: action transaction, burst guard and lightweight crash diagnostics. */
(()=>{"use strict";
const root=globalThis;
if(root.__RUNTIME_STABILITY_INSTALLED)return;
const original={
  beginTurn:root.beginTurn,
  endTurn:root.endTurn,
  persist:root.persist,
  renderAll:root.renderAll
};
if(Object.values(original).some(fn=>typeof fn!=="function"))return;

const DIAGNOSTIC_KEY="yijie_luren_runtime_diagnostics";
const SESSION_KEY="yijie_luren_runtime_session";
const DIAGNOSTIC_LIMIT=40;
const INPUT_COOLDOWN_MS=140;
const state={
  active:false,
  committing:false,
  inputLocked:false,
  reason:"",
  startedAt:0,
  needPersist:false,
  needRender:false,
  actionCount:0,
  blockedCount:0,
  lastPersistMs:0,
  lastRenderMs:0
};
let unlockTimer=null,diagnosticTimer=null;

function now(){return typeof performance!=="undefined"&&typeof performance.now==="function"?performance.now():Date.now()}
function safeGameState(){
  try{return {
    turn:typeof G!=="undefined"?Number(G?.turn||0):0,
    locationId:typeof G!=="undefined"?G?.character?.locationId||null:null,
    battleActive:typeof G!=="undefined"?!!G?.battle?.active:false,
    saveBytes:Number(root.__LAST_SAVE_BYTES||0)
  }}catch{return {turn:0,locationId:null,battleActive:false,saveBytes:Number(root.__LAST_SAVE_BYTES||0)}}
}
function readDiagnostics(){
  try{const rows=JSON.parse(root.localStorage?.getItem(DIAGNOSTIC_KEY)||"[]");return Array.isArray(rows)?rows.slice(-DIAGNOSTIC_LIMIT):[]}catch{return []}
}
const diagnostics=readDiagnostics();
function flushDiagnostics(){
  diagnosticTimer=null;
  try{root.localStorage?.setItem(DIAGNOSTIC_KEY,JSON.stringify(diagnostics.slice(-DIAGNOSTIC_LIMIT)))}catch{}
}
function scheduleDiagnosticFlush(immediate=false){
  if(diagnosticTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(diagnosticTimer);
  diagnosticTimer=null;
  if(immediate||typeof root.setTimeout!=="function")flushDiagnostics();
  else diagnosticTimer=root.setTimeout(flushDiagnostics,250);
}
function messageFor(error){return String(error?.message||error?.reason?.message||error?.reason||error||"unknown error").slice(0,240)}
function record(type,data={}){
  diagnostics.push({at:new Date().toISOString(),type,...safeGameState(),...data});
  if(diagnostics.length>DIAGNOSTIC_LIMIT)diagnostics.splice(0,diagnostics.length-DIAGNOSTIC_LIMIT);
  if(type==="error"||type==="unhandled_rejection")scheduleDiagnosticFlush(true);
}
function writeSession(cleanExit){
  try{root.localStorage?.setItem(SESSION_KEY,JSON.stringify({id:sessionId,startedAt:sessionStartedAt,updatedAt:new Date().toISOString(),cleanExit:!!cleanExit,...safeGameState()}))}catch{}
}
const sessionStartedAt=new Date().toISOString(),sessionId=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
try{
  const previous=JSON.parse(root.localStorage?.getItem(SESSION_KEY)||"null");
  if(previous&&previous.cleanExit===false){record("unclean_restart",{previousSessionId:previous.id||null,previousTurn:Number(previous.turn||0),previousLocationId:previous.locationId||null});scheduleDiagnosticFlush(true)}
}catch{}
writeSession(false);
function setBusy(busy){
  const body=root.document?.body;if(!body)return;
  body.classList.toggle("runtime-action-busy",busy);
  if(busy)body.setAttribute("aria-busy","true");else body.removeAttribute("aria-busy");
}
function unlockInput(){state.inputLocked=false;if(!state.active)setBusy(false)}
function startCooldown(){
  state.inputLocked=true;setBusy(true);
  if(unlockTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(unlockTimer);
  if(typeof root.setTimeout==="function")unlockTimer=root.setTimeout(()=>{unlockTimer=null;unlockInput()},INPUT_COOLDOWN_MS);
  else unlockInput();
}
function clearTransaction(cooldown=false){
  state.active=false;state.committing=false;state.reason="";state.startedAt=0;state.needPersist=false;state.needRender=false;
  if(cooldown)startCooldown();else if(!state.inputLocked)setBusy(false);
}
function runMeasured(kind,fn,args){
  const started=now(),result=fn.apply(root,args),elapsed=Math.max(0,now()-started);
  if(kind==="persist")state.lastPersistMs=elapsed;else state.lastRenderMs=elapsed;
  if(elapsed>=80)record("slow_"+kind,{durationMs:Math.round(elapsed)});
  return result;
}
function commitTransaction(error=null){
  if(!state.active||state.committing)return false;
  state.committing=true;
  const actionReason=state.reason,startedAt=state.startedAt;
  let persistError=null,renderError=null;
  try{if(state.needPersist||error)runMeasured("persist",original.persist,[])}catch(caught){persistError=caught;console.error("[穩定層] 行動提交存檔失敗。",caught)}
  try{if(state.needRender||error)runMeasured("render",original.renderAll,[])}catch(caught){renderError=caught;console.error("[穩定層] 行動提交繪製失敗。",caught)}
  state.actionCount++;
  record(error?"action_abort":"action_commit",{
    reason:actionReason,
    durationMs:Math.round(Math.max(0,now()-startedAt)),
    persistMs:Math.round(state.lastPersistMs),
    renderMs:Math.round(state.lastRenderMs),
    error:error?messageFor(error):undefined,
    persistError:persistError?messageFor(persistError):undefined,
    renderError:renderError?messageFor(renderError):undefined
  });
  if(error||state.actionCount%10===0){writeSession(false);scheduleDiagnosticFlush(!!error)}
  clearTransaction(true);
  return true;
}

root.persist=function(){
  if(state.active&&!state.committing){state.needPersist=true;return true}
  return runMeasured("persist",original.persist,arguments)
};
root.renderAll=function(){
  if(state.active&&!state.committing){state.needRender=true;return}
  return runMeasured("render",original.renderAll,arguments)
};
root.beginTurn=function(reason){
  if(state.active||state.inputLocked){state.blockedCount++;record("action_blocked",{reason:String(reason||""),active:state.active});return false}
  state.active=true;state.reason=String(reason||"");state.startedAt=now();state.needPersist=false;state.needRender=false;setBusy(true);
  try{
    const accepted=original.beginTurn.apply(this,arguments);
    if(!accepted)clearTransaction(false);
    return accepted;
  }catch(error){
    state.needPersist=true;state.needRender=true;commitTransaction(error);throw error;
  }
};
root.endTurn=function(){
  if(!state.active)return original.endTurn.apply(this,arguments);
  try{const result=original.endTurn.apply(this,arguments);commitTransaction();return result}
  catch(error){state.needPersist=true;state.needRender=true;commitTransaction(error);throw error}
};
root.abortRuntimeAction=function(error){
  if(!state.active){record("error",{message:messageFor(error)});return false}
  state.needPersist=true;state.needRender=true;return commitTransaction(error||new Error("action aborted"));
};
root.addEventListener?.("error",event=>{
  record("error",{message:messageFor(event?.error||event?.message),source:String(event?.filename||"").slice(-120),line:Number(event?.lineno||0)});
  if(state.active)root.abortRuntimeAction(event?.error||event?.message);
});
root.addEventListener?.("unhandledrejection",event=>{
  record("unhandled_rejection",{message:messageFor(event?.reason)});
  if(state.active)root.abortRuntimeAction(event?.reason);
});
root.addEventListener?.("pagehide",()=>writeSession(true));
root.addEventListener?.("beforeunload",()=>writeSession(true));
root.exportRuntimeDiagnostics=function(){
  flushDiagnostics();
  const report={
    version:root.document?.querySelector?.('meta[name="app-version"]')?.content||"unknown",
    generatedAt:new Date().toISOString(),
    runtime:{...state,...safeGameState()},
    diagnostics:diagnostics.slice()
  };
  const json=JSON.stringify(report,null,2);
  try{
    const blob=new Blob([json],{type:"application/json;charset=utf-8"}),link=root.document.createElement("a");
    link.href=URL.createObjectURL(blob);link.download=`yijie-runtime-diagnostics-${Date.now()}.json`;link.click();
    root.setTimeout?.(()=>URL.revokeObjectURL(link.href),400);return true;
  }catch(error){
    root.navigator?.clipboard?.writeText?.(json).catch(()=>{});console.warn("runtime diagnostics download failed",error);return false;
  }
};
if(typeof root.openSettings==="function"){
  const originalOpenSettings=root.openSettings;
  root.openSettings=function(){
    const result=originalOpenSettings.apply(this,arguments),saveButton=root.document?.querySelector?.('#modalBody button[onclick="exportSave()"]'),actions=saveButton?.parentElement;
    if(actions&&!actions.querySelector("[data-runtime-diagnostics]")){
      const button=root.document.createElement("button");button.type="button";button.dataset.runtimeDiagnostics="1";button.textContent="匯出診斷";button.addEventListener("click",root.exportRuntimeDiagnostics);actions.appendChild(button);
    }
    return result;
  };
}
root.RUNTIME_STABILITY=Object.freeze({
  version:"RUNTIME-STABILITY-1.0",
  diagnosticKey:DIAGNOSTIC_KEY,
  snapshot:()=>({...state,...safeGameState()}),
  recentDiagnostics:()=>diagnostics.slice(),
  flushDiagnostics
});
root.__RUNTIME_STABILITY_INSTALLED=true;
})();
