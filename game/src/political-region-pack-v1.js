/* 異界旅人｜霜角酋邦核心區域內容包 v1.0
 * 只在新 App 的記憶體資料層追加資料，不修改來源資料庫與既有存檔。
 */
(()=>{
"use strict";
if(typeof DB!=="object"||!DB)return;
const add=(key,rows)=>{
 DB[key]=Array.isArray(DB[key])?DB[key]:[];
 const ids=new Set(DB[key].map(x=>x&&x.id).filter(Boolean));
 for(const row of rows)if(row&&row.id&&!ids.has(row.id)){DB[key].push(row);ids.add(row.id)}
};
const addDialogue=rows=>{
 DB.dialogue_database=DB.dialogue_database&&typeof DB.dialogue_database==="object"?DB.dialogue_database:{};
 DB.dialogue_database.records=Array.isArray(DB.dialogue_database.records)?DB.dialogue_database.records:[];
 const ids=new Set(DB.dialogue_database.records.map(x=>x&&x.id).filter(Boolean));
 for(const row of rows)if(row&&row.id&&!ids.has(row.id)){DB.dialogue_database.records.push(row);ids.add(row.id)}
};
const polity=(DB.political_entities||[]).find(x=>x.id==="POL-016");
const core=(DB.world_regions||[]).find(x=>x.id==="REG-16");
const realm=(DB.realm_region_maps||[]).find(x=>x.id==="RMAP-POL-016");
if(!polity||!core||!realm||polity.core_region_id!=="REG-16"||realm.political_entity_id!=="POL-016")return;
const provinceId="PROV-016-FROST-VALLEY";
const mapId="RMAP-POL-016";
const capitalId="L-FR16-STONE-CIRCLE";
const hamletId="L-FR16-WHITE-ANTLER";
const goatId="L-FR16-SNOW-GRAZING-ROAD";
const passId="L-FR16-WIND-PASS";
const hallId="D-FR16-ANCESTOR-HALL";
const mineId="D-FR16-ICE-VEIN-MINE";
realm.province_region_ids=Array.isArray(realm.province_region_ids)?realm.province_region_ids:[];
if(!realm.province_region_ids.includes(provinceId))realm.province_region_ids.push(provinceId);
realm.map_status="playable_partial";
realm.notes=(realm.notes||"")+" 首批可玩區域僅涵蓋既有 REG-16 霜角高地，不宣稱完成整個酋邦。";
core.province_region_id=provinceId;
core.map_status="playable_partial";
core.map_content_note="依既有霜角高地核心區推演的首批可玩區域；未擴張至其他未知領地。";

add("province_region_maps",[
 {id:provinceId,layer:"province_region",name:"霜角高地會盟領",display_name:"霜角酋邦・霜角高地會盟領",administrative_type:"酋邦核心會盟領（行省級區域）",parent_realm_map_id:mapId,political_entity_id:"POL-016",world_region_id:"REG-16",world_tier:"D",map_status:"playable_partial",capital_location_id:capitalId,upper_level_city_id:null,peer_city_ids:[],subordinate_settlement_ids:[hamletId],wild_location_ids:[goatId,passId],dungeon_location_ids:[hallId,mineId],all_settlement_ids:[capitalId,hamletId],history_event_ids:["HIST-035","HIST-077"],identity:"沿用既有霜角高地核心地理區，首批開放石圈會盟核心、越冬村寨、牧道與兩處可探索地城；其餘山谷仍待後續資料展開。",governance_chain:["首席酋長與石圈會盟","谷地部族酋長","村寨長與巡徑人"],economy:["山羊與皮革","石材","鐵礦","越冬糧倉","山道護運"],major_routes:["霜角石圈—白角溪寨","石圈牧道—裂風隘口","祖靈石環下層—霜角石圈","冰脈舊礦—裂風隘口"],recurring_risks:["早雪封路","山崩","牧群走失","冰窟塌陷"],lore_record_ids:["LORE-0372"],all_location_ids:[capitalId,hamletId,goatId,passId,hallId,mineId]}
]);
add("settlement_region_maps",[
 {id:"SMAP-FR16-STONE-CIRCLE",name:"霜角石圈聚落區",parent_province_region_id:provinceId,center_location_id:capitalId,world_tier:"D",map_status:"playable_partial",location_ids:[capitalId,goatId,hallId],role:"首席酋長會盟、越冬倉儲與祖靈祭儀中心"},
 {id:"SMAP-FR16-WHITE-ANTLER",name:"白角溪寨聚落區",parent_province_region_id:provinceId,center_location_id:hamletId,world_tier:"F",map_status:"playable_partial",location_ids:[hamletId,passId,mineId],role:"牧群轉場、溪谷採集與山道補給"}
]);
add("locations",[
 {id:capitalId,name:"霜角石圈",kind:"town",tier:"D",settlement_world_tier:"D",size:"部族會盟聚落",region:"霜角高地",world_region_id:"REG-16",political_entity_id:"POL-016",culture_id:"CUL-016",province_region_id:provinceId,realm_region_map_id:mapId,settlement_region_id:"SMAP-FR16-STONE-CIRCLE",political_role:"首席酋長會盟核心",description:"由環形石柱、公共火塘與越冬糧倉構成的高地會盟聚落。各谷地酋長在此議定牧道、儲糧與共同守備，旅人可在公開區域交易與申請引路。",facilities:["guild","general","tavern","inn","church"],links:[{to:hamletId,hours:3.2},{to:goatId,hours:1.0},{to:hallId,hours:0.6}],safety_score:82,safety_label:"有守備",safety_rule:"會盟日有巡守值勤；離開聚落後仍受高地天候與野外遭遇規則影響。",local_authority:{title:"石圈會盟記錄者",rank_level:4,authority_tier:"AUTH-4",polity_id:"POL-016"},history_scope:"霜角酋邦／霜角高地",lore_record_ids:["LORE-0372"]},
 {id:hamletId,name:"白角溪寨",kind:"town",tier:"F",settlement_world_tier:"F",size:"山谷村寨",region:"霜角高地",world_region_id:"REG-16",political_entity_id:"POL-016",culture_id:"CUL-016",province_region_id:provinceId,realm_region_map_id:mapId,settlement_region_id:"SMAP-FR16-WHITE-ANTLER",political_role:"地方聚落",description:"溪谷旁的季節性村寨，兼作羊群轉場休息點與冬糧分配站。積雪封路前，村民會把可保存肉品與木柴送往高處倉窖。",facilities:["guild","general","tavern","inn","church"],links:[{to:capitalId,hours:3.2},{to:passId,hours:2.4},{to:mineId,hours:3.5}],safety_score:76,safety_label:"留意天候",safety_rule:"村寨有夜間守望；暴雪或融雪季節會降低外出安全。",local_authority:{title:"白角溪寨長",rank_level:3,authority_tier:"AUTH-3",polity_id:"POL-016"},history_scope:"霜角酋邦／霜角高地",lore_record_ids:["LORE-0372"]},
 {id:goatId,name:"雪羊牧道",kind:"wild",tier:"F",world_tier:"F",region:"霜角高地",world_region_id:"REG-16",political_entity_id:"POL-016",culture_id:"CUL-016",province_region_id:provinceId,realm_region_map_id:mapId,settlement_region_id:"SMAP-FR16-STONE-CIRCLE",political_role:"季節牧道",description:"連接石圈與高坡牧場的緩坡道路。牧人沿途留下風向結繩與飲水石槽，冬季前仍有走失羊群與掠食者活動。",links:[{to:capitalId,hours:1.0},{to:passId,hours:2.0},{to:hallId,hours:1.4}],safety_score:62,safety_label:"需結伴",safety_rule:"高地風雪可能改變可通行時段。",encounter_tags:["frost_highland","snowfield","mountain_pass"],encounter_profile:{zone:"frontier",archetype:"open_wild",space_class:"open",max_tier:"D"}},
 {id:passId,name:"裂風隘口",kind:"wild",tier:"E",world_tier:"E",region:"霜角高地",world_region_id:"REG-16",political_entity_id:"POL-016",culture_id:"CUL-016",province_region_id:provinceId,realm_region_map_id:mapId,settlement_region_id:"SMAP-FR16-WHITE-ANTLER",political_role:"山道關口",description:"兩道黑岩脊之間的狹窄山口，風切聲會蓋過遠處落石。巡徑人以白角標記安全落腳處，融雪期需繞行東側舊道。",links:[{to:hamletId,hours:2.4},{to:goatId,hours:2.0},{to:mineId,hours:1.1}],safety_score:48,safety_label:"危險",safety_rule:"強風、落石與低能見度會提高野外遭遇風險。",encounter_tags:["frost_highland","snowfield","mountain_pass"],encounter_profile:{zone:"deep_wild",archetype:"mountain_pass",space_class:"open",max_tier:"E"}},
 {id:hallId,name:"祖靈石環下層",kind:"dungeon",tier:"D",world_tier:"D",region:"霜角高地",world_region_id:"REG-16",political_entity_id:"POL-016",culture_id:"CUL-016",province_region_id:provinceId,realm_region_map_id:mapId,settlement_region_id:"SMAP-FR16-STONE-CIRCLE",political_role:"受祭司監看的古代地城",description:"石圈下方的舊式蓄藏與祭儀空間，部分門楣刻痕早於現任氏族盟約。祭司允許有委託的冒險者調查外環，內室仍封存。",links:[{to:capitalId,hours:0.6},{to:goatId,hours:1.4}],safety_score:42,safety_label:"封鎖外環",safety_rule:"需依委託範圍探索；未開放內室不會被當成可通行區域。",encounter_tags:["ancestral_hall"],encounter_profile:{zone:"dungeon",archetype:"shrine_ruin",space_class:"standard",max_tier:"D",allow_magical_ecology:true},persistent:true,resource_reset:false,explore:[["祭火外環",25],["先祖銘石廊",25],["越冬儲藏室",20],["封存門廳",20],["通風豎井",10]]},
 {id:mineId,name:"冰脈舊礦",kind:"dungeon",tier:"E",world_tier:"E",region:"霜角高地",world_region_id:"REG-16",political_entity_id:"POL-016",culture_id:"CUL-016",province_region_id:provinceId,realm_region_map_id:mapId,settlement_region_id:"SMAP-FR16-WHITE-ANTLER",political_role:"停採礦窟",description:"白角溪寨早年開掘的淺層鐵礦，寒季冰層會擠壓支柱。酋邦只允許清點外層礦架與尋回工具，不准深入未支撐的深井。",links:[{to:hamletId,hours:3.5},{to:passId,hours:1.1}],safety_score:50,safety_label:"需許可",safety_rule:"井道支撐不穩，依委託指定範圍調查。",encounter_tags:["frost_mine"],encounter_profile:{zone:"dungeon",archetype:"mine",space_class:"standard",max_tier:"E",allow_magical_ecology:true},persistent:true,resource_reset:false,explore:[["外層礦架",30],["冰封排水槽",25],["支柱檢查點",20],["舊工具間",15],["封閉深井口",10]]}
]);
add("regional_npc_archetypes",[
 {id:"NPC-REG16-001",region_id:"REG-16",polity_id:"POL-016",culture_id:"CUL-016",location_id:capitalId,role:"石圈會盟記錄者",facility_affinity:"guild",social_layer:"地方權力",knowledge_scope:"公開會盟決議、牧道與越冬倉儲",quest_domains:["巡查","護運","地方事件"],combat_tier_ceiling:"D",naming_rule:"依CUL-016文化命名規則生成；此資料是人物原型，不是固定姓名。",historical_context_ids:["HIST-035","HIST-077"],description:"只把經各谷地酋長確認的路線、倉儲與會盟決議列為正式紀錄。"},
 {id:"NPC-REG16-002",region_id:"REG-16",polity_id:"POL-016",culture_id:"CUL-016",location_id:capitalId,role:"越冬糧倉守人",facility_affinity:"general",social_layer:"聚落居民",knowledge_scope:"糧倉輪替、肉品保存與冬季補給",quest_domains:["採集","護運","生活事件"],combat_tier_ceiling:"F",naming_rule:"依CUL-016文化命名規則生成；此資料是人物原型，不是固定姓名。",historical_context_ids:["HIST-035"],description:"以家戶輪值看守公共糧倉，會核對封條與領取紀錄。"},
 {id:"NPC-REG16-003",region_id:"REG-16",polity_id:"POL-016",culture_id:"CUL-016",location_id:hamletId,role:"白角溪寨巡徑人",facility_affinity:"guild",social_layer:"地方守備",knowledge_scope:"雪羊牧道、裂風隘口與季節通行",quest_domains:["偵察","巡查","護送"],combat_tier_ceiling:"E",naming_rule:"依CUL-016文化命名規則生成；此資料是人物原型，不是固定姓名。",historical_context_ids:["HIST-077"],description:"依風向旗與融雪刻痕更新山路狀況，不會把封閉路段說成安全捷徑。"},
 {id:"NPC-REG16-004",region_id:"REG-16",polity_id:"POL-016",culture_id:"CUL-016",location_id:capitalId,role:"祖靈祭司",facility_affinity:"church",social_layer:"宗教職務",knowledge_scope:"公開祭儀規則、石環外廊與祭火守護",quest_domains:["地城調查","地方歷史","封存區安全"],combat_tier_ceiling:"C",naming_rule:"依CUL-016文化命名規則生成；此資料是人物原型，不是固定姓名。",historical_context_ids:["HIST-035"],description:"只解說公開祭儀與外環禁制；不會憑空揭露未記錄的古代真相。"}
]);
addDialogue([
 {id:"DIA-REG16-001",speaker_id:"NPC-REG16-001",topic:"石圈會盟",text:"各谷的路況先由巡徑人核對，再交會盟記錄；沒有確認的消息只會列作傳聞。"},
 {id:"DIA-REG16-002",speaker_id:"NPC-REG16-002",topic:"越冬糧倉",text:"每一袋糧都記著輪值家戶。少了封條，冬天就有人得少吃一餐。"},
 {id:"DIA-REG16-003",speaker_id:"NPC-REG16-003",topic:"裂風隘口",text:"白角旗翻向山內時不要上隘口。風會把你的聲音和腳印一起帶走。"},
 {id:"DIA-REG16-004",speaker_id:"NPC-REG16-004",topic:"祖靈石環",text:"外環可以依委託調查，封存門後的事不在我能公開解說的範圍。"}
]);
add("monsters",[
 {id:"MON-REG16-001",name:"雪角野山羊",tier:"F",category:"野獸動物系",encounter_enabled:true,lore_role:"一般",habitats:["frost_highland","snowfield","mountain_pass"],hp:30,attack:8,defense:4,accuracy:66,evasion:12,damage:[2,5],xp_reward:5,encounter_weight:5,near_town_eligible:true,ecology_profile:{body_scale:"medium",tags:["wildlife"],habitat_source:"REG-16"},loot_materials:[],loot_profile:{version:"LOOT-ECOLOGY-1.0",allowed_material_ids:[],fallback_policy:"none",rule:"此野生動物可不掉落素材。"}},
 {id:"MON-REG16-002",name:"裂風雪爪狼",tier:"E",category:"野獸動物系",encounter_enabled:true,lore_role:"一般",habitats:["frost_highland","snowfield","mountain_pass"],hp:54,attack:16,defense:8,accuracy:70,evasion:18,damage:[5,10],xp_reward:13,encounter_weight:4,near_town_eligible:false,ecology_profile:{body_scale:"medium",tags:["wildlife"],habitat_source:"REG-16"},loot_materials:[],loot_profile:{version:"LOOT-ECOLOGY-1.0",allowed_material_ids:[],fallback_policy:"none",rule:"此野生動物可不掉落素材。"}},
 {id:"MON-REG16-003",name:"石環守夜像",tier:"D",category:"元素植物魔法生物系",encounter_enabled:true,lore_role:"一般",habitats:["ancestral_hall"],hp:92,attack:25,defense:18,accuracy:72,evasion:5,damage:[8,14],element:"地",xp_reward:28,encounter_weight:3,near_town_eligible:false,ecology_profile:{body_scale:"medium",tags:["construct","magical"],habitat_source:"REG-16"},loot_materials:[],loot_profile:{version:"LOOT-ECOLOGY-1.0",allowed_material_ids:[],fallback_policy:"none",rule:"此守護構裝體不配置素材掉落。"}},
 {id:"MON-REG16-004",name:"冰脈晶蠹",tier:"E",category:"野獸動物系",encounter_enabled:true,lore_role:"一般",habitats:["frost_mine"],hp:48,attack:14,defense:9,accuracy:68,evasion:8,damage:[4,8],xp_reward:11,encounter_weight:5,near_town_eligible:false,ecology_profile:{body_scale:"small",tags:["invertebrate","small_intruder"],habitat_source:"REG-16"},loot_materials:[],loot_profile:{version:"LOOT-ECOLOGY-1.0",allowed_material_ids:[],fallback_policy:"none",rule:"此穴居小型生物不配置素材掉落。"}}
]);
add("quest_templates",[
 {id:"Q-REG16-GOAT-TRACK",name:"雪羊牧道巡查",tier:"F",min_level:1,max_level:8,type:"巡查",description:"確認雪羊牧道三處風向結繩仍可辨識，並回報是否有掠食者足跡。",objective:{kind:"patrol",location_id:goatId,target:2,checkpoints:["南坡飲水石","石柱風向結","北側緩坡"]},reward:[12,22],xp_reward:14,time_limit_hours:48,base_time_limit_hours:48,target_spawn_boost:0,completion_grace_hours:24,recommended_locations:[goatId],region_id:"REG-16"},
 {id:"Q-REG16-ICE-MINE-OUTER",name:"冰脈舊礦支柱清點",tier:"E",min_level:4,max_level:13,type:"偵察",description:"只清點冰脈舊礦外層支柱與工具架，不得進入封閉深井。",objective:{kind:"action",action:"探索",location_id:mineId,target:2},reward:[25,42],xp_reward:30,time_limit_hours:72,base_time_limit_hours:72,target_spawn_boost:0,completion_grace_hours:24,recommended_locations:[mineId],region_id:"REG-16"},
 {id:"Q-REG16-ANCESTOR-OUTER",name:"祖靈石環外廊記錄",tier:"D",min_level:8,max_level:20,type:"偵察",description:"受祭司委託記錄祖靈石環下層外環刻痕，不得嘗試開啟封存門。",objective:{kind:"action",action:"探索",location_id:hallId,target:2},reward:[42,68],xp_reward:55,time_limit_hours:96,base_time_limit_hours:96,target_spawn_boost:0,completion_grace_hours:24,recommended_locations:[hallId],region_id:"REG-16"}
]);
add("adventure_event_templates",[
 {id:"AE-REG16-WIND-KNOT",name:"斷落的風向結繩",tier:"F",kinds:["wild"],zones:["frontier"],location_ids:[goatId,passId],stat:"感知",dc:10,text:"牧道風向繩被扯落，遠處雪線已開始模糊。",success:"你依石刻重新固定繩結，並將風勢變化記入巡徑牌。",fail:"強風讓繩結再次鬆脫，你留下醒目的臨時警示。",reward:{money:[3,6],event_clock:1},failure:{fatigue:2}},
 {id:"AE-REG16-STORE-SEAL",name:"越冬倉封條錯位",tier:"F",kinds:["town"],zones:["town_outskirts"],location_ids:[capitalId,hamletId],stat:"智力",dc:10,text:"糧倉封條的結法與輪值紀錄不一致，守倉人請你協助核對。",success:"你找出交班時漏記的封條號碼，糧食數量沒有短少。",fail:"記錄仍有缺頁，會盟安排兩人重新盤點。",reward:{money:[2,5],reputation:1},failure:{fatigue:1}}
]);
DB.meta=DB.meta||{};
DB.meta.political_region_revision="FROSTHORN-REGION-PACK-1.0";
})();