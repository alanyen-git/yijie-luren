/* 異界旅人：阿斯戴爾王國內容深化第二階段 CURRENT-1.58.0
 * 載入順序：game-data.js -> data-patches.js -> asdail-depth-v2.js -> runtime.js
 * 原則：只做相容性追加；B級內容維持資格／前置門檻，不修改角色初始值、戰鬥公式與存檔schema。
 */
(()=>{
  if(typeof DB!=="object"||!DB)return;
  const add=(key,rows)=>{
    DB[key]=Array.isArray(DB[key])?DB[key]:[];
    const ids=new Set(DB[key].map(x=>x&&x.id).filter(Boolean));
    for(const row of rows){if(row&&row.id&&!ids.has(row.id)){DB[key].push(row);ids.add(row.id)}}
  };

  add("capital_districts",[
    {id:"ASD2-DIST-CROWN",capital_id:"ASD-CAPITAL",name:"王冠宮城區",tier:"B",description:"王宮外廷、皇家檔案庫與受限內廷入口所在。一般冒險者只能進入外廷與公開檔案室。",facilities:["王宮外廷","皇家檔案室","使節等候廳"]},
    {id:"ASD2-DIST-WHITETOWER",capital_id:"ASD-CAPITAL",name:"白塔法庭區",tier:"B",description:"王國高等法庭、教會仲裁所與公證人集中區。",facilities:["白塔法庭","教會仲裁所","公證人會館"]},
    {id:"ASD2-DIST-GUILDS",capital_id:"ASD-CAPITAL",name:"百工行會區",tier:"C",description:"鍛造、煉金、裁縫、木工與冒險者公會總會所在的工作區。",facilities:["冒險者公會總會","王家鍛造院外坊","煉金師行會","工匠市場"]},
    {id:"ASD2-DIST-RIVER",capital_id:"ASD-CAPITAL",name:"王都河港區",tier:"C",description:"糧船、木材與東境礦材進入王都的主要碼頭。",facilities:["河港","倉庫群","稅關","船匠棚"]},
    {id:"ASD2-DIST-OLDWALL",capital_id:"ASD-CAPITAL",name:"舊城牆區",tier:"D",description:"王國早期城牆與地下排水網交疊，老兵、廉價旅店與修繕工坊集中。",facilities:["舊城門","修繕工坊","平價旅店"]},
    {id:"ASD2-DIST-SOUTHMARKET",capital_id:"ASD-CAPITAL",name:"南市民街",tier:"D",description:"平民市場、車行、麵包坊與低階委託最密集的街區。",facilities:["南市集","車馬行","平民救助所"]}
  ]);

  add("settlement_region_maps",[
    {id:"SET-ASD2-IRONFORD",province_id:"PROV-ASD-EAST",location_id:"ASD2-IRONFORD",name:"鐵渡鎮",world_tier:"E",settlement_tier:"E"},
    {id:"SET-ASD2-MOONMILL",province_id:"PROV-ASD-RIVER",location_id:"ASD2-MOONMILL",name:"月磨鎮",world_tier:"D",settlement_tier:"D"},
    {id:"SET-ASD2-NORTHWATCH",province_id:"PROV-ASD-NORTH",location_id:"ASD2-NORTHWATCH",name:"北望堡鎮",world_tier:"C",settlement_tier:"C"},
    {id:"SET-ASD2-AMBERFIELD",province_id:"PROV-ASD-CROWN",location_id:"ASD2-AMBERFIELD",name:"琥珀田鎮",world_tier:"E",settlement_tier:"E"},
    {id:"SET-ASD2-SEABREAK",province_id:"PROV-ASD-EAST",location_id:"ASD2-SEABREAK",name:"碎浪鎮",world_tier:"D",settlement_tier:"D"}
  ]);

  add("locations",[
    {id:"ASD2-IRONFORD",name:"鐵渡鎮",kind:"town",tier:"E",world_tier:"E",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",description:"赤岩礦路與淺河渡口交會的小鎮，以騾隊、修車匠與低階礦材交易維生。",encounter_profile:{zone:"trade_ford",danger:"E",allowed_tiers:["F","E","D"]},facilities:["渡口","修車工坊","小型公會櫃檯","礦材市集"],travel_time_hours:9},
    {id:"ASD2-MOONMILL",name:"月磨鎮",kind:"town",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-RIVER",description:"三座大型水磨與灌溉渠支撐周邊農村，是銀穗城的穀粉加工中心。",encounter_profile:{zone:"river_mill",danger:"D",allowed_tiers:["F","E","D"]},facilities:["水磨群","糧倉","渠務所","冒險者公會辦事處"],travel_time_hours:7},
    {id:"ASD2-NORTHWATCH",name:"北望堡鎮",kind:"town",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-NORTH",description:"灰門以北的軍民混合堡鎮，負責冬季烽火、山口難民安置與獵團整補。",encounter_profile:{zone:"frontier_fort",danger:"C",allowed_tiers:["E","D","C"]},facilities:["北望堡","烽火臺","傷兵救護所","獵團交易場"],travel_time_hours:11},
    {id:"ASD2-AMBERFIELD",name:"琥珀田鎮",kind:"town",tier:"E",world_tier:"E",region_id:"REG-ASD-01",province_id:"PROV-ASD-CROWN",description:"王都南方的蜂蜜、亞麻與乳酪產地，受王都市場價格波動影響明顯。",encounter_profile:{zone:"farmland",danger:"E",allowed_tiers:["F","E","D"]},facilities:["蜂農會館","亞麻倉","小教會","驛站"],travel_time_hours:6},
    {id:"ASD2-SEABREAK",name:"碎浪鎮",kind:"town",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",description:"黎明港北方的礁岸鎮，專做鹽、乾魚、繩索與救難器具。",encounter_profile:{zone:"rocky_coast",danger:"D",allowed_tiers:["E","D","C"]},facilities:["鹽場","救難隊","繩索工坊","海岸教堂"],travel_time_hours:8},

    {id:"ASD2-WILD-AMBERFIELDS",name:"琥珀田野",kind:"wild",tier:"F",world_tier:"F",region_id:"REG-ASD-01",province_id:"PROV-ASD-CROWN",parent_id:"ASD2-AMBERFIELD",description:"蜂箱、亞麻田與牧草地相間的安全農野；野兔與幼年山羊屬低威脅，但黃昏仍可能有掠食獸。",encounter_profile:{zone:"farmland",danger:"F",allowed_tiers:["F","E"]},travel_time_hours:3},
    {id:"ASD2-WILD-MILLCHANNEL",name:"月磨灌渠",kind:"wild",tier:"E",world_tier:"E",region_id:"REG-ASD-01",province_id:"PROV-ASD-RIVER",parent_id:"ASD2-MOONMILL",description:"水磨與田區之間的灌溉渠網，雨季會有水獸與崩岸。",encounter_profile:{zone:"canal",danger:"E",allowed_tiers:["F","E","D"]},travel_time_hours:3},
    {id:"ASD2-WILD-REEDBANK",name:"青蘆河岸",kind:"wild",tier:"E",world_tier:"E",region_id:"REG-ASD-01",province_id:"PROV-ASD-RIVER",parent_id:"ASD-SILVER",description:"銀穗城下游的蘆葦河岸，適合採藥、捕魚與護送，但泥灘會限制移動。",encounter_profile:{zone:"riverbank",danger:"E",allowed_tiers:["F","E","D"]},travel_time_hours:4},
    {id:"ASD2-WILD-IRONTRAIL",name:"赤鐵商道",kind:"wild",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",parent_id:"ASD2-IRONFORD",description:"連結鐵渡與赤岩的重車商道，坡陡、礦塵重，盜匪與大型獸類會鎖定落單車隊。",encounter_profile:{zone:"ore_road",danger:"D",allowed_tiers:["E","D","C"]},travel_time_hours:6},
    {id:"ASD2-WILD-BASALTHOLLOW",name:"玄武岩凹地",kind:"wild",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",parent_id:"ASD-REDCLIFF",description:"古老熔岩冷卻形成的凹地，夜間會積聚火、地元素魔力。",encounter_profile:{zone:"basalt_hollow",danger:"C",allowed_tiers:["D","C"]},travel_time_hours:8},
    {id:"ASD2-WILD-FROSTLINE",name:"霜線高徑",kind:"wild",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-NORTH",parent_id:"ASD2-NORTHWATCH",description:"高於樹線的軍用舊徑，風雪、冰層與大型魔物使其成為北境重要警戒帶。",encounter_profile:{zone:"frost_ridge",danger:"C",allowed_tiers:["D","C"]},travel_time_hours:9},
    {id:"ASD2-WILD-WOLFSHADOW",name:"狼影松谷",kind:"wild",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-NORTH",parent_id:"ASD-GRAYGATE",description:"灰門東北的狹谷，成年狼群、座狼與獵團路線重疊，低階角色不可單獨深入。",encounter_profile:{zone:"pine_valley",danger:"D",allowed_tiers:["E","D","C"]},travel_time_hours:6},
    {id:"ASD2-WILD-SEABREAKREEF",name:"碎浪外礁",kind:"wild",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",parent_id:"ASD2-SEABREAK",description:"潮差大、礁縫密集的救難區，海獸與失事貨物常同時出現。",encounter_profile:{zone:"reef",danger:"D",allowed_tiers:["E","D","C"]},travel_time_hours:4},
    {id:"ASD2-WILD-CROWNFALLOW",name:"王家休耕地",kind:"wild",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-CROWN",parent_id:"ASD-CAPITAL",description:"王都北西方輪作休耕地，戰時可改作軍馬牧場；地下有零散古道基礎。",encounter_profile:{zone:"fallow",danger:"D",allowed_tiers:["F","E","D"]},travel_time_hours:5},
    {id:"ASD2-WILD-NIGHTMARSH",name:"夜鏡沼",kind:"wild",tier:"B",world_tier:"B",region_id:"REG-ASD-01",province_id:"PROV-ASD-RIVER",parent_id:"ASD-SILVER",description:"銀穗濕地最深處的封鎖沼澤，水面會反射不對應天空的光；需公會C級資格與糧議會許可。",encounter_profile:{zone:"mirror_marsh",danger:"B",allowed_tiers:["C","B"]},travel_time_hours:12},

    {id:"ASD2-DUNGEON-OLDMINT",name:"王都舊鑄幣所地窖",kind:"dungeon",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-CROWN",parent_id:"ASD-CAPITAL",description:"停止使用多年的鑄幣所地下儲庫，仍有公證封條、舊秤與部分坍塌通道。",encounter_profile:{zone:"old_mint",danger:"D",allowed_tiers:["E","D"]},persistent:true,resource_reset:false},
    {id:"ASD2-DUNGEON-MILLVAULT",name:"月磨沉水庫",kind:"dungeon",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-RIVER",parent_id:"ASD2-MOONMILL",description:"舊水磨下方的沉水倉與維修道，需關閉部分水閘才能進入。",encounter_profile:{zone:"flooded_store",danger:"D",allowed_tiers:["E","D"]},persistent:true,resource_reset:false},
    {id:"ASD2-DUNGEON-BASALTVAULT",name:"玄武岩熔脈廳",kind:"dungeon",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",parent_id:"ASD2-WILD-BASALTHOLLOW",description:"岩層裂隙形成的天然熔脈廳，具高熱、落石與火元素聚集風險。",encounter_profile:{zone:"basalt_vault",danger:"C",allowed_tiers:["D","C"]},persistent:true,resource_reset:false},
    {id:"ASD2-DUNGEON-WATCHCRYPT",name:"北望軍墓",kind:"dungeon",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-NORTH",parent_id:"ASD2-NORTHWATCH",description:"歷代北境守軍合葬墓地，近年因地層裂開出現未登記下層。",encounter_profile:{zone:"military_crypt",danger:"C",allowed_tiers:["D","C"]},persistent:true,resource_reset:false},
    {id:"ASD2-DUNGEON-REEFCHAPEL",name:"沉潮小聖堂",kind:"dungeon",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",parent_id:"ASD2-WILD-SEABREAKREEF",description:"半沉沒的舊海岸聖堂，退潮時可進入，內部仍保留救難名冊與鐘室。",encounter_profile:{zone:"sunken_chapel",danger:"C",allowed_tiers:["D","C"]},persistent:true,resource_reset:false},
    {id:"ASD2-DUNGEON-MIRRORDEPTH",name:"夜鏡沼下層遺構",kind:"dungeon",tier:"B",world_tier:"B",region_id:"REG-ASD-01",province_id:"PROV-ASD-RIVER",parent_id:"ASD2-WILD-NIGHTMARSH",description:"沼下石構造與王國現行建築不同；只允許記錄與取樣，不允許大規模挖掘。",encounter_profile:{zone:"mirror_ruin",danger:"B",allowed_tiers:["C","B"]},persistent:true,resource_reset:false},
    {id:"ASD2-DUNGEON-CROWNROOT",name:"王冠根脈封庫",kind:"dungeon",tier:"B",world_tier:"B",region_id:"REG-ASD-01",province_id:"PROV-ASD-CROWN",parent_id:"ASD-CAPITAL",description:"王都地下最深的舊防災封庫，與古水道、舊城牆地基相接；需外廷、白塔與公會三方核准。",encounter_profile:{zone:"sealed_archive",danger:"B",allowed_tiers:["C","B"]},persistent:true,resource_reset:false}
  ]);

  add("regional_npc_archetypes",[
    {id:"NPC-ASD2-001",name:"阿德里安・維爾",role:"王都道路監理官",tier:"C",location_id:"ASD-CAPITAL",description:"掌握道路修繕、封鎖與驛站稽核紀錄。",organization_ids:["ORG-ASD-CROWN-COURT"],services:["道路許可","巡查委託"],dialogue_ids:["DIA-ASD2-001"]},
    {id:"NPC-ASD2-002",name:"露西亞・白塔",role:"白塔教會法務修女",tier:"B",location_id:"ASD-CAPITAL",description:"處理教會仲裁、封印文書與死亡證明，對傳聞保持程序性距離。",organization_ids:["ORG-ASD2-WHITE-TOWER"],services:["教會仲裁","高階封鎖許可"],dialogue_ids:["DIA-ASD2-002"]},
    {id:"NPC-ASD2-003",name:"蓋瑞克・銅秤",role:"王都公證人",tier:"C",location_id:"ASD-CAPITAL",description:"專長契約、貨運封條與重量爭議。",organization_ids:["ORG-ASD2-CROWN-NOTARIES"],services:["契約公證","貨單驗證"],dialogue_ids:["DIA-ASD2-003"]},
    {id:"NPC-ASD2-004",name:"娜蒂亞・蜂金",role:"琥珀田蜂農會長",tier:"E",location_id:"ASD2-AMBERFIELD",description:"管理蜂箱輪替、花田與蜂蠟交易。",organization_ids:["ORG-ASD2-AMBER-GROWERS"],services:["農產委託","蜂蠟交易"],dialogue_ids:["DIA-ASD2-004"]},
    {id:"NPC-ASD2-005",name:"赫爾曼・水輪",role:"月磨渠務長",tier:"D",location_id:"ASD2-MOONMILL",description:"負責水閘、水磨與灌溉配水。",organization_ids:["ORG-ASD2-RIVERWORKS"],services:["渠務委託","水道情報"],dialogue_ids:["DIA-ASD2-005"]},
    {id:"NPC-ASD2-006",name:"艾妲・灰麥",role:"月磨糧倉管事",tier:"D",location_id:"ASD2-MOONMILL",description:"知道每批糧食的來源與失重，不輕信縱火傳聞。",organization_ids:["ORG-ASD-GRAIN-COMPACT"],services:["糧價情報","護運委託"],dialogue_ids:["DIA-ASD2-006"]},
    {id:"NPC-ASD2-007",name:"托爾・鐵輪",role:"鐵渡車匠",tier:"D",location_id:"ASD2-IRONFORD",description:"專修重型礦車、車軸與護運車架。",organization_ids:["ORG-ASD-ROAD-LEAGUE"],services:["車具修理","護運補給"],dialogue_ids:["DIA-ASD2-007"]},
    {id:"NPC-ASD2-008",name:"米蕾・紅砂",role:"鐵渡礦材鑑定員",tier:"C",location_id:"ASD2-IRONFORD",description:"辨識摻砂礦、熱裂礦與合法採礦印記。",organization_ids:["ORG-ASD2-MINING-ASSAY"],services:["礦材鑑定","採礦委託"],dialogue_ids:["DIA-ASD2-008"]},
    {id:"NPC-ASD2-009",name:"赫德・霜矛",role:"北望堡守備長",tier:"C",location_id:"ASD2-NORTHWATCH",description:"負責烽火、雪線巡邏與難民安置。",organization_ids:["ORG-ASD-GRAY-WARDENS"],services:["軍用通行","北境討伐"],dialogue_ids:["DIA-ASD2-009"]},
    {id:"NPC-ASD2-010",name:"索菲・藍燈",role:"北望傷兵救護師",tier:"C",location_id:"ASD2-NORTHWATCH",description:"熟悉凍傷、骨折與野外撤離。",organization_ids:["ORG-ASD2-FRONTIER-RELIEF"],services:["救護","急救技能"],dialogue_ids:["DIA-ASD2-010"]},
    {id:"NPC-ASD2-011",name:"班恩・長繩",role:"碎浪救難隊長",tier:"C",location_id:"ASD2-SEABREAK",description:"以潮汐、繩結與礁岸風向判定救援窗口。",organization_ids:["ORG-ASD2-SEABREAK-RESCUE"],services:["海岸救援","繩索訓練"],dialogue_ids:["DIA-ASD2-011"]},
    {id:"NPC-ASD2-012",name:"伊蓮・潮頁",role:"沉潮小聖堂抄錄員",tier:"C",location_id:"ASD2-SEABREAK",description:"整理失事名冊與舊海岸教會紀錄。",organization_ids:["ORG-ASD2-WHITE-TOWER"],services:["地方史查詢","教會委託"],dialogue_ids:["DIA-ASD2-012"]},
    {id:"NPC-ASD2-013",name:"洛薩・黑槌",role:"王家鍛造院外坊導師",tier:"B",location_id:"ASD-CAPITAL",description:"只教授公開鍛造法，不外流王室機密配方。",organization_ids:["ORG-ASD2-ROYAL-SMITHS"],services:["高階鍛造","精鋼鑑定"],dialogue_ids:["DIA-ASD2-013"]},
    {id:"NPC-ASD2-014",name:"薇拉・青瓶",role:"煉金師行會調劑師",tier:"C",location_id:"ASD-CAPITAL",description:"專長野外藥劑、解毒與穩定劑。",organization_ids:["ORG-ASD2-ALCHEMISTS"],services:["藥劑調製","材料收購"],dialogue_ids:["DIA-ASD2-014"]},
    {id:"NPC-ASD2-015",name:"羅安・麥穗",role:"王都救濟糧官",tier:"C",location_id:"ASD-CAPITAL",description:"管理災荒糧票、低價麵包與地方缺糧報告。",organization_ids:["ORG-ASD-GRAIN-COMPACT"],services:["民生委託","糧價資料"],dialogue_ids:["DIA-ASD2-015"]},
    {id:"NPC-ASD2-016",name:"席安・夜鏡",role:"濕地測繪員",tier:"C",location_id:"ASD-SILVER",description:"負責夜鏡沼外圍測繪，不宣稱理解沼下遺構來源。",organization_ids:["ORG-ASD2-RIVERWORKS"],services:["測繪委託","封鎖區申請"],dialogue_ids:["DIA-ASD2-016"]},
    {id:"NPC-ASD2-017",name:"艾文・舊牆",role:"王都地下工務師",tier:"B",location_id:"ASD-CAPITAL",description:"了解舊城牆、水道與王冠根脈封庫的結構關係。",organization_ids:["ORG-ASD-CROWN-COURT"],services:["地下工程委託","封庫技術資料"],dialogue_ids:["DIA-ASD2-017"]},
    {id:"NPC-ASD2-018",name:"卡莎・晨帆",role:"黎明港海關副官",tier:"C",location_id:"ASD-DAWNPORT",description:"專查走私、偽造貨單與危險魔物素材。",organization_ids:["ORG-ASD-ROAD-LEAGUE"],services:["海關委託","貨單核驗"],dialogue_ids:["DIA-ASD2-018"]}
  ]);

  add("npc_dialogues",[
    {id:"DIA-ASD2-001",speaker_id:"NPC-ASD2-001",topic:"道路",text:"封路不是把牌子插下去就算完事；替代路線、補給點與解除條件都要寫清楚。"},
    {id:"DIA-ASD2-002",speaker_id:"NPC-ASD2-002",topic:"封印",text:"封印失效是技術事實，不等於神諭，也不等於有人犯罪。"},
    {id:"DIA-ASD2-003",speaker_id:"NPC-ASD2-003",topic:"契約",text:"冒險者最常吃虧的不是劍不利，是沒看交付條件。"},
    {id:"DIA-ASD2-004",speaker_id:"NPC-ASD2-004",topic:"蜂場",text:"蜂群死得太快，先查花田與農藥，再查魔物。"},
    {id:"DIA-ASD2-005",speaker_id:"NPC-ASD2-005",topic:"水閘",text:"上游多一寸水，下游可能就少一車糧。"},
    {id:"DIA-ASD2-006",speaker_id:"NPC-ASD2-006",topic:"糧倉",text:"少的是重量，不一定少的是袋數。"},
    {id:"DIA-ASD2-007",speaker_id:"NPC-ASD2-007",topic:"護運",text:"礦車翻一次，修理費往往比護衛費還貴。"},
    {id:"DIA-ASD2-008",speaker_id:"NPC-ASD2-008",topic:"礦石",text:"顏色像精鋼不代表它能受同樣的火。"},
    {id:"DIA-ASD2-009",speaker_id:"NPC-ASD2-009",topic:"北境",text:"烽火只報看見的事，不替你解釋看見的是什麼。"},
    {id:"DIA-ASD2-010",speaker_id:"NPC-ASD2-010",topic:"急救",text:"能走的人先保暖，不能走的人先固定，英雄主義排在後面。"},
    {id:"DIA-ASD2-011",speaker_id:"NPC-ASD2-011",topic:"礁岸",text:"繩結錯一次，下一個浪頭不會給你重來。"},
    {id:"DIA-ASD2-012",speaker_id:"NPC-ASD2-012",topic:"舊名冊",text:"名字寫在這裡，只證明有人曾被記錄，不證明他怎麼死。"},
    {id:"DIA-ASD2-013",speaker_id:"NPC-ASD2-013",topic:"鍛造",text:"B級裝備不是多燒兩爐就有；材料、工法與資格少一項都不行。"},
    {id:"DIA-ASD2-014",speaker_id:"NPC-ASD2-014",topic:"藥劑",text:"能壓住症狀的藥，不一定能解掉原因。"},
    {id:"DIA-ASD2-015",speaker_id:"NPC-ASD2-015",topic:"糧價",text:"王都缺一車糧叫漲價，邊鎮缺一車糧可能叫斷炊。"},
    {id:"DIA-ASD2-016",speaker_id:"NPC-ASD2-016",topic:"夜鏡沼",text:"我只畫岸線。水下那片石構，沒有正式結論。"},
    {id:"DIA-ASD2-017",speaker_id:"NPC-ASD2-017",topic:"根脈封庫",text:"三份許可不是刁難，是因為下面同時連著供水、城牆和檔案封庫。"},
    {id:"DIA-ASD2-018",speaker_id:"NPC-ASD2-018",topic:"海關",text:"真正危險的走私貨，通常不像危險品。"}
  ]);

  add("world_organizations",[
    {id:"ORG-ASD2-WHITE-TOWER",name:"白塔教會仲裁所",kind:"religious_legal",tier:"B",region_id:"REG-ASD-01",base_location_id:"ASD-CAPITAL",description:"處理教會法、封印、公證死亡與跨領地仲裁。",bonus:{sanctioned_seal_access:true}},
    {id:"ORG-ASD2-CROWN-NOTARIES",name:"王冠公證人會",kind:"civilian",tier:"C",region_id:"REG-ASD-01",base_location_id:"ASD-CAPITAL",description:"驗證契約、貨單、重量與地方印章。",bonus:{contract_fee:-8}},
    {id:"ORG-ASD2-RIVERWORKS",name:"河谷渠務聯會",kind:"civilian",tier:"C",region_id:"REG-ASD-01",base_location_id:"ASD2-MOONMILL",description:"維護水閘、水磨、灌溉與河岸工程。",bonus:{water_route_safety:10}},
    {id:"ORG-ASD2-MINING-ASSAY",name:"東境礦務鑑定所",kind:"trade",tier:"C",region_id:"REG-ASD-01",base_location_id:"ASD2-IRONFORD",description:"鑑定礦材、採礦印記與熱變質樣本。",bonus:{ore_appraisal:10}},
    {id:"ORG-ASD2-SEABREAK-RESCUE",name:"碎浪救難隊",kind:"civilian",tier:"D",region_id:"REG-ASD-01",base_location_id:"ASD2-SEABREAK",description:"負責礁岸、沉船與風暴救援。",bonus:{coastal_rescue:10}},
    {id:"ORG-ASD2-ROYAL-SMITHS",name:"王家鍛造院外坊",kind:"craft",tier:"B",region_id:"REG-ASD-01",base_location_id:"ASD-CAPITAL",description:"承接公開軍需、精鋼鑑定與高階修繕；王室內坊機密不對外。",bonus:{forge_quality:8}},
    {id:"ORG-ASD2-ALCHEMISTS",name:"阿斯戴爾煉金師行會",kind:"craft",tier:"C",region_id:"REG-ASD-01",base_location_id:"ASD-CAPITAL",description:"統一藥劑標籤、純度與危險材料管理。",bonus:{alchemy_yield:8}},
    {id:"ORG-ASD2-AMBER-GROWERS",name:"琥珀田農產協會",kind:"civilian",tier:"E",region_id:"REG-ASD-01",base_location_id:"ASD2-AMBERFIELD",description:"協調蜂蜜、蜂蠟、亞麻與乳品供應。",bonus:{food_supply_info:true}},
    {id:"ORG-ASD2-FRONTIER-RELIEF",name:"北境救護聯隊",kind:"medical",tier:"C",region_id:"REG-ASD-01",base_location_id:"ASD2-NORTHWATCH",description:"由教會、守軍與民間救護師共同維持的撤離與醫療網。",bonus:{field_recovery:8}}
  ]);

  add("discipline_factions",[
    {id:"DISC-ASD2-CROWN-SPEAR",name:"王冠長槍陣",tier:"D",base_location_id:"ASD-CAPITAL",description:"王都城防與護衛隊使用的槍盾協同訓練，重視保持距離與隊形。",bonus:{accuracy:4,guard_effectiveness:6},requirements:{min_level:8,weapon_types:["槍","盾"]}},
    {id:"DISC-ASD2-REEF-ROPE",name:"碎浪繩鬥術",tier:"D",base_location_id:"ASD2-SEABREAK",description:"救難員演化出的短兵與繩索步法，重視固定、撤離與狹地生存。",bonus:{evasion:4,rescue_effectiveness:10},requirements:{min_level:9,weapon_types:["短刃","棍"]}},
    {id:"DISC-ASD2-FROST-SPEAR",name:"霜線獵槍術",tier:"C",base_location_id:"ASD2-NORTHWATCH",description:"北境獵團對大型獸類的長槍與投槍技法，講求先傷腿再控距。",bonus:{accuracy:5,large_monster_damage:8},requirements:{min_level:16,weapon_types:["槍","投擲"]}},
    {id:"DISC-ASD2-WHITE-TOWER-WARD",name:"白塔護印術",tier:"B",base_location_id:"ASD-CAPITAL",description:"教會封印護衛的防禦流派，只教授公開護印與驅邪程序，不含神殿機密。",bonus:{status_resist:8,undead_defense:10},requirements:{min_level:28,required_organization:"ORG-ASD2-WHITE-TOWER"}}
  ]);

  add("monsters",[
    {id:"MON-ASD2-001",name:"田野掠食狐",tier:"F",lore_role:"一般",habitat:["ASD2-WILD-AMBERFIELDS"],hp:34,attack:11,defense:4,accuracy:68,damage:[4,7],description:"會偷襲家禽與幼畜，單獨個體仍可能咬傷新手。"},
    {id:"MON-ASD2-002",name:"渠泥甲蛙",tier:"E",lore_role:"一般",habitat:["ASD2-WILD-MILLCHANNEL"],hp:48,attack:15,defense:9,accuracy:69,damage:[5,9],element:"水",description:"硬泥包覆背部的水棲魔物。"},
    {id:"MON-ASD2-003",name:"青蘆咬魚",tier:"E",lore_role:"一般",habitat:["ASD2-WILD-REEDBANK"],hp:45,attack:16,defense:6,accuracy:72,damage:[5,10],element:"水",description:"會成群攻擊涉水者。"},
    {id:"MON-ASD2-004",name:"礦路裂蹄獸",tier:"D",lore_role:"一般",habitat:["ASD2-WILD-IRONTRAIL"],hp:82,attack:24,defense:13,accuracy:72,damage:[8,15],description:"受礦塵與重車驚擾的大型草食魔獸。"},
    {id:"MON-ASD2-005",name:"玄武岩甲蜥",tier:"C",lore_role:"一般",habitat:["ASD2-WILD-BASALTHOLLOW","ASD2-DUNGEON-BASALTVAULT"],hp:118,attack:30,defense:21,accuracy:74,damage:[10,20],element:"地",description:"背甲如黑岩，受持續水屬性攻擊後熱甲會變脆。"},
    {id:"MON-ASD2-006",name:"熔脈火鬚蟲",tier:"C",lore_role:"一般",habitat:["ASD2-DUNGEON-BASALTVAULT"],hp:105,attack:31,defense:16,accuracy:75,damage:[11,20],element:"火",description:"群聚於熱裂縫，會使金屬護具升溫。"},
    {id:"MON-ASD2-007",name:"霜線角羚",tier:"D",lore_role:"一般",habitat:["ASD2-WILD-FROSTLINE"],hp:88,attack:25,defense:12,accuracy:74,damage:[8,16],element:"風",description:"受驚時會以高速角撞突破陣線。"},
    {id:"MON-ASD2-008",name:"白鬃座狼",tier:"C",lore_role:"菁英",habitat:["ASD2-WILD-FROSTLINE","ASD2-WILD-WOLFSHADOW"],hp:142,attack:34,defense:18,accuracy:79,damage:[12,23],element:"風",description:"北境大型狼種，成年個體對低階角色具高度威脅。"},
    {id:"MON-ASD2-009",name:"松谷血牙狼",tier:"D",lore_role:"一般",habitat:["ASD2-WILD-WOLFSHADOW"],hp:84,attack:25,defense:11,accuracy:76,damage:[8,16],description:"以包圍與追擊疲憊獵物為主。"},
    {id:"MON-ASD2-010",name:"礁縫鉗蟹",tier:"D",lore_role:"一般",habitat:["ASD2-WILD-SEABREAKREEF"],hp:86,attack:23,defense:16,accuracy:70,damage:[7,15],element:"水",description:"擅長在礁縫夾住腿部與繩索。"},
    {id:"MON-ASD2-011",name:"沉鐘幽影",tier:"C",lore_role:"菁英",habitat:["ASD2-DUNGEON-REEFCHAPEL"],hp:132,attack:33,defense:17,accuracy:76,damage:[11,22],element:"死亡",description:"只在鐘室與舊名冊附近活動的死靈現象。"},
    {id:"MON-ASD2-012",name:"休耕石獾",tier:"D",lore_role:"一般",habitat:["ASD2-WILD-CROWNFALLOW"],hp:90,attack:23,defense:17,accuracy:69,damage:[7,15],element:"地",description:"會挖斷舊道路基與農地排水。"},
    {id:"MON-ASD2-013",name:"舊鑄幣所銅骸",tier:"D",lore_role:"菁英",habitat:["ASD2-DUNGEON-OLDMINT"],hp:102,attack:28,defense:18,accuracy:73,damage:[9,18],element:"死亡",description:"與舊鑄幣模具周邊的殘留魔力共鳴。"},
    {id:"MON-ASD2-014",name:"沉水庫盲鰻",tier:"D",lore_role:"一般",habitat:["ASD2-DUNGEON-MILLVAULT"],hp:80,attack:25,defense:10,accuracy:75,damage:[8,16],element:"水",description:"在黑暗水道以震動追蹤獵物。"},
    {id:"MON-ASD2-015",name:"軍墓誓骸",tier:"C",lore_role:"菁英",habitat:["ASD2-DUNGEON-WATCHCRYPT"],hp:148,attack:35,defense:22,accuracy:76,damage:[12,24],element:"死亡",description:"只對破壞墓碑、軍旗與陪葬品者高度敵對。"},
    {id:"MON-ASD2-016",name:"夜鏡泥魘",tier:"B",lore_role:"一般",habitat:["ASD2-WILD-NIGHTMARSH"],hp:176,attack:41,defense:25,accuracy:78,damage:[14,28],element:"暗",description:"會利用倒影誤導距離判斷，禁止生成於低階濕地。"},
    {id:"MON-ASD2-017",name:"鏡沼無面守衛",tier:"B",lore_role:"菁英",habitat:["ASD2-DUNGEON-MIRRORDEPTH"],hp:215,attack:46,defense:30,accuracy:81,damage:[16,32],element:"暗",description:"守護沼下遺構通道的未知構裝，不推定其文明來源。"},
    {id:"MON-ASD2-018",name:"封庫石像衛",tier:"B",lore_role:"菁英",habitat:["ASD2-DUNGEON-CROWNROOT"],hp:228,attack:45,defense:34,accuracy:78,damage:[15,31],element:"地",description:"王都舊防災封庫的構裝守衛，受正式印記控制。"},
    {id:"MON-ASD2-019",name:"根脈腐蝕團",tier:"B",lore_role:"一般",habitat:["ASD2-DUNGEON-CROWNROOT"],hp:188,attack:42,defense:23,accuracy:80,damage:[14,29],element:"暗",description:"封庫滲水與魔力形成的侵蝕性聚合體。"},
    {id:"MON-ASD2-020",name:"霜線裂翼鷹",tier:"C",lore_role:"菁英",habitat:["ASD2-WILD-FROSTLINE"],hp:136,attack:36,defense:17,accuracy:82,damage:[12,24],element:"風",description:"會從逆風側俯衝，對暴露後排威脅高。"}
  ]);

  add("items",[
    {id:"ITEM-ASD2-AMBER-HONEY",name:"琥珀田蜂蜜",kind:"food",tier:"F",weight:0.4,price:8,effect:"少量恢復飢餓並提供短暫體力補充。"},
    {id:"ITEM-ASD2-BEESWAX",name:"精製蜂蠟",kind:"material",tier:"E",weight:0.2,price:12,description:"藥瓶封口、弓弦與防水處理材料。"},
    {id:"ITEM-ASD2-FLAX",name:"長纖亞麻",kind:"material",tier:"E",weight:0.3,price:11,description:"繃帶、衣物與繩索的常用材料。"},
    {id:"ITEM-ASD2-MILL-OIL",name:"水磨軸油",kind:"material",tier:"E",weight:0.4,price:15,description:"車輪、水磨與機械維護用油。"},
    {id:"ITEM-ASD2-BASALT-SCALE",name:"玄武岩甲片",kind:"material",tier:"C",weight:0.7,price:48,description:"玄武岩甲蜥背甲，可用於耐熱護具。"},
    {id:"ITEM-ASD2-FROST-HORN",name:"霜線角羚角",kind:"material",tier:"D",weight:0.6,price:28,description:"可製作槍柄、藥材研磨器與號角。"},
    {id:"ITEM-ASD2-REEF-SALT",name:"碎浪礁鹽",kind:"material",tier:"E",weight:0.5,price:9,description:"乾製食物與簡易保存用。"},
    {id:"ITEM-ASD2-MIRROR-MUD",name:"夜鏡黑泥樣本",kind:"material",tier:"B",weight:0.2,price:135,description:"封鎖區研究樣本，只能由合法委託取得與交付。"},

    {id:"ITEM-ASD2-CROWN-SPEAR",name:"王冠衛槍",kind:"weapon",tier:"D",weight:3.2,price:145,stats:{attack:8,accuracy:2},description:"王都公開制式長槍，不是王室內衛專裝。"},
    {id:"ITEM-ASD2-GRAY-SHIELD",name:"灰門塔盾",kind:"shield",tier:"D",weight:6.4,price:170,stats:{defense:9,guard:8},description:"北境守備常用重盾。"},
    {id:"ITEM-ASD2-REEF-KNIFE",name:"碎浪救難刀",kind:"weapon",tier:"D",weight:0.8,price:118,stats:{attack:5,accuracy:3},description:"可割繩、破網與近身自衛。"},
    {id:"ITEM-ASD2-FROST-SPEAR",name:"霜線獵槍",kind:"weapon",tier:"C",weight:3.0,price:265,stats:{attack:13,accuracy:4},description:"對大型獸類狩獵最佳化的長槍。"},
    {id:"ITEM-ASD2-BASALT-VEST",name:"玄岩鱗背甲",kind:"armor",tier:"C",weight:7.2,price:310,stats:{defense:15,fire_resist:8},description:"以玄武岩甲片與精鋼鉚片製成。"},
    {id:"ITEM-ASD2-RIVER-CLOAK",name:"河務防水斗篷",kind:"armor",tier:"D",weight:1.7,price:98,stats:{water_resist:5},description:"渠務與河運人員常用的厚蠟布斗篷。"},
    {id:"ITEM-ASD2-NORTHWATCH-COAT",name:"北望厚絨甲衣",kind:"armor",tier:"C",weight:5.0,price:245,stats:{defense:10,cold_resist:10},description:"北境長途巡查用複合護衣。"},
    {id:"ITEM-ASD2-WHITE-WARD",name:"白塔護印墜",kind:"accessory",tier:"B",weight:0.2,price:520,stats:{status_resist:8},description:"需白塔正式授權才能取得的護印器具。"},
    {id:"ITEM-ASD2-CROWNROOT-KEY",name:"根脈封庫三聯鑰牌",kind:"key_item",tier:"B",weight:0.1,price:0,description:"外廷、白塔、公會三方共同驗證的臨時通行鑰牌，不可交易。"},
    {id:"ITEM-ASD2-ASSAY-KIT",name:"礦務試金盒",kind:"tool",tier:"C",weight:1.5,price:210,effect:"提高礦材鑑定與採礦樣本判定成功率。"},

    {id:"ITEM-ASD2-POTION-FIELD",name:"邊境止血藥劑",kind:"consumable",tier:"E",weight:0.1,price:32,effect:"戰後與野外使用，恢復少量HP並降低流血風險。"},
    {id:"ITEM-ASD2-POTION-FROST",name:"抗霜藥劑",kind:"consumable",tier:"D",weight:0.1,price:58,effect:"短時間提高寒冷與凍傷耐受。"},
    {id:"ITEM-ASD2-POTION-HEAT",name:"耐熱藥劑",kind:"consumable",tier:"D",weight:0.1,price:62,effect:"短時間降低熔窟與火熱環境傷害。"},
    {id:"ITEM-ASD2-POTION-FOCUS",name:"清醒滴劑",kind:"consumable",tier:"D",weight:0.05,price:54,effect:"降低迷霧、回聲與方向錯亂造成的探索懲罰。"},
    {id:"ITEM-ASD2-POTION-ANTIVENOM",name:"河谷解毒劑",kind:"consumable",tier:"D",weight:0.1,price:68,effect:"針對常見野外毒素；不治療飢餓、口渴、疲勞。"},
    {id:"ITEM-ASD2-POTION-BREATH",name:"長息藥劑",kind:"consumable",tier:"C",weight:0.1,price:96,effect:"延長短時間憋氣能力，用於潮洞與沉水庫。"},
    {id:"ITEM-ASD2-POTION-WARD",name:"白塔淨穢劑",kind:"consumable",tier:"C",weight:0.1,price:118,effect:"降低死亡／暗屬性環境造成的負面狀態機率，不等同高階淨化術。"},
    {id:"ITEM-ASD2-POTION-MIRROR",name:"映界穩定劑",kind:"consumable",tier:"B",weight:0.1,price:245,effect:"夜鏡沼與沼下遺構專用研究藥劑，降低感知錯亂；需委託資格。"},

    {id:"ITEM-ASD2-ROPE-KIT",name:"碎浪救難繩組",kind:"tool",tier:"D",weight:3.0,price:88,effect:"提高礁岸、潮洞與高差地形撤離成功率。"},
    {id:"ITEM-ASD2-SURVEY-LAMP",name:"渠務測深燈",kind:"tool",tier:"D",weight:1.1,price:74,effect:"照明並標記淹水通道深度。"},
    {id:"ITEM-ASD2-FROST-SPIKES",name:"霜線鞋釘",kind:"tool",tier:"D",weight:0.7,price:66,effect:"降低冰面滑落與山徑移動失敗。"},
    {id:"ITEM-ASD2-SEAL-CASE",name:"公證封條盒",kind:"tool",tier:"C",weight:0.6,price:125,effect:"保護契約、印記與證物，降低運送途中損毀風險。"}
  ]);

  add("shared_skills",[
    {id:"SKILL-ASD2-CONTRACT-READ",name:"契約判讀",tier:"E",category:"社交",description:"辨識交付條件、違約責任與公證標記。",effect:"降低委託條件誤判與不利契約風險。",max_level:10},
    {id:"SKILL-ASD2-RIVERWORK",name:"河渠作業",tier:"E",category:"探索",description:"理解水閘、水磨、灌溉與簡易渡河工程。",effect:"提升河岸與水道探索效率。",max_level:10},
    {id:"SKILL-ASD2-ROPECRAFT",name:"救難繩術",tier:"D",category:"生存",description:"繩結、固定、下降與傷員拖帶。",effect:"降低高差與礁岸撤離失敗。",max_level:10},
    {id:"SKILL-ASD2-ORE-ASSAY",name:"礦材試金",tier:"D",category:"製作",description:"以硬度、火色與重量判斷礦材品質。",effect:"提高礦材鑑定準確率。",max_level:10},
    {id:"SKILL-ASD2-FROST-MARCH",name:"霜線行軍",tier:"D",category:"生存",description:"寒地步伐、保暖與隊伍間距管理。",effect:"降低寒冷地形疲勞累積。",max_level:10},
    {id:"SKILL-ASD2-LARGE-HUNT",name:"大型獸追獵",tier:"C",category:"戰鬥",description:"辨識大型獸轉向、衝撞與失衡窗口。",effect:"對大型魔物的命中與控距小幅提升。",max_level:10},
    {id:"SKILL-ASD2-WARD-PROTOCOL",name:"護印程序",tier:"C",category:"知識",description:"合法辨識、封存與回報教會／軍事封印。",effect:"降低誤觸封印造成的事件懲罰。",max_level:10},
    {id:"SKILL-ASD2-URBAN-SURVEY",name:"地下工務測繪",tier:"C",category:"探索",description:"判讀排水、牆基、舊道與封庫結構。",effect:"提高王都地下區域探索成功率。",max_level:10},
    {id:"SKILL-ASD2-COURT-PROCEDURE",name:"王都程序學",tier:"B",category:"社交",description:"處理多方許可、申訴、聽證與正式證物流程。",effect:"降低B級行政劇情中的程序性失敗。",max_level:10},
    {id:"SKILL-ASD2-MIRROR-RESIST",name:"倒影定識",tier:"B",category:"探索",description:"以固定參照物對抗夜鏡沼的距離與方向錯覺。",effect:"降低mirror_marsh與mirror_ruin迷失。",max_level:10},
    {id:"SKILL-ASD2-SPEAR-LINE",name:"槍陣推進",tier:"D",category:"戰鬥",description:"長槍與盾牌協同推進。",effect:"Lv1造成物理攻擊力112%的攻擊；Lv6命中後小幅降低敵方推進能力；Lv10在持盾時追加短暫防禦提升。",power_percent:112,power_growth_per_level:3,max_level:10},
    {id:"SKILL-ASD2-REEF-CUT",name:"礁線斷繩斬",tier:"D",category:"戰鬥",description:"以短刃切斷束縛並反擊。",effect:"Lv1造成物理攻擊力115%的攻擊；Lv6解除一層束縛類效果；Lv10成功解除束縛後獲得短暫迴避。",power_percent:115,power_growth_per_level:3,max_level:10},
    {id:"SKILL-ASD2-FROST-PIERCE",name:"霜線貫刺",tier:"C",category:"戰鬥",description:"針對大型獸肢體的精準長槍刺擊。",effect:"Lv1造成物理攻擊力124%的攻擊；Lv6對大型目標額外提高命中；Lv10命中後降低目標一次衝撞威力。",power_percent:124,power_growth_per_level:4,max_level:10},
    {id:"SKILL-ASD2-WHITE-WARD",name:"白塔護印",tier:"B",category:"輔助",description:"以公開護印程序加固自身或隊友的精神與死亡屬性防護。",effect:"不造成傷害；Lv6提升負面狀態抗性，Lv10可額外保護一次封印事件判定。",power_percent:0,max_level:10},
    {id:"SKILL-ASD2-BASALT-GUARD",name:"玄岩架勢",tier:"C",category:"戰鬥",description:"借重甲與盾牌穩固重心。",effect:"不造成傷害；提高防禦與抗衝撞，Lv6受火屬性攻擊時降低裝備熱負荷，Lv10成功格擋後短暫提升抗性。",power_percent:0,max_level:10},
    {id:"SKILL-ASD2-FIELD-TRIAGE",name:"戰地檢傷",tier:"C",category:"生存",description:"快速判斷出血、骨折、凍傷與撤離優先順序。",effect:"提高戰後急救與撤離效率，不具有復活效果。",max_level:10}
  ]);

  add("quest_templates",[
    {id:"Q1582-ASD-AMBER-BEES",name:"琥珀田蜂群失序",tier:"F",min_level:1,max_level:8,type:"調查",description:"蜂群大量離巢，先檢查花田、蜂箱與附近掠食獸。",objective:{kind:"action",location_id:"ASD2-WILD-AMBERFIELDS",target:2},reward:[14,22],recommended_locations:["ASD2-AMBERFIELD","ASD2-WILD-AMBERFIELDS"],xp_reward:16},
    {id:"Q1582-ASD-AMBER-FOX",name:"田野掠食狐驅離",tier:"F",min_level:1,max_level:8,type:"討伐",description:"掠食狐持續侵擾家禽，確認不是幼獸巢穴後驅離。",objective:{kind:"hunt",monster_id:"MON-ASD2-001",target:1},reward:[18,28],recommended_locations:["ASD2-WILD-AMBERFIELDS"],xp_reward:18},
    {id:"Q1582-ASD-CANAL-FROG",name:"渠泥甲蛙清理",tier:"E",min_level:4,max_level:13,type:"討伐",description:"甲蛙堵住水閘維修區，清除成獸並保留幼體棲地。",objective:{kind:"hunt",monster_id:"MON-ASD2-002",target:2},reward:[30,48],recommended_locations:["ASD2-WILD-MILLCHANNEL"],xp_reward:30},
    {id:"Q1582-ASD-MILL-GATE",name:"月磨水閘校準",tier:"E",min_level:4,max_level:14,type:"巡查",description:"依渠務長標記檢查兩處水閘與一座溢流口。",objective:{kind:"patrol",location_id:"ASD2-WILD-MILLCHANNEL",target:3,checkpoints:["東水閘","舊溢流口","第三水磨引渠"]},reward:[34,54],recommended_locations:["ASD2-MOONMILL","ASD2-WILD-MILLCHANNEL"],xp_reward:32},
    {id:"Q1582-ASD-IRONFORD-WHEEL",name:"礦車斷軸護送",tier:"E",min_level:5,max_level:15,type:"護送",description:"護送損壞礦車至鐵渡修車工坊，途中不得丟棄已封印礦袋。",objective:{kind:"action",location_id:"ASD2-WILD-IRONTRAIL",target:2},reward:[42,68],recommended_locations:["ASD2-IRONFORD","ASD2-WILD-IRONTRAIL"],xp_reward:40},
    {id:"Q1582-ASD-REED-FISH",name:"青蘆咬魚暴增",tier:"E",min_level:5,max_level:15,type:"討伐",description:"調查咬魚暴增是否與上游水量或棄料有關。",objective:{kind:"hunt",monster_id:"MON-ASD2-003",target:3},reward:[38,62],recommended_locations:["ASD2-WILD-REEDBANK"],xp_reward:38},
    {id:"Q1582-ASD-REEF-ROPE",name:"碎浪救難繩更新",tier:"D",min_level:10,max_level:24,type:"探索",description:"沿外礁更新三處救難固定點。",objective:{kind:"action",location_id:"ASD2-WILD-SEABREAKREEF",target:3},reward:[86,136],recommended_locations:["ASD2-SEABREAK","ASD2-WILD-SEABREAKREEF"],xp_reward:70},
    {id:"Q1582-ASD-OLDMINT-SEAL",name:"舊鑄幣所封條核驗",tier:"D",min_level:11,max_level:25,type:"地下城",description:"確認三處舊封條與秤臺，禁止搬動鑄幣模具。",objective:{kind:"action",location_id:"ASD2-DUNGEON-OLDMINT",target:3},reward:[92,145],recommended_locations:["ASD-CAPITAL","ASD2-DUNGEON-OLDMINT"],xp_reward:76},
    {id:"Q1582-ASD-FALLOW-BADGER",name:"休耕地石獾洞",tier:"D",min_level:10,max_level:24,type:"調查",description:"石獾挖穿舊路基，先測繪洞道再決定是否驅離。",objective:{kind:"action",location_id:"ASD2-WILD-CROWNFALLOW",target:2},reward:[82,130],recommended_locations:["ASD2-WILD-CROWNFALLOW"],xp_reward:68},
    {id:"Q1582-ASD-WOLFSHADOW",name:"狼影松谷巡獵",tier:"D",min_level:12,max_level:27,type:"討伐",description:"成年狼群開始追逐商旅，獵團要求清除兩隻主動獵手。",objective:{kind:"hunt",monster_id:"MON-ASD2-009",target:2},reward:[104,162],recommended_locations:["ASD2-WILD-WOLFSHADOW"],xp_reward:82},
    {id:"Q1582-ASD-FROSTLINE-SCOUT",name:"霜線高徑風標",tier:"C",min_level:20,max_level:38,type:"巡查",description:"北望堡需重立三處冬季風標並確認裂翼鷹活動。",objective:{kind:"patrol",location_id:"ASD2-WILD-FROSTLINE",target:3,checkpoints:["南坡石柱","冰脊風旗","北側烽燧"]},reward:[190,300],recommended_locations:["ASD2-NORTHWATCH","ASD2-WILD-FROSTLINE"],xp_reward:145},
    {id:"Q1582-ASD-BASALT-SAMPLE",name:"玄武岩甲片研究",tier:"C",min_level:20,max_level:38,type:"採集",description:"取得合格甲片樣本，禁止為採樣大量獵殺族群。",objective:{kind:"gather",item_id:"ITEM-ASD2-BASALT-SCALE",target:2,consume_on_turnin:true},reward:[180,286],recommended_locations:["ASD2-WILD-BASALTHOLLOW"],xp_reward:138},
    {id:"Q1582-ASD-BASALT-VAULT",name:"熔脈廳熱壓測繪",tier:"C",min_level:22,max_level:40,type:"地下城",description:"記錄熔脈廳三個熱壓點並撤離，不得封死自然通風口。",objective:{kind:"action",location_id:"ASD2-DUNGEON-BASALTVAULT",target:3},reward:[220,340],recommended_locations:["ASD2-DUNGEON-BASALTVAULT"],xp_reward:165},
    {id:"Q1582-ASD-WATCHCRYPT",name:"北望軍墓裂層",tier:"C",min_level:23,max_level:41,type:"地下城",description:"確認新裂層是否影響軍墓結構，禁止移動軍旗與陪葬品。",objective:{kind:"action",location_id:"ASD2-DUNGEON-WATCHCRYPT",target:3},reward:[230,360],recommended_locations:["ASD2-NORTHWATCH","ASD2-DUNGEON-WATCHCRYPT"],xp_reward:172},
    {id:"Q1582-ASD-SUNKEN-CHAPEL",name:"沉潮聖堂名冊",tier:"C",min_level:22,max_level:40,type:"調查",description:"於退潮窗口取回受潮名冊副本，不得破壞原件。",objective:{kind:"action",location_id:"ASD2-DUNGEON-REEFCHAPEL",target:2},reward:[214,332],recommended_locations:["ASD2-SEABREAK","ASD2-DUNGEON-REEFCHAPEL"],xp_reward:160},
    {id:"Q1582-ASD-FROST-WOLF",name:"白鬃座狼追蹤",tier:"C",min_level:24,max_level:42,type:"討伐",description:"北境商隊遭白鬃座狼追獵，清除確認主動獵人的個體。",objective:{kind:"hunt",monster_id:"MON-ASD2-008",target:1},reward:[250,390],recommended_locations:["ASD2-WILD-FROSTLINE","ASD2-WILD-WOLFSHADOW"],xp_reward:180},
    {id:"Q1582-ASD-MINT-AUDIT",name:"失配的舊鑄幣重量",tier:"C",min_level:24,max_level:44,type:"調查",description:"公證人發現舊鑄幣所秤碼與檔案不一致，需同時核對地窖與王都公證庫。",objective:{kind:"action",location_id:"ASD2-DUNGEON-OLDMINT",target:3},reward:[240,375],recommended_locations:["ASD-CAPITAL","ASD2-DUNGEON-OLDMINT"],xp_reward:178},
    {id:"Q1582-ASD-GRAIN-WEIGHT",name:"消失的糧食重量",tier:"C",min_level:21,max_level:40,type:"調查",description:"月磨糧倉袋數未變、總重下降，查明受潮、蟲害、偷運或記錄錯誤。",objective:{kind:"action",location_id:"ASD2-MOONMILL",target:3},reward:[205,320],recommended_locations:["ASD2-MOONMILL","ASD-SILVER"],xp_reward:152},
    {id:"Q1582-ASD-NIGHTMARSH-PERMIT",name:"夜鏡沼外圈測繪",tier:"B",min_level:34,max_level:55,type:"封鎖區",description:"取得糧議會、公會與渠務聯會同意，完成外圈三點測繪。",objective:{kind:"patrol",location_id:"ASD2-WILD-NIGHTMARSH",target:3,checkpoints:["白樁岸","沉柳島","北側鏡面"]},reward:[520,820],recommended_locations:["ASD-SILVER","ASD2-WILD-NIGHTMARSH"],xp_reward:360},
    {id:"Q1582-ASD-MIRROR-RUIN",name:"沼下遺構取樣",tier:"B",min_level:38,max_level:60,type:"地下城",description:"只採取表面黑泥與石屑樣本，不開啟未核准門扉。",objective:{kind:"gather",item_id:"ITEM-ASD2-MIRROR-MUD",target:2,consume_on_turnin:true},reward:[640,990],recommended_locations:["ASD2-DUNGEON-MIRRORDEPTH"],xp_reward:430},
    {id:"Q1582-ASD-CROWNROOT-PERMIT",name:"根脈封庫三方許可",tier:"B",min_level:36,max_level:58,type:"行政",description:"依序完成外廷、白塔、公會三方審核並取得臨時鑰牌。",objective:{kind:"action",location_id:"ASD-CAPITAL",target:3},reward:[560,880],recommended_locations:["ASD-CAPITAL"],xp_reward:390},
    {id:"Q1582-ASD-CROWNROOT",name:"王冠根脈封庫巡檢",tier:"B",min_level:40,max_level:62,type:"地下城",description:"檢查封庫滲水、石像衛控制印與舊檔案室，不得帶走原始檔案。",objective:{kind:"action",location_id:"ASD2-DUNGEON-CROWNROOT",target:4},reward:[720,1120],recommended_locations:["ASD-CAPITAL","ASD2-DUNGEON-CROWNROOT"],xp_reward:480},
    {id:"Q1582-ASD-SEAL-CHAIN",name:"偽造封條流向",tier:"B",min_level:37,max_level:60,type:"調查",description:"由王都公證庫追查至鐵渡、黎明港與銀穗城的偽造貨運封條。",objective:{kind:"action",location_id:"ASD-CAPITAL",target:4},reward:[660,1020],recommended_locations:["ASD-CAPITAL","ASD2-IRONFORD","ASD-DAWNPORT","ASD-SILVER"],xp_reward:445},
    {id:"Q1582-ASD-FRONTIER-REFUGE",name:"北境撤離線演練",tier:"C",min_level:20,max_level:40,type:"護送",description:"模擬霜線封閉時的傷員與平民撤離，確認三處補給點。",objective:{kind:"patrol",location_id:"ASD2-WILD-FROSTLINE",target:3,checkpoints:["南坡避風所","舊獵棚","北望堡門"]},reward:[200,310],recommended_locations:["ASD2-NORTHWATCH","ASD2-WILD-FROSTLINE"],xp_reward:150}
  ]);

  add("adventure_event_templates",[
    {id:"AE1582-ASD-BEE-SILENCE",name:"沒有蜂鳴的早晨",tier:"F",kinds:["wild","town"],zones:["farmland"],location_ids:["ASD2-AMBERFIELD","ASD2-WILD-AMBERFIELDS"],stat:"感知",dc:10,text:"蜂場異常安靜，蜂箱外沒有明顯破壞。",success:"你找到被風吹倒的花田標記與新鮮獸跡。",fail:"你無法判斷原因，只能建議暫停移箱。",reward:{reputation:1}},
    {id:"AE1582-ASD-MILL-JAM",name:"卡死的第三水磨",tier:"E",kinds:["town","wild"],zones:["river_mill","canal"],location_ids:["ASD2-MOONMILL","ASD2-WILD-MILLCHANNEL"],stat:"力量",dc:12,text:"漂木卡住水輪，水位開始倒灌。",success:"你與工人固定水輪並清除漂木。",fail:"你被迫關閉一段引渠。",reward:{money:[12,22],reputation:1},failure:{fatigue:2}},
    {id:"AE1582-ASD-ORE-SEAL",name:"褪色的礦袋封印",tier:"E",kinds:["town"],zones:["trade_ford"],location_ids:["ASD2-IRONFORD"],stat:"智力",dc:12,text:"一批礦袋封印顏色不對，但重量與數量正常。",success:"你要求送往鑑定所，不在證據不足時指控走私。",fail:"貨物被迫暫扣，商隊產生額外成本。",reward:{reputation:1}},
    {id:"AE1582-ASD-REEF-BOAT",name:"礁外翻覆小艇",tier:"D",kinds:["wild"],zones:["reef"],location_ids:["ASD2-WILD-SEABREAKREEF"],stat:"敏捷",dc:15,text:"退潮前一艘小艇翻覆，兩名漁民掛在礁石外側。",success:"你固定雙繩並在下一浪前完成拖帶。",fail:"只能等待救難隊從岸上架繩。",reward:{reputation:2},failure:{fatigue:4}},
    {id:"AE1582-ASD-FALLOW-STONE",name:"休耕地下的舊石階",tier:"D",kinds:["wild"],zones:["fallow"],location_ids:["ASD2-WILD-CROWNFALLOW"],stat:"智力",dc:14,text:"石獾洞旁露出規整石階，但沒有任何現行路標。",success:"你只標記位置並通知工務所。",fail:"土層繼續崩落，入口暫時封閉。",reward:{event_clock:1}},
    {id:"AE1582-ASD-FROST-FLARE",name:"錯時的北境烽火",tier:"C",kinds:["town","wild"],zones:["frontier_fort","frost_ridge"],location_ids:["ASD2-NORTHWATCH","ASD2-WILD-FROSTLINE"],stat:"感知",dc:16,text:"白天出現不在排程內的烽火。",success:"你確認是斷索造成的誤燃，而非入侵信號。",fail:"北望堡提高半日警戒。",reward:{reputation:2},failure:{event_clock:2}},
    {id:"AE1582-ASD-WOLF-CIRCLE",name:"白鬃座狼的繞風",tier:"C",kinds:["wild"],zones:["frost_ridge","pine_valley"],location_ids:["ASD2-WILD-FROSTLINE","ASD2-WILD-WOLFSHADOW"],stat:"感知",dc:17,text:"狼群沒有直追，而是在逆風處繞行。",success:"你提前收縮隊形並避開包圍。",fail:"戰鬥開始時隊伍位置不利。",reward:{reputation:1},failure:{fatigue:3}},
    {id:"AE1582-ASD-BASALT-HEAT",name:"黑岩下的紅光",tier:"C",kinds:["wild","dungeon"],zones:["basalt_hollow","basalt_vault"],location_ids:["ASD2-WILD-BASALTHOLLOW","ASD2-DUNGEON-BASALTVAULT"],stat:"智力",dc:16,text:"岩縫紅光週期性變強，熱氣卻沒有同步增加。",success:"你判斷是魔力聚集而非立即噴發。",fail:"你只能標記危險區並撤退。",reward:{item_pool:["ITEM-ASD2-BASALT-SCALE"],item_qty:[1,1]}},
    {id:"AE1582-ASD-CRYPT-FLAG",name:"軍墓裡未倒的旗",tier:"C",kinds:["dungeon"],zones:["military_crypt"],location_ids:["ASD2-DUNGEON-WATCHCRYPT"],stat:"意志",dc:17,text:"坍塌後仍有一面軍旗保持直立。",success:"你繞開陪葬區，沒有觸發誓骸。",fail:"金屬腳步從側室傳來。",reward:{reputation:2},failure:{fatigue:4}},
    {id:"AE1582-ASD-CHAPEL-BELL",name:"退潮後的鐘聲",tier:"C",kinds:["dungeon"],zones:["sunken_chapel"],location_ids:["ASD2-DUNGEON-REEFCHAPEL"],stat:"意志",dc:16,text:"鐘室明明積水，卻在退潮後自行響起。",success:"你先檢查繩索與潮壓，確認鐘擺仍受水流牽動。",fail:"你無法排除死靈現象，先行撤退。",reward:{event_clock:1}},
    {id:"AE1582-ASD-GRAIN-SCALE",name:"糧秤少了兩格",tier:"C",kinds:["town"],zones:["river_mill"],location_ids:["ASD2-MOONMILL"],stat:"智力",dc:15,text:"同一批糧在兩座秤上相差兩格。",success:"你查出其中一座秤受潮膨脹。",fail:"爭議貨物暫停出庫。",reward:{reputation:2}},
    {id:"AE1582-ASD-MINT-KNOCK",name:"地窖裡的規律敲擊",tier:"D",kinds:["dungeon"],zones:["old_mint"],location_ids:["ASD2-DUNGEON-OLDMINT"],stat:"感知",dc:15,text:"封閉鑄幣間傳出規律金屬聲。",success:"你發現鬆動吊鏈隨水滴擺動。",fail:"你只能封鎖側室等待工務師。",reward:{event_clock:1}},
    {id:"AE1582-ASD-MIRROR-SKY",name:"不屬於今晚的星空",tier:"B",kinds:["wild"],zones:["mirror_marsh"],location_ids:["ASD2-WILD-NIGHTMARSH"],stat:"意志",dc:20,text:"水面倒映的星位與今晚天空不同。",success:"你以岸樁與繩距維持方向，不追逐倒影。",fail:"隊伍偏離測繪線，必須消耗穩定劑撤回。",reward:{event_clock:2},failure:{fatigue:6}},
    {id:"AE1582-ASD-MIRROR-DOOR",name:"水下沒有影子的門",tier:"B",kinds:["dungeon"],zones:["mirror_ruin"],location_ids:["ASD2-DUNGEON-MIRRORDEPTH"],stat:"智力",dc:20,text:"石門在水中清晰可見，倒影卻不存在。",success:"你只做表面拓印，不嘗試開門。",fail:"你必須標記未解風險並退出。",reward:{reputation:3}},
    {id:"AE1582-ASD-CROWNROOT-LEAK",name:"封庫牆後的水聲",tier:"B",kinds:["dungeon"],zones:["sealed_archive"],location_ids:["ASD2-DUNGEON-CROWNROOT"],stat:"智力",dc:19,text:"檔案牆後出現持續水聲，但地面沒有滲水。",success:"你依工務圖找到壓力管道並關閉支閘。",fail:"封庫提高警戒，該區暫停開放。",reward:{reputation:3},failure:{event_clock:3}},
    {id:"AE1582-ASD-NOTARY-SEAL",name:"一枚重複的公證印",tier:"B",kinds:["town"],zones:["capital"],location_ids:["ASD-CAPITAL"],stat:"智力",dc:18,text:"兩份不同日期契約出現同一個磨損缺口。",success:"你交由公證人比對，不直接認定偽造者。",fail:"文件被列為爭議件，相關貨運暫停。",reward:{reputation:3}},
    {id:"AE1582-ASD-PORT-CRATE",name:"沒有貨主的海關箱",tier:"C",kinds:["town"],zones:["coast"],location_ids:["ASD-DAWNPORT"],stat:"智力",dc:16,text:"一只封箱有合法稅票，卻沒有對應貨主。",success:"你從重量與繩結查出轉運單漏登。",fail:"箱子被移入隔離倉等待查驗。",reward:{reputation:2}},
    {id:"AE1582-ASD-RELIEF-WAGON",name:"北境救護車的空位",tier:"C",kinds:["town","wild"],zones:["frontier_fort","frost_ridge"],location_ids:["ASD2-NORTHWATCH","ASD2-WILD-FROSTLINE"],stat:"意志",dc:15,text:"撤離演練要求你決定有限車位的優先順序。",success:"你依檢傷結果安排，不依身分插隊。",fail:"隊伍對順序產生爭議，演練延誤。",reward:{reputation:2}}
  ]);

  add("regional_story_arcs",[
    {id:"STORY-ASD2-01",region_id:"REG-ASD-01",tier:"C",name:"四條命脈・糧與水",chapters:["月磨糧重異常","銀穗水位爭議","夜鏡沼封鎖"],entry_quests:["Q1582-ASD-GRAIN-WEIGHT","Q1582-ASD-NIGHTMARSH-PERMIT"],theme:"民生、工程、地方自治",rule:"任何結論需由糧倉紀錄、渠務資料與現地調查共同支持。"},
    {id:"STORY-ASD2-02",region_id:"REG-ASD-01",tier:"C",name:"四條命脈・礦與火",chapters:["鐵渡封印貨袋","玄武岩熱異常","王家鍛造院鑑定"],entry_quests:["Q1582-ASD-IRONFORD-WHEEL","Q1582-ASD-BASALT-VAULT"],theme:"資源、工藝、商路",rule:"不以魔物活動直接推論有人蓄意破壞。"},
    {id:"STORY-ASD2-03",region_id:"REG-ASD-01",tier:"C",name:"北境白線",chapters:["錯時烽火","白鬃座狼","軍墓裂層","撤離線演練"],entry_quests:["Q1582-ASD-FROSTLINE-SCOUT","Q1582-ASD-WATCHCRYPT","Q1582-ASD-FRONTIER-REFUGE"],theme:"邊境、生存、守備",rule:"北境危機以可觀測事件推進，不自動升格為國戰。"},
    {id:"STORY-ASD2-04",region_id:"REG-ASD-01",tier:"B",name:"失真的印記",chapters:["舊鑄幣重量","重複公證印","跨城封條流向","王都聽證"],entry_quests:["Q1582-ASD-MINT-AUDIT","Q1582-ASD-SEAL-CHAIN"],theme:"契約、行政、走私",rule:"調查鏈允許多個責任來源，不預設王室、教會或行會為幕後者。"},
    {id:"STORY-ASD2-05",region_id:"REG-ASD-01",tier:"B",name:"王冠地下三層",chapters:["舊鑄幣所","舊蓄水廊","王冠根脈封庫"],entry_quests:["Q1582-ASD-CROWNROOT-PERMIT","Q1582-ASD-CROWNROOT"],theme:"城市基礎設施、封印、檔案",rule:"B級進入需三方許可；探索結果不得直接改寫建國正史。"},
    {id:"STORY-ASD2-06",region_id:"REG-ASD-01",tier:"B",name:"夜鏡之下",chapters:["外圈測繪","倒影異常","沼下取樣","未開之門"],entry_quests:["Q1582-ASD-NIGHTMARSH-PERMIT","Q1582-ASD-MIRROR-RUIN"],theme:"未知遺構、研究倫理、封鎖區",rule:"未知遺構保持未定來源；沒有足夠證據不得標記古代帝國、神族或龍族來源。"}
  ]);

  add("regional_adventure_hooks",[
    {id:"HOOK-ASD2-GRAIN-WATER",region_id:"REG-ASD-01",tier:"C",title:"糧袋沒有少，重量卻變輕",summary:"月磨糧倉、銀穗水位與河谷運價同時出現小幅異常。",entry_locations:["ASD2-MOONMILL","ASD-SILVER"],required_facts:["DIA-ASD2-005","DIA-ASD2-006"],linked_quests:["Q1582-ASD-GRAIN-WEIGHT","Q1582-ASD-NIGHTMARSH-PERMIT"],linked_events:["AE1582-ASD-GRAIN-SCALE"]},
    {id:"HOOK-ASD2-IRON-FIRE",region_id:"REG-ASD-01",tier:"C",title:"褪色封印與過熱礦脈",summary:"鐵渡的貨袋封印與玄武岩凹地的熱異常可能影響東境礦路。",entry_locations:["ASD2-IRONFORD","ASD-REDCLIFF"],required_facts:["DIA-ASD2-008"],linked_quests:["Q1582-ASD-IRONFORD-WHEEL","Q1582-ASD-BASALT-VAULT"],linked_events:["AE1582-ASD-ORE-SEAL","AE1582-ASD-BASALT-HEAT"]},
    {id:"HOOK-ASD2-NORTH-LINE",region_id:"REG-ASD-01",tier:"C",title:"北境白線",summary:"烽火、狼群、軍墓與撤離線共同構成一條北境地方危機鏈。",entry_locations:["ASD2-NORTHWATCH","ASD-GRAYGATE"],required_facts:["DIA-ASD2-009","DIA-ASD2-010"],linked_quests:["Q1582-ASD-FROSTLINE-SCOUT","Q1582-ASD-WATCHCRYPT","Q1582-ASD-FRONTIER-REFUGE"],linked_events:["AE1582-ASD-FROST-FLARE","AE1582-ASD-WOLF-CIRCLE"]},
    {id:"HOOK-ASD2-LOST-SEAL",region_id:"REG-ASD-01",tier:"B",title:"重複的公證印",summary:"舊鑄幣所、公證庫與跨城貨運出現可驗證的印記矛盾。",entry_locations:["ASD-CAPITAL","ASD2-IRONFORD","ASD-DAWNPORT"],required_facts:["DIA-ASD2-003","DIA-ASD2-018"],linked_quests:["Q1582-ASD-MINT-AUDIT","Q1582-ASD-SEAL-CHAIN"],linked_events:["AE1582-ASD-NOTARY-SEAL","AE1582-ASD-PORT-CRATE"]},
    {id:"HOOK-ASD2-CROWNROOT",region_id:"REG-ASD-01",tier:"B",title:"王冠地下三層",summary:"舊鑄幣所、蓄水廊與根脈封庫形成王都地下基礎設施鏈。",entry_locations:["ASD-CAPITAL"],required_facts:["DIA-ASD2-017"],linked_quests:["Q1582-ASD-CROWNROOT-PERMIT","Q1582-ASD-CROWNROOT"],linked_events:["AE1582-ASD-CROWNROOT-LEAK"]},
    {id:"HOOK-ASD2-MIRROR",region_id:"REG-ASD-01",tier:"B",title:"夜鏡之下",summary:"封鎖沼澤出現不一致倒影與未定來源石構。",entry_locations:["ASD-SILVER","ASD2-WILD-NIGHTMARSH"],required_facts:["DIA-ASD2-016"],linked_quests:["Q1582-ASD-NIGHTMARSH-PERMIT","Q1582-ASD-MIRROR-RUIN"],linked_events:["AE1582-ASD-MIRROR-SKY","AE1582-ASD-MIRROR-DOOR"]}
  ]);

  add("lore_records",[
    {id:"LORE-ASD2-01",title:"王都六區與公開權限",tier:"C",category:"城市制度",region_id:"REG-ASD-01",status:"CURRENT",text:"艾斯戴拉王都的宮城、白塔、百工、河港、舊牆與南市各有不同管理機構；公開可進入不等於可查閱全部檔案。"},
    {id:"LORE-ASD2-02",title:"河谷渠務的三層責任",tier:"C",category:"民生制度",region_id:"REG-ASD-01",status:"CURRENT",text:"農村維護支渠、月磨管理主閘、銀穗協調跨地水量，水位爭議需三層紀錄交叉驗證。"},
    {id:"LORE-ASD2-03",title:"北望堡冬季撤離線",tier:"C",category:"邊境制度",region_id:"REG-ASD-01",status:"CURRENT",text:"北望堡每年入冬前演練平民與傷員撤離，路線與補給點依雪線調整。"},
    {id:"LORE-ASD2-04",title:"碎浪救難繩標",tier:"D",category:"地方風俗",region_id:"REG-ASD-01",status:"地方記錄",text:"碎浪鎮以不同結法標示安全繩、救難繩與禁入繩，外地旅人常因看不懂而誤判。"},
    {id:"LORE-ASD2-05",title:"舊鑄幣所停用原因",tier:"C",category:"行政史",region_id:"REG-ASD-01",status:"CURRENT",text:"舊鑄幣所因王都擴建與稅關整併而停用；現存地窖仍屬公證資產。"},
    {id:"LORE-ASD2-06",title:"夜鏡沼倒影紀錄",tier:"B",category:"研究紀錄",region_id:"REG-ASD-01",status:"傳聞待核",text:"測繪員記錄到與當夜星位不一致的倒影，但尚無證據確認是魔法、光學或遺構作用。"},
    {id:"LORE-ASD2-07",title:"王冠根脈封庫用途",tier:"B",category:"城市工程",region_id:"REG-ASD-01",status:"CURRENT",text:"封庫最初用於災害時保存城市工務圖、稅籍副本與緊急物資，不等同王室寶庫。"},
    {id:"LORE-ASD2-08",title:"B級封鎖區共同原則",tier:"B",category:"冒險者制度",region_id:"REG-ASD-01",status:"CURRENT",text:"阿斯戴爾B級區域採資格、委託與多方許可制；高階角色也不能以等級跳過行政與生態限制。"}
  ]);

  add("world_timeline",[
    {id:"TL-ASD2-01",year:317,region_id:"REG-ASD-01",tier:"C",status:"CURRENT",title:"河谷水量聯合稽核",text:"銀穗、月磨與王都工務單位開始統一主渠水位格式，以降低糧運與灌溉爭議。"},
    {id:"TL-ASD2-02",year:317,region_id:"REG-ASD-01",tier:"B",status:"CURRENT",title:"王都地下封庫重新盤點",text:"外廷、白塔與冒險者公會啟動王冠根脈封庫盤點；僅限持三方許可者進入。"}
  ]);

  DB.meta=DB.meta||{};
  DB.meta.current_version="CURRENT-1.58.0";
  DB.meta.asdail_depth_revision="ASDAIL-DEPTH-2.0";
  DB.meta.asdail_depth_rules={
    region_id:"REG-ASD-01",
    accessible_tier:"F-B",
    b_tier_requires_qualification:true,
    no_s_tier_escalation:true,
    existing_save_compatible:true,
    notes:"補強王都六區、5聚落、10野外、7地下城、18固定NPC、9組織、4流派、20怪物、30物品、16技能、24委託、18奇遇與6條跨區劇情線。"
  };
})();
