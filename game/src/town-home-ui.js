(function(){
"use strict";
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const call=(n,...args)=>n+"("+args.map(value=>JSON.stringify(value)).join(",")+")";
const $=s=>document.querySelector(s);
const current=()=>typeof G!=="undefined"&&G.character&&typeof loc==="function"?loc(G.character.locationId):null;
const names={guild:"冒險者公會",general:"商鋪",blacksmith:"鐵匠鋪",tavern:"酒館",inn:"旅館",church:"教會",clinic:"診療所",tailor:"裁縫鋪",alchemy:"煉金工坊",enchanter:"附魔工坊",mageguild:"魔法公會"};
const badgePositions={guild:"0% 0%",general:"33.333% 0%",blacksmith:"66.667% 0%",tavern:"100% 0%",inn:"0% 50%",church:"33.333% 50%",clinic:"66.667% 50%",tailor:"100% 50%",alchemy:"0% 100%",enchanter:"33.333% 100%",mageguild:"66.667% 100%"};
function install(){
 const game=$("#gamePanel");if(!game||$("#townHomeScreen"))return;
 game.insertAdjacentHTML("afterbegin",'<main id="townHomeScreen" class="town-home-screen"><header class="town-home-header"><div><span class="town-home-kicker">異界旅人・旅途據點</span><h1 id="townHomePlace">城鎮</h1><p id="townHomeSubtitle">街道、委託與冒險都從此處展開</p></div><div id="townHomeStatus" class="town-home-status"></div></header><div class="town-home-layout"><section class="town-home-main"><details class="town-home-map" open><summary class="town-home-map-toggle"><span>當地地圖</span><span class="town-home-map-state"><span class="map-open-label">收起地圖　⌃</span><span class="map-closed-label">展開地圖　⌄</span></span></summary><div id="townMapCanvas" class="town-map-canvas"><div class="town-map-transform"><div class="town-map-border"><div class="town-map-water"></div><div class="town-map-wall"></div><div class="town-map-roads"><i></i><i></i><i></i><i></i></div><div class="town-map-district-label">街區與地標</div></div><div id="townMapBuildings" class="town-map-buildings"></div><div id="townMapRoutes" class="town-map-routes"></div></div><div class="town-map-compass">N</div></div></details><section class="town-home-character"><div class="town-home-section-title"><h2>旅人狀態</h2><span id="townHomePosition"></span></div><div id="townHomeProfile"></div><div id="townHomeStatusSummary"></div></section><section class="town-home-actions"><div class="town-home-section-title"><h2>可用行動</h2><span>依所在地與狀態更新</span></div><div id="townHomeActions"></div></section><details class="town-home-journal"><summary>旅誌紀錄</summary><div id="townHomeJournal"></div></details></section></div></main>');
 const status=$("#gamePanel>.hud-meta");if(status)$("#townHomeStatus").appendChild(status);
 const summary=$("#statusSummary");if(summary)$("#townHomeStatusSummary").appendChild(summary);
 const actions=$("#actionButtons");if(actions)$("#townHomeActions").appendChild(actions);
 const log=$("#log");if(log)$("#townHomeJournal").appendChild(log);
}
function renderMap(){
 const l=current();if(!l)return;
 const canvas=$("#townMapCanvas"),pins=$("#townMapBuildings");
 const town=l.kind==="town",dungeon=l.kind==="dungeon";
 const terrainText=[l.name,l.description,l.summary].join(" ");
 const terrain=/海|港|灘|海岸/.test(terrainText)?"coast":/沼|濕地|泥灘|鹽潮/.test(terrainText)?"marsh":/草原|平原|原野/.test(terrainText)?"grassland":/墓|陵|墳|沉砂|遺跡|廢墟/.test(terrainText)?"crypt":/水|潮|淹|河/.test(terrainText)&&dungeon?"flooded-vault":/山|峰|嶺|峽|雪/.test(terrainText)?"mountain":/河|湖|溪|水道/.test(terrainText)?"river":dungeon?"vault":"forest";
 canvas.className="town-map-canvas "+(town?"is-town":dungeon?"is-dungeon":"is-wild is-"+terrain);
 const mapArt=town?"town-map-v1.png":"local-map-v1.png";
 const mapBorder=$("#townMapCanvas .town-map-border");
 let scenery=mapBorder?.querySelector(".town-home-art");
 if(scenery&&scenery.dataset.mapArt!==mapArt){scenery.remove();scenery=null}
 if(!scenery&&mapBorder)mapBorder.insertAdjacentHTML("afterbegin",'<img class="town-home-art" data-map-art="'+mapArt+'" src="./assets/art/maps/'+mapArt+'" alt="" aria-hidden="true">');
 canvas.dataset.locationId=l.id||"";
 $("#townHomePlace").textContent=l.name||"旅人所在之地";
 $("#townHomeSubtitle").textContent=town?"街道、委託與冒險都從此處展開":dungeon?"地城探索・入口與周邊道路":"野外探索・地標與道路";
 const points=[[23,39],[50,34],[77,39],[26,69],[52,72],[78,66],[16,54],[38,55],[62,54],[84,54]];
 pins.innerHTML=town?(l.facilities||[]).map((id,i)=>{const pt=points[i%points.length],badge=badgePositions[id]||"0% 0%";return DB.facilities&&DB.facilities[id]?'<button type="button" class="town-map-building '+esc(id)+'" style="--fx:'+pt[0]+'%;--fy:'+pt[1]+'%" aria-label="前往'+esc(names[id]||DB.facilities[id].name||id)+'" onclick="'+esc(call("xuFacility",id))+'"><span class="town-map-building-badge" aria-hidden="true" style="--badge-position:'+badge+'"></span><b>'+esc(names[id]||DB.facilities[id].name||id)+'</b></button>':""}).join():"";
 $("#townMapRoutes").innerHTML=typeof xuRouteMapForLocation==="function"?xuRouteMapForLocation(l.id,!town):"";
}
function renderProfile(){
 if(typeof G==="undefined"||!G.character)return;
 const c=G.character,cl=typeof cls==="function"?cls(c.classId):null;
 $("#townHomePosition").textContent=(typeof timeText==="function"?timeText():"")+"｜T"+G.turn;
 $("#townHomeProfile").innerHTML='<div class="town-profile-name"><b>'+esc(c.name)+'</b><span>'+esc(cl&&cl.name||"旅人")+'</span></div><div class="town-profile-meta">Lv '+esc(c.level)+'｜冒險階級 '+esc(c.adventureRank||"F")+'｜'+esc(c.raceId||"種族")+'</div>';
}
function renderTownHome(){
 if(typeof G==="undefined"||!G.character)return;
 install();if(!$("#townHomeScreen"))return;
 renderMap();renderProfile();$("#gamePanel").classList.add("town-home-active");
 if(typeof setNavActive==="function")setNavActive("home");
}
window.renderTownHome=renderTownHome;window.openTownHome=renderTownHome;
const render=window.renderAll;
if(typeof render==="function")window.renderAll=function(){const result=render.apply(this,arguments);renderTownHome();return result};
const adventure=window.showAdventure;
if(typeof adventure==="function")window.showAdventure=function(){adventure.apply(this,arguments);renderTownHome()};
function ensureTownHome(){
 const game=$("#gamePanel");
 if(!game||game.classList.contains("hide")||typeof G==="undefined"||!G?.character)return false;
 try{renderTownHome();return !!$("#townHomeScreen")}catch(error){console.warn("town home sync failed",error);return false}
}
window.ensureTownHome=ensureTownHome;
if($("#gamePanel")&&!$("#gamePanel").classList.contains("hide")&&typeof G!=="undefined"&&G.character)ensureTownHome();
window.addEventListener("load",()=>{ensureTownHome();setTimeout(ensureTownHome,0);setTimeout(ensureTownHome,120)},{once:true});
window.addEventListener("pageshow",()=>setTimeout(ensureTownHome,0));
const gamePanel=$("#gamePanel");
if(gamePanel&&typeof MutationObserver==="function"){
 const observer=new MutationObserver(()=>{if(!gamePanel.classList.contains("hide"))setTimeout(ensureTownHome,0)});
 observer.observe(gamePanel,{attributes:true,attributeFilter:["class"]});
}
})();