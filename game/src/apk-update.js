(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root&&root.document)api.start(root);
})(typeof window!=="undefined"?window:null,function(){
  const REMOTE_VERSION_URL="https://raw.githubusercontent.com/alanyen-git/yijie-luren/main/game/version.json";
  const APK_WORKFLOW_URL="https://github.com/alanyen-git/yijie-luren/actions/workflows/android-debug-apk.yml";
  const TIMEOUT_MS=10000;

  function versionParts(value){
    const match=String(value||"").match(/(\d+)\.(\d+)\.(\d+)/);
    return match?match.slice(1).map(Number):null;
  }

  function compareVersions(a,b){
    const left=versionParts(a),right=versionParts(b);
    if(!left||!right)return null;
    for(let i=0;i<3;i++)if(left[i]!==right[i])return left[i]>right[i]?1:-1;
    return 0;
  }

  function isAndroidApp(root){
    try{
      const cap=root.Capacitor;
      if(cap&&typeof cap.getPlatform==="function")return cap.getPlatform()==="android";
      if(cap&&typeof cap.isNativePlatform==="function"&&cap.isNativePlatform())return cap.getPlatform?.()==="android";
    }catch(error){}
    return root.location?.hostname==="localhost"&&/Android/i.test(root.navigator?.userAgent||"");
  }

  async function fetchJson(root,url){
    const Controller=root.AbortController||(typeof AbortController!=="undefined"?AbortController:null);
    const controller=Controller?new Controller():null;
    const timer=root.setTimeout(()=>controller?.abort(),TIMEOUT_MS);
    try{
      const response=await root.fetch(url,{
        method:"GET",cache:"no-store",credentials:"omit",mode:"cors",
        headers:{Accept:"application/json"},
        ...(controller?{signal:controller.signal}:{})
      });
      if(!response||!response.ok)throw new Error("HTTP "+(response?.status||"無回應"));
      return await response.json();
    }finally{
      root.clearTimeout(timer);
    }
  }

  function findNotice(doc){
    return doc.querySelector("[data-apk-update-notice]");
  }

  function ensureNotice(doc){
    let notice=findNotice(doc);
    if(notice)return notice;
    notice=doc.createElement("aside");
    notice.setAttribute("data-apk-update-notice","");
    notice.setAttribute("role","status");
    notice.setAttribute("aria-live","polite");
    Object.assign(notice.style,{
      position:"fixed",left:"max(12px, env(safe-area-inset-left))",
      right:"max(12px, env(safe-area-inset-right))",
      bottom:"max(16px, env(safe-area-inset-bottom))",zIndex:"20000",
      maxWidth:"560px",margin:"0 auto",padding:"16px",
      border:"1px solid rgba(201,169,106,.65)",borderRadius:"16px",
      background:"#101d2d",color:"#f6edda",boxShadow:"0 12px 34px rgba(0,0,0,.42)",
      font:"14px/1.5 system-ui,sans-serif"
    });
    doc.body.appendChild(notice);
    return notice;
  }

  function clearNotice(notice){
    if(typeof notice.replaceChildren==="function")notice.replaceChildren();
    else while(notice.firstChild)notice.removeChild(notice.firstChild);
  }

  function addCloseButton(root,notice){
    const close=root.document.createElement("button");
    close.type="button";close.textContent="關閉";
    close.setAttribute("aria-label","關閉更新訊息");
    Object.assign(close.style,{float:"right",marginLeft:"12px",padding:"6px 10px",color:"#f6edda",background:"transparent",border:"1px solid #77849a",borderRadius:"8px"});
    close.addEventListener("click",()=>{notice.hidden=true;});
    notice.appendChild(close);
  }

  function showError(root,error){
    const notice=ensureNotice(root.document);clearNotice(notice);notice.hidden=false;
    addCloseButton(root,notice);
    const title=root.document.createElement("strong");
    title.textContent="更新檢查暫時無法完成";
    notice.appendChild(title);
    const message=root.document.createElement("p");
    message.textContent="遊戲與本機存檔保持不變；恢復網路後會自動重試。";
    notice.appendChild(message);
    const details=root.document.createElement("details");
    const summary=root.document.createElement("summary");summary.textContent="查看檢查診斷";
    const diagnostic=root.document.createElement("code");
    diagnostic.textContent=String(error?.message||error||"未知錯誤").slice(0,180);
    details.append(summary,diagnostic);notice.appendChild(details);
    root.console?.warn?.("[異界旅人] APK 更新檢查失敗",error);
  }

  function showUpdate(root,current,latest){
    const notice=ensureNotice(root.document);clearNotice(notice);notice.hidden=false;
    addCloseButton(root,notice);
    const title=root.document.createElement("strong");
    title.textContent="異界旅人有新版："+latest;
    notice.appendChild(title);
    const message=root.document.createElement("p");
    message.textContent="前往 GitHub Actions 下載最新 APK。安裝會由 Android 系統確認；此檢查不會自動安裝或清除存檔。";
    notice.appendChild(message);
    const link=root.document.createElement("a");
    link.href=APK_WORKFLOW_URL;link.target="_blank";link.rel="noopener noreferrer";
    link.textContent="查看新版 APK";
    Object.assign(link.style,{display:"inline-block",padding:"9px 13px",borderRadius:"9px",background:"#c9a96a",color:"#111827",fontWeight:"700",textDecoration:"none"});
    notice.appendChild(link);
    const small=root.document.createElement("small");
    small.textContent="目前版本 "+current+"。請下載最新成功建置中的 APK。";
    Object.assign(small.style,{display:"block",marginTop:"8px",opacity:".8"});
    notice.appendChild(small);
  }

  function hideNotice(root){
    const notice=findNotice(root.document);
    if(notice)notice.hidden=true;
  }

  function start(root){
    let checking=false;
    let lastCheckAt=0;
    async function check(){
      if(!isAndroidApp(root))return {status:"not-android"};
      if(checking)return {status:"checking"};
      checking=true;lastCheckAt=Date.now();
      try{
        if(root.navigator?.onLine===false)throw new Error("目前裝置離線");
        const localUrl=new URL("./version.json",root.location.href).href;
        const [local,remote]=await Promise.all([
          fetchJson(root,localUrl),
          fetchJson(root,REMOTE_VERSION_URL+"?check="+Date.now())
        ]);
        const relation=compareVersions(remote.version,local.version);
        if(relation===null)throw new Error("版本格式無法辨識");
        if(relation>0)showUpdate(root,local.version,remote.version);
        else hideNotice(root);
        return {status:relation>0?"update-available":"current",current:local.version,latest:remote.version};
      }catch(error){
        showError(root,error);
        return {status:"error",error:String(error?.message||error)};
      }finally{checking=false;}
    }
    root.addEventListener("load",()=>{check();},{once:true});
    root.addEventListener("online",()=>check());
    root.addEventListener("focus",()=>{if(Date.now()-lastCheckAt>60000)check();});
    root.document.addEventListener("visibilitychange",()=>{
      if(root.document.visibilityState==="visible"&&Date.now()-lastCheckAt>60000)check();
    });
    return {check};
  }

  return {APK_WORKFLOW_URL,REMOTE_VERSION_URL,compareVersions,start};
});
