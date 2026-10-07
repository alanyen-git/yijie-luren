/*
 * 異界旅人資料補丁入口
 * CURRENT-1.57.0：阿斯戴爾王國 F～B 擴充與既有內容深化包
 * 載入順序：game-data.js -> data-patches.js -> runtime.js
 */
(()=>{
  const appendUnique=(key,rows)=>{
    DB[key]=Array.isArray(DB[key])?DB[key]:[];
    const ids=new Set(DB[key].map(x=>x&&x.id).filter(Boolean));
    for(const row of rows)if(row&&row.id&&!ids.has(row.id)){DB[key].push(row);ids.add(row.id)}
  };
  const questDefaults={
  "time_limit_hours": 96,
  "base_time_limit_hours": 96,
  "target_spawn_boost": 0,
  "completion_grace_hours": 24,
  "generator_validation": "接取前驗證目標存在、可達地點可產生目標，且時限覆蓋往返、操作與安全緩衝。"
};
  const facilityDefaults={
  "time_limit_hours": 72,
  "base_time_limit_hours": 72,
  "completion_grace_hours": 24,
  "target_spawn_boost": 0,
  "source_type": "facility"
};
  appendUnique("quest_templates",[
  {
    "id": "Q155-WHITESTONE-GRAIN",
    "name": "白石丘冬糧盤點",
    "tier": "F",
    "min_level": 1,
    "max_level": 7,
    "type": "採集",
    "description": "白石丘農帶準備交付救濟糧，公會需要少量耐藏穀物核對品質。",
    "objective": {
      "kind": "gather",
      "item_id": "MAT-FOOD-05",
      "target": 4,
      "consume_on_turnin": true
    },
    "reward": [
      10,
      17
    ],
    "recommended_locations": [
      "L-WHITESTONE-FIELDS"
    ],
    "xp_reward": 12
  },
  {
    "id": "Q155-RIVER-WATCH",
    "name": "白石河中游水標巡查",
    "tier": "E",
    "min_level": 4,
    "max_level": 13,
    "type": "巡查",
    "description": "近期水位反覆，請確認中游兩處水標與纜繩樁是否仍可使用。",
    "objective": {
      "kind": "patrol",
      "location_id": "L-WHITESTONE-RIVER",
      "target": 2,
      "checkpoints": [
        "舊纜繩樁",
        "北岸水位石"
      ]
    },
    "reward": [
      24,
      40
    ],
    "recommended_locations": [
      "L-WHITESTONE-RIVER"
    ],
    "xp_reward": 28
  },
  {
    "id": "Q155-REDCLIFF-ORE",
    "name": "赤岩礦脈比對",
    "tier": "E",
    "min_level": 5,
    "max_level": 14,
    "type": "採集",
    "description": "鐵匠行會要比對赤岩坡地表層礦色，請帶回少量赤紋礦樣。",
    "objective": {
      "kind": "gather",
      "item_id": "MAT-ORE-24",
      "target": 2,
      "consume_on_turnin": true
    },
    "reward": [
      26,
      42
    ],
    "recommended_locations": [
      "L-REDCLIFF"
    ],
    "xp_reward": 28
  },
  {
    "id": "Q155-GREYPEAK-GLOW",
    "name": "灰峰幽光菇補給",
    "tier": "E",
    "min_level": 5,
    "max_level": 14,
    "type": "採集",
    "description": "灰峰獵徑的夜間標記需要幽光菇汁，請從灰峰松林採集合格樣本。",
    "objective": {
      "kind": "gather",
      "item_id": "MAT-HERB-07",
      "target": 2,
      "consume_on_turnin": true
    },
    "reward": [
      25,
      41
    ],
    "recommended_locations": [
      "L-GREYPEAK-PINES"
    ],
    "xp_reward": 28
  },
  {
    "id": "Q155-QUARRY-SURVEY",
    "name": "黑石採坑邊坡複查",
    "tier": "E",
    "min_level": 5,
    "max_level": 14,
    "type": "偵察",
    "description": "採坑停工後仍有落石聲，請完成兩次外圍探索並標出不穩定邊坡。",
    "objective": {
      "kind": "action",
      "action": "探索",
      "location_id": "L-QUARRY",
      "target": 2
    },
    "reward": [
      28,
      45
    ],
    "recommended_locations": [
      "L-QUARRY"
    ],
    "xp_reward": 28
  },
  {
    "id": "Q155-CISTERN-SURVEY",
    "name": "地下蓄水道水門檢查",
    "tier": "E",
    "min_level": 6,
    "max_level": 15,
    "type": "偵察",
    "description": "白石城擔心水門卡死，請進入地下蓄水道確認兩段閘門。",
    "objective": {
      "kind": "action",
      "action": "探索",
      "location_id": "D-WHITESTONE-CISTERN",
      "target": 2
    },
    "reward": [
      30,
      48
    ],
    "recommended_locations": [
      "D-WHITESTONE-CISTERN"
    ],
    "xp_reward": 28
  },
  {
    "id": "Q155-HIGHLAND-PATROL",
    "name": "風牧高地牧道巡查",
    "tier": "D",
    "min_level": 10,
    "max_level": 26,
    "type": "巡查",
    "description": "高地牧群轉場前需要確認避風石圈與南坡水槽，請完成兩處巡查。",
    "objective": {
      "kind": "patrol",
      "location_id": "L-HIGHLAND",
      "target": 2,
      "checkpoints": [
        "避風石圈",
        "南坡水槽"
      ]
    },
    "reward": [
      52,
      84
    ],
    "recommended_locations": [
      "L-HIGHLAND"
    ],
    "xp_reward": 65
  },
  {
    "id": "Q155-MIST-HUT",
    "name": "霧林獵舍陷阱清查",
    "tier": "D",
    "min_level": 11,
    "max_level": 27,
    "type": "偵察",
    "description": "舊獵舍周圍疑有失控陷阱，請進行兩次探索並記錄安全路線。",
    "objective": {
      "kind": "action",
      "action": "探索",
      "location_id": "D-MIST-HUT",
      "target": 2
    },
    "reward": [
      56,
      88
    ],
    "recommended_locations": [
      "D-MIST-HUT"
    ],
    "xp_reward": 65
  },
  {
    "id": "Q155-SALT-CRYPT",
    "name": "鹽風墓室外環測繪",
    "tier": "D",
    "min_level": 12,
    "max_level": 28,
    "type": "偵察",
    "description": "鹽蝕讓墓室外環結構不穩，請完成兩次探索，禁止擅動葬具。",
    "objective": {
      "kind": "action",
      "action": "探索",
      "location_id": "D-SALT-CRYPT",
      "target": 2
    },
    "reward": [
      58,
      92
    ],
    "recommended_locations": [
      "D-SALT-CRYPT"
    ],
    "xp_reward": 65
  },
  {
    "id": "Q155-GREYPEAK-GEM",
    "name": "灰峰舊礦紅寶石樣本",
    "tier": "D",
    "min_level": 12,
    "max_level": 28,
    "type": "採集",
    "description": "灰峰礦務所要確認舊鐵礦是否混有紅寶石伴生層，請帶回一枚樣本。",
    "objective": {
      "kind": "gather",
      "item_id": "MAT-GEM-01",
      "target": 1,
      "consume_on_turnin": true
    },
    "reward": [
      62,
      96
    ],
    "recommended_locations": [
      "D-GREYPEAK-MINE"
    ],
    "xp_reward": 65
  },
  {
    "id": "Q155-SUNKEN-FORT",
    "name": "沉橋舊堡通道勘查",
    "tier": "D",
    "min_level": 13,
    "max_level": 29,
    "type": "偵察",
    "description": "白石城準備封閉危險通道，請完成兩次探索並標記可撤退路線。",
    "objective": {
      "kind": "action",
      "action": "探索",
      "location_id": "D-WHITESTONE-FORT",
      "target": 2
    },
    "reward": [
      60,
      95
    ],
    "recommended_locations": [
      "D-WHITESTONE-FORT"
    ],
    "xp_reward": 65
  },
  {
    "id": "Q155-ASHGROVE",
    "name": "灰燼林地火痕調查",
    "tier": "C",
    "min_level": 20,
    "max_level": 42,
    "type": "偵察",
    "description": "灰燼林地出現不合季節的新火痕，請完成三次探索並區分自然火與人為火。",
    "objective": {
      "kind": "action",
      "action": "探索",
      "location_id": "L-ASHGROVE",
      "target": 3
    },
    "reward": [
      108,
      158
    ],
    "recommended_locations": [
      "L-ASHGROVE"
    ],
    "xp_reward": 140
  },
  {
    "id": "Q155-STARMOOR",
    "name": "星落荒原界碑復核",
    "tier": "C",
    "min_level": 21,
    "max_level": 43,
    "type": "巡查",
    "description": "荒原舊界碑可能因地表位移偏離，請依序確認三處標記。",
    "objective": {
      "kind": "patrol",
      "location_id": "L-STARMOOR",
      "target": 3,
      "checkpoints": [
        "西側碎碑",
        "中央黑石標",
        "東緣風蝕柱"
      ]
    },
    "reward": [
      112,
      164
    ],
    "recommended_locations": [
      "L-STARMOOR"
    ],
    "xp_reward": 140
  },
  {
    "id": "Q155-WIND-TOMB",
    "name": "高地風墓外層記錄",
    "tier": "C",
    "min_level": 22,
    "max_level": 44,
    "type": "偵察",
    "description": "學者只委託記錄風墓外層構造，不得進行破壞性挖掘。",
    "objective": {
      "kind": "action",
      "action": "探索",
      "location_id": "D-WIND-TOMB",
      "target": 3
    },
    "reward": [
      118,
      170
    ],
    "recommended_locations": [
      "D-WIND-TOMB"
    ],
    "xp_reward": 140
  },
  {
    "id": "Q155-GREYPEAK-KEEP",
    "name": "邊牆廢堡警戒圖",
    "tier": "C",
    "min_level": 23,
    "max_level": 45,
    "type": "偵察",
    "description": "邊境守軍需要更新廢堡警戒圖，請完成三次探索並確認退路。",
    "objective": {
      "kind": "action",
      "action": "探索",
      "location_id": "D-GREYPEAK-KEEP",
      "target": 3
    },
    "reward": [
      122,
      178
    ],
    "recommended_locations": [
      "D-GREYPEAK-KEEP"
    ],
    "xp_reward": 140
  }
].map(q=>({...questDefaults,...q})));
  appendUnique("shop_quests",[
  {
    "id": "SQ155-ALC-MUSHROOM",
    "facility": "alchemy",
    "name": "乾燥菇材急缺",
    "tier": "F",
    "min_level": 1,
    "max_level": 8,
    "reward": [
      9,
      15
    ],
    "desc": "煉金店需要一批可乾燥處理的普通蘑菇。",
    "objective": {
      "kind": "gather",
      "item_id": "I-MUSHROOM",
      "target": 3,
      "consume_on_turnin": true
    },
    "recommended_locations": [
      "L-WOOD",
      "D-AQUEDUCT",
      "D-CELLAR"
    ],
    "xp_reward": 12
  },
  {
    "id": "SQ155-ALC-GLOW",
    "facility": "alchemy",
    "name": "幽光菇液補單",
    "tier": "E",
    "min_level": 5,
    "max_level": 15,
    "reward": [
      24,
      39
    ],
    "desc": "夜行藥劑的底液不足，需要兩份幽光菇樣本。",
    "objective": {
      "kind": "gather",
      "item_id": "MAT-HERB-07",
      "target": 2,
      "consume_on_turnin": true
    },
    "recommended_locations": [
      "L-MISTWOOD",
      "L-GREYPEAK-PINES"
    ],
    "xp_reward": 28
  },
  {
    "id": "SQ155-CH-HERB",
    "facility": "church",
    "name": "救助室草藥補充",
    "tier": "F",
    "min_level": 1,
    "max_level": 8,
    "reward": [
      9,
      15
    ],
    "desc": "教會救助室需要補充可處理擦傷的普通止血草。",
    "objective": {
      "kind": "gather",
      "item_id": "I-HERB",
      "target": 4,
      "consume_on_turnin": true
    },
    "recommended_locations": [
      "L-WOOD",
      "L-RIVER",
      "L-LOWFIELD"
    ],
    "xp_reward": 12
  },
  {
    "id": "SQ155-CH-BANDAGE",
    "facility": "church",
    "name": "旅人救濟繃帶",
    "tier": "F",
    "min_level": 1,
    "max_level": 8,
    "reward": [
      8,
      14
    ],
    "desc": "長途旅人增加，教會需要乾淨繃帶補充救濟箱。",
    "objective": {
      "kind": "item",
      "item_id": "I-BANDAGE",
      "target": 3,
      "consume_on_turnin": true
    },
    "recommended_locations": [],
    "xp_reward": 12
  }
].map(q=>({...facilityDefaults,...q,turnin_facility:q.facility})));
  appendUnique("adventure_event_templates",[
  {
    "id": "AE155-GRAYOAK-MARKER",
    "name": "倒伏的林徑標樁",
    "tier": "F",
    "kinds": [
      "wild"
    ],
    "zones": [
      "town_outskirts"
    ],
    "location_ids": [
      "L-WOOD",
      "L-BIRCH"
    ],
    "stat": "力量",
    "dc": 10,
    "text": "林徑標樁被雨水沖倒，岔路上的腳印已開始混在一起。",
    "success": "你重新立穩標樁，並把危險岔路用枯枝封住。",
    "fail": "濕土撐不住標樁，你只來得及留下臨時記號。",
    "reward": {
      "money": [
        2,
        4
      ],
      "reputation": 1
    },
    "failure": {
      "fatigue": 2
    }
  },
  {
    "id": "AE155-RIVER-GAUGE",
    "name": "失準的河岸水標",
    "tier": "F",
    "kinds": [
      "wild"
    ],
    "zones": [
      "town_outskirts"
    ],
    "location_ids": [
      "L-RIVER",
      "L-WHITESTONE-RIVER"
    ],
    "stat": "智力",
    "dc": 11,
    "text": "河岸水標被漂木撞歪，照著它判斷水位可能誤導渡河者。",
    "success": "你比對舊刻痕修正角度，並把異常記錄交給巡河人。",
    "fail": "水流妨礙測量，你只能先掛上警示布條。",
    "reward": {
      "money": [
        2,
        5
      ],
      "event_clock": 1
    }
  },
  {
    "id": "AE155-FIELD-DITCH",
    "name": "堵塞的田間水溝",
    "tier": "F",
    "kinds": [
      "wild"
    ],
    "zones": [
      "town_outskirts"
    ],
    "location_ids": [
      "L-LOWFIELD",
      "L-WHITESTONE-FIELDS"
    ],
    "stat": "體力",
    "dc": 10,
    "text": "枯葉和淤泥堵住水溝，水正慢慢漫向低田。",
    "success": "你清開最窄的一段，積水重新流回支渠。",
    "fail": "淤泥比預想更深，只能通知附近農戶處理。",
    "reward": {
      "item_pool": [
        "I-BREAD",
        "I-BERRY"
      ],
      "item_qty": [
        1,
        2
      ]
    },
    "failure": {
      "fatigue": 3
    }
  },
  {
    "id": "AE155-QUARRY-LEDGER",
    "name": "採坑邊的濕帳頁",
    "tier": "E",
    "kinds": [
      "wild"
    ],
    "zones": [
      "town_outskirts"
    ],
    "location_ids": [
      "L-QUARRY",
      "L-REDCLIFF"
    ],
    "stat": "智力",
    "dc": 12,
    "text": "石縫裡卡著幾頁被雨浸濕的採料帳，仍看得見車次與礦色記號。",
    "success": "你整理出可辨識的紀錄，交給地方礦務人員核對。",
    "fail": "墨跡化開太嚴重，只能辨認出日期。",
    "reward": {
      "money": [
        4,
        8
      ],
      "event_clock": 1
    }
  },
  {
    "id": "AE155-MARSH-LANTERN",
    "name": "沼地廢棄引路燈",
    "tier": "E",
    "kinds": [
      "wild"
    ],
    "zones": [
      "town_outskirts"
    ],
    "location_ids": [
      "L-MARSH"
    ],
    "stat": "意志",
    "dc": 12,
    "text": "蘆葦間掛著一盞熄滅的引路燈，燈座旁有近期踩踏痕跡。",
    "success": "你確認這是採藥人留下的撤退標記，並補上乾燥燈芯。",
    "fail": "霧氣遮住足跡方向，你沒有離開安全地面。",
    "reward": {
      "item_pool": [
        "I-HERB",
        "I-MINT"
      ],
      "item_qty": [
        1,
        2
      ],
      "event_clock": 1
    },
    "failure": {
      "fatigue": 2
    }
  },
  {
    "id": "AE155-PASS-ROPE",
    "name": "山徑斷裂的扶繩",
    "tier": "D",
    "kinds": [
      "wild"
    ],
    "zones": [
      "frontier"
    ],
    "location_ids": [
      "L-PASS",
      "L-GREYPEAK-RIDGE"
    ],
    "stat": "敏捷",
    "dc": 13,
    "text": "一段扶繩被落石割斷，狹窄轉角只剩鬆動的木樁。",
    "success": "你利用舊繩重新打結固定，至少能讓下一隊安全通過。",
    "fail": "木樁承重不足，你改以石堆標出危險處。",
    "reward": {
      "money": [
        6,
        10
      ],
      "reputation": 1
    },
    "failure": {
      "fatigue": 4
    }
  },
  {
    "id": "AE155-OLDROAD-STONE",
    "name": "古王道里程石",
    "tier": "D",
    "kinds": [
      "wild"
    ],
    "zones": [
      "frontier"
    ],
    "location_ids": [
      "L-OLDROAD"
    ],
    "stat": "智力",
    "dc": 13,
    "text": "半埋的里程石露出兩行舊刻字，方向和現行道路略有偏差。",
    "success": "你辨認出它指向已廢棄的渡口，留下可供公會查證的拓記。",
    "fail": "刻字磨損嚴重，你沒有把猜測當成史實。",
    "reward": {
      "event_clock": 1,
      "skill_xp_gain": 5
    }
  },
  {
    "id": "AE155-MOONLAKE-NET",
    "name": "纏住水鳥的廢網",
    "tier": "E",
    "kinds": [
      "wild"
    ],
    "zones": [
      "frontier"
    ],
    "location_ids": [
      "L-MOONLAKE"
    ],
    "stat": "敏捷",
    "dc": 12,
    "text": "舊漁網纏在蘆葦根部，一隻水鳥正努力掙脫。",
    "success": "你割開打結處放走水鳥，也收起會繼續傷害動物的廢網。",
    "fail": "水鳥先自行掙脫飛走，你只能清理岸邊剩餘網線。",
    "reward": {
      "item_pool": [
        "I-RAWFISH"
      ],
      "item_qty": [
        1,
        1
      ],
      "reputation": 1
    }
  },
  {
    "id": "AE155-ASHGROVE-EMBER",
    "name": "尚有餘溫的灰坑",
    "tier": "C",
    "kinds": [
      "wild"
    ],
    "zones": [
      "deep_wild"
    ],
    "location_ids": [
      "L-ASHGROVE"
    ],
    "stat": "智力",
    "dc": 15,
    "text": "灰坑表面已冷，深處卻仍有餘溫，周圍沒有正常營火留下的食物殘渣。",
    "success": "你辨認出多次覆土的痕跡，記下風向與腳印供後續調查。",
    "fail": "灰層彼此混雜，你只確定這不是今天留下的火。",
    "reward": {
      "event_clock": 1,
      "skill_xp_gain": 7
    },
    "failure": {
      "fatigue": 3
    }
  },
  {
    "id": "AE155-STARMOOR-GLASS",
    "name": "荒原風蝕玻璃片",
    "tier": "C",
    "kinds": [
      "wild"
    ],
    "zones": [
      "deep_wild"
    ],
    "location_ids": [
      "L-STARMOOR"
    ],
    "stat": "幸運",
    "dc": 15,
    "text": "黑砂間露出一片被高熱熔融又風蝕的玻璃狀薄片。",
    "success": "你在不破壞周邊地層的前提下取下小樣，記錄原位。",
    "fail": "薄片一觸即碎，你只留下圖記。",
    "reward": {
      "money": [
        8,
        12
      ],
      "event_clock": 1
    }
  },
  {
    "id": "AE155-AQUEDUCT-GATE",
    "name": "卡死的舊水門",
    "tier": "E",
    "kinds": [
      "dungeon"
    ],
    "zones": [
      "dungeon"
    ],
    "location_ids": [
      "D-AQUEDUCT",
      "D-WHITESTONE-CISTERN"
    ],
    "stat": "力量",
    "dc": 12,
    "text": "鏽蝕水門卡在半開位置，水流讓地面越來越滑。",
    "success": "你清掉轉軸碎石，讓水門回到可控的位置。",
    "fail": "機構太脆弱，你停止施力並標出危險點。",
    "reward": {
      "money": [
        4,
        8
      ],
      "reputation": 1
    },
    "failure": {
      "fatigue": 3
    }
  },
  {
    "id": "AE155-WATCH-RECORDS",
    "name": "牆縫裡的巡夜簿",
    "tier": "E",
    "kinds": [
      "dungeon"
    ],
    "zones": [
      "dungeon"
    ],
    "location_ids": [
      "D-WATCH",
      "D-WHITESTONE-FORT"
    ],
    "stat": "智力",
    "dc": 12,
    "text": "石牆夾層中塞著殘破巡夜簿，最後幾頁只剩輪值符號。",
    "success": "你依墨色與紙張順序復原出最後一段值勤紀錄。",
    "fail": "紙張一碰就剝落，你停止翻動以免毀損。",
    "reward": {
      "event_clock": 1,
      "skill_xp_gain": 4
    }
  },
  {
    "id": "AE155-MINE-SUPPORT",
    "name": "發出裂聲的舊支柱",
    "tier": "D",
    "kinds": [
      "dungeon"
    ],
    "zones": [
      "dungeon"
    ],
    "location_ids": [
      "D-MINE",
      "D-GREYPEAK-MINE"
    ],
    "stat": "意志",
    "dc": 14,
    "text": "礦道木柱傳出細碎裂聲，落塵正從橫樑接縫滑下。",
    "success": "你辨認受力方向，繞開危險段並留下清楚標記。",
    "fail": "你無法確認哪一根先斷，只能立刻後撤。",
    "reward": {
      "event_clock": 1,
      "skill_xp_gain": 6
    },
    "failure": {
      "fatigue": 4
    }
  },
  {
    "id": "AE155-SALT-OFFERING",
    "name": "鹽殼下的祭盤",
    "tier": "D",
    "kinds": [
      "dungeon"
    ],
    "zones": [
      "dungeon"
    ],
    "location_ids": [
      "D-SALT-CRYPT"
    ],
    "stat": "意志",
    "dc": 14,
    "text": "石盤被厚鹽殼覆蓋，只露出與現代禮儀不同的排列痕跡。",
    "success": "你只做非破壞性記錄，沒有擅自移動任何葬祭物。",
    "fail": "鹽殼太脆，你放棄清理以免破壞原貌。",
    "reward": {
      "reputation": 1,
      "event_clock": 1
    }
  },
  {
    "id": "AE155-WIND-BELLS",
    "name": "無風自響的石片",
    "tier": "C",
    "kinds": [
      "dungeon"
    ],
    "zones": [
      "dungeon"
    ],
    "location_ids": [
      "D-WIND-TOMB",
      "D-SHRINE"
    ],
    "stat": "智力",
    "dc": 15,
    "text": "薄石片懸在狹縫中，氣流通過時發出彼此呼應的低聲。",
    "success": "你找出聲音來自隱蔽風道，排除立即性的超自然威脅。",
    "fail": "回聲來源太多，你沒有深入狹縫冒險。",
    "reward": {
      "event_clock": 1,
      "skill_xp_gain": 7
    }
  },
  {
    "id": "AE155-CATACOMB-MARKS",
    "name": "重複出現的封門記號",
    "tier": "C",
    "kinds": [
      "dungeon"
    ],
    "zones": [
      "dungeon"
    ],
    "location_ids": [
      "D-CATACOMB"
    ],
    "stat": "意志",
    "dc": 15,
    "text": "數道封門記號年代不同，卻都刻意避開同一塊石板。",
    "success": "你分辨出記號先後，確認石板後方應暫時視為危險區。",
    "fail": "年代與刻法互相矛盾，你沒有貿然解除封門。",
    "reward": {
      "reputation": 1,
      "event_clock": 1,
      "skill_xp_gain": 6
    }
  },
  {
    "id": "AE155-MIST-HUT-TRAP",
    "name": "鏽死的獵舍機括",
    "tier": "D",
    "kinds": [
      "dungeon"
    ],
    "zones": [
      "dungeon"
    ],
    "location_ids": [
      "D-MIST-HUT"
    ],
    "stat": "敏捷",
    "dc": 14,
    "text": "門框下藏著老舊機括，繩索雖腐爛，金屬彈臂仍帶張力。",
    "success": "你卸掉張力並把零件集中，避免後來者誤觸。",
    "fail": "機括突然鬆脫，你及時退開但耗了不少力氣。",
    "reward": {
      "money": [
        6,
        10
      ],
      "reputation": 1
    },
    "failure": {
      "fatigue": 5
    }
  }
]);
  appendUnique("regional_rumors",[
  {
    "id": "RUMOR-155-01",
    "region_id": "REG-18",
    "theme": "水路",
    "public_claim": "白石河中游的舊水標比去年偏了一掌，有船夫懷疑河床正在改道。",
    "reliability": "中",
    "truth_mode": "plausible",
    "source_pool": [
      "酒館",
      "旅店",
      "市場",
      "守衛",
      "公會",
      "商隊",
      "獵人",
      "地方居民"
    ],
    "verification": "rumor",
    "generator_uses": [
      "NPC對話",
      "情報系統",
      "探索提示",
      "委託前置線索",
      "錯誤情報"
    ],
    "rule": "傳聞只能成為可調查線索，不得直接改寫CURRENT canonical狀態。"
  },
  {
    "id": "RUMOR-155-02",
    "region_id": "REG-18",
    "theme": "礦務",
    "public_claim": "灰峰舊鐵礦最近有人在廢礦車上發現紅色晶屑，但礦務所還沒確認來源。",
    "reliability": "低",
    "truth_mode": "contested",
    "source_pool": [
      "酒館",
      "旅店",
      "市場",
      "守衛",
      "公會",
      "商隊",
      "獵人",
      "地方居民"
    ],
    "verification": "rumor",
    "generator_uses": [
      "NPC對話",
      "情報系統",
      "探索提示",
      "委託前置線索",
      "錯誤情報"
    ],
    "rule": "傳聞只能成為可調查線索，不得直接改寫CURRENT canonical狀態。"
  },
  {
    "id": "RUMOR-155-03",
    "region_id": "REG-18",
    "theme": "道路",
    "public_claim": "風裂山徑有兩段扶繩被割斷，究竟是落石還是人為仍沒有定論。",
    "reliability": "中",
    "truth_mode": "plausible",
    "source_pool": [
      "酒館",
      "旅店",
      "市場",
      "守衛",
      "公會",
      "商隊",
      "獵人",
      "地方居民"
    ],
    "verification": "rumor",
    "generator_uses": [
      "NPC對話",
      "情報系統",
      "探索提示",
      "委託前置線索",
      "錯誤情報"
    ],
    "rule": "傳聞只能成為可調查線索，不得直接改寫CURRENT canonical狀態。"
  },
  {
    "id": "RUMOR-155-04",
    "region_id": "REG-18",
    "theme": "商路",
    "public_claim": "綠灣鎮的鹽車改走北線後，柳橋鎮的醃肉價錢可能會短期上揚。",
    "reliability": "中",
    "truth_mode": "plausible",
    "source_pool": [
      "酒館",
      "旅店",
      "市場",
      "守衛",
      "公會",
      "商隊",
      "獵人",
      "地方居民"
    ],
    "verification": "rumor",
    "generator_uses": [
      "NPC對話",
      "情報系統",
      "探索提示",
      "委託前置線索",
      "錯誤情報"
    ],
    "rule": "傳聞只能成為可調查線索，不得直接改寫CURRENT canonical狀態。"
  },
  {
    "id": "RUMOR-155-05",
    "region_id": "REG-18",
    "theme": "遺跡",
    "public_claim": "古王道殘段的里程石似乎指向一座已不在地圖上的渡口。",
    "reliability": "低",
    "truth_mode": "exaggerated",
    "source_pool": [
      "酒館",
      "旅店",
      "市場",
      "守衛",
      "公會",
      "商隊",
      "獵人",
      "地方居民"
    ],
    "verification": "rumor",
    "generator_uses": [
      "NPC對話",
      "情報系統",
      "探索提示",
      "委託前置線索",
      "錯誤情報"
    ],
    "rule": "傳聞只能成為可調查線索，不得直接改寫CURRENT canonical狀態。"
  },
  {
    "id": "RUMOR-155-06",
    "region_id": "REG-18",
    "theme": "生態",
    "public_claim": "霧松林的幽光菇今年提早出現，採藥人認為與連日濕冷有關。",
    "reliability": "中",
    "truth_mode": "plausible",
    "source_pool": [
      "酒館",
      "旅店",
      "市場",
      "守衛",
      "公會",
      "商隊",
      "獵人",
      "地方居民"
    ],
    "verification": "rumor",
    "generator_uses": [
      "NPC對話",
      "情報系統",
      "探索提示",
      "委託前置線索",
      "錯誤情報"
    ],
    "rule": "傳聞只能成為可調查線索，不得直接改寫CURRENT canonical狀態。"
  },
  {
    "id": "RUMOR-155-07",
    "region_id": "REG-18",
    "theme": "治安",
    "public_claim": "沉橋舊堡附近的腳印不像固定營地，更像幾支小隊輪流借道。",
    "reliability": "低",
    "truth_mode": "contested",
    "source_pool": [
      "酒館",
      "旅店",
      "市場",
      "守衛",
      "公會",
      "商隊",
      "獵人",
      "地方居民"
    ],
    "verification": "rumor",
    "generator_uses": [
      "NPC對話",
      "情報系統",
      "探索提示",
      "委託前置線索",
      "錯誤情報"
    ],
    "rule": "傳聞只能成為可調查線索，不得直接改寫CURRENT canonical狀態。"
  },
  {
    "id": "RUMOR-155-08",
    "region_id": "REG-18",
    "theme": "民生",
    "public_claim": "白石丘農帶正在補修水溝，近期會增加短工與運糧委託。",
    "reliability": "高",
    "truth_mode": "plausible",
    "source_pool": [
      "酒館",
      "旅店",
      "市場",
      "守衛",
      "公會",
      "商隊",
      "獵人",
      "地方居民"
    ],
    "verification": "rumor",
    "generator_uses": [
      "NPC對話",
      "情報系統",
      "探索提示",
      "委託前置線索",
      "錯誤情報"
    ],
    "rule": "傳聞只能成為可調查線索，不得直接改寫CURRENT canonical狀態。"
  },
  {
    "id": "RUMOR-155-09",
    "region_id": "REG-18",
    "theme": "祭俗",
    "public_claim": "鹽風墓室外有人留下新鮮花束，但附近村落沒人承認是自己送的。",
    "reliability": "低",
    "truth_mode": "contested",
    "source_pool": [
      "酒館",
      "旅店",
      "市場",
      "守衛",
      "公會",
      "商隊",
      "獵人",
      "地方居民"
    ],
    "verification": "rumor",
    "generator_uses": [
      "NPC對話",
      "情報系統",
      "探索提示",
      "委託前置線索",
      "錯誤情報"
    ],
    "rule": "傳聞只能成為可調查線索，不得直接改寫CURRENT canonical狀態。"
  },
  {
    "id": "RUMOR-155-10",
    "region_id": "REG-18",
    "theme": "天候",
    "public_claim": "風牧高地的牧人說今年側風轉早，轉場時間可能提前。",
    "reliability": "中",
    "truth_mode": "plausible",
    "source_pool": [
      "酒館",
      "旅店",
      "市場",
      "守衛",
      "公會",
      "商隊",
      "獵人",
      "地方居民"
    ],
    "verification": "rumor",
    "generator_uses": [
      "NPC對話",
      "情報系統",
      "探索提示",
      "委託前置線索",
      "錯誤情報"
    ],
    "rule": "傳聞只能成為可調查線索，不得直接改寫CURRENT canonical狀態。"
  }
]);
  appendUnique("regional_life_events",[
  {
    "id": "RLE-155-01",
    "region_id": "REG-18",
    "kind": "river_maintenance",
    "name": "白石河水標巡檢",
    "text": "船夫、巡河人與地方工匠共同核對水位石、纜繩樁與淺灘變化。",
    "impact": "增加水路巡查、修繕與短途護送委託；不保證河道永久安全。"
  },
  {
    "id": "RLE-155-02",
    "region_id": "REG-18",
    "kind": "forest_rotation",
    "name": "灰橡林採集輪休",
    "text": "巡林者依採集壓力輪流封閉小片林地，讓草藥與幼木恢復。",
    "impact": "部分資源點短期減產，其它合法採集區需求提高。"
  },
  {
    "id": "RLE-155-03",
    "region_id": "REG-18",
    "kind": "mine_inspection",
    "name": "灰峰舊礦安全複查",
    "text": "礦務人員重新標示塌陷區、舊支柱與可通行礦道。",
    "impact": "生成測繪、礦樣與撤退路線委託，不直接恢復大規模採礦。"
  },
  {
    "id": "RLE-155-04",
    "region_id": "REG-18",
    "kind": "pasture_shift",
    "name": "風牧高地轉場期",
    "text": "牧群依風向與水草狀況在高地石圈間移動。",
    "impact": "增加牧道巡查、失物與野獸驅離事件。"
  },
  {
    "id": "RLE-155-05",
    "region_id": "REG-18",
    "kind": "caravan_pressure",
    "name": "北線商隊改道",
    "text": "山徑落石或河道水位會讓商隊在柳橋、白石與灰峰之間改走替代線。",
    "impact": "地區進口價格小幅波動，補給委託依市場飽和度調整。"
  },
  {
    "id": "RLE-155-06",
    "region_id": "REG-18",
    "kind": "ruin_preservation",
    "name": "地方遺構封存週",
    "text": "學者、公會與地方守衛暫時限制破壞性挖掘，只接受記錄與測繪。",
    "impact": "遺跡探索偏向非破壞調查，稀有物不因活動無限產出。"
  }
]);
  appendUnique("cultural_festivals",[
  {
    "id": "FEST-155-01",
    "name": "白石河定標日",
    "culture_id": "CUL-018",
    "region_id": "REG-18",
    "season": "春季",
    "timing": "春中",
    "public": true,
    "activities": [
      "巡河人重畫水標",
      "橋工檢查繩樁",
      "居民在河岸交換乾糧"
    ],
    "gameplay_hooks": [
      "水路巡查",
      "修繕材料",
      "失物與短途護送"
    ],
    "rule": "節慶只改變地方活動與有限供需，不保證大型事件。"
  },
  {
    "id": "FEST-155-02",
    "name": "灰峰熄爐夜",
    "culture_id": "CUL-018",
    "region_id": "REG-18",
    "season": "冬季",
    "timing": "冬初",
    "public": true,
    "activities": [
      "工匠輪流熄爐檢修",
      "礦工追悼事故亡者",
      "行會公開安全紀錄"
    ],
    "gameplay_hooks": [
      "礦道測繪",
      "工具修繕",
      "地方史與工匠對話"
    ],
    "rule": "紀念活動不得被生成器改寫為神蹟或全境災變。"
  }
]);
  appendUnique("local_historical_incidents",[
  {
    "id": "LOCAL-HIST-155-01",
    "region_id": "REG-18",
    "year": 146,
    "title": "白石河第二次改標",
    "summary": "連續兩年春洪使中游淺灘移位，地方船夫與橋工共同重設水標。",
    "verification": "recorded",
    "world_scale": false,
    "generator_uses": [
      "地方誌",
      "NPC閒談",
      "遺跡線索",
      "區域委託",
      "節慶／紀念日"
    ],
    "rule": "地方微歷史不自動升格為影響全大陸的重大事件。"
  },
  {
    "id": "LOCAL-HIST-155-02",
    "region_id": "REG-18",
    "year": 233,
    "title": "灰峰礦道封閉令",
    "summary": "一次支柱連鎖倒塌後，礦務所封閉三條深層舊道，僅保留外環巡檢。",
    "verification": "recorded",
    "world_scale": false,
    "generator_uses": [
      "地方誌",
      "NPC閒談",
      "遺跡線索",
      "區域委託",
      "節慶／紀念日"
    ],
    "rule": "地方微歷史不自動升格為影響全大陸的重大事件。"
  },
  {
    "id": "LOCAL-HIST-155-03",
    "region_id": "REG-18",
    "year": 271,
    "title": "沉橋舊堡退役",
    "summary": "新商路與河橋完工後，沉橋舊堡失去常駐守軍，只保留季節性巡查。",
    "verification": "recorded",
    "world_scale": false,
    "generator_uses": [
      "地方誌",
      "NPC閒談",
      "遺跡線索",
      "區域委託",
      "節慶／紀念日"
    ],
    "rule": "地方微歷史不自動升格為影響全大陸的重大事件。"
  },
  {
    "id": "LOCAL-HIST-155-04",
    "region_id": "REG-18",
    "year": 309,
    "title": "風牧高地石圈修復",
    "summary": "牧戶與灰峰工匠修復三座避風石圈，重新建立高地轉場路線。",
    "verification": "recorded",
    "world_scale": false,
    "generator_uses": [
      "地方誌",
      "NPC閒談",
      "遺跡線索",
      "區域委託",
      "節慶／紀念日"
    ],
    "rule": "地方微歷史不自動升格為影響全大陸的重大事件。"
  }
]);
  appendUnique("regional_folklore",[
  {
    "id": "FOLK-155-01",
    "region_id": "REG-18",
    "title": "灰峰會記住敲擊聲",
    "text": "老礦工說同一處若連敲三次仍沒有回音，就代表山體正在『吞聲』，其實多半是提醒新人注意鬆軟岩層。",
    "verification": "oral_tradition",
    "generator_uses": [
      "酒館閒談",
      "兒童故事",
      "旅行警告",
      "地方奇遇",
      "錯誤線索／真線索混合"
    ],
    "truth_rule": "傳說本身可存在，但不得自動把超自然解釋視為客觀事實。"
  },
  {
    "id": "FOLK-155-02",
    "region_id": "REG-18",
    "title": "風牧石圈不留空位",
    "text": "牧人過夜會在石圈入口留一塊小石，表示仍有人在外巡看，後來被說成是替風靈保留座位。",
    "verification": "oral_tradition",
    "generator_uses": [
      "酒館閒談",
      "兒童故事",
      "旅行警告",
      "地方奇遇",
      "錯誤線索／真線索混合"
    ],
    "truth_rule": "傳說本身可存在，但不得自動把超自然解釋視為客觀事實。"
  },
  {
    "id": "FOLK-155-03",
    "region_id": "REG-18",
    "title": "鹽風花束",
    "text": "有人說無名花束會替迷路者記住歸途，也有人認為只是祭掃者不願暴露家族關係。",
    "verification": "oral_tradition",
    "generator_uses": [
      "酒館閒談",
      "兒童故事",
      "旅行警告",
      "地方奇遇",
      "錯誤線索／真線索混合"
    ],
    "truth_rule": "傳說本身可存在，但不得自動把超自然解釋視為客觀事實。"
  },
  {
    "id": "FOLK-155-04",
    "region_id": "REG-18",
    "title": "里程石背面的路",
    "text": "孩童相信古王道里程石背後藏著另一條路；巡路人則說那只是教孩子不要離開正面可見的官道。",
    "verification": "oral_tradition",
    "generator_uses": [
      "酒館閒談",
      "兒童故事",
      "旅行警告",
      "地方奇遇",
      "錯誤線索／真線索混合"
    ],
    "truth_rule": "傳說本身可存在，但不得自動把超自然解釋視為客觀事實。"
  }
]);

  const pack=(DB.generator_material_packs||[]).find(x=>x.region_id==="REG-18");
  if(pack){
    const merge=(key,ids)=>pack[key]=[...new Set([...(pack[key]||[]),...ids])];
    merge("festival_ids",["FEST-155-01","FEST-155-02"]);
    merge("local_history_ids",["LOCAL-HIST-155-01","LOCAL-HIST-155-02","LOCAL-HIST-155-03","LOCAL-HIST-155-04"]);
    merge("folklore_ids",["FOLK-155-01","FOLK-155-02","FOLK-155-03","FOLK-155-04"]);
    merge("rumor_ids",["RUMOR-155-01","RUMOR-155-02","RUMOR-155-03","RUMOR-155-04","RUMOR-155-05","RUMOR-155-06","RUMOR-155-07","RUMOR-155-08","RUMOR-155-09","RUMOR-155-10"]);
    pack.quest_motifs=[...new Set([...(pack.quest_motifs||[]),"非破壞測繪","水路巡檢","礦道安全","季節轉場"])];
    pack.exploration_motifs=[...new Set([...(pack.exploration_motifs||[]),"河岸水標","高地石圈","封閉礦道","退役邊堡"])];
  }

  DB.content_depth_system={
    version:"CONTENT-DEPTH-1.0",
    release:"CURRENT-1.55.0",
    focus_region:"REG-18",
    counts:{guild_quests:15,facility_quests:4,location_events:17,rumors:10,life_events:6,festivals:2,local_histories:4,folklore:4},
    rules:[
      "地點奇遇必須通過location_ids、kind、zone與tier四重篩選。",
      "新增委託只引用既有物品與可達地點，回報仍受市場飽和度與每日收購資金限制。",
      "地方傳聞與民俗不得自動升格為正史；非破壞性調查優先於遺跡掠奪。",
      "內容補丁只追加唯一ID，不重建角色、不清空localStorage、不改既有存檔schema。"
    ],
    save_schema_changed:false,
    existing_save_compatible:true
  };
  DB.meta.current_version="CURRENT-1.55.0";
  DB.meta.content_depth_revision="CONTENT-DEPTH-1.0";

  // ASDAIL-KINGDOM-EXPANSION-1.0：阿斯戴爾王國 F～B 級可遊玩內容。
  // 只新增資料與引用，不更動角色初始值、戰鬥公式、存檔schema、九元素或既有正史。
  const asdailAdd=(key,rows)=>appendUnique(key,rows);

  asdailAdd("world_regions",[
    {id:"REG-ASD-01",name:"阿斯戴爾王國",kind:"kingdom",tier:"B",world_tier:"B",capital_id:"ASD-CAPITAL",description:"由王冠大道、銀穗糧倉、北境灰門與東部赤岩礦帶組成的封建王國；王權依賴道路、糧倉、教會法庭與行會協議維持秩序。",governance:"國王—大公／公爵—伯爵—男爵／鎮守官—騎士",known_elements:["光","火","風","水","地","雷","生命","暗","死亡"],current_year:317}
  ]);

  asdailAdd("realm_region_maps",[
    {id:"MAP-ASD-01",region_id:"REG-ASD-01",name:"阿斯戴爾王國全域圖",tier:"B",capital_id:"ASD-CAPITAL",province_ids:["PROV-ASD-CROWN","PROV-ASD-RIVER","PROV-ASD-NORTH","PROV-ASD-EAST"],travel_rules:"王都與主要城鎮由王冠大道、河運與驛站連接；未取得通行資格不得進入B級王家封鎖區。"}
  ]);
  asdailAdd("province_region_maps",[
    {id:"PROV-ASD-CROWN",region_id:"REG-ASD-01",name:"王冠直轄領",tier:"B",hub_id:"ASD-CAPITAL",description:"王都、王家糧倉、法庭與騎士團駐地所在。"},
    {id:"PROV-ASD-RIVER",region_id:"REG-ASD-01",name:"西境河谷省",tier:"C",hub_id:"ASD-RIVER",description:"農業、河運與冒險者低階委託密集的河谷地。"},
    {id:"PROV-ASD-NORTH",region_id:"REG-ASD-01",name:"北境灰門省",tier:"B",hub_id:"ASD-GRAYGATE",description:"面向山脈與舊邊境堡壘，D～B級魔物活動逐步增加。"},
    {id:"PROV-ASD-EAST",region_id:"REG-ASD-01",name:"赤岩東境省",tier:"C",hub_id:"ASD-REDCLIFF",description:"礦脈、熔窟與商路衝突交錯的丘陵省份。"}
  ]);
  asdailAdd("settlement_region_maps",[
    {id:"SET-ASD-CAPITAL",province_id:"PROV-ASD-CROWN",location_id:"ASD-CAPITAL",name:"艾斯戴拉王都",world_tier:"B",settlement_tier:"B"},
    {id:"SET-ASD-RIVER",province_id:"PROV-ASD-RIVER",location_id:"ASD-RIVER",name:"河谷鎮",world_tier:"F",settlement_tier:"F"},
    {id:"SET-ASD-SILVER",province_id:"PROV-ASD-RIVER",location_id:"ASD-SILVER",name:"銀穗城",world_tier:"C",settlement_tier:"C"},
    {id:"SET-ASD-GRAYGATE",province_id:"PROV-ASD-NORTH",location_id:"ASD-GRAYGATE",name:"灰門鎮",world_tier:"D",settlement_tier:"D"},
    {id:"SET-ASD-MISTPINE",province_id:"PROV-ASD-NORTH",location_id:"ASD-MISTPINE",name:"霧杉鎮",world_tier:"C",settlement_tier:"C"},
    {id:"SET-ASD-REDCLIFF",province_id:"PROV-ASD-EAST",location_id:"ASD-REDCLIFF",name:"赤岩鎮",world_tier:"D",settlement_tier:"D"},
    {id:"SET-ASD-DAWNPORT",province_id:"PROV-ASD-EAST",location_id:"ASD-DAWNPORT",name:"黎明港",world_tier:"C",settlement_tier:"C"}
  ]);

  asdailAdd("locations",[
    {id:"ASD-CAPITAL",name:"艾斯戴拉王都",kind:"town",tier:"B",world_tier:"B",region_id:"REG-ASD-01",province_id:"PROV-ASD-CROWN",parent_id:null,description:"王冠大道的中心城市，王宮、白塔法庭、冒險者公會總會與王家鍛造院分據城內六區。",encounter_profile:{zone:"capital",danger:"B",allowed_tiers:["F","E","D","C","B"]},facilities:["王宮外廷","冒險者公會總會","白塔教會","王家鍛造院","中央市場"],travel_time_hours:18},
    {id:"ASD-RIVER",name:"河谷鎮",kind:"town",tier:"F",world_tier:"F",region_id:"REG-ASD-01",province_id:"PROV-ASD-RIVER",description:"王冠大道西側的糧運小鎮，適合F級角色接受第一批護運、採集與野狼委託。",encounter_profile:{zone:"town_outskirts",danger:"F",allowed_tiers:["F","E"]},facilities:["冒險者公會支部","小型教會","穀倉","馬廄"],travel_time_hours:4},
    {id:"ASD-SILVER",name:"銀穗城",kind:"town",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-RIVER",description:"河谷省的糧價與河運樞紐，地方貴族、商路聯盟與農民協會在此協商。",encounter_profile:{zone:"river_valley",danger:"C",allowed_tiers:["F","E","D","C"]},facilities:["河運碼頭","商路聯盟會館","糧價議所","冒險者公會支部"],travel_time_hours:8},
    {id:"ASD-GRAYGATE",name:"灰門鎮",kind:"town",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-NORTH",description:"北境山口的守備鎮，平民生活依靠軍需、獵團與城牆外的礦木採集。",encounter_profile:{zone:"frontier",danger:"D",allowed_tiers:["F","E","D"]},facilities:["灰門守備隊","邊境教會","獵團營地","修繕工坊"],travel_time_hours:16},
    {id:"ASD-MISTPINE",name:"霧杉鎮",kind:"town",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-NORTH",description:"被霧杉林包圍的木材與藥草城鎮，夜間常聽見林中鐘聲與非人足跡。",encounter_profile:{zone:"deep_forest",danger:"C",allowed_tiers:["F","E","D","C"]},facilities:["藥草行會","林務所","月泉教會","冒險者公會支部"],travel_time_hours:12},
    {id:"ASD-REDCLIFF",name:"赤岩鎮",kind:"town",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",description:"建在赤色礦層上的採礦鎮，礦工、鐵匠與王國商路聯盟共同控制進山通道。",encounter_profile:{zone:"rocky_hills",danger:"D",allowed_tiers:["F","E","D"]},facilities:["礦坑管理所","鐵匠行會","熔石酒館","赤岩教會"],travel_time_hours:14},
    {id:"ASD-DAWNPORT",name:"黎明港",kind:"town",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",description:"東南水路港口，受王國海關與商路聯盟雙重管理，港外潮洞通往未完全測繪的地下水域。",encounter_profile:{zone:"coast",danger:"C",allowed_tiers:["F","E","D","C"]},facilities:["海關","港口教會","商路聯盟碼頭","潮汐觀測所"],travel_time_hours:20},

    {id:"ASD-WILD-CROWNROAD",name:"王冠大道南段",kind:"wild",tier:"F",world_tier:"F",region_id:"REG-ASD-01",province_id:"PROV-ASD-CROWN",description:"王都至河谷鎮的石砌道路，白天有巡路騎士，夜間仍可能遇到狼群與攔路者。",encounter_profile:{zone:"road",danger:"F",allowed_tiers:["F","E"]},parent_id:"ASD-CAPITAL",travel_time_hours:6},
    {id:"ASD-WILD-SILVERFENS",name:"銀穗濕地",kind:"wild",tier:"E",world_tier:"E",region_id:"REG-ASD-01",province_id:"PROV-ASD-RIVER",description:"河流改道後形成的蘆葦濕地，盛產止血草，也藏有泥沼魔物與走失的運糧牲畜。",encounter_profile:{zone:"wetland",danger:"E",allowed_tiers:["F","E","D"]},parent_id:"ASD-SILVER",travel_time_hours:5},
    {id:"ASD-WILD-KINGSWOOD",name:"王家外林",kind:"wild",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-CROWN",description:"王都北側的狩獵林，外圍開放採集，內圈因王室封獵令需持有許可。",encounter_profile:{zone:"royal_forest",danger:"D",allowed_tiers:["F","E","D"]},parent_id:"ASD-CAPITAL",travel_time_hours:7},
    {id:"ASD-WILD-MISTPINE",name:"霧杉深林",kind:"wild",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-NORTH",description:"濃霧與古杉構成的深林，樹根下有被封閉的舊祭壇，C級以下不建議離開標記獵徑。",encounter_profile:{zone:"deep_forest",danger:"C",allowed_tiers:["E","D","C"]},parent_id:"ASD-MISTPINE",travel_time_hours:6},
    {id:"ASD-WILD-GRAYPASS",name:"灰門山徑",kind:"wild",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-NORTH",description:"通往北境堡壘的山徑，雪崩、座狼與盜匪使護送委託長期存在。",encounter_profile:{zone:"mountain_pass",danger:"D",allowed_tiers:["E","D","C"]},parent_id:"ASD-GRAYGATE",travel_time_hours:8},
    {id:"ASD-WILD-REDHILLS",name:"赤岩丘陵",kind:"wild",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",description:"地表有鐵礦與硫磺裂口的丘陵，地底熱流讓火屬性魔物異常活躍。",encounter_profile:{zone:"rocky_hills",danger:"D",allowed_tiers:["F","E","D"]},parent_id:"ASD-REDCLIFF",travel_time_hours:7},
    {id:"ASD-WILD-DAWNCOAST",name:"黎明潮岸",kind:"wild",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",description:"港口外的礁岸與潮池，夜間可見水光，沿岸漁民以繩標記安全路線。",encounter_profile:{zone:"coast",danger:"C",allowed_tiers:["E","D","C"]},parent_id:"ASD-DAWNPORT",travel_time_hours:5},
    {id:"ASD-WILD-CROWNMEADOW",name:"王冠草甸",kind:"wild",tier:"F",world_tier:"F",region_id:"REG-ASD-01",province_id:"PROV-ASD-CROWN",description:"王都南方的公共牧地，幼年山羊、野兔與家畜在此活動，深夜才可能出現掠食者。",encounter_profile:{zone:"meadow",danger:"F",allowed_tiers:["F","E"]},parent_id:"ASD-CAPITAL",travel_time_hours:3},
    {id:"ASD-WILD-BLACKWATER",name:"黑水河源",kind:"wild",tier:"B",world_tier:"B",region_id:"REG-ASD-01",province_id:"PROV-ASD-NORTH",description:"灰門山脈下方的黑水源頭，水脈受古代封印影響，只有取得王都與教會雙重許可才可深入。",encounter_profile:{zone:"cursed_spring",danger:"B",allowed_tiers:["C","B"]},parent_id:"ASD-GRAYGATE",travel_time_hours:14},

    {id:"ASD-DUNGEON-ROYAL-CISTERN",name:"王家舊蓄水廊",kind:"dungeon",tier:"D",world_tier:"D",region_id:"REG-ASD-01",province_id:"PROV-ASD-CROWN",description:"王都地下的舊水利設施，部分區段仍供應城市用水，探險不得破壞主水閘。",encounter_profile:{zone:"aqueduct",danger:"D",allowed_tiers:["E","D"]},parent_id:"ASD-CAPITAL",persistent:true,resource_reset:false},
    {id:"ASD-DUNGEON-MIST-ALTAR",name:"霧杉月泉祭壇",kind:"dungeon",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-NORTH",description:"林中舊祭壇與地下根室相連，祭壇供奉的不是現行教會神名，記錄需交由學者與教會共同判讀。",encounter_profile:{zone:"ancient_altar",danger:"C",allowed_tiers:["D","C"]},parent_id:"ASD-WILD-MISTPINE",persistent:true,resource_reset:false},
    {id:"ASD-DUNGEON-RED-FURNACE",name:"赤岩熔窟",kind:"dungeon",tier:"C",world_tier:"C",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",description:"廢棄礦井深處的天然熔窟，礦工只開採外層，內部熱壓與魔物巢穴尚未處理。",encounter_profile:{zone:"lava_cave",danger:"C",allowed_tiers:["D","C"]},parent_id:"ASD-REDCLIFF",persistent:true,resource_reset:false},
    {id:"ASD-DUNGEON-GRAY-FORT",name:"灰門舊堡地下層",kind:"dungeon",tier:"B",world_tier:"B",region_id:"REG-ASD-01",province_id:"PROV-ASD-NORTH",description:"舊邊境堡壘下方的封鎖層，牆上留有王國成立前的軍旗，通道開啟會改變北境守備部署。",encounter_profile:{zone:"sealed_fortress",danger:"B",allowed_tiers:["C","B"]},parent_id:"ASD-GRAYGATE",persistent:true,resource_reset:false},
    {id:"ASD-DUNGEON-DAWN-TIDE",name:"黎明潮汐洞",kind:"dungeon",tier:"B",world_tier:"B",region_id:"REG-ASD-01",province_id:"PROV-ASD-EAST",description:"受潮汐影響的海蝕洞群，內部地圖每日有小幅變化，但已開啟的安全繩路會持久保留。",encounter_profile:{zone:"tidal_cavern",danger:"B",allowed_tiers:["C","B"]},parent_id:"ASD-DAWNPORT",persistent:true,resource_reset:false}
  ]);

  asdailAdd("regional_npc_archetypes",[
    {id:"NPC-ASD-001",name:"伊芙琳・阿爾德",role:"王都外廷書記官",tier:"C",location_id:"ASD-CAPITAL",description:"負責核對地方領主、行會與教會提交的道路和糧倉紀錄；只提供可驗證的行政資料。",organization_ids:["ORG-ASD-CROWN-COURT"],services:["委託登記","王國通行文書"],dialogue_ids:["DIA-ASD-001","DIA-ASD-002"]},
    {id:"NPC-ASD-002",name:"布蘭特・灰盾",role:"灰門守備隊副隊長",tier:"D",location_id:"ASD-GRAYGATE",description:"曾在黑水河源失去一支巡邏隊，對未經許可的深山探索極為警戒。",organization_ids:["ORG-ASD-GRAY-WARDENS"],services:["通行許可","守備委託"],dialogue_ids:["DIA-ASD-003"]},
    {id:"NPC-ASD-003",name:"梅拉・銀穗",role:"銀穗糧價議所調停人",tier:"C",location_id:"ASD-SILVER",description:"代表沃土農民協會與商路聯盟協商糧價，拒絕以謠言作為正式證據。",organization_ids:["ORG-ASD-GRAIN-COMPACT","ORG-ASD-ROAD-LEAGUE"],services:["糧運委託","市場情報"],dialogue_ids:["DIA-ASD-004"]},
    {id:"NPC-ASD-004",name:"奧倫・赤砧",role:"赤岩鎮王國註冊鐵匠",tier:"C",location_id:"ASD-REDCLIFF",description:"能辨識精鋼與受熱變質礦材，與王家鍛造院保持技術往來。",organization_ids:["ORG-ASD-ROAD-LEAGUE"],services:["裝備鑑定","鍛造委託"],dialogue_ids:["DIA-ASD-005"]},
    {id:"NPC-ASD-005",name:"賽芮安・霧鈴",role:"霧杉林務與月泉教會聯絡人",tier:"C",location_id:"ASD-MISTPINE",description:"以鐘聲與繩標維持林徑秩序，知道祭壇的存在但不宣稱理解其真相。",organization_ids:["ORG-ASD-MISTWARDENS"],services:["採集許可","林徑委託"],dialogue_ids:["DIA-ASD-006"]},
    {id:"NPC-ASD-006",name:"卡洛斯・潮記",role:"黎明港潮汐觀測員",tier:"C",location_id:"ASD-DAWNPORT",description:"記錄潮洞水位、海蝕與港口失物，從不把海外傳聞寫入王國正史。",organization_ids:["ORG-ASD-ROAD-LEAGUE"],services:["潮岸委託","地下城情報"],dialogue_ids:["DIA-ASD-007"]}
  ]);

  asdailAdd("dialogue_database",[
    {id:"DIA-ASD-001",speaker_id:"NPC-ASD-001",topic:"王都行政",text:"王冠大道的每一枚路標都有登記。沒有文書的消息，只能先算傳聞。"},
    {id:"DIA-ASD-002",speaker_id:"NPC-ASD-001",topic:"王家封鎖區",text:"王都不是所有門都能進。階級、委託與通行理由缺一不可。"},
    {id:"DIA-ASD-003",speaker_id:"NPC-ASD-002",topic:"黑水河源",text:"那裡不是給新手證明勇氣的地方。先帶回巡邏隊留下的鐵牌，再談深入。"},
    {id:"DIA-ASD-004",speaker_id:"NPC-ASD-003",topic:"糧價",text:"糧食短缺是真的，王國崩潰只是有人想讓你相信的故事。"},
    {id:"DIA-ASD-005",speaker_id:"NPC-ASD-004",topic:"赤岩礦",text:"紅色不代表礦石更好；真正的差別在鍛火後是否仍保持韌性。"},
    {id:"DIA-ASD-006",speaker_id:"NPC-ASD-005",topic:"霧杉祭壇",text:"我只知道它在林子裡，知道不等於有資格打開它。"},
    {id:"DIA-ASD-007",speaker_id:"NPC-ASD-006",topic:"潮汐洞",text:"海水會把路藏起來，但不會替你把錯誤的繩結解開。"}
  ]);

  asdailAdd("world_organizations",[
    {id:"ORG-ASD-CROWN-COURT",name:"阿斯戴爾王國外廷",kind:"political",tier:"B",region_id:"REG-ASD-01",base_location_id:"ASD-CAPITAL",description:"處理道路、稅役、王家封獵與地方申訴，不等同於王室內廷。",bonus:{authority_request:"王國通行文書"}},
    {id:"ORG-ASD-GRAY-WARDENS",name:"灰門守備隊",kind:"military",tier:"D",region_id:"REG-ASD-01",base_location_id:"ASD-GRAYGATE",description:"負責北境哨線、山徑封鎖與魔物警戒。",bonus:{frontier_safety:10}},
    {id:"ORG-ASD-GRAIN-COMPACT",name:"銀穗糧議會",kind:"civilian",tier:"C",region_id:"REG-ASD-01",base_location_id:"ASD-SILVER",description:"沃土農民協會、糧商與城鎮代表組成的地方協議組織。",bonus:{food_market:"供需情報"}},
    {id:"ORG-ASD-MISTWARDENS",name:"霧杉林務會",kind:"ranger",tier:"C",region_id:"REG-ASD-01",base_location_id:"ASD-MISTPINE",description:"維持林徑、採集許可與野火警戒，與教會保持有限合作。",bonus:{forest_gathering:10}},
    {id:"ORG-ASD-ROAD-LEAGUE",name:"王國商路聯盟阿斯戴爾分會",kind:"trade",tier:"C",region_id:"REG-ASD-01",base_location_id:"ASD-SILVER",description:"負責王冠大道、驛站、河運與護運協調；不擁有地方主權。",bonus:{travel_cost:-5,escort_contracts:true}}
  ]);

  asdailAdd("discipline_factions",[
    {id:"DISC-ASD-IRON-BANNER",name:"鐵旗守勢流",tier:"D",base_location_id:"ASD-GRAYGATE",description:"北境守備隊流傳的盾劍訓練，重視掩護、穩定與反擊，不取代既有雷鳴流、雷煌流或柳生唯心流。",bonus:{defense:3,guard_effectiveness:8},requirements:{min_level:5,weapon_types:["武器","盾"]}},
    {id:"DISC-ASD-MIST-STEP",name:"霧徑聽息流",tier:"C",base_location_id:"ASD-MISTPINE",description:"霧杉獵人以聽覺、腳步與短距離位移為核心的野外流派，重視避戰與先手。",bonus:{evasion:5,accuracy:4},requirements:{min_level:12,weapon_types:["短刃","弓"]}}
  ]);

  asdailAdd("monsters",[
    {id:"MON-ASD-001",name:"王冠大道鬣犬",tier:"F",lore_role:"一般",habitat:["ASD-WILD-CROWNROAD"],hp:36,attack:12,defense:5,accuracy:68,damage:[4,8],description:"成群追逐疲弱旅隊的野獸，不是野兔級低威脅生物。"},
    {id:"MON-ASD-002",name:"銀穗泥蠑螈",tier:"E",lore_role:"一般",habitat:["ASD-WILD-SILVERFENS"],hp:50,attack:16,defense:8,accuracy:70,damage:[5,10],element:"水",description:"棲於灌溉水道的兩棲魔物，會以黏液拖慢獵物。"},
    {id:"MON-ASD-003",name:"王家林角鹿",tier:"D",lore_role:"一般",habitat:["ASD-WILD-KINGSWOOD"],hp:76,attack:22,defense:11,accuracy:72,damage:[7,14],description:"受地脈影響的雄鹿，角擊可穿透輕甲。"},
    {id:"MON-ASD-004",name:"霧杉纏根獸",tier:"C",lore_role:"一般",habitat:["ASD-WILD-MISTPINE","ASD-DUNGEON-MIST-ALTAR"],hp:110,attack:29,defense:16,accuracy:74,damage:[10,20],element:"生命",description:"以根鬚與樹皮構成的森林魔物，受火元素傷害時防禦下降。"},
    {id:"MON-ASD-005",name:"灰門雪爪狼",tier:"C",lore_role:"菁英",habitat:["ASD-WILD-GRAYPASS"],hp:130,attack:31,defense:18,accuracy:76,damage:[11,22],element:"風",description:"狼群首領級魔物，成年野狼的進階威脅，不應出現在F級近郊。"},
    {id:"MON-ASD-006",name:"赤岩熔背蜥",tier:"D",lore_role:"一般",habitat:["ASD-WILD-REDHILLS"],hp:74,attack:23,defense:12,accuracy:72,damage:[7,15],element:"火",description:"背甲蓄熱後會噴出短距離火舌。"},
    {id:"MON-ASD-007",name:"赤岩硫喉獸",tier:"C",lore_role:"一般",habitat:["ASD-DUNGEON-RED-FURNACE"],hp:112,attack:30,defense:17,accuracy:74,damage:[10,21],element:"火",description:"熔窟中的大型穴居魔物，會使藥劑材料變質。"},
    {id:"MON-ASD-008",name:"黎明潮骨蟹",tier:"E",lore_role:"一般",habitat:["ASD-WILD-DAWNCOAST"],hp:52,attack:17,defense:9,accuracy:70,damage:[5,10],element:"水",description:"外殼堅硬、行動緩慢的沿岸魔物。"},
    {id:"MON-ASD-009",name:"潮洞歌蛙",tier:"D",lore_role:"一般",habitat:["ASD-DUNGEON-DAWN-TIDE"],hp:78,attack:22,defense:11,accuracy:73,damage:[7,14],element:"水",description:"叫聲會使探索者短暫失去方向，需依潮標辨路。"},
    {id:"MON-ASD-010",name:"灰堡鎧骸",tier:"C",lore_role:"菁英",habitat:["ASD-DUNGEON-GRAY-FORT"],hp:140,attack:33,defense:20,accuracy:75,damage:[11,23],element:"死亡",description:"穿著古代軍鎧的死靈守衛，與地下層封印狀態連動。"},
    {id:"MON-ASD-011",name:"黑水源噬獸",tier:"B",lore_role:"一般",habitat:["ASD-WILD-BLACKWATER"],hp:165,attack:39,defense:24,accuracy:78,damage:[13,28],element:"暗",description:"黑水源頭的B級魔物，未取得許可不得作為普通遭遇。"},
    {id:"MON-ASD-012",name:"王冠石翼獅",tier:"B",lore_role:"菁英",habitat:["ASD-WILD-KINGSWOOD"],hp:190,attack:43,defense:27,accuracy:80,damage:[15,31],element:"風",description:"王家外林內圈的稀有魔物，擊敗後會引起王家封獵與生態調查。"}
  ]);

  asdailAdd("items",[
    {id:"ITEM-ASD-IRONBARK",name:"鐵杉樹皮",kind:"material",tier:"D",weight:0.3,price:12,description:"霧杉纏根獸與深林採集可取得的韌性材料。"},
    {id:"ITEM-ASD-RED-OREDUST",name:"赤岩礦粉",kind:"material",tier:"D",weight:0.2,price:15,description:"赤岩熔窟外層礦脈的基礎鍛造材料。"},
    {id:"ITEM-ASD-BLACKWATER-SALT",name:"黑水鹽晶",kind:"material",tier:"B",weight:0.2,price:90,description:"黑水源頭凝結的暗色鹽晶，需許可採集。"},
    {id:"ITEM-ASD-CROWN-SEAL",name:"王冠道路通行章",kind:"key_item",tier:"C",weight:0.05,price:0,description:"證明持有人可在指定時限通行王冠大道封鎖段。"},
    {id:"ITEM-ASD-GRAY-IDOL",name:"灰門舊軍牌",kind:"quest",tier:"C",weight:0.1,price:0,description:"可確認失聯巡邏隊身分的鐵牌。"},
    {id:"ITEM-ASD-MIST-LANTERN",name:"霧徑遮霧燈",kind:"tool",tier:"C",weight:1.0,price:75,effect:"在霧杉深林降低迷路與失明事件風險。"},
    {id:"ITEM-ASD-TIDE-ROPE",name:"潮汐安全繩",kind:"tool",tier:"C",weight:1.5,price:48,effect:"在黎明潮汐洞固定已探索路線。"},
    {id:"ITEM-ASD-ROYAL-STEEL",name:"王家精鋼短劍",kind:"equipment",tier:"C",weight:1.2,price:320,equip_slot:"weapon",attack:18,material:"精鋼",description:"王家鍛造院流出的制式短劍。"},
    {id:"ITEM-ASD-GRAY-SHIELD",name:"灰門守備盾",kind:"equipment",tier:"D",weight:3.8,price:180,equip_slot:"offhand",defense:10,material:"黑鐵",description:"適合守勢流訓練的黑鐵圓盾。"},
    {id:"ITEM-ASD-CROWN-CLOAK",name:"王冠驛騎斗篷",kind:"equipment",tier:"B",weight:1.0,price:680,equip_slot:"body",defense:14,description:"王冠大道驛騎使用的耐候斗篷，持有通行章時可減少道路事件風險。"},
    {id:"ITEM-ASD-LANTERN-GLASS",name:"耐熱燈罩玻璃",kind:"material",tier:"D",weight:0.2,price:18,description:"可承受霧杉燈具熱度的厚玻璃。"},
    {id:"ITEM-ASD-LAMP-OIL",name:"霧燈植物油",kind:"material",tier:"D",weight:0.3,price:10,description:"以濕地種子壓榨的低煙植物油。"}
  ]);

  asdailAdd("recipes",[
    {id:"RECIPE-ASD-MIST-LANTERN",name:"霧徑遮霧燈",tier:"C",profession:"鍛造",ingredients:[{item_id:"ITEM-ASD-IRONBARK",qty:2},{item_id:"ITEM-ASD-LANTERN-GLASS",qty:1},{item_id:"ITEM-ASD-LAMP-OIL",qty:1}],output:{item_id:"ITEM-ASD-MIST-LANTERN",qty:1},time_hours:2},
    {id:"RECIPE-ASD-GRAY-SHIELD",name:"灰門守備盾",tier:"D",profession:"鍛造",ingredients:[{item_id:"MAT-ORE-24",qty:3},{item_id:"ITEM-ASD-RED-OREDUST",qty:1}],output:{item_id:"ITEM-ASD-GRAY-SHIELD",qty:1},time_hours:4},
    {id:"RECIPE-ASD-IRON-SALVE",name:"鐵杉止血膏",tier:"D",profession:"藥劑",ingredients:[{item_id:"ITEM-ASD-IRONBARK",qty:1},{item_id:"I-HERB",qty:2}],output:{item_id:"ITEM-ASD-IRON-SALVE",qty:1},time_hours:1}
  ]);
  asdailAdd("items",[
    {id:"ITEM-ASD-IRON-SALVE",name:"鐵杉止血膏",kind:"consumable",tier:"D",weight:0.1,price:42,effect:"恢復少量HP並降低流血持續時間。"},
    {id:"ITEM-ASD-BLACKWATER-TONIC",name:"黑水抗蝕藥劑",kind:"consumable",tier:"B",weight:0.1,price:160,effect:"短時間降低暗元素與腐蝕地形造成的傷害。"},
    {id:"ITEM-ASD-TIDEBREATH-POTION",name:"潮息藥劑",kind:"consumable",tier:"C",weight:0.1,price:86,effect:"短時間延長水下探索時間，不能取代正常休息。"},
    {id:"ITEM-ASD-MIST-EYE-DROP",name:"霧視滴劑",kind:"consumable",tier:"C",weight:0.05,price:72,effect:"降低霧杉深林的致盲與迷失風險。"}
  ]);

  asdailAdd("shared_skills",[
    {id:"SKILL-ASD-ROAD-SENSE",name:"王冠道路辨識",tier:"F",category:"生存",description:"辨識王國道路、路標、驛站與合法封鎖線；不提供未取得的機密情報。",effect:"降低王國道路探索失敗風險。",max_level:10},
    {id:"SKILL-ASD-FIELD-MEDIC",name:"邊境急救",tier:"E",category:"生存",description:"以繃帶、止血草與簡易固定處理野外創傷。",effect:"提升非戰鬥治療效果；不能取代復活。",max_level:10},
    {id:"SKILL-ASD-MIST-LISTEN",name:"霧中聽息",tier:"D",category:"戰鬥",description:"在視線受阻時依腳步與呼吸判斷敵方距離。",effect:"霧地形中命中與迴避小幅提升。",max_level:10},
    {id:"SKILL-ASD-SHIELD-ANCHOR",name:"盾根錨定",tier:"D",category:"戰鬥",description:"以盾牌與腳步固定自身位置，承受衝撞時減少失衡。",effect:"格擋成功後降低下一次受擊傷害。",max_level:10},
    {id:"SKILL-ASD-TIDE-READ",name:"潮汐讀流",tier:"C",category:"探索",description:"讀取潮線、回流與海蝕洞安全窗口。",effect:"降低潮汐地下城的時間與迷路損失。",max_level:10},
    {id:"SKILL-ASD-SEAL-READ",name:"封印讀紋",tier:"C",category:"知識",description:"辨識古代軍事封印與現行教會標記的差異。",effect:"可解讀部分地下城封鎖提示。",max_level:10},
    {id:"SKILL-ASD-ROYAL-ETIQUETTE",name:"王國禮法",tier:"B",category:"社交",description:"理解王國封臣、行會與教會法庭的正式程序。",effect:"降低王都正式交涉的失敗懲罰。",max_level:10},
    {id:"SKILL-ASD-APPRAISE-STEEL",name:"精鋼鑑識",tier:"C",category:"製作",description:"分辨精鋼、黑鐵與受熱變質礦材。",effect:"提高鍛造素材辨識與合格率。",max_level:10}
  ]);

  asdailAdd("quest_templates",[
    {id:"Q158-ASD-ROAD-MARKERS",name:"王冠大道路標補漆",tier:"F",min_level:1,max_level:7,type:"巡查",description:"南段路標被雨水剝落，請補上合法方向與距離標記。",objective:{kind:"action",location_id:"ASD-WILD-CROWNROAD",target:2},reward:[12,20],recommended_locations:["ASD-WILD-CROWNROAD"],xp_reward:14},
    {id:"Q158-ASD-WOLF-TRACKS",name:"大道邊的成年狼群",tier:"F",min_level:1,max_level:8,type:"討伐",description:"成年野狼已逼近運糧車隊，請確認狼跡並驅離首隻獵手。",objective:{kind:"hunt",monster_id:"LEGACY-MON-002",target:1},reward:[20,32],recommended_locations:["ASD-WILD-CROWNROAD"],xp_reward:18},
    {id:"Q158-ASD-SILVER-HERB",name:"銀穗濕地止血草",tier:"E",min_level:4,max_level:12,type:"採集",description:"救助室需要濕地止血草，採集時須避開泥蠑螈棲地。",objective:{kind:"gather",item_id:"I-HERB",target:5,consume_on_turnin:true},reward:[28,46],recommended_locations:["ASD-WILD-SILVERFENS"],xp_reward:28},
    {id:"Q158-ASD-GRAIN-ESCORT",name:"銀穗糧車護送",tier:"E",min_level:5,max_level:14,type:"護送",description:"護送糧車由銀穗城前往河谷鎮，途中不可擅自打開封袋。",objective:{kind:"patrol",location_id:"ASD-WILD-SILVERFENS",target:2,checkpoints:["北側水閘","舊渡口"]},reward:[42,68],recommended_locations:["ASD-SILVER","ASD-WILD-SILVERFENS"],xp_reward:36},
    {id:"Q158-ASD-KINGSWOOD-PASS",name:"王家外林採集許可",tier:"D",min_level:10,max_level:22,type:"調查",description:"取得外林採集許可，並回報王家林角鹿的族群數量。",objective:{kind:"action",location_id:"ASD-WILD-KINGSWOOD",target:1},reward:[80,125],recommended_locations:["ASD-CAPITAL","ASD-WILD-KINGSWOOD"],xp_reward:62},
    {id:"Q158-ASD-MIST-LANTERN",name:"霧杉林徑重立燈標",tier:"D",min_level:12,max_level:25,type:"探索",description:"霧中燈標熄滅，請帶入遮霧燈並重建兩段安全繩路。",objective:{kind:"item",item_id:"ITEM-ASD-MIST-LANTERN",target:1,consume_on_turnin:false},reward:[96,150],recommended_locations:["ASD-MISTPINE","ASD-WILD-MISTPINE"],xp_reward:76},
    {id:"Q158-ASD-RED-FURNACE",name:"赤岩熔窟礦脈封存",tier:"C",min_level:20,max_level:35,type:"地下城",description:"熔窟內層熱壓異常，請封存三處變質礦脈並帶回礦粉樣本。",objective:{kind:"gather",item_id:"ITEM-ASD-RED-OREDUST",target:3,consume_on_turnin:true},reward:[180,280],recommended_locations:["ASD-DUNGEON-RED-FURNACE"],xp_reward:130},
    {id:"Q158-ASD-GRAY-IDOL",name:"灰門失聯巡邏隊",tier:"C",min_level:22,max_level:38,type:"調查",description:"前往灰門舊堡地下層，找回巡邏隊鐵牌並確認封鎖層是否鬆動。",objective:{kind:"item",item_id:"ITEM-ASD-GRAY-IDOL",target:1,consume_on_turnin:false},reward:[210,330],recommended_locations:["ASD-GRAYGATE","ASD-DUNGEON-GRAY-FORT"],xp_reward:155},
    {id:"Q158-ASD-TIDE-WINDOW",name:"黎明潮洞安全窗口",tier:"C",min_level:24,max_level:40,type:"探索",description:"依潮汐記錄進入洞窟，固定一條可供港口救援隊使用的繩路。",objective:{kind:"action",location_id:"ASD-DUNGEON-DAWN-TIDE",target:2},reward:[220,350],recommended_locations:["ASD-DAWNPORT","ASD-DUNGEON-DAWN-TIDE"],xp_reward:165},
    {id:"Q158-ASD-BLACKWATER",name:"黑水源雙重許可",tier:"B",min_level:35,max_level:55,type:"封鎖區",description:"取得王都與教會雙重許可，調查黑水源噬獸活動，不得擅自破壞水脈封印。",objective:{kind:"action",location_id:"ASD-WILD-BLACKWATER",target:1},reward:[520,820],recommended_locations:["ASD-CAPITAL","ASD-GRAYGATE","ASD-WILD-BLACKWATER"],xp_reward:360},
    {id:"Q158-ASD-CROWN-LAW",name:"王都法庭的失竊印模",tier:"B",min_level:38,max_level:60,type:"調查",description:"找回被盜的道路封印印模，避免地方勢力偽造通行文書。",objective:{kind:"action",location_id:"ASD-CAPITAL",target:3},reward:[600,960],recommended_locations:["ASD-CAPITAL"],xp_reward:420}
  ]);

  asdailAdd("adventure_event_templates",[
    {id:"AE158-ASD-ROAD-COACH",name:"翻覆的王冠驛車",tier:"F",kinds:["wild"],zones:["road"],location_ids:["ASD-WILD-CROWNROAD"],stat:"力量",dc:10,text:"驛車翻覆堵住道路，貨物散落在成年野狼活動的邊緣。",success:"你先固定車軸再收攏貨物，車夫承諾向公會回報。",fail:"你只能保住一箱糧袋，狼跡已逼近。",reward:{money:[4,8],reputation:1},failure:{fatigue:2}},
    {id:"AE158-ASD-WETLAND-LIGHT",name:"濕地水燈",tier:"E",kinds:["wild"],zones:["wetland"],location_ids:["ASD-WILD-SILVERFENS"],stat:"智力",dc:12,text:"蘆葦間漂著不該出現的水燈，燈下綁著糧議會的封條。",success:"你沿安全水線取回封條，沒有驚動泥蠑螈。",fail:"水燈沉入泥中，只留下不完整的印記。",reward:{item_pool:["ITEM-ASD-CROWN-SEAL"],item_qty:[1,1]}},
    {id:"AE158-ASD-ROYAL-HUNT",name:"封獵日的角聲",tier:"D",kinds:["wild"],zones:["royal_forest"],location_ids:["ASD-WILD-KINGSWOOD"],stat:"感知",dc:14,text:"王家獵隊封鎖林徑，遠處傳來林角鹿的撞擊聲。",success:"你遵守封線並指出安全繞行路徑，獵隊允許你保留採集樣本。",fail:"你誤入封線，被要求接受盤查。",reward:{reputation:2},failure:{event_clock:2}},
    {id:"AE158-ASD-MIST-BELL",name:"霧中的第三聲鐘",tier:"D",kinds:["wild"],zones:["deep_forest"],location_ids:["ASD-WILD-MISTPINE"],stat:"感知",dc:15,text:"霧杉林傳來第三聲鐘，但林務會的記錄只承認兩聲。",success:"你沿繩標找到熄滅燈標，沒有追逐未知足跡。",fail:"霧勢加重，你被迫返回鎮上。",reward:{item_pool:["ITEM-ASD-MIST-LANTERN"],item_qty:[1,1]},failure:{fatigue:4}},
    {id:"AE158-ASD-RED-VENT",name:"赤岩裂口吐息",tier:"C",kinds:["wild"],zones:["rocky_hills"],location_ids:["ASD-WILD-REDHILLS"],stat:"體力",dc:16,text:"丘陵裂口吐出硫磺熱氣，赤岩礦粉被吹向山徑。",success:"你封住小裂口並收集未變質礦粉。",fail:"熱氣灼傷裝備，你必須退回赤岩鎮。",reward:{item_pool:["ITEM-ASD-RED-OREDUST"],item_qty:[1,2]},failure:{hp:5}},
    {id:"AE158-ASD-FORT-SEAL",name:"舊堡牆內的軍令",tier:"C",kinds:["dungeon"],zones:["sealed_fortress"],location_ids:["ASD-DUNGEON-GRAY-FORT"],stat:"智力",dc:17,text:"古代軍令要求守軍等待一支從未抵達的援軍。",success:"你封存軍令並確認地下層未被重新開啟。",fail:"灰堡鎧骸的腳步在牆後停下。",reward:{reputation:2,event_clock:2},failure:{fatigue:5}},
    {id:"AE158-ASD-TIDE-ROPE",name:"潮線外的第二條繩",tier:"C",kinds:["dungeon"],zones:["tidal_cavern"],location_ids:["ASD-DUNGEON-DAWN-TIDE"],stat:"敏捷",dc:16,text:"洞窟內出現一條不在港口記錄上的新繩路。",success:"你標記潮差並把繩路交由潮汐觀測所封存。",fail:"浪頭捲走一段繩索，你只能等待退潮。",reward:{item_pool:["ITEM-ASD-TIDE-ROPE"],item_qty:[1,1]},failure:{fatigue:5}},
    {id:"AE158-ASD-BLACKWATER-ECHO",name:"黑水源回聲",tier:"B",kinds:["wild"],zones:["cursed_spring"],location_ids:["ASD-WILD-BLACKWATER"],stat:"意志",dc:20,text:"水源深處傳來像是人聲的回音，卻沒有任何可見說話者。",success:"你記錄回音節律並撤回封鎖線外，沒有碰觸封印。",fail:"暗水侵入裝備縫隙，返回時必須接受教會檢查。",reward:{reputation:4,event_clock:3},failure:{hp:8}},
    {id:"AE158-ASD-COURT-SEAL",name:"白塔法庭的空座",tier:"B",kinds:["town"],zones:["capital"],location_ids:["ASD-CAPITAL"],stat:"智力",dc:18,text:"正式聽證少了一名地方代表，桌上卻已放好他的封印文件。",success:"你只轉交文件，不替任何一方推斷罪責。",fail:"你被捲入程序爭議，必須暫停一日委託。",reward:{reputation:3},failure:{event_clock:3}},
    {id:"AE158-ASD-GRAIN-FIRE",name:"銀穗糧倉的夜火",tier:"C",kinds:["town"],zones:["river_valley"],location_ids:["ASD-SILVER"],stat:"敏捷",dc:15,text:"糧倉外牆起火，守衛懷疑是人為縱火，農民協會要求先救糧。",success:"你切斷火勢與貨物損失，未在證據不足時指控任何人。",fail:"部分糧袋受潮，糧議會開始限制夜間通行。",reward:{money:[40,80],reputation:2},failure:{event_clock:2}}
  ]);

  asdailAdd("regional_adventure_hooks",[
    {id:"HOOK158-ASD-CROWN-SEAL",region_id:"REG-ASD-01",tier:"B",title:"王冠印模與失效的道路",summary:"王都的道路封印遭竊，地方通行權開始出現矛盾紀錄。",entry_locations:["ASD-CAPITAL","ASD-SILVER"],required_facts:["DIA-ASD-001"],linked_quests:["Q158-ASD-CROWN-LAW"],linked_events:["AE158-ASD-COURT-SEAL"]},
    {id:"HOOK158-ASD-BLACKWATER",region_id:"REG-ASD-01",tier:"B",title:"黑水源封印鬆動",summary:"北境水源與舊堡地下層出現同時異常，王國、教會與守備隊各自掌握一部分真相。",entry_locations:["ASD-GRAYGATE","ASD-CAPITAL"],required_facts:["DIA-ASD-003"],linked_quests:["Q158-ASD-BLACKWATER","Q158-ASD-GRAY-IDOL"],linked_events:["AE158-ASD-BLACKWATER-ECHO","AE158-ASD-FORT-SEAL"]}
  ]);

  asdailAdd("lore_records",[
    {id:"LORE158-ASD-01",title:"阿斯戴爾王國的四條命脈",tier:"C",category:"地方制度",region_id:"REG-ASD-01",status:"CURRENT",text:"王冠大道、河谷糧倉、北境守備與東境礦路共同維持王國；任何一條命脈中斷，都會先造成地方性短缺，而非立即改寫王國正史。"},
    {id:"LORE158-ASD-02",title:"灰門舊堡的未抵援軍",tier:"B",category:"歷史疑案",region_id:"REG-ASD-01",status:"傳聞待核",text:"舊堡軍令記載曾有援軍被派往北境，但現存名冊缺頁。此事可作為B級調查線索，不直接宣稱王國成立史為謊言。"},
    {id:"LORE158-ASD-03",title:"霧杉月泉的雙重記錄",tier:"C",category:"地方民俗",region_id:"REG-ASD-01",status:"地方記錄",text:"林務會以鐘聲記錄霧勢，月泉教會則以水位記錄祭壇狀態；兩者都不能單獨證明祭壇來自何種古代信仰。"}
  ]);

  asdailAdd("world_timeline",[
    {id:"TL158-ASD-01",year:317,region_id:"REG-ASD-01",tier:"C",status:"CURRENT",title:"王冠大道南段重修",text:"王國外廷批准道路與水標重修，河谷鎮與銀穗城的糧運委託增加。"},
    {id:"TL158-ASD-02",year:317,region_id:"REG-ASD-01",tier:"B",status:"CURRENT",title:"灰門舊堡列入封鎖清冊",text:"北境守備隊將舊堡地下層列為受限區，任何深入行動需取得通行理由與教會檢查。"}
  ]);

  asdailAdd("organization_contract_archetypes",[
    {id:"CONTRACT158-ASD-ROAD",organization_id:"ORG-ASD-ROAD-LEAGUE",region_id:"REG-ASD-01",tier:"F",name:"道路與驛站維護",locations:["ASD-WILD-CROWNROAD","ASD-RIVER"],rules:["不可破壞路標","交付前需核對封章"]},
    {id:"CONTRACT158-ASD-FRONTIER",organization_id:"ORG-ASD-GRAY-WARDENS",region_id:"REG-ASD-01",tier:"D",name:"北境封鎖與巡哨",locations:["ASD-WILD-GRAYPASS","ASD-DUNGEON-GRAY-FORT"],rules:["D級以下不得單獨深入B級封鎖區","回報魔物族群變化"]},
    {id:"CONTRACT158-ASD-GRAIN",organization_id:"ORG-ASD-GRAIN-COMPACT",region_id:"REG-ASD-01",tier:"E",name:"糧運與市場穩定",locations:["ASD-SILVER","ASD-WILD-SILVERFENS"],rules:["不可無限收購","交付數量受每日市場上限限制"]}
  ]);

  DB.asdail_kingdom_expansion={
    version:"ASDAIL-KINGDOM-EXPANSION-1.0",
    release:"CURRENT-1.57.0",
    region_id:"REG-ASD-01",
    scope:"F～B",
    content_counts:{settlements:7,wild_maps:8,dungeons:5,fixed_npcs:6,organizations:4,disciplines:2,monsters:12,quests:11,adventure_events:10,items:14,recipes:3,skills:8,lore_records:3,timeline_records:2},
    rules:[
      "阿斯戴爾目前可接觸世界層級由既有C級擴展至B級受限區域。",
      "B級內容需通行資格、委託前置或地區條件，不會出現在F級普通遭遇。",
      "地下城、巢穴、資源、封鎖與通道狀態持久化，不因離場重置。",
      "神話、傳聞與地方民俗不自動升格為CURRENT正史。",
      "不新增主權國、元素、真龍真鳳血脈、魔族公開據點或雷煌流機密。",
      "不改角色初始值、戰鬥公式、存檔schema、掉落規則與既有生態限制。"
    ],
    status:"PASS"
  };

  // MONSTER-THREAT-1.0：成年普通敵人與弱小生物威脅分層。
  const monsterThreatBaseline={"F":{"hp":34,"attack":12,"defense":5,"accuracy":68,"damage":[4,8]},"E":{"hp":48,"attack":16,"defense":8,"accuracy":70,"damage":[5,10]},"D":{"hp":72,"attack":21,"defense":11,"accuracy":72,"damage":[7,14]},"C":{"hp":105,"attack":28,"defense":16,"accuracy":74,"damage":[10,20]},"B":{"hp":155,"attack":38,"defense":23,"accuracy":77,"damage":[13,27]},"A":{"hp":220,"attack":50,"defense":30,"accuracy":80,"damage":[17,35]},"S":{"hp":320,"attack":65,"defense":38,"accuracy":83,"damage":[22,45]}};
  const harmlessMonsterIds=new Set(["MON14-001","MON14-025","MON14-026","MON14-022","LEGACY-MON-001","LEGACY-MON-009","MON14-030","MON14-180"]);
  const harmlessMonsterNames=new Set(["野兔","幼年山羊","貓頭鷹"]);
  for(const monster of DB.monsters||[]){
    const base=monsterThreatBaseline[monster.tier];
    if(!base)continue;
    const harmless=harmlessMonsterIds.has(monster.id)||harmlessMonsterNames.has(monster.name);
    if(harmless){
      monster.threat_profile="harmless";
      monster.harmless_at_level_1=true;
      continue;
    }
    const eliteOrBoss=monster.lore_role==="菁英"||monster.lore_role==="高階首領"||["C","B","A","S"].includes(monster.tier);
    monster.threat_profile=eliteOrBoss?"elite_or_boss":"standard_adult";
    monster.harmless_at_level_1=false;
    monster.hp=Math.max(Number(monster.hp||0),base.hp);
    monster.attack=Math.max(Number(monster.attack||0),base.attack);
    monster.defense=Math.max(Number(monster.defense||0),base.defense);
    monster.accuracy=Math.max(Number(monster.accuracy||0),base.accuracy);
    const oldDamage=Array.isArray(monster.damage)?monster.damage:[0,0];
    monster.damage=[Math.max(Number(oldDamage[0]||0),base.damage[0]),Math.max(Number(oldDamage[1]||0),base.damage[1])];
  }
  DB.monster_threat_balance={
    version:"MONSTER-THREAT-1.0",
    release:"CURRENT-1.57.0",
    total_monsters:(DB.monsters||[]).length,
    harmless_level_1_ids:[...harmlessMonsterIds],
    harmless_level_1_names:[...harmlessMonsterNames],
    baselines:monsterThreatBaseline,
    rules:[
      "野兔、幼年山羊、貓頭鷹等弱小或非戰鬥生物可維持低威脅。",
      "成年普通敵人即使位於F級，也必須能對穿戴起始裝備的1級角色造成可感知傷害。",
      "怪物威脅依階級遞增；C級以上維持菁英／首領級，不得出現在低階普通遭遇。",
      "只提高怪物資料基線，不修改角色初始數值、戰鬥公式、存檔結構、掉落規則或生態棲地限制。"
    ],
    changed_by_tier:{"F":14,"E":36,"D":45,"B":43,"C":47,"A":13,"S":4},
    harmless_count:8
  };
  DB.meta.current_version="CURRENT-1.57.0";
  DB.meta.monster_threat_revision="MONSTER-THREAT-1.0";

})();
