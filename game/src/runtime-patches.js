/*
 * 異界旅人 Runtime 補丁入口
 * 載入順序：runtime.js -> runtime-patches.js
 *
 * CURRENT-1.56.x：
 * - 創角職業資訊補強。
 * - 三槽手動存檔／讀取／刪除系統。
 *
 * 手動槽保存完整 G 世界狀態；既有 yijie_luren_save 繼續作為每回合自動恢復存檔。
 * 不修改角色與世界資料結構；手動槽使用獨立 envelope schema。
 */
(()=>{
  const cleanSkillName=value=>String(value||"")
    .replace(/－通用（(?:物理|魔法)系）/g,"")
    .replace(/\s+/g," ")
    .trim();

  function ensureClassDetailNode(){
    const randomCount=document.getElementById("randomCount");
    if(!randomCount)return null;
    let detail=document.getElementById("classCreationDetails");
    if(detail)return detail;

    detail=document.createElement("div");
    detail.id="classCreationDetails";
    detail.className="small";
    detail.setAttribute("aria-live","polite");
    Object.assign(detail.style,{
      marginTop:"10px",
      paddingTop:"10px",
      borderTop:"1px solid rgba(255,255,255,.12)",
      display:"grid",
      gap:"7px",
      lineHeight:"1.65"
    });
    randomCount.insertAdjacentElement("afterend",detail);
    return detail;
  }

  function appendDetailRow(host,label,value){
    const row=document.createElement("div");
    const title=document.createElement("b");
    title.textContent=`${label}｜`;
    const text=document.createElement("span");
    text.textContent=value;
    row.append(title,text);
    host.appendChild(row);
  }

  function classSkillSummary(c){
    const pool=Array.isArray(DB?.skill_pools?.[c.id])?DB.skill_pools[c.id]:[];
    const unique=[];
    for(const skill of pool){
      const name=cleanSkillName(skill?.name);
      if(!name||unique.includes(name))continue;
      unique.push(name);
    }
    const signature=unique.filter(name=>!String(pool.find(s=>cleanSkillName(s?.name)===name)?.name||"").includes("通用"));
    const examples=(signature.length>=3?signature:unique).slice(0,4);
    const elements=[...new Set(pool.map(s=>s?.element).filter(Boolean))].slice(0,4);
    const core=c.combat_role||c.design_identity||c.category||"職業專屬戰鬥方式";
    const exampleText=examples.length?`代表技能包含${examples.join("、")}`:"技能會依職業技能池逐步解鎖";
    const elementText=elements.length?`；可延伸${elements.join("、")}等元素運用`:"";
    return `以${core}為核心，${exampleText}${elementText}。`;
  }

  function renderCreationClassDetails(){
    const host=ensureClassDetailNode();
    if(!host)return;
    host.replaceChildren();

    const classId=(typeof creation!=="undefined"&&creation)?creation.classId:null;
    const c=classId&&Array.isArray(DB?.combat_classes)
      ?DB.combat_classes.find(entry=>entry.id===classId)
      :null;
    if(!c){
      const hint=document.createElement("span");
      hint.textContent="選取職業後顯示職業介紹、專長武器、職業定位與技能特色。";
      host.appendChild(hint);
      return;
    }

    const category=c.category||c.combat_track_label||"戰鬥職業";
    const primary=c.primary?`，主能力為${c.primary}`:"";
    const resource=c.resource_type?`，主要戰鬥資源為${c.resource_type}`:"";
    const sealed=c.sealed?"目前高階能力處於封印狀態，需依職業前置條件逐步解封。":"";
    const intro=`${c.name}屬於${category}${primary}${resource}。${sealed}`;
    const weapon=c.weapon_group||"依職業裝備規則";
    const role=c.combat_role||c.design_identity||"依職業能力配置";

    appendDetailRow(host,"職業介紹",intro);
    appendDetailRow(host,"專長武器",weapon);
    appendDetailRow(host,"職業定位",role);
    appendDetailRow(host,"技能特色",classSkillSummary(c));
  }

  const originalSelectClass=window.selectClass;
  if(typeof originalSelectClass==="function"){
    window.selectClass=function(id){
      const result=originalSelectClass.apply(this,arguments);
      renderCreationClassDetails();
      return result;
    };
  }

  const originalRollClass=window.rollClass;
  if(typeof originalRollClass==="function"){
    window.rollClass=function(){
      const result=originalRollClass.apply(this,arguments);
      renderCreationClassDetails();
      return result;
    };
  }

  renderCreationClassDetails();
  window.renderCreationClassDetails=renderCreationClassDetails;
})();

(()=>{
  const SLOT_COUNT=3;
  const SLOT_KEY_PREFIX="yijie_luren_manual_slot_";
  const SLOT_SCHEMA_VERSION=1;
  const AUTOSAVE_KEY="yijie_luren_save";
  let lastSlotMode="save";

  const slotKey=slot=>`${SLOT_KEY_PREFIX}${slot}`;
  const validSlot=slot=>Number.isInteger(Number(slot))&&Number(slot)>=1&&Number(slot)<=SLOT_COUNT;
  const deepClone=value=>JSON.parse(JSON.stringify(value));
  const esc=value=>String(value??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");

  function stateTimeText(state){
    const t=state?.worldTime;
    if(!t)return "未知遊戲時間";
    return `紀元${t.year}年・${t.season}・第${t.day}日 ${String(t.hour??0).padStart(2,"0")}:${String(t.minute??0).padStart(2,"0")}`;
  }

  function realTimeText(value){
    if(!value)return "未知";
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return String(value);
    try{return d.toLocaleString("zh-TW",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false})}
    catch(e){return d.toISOString()}
  }

  function classNameFor(state){
    const id=state?.character?.classId;
    const c=Array.isArray(DB?.combat_classes)?DB.combat_classes.find(x=>x.id===id):null;
    return c?.name||id||"未知職業";
  }

  function locationNameFor(state){
    const id=state?.character?.locationId;
    const l=Array.isArray(DB?.locations)?DB.locations.find(x=>x.id===id):null;
    return l?.name||id||"未知地點";
  }

  function buildMetadata(state,savedAt=new Date().toISOString()){
    const c=state?.character||{};
    return {
      characterId:state?.meta?.characterId||c.id||null,
      characterName:c.name||"未命名角色",
      level:Number(c.level||1),
      classId:c.classId||null,
      className:classNameFor(state),
      adventureRank:c.adventureRank||"F",
      locationId:c.locationId||null,
      locationName:locationNameFor(state),
      turn:Number(state?.turn||0),
      worldTimeText:stateTimeText(state),
      savedAt,
      gameVersion:state?.meta?.version||((typeof CURRENT_VERSION!=="undefined")?CURRENT_VERSION:"unknown")
    };
  }

  function readManualSlot(slot){
    if(!validSlot(slot))return {slot:Number(slot),occupied:false,error:"無效存檔槽"};
    let raw=null;
    try{raw=window.localStorage?localStorage.getItem(slotKey(Number(slot))):null}
    catch(e){return {slot:Number(slot),occupied:false,error:"無法讀取瀏覽器儲存空間"}}
    if(!raw)return {slot:Number(slot),occupied:false,error:null};
    try{
      const envelope=JSON.parse(raw);
      if(!envelope||typeof envelope!=="object"||!envelope.gameState)throw new Error("缺少遊戲狀態");
      const schema=Number(envelope.schemaVersion||1);
      if(schema>SLOT_SCHEMA_VERSION)throw new Error(`存檔格式 v${schema} 高於目前支援版本`);
      const state=envelope.gameState;
      if(!state?.meta||!state?.character||!state?.worldTime)throw new Error("存檔核心欄位不完整");
      envelope.schemaVersion=schema;
      envelope.slot=Number(slot);
      envelope.metadata={...buildMetadata(state,envelope.savedAt||envelope.metadata?.savedAt),...(envelope.metadata||{})};
      return {slot:Number(slot),occupied:true,error:null,envelope};
    }catch(e){
      return {slot:Number(slot),occupied:true,error:`存檔資料損毀：${e.message||e}`};
    }
  }

  function manualSlotRecords(){return Array.from({length:SLOT_COUNT},(_,i)=>readManualSlot(i+1))}
  function occupiedSlotCount(){return manualSlotRecords().filter(x=>x.occupied&&!x.error).length}

  function hasManualSaveForCharacter(characterId){
    if(!characterId)return false;
    return manualSlotRecords().some(x=>x.occupied&&!x.error&&x.envelope?.metadata?.characterId===characterId);
  }

  function slotCardHtml(record,mode){
    const slot=record.slot;
    if(record.error){
      return `<div class="card"><b>存檔槽 ${slot}</b><br><span class="small badText">${esc(record.error)}</span><div class="actions"><button class="bad" onclick="deleteManualSlot(${slot},'${mode}')">刪除損毀存檔</button></div></div>`;
    }
    if(!record.occupied){
      return `<div class="card"><b>存檔槽 ${slot}</b><br><span class="small">空白存檔槽</span><div class="actions">${mode==="save"?`<button class="good" onclick="saveToManualSlot(${slot})">儲存至此槽</button>`:`<button disabled>無存檔可讀取</button>`}</div></div>`;
    }

    const m=record.envelope.metadata||{};
    const state=record.envelope.gameState||{};
    const action=mode==="save"
      ?`<button class="good" onclick="saveToManualSlot(${slot})">覆蓋／儲存至此槽</button>`
      :`<button class="good" onclick="loadManualSlot(${slot})">讀取此存檔</button>`;
    return `<div class="card"><b>存檔槽 ${slot}</b><br><b>${esc(m.characterName||"未命名角色")}</b><br><span class="small">Lv.${esc(m.level??state?.character?.level??1)}｜${esc(m.className||classNameFor(state))}｜冒險者［${esc(m.adventureRank||state?.character?.adventureRank||"F")}］<br>所在地：${esc(m.locationName||locationNameFor(state))}<br>遊戲時間：${esc(m.worldTimeText||stateTimeText(state))}<br>回合：${esc(m.turn??state?.turn??0)}<br>最後儲存：${esc(realTimeText(m.savedAt||record.envelope.savedAt))}</span><div class="actions">${action}<button class="bad" onclick="deleteManualSlot(${slot},'${mode}')">刪除存檔</button></div></div>`;
  }

  function saveSlotSummaryNode(){
    const records=manualSlotRecords();
    const node=document.createElement("div");
    node.className="card";
    const occupied=records.filter(x=>x.occupied&&!x.error).length;
    const damaged=records.filter(x=>x.error).length;
    const currentName=(typeof G!=="undefined"&&G?.character?.name)?G.character.name:"尚未開始";
    node.innerHTML=`<b>存檔管理</b><br><span class="small">手動存檔槽：${occupied}/${SLOT_COUNT}${damaged?`｜異常 ${damaged}`:""}<br>目前角色：${esc(currentName)}<br>每回合自動恢復存檔與三個手動槽彼此獨立。</span>`;
    return node;
  }

  function showSaveSlotModal(mode="save"){
    mode=mode==="load"?"load":"save";
    lastSlotMode=mode;
    if(mode==="save"&&(!(typeof G!=="undefined")||!G?.character)){
      alert("目前沒有可儲存的遊戲進度。");
      return;
    }
    const records=manualSlotRecords();
    const intro=mode==="save"
      ?"選擇一個存檔槽保存目前角色與完整世界進度。已有資料的槽位會先要求確認後才覆蓋。"
      :"選擇任一存檔槽讀取角色與完整世界進度。讀取後目前自動恢復進度會切換成該角色。";
    const cards=records.map(r=>slotCardHtml(r,mode)).join("");
    const footer=(typeof G!=="undefined"&&G?.character)?`<div class="actions"><button onclick="openSettings()">返回設定</button></div>`:"";
    showModal(mode==="save"?"手動存檔":"讀取存檔",`<div class="card small">${intro}</div>${cards}${footer}`);
  }

  function saveToManualSlot(slot){
    slot=Number(slot);
    if(!validSlot(slot)||!(typeof G!=="undefined")||!G?.character){alert("目前沒有可儲存的遊戲進度。");return}
    const existing=readManualSlot(slot);
    if(existing.occupied&&!existing.error){
      const oldName=existing.envelope?.metadata?.characterName||"既有角色";
      if(!confirm(`存檔槽 ${slot} 已有「${oldName}」的進度。\n確定要覆蓋嗎？`))return;
    }else if(existing.error){
      if(!confirm(`存檔槽 ${slot} 的資料目前無法讀取。\n確定要用目前進度覆蓋它嗎？`))return;
    }

    const savedAt=new Date().toISOString();
    const state=deepClone(G);
    state.meta=state.meta||{};
    state.meta.saveIndex=Array.isArray(state.meta.saveIndex)?state.meta.saveIndex:[];
    const saveId=`SLOT${slot}-${String(state.meta.characterId||state.character?.id||"CHAR").slice(-6)}-T${String(state.turn||0).padStart(5,"0")}`;
    state.meta.saveIndex.push({id:saveId,turn:state.turn||0,time:stateTimeText(state),type:"MANUAL",reason:`手動存檔槽 ${slot}`});
    if(state.meta.saveIndex.length>180)state.meta.saveIndex=state.meta.saveIndex.slice(-180);
    const envelope={
      schemaVersion:SLOT_SCHEMA_VERSION,
      gameVersion:state.meta.version||((typeof CURRENT_VERSION!=="undefined")?CURRENT_VERSION:"unknown"),
      slot,
      savedAt,
      metadata:buildMetadata(state,savedAt),
      gameState:state
    };

    try{
      if(!window.localStorage)throw new Error("瀏覽器未提供本機儲存空間");
      localStorage.setItem(slotKey(slot),JSON.stringify(envelope));
    }catch(e){
      if(typeof renderSaveHealth==="function")renderSaveHealth(`手動存檔失敗：${e.message||e}`);
      alert(`手動存檔失敗：${e.message||e}`);
      return;
    }

    G.meta=G.meta||{};
    G.meta.saveIndex=Array.isArray(G.meta.saveIndex)?G.meta.saveIndex:[];
    G.meta.saveIndex.push({id:saveId,turn:G.turn||0,time:(typeof timeText==="function"?timeText():stateTimeText(G)),type:"MANUAL",reason:`手動存檔槽 ${slot}`});
    if(G.meta.saveIndex.length>180)G.meta.saveIndex=G.meta.saveIndex.slice(-180);
    if(typeof persist==="function")persist();
    if(typeof log==="function")log("存檔",`已儲存至手動存檔槽 ${slot}。`,"save");
    if(typeof persist==="function")persist();
    if(typeof renderAll==="function")renderAll();
    showSaveSlotModal("save");
  }

  function loadManualSlot(slot){
    slot=Number(slot);
    if(!validSlot(slot))return;
    const record=readManualSlot(slot);
    if(!record.occupied){alert(`存檔槽 ${slot} 是空白的。`);return}
    if(record.error){alert(record.error);return}
    const name=record.envelope?.metadata?.characterName||"此角色";
    if(!confirm(`讀取存檔槽 ${slot}「${name}」？\n目前尚未手動保存的進度將由此存檔取代。`))return;

    const previous=(typeof G!=="undefined")?G:null;
    try{
      const candidate=deepClone(record.envelope.gameState);
      if(!candidate?.meta||!candidate?.character||!candidate?.worldTime)throw new Error("存檔核心欄位不完整");
      G=candidate;
      if(typeof migrateSave==="function")migrateSave();
      if(!G?.meta||!G?.character||!G?.worldTime)throw new Error("存檔轉換後驗證失敗");
      if(typeof persist==="function")persist();
      if(typeof closeModal==="function")closeModal();
      if(typeof enterGame==="function")enterGame(true);
      if(typeof log==="function")log("存檔",`已讀取手動存檔槽 ${slot}：${name}。`,"save");
      if(typeof persist==="function")persist();
    }catch(e){
      G=previous;
      alert(`此存檔無法讀取。\n目前遊戲進度沒有受到影響。\n${e.message||e}`);
      if(previous&&typeof renderAll==="function")renderAll();
    }
  }

  function deleteManualSlot(slot,mode=lastSlotMode){
    slot=Number(slot);
    if(!validSlot(slot))return;
    const record=readManualSlot(slot);
    if(!record.occupied)return;
    const name=record.error?`存檔槽 ${slot}`:(record.envelope?.metadata?.characterName||`存檔槽 ${slot}`);
    if(!confirm(`確定永久刪除「${name}」的存檔嗎？\n此操作無法復原。`))return;
    try{localStorage.removeItem(slotKey(slot))}
    catch(e){alert(`刪除失敗：${e.message||e}`);return}
    showSaveSlotModal(mode==="load"?"load":"save");
  }

  function ensureCreationLoadButton(){
    const panel=document.getElementById("createPanel");
    if(!panel||document.getElementById("creationLoadSaveButton"))return;
    const primary=panel.querySelector("button.primary");
    if(!primary)return;
    const box=document.createElement("div");
    box.className="card";
    box.id="creationSaveLoadBox";
    box.innerHTML=`<b>既有角色</b><br><span class="small">可從三個手動存檔槽切換至另一名角色；手動槽不會被每回合自動存檔覆蓋。</span><div class="actions"><button type="button" id="creationLoadSaveButton">讀取存檔（${occupiedSlotCount()}/${SLOT_COUNT}）</button></div>`;
    primary.insertAdjacentElement("beforebegin",box);
    box.querySelector("#creationLoadSaveButton")?.addEventListener("click",()=>showSaveSlotModal("load"));
  }

  const originalOpenSettings=window.openSettings;
  if(typeof originalOpenSettings==="function"){
    window.openSettings=function(){
      const result=originalOpenSettings.apply(this,arguments);
      const body=document.getElementById("modalBody");
      if(!body)return result;
      const buttons=[...body.querySelectorAll("button")];
      const manualButton=buttons.find(btn=>String(btn.getAttribute("onclick")||"").replace(/\s+/g,"")==="manualSave()");
      if(manualButton){
        manualButton.textContent="手動存檔";
        const loadButton=document.createElement("button");
        loadButton.type="button";
        loadButton.textContent="讀取存檔";
        loadButton.addEventListener("click",()=>showSaveSlotModal("load"));
        manualButton.insertAdjacentElement("afterend",loadButton);
      }
      const firstCard=body.querySelector(".card");
      const summary=saveSlotSummaryNode();
      if(firstCard)firstCard.insertAdjacentElement("afterend",summary);
      else body.prepend(summary);
      return result;
    };
  }

  window.manualSave=function(){showSaveSlotModal("save")};
  window.openManualSaveSlots=()=>showSaveSlotModal("save");
  window.openLoadSaveSlots=()=>showSaveSlotModal("load");
  window.saveToManualSlot=saveToManualSlot;
  window.loadManualSlot=loadManualSlot;
  window.deleteManualSlot=deleteManualSlot;

  const originalResetGame=window.resetGame;
  window.resetGame=function(){
    const current=(typeof G!=="undefined")?G:null;
    const currentId=current?.meta?.characterId||current?.character?.id||null;
    const protectedByManual=hasManualSaveForCharacter(currentId);
    const message=protectedByManual
      ?"確定建立新角色嗎？\n目前自動恢復進度會清除，但三個手動存檔槽都會保留。"
      :"目前角色尚未保存到任何手動存檔槽。\n建立新角色後，目前自動恢復進度會被清除。\n建議先取消並使用「手動存檔」。\n\n仍要建立新角色嗎？";
    if(!confirm(message))return;
    try{localStorage.removeItem(AUTOSAVE_KEY)}catch(e){}
    location.reload();
  };

  window.YIJIE_SAVE_SLOT_SYSTEM={
    version:"SAVE-SLOTS-1.0",
    slotCount:SLOT_COUNT,
    schemaVersion:SLOT_SCHEMA_VERSION,
    autosaveKey:AUTOSAVE_KEY,
    manualSlotPrefix:SLOT_KEY_PREFIX
  };

  window.addEventListener("load",()=>{
    ensureCreationLoadButton();
  },{once:true});
})();
