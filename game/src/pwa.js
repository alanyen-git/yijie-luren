(()=>{
  let deferredInstallPrompt=null;
  let installButton=null;

  function removeInstallButton(){
    if(installButton&&installButton.parentNode)installButton.parentNode.removeChild(installButton);
    installButton=null;
  }

  function ensureInstallButton(){
    if(installButton||!deferredInstallPrompt)return;
    installButton=document.createElement("button");
    installButton.type="button";
    installButton.textContent="安裝異界旅人到主畫面";
    installButton.setAttribute("aria-label","安裝異界旅人到手機主畫面");
    Object.assign(installButton.style,{
      position:"fixed",
      right:"16px",
      bottom:"88px",
      zIndex:"9999",
      padding:"12px 16px",
      border:"1px solid rgba(130,210,196,.6)",
      borderRadius:"999px",
      background:"#0e2027",
      color:"#f3e2af",
      fontWeight:"700",
      boxShadow:"0 8px 28px rgba(0,0,0,.35)"
    });
    installButton.addEventListener("click",async()=>{
      if(!deferredInstallPrompt)return;
      const prompt=deferredInstallPrompt;
      deferredInstallPrompt=null;
      try{
        await prompt.prompt();
        await prompt.userChoice;
      }catch(error){
        console.warn("PWA install prompt failed",error);
      }
      removeInstallButton();
    });
    document.body.appendChild(installButton);
  }

  window.addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();
    deferredInstallPrompt=event;
    ensureInstallButton();
  });

  window.addEventListener("appinstalled",()=>{
    deferredInstallPrompt=null;
    removeInstallButton();
  });

  window.addEventListener("load",()=>{
    if(!("serviceWorker" in navigator))return;
    if(!/^https?:$/.test(location.protocol))return;
    navigator.serviceWorker.register("sw.js",{scope:"./"})
      .then(registration=>registration.update().catch(()=>null))
      .catch(error=>console.warn("Service worker registration failed",error));
  },{once:true});
})();
