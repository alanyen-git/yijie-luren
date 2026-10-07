(function(){
"use strict";
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const call=(n,...args)=>n+"("+args.map(value=>JSON.stringify(value)).join(",")+")";
const getLoc=id=>typeof loc==="function"?loc(id):(DB.locations||[]).find(x=>x.id===id);
const area=id=>(DB.settlement_region_maps||[]).find(x=>x.id===id);
const areaOf=id=>(DB.settlement_region_maps||[]).find(x=>(x.location_ids||[]).includes(id));
const areas=id=>(DB.settlement_region_maps||[]).filter(x=>x.parent_province_region_id===id);
function regionalScene(text){
 const t=String(text||"");
 if(/風泉村/.test(t))return "region-windspring";
 if(/鹽潮荒野|鹽潮/.test(t))return "region-salt-tide";
 if(/沉砂遺跡|沉砂/.test(t))return "region-sinking-sand";
 if(/霧港村|霧港/.test(t))return "region-mist-harbor";
 if(/皓月|黑潮|群島|島|海|港|潮/.test(t))return "region-islands";
 if(/白氈|汗國|草原|游牧|大漠/.test(t))return "region-steppe";
 if(/瑟露維亞|精靈|森林|林地|黑月|深庭/.test(t))return "region-forest";
 if(/霜角|龍脊|火山|高山|雪嶺|山脈/.test(t))return "region-highland";
 if(/晨律|沼澤|濕地|鹽沼|沼/.test(t))return "region-marsh";
 if(/斷境|沙漠|荒漠|沉砂|戈壁/.test(t))return "region-desert";
 if(/聖曜|安威爾|卡薩維爾|自由城|帝國|教國|城盟/.test(t))return "region-city";
 return "region-riverland";
}
const exploreState=id=>{const l=getLoc(id);if(!l)return"未踏";if(typeof G!=="undefined"&&G.character&&G.character.locationId===id)return"目前所在";const history=typeof G!=="undefined"&&Array.isArray(G.history)?G.history:[];return history.some(h=>h.tag==="旅行"&&String(h.text||"").includes("抵達"+l.name))?"曾經抵達":"尚未抵達"};
function crumb(label,fn){return '<button class="xu-crumb" type="button" onclick="'+esc(fn)+'">'+esc(label)+'</button>'}
function board(kind,body,sceneId){const key=kind.split(" ")[0],painting=key==="world"?"world-map-v1.png":key==="realm"||key==="province"?"kingdom-map-v1.png":"local-map-v1.png";const h=typeof G!=="undefined"&&G.worldTime?G.worldTime.hour:12,time=h<6?"night":h<10?"dawn":h<18?"day":h<21?"dusk":"night";return '<div class="xu-board has-painting '+kind+' time-'+time+'"><div class="xu-map-viewport"><div class="xu-map-pan-surface"><img class="xu-map-painting" src="./assets/art/maps/'+painting+'" alt="" aria-hidden="true">'+body+'</div></div><div class="xu-compass">N</div></div>'}
function frame(title,crumbs,content){return '<div class="xu-map-shell"><div class="xu-map-head"><div><p class="eyebrow">異界旅人・五層地圖</p><h3>'+esc(title)+'</h3><p class="xu-map-hint">世界 → 王國／政體 → 行省 → 當地區域 → 城鎮</p></div><div class="xu-crumbs">'+crumbs+'</div></div>'+content+'</div>'}
function node(label,meta,fn,kind){return '<button type="button" class="xu-map-node '+(kind||"")+'" onclick="'+esc(fn)+'"><b>'+esc(label)+'</b><small>'+esc(meta||"")+'</small></button>'}
function routeLayout(nodes,edges,currentId,radial){
 const ids=nodes.map(n=>String(n.id)),byId=new Map(nodes.map(n=>[String(n.id),n])),adj=new Map(ids.map(id=>[id,new Set()]));
 edges.forEach(e=>{const a=String(e.a),b=String(e.b);if(adj.has(a)&&adj.has(b)){adj.get(a).add(b);adj.get(b).add(a)}});
 const origin=String(currentId||""),xy=new Map();
 if(radial&&byId.has(origin)){
  xy.set(origin,{x:500,y:300});const others=nodes.filter(n=>String(n.id)!==origin).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  others.forEach((n,i)=>{const angle=-Math.PI/2+i*Math.PI*2/Math.max(1,others.length);xy.set(String(n.id),{x:Math.round(500+340*Math.cos(angle)),y:Math.round(300+215*Math.sin(angle))})});
  return xy
 }
 if(byId.has(origin)&&edges.length){
  const depth=new Map([[origin,0]]),queue=[origin];
  while(queue.length){const id=queue.shift();for(const next of adj.get(id)||[])if(!depth.has(next)){depth.set(next,depth.get(id)+1);queue.push(next)}}
  let max=Math.max(0,...depth.values());const rest=nodes.filter(n=>!depth.has(String(n.id))).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  rest.forEach(n=>{depth.set(String(n.id),++max)});
  const layers=new Map();nodes.forEach(n=>{const d=depth.get(String(n.id))||0;if(!layers.has(d))layers.set(d,[]);layers.get(d).push(n)});
  const maxDepth=Math.max(1,...layers.keys());
  for(const [d,layer] of layers){layer.sort((a,b)=>String(a.id).localeCompare(String(b.id)));layer.forEach((n,i)=>{const count=layer.length;const spread=Math.min(430,Math.max(140,count*78));const y=count===1?300:Math.round(300-spread/2+(i+.5)*spread/count);xy.set(String(n.id),{x:d===0?115:Math.round(115+770*d/maxDepth),y})})}
  return xy
 }
 const sorted=nodes.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 if(sorted.length===1){xy.set(String(sorted[0].id),{x:500,y:300});return xy}
 sorted.forEach((n,i)=>{const angle=-Math.PI/2+i*Math.PI*2/Math.max(1,sorted.length);xy.set(String(n.id),{x:Math.round(500+360*Math.cos(angle)),y:Math.round(300+220*Math.sin(angle))})});
 return xy
}
function routeCanvas(nodes,edges,currentId,options){
 options=options||{};const xy=routeLayout(nodes,edges,currentId,!!options.radial),paths=[];
 edges.forEach(e=>{const a=xy.get(String(e.a)),b=xy.get(String(e.b));if(!a||!b)return;const bend=Math.max(30,Math.abs(b.x-a.x)*.22),d="M"+a.x+","+a.y+" C"+(a.x+bend)+","+a.y+" "+(b.x-bend)+","+b.y+" "+b.x+","+b.y;paths.push('<path class="xu-road-shadow" d="'+d+'"></path><path class="xu-road-center" d="'+d+'"></path>')});
 const pins=nodes.map(n=>{const p=xy.get(String(n.id));if(!p)return"";const classes=["xu-route-marker","is-"+(n.kind||"place"),n.current?"is-current":"",n.visited?"is-visited":"",n.adjacent?"is-adjacent":""].filter(Boolean).join(" "),verb=n.current?"查看目前地點":n.adjacent?"沿路前往":"開啟地點資料",label=String(n.name||n.id),meta=String(n.meta||"");return '<button type="button" class="'+classes+'" style="left:'+p.x/10+'%;top:'+p.y/6+'%" aria-label="'+esc(label+"｜"+meta+"｜"+verb)+'" title="'+esc(label+"｜"+meta)+'" onclick="'+esc(n.action||"")+'"><span class="xu-map-pin-glyph" aria-hidden="true">'+esc(n.icon||"◇")+'</span><span class="xu-map-pin-label"><b>'+esc(label)+'</b><small>'+esc(meta)+'</small></span></button>'}).join("");
 return '<div class="xu-route-map '+(options.className||"")+'" role="group" aria-label="'+esc(options.label||"道路地圖")+'"><svg class="xu-road-network" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><g>'+paths.join("")+'</g></svg>'+pins+'</div>'
}
const locationIcon=k=>k==="town"?"⌂":k==="dungeon"?"▣":"⚑";
const kindLabel=k=>k==="town"?"城鎮":k==="dungeon"?"地下城":"野外";
const currentLocationId=()=>typeof G!=="undefined"&&G.character?G.character.locationId:null;
function routeEdges(locations){
 const ids=new Set(locations.map(x=>String(x.id))),seen=new Set(),edges=[];
 locations.forEach(l=>(l.links||[]).forEach(link=>{const to=String(link.to);if(!ids.has(to)||to===String(l.id))return;const key=[String(l.id),to].sort().join("|");if(seen.has(key))return;seen.add(key);edges.push({a:String(l.id),b:to,hours:Number(link.hours)||1})}));
 return edges
}
function locationMapNodes(locations,current){
 const cur=current&&getLoc(current);return locations.map(l=>{const route=(cur?.links||[]).find(e=>e.to===l.id),isHere=!!cur&&cur.id===l.id;return{id:l.id,name:l.name,kind:l.kind,current:isHere,visited:exploreState(l.id)==="曾經抵達",adjacent:!!route,icon:locationIcon(l.kind),meta:isHere?"目前所在":route?"可前往・"+(Number(route.hours)||1)+" 小時":kindLabel(l.kind)+"・地點資料",action:isHere?call(l.kind==="town"?"xuTown":"xuLocation",l.id):route?call("travel",l.id,Number(route.hours)||1):call("xuLocation",l.id)}})
}
function neighboringLocations(locations){
 const all=new Map(locations.map(l=>[String(l.id),l]));locations.forEach(l=>(l.links||[]).forEach(e=>{const to=getLoc(e.to);if(to)all.set(String(to.id),to)}));return Array.from(all.values())
}
function routeMapForLocation(id,radial){
 const l=getLoc(id);if(!l)return"";const places=neighboringLocations([l]),nodes=locationMapNodes(places,l.id),edges=routeEdges(places);
 return routeCanvas(nodes,edges,l.id,{radial:!!radial,className:radial?"xu-route-map-home":"",label:l.name+"周邊道路"})
}
window.xuRouteMapForLocation=routeMapForLocation;
function world(){
 const rows=(DB.realm_region_maps||[]).map(r=>{const p=typeof politicalEntity==="function"?politicalEntity(r.political_entity_id):null;return{id:r.id,name:p?p.name:r.name,kind:"realm",icon:"◆",meta:"行省 "+(r.province_region_ids||[]).length,action:call("xuRealm",r.id)}}),content='<div class="xu-map-title">世界航路</div>'+routeCanvas(rows,[],null,{label:"世界政體地圖"})+'<div class="xu-map-footer">點選政體圖釘，下鑽查看行省與道路；圖釘位置只供辨識，不代表比例尺。</div>';
 showModal("世界地圖",frame("世界地圖",crumb("世界",call("xuWorld","")),board("world",content)));
}
function realm(id){
 const r=typeof realmRegionMap==="function"?realmRegionMap(id):null;if(!r)return world();
 const p=typeof politicalEntity==="function"?politicalEntity(r.political_entity_id):null;
 const rows=(r.province_region_ids||[]).map(pid=>{const x=typeof provinceRegion==="function"?provinceRegion(pid):null;return x?{id:x.id,name:x.name,kind:"province",icon:"⬟",meta:x.administrative_type||"行省",action:call("xuProvince",x.id)}:null}).filter(Boolean);
 const coreRegion=p&&p.core_region_id?(DB.world_regions||[]).find(x=>x.id===p.core_region_id):null;
 const geography=coreRegion?'<div class="xu-map-footer xu-map-geography"><b>已登錄核心地理區域（非行省）</b><br>'+esc(coreRegion.name)+(coreRegion.terrain?'<br>地形：'+esc(coreRegion.terrain):"")+(coreRegion.layered_sovereignty?'<br>'+esc(coreRegion.sovereignty_note||"此區域具有分層主權紀錄。"):"")+'<br>地理區域不代表行政區，也不提供下鑽地圖。</div>':"";
 const listing=rows.length?routeCanvas(rows,[],null,{label:(p?p.name:r.name)+"行省地圖"}):'<div class="xu-map-footer xu-map-empty" role="status" aria-live="polite">此政體目前尚未登錄行省級地圖資料。請使用「世界」按鈕返回上一層；此畫面不會虛構行政區。</div>'+geography;
 const title=p?p.name:r.name,content='<div class="xu-map-title">'+esc(title)+'</div>'+listing+(rows.length?'<div class="xu-map-footer">點選行省圖釘進入道路地圖。政體核心地理區域不代表已登錄行省。</div>':"");
 showModal(title+"・王國地圖",frame(title,crumb("世界",call("xuWorld",""))+crumb("王國／政體",call("xuRealm",r.id)),board("realm",content,regionalScene([p&&p.name,r.name].join(" ")))),call("xuWorld",""));
}
function province(id){
 const p=typeof provinceRegion==="function"?provinceRegion(id):null;if(!p)return world();
 const r=typeof realmRegionMap==="function"?realmRegionMap(p.parent_realm_map_id):null,groups=areas(p.id);
 const owned=new Set(groups.flatMap(x=>x.location_ids||[])),members=new Map(),ownerByLocation=new Map();
 groups.forEach(group=>{const list=(group.location_ids||[]).map(getLoc).filter(Boolean);members.set(String(group.id),list);list.forEach(place=>ownerByLocation.set(String(place.id),"area:"+group.id))});
 const loose=["town","wild","dungeon"].flatMap(k=>typeof provinceCategoryLocations==="function"?provinceCategoryLocations(p,k,false):[]).filter(x=>!owned.has(x.id));
 const sourceLocations=Array.from(new Map(groups.flatMap(g=>members.get(String(g.id))||[]).concat(loose).map(x=>[String(x.id),x])).values());
 const places=neighboringLocations(sourceLocations),current=currentLocationId();
 const currentGroup=groups.find(g=>(g.location_ids||[]).includes(current));
 const areaNodes=groups.map(g=>({id:"area:"+g.id,name:g.name,kind:"area",icon:"⌖",current:!!currentGroup&&String(currentGroup.id)===String(g.id),meta:(members.get(String(g.id))||[]).length+"處地點・查看當地道路",action:call("xuLocal",g.id)}));
 const exposed=places.filter(x=>!owned.has(x.id)),placeNodes=locationMapNodes(exposed,current),nodes=areaNodes.concat(placeNodes);
 const nodeIds=new Set(nodes.map(x=>String(x.id))),edgeSeen=new Set(),edges=[];
 const nodeForLocation=locationId=>ownerByLocation.get(String(locationId))||(nodeIds.has(String(locationId))?String(locationId):null);
 places.forEach(place=>(place.links||[]).forEach(link=>{const a=nodeForLocation(place.id),b=nodeForLocation(link.to);if(!a||!b||a===b)return;const key=[a,b].sort().join("|");if(edgeSeen.has(key))return;edgeSeen.add(key);edges.push({a,b})}));
 const currentNode=currentGroup?"area:"+currentGroup.id:(nodeIds.has(String(current))?String(current):null);
 const content='<div class="xu-map-title">'+esc(p.display_name||p.name)+'</div>'+routeCanvas(nodes,edges,currentNode,{label:p.name+"行道路網"})+'<div class="xu-map-footer">行省圖依已登錄的當地區域與道路呈現；點區域圖釘進入當地道路圖，再點相鄰城鎮、野外或地下城直接旅行。未歸屬地點只按既有位置與道路顯示，不新增行政區。</div>';
 showModal(p.name+"・行省道路地圖",frame(p.name,(r?crumb("王國／政體",call("xuRealm",r.id)):"")+crumb("行省",call("xuProvince",p.id)),board("province",content,regionalScene([r&&r.name,p.name,...groups.map(x=>x.name)].join(" ")))),r?call("xuRealm",r.id):call("xuWorld",""));
}
function local(id){
 const s=area(id);if(!s)return world();
 const p=typeof provinceRegion==="function"?provinceRegion(s.parent_province_region_id):null,r=p&&typeof realmRegionMap==="function"?realmRegionMap(p.parent_realm_map_id):null;
 const ids=s.location_ids||[],base=ids.map(getLoc).filter(Boolean),places=neighboringLocations(base),nodes=locationMapNodes(places,currentLocationId()),edges=routeEdges(places);
 const content='<div class="xu-map-title">'+esc(s.name)+'・道路圖</div>'+routeCanvas(nodes,edges,currentLocationId(),{label:s.name+"道路地圖"})+'<div class="xu-map-footer">金色圖釘是目前位置；點選相鄰圖釘就會沿已登錄道路直接旅行。</div>';
 showModal(s.name+"・當地道路地圖",frame(s.name,(r?crumb("王國／政體",call("xuRealm",r.id)):"")+(p?crumb("行省",call("xuProvince",p.id)):"")+crumb("當地區域",call("xuLocal",s.id)),board("local",content,regionalScene([r&&r.name,p&&p.name,s.name,s.role].join(" ")))),p?call("xuProvince",p.id):call("xuWorld",""));
}
function dungeonIndex(l){
 const points=(Array.isArray(l.explore)?l.explore:[]).filter(x=>Array.isArray(x)&&x.length>0);
 const records=typeof G!=="undefined"&&Array.isArray(G.explorationIntel)?G.explorationIntel.filter(x=>x&&x.locationId===l.id):[];
 const known=points.reduce((n,p)=>n+(records.some(r=>String(r.text||"").includes(String(p[0])))?1:0),0);
 const rows=points.map(p=>{const label=String(p[0]),weight=Math.round(Number(p[1])||0),record=records.find(r=>String(r.text||"").includes(label));return '<div class="xu-dungeon-point '+(record?"is-known":"")+'" role="listitem"><span class="xu-dungeon-point-mark" aria-hidden="true">'+(record?"✓":"◇")+'</span><span class="xu-dungeon-point-copy"><b>'+esc(label)+'</b><small>'+(record?esc(record.quality||"已記錄")+"｜重訪 "+Math.max(1,Number(record.timesSeen)||1)+" 次":"尚未記錄")+'</small></span><span class="xu-dungeon-weight">權重 '+weight+'%</span></div>'}).join("");
 return '<section class="xu-dungeon-index" aria-label="地城探索紀錄"><div class="xu-dungeon-index-head"><div><b>地城探索索引</b><small>依既有資料庫列出探索項目</small></div><strong>'+known+' / '+points.length+'<small>已記錄</small></strong></div><div class="xu-dungeon-points" role="list">'+(rows||'<p class="small">此地尚未建立探索項目。</p>')+'</div><p class="xu-dungeon-note">名稱與權重來自既有地點資料；此索引不代表房間座標或地圖路徑。實際探索後，線索會依本機旅誌更新。</p></section>'
}
function locationMap(id){
 const l=getLoc(id);if(!l)return world();if(l.kind==="town"){const here=currentLocationId()===l.id,route=(getLoc(currentLocationId())?.links||[]).find(e=>e.to===l.id);if(here)return town(id);if(route)return travel(l.id,Number(route.hours)||1);if(typeof openMapLocationDetail==="function")return openMapLocationDetail(id);return world()}const s=areaOf(id),d=l.kind==="dungeon";
 const places=neighboringLocations([l]),activeId=currentLocationId(),nodes=locationMapNodes(places,activeId),edges=routeEdges(places);
 const terrainText=[l.name,l.description,l.summary,s&&s.name].join(" "),archetype=l.encounter_profile&&l.encounter_profile.archetype||"",scene=/鹽潮荒野|鹽潮/.test(terrainText)?"region-salt-tide":/沉砂遺跡|沉砂/.test(terrainText)?"region-sinking-sand":/霧港村|霧港/.test(terrainText)?"region-mist-harbor":null;
 const dungeonScene={waterway_ruin:"flooded-vault",natural_water_cave:"flooded-vault",swamp_ruin:"marsh",tomb:"crypt",shrine_ruin:"crypt",natural_burrow:"vault",natural_cave:"vault",mine:"vault",artificial_cellar:"vault",artificial_ruin:"vault",fortress_basement:"vault"}[archetype]||(/水|潮|淹|河/.test(terrainText)?"flooded-vault":/墓|陵|墳|沉砂|遺跡|廢墟|古城/.test(terrainText)?"crypt":"vault");
 const terrain=d?dungeonScene:/海|港|灘|海岸/.test(terrainText)?"coast":/沼|濕地|泥灘|鹽潮/.test(terrainText)?"marsh":/草原|平原|原野/.test(terrainText)?"grassland":/山|峰|嶺|峽|雪/.test(terrainText)?"mountain":/河|湖|溪|水道/.test(terrainText)?"river":"forest";
 const mapContent='<div class="xu-map-title">'+esc(l.name)+(d?"・地下城道路圖":"・野外道路圖")+'</div>'+routeCanvas(nodes,edges,activeId,{label:l.name+"野外道路地圖"})+'<div class="xu-map-footer">圖釘與道路只呈現資料庫已登錄地點；點相鄰城鎮、野外或地下城可直接前往。</div>';
 const content=board(d?("dungeon-site terrain-"+terrain):("wild-site terrain-"+terrain),mapContent,scene||terrain)+(d?dungeonIndex(l):"");
 showModal(l.name+(d?"・地下城":"・野外"),frame(l.name,(s?crumb("當地區域",call("xuLocal",s.id)):"")+crumb(d?"地下城":"野外",call("xuLocation",l.id)),content),s?call("xuLocal",s.id):call("xuWorld",""));
}
function town(id){
 const l=getLoc(id);if(!l)return world();const currentLoc=getLoc(currentLocationId()),arrival=(currentLoc?.links||[]).find(e=>e.to===l.id);if(currentLoc&&currentLoc.id!==l.id){if(arrival)return travel(l.id,Number(arrival.hours)||1);if(typeof openMapLocationDetail==="function")return openMapLocationDetail(l.id);return world()}const s=areaOf(id),p=s&&typeof provinceRegion==="function"?provinceRegion(s.parent_province_region_id):null,r=p&&typeof realmRegionMap==="function"?realmRegionMap(p.parent_realm_map_id):null;
 const labels={guild:"冒險者公會",general:"商鋪",blacksmith:"鐵匠鋪",tavern:"酒館",inn:"旅館",church:"教會",clinic:"診療所",tailor:"裁縫鋪",alchemy:"煉金工坊",enchanter:"附魔工坊",mageguild:"魔法公會"};
  const badgePositions={guild:"0% 0%",general:"33.333% 0%",blacksmith:"66.667% 0%",tavern:"100% 0%",inn:"0% 50%",church:"33.333% 50%",clinic:"66.667% 50%",tailor:"100% 50%",alchemy:"0% 100%",enchanter:"33.333% 100%",mageguild:"66.667% 100%"};
 const positions=[[25,38],[50,35],[75,38],[28,68],[52,70],[76,66],[18,53],[39,53],[61,53],[82,52]];
 const fac=(l.facilities||[]).map((fid,i)=>{const f=DB.facilities&&DB.facilities[fid],pt=positions[i%positions.length],label=labels[fid]||f?.name||fid,badge=badgePositions[fid]||"0% 0%";return f?'<button type="button" class="xu-facility '+esc(fid)+'" style="--fx:'+pt[0]+'%;--fy:'+pt[1]+'%" aria-label="前往'+esc(label)+'" title="'+esc(label)+'" onclick="'+esc(call("xuFacility",fid))+'"><span class="xu-facility-badge" aria-hidden="true" style="--badge-position:'+badge+'"></span><b>'+esc(label)+'</b></button>':""}).join("");
 const places=neighboringLocations([l]),nodes=locationMapNodes(places,l.id),edges=routeEdges(places);
 const townScene='<img class="xu-town-illustration" src="./assets/art/maps/town-map-v1.png" alt="" aria-hidden="true">',content='<div class="xu-town-board painterly-town'+(/風泉村/.test(l.name||"")?" windspring-village":"")+'"><div class="xu-town-map-surface"><div class="xu-town-title"><b>'+esc(l.name)+'</b><small>'+esc(l.size||"聚落")+'</small></div>'+townScene+'<div class="xu-town-street street-a"></div><div class="xu-town-street street-b"></div><div class="xu-town-center"></div><div class="xu-facility-map">'+fac+'</div>'+routeCanvas(nodes,edges,l.id,{radial:true,className:"xu-route-map-town",label:l.name+"街道及外出道路"})+'<div class="xu-map-footer">點地圖上的設施圖釘進入互動；外圍道路圖釘會直接移動到相鄰地點。</div></div></div>';
 showModal(l.name+"・城鎮地圖",frame(l.name,(r?crumb("王國／政體",call("xuRealm",r.id)):"")+(p?crumb("行省",call("xuProvince",p.id)):"")+(s?crumb("當地區域",call("xuLocal",s.id)):"")+crumb("城鎮",call("xuTown",l.id)),content));
}
function current(){const c=typeof mapHierarchyForLocation==="function"?mapHierarchyForLocation():{};if(c.location&&c.location.kind==="town")return town(c.location.id);if(c.location&&(c.location.kind==="wild"||c.location.kind==="dungeon"))return locationMap(c.location.id);if(c.settlement)return local(c.settlement.id);if(c.province)return province(c.province.id);if(c.realm)return realm(c.realm.id);return world()}
window.xuWorld=world;window.xuRealm=realm;window.xuProvince=province;window.xuLocal=local;window.xuLocation=locationMap;window.xuTown=town;window.xuFacility=function(id){if(typeof visitFacility==="function")return visitFacility(id)};
window.openMap=current;window.openWorldMapHierarchy=world;window.openRealmRegionMap=realm;window.openProvinceRegionMap=province;window.openSettlementRegionMap=local;
})();