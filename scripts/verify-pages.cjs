const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root=path.resolve(__dirname,"..");
const localVersion=JSON.parse(fs.readFileSync(path.join(root,"www","app","version.json"),"utf8"));
const build=JSON.parse(fs.readFileSync(path.join(root,"www","web-build.json"),"utf8"));
assert.equal(build.entry,"app/");
assert.equal(build.exact_app_mirror,true);
assert.equal(build.ui_transform,false);

const base=process.env.PAGES_URL;
if(!base){console.log("Local only: "+localVersion.version);process.exit(0)}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function getText(url){
 const r=await fetch(url,{cache:"no-store",headers:{"Cache-Control":"no-cache"}});
 if(!r.ok)throw new Error(url+" HTTP "+r.status);
 return r.text();
}
async function getJson(url){return JSON.parse(await getText(url))}
(async()=>{
 let last;
 for(let attempt=1;attempt<=20;attempt++){
  try{
   const q="?verify="+Date.now()+"-"+attempt;
   const rv=await getJson(new URL("version.json"+q,base));
   const av=await getJson(new URL("app/version.json"+q,base));
   const rootHtml=await getText(new URL(q,base));
   const appHtml=await getText(new URL("app/"+q,base));
   const townHome=await getText(new URL("app/src/town-home-ui.js"+q,base));
   const runtime=await getText(new URL("app/src/runtime.js"+q,base));
   const game=await fetch(new URL("game/"+q,base),{cache:"no-store"});
   const play=await fetch(new URL("play/"+q,base),{cache:"no-store"});
   assert.equal(rv.version,localVersion.version);
   assert.equal(rv.web_entry,"app/");
   assert.equal(av.version,localVersion.version);
   assert.ok(rootHtml.includes("./app/"));
   assert.ok(!appHtml.includes("NEW WEB"));
   assert.ok(!appHtml.includes("web-build-badge"));
   assert.ok(!appHtml.includes("WEB 2.0"));
   assert.ok(!appHtml.includes("冒險指揮台"));
   assert.ok(townHome.includes("異界旅人・旅途據點"));
   assert.ok(!townHome.includes("openWorldMapHierarchy()")&&!townHome.includes("openSettings()"));
   assert.ok(!townHome.includes("當地情報")&&!townHome.includes("townHomeFlavor"));
   assert.ok(townHome.indexOf("當地地圖")<townHome.indexOf("旅人狀態")&&townHome.indexOf("旅人狀態")<townHome.indexOf("可用行動"));
   assert.ok(townHome.includes("當地地圖"));
   assert.ok(townHome.includes("ensureTownHome"));
   assert.ok(runtime.includes('if(typeof window.renderTownHome==="function")window.renderTownHome()'));
   assert.equal(game.status,404);
   assert.equal(play.status,404);
   console.log("Verified public fresh App mirror: "+new URL("app/",base)+" version="+localVersion.version);
   return;
  }catch(e){last=e;console.log("Pages not fresh, attempt "+attempt+": "+e.message);await sleep(3000)}
 }
 throw last;
})().catch(e=>{console.error(e);process.exit(1)});
