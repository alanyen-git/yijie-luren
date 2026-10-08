(function(){
"use strict";
// 將既有世界誌已登錄、但尚未展開的主權政體轉成可瀏覽的五層地圖資料。
// 只補地圖索引與既有風格的背景節點；不建立跨國道路，也不自動開放旅行。
const DB=globalThis.DB;if(!DB)return;
const add=(key,rows)=>{DB[key]=Array.isArray(DB[key])?DB[key]:[];const ids=new Set(DB[key].map(x=>x.id));for(const row of rows)if(!ids.has(row.id)){DB[key].push(row);ids.add(row.id)}};
const find=(key,id)=>(DB[key]||[]).find(row=>row.id===id)||null;
const tierDown=t=>({S:"A",A:"B",B:"C",C:"D",D:"E",E:"F",F:"F"})[t]||"F";
const cleanId=id=>String(id).replace(/^POL-/,"").replace(/[^A-Z0-9]+/gi,"");

// A compact predecessor lived at the end of the political pack.  Replace only
// its generated background rows so this richer source remains authoritative.
const predecessor=(DB.province_region_maps||[]).filter(row=>String(row?.id||"").startsWith("PROV-MAP-"));
if(predecessor.length){
 const provinceIds=new Set(predecessor.map(row=>row.id));
 const locationIds=new Set(predecessor.flatMap(row=>row.all_location_ids||[]));
 DB.province_region_maps=(DB.province_region_maps||[]).filter(row=>!provinceIds.has(row.id));
 DB.settlement_region_maps=(DB.settlement_region_maps||[]).filter(row=>!provinceIds.has(row.parent_province_region_id));
 DB.locations=(DB.locations||[]).filter(row=>!locationIds.has(row.id));
 for(const realm of DB.realm_region_maps||[])realm.province_region_ids=(realm.province_region_ids||[]).filter(id=>!provinceIds.has(id));
}

const plans=[
 {polity:"POL-002",province:"黑鐵北階軍道區",admin:"帝國北階軍道區（行省級區域）",identity:"以軍團驛站、寒原補給與黑鐵關稅維持的高原軍道；地圖記錄為背景航路，未取得帝國通行文書不得進入。",capital:"鐵霜關",outpost:"冷鑿驛",wild:["寒脊軍道","玄鐵採石坡"],dungeons:["第七軍團舊堡","凍裂鑄坑"],roles:["軍道總督府與關稅哨","高原補給與騾隊換乘"],theme:"寒冷高原、軍道與鑄鐵遺構"},
 {polity:"POL-003",province:"聖冠谷地侯區",admin:"聖冠谷地侯區（行省級區域）",identity:"丘陵修院、封臣堡與加冕古道交錯的核心谷地；道路可供閱覽，實際入境仍由諸侯與修院關卡共同管制。",capital:"冠冕城",outpost:"鐘丘鎮",wild:["聖鈴丘路","葡園石階"],dungeons:["初冠修院地窖","失火旗堡下層"],roles:["諸侯議事與加冕儀典中心","修院農產與朝聖補給"],theme:"丘陵、修院、葡園與古堡"},
 {polity:"POL-004",province:"晨鐘聖道領",admin:"晨鐘聖道領（行省級區域）",identity:"教會田莊、朝聖道路與護教騎士駐屯構成的聖道領；本圖只標示公開道路與外環遺構，不推定教國內部禁區。",capital:"曙鐘城",outpost:"白穗集鎮",wild:["日昇聖道","金穗灌田"],dungeons:["巡禱石窖","靜誓墓廊"],roles:["大聖堂、巡禱與賑濟中樞","田莊集散與朝聖者留宿"],theme:"農田、聖道、鐘樓與神殿聚落"},
 {polity:"POL-005",province:"銀岸議院領",admin:"銀岸議院領（行省級區域）",identity:"由莊園家族共同出資維護海岸堤道與港稅的議院領；不以單一國王為中心，城鎮與莊園保有各自管轄。",capital:"銀楯港",outpost:"月葡鎮",wild:["白崖堤道","風蝕莊園坡"],dungeons:["潮井酒窖","鹽崖瞭望堡"],roles:["議院碼頭與海岸稅關","葡園、船料與莊園市集"],theme:"海岸丘陵、莊園、葡園與防潮堤"},
 {polity:"POL-006",province:"三橋河口同盟區",admin:"河口同盟共同管理區（行省級區域）",identity:"三座河橋與共同倉區由城邦代表輪值管理；地圖呈現共同防務與關稅道路，不把自治城市誤畫為封臣。",capital:"三橋市",outpost:"柳帆鎮",wild:["維爾舊河道","蘆堤渡灘"],dungeons:["河閘檢修廊","沉鐘倉庫"],roles:["同盟議亭、橋稅與船隊調度","河運轉泊與船匠補給"],theme:"河橋、倉區、港灣與密集城鎮"},
 {polity:"POL-007",province:"卡薩維爾河港自治區",admin:"自由都市河港自治區（行省級區域）",identity:"以河港工坊、公共倉與中立市法維持的都市外環；此圖僅納入可公開辨識的堤岸與地下水道。",capital:"卡薩維爾港城",outpost:"北堤工坊區",wild:["灰石河堤","船塢蘆灣"],dungeons:["舊關稅水道","沉錨倉窟"],roles:["自由都市議廳與主碼頭","船匠、運河工與貨棧"],theme:"大型河港、工坊、堤防與水道"},
 {polity:"POL-008",province:"金衡深港島區",admin:"深港群島共同港區（行省級區域）",identity:"深水港、海圖商館與島嶼燈塔組成的群島港區；商館影響外交，仍不得視為封建領主。",capital:"金衡深港",outpost:"星礁鎮",wild:["遠燈礁航道","鹹風島徑"],dungeons:["海圖庫暗室","潮室石門"],roles:["商館議所與深水泊位","燈塔補給與島嶼漁市"],theme:"群島、深水港、礁岸與燈塔"},
 {polity:"POL-009",province:"灰刃契約領",admin:"灰刃傭兵契約領（行省級區域）",identity:"訓練場、護衛契約與補給稅支撐的乾原都市圈；地圖標示公共道路，不代表任何傭兵團獲得主權。",capital:"灰刃城",outpost:"旗槍鎮",wild:["演武風原","枯渠驛道"],dungeons:["舊靶場地下庫","棄守哨壕"],roles:["契約登錄、傭兵訓練與仲裁","馬匹補給與護衛換班"],theme:"乾燥平原、訓練場、哨線與契約城市"},
 {polity:"POL-011",province:"藍塔湖原法區",admin:"湖原法術管轄區（行省級區域）",identity:"法師塔、湖泊測站與術式學院共同維護的高地法區；封鎖塔與危險實驗區不會被假定為可通行。",capital:"靛湖塔城",outpost:"鏡水學鎮",wild:["浮藍湖岸","雷紋高坡"],dungeons:["棄置觀測塔","回響蓄魔室"],roles:["術式登錄與高等學院","研究補給與湖畔學舍"],theme:"高地湖泊、法師塔、觀測站與雷紋岩"},
 {polity:"POL-012",province:"瑟露維亞林冠環域",admin:"林冠環域（行省級區域）",identity:"以林地記憶、長期盟約與季節巡護維持的森林環域；開放路徑僅限外圈，古樹深庭不因地圖存在而自動解鎖。",capital:"星葉庭",outpost:"露枝聚落",wild:["林冠月徑","琥珀根澤"],dungeons:["記憶樹根室","鹿角石門"],roles:["王庭外環與林約記錄","巡林者補給與種子交換"],theme:"古老森林、林冠聚落、根澤與月徑"},
 {polity:"POL-013",province:"石冠深廳領",admin:"石冠深廳氏族領（行省級區域）",identity:"祖墓、深廳與礦權由氏族議席分掌；地表山道與公開工坊可見，深層採掘區需氏族許可。",capital:"錘冠深廳",outpost:"赤砧礦鎮",wild:["花崗山肩道","鳴爐礦脈"],dungeons:["祖墓試煉廊","熄火升降井"],roles:["氏族議席、工坊與祖墓外環","礦材集散與升降井維修"],theme:"高山、深廳、礦脈、石橋與鍛爐"},
 {polity:"POL-014",province:"赤牙盟旗草場",admin:"盟旗草場（行省級區域）",identity:"血親、戰功與贈禮維持的聯盟草場；其中心是盟旗會面地，不把鬆散部族關係偽裝成固定官僚行省。",capital:"赤旗會地",outpost:"獵風營",wild:["野牛長草原","赤土丘獵徑"],dungeons:["先祖戰穴","斷矛石窟"],roles:["盟旗集會、贈禮與調解","狩獵補給與季節營地"],theme:"草原、低丘、獵徑與部族會地"},
 {polity:"POL-015",province:"風鬃夏牧環",admin:"夏牧水源環（行省級區域）",identity:"依季節河、水井與馬群遷徙排列的遊牧核心；地圖標示夏季可用牧路，非全年固定國界。",capital:"長鬃汗帳",outpost:"逐水營",wild:["風歌牧路","季河鹽灘"],dungeons:["埋沙行宮","失蹄石穴"],roles:["汗帳議事與水源裁決","馬群換牧與皮貨市集"],theme:"廣闊草原、季節河、牧路與遊牧營地"},
 {polity:"POL-019",province:"斷境斷道區",admin:"無主地斷道區（行省級區域）",identity:"廢堡、斷裂古道與臨時護送隊共存的無主邊地；此圖只建立資訊節點，不宣告任何王冠擁有主權。",capital:"斷橋集市",outpost:"灰烽前哨",wild:["碎碑古道","裂風荒坡"],dungeons:["無旗廢堡","坍封驛隧"],roles:["護送、賞金與補給交換地","前哨守望與失蹤者回報點"],theme:"荒野、廢堡、斷裂古道與臨時市集"},
 {polity:"POL-020",province:"黑月下層庭",admin:"黑月下層庭（地下城邦級區域）",identity:"由母系家門、法術商業與地下資源共同支撐的深層城邦；不把黑暗精靈文化預設為邪惡，也不自動開放家門內庭。",capital:"黑月穹庭",outpost:"紫晶階市",wild:["冷焰菌林","深井絲橋"],dungeons:["舊月礦廊","靜蛛祭庫"],roles:["家門議庭與地下貿易節點","晶礦市場與下層補給"],theme:"深層洞廳、晶礦、菌林、絲橋與家門城邦"}
];

const generated=[];
for(const plan of plans){
 const polity=find("political_entities",plan.polity),realm=find("realm_region_maps","RMAP-"+plan.polity);if(!polity||!realm)continue;
 realm.province_region_ids=Array.isArray(realm.province_region_ids)?realm.province_region_ids:[];
 // 已有行省的政體永遠不覆寫，讓後續手工擴寫優先於本推演包。
 if(realm.province_region_ids.length)continue;
 const key=cleanId(plan.polity),provinceId="PROV-MAP-"+key,capitalId="LOC-MAP-"+key+"-CAP",outpostId="LOC-MAP-"+key+"-OUT",wildAId="LOC-MAP-"+key+"-W1",wildBId="LOC-MAP-"+key+"-W2",dungeonAId="LOC-MAP-"+key+"-D1",dungeonBId="LOC-MAP-"+key+"-D2",localAId="SMAP-MAP-"+key+"-CORE",localBId="SMAP-MAP-"+key+"-OUTER";
 const high=polity.world_tier||"C",mid=tierDown(high),low=tierDown(mid),regionId=polity.core_region_id||null;
 const common={world_region_id:regionId,political_entity_id:plan.polity,province_region_id:provinceId,realm_region_map_id:realm.id,map_origin:"MAP-INFERENCE-1.0",travel_unlock:"unavailable_until_story_or_permit"};
 const town=(id,name,tier,size,role,links,region)=>({id,name,kind:"town",tier,settlement_world_tier:tier,size,region:plan.province,settlement_region_id:region,description:role+"。此地為已推演的背景地圖節點，尚未連接現有角色可達道路。",facilities:["guild","general","blacksmith","tavern","inn","church"],links,safety_score:tier===high?86:78,safety_label:tier===high?"有守備":"留意周邊",safety_rule:"僅在取得對應劇情、通行證或跨區旅行功能後開放實際到訪。",political_role:role,...common});
 const wild=(id,name,tier,role,links,region)=>({id,name,kind:"wild",tier,world_tier:tier,region:plan.province,settlement_region_id:region,description:role+"。道路與探索點僅供地圖瀏覽；不會因資料建檔而解鎖跨區旅行。",links,safety_score:tier===low?64:54,safety_label:"需結伴",safety_rule:"現階段沒有由既有可玩區自動通往此地的道路。",political_role:role,encounter_tags:[],encounter_profile:{zone:"future_region",archetype:"open_wild",space_class:"open",max_tier:tier},...common});
 const dungeon=(id,name,tier,role,links,region)=>({id,name,kind:"dungeon",tier,world_tier:tier,region:plan.province,settlement_region_id:region,description:role+"。僅建立位置、道路與探索範圍索引；不假定已對玩家開放。",links,safety_score:38,safety_label:"限制進入",safety_rule:"需要地方許可、任務或後續跨區內容才能進入。",political_role:role,encounter_tags:[],encounter_profile:{zone:"future_region",archetype:"artificial_ruin",space_class:"standard",max_tier:tier,allow_magical_ecology:true},persistent:true,resource_reset:false,explore:[["外環入口",30],["道路標記",25],["封存側室",20],["未開放深處",15],["撤離節點",10]],...common});
 const capLinks=[{to:outpostId,hours:4.2},{to:wildAId,hours:1.6}],outLinks=[{to:capitalId,hours:4.2},{to:wildBId,hours:1.8}],wildALinks=[{to:capitalId,hours:1.6},{to:wildBId,hours:3.1},{to:dungeonAId,hours:.8}],wildBLinks=[{to:outpostId,hours:1.8},{to:wildAId,hours:3.1},{to:dungeonBId,hours:.9}],dungeonALinks=[{to:wildAId,hours:.8}],dungeonBLinks=[{to:wildBId,hours:.9}];
 add("province_region_maps",[{id:provinceId,layer:"province_region",name:plan.province,display_name:polity.name+"・"+plan.province,administrative_type:plan.admin,parent_realm_map_id:realm.id,political_entity_id:plan.polity,world_region_id:regionId,world_tier:high,map_status:"mapped_background",capital_location_id:capitalId,upper_level_city_id:null,peer_city_ids:[outpostId],subordinate_settlement_ids:[],wild_location_ids:[wildAId,wildBId],dungeon_location_ids:[dungeonAId,dungeonBId],all_settlement_ids:[capitalId,outpostId],identity:plan.identity,governance_chain:[polity.government_type||"地方治理","公開地圖節點","地方聚落或駐點"],economy:[plan.theme,"地方補給","公開道路服務"],major_routes:[plan.capital+"—"+plan.wild[0],plan.outpost+"—"+plan.wild[1],plan.wild[0]+"—"+plan.wild[1]],recurring_risks:["通行許可限制","區域天候與地形","尚未建立的跨區旅行規則"],all_location_ids:[capitalId,outpostId,wildAId,wildBId,dungeonAId,dungeonBId],access_policy:"僅供世界地圖下鑽瀏覽；不建立跨國移動或自動解鎖。"}]);
 add("settlement_region_maps",[{id:localAId,name:plan.capital+"當地區域",parent_province_region_id:provinceId,center_location_id:capitalId,world_tier:high,map_status:"mapped_background",location_ids:[capitalId,wildAId,dungeonAId],role:plan.roles[0]},{id:localBId,name:plan.outpost+"當地區域",parent_province_region_id:provinceId,center_location_id:outpostId,world_tier:mid,map_status:"mapped_background",location_ids:[outpostId,wildBId,dungeonBId],role:plan.roles[1]}]);
 add("locations",[town(capitalId,plan.capital,high,"政體核心城市",plan.roles[0],capLinks,localAId),town(outpostId,plan.outpost,mid,"區域駐點",plan.roles[1],outLinks,localBId),wild(wildAId,plan.wild[0],mid,plan.theme,wildALinks,localAId),wild(wildBId,plan.wild[1],low,plan.theme,wildBLinks,localBId),dungeon(dungeonAId,plan.dungeons[0],mid,"公開記錄的邊緣遺構",dungeonALinks,localAId),dungeon(dungeonBId,plan.dungeons[1],high,"需要後續內容驗證的深層遺構",dungeonBLinks,localBId)]);
 realm.province_region_ids.push(provinceId);realm.map_status="mapped_background";realm.map_content_note="已建立可瀏覽的行省、當地區域與節點地圖；跨區旅行仍需後續明確解鎖。";
 generated.push({polity_id:plan.polity,realm_map_id:realm.id,province_region_id:provinceId,settlement_region_ids:[localAId,localBId],location_ids:[capitalId,outpostId,wildAId,wildBId,dungeonAId,dungeonBId]});
}

DB.map_inference_registry={version:"MAP-INFERENCE-1.0",generated,policy:"背景地圖可完整下鑽瀏覽，但不創造跨區旅行、通行權或遭遇解鎖。",coverage:{world:"既有世界地圖沿用",realm:"既有主權政體區域圖補齊行省入口",province:"每個新建政體一個可瀏覽行省",local:"每個新建行省兩個當地區域",nodes_per_province:{town:2,wild:2,dungeon:2}}};
DB.meta=DB.meta||{};DB.meta.map_inference_revision="MAP-INFERENCE-1.0";
})();
