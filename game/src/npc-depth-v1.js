/* 異界旅人：NPC 深化 CURRENT-1.62.0
 * NPC-DEPTH-1.0
 * 個性／需求／壓力／記憶／玩家關係／NPC關係網／委託連動
 */
(()=>{
  if(typeof DB!=="object"||!DB)return;

  const RELEASE="CURRENT-1.62.0";
  const REVISION="NPC-DEPTH-1.0";
  const CFG={
    heartbeat_ms:30000,
    simulation_interval_hours:6,
    max_sim_ticks_per_catchup:32,
    memory_limit:12,
    event_limit:80,
    talk_growth_cooldown_hours:6,
    trust_growth_cooldown_hours:12,
    help_cooldown_hours:24,
    relationship_reward_min:.97,
    relationship_reward_max:1.05,
    max_briefing_time_bonus:.08
  };

  const PROFILE_DATA={
    "NPC-ASD2-001":{domain:"roads",traits:["程序嚴謹","耐心","務實"],values:["通行安全","可追溯紀錄"],goal:"維持王都與地方道路在災害時仍有替代路線。",fear:"一次錯誤封路造成補給斷線。",voice:"說話像在整理一份巡查報告。",concern:"道路、驛站與封鎖替代線是否一致。",workload:1.2,baseStress:24},
    "NPC-ASD2-002":{domain:"legal",traits:["克制","程序導向","重證據"],values:["程序正義","證據完整"],goal:"讓教會仲裁與世俗法務之間保持可驗證邊界。",fear:"傳聞被當成神諭或罪證。",voice:"語氣平穩，會把推測與事實分開。",concern:"封印與仲裁案件是否有足夠證據。",workload:1.1,baseStress:22},
    "NPC-ASD2-003":{domain:"notary",traits:["精確","多疑","守信用"],values:["契約","重量與印記一致"],goal:"降低跨城貨運與委託中的契約爭議。",fear:"偽造文件進入正式檔案。",voice:"常先問交付條件，再談故事。",concern:"貨單、重量與公證印記是否互相吻合。",workload:1.0,baseStress:25},
    "NPC-ASD2-004":{domain:"agriculture",traits:["親切","細心","保守用藥"],values:["蜂群健康","農地永續"],goal:"讓蜂場在不過度用藥的前提下穩定供應。",fear:"短期增產破壞蜂群與花田。",voice:"習慣用蜂群與季節變化解釋事情。",concern:"蜂群、花田與蜂蠟產量是否正常。",workload:.8,baseStress:18},
    "NPC-ASD2-005":{domain:"river",traits:["工程思維","直接","重協調"],values:["水量公平","工程安全"],goal:"平衡上游水磨與下游農田的用水。",fear:"局部搶水演變成地方衝突。",voice:"常用水位與流量說明利害關係。",concern:"水閘、灌渠與雨量是否維持可控。",workload:1.2,baseStress:26},
    "NPC-ASD2-006":{domain:"grain",traits:["沉著","記憶力好","不輕信傳言"],values:["糧重紀錄","穩定供應"],goal:"確保糧倉每一批入出庫都可追查。",fear:"帳面正常卻發生實際斷糧。",voice:"總會先比較袋數、重量與含水率。",concern:"糧倉重量與商隊到貨是否異常。",workload:1.1,baseStress:24},
    "NPC-ASD2-007":{domain:"transport",traits:["豪爽","手藝派","務實"],values:["車輛可靠","護運成本合理"],goal:"讓礦車在惡劣商道上少翻一次就是一次。",fear:"為省小錢而讓整車礦材報廢。",voice:"多用零件、磨耗和修理時間談問題。",concern:"礦車、車軸與赤鐵商道的通行狀況。",workload:1.0,baseStress:23},
    "NPC-ASD2-008":{domain:"mining",traits:["冷靜","專業","重樣本"],values:["材料真實性","合法採礦"],goal:"讓東境礦材分級有一致標準。",fear:"劣質礦材混進高階鍛造流程。",voice:"很少憑外觀下結論，偏好實測。",concern:"礦材純度、熱變質與封印來源。",workload:1.0,baseStress:21},
    "NPC-ASD2-009":{domain:"frontier",traits:["紀律","果斷","保護平民"],values:["預警","撤離秩序"],goal:"讓北境威脅在失控前被看見。",fear:"錯誤烽火或延遲通報造成傷亡。",voice:"句子短，偏好可執行的情報。",concern:"霜線、狼群、烽火與北望補給線。",workload:1.5,baseStress:32},
    "NPC-ASD2-010":{domain:"medicine",traits:["冷靜","同理","反英雄主義"],values:["檢傷順序","可撤離性"],goal:"讓有限醫療資源優先救到最需要的人。",fear:"混亂的救援順序造成可避免死亡。",voice:"會先問症狀、保暖與撤離條件。",concern:"傷員負荷、寒害與撤離線是否超載。",workload:1.4,baseStress:29},
    "NPC-ASD2-011":{domain:"rescue",traits:["果斷","風險敏感","重團隊"],values:["繩索安全","潮汐窗口"],goal:"把每次救難變成可重複的程序，而不是賭運氣。",fear:"有人在錯誤潮位逞強。",voice:"說話像下救難口令，簡短明確。",concern:"外礁潮位、風勢與救難器材。",workload:1.3,baseStress:28},
    "NPC-ASD2-012":{domain:"records",traits:["安靜","細膩","尊重死者"],values:["紀錄完整","不過度推論"],goal:"保存沉潮地區失事者與地方史紀錄。",fear:"故事取代原始記錄。",voice:"用詞謹慎，常提醒資料只能證明什麼。",concern:"受潮名冊與地方紀錄是否持續損壞。",workload:.7,baseStress:17},
    "NPC-ASD2-013":{domain:"forge",traits:["嚴格","技術至上","守密"],values:["工法","材料資格"],goal:"維持公開鍛造品質，同時守住王室機密工法。",fear:"高階材料被不合格工法浪費。",voice:"會直接指出材料、火候或資格哪一項不足。",concern:"精鋼與高階材料供應、工坊品質。",workload:1.2,baseStress:27},
    "NPC-ASD2-014":{domain:"alchemy",traits:["好奇","精準","重安全"],values:["純度","標示與劑量"],goal:"建立野外藥劑的一致安全標準。",fear:"把抑制症狀誤當成治癒。",voice:"習慣說明作用範圍與不能做到的事。",concern:"藥材純度、解毒與穩定劑供應。",workload:1.0,baseStress:20},
    "NPC-ASD2-015":{domain:"relief",traits:["務實","公平","數字敏感"],values:["基本糧食","弱勢優先"],goal:"讓價格波動不至於直接變成飢荒。",fear:"邊鎮缺糧被王都平均數掩蓋。",voice:"常比較王都與邊鎮同一批糧的意義。",concern:"救濟糧、低價麵包與地方缺糧報告。",workload:1.2,baseStress:28},
    "NPC-ASD2-016":{domain:"wetland",traits:["好奇","克制","重測量"],values:["測繪","未知保持未知"],goal:"完成夜鏡沼外圍可靠地圖而不越權推論。",fear:"研究壓力逼迫隊伍進入未許可區域。",voice:"會清楚區分已測量與尚未知的部分。",concern:"夜鏡沼岸線、倒影異常與封鎖區狀況。",workload:1.1,baseStress:26},
    "NPC-ASD2-017":{domain:"infrastructure",traits:["沉穩","系統思考","責任感強"],values:["城市安全","基礎設施連鎖"],goal:"避免王都地下工程牽一髮動全身。",fear:"單一工程決策同時破壞供水、城牆與檔案庫。",voice:"習慣把問題拆成結構、供水與權限三層。",concern:"舊城牆、水道、鑄幣所與封庫結構。",workload:1.4,baseStress:31},
    "NPC-ASD2-018":{domain:"customs",traits:["警覺","公平","熟悉貨運"],values:["合法流通","風險分級"],goal:"攔下真正危險的走私品而不癱瘓正常貿易。",fear:"偽造貨單把危險素材送進人口密集區。",voice:"會從貨單、來源與風險層級逐項核對。",concern:"黎明港貨單、沿岸商隊與危險素材流向。",workload:1.2,baseStress:27}
  };

  const RELATION_EDGES=[
    {a:"NPC-ASD2-001",b:"NPC-ASD2-017",type:"工程協作",affinity:48,note:"道路與地下工務的封鎖方案需要彼此配合。"},
    {a:"NPC-ASD2-002",b:"NPC-ASD2-003",type:"程序合作",affinity:34,note:"仲裁文件經常需要公證人補強證據鏈。"},
    {a:"NPC-ASD2-003",b:"NPC-ASD2-018",type:"跨城查驗",affinity:42,note:"公證印與海關貨單形成相互核驗鏈。"},
    {a:"NPC-ASD2-004",b:"NPC-ASD2-015",type:"民生合作",affinity:36,note:"蜂蜜、亞麻與救濟糧政策會在歉收時互相影響。"},
    {a:"NPC-ASD2-005",b:"NPC-ASD2-006",type:"長期協作",affinity:58,note:"水量直接影響糧倉來源與含水率。"},
    {a:"NPC-ASD2-005",b:"NPC-ASD2-016",type:"測繪合作",affinity:31,note:"渠務資料是濕地測繪的重要基準。"},
    {a:"NPC-ASD2-006",b:"NPC-ASD2-015",type:"糧務協作",affinity:52,note:"一人管實物，一人管救濟與缺糧報告。"},
    {a:"NPC-ASD2-007",b:"NPC-ASD2-008",type:"礦路夥伴",affinity:39,note:"車況與礦材鑑定共同決定一批貨能否安全上路。"},
    {a:"NPC-ASD2-008",b:"NPC-ASD2-013",type:"技術合作",affinity:33,note:"鑑定所提供鍛造院需要的材料品質證明。"},
    {a:"NPC-ASD2-009",b:"NPC-ASD2-010",type:"生死搭檔",affinity:72,note:"守備與救護在北境撤離時共享同一條指揮鏈。"},
    {a:"NPC-ASD2-009",b:"NPC-ASD2-011",type:"專業尊重",affinity:24,note:"兩人都重視撤離程序，只是面對不同地形。"},
    {a:"NPC-ASD2-010",b:"NPC-ASD2-015",type:"救助協作",affinity:28,note:"醫療撤離後往往接著需要民生安置。"},
    {a:"NPC-ASD2-011",b:"NPC-ASD2-012",type:"地方夥伴",affinity:47,note:"救難紀錄最後會成為沉潮名冊的一部分。"},
    {a:"NPC-ASD2-013",b:"NPC-ASD2-014",type:"工藝同僚",affinity:22,note:"高階材料處理常需要鍛造與煉金共同判斷。"},
    {a:"NPC-ASD2-003",b:"NPC-ASD2-006",type:"專業摩擦",affinity:-12,note:"糧倉重效率，公證人重程序，兩邊偶爾互嫌太慢或太冒進。"},
    {a:"NPC-ASD2-016",b:"NPC-ASD2-017",type:"研究協作",affinity:18,note:"未知遺構與王都地下工程都要求嚴格測繪。"}
  ];

  const QUEST_PATRONS={
    "Q1582-ASD-AMBER-BEES":"NPC-ASD2-004","Q1582-ASD-AMBER-FOX":"NPC-ASD2-004",
    "Q1582-ASD-CANAL-FROG":"NPC-ASD2-005","Q1582-ASD-MILL-GATE":"NPC-ASD2-005",
    "Q1582-ASD-GRAIN-WEIGHT":"NPC-ASD2-006","Q1582-ASD-IRONFORD-WHEEL":"NPC-ASD2-007",
    "Q1582-ASD-BASALT-SAMPLE":"NPC-ASD2-008","Q1582-ASD-BASALT-VAULT":"NPC-ASD2-008",
    "Q1582-ASD-FROSTLINE-SCOUT":"NPC-ASD2-009","Q1582-ASD-FROST-WOLF":"NPC-ASD2-009","Q1582-ASD-WATCHCRYPT":"NPC-ASD2-009",
    "Q1582-ASD-FRONTIER-REFUGE":"NPC-ASD2-010","Q1582-ASD-REEF-ROPE":"NPC-ASD2-011","Q1582-ASD-SUNKEN-CHAPEL":"NPC-ASD2-012",
    "Q1582-ASD-OLDMINT-SEAL":"NPC-ASD2-017","Q1582-ASD-MINT-AUDIT":"NPC-ASD2-003",
    "Q1582-ASD-NIGHTMARSH-PERMIT":"NPC-ASD2-016","Q1582-ASD-MIRROR-RUIN":"NPC-ASD2-016",
    "Q1582-ASD-CROWNROOT-PERMIT":"NPC-ASD2-017","Q1582-ASD-CROWNROOT":"NPC-ASD2-017",
    "Q1582-ASD-SEAL-CHAIN":"NPC-ASD2-018"
  };

  DB.meta=DB.meta||{};
  DB.meta.current_version=RELEASE;
  DB.meta.npc_depth_revision=REVISION;
  DB.npc_depth_system={
    version:REVISION,
    dimensions:["個性","精力","壓力","情緒","工作關切","玩家熟悉度","信任","尊重","長期記憶","NPC關係網"],
    rules:[
      "NPC不是等待玩家觸發的靜態服務點；自身狀態依世界時間持續變化。",
      "NPC只記住角色實際發生過的互動、協助、委託完成或失敗，不憑空知道玩家資訊。",
      "NPC關係影響壓力與資訊脈絡，但不自動替玩家做政治或道德判定。",
      "高壓力或低精力可能讓NPC暫時休整，非關鍵互動需等其恢復。",
      "NPC信任只對相關委託提供有限幅度的簡報／報酬改善，不得繞過等級、資格或B級前置。"
    ],
    player_relationship_ranges:{familiarity:[0,100],trust:[-50,100],respect:[-50,100]},
    quest_reward_factor:[CFG.relationship_reward_min,CFG.relationship_reward_max],
    save_schema_changed:false
  };
  DB.npc_personality_profiles=Object.entries(PROFILE_DATA).map(([npc_id,p])=>({npc_id,...p}));
  DB.npc_relationship_edges=RELATION_EDGES.slice();
  DB.npc_quest_patrons={...QUEST_PATRONS};

  const originalPhase2NpcState=typeof globalThis.worldNpcCurrentState==="function"?globalThis.worldNpcCurrentState:null;
  const originalAdjustedRewardRange=typeof globalThis.adjustedRewardRange==="function"?globalThis.adjustedRewardRange:null;
  const originalQuestTimeAllowance=typeof globalThis.questTimeAllowance==="function"?globalThis.questTimeAllowance:null;
  const originalTurnInQuest=typeof globalThis.turnInQuest==="function"?globalThis.turnInQuest:null;
  const originalQuestPenalty=typeof globalThis.applyQuestPenalty==="function"?globalThis.applyQuestPenalty:null;

  function game(){return typeof G!=="undefined"?G:null}
  function nowHour(){return typeof totalHours==="function"?Number(totalHours()||0):0}
  function npcRow(id){return (DB.regional_npc_archetypes||[]).find(x=>x.id===id)||null}
  function locationRow(id){return typeof loc==="function"?loc(id):(DB.locations||[]).find(x=>x.id===id)}
  function clampN(v,a,b){return typeof clamp==="function"?clamp(v,a,b):Math.max(a,Math.min(b,Number(v||0)))}
  function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;")}
  function npcName(id){return npcRow(id)?.name||id}
  function locationName(id){return locationRow(id)?.name||id||"未知地點"}

  function rootState(){
    const g=game();if(!g?.worldState)return null;
    g.worldState.npcDepth=g.worldState.npcDepth&&typeof g.worldState.npcDepth==="object"?g.worldState.npcDepth:{};
    const r=g.worldState.npcDepth;
    r.version=REVISION;r.npcs=r.npcs&&typeof r.npcs==="object"?r.npcs:{};r.events=Array.isArray(r.events)?r.events:[];
    if(!Number.isFinite(Number(r.lastSimHour)))r.lastSimHour=nowHour();
    if(!Number.isFinite(Number(r.lastPersistMs)))r.lastPersistMs=Date.now();
    return r;
  }

  function ensureNpcState(id){
    const r=rootState(),p=PROFILE_DATA[id],row=npcRow(id);if(!r||!p||!row)return null;
    let s=r.npcs[id];
    if(!s||typeof s!=="object")s=r.npcs[id]={id,discovered:false,familiarity:0,trust:0,respect:0,stress:p.baseStress||20,energy:82,mood:"平穩",memories:[],lastInteractionHour:-999,lastTrustTalkHour:-999,lastHelpHour:-999,overrideUntilHour:0,overrideLocationId:null,overrideActivity:null,lastCrisisHour:-999};
    s.memories=Array.isArray(s.memories)?s.memories:[];
    s.familiarity=clampN(Number(s.familiarity||0),0,100);s.trust=clampN(Number(s.trust||0),-50,100);s.respect=clampN(Number(s.respect||0),-50,100);s.stress=clampN(Number(s.stress??p.baseStress??20),0,100);s.energy=clampN(Number(s.energy??82),0,100);
    return s;
  }

  function scheduledState(id){
    const row=npcRow(id);if(!row)return null;
    try{const x=originalPhase2NpcState?originalPhase2NpcState(id):null;if(x)return {...x}}catch(e){}
    const live=game()?.worldState?.worldAutonomy2?.npcs?.[id];
    return live?{...live}:{id,name:row.name,locationId:row.location_id,activity:"日常勤務"};
  }

  function npcEffectiveState(id){
    const s=ensureNpcState(id),base=scheduledState(id);if(!s||!base)return base;
    if(Number(s.overrideUntilHour||0)>nowHour()&&s.overrideLocationId)return {...base,locationId:s.overrideLocationId,activity:s.overrideActivity||"休整",scheduleOverride:true};
    if(Number(s.overrideUntilHour||0)<=nowHour()){s.overrideUntilHour=0;s.overrideLocationId=null;s.overrideActivity=null}
    return base;
  }

  function moodFor(s){
    if(s.stress>=85||s.energy<=15)return "透支";
    if(s.stress>=65)return "緊繃";
    if(s.energy<=35)return "疲憊";
    if(s.stress<=25&&s.energy>=65)return "平穩";
    if(s.stress<=45)return "專注";
    return "忙碌";
  }

  function weatherForNpc(id){
    const st=npcEffectiveState(id),pid=locationRow(st?.locationId)?.province_id;
    if(pid&&typeof globalThis.worldRegionalWeather==="function")try{return globalThis.worldRegionalWeather(pid)}catch(e){}
    return null;
  }

  function maxDungeonPressure(provinceId){
    if(!provinceId||typeof globalThis.worldDungeonState!=="function")return 0;
    let max=0;for(const l of (DB.locations||[])){if(l.kind!=="dungeon"||l.province_id!==provinceId)continue;try{max=Math.max(max,Number(globalThis.worldDungeonState(l.id)?.population||0))}catch(e){}}
    return max;
  }

  function caravanState(id){
    if(typeof globalThis.worldCaravanStates!=="function")return null;
    try{return globalThis.worldCaravanStates()?.[id]||null}catch(e){return null}
  }

  function npcConcern(id){
    const p=PROFILE_DATA[id],st=npcEffectiveState(id);if(!p)return {severity:0,text:"沒有特別公開的關切。"};
    const weather=weatherForNpc(id),w=String(weather?.weather||"");
    const pid=locationRow(st?.locationId)?.province_id;
    const dungeon=maxDungeonPressure(pid);
    if(p.domain==="agriculture"&&typeof globalThis.worldResourceNodeState==="function"){
      try{const n=globalThis.worldResourceNodeState("ASD2-WILD-AMBERFIELDS","ITEM-ASD2-AMBER-HONEY");if(n&&n.max>0&&n.current/n.max<.35)return {severity:3,text:"蜂蜜產量明顯偏低，蜂群與花田需要先恢復。"}}catch(e){}
    }
    if(p.domain==="river"&&/雨|雷/.test(w))return {severity:2,text:"雨帶正在影響河谷，渠務所提高水閘巡查頻率。"};
    if(p.domain==="grain"){const c=caravanState("CARAVAN-ASD-GRAIN");if(c?.status==="in_transit"&&Number(c.arriveHour||0)<nowHour())return {severity:3,text:"月磨糧車超過預定抵達時間，糧倉開始調整出庫。"}}
    if(["transport","mining"].includes(p.domain)){const c=caravanState("CARAVAN-ASD-ORE");if(c?.status==="in_transit"&&Number(c.arriveHour||0)<nowHour())return {severity:2,text:"東境礦材車隊延誤，修車與鑑定排程受到擠壓。"}}
    if(["frontier","medicine"].includes(p.domain)){
      if(dungeon>.78)return {severity:3,text:"北境周邊威脅壓力偏高，守備與救護都在預備撤離方案。"};
      if(/寒|霜|雪/.test(w))return {severity:2,text:"寒冷天候正在增加巡邏與救護負荷。"};
    }
    if(p.domain==="rescue"&&/強風|雷雨|細雨/.test(w))return {severity:3,text:"海岸風浪不穩，救難隊正縮短外礁作業窗口。"};
    if(p.domain==="wetland"){
      if(dungeon>.72)return {severity:3,text:"夜鏡沼周邊異常活動偏高，測繪範圍暫時收縮。"};
      return {severity:1,text:"測繪隊仍只確認岸線與可重複觀測的倒影異常。"};
    }
    if(p.domain==="infrastructure"&&dungeon>.72)return {severity:3,text:"地下設施怪物壓力升高，工務巡檢改採雙人編組。"};
    if(p.domain==="customs"){const c=caravanState("CARAVAN-ASD-COAST");if(c?.status==="in_transit"&&Number(c.arriveHour||0)<nowHour())return {severity:2,text:"沿岸商隊延誤，海關正重新核對未到貨的貨單。"}}
    if(["legal","notary"].includes(p.domain)&&dungeon>.75)return {severity:1,text:"近期封鎖與地下區域紀錄增加，文書核驗量正在上升。"};
    return {severity:0,text:p.concern};
  }

  function relationshipEdgesFor(id){return RELATION_EDGES.filter(e=>e.a===id||e.b===id)}
  function otherNpc(edge,id){return edge.a===id?edge.b:edge.a}

  function remember(id,type,text,valence=0){
    const s=ensureNpcState(id);if(!s)return;
    s.memories.unshift({hour:nowHour(),time:typeof timeText==="function"?timeText():"",type,text:String(text||""),valence:Number(valence||0)});
    if(s.memories.length>CFG.memory_limit)s.memories.length=CFG.memory_limit;
  }

  function pushNpcEvent(type,summary,data={}){
    const r=rootState();if(!r)return;
    const event={id:`NPCD-${Math.round(nowHour())}-${Math.random().toString(36).slice(2,7)}`,hour:nowHour(),time:typeof timeText==="function"?timeText():"",type,summary,data};
    r.events.unshift(event);if(r.events.length>CFG.event_limit)r.events.length=CFG.event_limit;
    const wa=game()?.worldState?.worldAutonomy2;if(wa&&Array.isArray(wa.events)){wa.events.unshift({...event,type:`npc_${type}`});if(wa.events.length>80)wa.events.length=80}
  }

  function sameScheduledLocation(a,b){return npcEffectiveState(a)?.locationId&&npcEffectiveState(a)?.locationId===npcEffectiveState(b)?.locationId}

  function simulateNpcTick(){
    for(const id of Object.keys(PROFILE_DATA)){
      const p=PROFILE_DATA[id],s=ensureNpcState(id);if(!s)continue;
      const st=npcEffectiveState(id),activity=String(st?.activity||"");
      if(s.overrideUntilHour>nowHour()||/休息|休整|晚禱/.test(activity)){s.energy+=10;s.stress-=4}
      else{s.energy-=Math.max(1,2+p.workload);s.stress+=Math.max(0,p.workload-.5)}
      const concern=npcConcern(id);s.stress+=concern.severity*1.2;
      for(const edge of relationshipEdgesFor(id)){
        const other=otherNpc(edge,id);if(!sameScheduledLocation(id,other))continue;
        if(edge.affinity>=30)s.stress-=.7;else if(edge.affinity<0)s.stress+=.6;
      }
      s.energy=clampN(s.energy,0,100);s.stress=clampN(s.stress,0,100);s.mood=moodFor(s);
      if((s.stress>=90||s.energy<=12)&&Number(s.overrideUntilHour||0)<=nowHour()){
        const row=npcRow(id);s.overrideUntilHour=nowHour()+6;s.overrideLocationId=row?.location_id||st?.locationId;s.overrideActivity="暫時休整";
        remember(id,"self","因疲勞或壓力暫停非必要勤務。",-1);
        if(nowHour()-Number(s.lastCrisisHour||-999)>=24){s.lastCrisisHour=nowHour();pushNpcEvent("rest",`${npcName(id)}因長時間工作負荷暫時休整。`,{npcId:id})}
      }
    }
  }

  function markDiscoveries(){
    const g=game();if(!g?.character)return false;let changed=false;
    for(const id of Object.keys(PROFILE_DATA)){
      const s=ensureNpcState(id),st=npcEffectiveState(id);if(s&&st?.locationId===g.character.locationId&&!s.discovered){s.discovered=true;s.discoveredHour=nowHour();remember(id,"meeting",`在${locationName(st.locationId)}第一次與這名旅人照面。`,0);changed=true}
    }
    return changed;
  }

  function npcDepthHeartbeat(reason="interval"){
    const g=game();if(!g?.worldState||!g?.character)return false;g.meta=g.meta||{};g.meta.version=DB.meta.current_version||RELEASE;
    const r=rootState(),now=nowHour(),due=Math.floor(Math.max(0,now-Number(r.lastSimHour||now))/CFG.simulation_interval_hours),ticks=Math.min(due,CFG.max_sim_ticks_per_catchup);
    for(let i=0;i<ticks;i++)simulateNpcTick();if(due>0)r.lastSimHour=Number(r.lastSimHour||now)+due*CFG.simulation_interval_hours;
    const discovered=markDiscoveries(),changed=due>0||discovered;
    if(changed&&Date.now()-Number(r.lastPersistMs||0)>=60000&&typeof persist==="function"){r.lastPersistMs=Date.now();try{persist()}catch(e){}}
    return changed;
  }

  function relationLabel(s){
    if(s.trust>=55&&s.respect>=45)return "深度信任";
    if(s.trust>=30)return "信任";
    if(s.trust>=10)return "友善";
    if(s.trust<=-20)return "戒備";
    if(s.familiarity>=8)return "熟面孔";
    return "陌生";
  }

  function questPatronId(t){const id=typeof t==="string"?t:(t?.id||t?.templateId);return QUEST_PATRONS[id]||null}
  function npcServiceFactor(id){
    const s=ensureNpcState(id);if(!s||!s.discovered)return 1;
    const moodAdj=s.mood==="平穩"?.008:s.mood==="專注"?.006:s.mood==="透支"?-.012:s.mood==="緊繃"?-.006:0;
    return clampN(1+clampN(s.trust,-30,50)*.0007+clampN(s.respect,-20,40)*.00035+moodAdj,CFG.relationship_reward_min,CFG.relationship_reward_max);
  }

  function linkedQuestTemplates(id){return (DB.quest_templates||[]).filter(q=>QUEST_PATRONS[q.id]===id)}

  function spendInteractionTime(label,hours){
    if(typeof beginTurn==="function"&&!beginTurn(label))return false;
    if(typeof endTurn==="function")endTurn(hours);
    return true;
  }

  function canInteract(id){const g=game(),s=ensureNpcState(id),st=npcEffectiveState(id);return !!(g?.character&&s&&st&&st.locationId===g.character.locationId&&!g.character.battle)}

  function greetingFor(id){
    const p=PROFILE_DATA[id],s=ensureNpcState(id),concern=npcConcern(id),recent=s?.memories?.find(m=>m.type==="quest_complete"||m.type==="quest_fail");
    if(recent?.type==="quest_complete"&&nowHour()-recent.hour<120)return `${p.voice} 他還記得你完成的工作：「${recent.text}」`;
    if(recent?.type==="quest_fail"&&nowHour()-recent.hour<120)return `${p.voice} 他對上次的失敗仍有印象，談話比平常更謹慎。`;
    if(s.trust>=30)return `${p.voice} 見到你時態度明顯放鬆。${concern.severity?`目前最在意的是：${concern.text}`:""}`;
    if(s.familiarity>=5)return `${p.voice} 他認得你，沒有再把你當成第一次見面的旅人。${concern.severity?`目前正忙於：${concern.text}`:""}`;
    return `${p.voice} ${concern.text}`;
  }

  function npcInteractTalk(id){
    if(!canInteract(id)){if(typeof alert==="function")alert("這名NPC目前不在你所在的位置，或現在無法交談。");return}
    const s=ensureNpcState(id),now=nowHour();if(!spendInteractionTime(`與${npcName(id)}交談`,.05))return;
    if(now-Number(s.lastInteractionHour||-999)>=CFG.talk_growth_cooldown_hours)s.familiarity=clampN(s.familiarity+1,0,100);
    if(now-Number(s.lastTrustTalkHour||-999)>=CFG.trust_growth_cooldown_hours&&s.stress<80){s.trust=clampN(s.trust+1,-50,100);s.lastTrustTalkHour=now}
    s.lastInteractionHour=now;s.stress=clampN(s.stress-1,0,100);s.mood=moodFor(s);remember(id,"talk","與玩家進行了一次正常交談。",1);if(typeof persist==="function")persist();openNpcProfile(id,greetingFor(id));
  }

  function npcAskWork(id){
    if(!canInteract(id)){if(typeof alert==="function")alert("這名NPC目前不在你所在的位置。");return}
    const s=ensureNpcState(id);if(!spendInteractionTime(`詢問${npcName(id)}的工作`,.05))return;s.familiarity=clampN(s.familiarity+1,0,100);remember(id,"work","玩家主動詢問目前工作的困難。",1);if(typeof persist==="function")persist();
    const concern=npcConcern(id),qs=linkedQuestTemplates(id).filter(q=>!(game()?.quests||[]).some(a=>a.templateId===q.id));
    const lead=qs.length?`可能相關的公開委託：${qs.slice(0,3).map(q=>`${q.name}［${q.tier}］`).join("、")}。這只是人物線索，不會繞過公會、等級或資格限制。`:"目前沒有新的公開委託線索。";
    openNpcProfile(id,`${concern.text} ${lead}`);
  }

  function npcOfferHelp(id){
    if(!canInteract(id)){if(typeof alert==="function")alert("這名NPC目前不在你所在的位置。");return}
    const s=ensureNpcState(id),now=nowHour();if(now-Number(s.lastHelpHour||-999)<CFG.help_cooldown_hours){if(typeof alert==="function")alert(`你最近已協助過這名NPC，約${Math.ceil(CFG.help_cooldown_hours-(now-s.lastHelpHour))}小時後再提供實質協助。`);return}
    if(!spendInteractionTime(`協助${npcName(id)}`,.2))return;
    s.lastHelpHour=now;s.familiarity=clampN(s.familiarity+1,0,100);s.trust=clampN(s.trust+2,-50,100);s.respect=clampN(s.respect+1,-50,100);s.stress=clampN(s.stress-8,0,100);s.energy=clampN(s.energy+2,0,100);s.mood=moodFor(s);
    remember(id,"help","玩家在沒有額外索取報酬的情況下協助處理當前工作。",2);pushNpcEvent("player_help",`${npcName(id)}得到玩家協助，工作壓力暫時下降。`,{npcId:id});if(typeof persist==="function")persist();openNpcProfile(id,"你的協助確實減輕了眼前工作量；這會被記住，但不能無限重複累積關係。");
  }

  function npcAskRelations(id){
    if(!canInteract(id)){if(typeof alert==="function")alert("這名NPC目前不在你所在的位置。");return}
    const s=ensureNpcState(id);if(s.familiarity<5||s.trust<10){if(typeof alert==="function")alert("你們還不熟，對方不會主動談私人或工作上的人際關係。");return}
    if(!spendInteractionTime(`與${npcName(id)}談人際關係`,.05))return;
    const edges=relationshipEdgesFor(id).sort((a,b)=>Math.abs(b.affinity)-Math.abs(a.affinity)),e=edges[0];if(!e){openNpcProfile(id,"對方沒有談到值得記錄的人際關係。");return}
    const other=otherNpc(e,id),text=`他提到${npcName(other)}：兩人屬於「${e.type}」。${e.note}`;remember(id,"relation",text,e.affinity>=0?1:-1);openNpcProfile(id,text);
  }

  function recentMemoryHtml(s){return (s.memories||[]).slice(0,5).map(m=>`<div class="small">${esc(m.time||"")}｜${esc(m.text)}</div>`).join("")||"<div class='small'>目前沒有你能確認的共同記憶。</div>"}

  function openNpcProfile(id,message=""){
    npcDepthHeartbeat("profile");const row=npcRow(id),p=PROFILE_DATA[id],s=ensureNpcState(id),st=npcEffectiveState(id);if(!row||!p||!s)return;
    const nearby=canInteract(id),concern=npcConcern(id),services=(row.services||[]).join("、")||"無固定公開服務";
    const edges=relationshipEdgesFor(id),network=(s.familiarity>=5&&s.trust>=10)?edges.map(e=>`<div class="small">${esc(npcName(otherNpc(e,id)))}｜${esc(e.type)}｜${esc(e.note)}</div>`).join(""):"<div class='small'>熟悉度5且信任10以上後，才會逐步知道其人際關係。</div>";
    const linked=linkedQuestTemplates(id),quests=linked.length?linked.slice(0,5).map(q=>`<div class="small">${esc(q.name)}［${esc(q.tier)}］</div>`).join(""):"<div class='small'>沒有直接關聯的公開委託。</div>";
    const body=`${message?`<div class="card"><b>交談</b><br><span class="small">${esc(message)}</span></div>`:""}<div class="card"><b>${esc(row.name)}</b> <span class="tier">${esc(row.tier)}</span><br><span class="small">${esc(row.role)}｜目前：${esc(locationName(st?.locationId))}・${esc(st?.activity||"日常勤務")}<br>${esc(row.description||"")}</span></div><div class="card"><b>性格與原則</b><br><span class="small">特質：${esc(p.traits.join("、"))}<br>重視：${esc(p.values.join("、"))}<br>長期目標：${esc(p.goal)}<br>擔憂：${esc(p.fear)}</span></div><div class="card"><b>目前狀態</b><br><span class="small">情緒：${esc(s.mood)}｜精力 ${Math.round(s.energy)}/100｜壓力 ${Math.round(s.stress)}/100<br>當前關切：${esc(concern.text)}</span></div><div class="card"><b>你與他的關係</b><br><span class="small">${esc(relationLabel(s))}｜熟悉 ${Math.round(s.familiarity)}/100｜信任 ${Math.round(s.trust)}｜尊重 ${Math.round(s.respect)}<br>相關工作服務品質倍率：約${Math.round(npcServiceFactor(id)*100)}%，只在有限範圍影響相關委託簡報／報酬。</span></div><div class="card"><b>公開服務</b><br><span class="small">${esc(services)}</span></div><div class="card"><b>相關公開委託</b>${quests}</div><div class="card"><b>已知人際網</b>${network}</div><div class="card"><b>共同記憶</b>${recentMemoryHtml(s)}</div>${nearby?`<div class="actions"><button onclick="npcInteractTalk('${id}')">交談</button><button onclick="npcAskWork('${id}')">詢問工作</button><button onclick="npcOfferHelp('${id}')">提供協助</button><button onclick="npcAskRelations('${id}')">談人際關係</button></div>`:`<div class="card small">這名NPC目前不在你所在的位置；人物誌仍保留你已知的關係與記憶。</div>`}<div class="actions"><button onclick="openNpcJournal()">返回人物誌</button></div>`;
    if(typeof showModal==="function")showModal(`${row.name}・人物誌`,body);
  }

  function openNpcJournal(){
    npcDepthHeartbeat("journal");const g=game(),r=rootState();if(!g||!r)return;
    const known=Object.keys(PROFILE_DATA).map(id=>[id,ensureNpcState(id)]).filter(([,s])=>s?.discovered);known.sort((a,b)=>{const an=npcEffectiveState(a[0])?.locationId===g.character.locationId?0:1,bn=npcEffectiveState(b[0])?.locationId===g.character.locationId?0:1;return an-bn||npcName(a[0]).localeCompare(npcName(b[0]),"zh-Hant")});
    const rows=known.map(([id,s])=>{const row=npcRow(id),st=npcEffectiveState(id),near=st?.locationId===g.character.locationId;return `<div class="itemrow"><span><b>${esc(row?.name||id)}</b> <span class="tier">${esc(row?.tier||"")}</span>${near?"｜<b>在附近</b>":""}<br><span class="small">${esc(row?.role||"")}｜${esc(locationName(st?.locationId))}・${esc(st?.activity||"")}<br>${esc(relationLabel(s))}｜${esc(s.mood)}｜壓力${Math.round(s.stress)}</span></span><button onclick="openNpcProfile('${id}')">查看</button></div>`}).join("")||"<div class='card small'>你還沒有實際遇見任何已建檔固定NPC。探索城鎮與工作地點後，人物會逐步加入人物誌。</div>";
    const unknown=Math.max(0,Object.keys(PROFILE_DATA).length-known.length),events=(r.events||[]).slice(0,5).map(e=>`<div class="small">${esc(e.time||"")}｜${esc(e.summary)}</div>`).join("")||"<div class='small'>尚無近期人物事件。</div>";
    if(typeof showModal==="function")showModal("人物誌",`<div class="card small">已認識 ${known.length}/${Object.keys(PROFILE_DATA).length} 名固定NPC｜尚未認識 ${unknown} 名。人物的作息、精力、壓力、記憶與關係會隨世界時間持續變化，不會等待玩家。</div>${rows}<div class="card"><b>近期人物動態</b>${events}</div>`);
  }

  function patchQuestEconomy(){
    if(originalAdjustedRewardRange&&!globalThis.__NPC_DEPTH_REWARD_PATCHED){globalThis.adjustedRewardRange=function(t){const base=originalAdjustedRewardRange.apply(this,arguments);if(!Array.isArray(base)||base.length<2)return base;const patron=questPatronId(t);if(!patron)return base;const f=npcServiceFactor(patron);return [Math.max(1,Math.round(Number(base[0]||0)*f)),Math.max(1,Math.round(Number(base[1]||0)*f)),base[2]]};globalThis.__NPC_DEPTH_REWARD_PATCHED=true}
    if(originalQuestTimeAllowance&&!globalThis.__NPC_DEPTH_TIME_PATCHED){globalThis.questTimeAllowance=function(t){const base=Number(originalQuestTimeAllowance.apply(this,arguments)||0),patron=questPatronId(t),s=patron?ensureNpcState(patron):null;if(!s?.discovered)return base;const bonus=clampN((s.trust>=25?.05:0)+(s.respect>=30?.03:0),0,CFG.max_briefing_time_bonus);return base*(1+bonus)};globalThis.__NPC_DEPTH_TIME_PATCHED=true}
    if(originalTurnInQuest&&!globalThis.__NPC_DEPTH_TURNIN_PATCHED){globalThis.turnInQuest=function(id){const g=game(),q=(g?.quests||[]).find(x=>x.id===id),patron=q?questPatronId(q):null,name=q?.name||"委託";const result=originalTurnInQuest.apply(this,arguments);if(q&&patron&&!(game()?.quests||[]).some(x=>x.id===id)){const s=ensureNpcState(patron);if(s){s.discovered=true;s.trust=clampN(s.trust+2,-50,100);s.respect=clampN(s.respect+2,-50,100);s.stress=clampN(s.stress-2,0,100);remember(patron,"quest_complete",`玩家完成「${name}」。`,3);pushNpcEvent("quest_complete",`${npcName(patron)}記住了玩家完成「${name}」。`,{npcId:patron,questId:q.templateId})}}return result};globalThis.__NPC_DEPTH_TURNIN_PATCHED=true}
    if(originalQuestPenalty&&!globalThis.__NPC_DEPTH_PENALTY_PATCHED){globalThis.applyQuestPenalty=function(q,reason){const result=originalQuestPenalty.apply(this,arguments),patron=q?questPatronId(q):null;if(patron){const s=ensureNpcState(patron);if(s){s.trust=clampN(s.trust-2,-50,100);s.respect=clampN(s.respect-1,-50,100);s.stress=clampN(s.stress+2,0,100);remember(patron,"quest_fail",`玩家的「${q.name||"委託"}」因${reason||"失敗"}未完成。`,-2)}}return result};globalThis.__NPC_DEPTH_PENALTY_PATCHED=true}
  }

  function patchMoreMenu(){
    if(globalThis.__NPC_DEPTH_MENU_PATCHED||typeof globalThis.openMoreMenu!=="function")return;const original=globalThis.openMoreMenu;
    globalThis.openMoreMenu=function(){const result=original.apply(this,arguments);setTimeout(()=>{const grid=typeof document!=="undefined"?document.querySelector("#modalBody .more-grid"):null;if(grid&&!grid.querySelector("[data-npc-depth]")){const b=document.createElement("button");b.className="more-card";b.dataset.npcDepth="1";b.innerHTML='<span class="more-icon">♙</span><span>人物誌</span>';b.addEventListener("click",()=>globalThis.openNpcJournal?.());grid.appendChild(b)}},0);return result};globalThis.__NPC_DEPTH_MENU_PATCHED=true;
  }

  function initialize(){
    const g=game();if(!g?.worldState)return false;g.meta=g.meta||{};g.meta.version=DB.meta.current_version||RELEASE;rootState();for(const id of Object.keys(PROFILE_DATA))ensureNpcState(id);markDiscoveries();patchQuestEconomy();patchMoreMenu();return true;
  }

  globalThis.worldNpcCurrentState=npcEffectiveState;
  globalThis.ensureNpcDepthState=ensureNpcState;
  globalThis.npcDepthHeartbeat=npcDepthHeartbeat;
  globalThis.npcConcern=npcConcern;
  globalThis.npcServiceFactor=npcServiceFactor;
  globalThis.npcRelationshipEdgesFor=relationshipEdgesFor;
  globalThis.openNpcJournal=openNpcJournal;
  globalThis.openNpcProfile=openNpcProfile;
  globalThis.npcInteractTalk=npcInteractTalk;
  globalThis.npcAskWork=npcAskWork;
  globalThis.npcOfferHelp=npcOfferHelp;
  globalThis.npcAskRelations=npcAskRelations;
  globalThis.NPC_DEPTH_CONFIG=Object.freeze({...CFG});

  initialize();
  if(typeof document!=="undefined")document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(()=>npcDepthHeartbeat("visible"),80)});
  if(typeof window!=="undefined")window.addEventListener("focus",()=>setTimeout(()=>npcDepthHeartbeat("focus"),80));
  setInterval(()=>npcDepthHeartbeat("interval"),CFG.heartbeat_ms);
  setTimeout(()=>npcDepthHeartbeat("startup"),100);
})();
