/* 城鎮資料完整化 CURRENT-1.134.0
 * 載入順序：game-data.js -> 資料包 -> map-inference-pack-v1.js -> 本檔 -> runtime.js
 * 原則：補齊既有可遊玩城鎮的描述、服務、地圖階層與在地內容；背景推演城鎮維持鎖定。
 */
(()=>{
  "use strict";
  if(typeof DB!=="object"||!DB)return;

  const add=(key,rows)=>{
    DB[key]=Array.isArray(DB[key])?DB[key]:[];
    const ids=new Set(DB[key].map(row=>row&&row.id).filter(Boolean));
    for(const row of rows){if(row&&row.id&&!ids.has(row.id)){DB[key].push(row);ids.add(row.id)}}
  };
  const find=(key,id)=>(DB[key]||[]).find(row=>row&&row.id===id);
  const unique=rows=>[...new Set((rows||[]).filter(Boolean))];
  const town=id=>find("locations",id);
  const link=(from,to,hours)=>{
    const a=town(from),b=town(to);
    if(!a||!b)return;
    a.links=Array.isArray(a.links)?a.links:[];
    b.links=Array.isArray(b.links)?b.links:[];
    if(!a.links.some(row=>row.to===to))a.links.push({to,hours});
    if(!b.links.some(row=>row.to===from))b.links.push({to:from,hours});
  };

  // 舊版阿斯戴拉資料已經有地點與內容，但省級／聚落級欄位未採用統一地圖 schema。
  const provinceSpecs={
    "PROV-ASD-CROWN":{name:"王冠直轄省",capital:"ASD-CAPITAL",towns:["ASD-CAPITAL","ASD2-AMBERFIELD"],wild:["ASD2-WILD-AMBERFIELDS","ASD2-WILD-CROWNFALLOW"],dungeons:["ASD2-DUNGEON-OLDMINT","ASD2-DUNGEON-CROWNROOT"]},
    "PROV-ASD-RIVER":{name:"河谷省",capital:"ASD-SILVER",towns:["ASD-RIVER","ASD-SILVER","ASD2-MOONMILL"],wild:["ASD2-WILD-MILLCHANNEL","ASD2-WILD-REEDBANK","ASD2-WILD-NIGHTMARSH"],dungeons:["ASD2-DUNGEON-MILLVAULT","ASD2-DUNGEON-MIRRORDEPTH"]},
    "PROV-ASD-NORTH":{name:"北境省",capital:"ASD-GRAYGATE",towns:["ASD-GRAYGATE","ASD-MISTPINE","ASD2-NORTHWATCH"],wild:["ASD2-WILD-FROSTLINE","ASD2-WILD-WOLFSHADOW"],dungeons:["ASD2-DUNGEON-WATCHCRYPT"]},
    "PROV-ASD-EAST":{name:"東境省",capital:"ASD-REDCLIFF",towns:["ASD-REDCLIFF","ASD-DAWNPORT","ASD2-IRONFORD","ASD2-SEABREAK"],wild:["ASD2-WILD-IRONTRAIL","ASD2-WILD-BASALTHOLLOW","ASD2-WILD-SEABREAKREEF"],dungeons:["ASD2-DUNGEON-BASALTVAULT","ASD2-DUNGEON-REEFCHAPEL"]}
  };
  for(const [id,spec] of Object.entries(provinceSpecs)){
    const row=find("province_region_maps",id);
    if(!row)continue;
    Object.assign(row,{layer:"province_region",name:spec.name,parent_realm_map_id:"RMAP-POL-001",political_entity_id:"POL-001",world_region_id:"REG-ASD-01",capital_location_id:spec.capital,major_settlement_ids:spec.towns,all_location_ids:unique([...spec.towns,...spec.wild,...spec.dungeons]),map_status:"playable_partial",access_policy:"既有阿斯戴拉劇情與道路網可使用；B級封鎖區仍受資格與許可限制。"});
  }
  const asdRealm=find("realm_region_maps","RMAP-POL-001");
  if(asdRealm){
    asdRealm.province_region_ids=unique([...(asdRealm.province_region_ids||[]),...Object.keys(provinceSpecs)]);
    asdRealm.notes="第二層王國區域地圖；王冠、河谷、北境與東境省已補齊可下鑽的城鎮與道路資料。";
  }

  for(const row of DB.settlement_region_maps||[]){
    if(!String(row.id).startsWith("SET-ASD"))continue;
    const locationId=row.center_location_id||row.location_id;
    const location=town(locationId);
    Object.assign(row,{layer:"settlement_region",parent_province_region_id:row.parent_province_region_id||row.province_id,center_location_id:locationId,location_ids:unique([...(row.location_ids||[]),locationId]),map_status:"playable_partial",political_entity_id:"POL-001",world_region_id:"REG-ASD-01"});
    if(location)location.settlement_region_id=row.id;
  }

  // 補回阿斯戴拉道路網；所有新增路段均雙向，且不跨越既有劇情／國境解鎖。
  [
    ["ASD-CAPITAL","ASD2-AMBERFIELD",3.5],["ASD-CAPITAL","ASD2-WILD-CROWNFALLOW",2],["ASD-CAPITAL","ASD2-DUNGEON-OLDMINT",0.5],["ASD-CAPITAL","ASD2-DUNGEON-CROWNROOT",0.7],["ASD2-AMBERFIELD","ASD2-WILD-AMBERFIELDS",1],["ASD2-AMBERFIELD","ASD2-WILD-CROWNFALLOW",2.2],["ASD2-WILD-CROWNFALLOW","ASD2-DUNGEON-OLDMINT",1.4],
    ["ASD-RIVER","ASD-SILVER",2.5],["ASD-RIVER","ASD2-MOONMILL",2.2],["ASD-SILVER","ASD2-MOONMILL",2.6],["ASD-SILVER","ASD2-WILD-REEDBANK",1.1],["ASD-SILVER","ASD2-WILD-NIGHTMARSH",6],["ASD2-MOONMILL","ASD2-WILD-MILLCHANNEL",1],["ASD2-MOONMILL","ASD2-DUNGEON-MILLVAULT",0.5],["ASD2-WILD-REEDBANK","ASD2-WILD-MILLCHANNEL",1.4],["ASD2-WILD-REEDBANK","ASD2-WILD-NIGHTMARSH",4.5],["ASD2-WILD-NIGHTMARSH","ASD2-DUNGEON-MIRRORDEPTH",0.6],
    ["ASD-GRAYGATE","ASD2-NORTHWATCH",4],["ASD-GRAYGATE","ASD-MISTPINE",3],["ASD-GRAYGATE","ASD2-WILD-WOLFSHADOW",2.2],["ASD2-NORTHWATCH","ASD2-WILD-FROSTLINE",2.5],["ASD2-NORTHWATCH","ASD2-DUNGEON-WATCHCRYPT",0.5],["ASD-MISTPINE","ASD2-WILD-WOLFSHADOW",1.8],["ASD2-WILD-WOLFSHADOW","ASD2-WILD-FROSTLINE",4],["ASD2-WILD-FROSTLINE","ASD2-DUNGEON-WATCHCRYPT",1],
    ["ASD-REDCLIFF","ASD2-IRONFORD",2],["ASD-REDCLIFF","ASD-DAWNPORT",5],["ASD-REDCLIFF","ASD2-WILD-BASALTHOLLOW",2.5],["ASD2-IRONFORD","ASD-DAWNPORT",4],["ASD2-IRONFORD","ASD2-WILD-IRONTRAIL",1],["ASD-DAWNPORT","ASD2-SEABREAK",3.2],["ASD2-SEABREAK","ASD2-WILD-SEABREAKREEF",1.1],["ASD2-WILD-SEABREAKREEF","ASD2-DUNGEON-REEFCHAPEL",0.5],["ASD2-WILD-IRONTRAIL","ASD2-WILD-BASALTHOLLOW",2.4],["ASD2-WILD-BASALTHOLLOW","ASD2-DUNGEON-BASALTVAULT",0.6]
  ].forEach(route=>link(...route));

  const asdTowns={
    "ASD-CAPITAL":{province:"PROV-ASD-CROWN",settlement:"SET-ASD-CAPITAL",size:"王都",safety:78,authority:"王室外廷、白塔法庭與市政行會",economy:["王室行政","高階工藝","河港貿易"],landmarks:["王宮外廷","冒險者公會總會","白塔教會","王家鍛造院","中央市場"],facilities:["guild","general","blacksmith","tailor","alchemy","enchanter","mageguild","tavern","inn","church","clinic"]},
    "ASD-RIVER":{province:"PROV-ASD-RIVER",settlement:"SET-ASD-RIVER",size:"小鎮",safety:68,authority:"河谷糧運協會與駐鎮教會",economy:["穀物集散","護運","馬匹補給"],landmarks:["冒險者公會支部","小型教會","穀倉","馬廄"],facilities:["guild","general","blacksmith","tavern","inn","church"]},
    "ASD-SILVER":{province:"PROV-ASD-RIVER",settlement:"SET-ASD-SILVER",size:"省城",safety:72,authority:"糧價議所、商路聯盟與地方議會",economy:["河運","穀物期貨","水路倉儲"],landmarks:["河運碼頭","商路聯盟會館","糧價議所","冒險者公會支部"],facilities:["guild","general","blacksmith","tailor","alchemy","tavern","inn","church","clinic"]},
    "ASD-GRAYGATE":{province:"PROV-ASD-NORTH",settlement:"SET-ASD-GRAYGATE",size:"守備鎮",safety:60,authority:"灰門守備隊與邊境教會",economy:["軍需","獵團","礦木採集"],landmarks:["灰門守備隊","邊境教會","獵團營地","修繕工坊"],facilities:["guild","general","blacksmith","tavern","inn","church","clinic"]},
    "ASD-MISTPINE":{province:"PROV-ASD-NORTH",settlement:"SET-ASD-MISTPINE",size:"林業鎮",safety:63,authority:"林務所、藥草行會與月泉教會",economy:["木材","藥草","巡林"],landmarks:["藥草行會","林務所","月泉教會","冒險者公會支部"],facilities:["guild","general","alchemy","tavern","inn","church","clinic"]},
    "ASD-REDCLIFF":{province:"PROV-ASD-EAST",settlement:"SET-ASD-REDCLIFF",size:"礦業鎮",safety:58,authority:"礦坑管理所、鐵匠行會與商路聯盟",economy:["礦石","鍛造","山道運輸"],landmarks:["礦坑管理所","鐵匠行會","熔石酒館","赤岩教會"],facilities:["guild","general","blacksmith","alchemy","tavern","inn","church"]},
    "ASD-DAWNPORT":{province:"PROV-ASD-EAST",settlement:"SET-ASD-DAWNPORT",size:"港城",safety:67,authority:"王國海關與商路聯盟碼頭會",economy:["海運","關稅","潮汐勘測"],landmarks:["海關","港口教會","商路聯盟碼頭","潮汐觀測所"],facilities:["guild","general","blacksmith","tailor","alchemy","tavern","inn","church","clinic"]},
    "ASD2-IRONFORD":{province:"PROV-ASD-EAST",settlement:"SET-ASD2-IRONFORD",size:"小鎮",safety:62,authority:"渡口商隊聯會與礦材市集",economy:["礦材","修車","騾隊運輸"],landmarks:["渡口","修車工坊","小型公會櫃檯","礦材市集"],facilities:["guild","general","blacksmith","tavern","inn","church"]},
    "ASD2-MOONMILL":{province:"PROV-ASD-RIVER",settlement:"SET-ASD2-MOONMILL",size:"水磨鎮",safety:66,authority:"渠務所與糧倉理事會",economy:["穀粉","灌溉","糧倉"],landmarks:["水磨群","糧倉","渠務所","冒險者公會辦事處"],facilities:["guild","general","tavern","inn","church"]},
    "ASD2-NORTHWATCH":{province:"PROV-ASD-NORTH",settlement:"SET-ASD2-NORTHWATCH",size:"堡鎮",safety:57,authority:"北望堡守備長與傷兵救護所",economy:["邊防","獵團","救護補給"],landmarks:["北望堡","烽火臺","傷兵救護所","獵團交易場"],facilities:["guild","general","blacksmith","tavern","inn","church","clinic"]},
    "ASD2-AMBERFIELD":{province:"PROV-ASD-CROWN",settlement:"SET-ASD2-AMBERFIELD",size:"農鎮",safety:74,authority:"蜂農會館與王都南路驛站",economy:["蜂蜜","亞麻","乳酪"],landmarks:["蜂農會館","亞麻倉","小教會","驛站"],facilities:["guild","general","tailor","tavern","inn","church"]},
    "ASD2-SEABREAK":{province:"PROV-ASD-EAST",settlement:"SET-ASD2-SEABREAK",size:"礁岸鎮",safety:61,authority:"救難隊、鹽場與海岸教會",economy:["鹽","乾魚","繩索","救難"],landmarks:["鹽場","救難隊","繩索工坊","海岸教堂"],facilities:["guild","general","blacksmith","tailor","tavern","inn","church","clinic"]}
  };
  for(const [id,spec] of Object.entries(asdTowns)){
    const row=town(id); if(!row)continue;
    Object.assign(row,{world_region_id:"REG-ASD-01",political_entity_id:"POL-001",province_region_id:spec.province,realm_region_map_id:"RMAP-POL-001",settlement_region_id:spec.settlement,world_tier:row.tier,size:spec.size,safety_score:spec.safety,safety_label:spec.safety>=70?"穩定":spec.safety>=62?"注意": "警戒",safety_rule:"離開城鎮後依道路與野外危險度結算；B級封鎖區仍須資格與許可。",local_authority:spec.authority,economy:spec.economy,landmarks:spec.landmarks,facilities:spec.facilities});
  }

  const originalTowns={
    "L-WILLOW":{description:"柳橋與低地農野交會的河谷新手鎮；木橋稅、農產集散與林緣巡守讓它成為西境最常見的第一站。",size:"河谷鎮",safety:76,authority:"柳橋鎮務會與渡口稅吏",economy:["農產","渡口","林緣採集"],role:"西境入門補給站"},
    "L-PINE":{description:"位於長草牧野與白樺疏林之間的林牧村，樵夫、牧人與草藥採集者以季節輪替維持生計。",size:"林牧村",safety:73,authority:"松谷村民會與樵夫會",economy:["木材","牧產","草藥"],role:"林牧補給點"},
    "L-LOVEN":{description:"邊侯領行政與河運稅務中心；商隊、文書吏與前往白石、灰峰的旅人都在此整補。",size:"邊境城",safety:71,authority:"洛文邊侯府與城防隊",economy:["行政","河運","工藝","商隊"],role:"西境行政樞紐"},
    "L-STONEFORD":{description:"碎石丘道、採石坑與風裂山徑交會的石砌渡鎮，以渡河、採坑安全與車隊修繕聞名。",size:"渡鎮",safety:65,authority:"石渡工頭會與路政哨",economy:["石材","渡運","採坑"],role:"山道交通節點"},
    "L-GREENHARBOR":{description:"白石河支流與霧蘆沼地交會的淺灣鎮，河貨、蘆葦與沼舟情報在此交換。",size:"河灣鎮",safety:67,authority:"綠灣河務會與沼舟行",economy:["河貨","蘆葦","漁獵","藥材"],role:"沼地前線補給站"},
    "L-SELENBURG":{description:"中央王原的王室都城與政治核心，行政、教育、工藝與跨區商路在城牆內外分層運作。",size:"王都",safety:82,authority:"王室、中央議會與王都衛隊",economy:["行政","學術","高階工藝","貿易"],role:"王國核心城市"},
    "L-WHITESTONE":{description:"白石河中游的防洪城鎮與穀糧轉運中心；河務、水標與救濟糧倉決定了每個雨季的秩序。",size:"河城",safety:70,authority:"白石河務署與糧倉議會",economy:["穀糧","河運","水利"],role:"河谷物流中心"},
    "L-GREYPEAK":{description:"灰峰山道與松林採集區的山城，獵團、採集師與路巡隊共同維持高地商道。",size:"山城",safety:63,authority:"灰峰路巡隊與山城工坊會",economy:["礦材","松脂","獵產","山道運輸"],role:"高地探險與採集基地"}
  };
  for(const [id,spec] of Object.entries(originalTowns)){
    const row=town(id);if(!row)continue;
    Object.assign(row,{description:spec.description,world_tier:row.tier,size:spec.size,safety_score:spec.safety,safety_label:spec.safety>=70?"穩定":spec.safety>=62?"注意":"警戒",safety_rule:"城鎮內依守備與設施保障；城外依道路與遭遇地圖危險度結算。",political_role:spec.role,local_authority:spec.authority,economy:spec.economy});
  }

  const npcRows=[
    ["WILLOW-ERIN","艾琳・河繩","渡口帳房","L-WILLOW","渡口稅帳若和車隊貨單對不上，先別急著怪商人；河水漲過一次，碼頭的順序就全亂了。"],["WILLOW-RODE","羅德・苔印","林緣巡守","L-WILLOW","巡查不是追著野獸跑；先看哪條獸徑忽然沒有鳥叫。"],
    ["PINE-VESEN","薇森・針葉","樵夫會引路人","L-PINE","白樺疏林的路每天都會變，留下樹皮記號的人才有資格帶隊。"],["PINE-ANDER","安得・石篝","牧野醫者","L-PINE","先把受寒和飢餓處理好，再談藥草；疲憊的人分不清毒草和救命草。"],
    ["LOVEN-MAREI","馬蕾・銀環","邊侯文書吏","L-LOVEN","印章代表責任，不代表真相。送來的文書，總得有人肯逐行核對。"],["LOVEN-GREEN","葛林・迴橋","城市補給監","L-LOVEN","車隊能否按時離城，常取決於一根車軸和一袋沒被記上的麥粉。"],
    ["STONEFORD-BEIR","拜爾・鑿河","渡石工頭","L-STONEFORD","河床石不怕重錘，怕的是趕工。每一塊鬆石都可能害下一隊人沉下去。"],["STONEFORD-FUYA","芙雅・砂釘","採坑安全員","L-STONEFORD","坑道沒有英勇，只有支柱、繩索和肯回報裂縫的人。"],
    ["GREENHARBOR-SHELA","雪拉・青舟","沼舟領航員","L-GREENHARBOR","霧蘆沼不會吃人，它只會把不看水色的人送去錯的地方。"],["GREENHARBOR-MONTE","蒙特・鹽蘆","河貨商","L-GREENHARBOR","蘆束、鹽和藥材都能換錢；前提是你先把貨從沼地完整帶回來。"],
    ["SELENBURG-IVAN","伊凡・王紋","王原傳令官","L-SELENBURG","王都命令走得快，不代表它到了邊地還適用。傳令的人必須把差異一起帶回來。"],["SELENBURG-LIA","莉雅・高橋","王都會計官","L-SELENBURG","帳本不是用來裝飾的。每一筆省下的糧票，都是冬天能否多撐一天。"],
    ["WHITESTONE-OWEN","歐文・穀鈴","河務水標員","L-WHITESTONE","水標偏一指，夜航船就可能偏一整段河。看見掉漆的標柱記得回報。"],["WHITESTONE-ROSA","洛莎・白穗","救濟糧倉管","L-WHITESTONE","救濟不是施捨，是讓人在下一場洪水前還有力氣重建。"],
    ["GREYPEAK-SAEN","賽恩・灰炬","山道巡守","L-GREYPEAK","山風不會告訴你雪崩在哪裡，但牠會先把火炬吹成同一個方向。"],["GREYPEAK-ZHUOYA","卓雅・松脂","採集師","L-GREYPEAK","松脂要在對的時節取，連山林都有它不願被打擾的時候。"],
    ["ASDRIVER-TIMI","提米・河堤","河谷農糧協調員","ASD-RIVER","河堤裂了先保住下游的田，再談誰該出錢；糧車等不起會議。"],["ASDRIVER-MARAN","瑪蘭・渡鐘","河運修士","ASD-RIVER","渡鐘不是叫船的，是提醒人們潮水和承諾一樣，都有該抵達的時刻。"],
    ["REDCLIFF-BRAN","布蘭・赤錘","赤岩坑道監工","ASD-REDCLIFF","礦脈能再找，工人回不來就什麼都不值。"],["REDCLIFF-ISSE","伊絲・熔砂","礦脈記錄員","ASD-REDCLIFF","岩樣上的顏色會說話，只是它們從不說人們想聽的答案。"]
  ];
  const namedNpcs=npcRows.map(([key,name,role,locationId,text])=>({id:"NPC-TOWN-"+key,name,role,tier:town(locationId)?.tier||"E",location_id:locationId,description:`${name}是${town(locationId)?.name||"地方"}的${role}，提供在地道路、風險與補給情報。`,services:["地方情報","委託引導"],dialogue_ids:["DIA-TOWN-"+key],knowledge_scope:"僅涵蓋所屬城鎮、相連道路與公開地方制度。"}));
  const dialogues=npcRows.map(([key,name,role,locationId,text])=>({id:"DIA-TOWN-"+key,speaker_id:"NPC-TOWN-"+key,topic:role,text}));
  add("regional_npc_archetypes",namedNpcs);
  add("npc_dialogues",dialogues);

  const townQuests=[
    {id:"Q-TOWN-WILLOW-BRIDGE",name:"柳橋林緣巡路",tier:"F",min_level:1,max_level:8,type:"巡查",description:"協助巡守確認灰橡林緣的橋頭與獸徑，回報阻路與異常足跡。",objective:{kind:"patrol",location_id:"L-WOOD",target:2,checkpoints:["柳橋北側木樁","林緣獸徑"]},reward:[14,24],xp_reward:16,recommended_locations:["L-WILLOW","L-WOOD"]},
    {id:"Q-TOWN-PINE-MEADOW",name:"松谷牧野巡欄",tier:"F",min_level:1,max_level:8,type:"巡查",description:"確認長草牧野外圍的圍欄與牧道，驅離造成牲畜驚散的小型威脅。",objective:{kind:"patrol",location_id:"L-MEADOW",target:2,checkpoints:["東側牧欄","白樺路口"]},reward:[14,24],xp_reward:16,recommended_locations:["L-PINE","L-MEADOW"]},
    {id:"Q-TOWN-LOVEN-LEDGER",name:"洛文山道貨單",tier:"E",min_level:5,max_level:16,type:"調查",description:"比對碎石丘道路上的貨單與封條，找出延誤車隊的真實原因。",objective:{kind:"action",location_id:"L-HILL",target:2},reward:[42,66],xp_reward:40,recommended_locations:["L-LOVEN","L-HILL"]},
    {id:"Q-TOWN-STONEFORD-QUARRY",name:"石渡採坑支柱",tier:"E",min_level:5,max_level:16,type:"修繕",description:"依安全員標記檢查採石坑支柱與排水道，禁止冒進深層坑室。",objective:{kind:"action",location_id:"L-QUARRY",target:2},reward:[44,70],xp_reward:42,recommended_locations:["L-STONEFORD","L-QUARRY"]},
    {id:"Q-TOWN-GREENHARBOR-REED",name:"綠灣蘆澤標記",tier:"E",min_level:5,max_level:17,type:"巡查",description:"在霧蘆沼地復核沼舟標記，更新失效的回航提示。",objective:{kind:"patrol",location_id:"L-MARSH",target:2,checkpoints:["淺灣浮標","蘆門回航樁"]},reward:[46,72],xp_reward:44,recommended_locations:["L-GREENHARBOR","L-MARSH"]},
    {id:"Q-TOWN-SELENBURG-COURIER",name:"瑟倫堡公文交接",tier:"D",min_level:10,max_level:26,type:"護送",description:"護送公開公文至洛文城，沿途維持封條與交接紀錄完整。",objective:{kind:"action",location_id:"L-LOVEN",target:2},reward:[92,145],xp_reward:76,recommended_locations:["L-SELENBURG","L-LOVEN"]},
    {id:"Q-TOWN-ASDRIVER-SILTMARK",name:"河谷淤標巡查",tier:"F",min_level:1,max_level:10,type:"巡查",description:"替河運修士核對青蘆河岸的淤積標記，讓糧船避開淺灘。",objective:{kind:"patrol",location_id:"ASD2-WILD-REEDBANK",target:2,checkpoints:["南岸淤標","舊渡口白樁"]},reward:[18,30],xp_reward:20,recommended_locations:["ASD-RIVER","ASD2-WILD-REEDBANK"]},
    {id:"Q-TOWN-REDCLIFF-CART",name:"赤岩礦車回收",tier:"E",min_level:6,max_level:18,type:"護送",description:"協助把斷軸礦車與封印礦袋帶離赤鐵商道，避免夜間遺失。",objective:{kind:"action",location_id:"ASD2-WILD-IRONTRAIL",target:2},reward:[52,82],xp_reward:50,recommended_locations:["ASD-REDCLIFF","ASD2-WILD-IRONTRAIL"]}
  ].map(row=>Object.assign({time_limit_hours:72,base_time_limit_hours:72,completion_grace_hours:24,generator_validation:"接取前驗證目標地點存在、道路可達，並保留往返與安全緩衝。"},row));
  add("quest_templates",townQuests);

  const directQuestIds={
    "L-WILLOW":["Q-TOWN-WILLOW-BRIDGE"],"L-PINE":["Q-TOWN-PINE-MEADOW"],"L-LOVEN":["Q-TOWN-LOVEN-LEDGER"],"L-STONEFORD":["Q-TOWN-STONEFORD-QUARRY"],"L-GREENHARBOR":["Q-TOWN-GREENHARBOR-REED"],"L-SELENBURG":["Q-TOWN-SELENBURG-COURIER"],"ASD-RIVER":["Q-TOWN-ASDRIVER-SILTMARK"],"ASD-REDCLIFF":["Q-TOWN-REDCLIFF-CART"],
    "ASD-CAPITAL":["Q1582-ASD-OLDMINT-SEAL","Q1582-ASD-CROWNROOT-PERMIT"],"ASD-SILVER":["Q1582-ASD-REED-FISH","Q1582-ASD-GRAIN-WEIGHT"],"ASD-GRAYGATE":["Q1582-ASD-WOLFSHADOW"],"ASD-MISTPINE":["Q1582-ASD-FRONTIER-REFUGE"],"ASD-DAWNPORT":["Q1582-ASD-SUNKEN-CHAPEL"],"ASD2-IRONFORD":["Q1582-ASD-IRONFORD-WHEEL"],"ASD2-MOONMILL":["Q1582-ASD-MILL-GATE"],"ASD2-NORTHWATCH":["Q1582-ASD-FROSTLINE-SCOUT"],"ASD2-AMBERFIELD":["Q1582-ASD-AMBER-BEES"],"ASD2-SEABREAK":["Q1582-ASD-REEF-ROPE"],"L-WHITESTONE":["Q155-WHITESTONE-GRAIN","Q155-RIVER-WATCH"],"L-GREYPEAK":["Q155-GREYPEAK-GLOW"],"L-FR16-STONE-CIRCLE":["Q-REG16-GOAT-TRACK","Q-REG16-ANCESTOR-OUTER"],"L-FR16-WHITE-ANTLER":["Q-REG16-ICE-MINE-OUTER"]
  };
  const backgroundTowns=(DB.locations||[]).filter(row=>row.kind==="town"&&row.map_origin==="MAP-INFERENCE-1.0");
  const namedNpcIdsByTown={};
  for(const npc of DB.regional_npc_archetypes||[]){if(npc.location_id){(namedNpcIdsByTown[npc.location_id]??=[]).push(npc.id)}}
  for(const row of (DB.locations||[]).filter(item=>item.kind==="town")){
    const background=row.map_origin==="MAP-INFERENCE-1.0";
    const questIds=(directQuestIds[row.id]||[]).filter(id=>!!find("quest_templates",id));
    row.town_profile={revision:"TOWN-COMPLETENESS-1.0",content_status:background?"mapped_background":"playable_partial",service_scope:background?"地圖瀏覽與世界觀索引":"城鎮服務、道路整補與在地情報",npc_scope:background?"保留地方職能原型，待劇情開放後再轉為固定 NPC":"具名在地 NPC 與既有區域角色",quest_scope:background?"不產生可接取委託":"既有公會委託與本地委託均依資格提供",authority:row.local_authority||"地方行政與公開道路服務",economy:row.economy||["地方補給","公開道路服務"],route_summary:`已登錄 ${(row.links||[]).length} 條直接道路連結。`,npc_ids:namedNpcIdsByTown[row.id]||[],quest_ids:questIds};
  }
  DB.town_content_registry={version:"TOWN-COMPLETENESS-1.0",revision:"CURRENT-1.134.0",summary:{towns:(DB.locations||[]).filter(row=>row.kind==="town").length,playable:(DB.locations||[]).filter(row=>row.kind==="town"&&row.map_origin!=="MAP-INFERENCE-1.0").length,mapped_background:backgroundTowns.length,named_npcs:namedNpcs.length,direct_quests:townQuests.length},records:(DB.locations||[]).filter(row=>row.kind==="town").map(row=>({location_id:row.id,name:row.name,content_status:row.town_profile.content_status,world_region_id:row.world_region_id,political_entity_id:row.political_entity_id,province_region_id:row.province_region_id,settlement_region_id:row.settlement_region_id,npc_ids:row.town_profile.npc_ids,quest_ids:row.town_profile.quest_ids,integrity:{description:!!row.description,facilities:(row.facilities||[]).length,links:(row.links||[]).length}}))};
  DB.meta=DB.meta||{};
  DB.meta.town_completeness_revision="TOWN-COMPLETENESS-1.0";
})();
