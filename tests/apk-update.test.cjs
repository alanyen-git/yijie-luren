const assert=require("node:assert/strict");
const update=require("../game/src/apk-update.js");

class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.style={};this.hidden=false;this.listeners={};this.text="";}
  setAttribute(key,value){this.attributes[key]=value;}
  appendChild(node){this.children.push(node);node.parentNode=this;return node;}
  removeChild(node){this.children=this.children.filter(x=>x!==node);return node;}
  replaceChildren(...nodes){this.children=[];for(const node of nodes)this.appendChild(node);}
  append(...nodes){for(const node of nodes)this.appendChild(node);}
  addEventListener(name,handler){this.listeners[name]=handler;}
  set textContent(value){this.text=String(value);this.children=[];}
  get textContent(){return this.text+this.children.map(x=>x.textContent).join("");}
}
function fakeAndroid(fetcher){
  const listeners={};
  const docListeners={};
  const body=new Element("body");
  const document={body,visibilityState:"visible",
    createElement:tag=>new Element(tag),
    querySelector(selector){return selector==="[data-apk-update-notice]"?body.children.find(x=>x.attributes["data-apk-update-notice"]!==undefined)||null:null;},
    addEventListener(name,handler){docListeners[name]=handler;}
  };
  const root={document,location:{href:"http://localhost/index.html",hostname:"localhost"},
    navigator:{onLine:true,userAgent:"Mozilla/5.0 (Linux; Android 16) wv"},
    Capacitor:{getPlatform:()=>"android"},fetch:fetcher,console:{warn(){}},
    AbortController,URL,setTimeout,clearTimeout,
    addEventListener(name,handler){listeners[name]=handler;}
  };
  return {root,body,listeners,docListeners};
}
function jsonResponse(value){return {ok:true,status:200,json:async()=>value};}

async function main(){
  assert.equal(update.compareVersions("CURRENT-1.68.0","CURRENT-1.67.0"),1);
  assert.equal(update.compareVersions("CURRENT-1.67.0","CURRENT-1.67.0"),0);
  assert.equal(update.compareVersions("CURRENT-1.66.9","CURRENT-1.67.0"),-1);
  assert.equal(update.compareVersions("invalid","CURRENT-1.67.0"),null);

  const calls=[];
  let failRemote=true;
  const harness=fakeAndroid(async url=>{
    calls.push(url);
    if(url.includes("raw.githubusercontent.com")){
      if(failRemote)throw new Error("網路中斷");
      return jsonResponse({version:"CURRENT-1.68.0"});
    }
    return jsonResponse({version:"CURRENT-1.67.0"});
  });
  const controller=update.start(harness.root);
  const failed=await controller.check();
  assert.equal(failed.status,"error");
  assert.match(harness.body.textContent,/本機存檔保持不變/);
  assert.match(harness.body.textContent,/查看檢查診斷/);
  assert.ok(!harness.body.textContent.includes("查看新版 APK"));

  failRemote=false;
  const retried=await harness.listeners.online();
  assert.equal(retried.status,"update-available");
  assert.match(harness.body.textContent,/CURRENT-1.68.0/);
  const links=[];
  const visit=node=>{if(node.tagName==="a")links.push(node);for(const child of node.children)visit(child);};
  visit(harness.body);
  assert.equal(links[0].href,update.APK_WORKFLOW_URL);
  assert.equal(links[0].target,"_blank");
  assert.equal(calls.length,4);

  const web=fakeAndroid(async()=>{throw new Error("should not run");});
  web.root.Capacitor={getPlatform:()=>"web"};
  assert.equal((await update.start(web.root).check()).status,"not-android");
  console.log("Android startup update checker: version comparison, safe failure, online retry and APK workflow link passed.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
