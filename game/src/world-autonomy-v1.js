/* 異界旅人：自主世界運行 CURRENT-1.60.0
 * WORLD-AUTONOMY-1.0
 *
 * 核心原則：
 * - 世界時間不再依賴玩家回合才前進；現實1分鐘 = 世界1分鐘。
 * - 玩家離線、停留選單或瀏覽器分頁閒置後，重新取得執行權時依真實經過時間補算。
 * - 組織、政治、權力、流派與S級影響改以世界時間每6小時評估一次，而非每個玩家回合。
 * - 委託期限、市場需求壓力、商店換日等既有時間系統跟著世界時間自然推進。
 * - 離線補算不直接消耗角色HP／飢餓／口渴／疲勞，也不主動觸發戰鬥或遭遇。
 */
(()=>{
  if(typeof DB!=="object"||!DB)return;

  const RELEASE="CURRENT-1.60.0";
  const REVISION="WORLD-AUTONOMY-1.0";
  const CFG={
    real_to_game_ratio:1,
    heartbeat_ms:30000,
    persist_interval_ms:60000,
    dynamic_interval_hours:6,
    weather_interval_hours:6,
    max_dynamic_ticks_per_catchup:24,
    offline_summary_min_game_minutes:30,
    no_offline_character_drain:true,
    no_forced_offline_encounters:true
  };

  DB.meta=DB.meta||{};
  DB.meta.current_version=RELEASE;
  DB.meta.world_autonomy_revision=REVISION;
  DB.world_autonomy_system={
    version:REVISION,
    mode:"wall_clock_persistent_world",
    real_to_game_ratio:CFG.real_to_game_ratio,
    heartbeat_seconds:CFG.heartbeat_ms/1000,
    dynamic_interval_hours:CFG.dynamic_interval_hours,
    principles:[
      "世界時間與玩家回合分離。",
      "玩家不操作時，世界仍依真實經過時間前進。",
      "玩家主動行動仍可額外消耗遊戲世界時間。",
      "世界動態依世界小時而非G.turn觸發。",
      "離線期間不對玩家角色執行被動傷害、飢餓、口渴、疲勞或強制遭遇。",
      "委託期限、商店換日與市場壓力屬世界制度，會持續計時。"
    ],
    active_subsystems:["世界時鐘","離線補算","組織動態","政治動態","權力動態","流派動態","S級影響","委託期限","市場壓力衰減","商店換日","天候狀態"],
    planned_extensions:["固定NPC日程與移動","商隊與物流路線","野外資源節點恢復","地下城重生與佔領狀態","跨區天候 фронт","地方事件排程器"]
  };

  const WEATHER_NORMAL=["晴朗","多雲","陰天","薄霧","微風","細雨"];
  const WEATHER_COLD=["晴冷","多雲","陰天","薄霧","寒風","霜雪"];
  const WEATHER_HOT=["晴朗","炎熱","多雲","陣雨","雷雨","強風"];

  function worldAutonomyState(now=Date.now()){
    if(!G?.worldState)return null;
    G.worldState.worldAutonomy=G.worldState.worldAutonomy||{};
    const s=G.worldState.worldAutonomy;
    s.version=REVISION;
    if(!Number.isFinite(Number(s.lastRealMs)))s.lastRealMs=now;
    if(!Number.isFinite(Number(s.minuteCarry)))s.minuteCarry=0;
    if(!Number.isFinite(Number(s.lastDynamicHour)))s.lastDynamicHour=typeof totalHours==="function"?totalHours():0;
    if(!Number.isFinite(Number(s.lastWeatherHour)))s.lastWeatherHour=typeof totalHours==="function"?totalHours():0;
    if(!Number.isFinite(Number(s.lastPersistMs)))s.lastPersistMs=now;
    if(!Number.isFinite(Number(s.totalAutonomousMinutes)))s.totalAutonomousMinutes=0;
    if(!Number.isFinite(Number(s.dynamicTicks)))s.dynamicTicks=0;
    if(!Number.isFinite(Number(s.executedDynamicTicks)))s.executedDynamicTicks=0;
    if(!Number.isFinite(Number(s.coalescedDynamicTicks)))s.coalescedDynamicTicks=0;
    return s;
  }

  function advanceWorldClockMinutes(minutes){
    if(!G?.worldTime||!Number.isFinite(Number(minutes))||minutes<=0)return 0;
    const s=worldAutonomyState();
    const exact=Math.max(0,Number(minutes))+Number(s.minuteCarry||0);
    const whole=Math.floor(exact);
    s.minuteCarry=exact-whole;
    if(whole<1)return 0;

    const t=G.worldTime;
    const currentMinute=Math.max(0,Number(t.minute||0));
    const currentHour=Math.max(0,Number(t.hour||0));
    const combined=currentHour*60+currentMinute+whole;
    const dayAdvance=Math.floor(combined/1440);
    const remainder=((combined%1440)+1440)%1440;
    t.day=Math.max(1,Number(t.day||1)+dayAdvance);
    t.hour=Math.floor(remainder/60);
    t.minute=remainder%60;
    return whole;
  }

  function currentMarketDayKey(){
    if(typeof marketDayKey==="function")return marketDayKey();
    const t=G?.worldTime||{};
    return `${t.year||0}-${t.season||""}-${t.day||1}`;
  }

  function resetDailyLocalMarketsIfNeeded(s){
    const key=currentMarketDayKey();
    if(!s.lastMarketDay){s.lastMarketDay=key;return false}
    if(s.lastMarketDay===key)return false;
    s.lastMarketDay=key;
    s.dailyPulses=Number(s.dailyPulses||0)+1;
    if(G?.worldState?.localMarkets&&typeof G.worldState.localMarkets==="object")G.worldState.localMarkets={};
    return true;
  }

  function pruneTimedWorldLedgers(){
    if(!G?.worldState||typeof totalHours!=="function")return;
    const now=totalHours();
    const questWindow=Number(DB.quest_system?.market_demand?.window_hours||120);
    if(Array.isArray(G.worldState.questMarketLedger))G.worldState.questMarketLedger=G.worldState.questMarketLedger.filter(x=>Number.isFinite(Number(x?.hour))&&now-Number(x.hour)<=questWindow);
    const itemWindow=Number(DB.market_economy_system?.local_trade_flow?.window_hours||96);
    if(Array.isArray(G.worldState.itemMarketTradeLedger))G.worldState.itemMarketTradeLedger=G.worldState.itemMarketTradeLedger.filter(x=>Number.isFinite(Number(x?.hour))&&now-Number(x.hour)<=itemWindow);
  }

  function weatherPool(){
    const season=String(G?.worldTime?.season||"");
    if(/冬|寒|霜|雪/.test(season))return WEATHER_COLD;
    if(/夏|炎|暑/.test(season))return WEATHER_HOT;
    return WEATHER_NORMAL;
  }

  function evaluateWeatherByClock(s){
    if(typeof totalHours!=="function")return false;
    const now=totalHours(),interval=CFG.weather_interval_hours;
    const due=Math.floor(Math.max(0,now-Number(s.lastWeatherHour||now))/interval);
    if(due<1)return false;
    const pool=weatherPool();
    const old=G.worldState.weather||"晴朗";
    let next=old;
    for(let i=0;i<Math.min(due,8);i++){
      const candidate=pool[Math.floor(Math.random()*pool.length)]||old;
      if(candidate!==next||pool.length===1)next=candidate;
    }
    G.worldState.weather=next;
    G.worldState.weatherHistory=Array.isArray(G.worldState.weatherHistory)?G.worldState.weatherHistory:[];
    if(next!==old){
      G.worldState.weatherHistory.unshift({hour:now,time:typeof timeText==="function"?timeText():"",weather:next});
      if(G.worldState.weatherHistory.length>20)G.worldState.weatherHistory.length=20;
    }
    s.lastWeatherHour=Number(s.lastWeatherHour||now)+due*interval;
    return true;
  }

  function evaluateOneWorldDynamicTick(){
    const fns=["evaluateOrganizationDynamics","evaluatePoliticalDynamics","evaluateAuthorityDynamics","evaluateDisciplineDynamics","evaluateSTierInfluence"];
    for(const name of fns){
      try{
        const fn=globalThis[name];
        if(typeof fn==="function")fn();
      }catch(error){console.warn(`world autonomy ${name} failed`,error)}
    }
  }

  function runWorldDynamicsByClock(force=false){
    if(!G?.worldState||typeof totalHours!=="function")return false;
    const s=worldAutonomyState();
    const now=totalHours(),interval=CFG.dynamic_interval_hours;
    let due=Math.floor(Math.max(0,now-Number(s.lastDynamicHour||now))/interval);
    if(force&&due<1)due=1;
    if(due<1)return false;
    const execute=Math.min(due,CFG.max_dynamic_ticks_per_catchup);
    for(let i=0;i<execute;i++)evaluateOneWorldDynamicTick();
    s.dynamicTicks+=due;
    s.executedDynamicTicks+=execute;
    if(due>execute)s.coalescedDynamicTicks+=due-execute;
    s.lastDynamicHour=force&&due===1&&now-Number(s.lastDynamicHour||now)<interval?now:Number(s.lastDynamicHour||now)+due*interval;
    G.worldState.orchestrator=G.worldState.orchestrator||{};
    G.worldState.orchestrator.lastWorldDynamicTurn=G.turn;
    G.worldState.orchestrator.lastWorldDynamicHour=s.lastDynamicHour;
    return true;
  }

  runWorldDynamics=runWorldDynamicsByClock;

  function updateWorldInstitutions(){
    pruneTimedWorldLedgers();
    if(typeof updateQuestDeadlines==="function"){
      try{updateQuestDeadlines()}catch(error){console.warn("autonomous quest deadline update failed",error)}
    }
  }

  function refreshAutonomousClockUi(){
    try{
      const el=document.querySelector("#timeTop");
      if(el&&typeof timeText==="function")el.textContent=timeText();
    }catch(error){}
  }

  function durationText(minutes){
    const m=Math.max(0,Math.round(minutes));
    const d=Math.floor(m/1440),h=Math.floor((m%1440)/60),r=m%60;
    return [d?`${d}日`:"",h?`${h}小時`:"",(!d&&!h)||r?`${r}分鐘`:""].filter(Boolean).join("");
  }

  function worldAutonomyHeartbeat(reason="interval",now=Date.now()){
    if(typeof G==="undefined"||!G?.worldTime||!G?.character)return 0;
    const s=worldAutonomyState(now);
    G.meta=G.meta||{};
    G.meta.version=RELEASE;
    const previous=Number(s.lastRealMs||now);
    let deltaMs=Number(now)-previous;
    s.lastRealMs=Number(now);
    if(!Number.isFinite(deltaMs)||deltaMs<=0){
      if(deltaMs<0)s.clockRollbackCount=Number(s.clockRollbackCount||0)+1;
      return 0;
    }

    const gameMinutes=deltaMs/60000*CFG.real_to_game_ratio;
    const advanced=advanceWorldClockMinutes(gameMinutes);
    if(advanced<1)return 0;

    s.totalAutonomousMinutes+=advanced;
    resetDailyLocalMarketsIfNeeded(s);
    updateWorldInstitutions();
    runWorldDynamicsByClock(false);
    evaluateWeatherByClock(s);
    refreshAutonomousClockUi();

    const interactiveCatchup=reason!=="interval"&&advanced>=CFG.offline_summary_min_game_minutes;
    if(interactiveCatchup&&typeof log==="function"){
      log("世界運行",`你未操作期間，世界已自主推進 ${durationText(advanced)}。委託期限、市場與勢力狀態依世界時間更新；角色本身沒有被動扣除生命、飢餓、口渴或疲勞，也不會被強制拉入戰鬥。`,"ok");
    }

    const shouldPersist=interactiveCatchup||Number(now)-Number(s.lastPersistMs||0)>=CFG.persist_interval_ms||reason==="hidden"||reason==="beforeunload";
    if(shouldPersist&&typeof persist==="function"){
      s.lastPersistMs=Number(now);
      try{persist()}catch(error){console.warn("world autonomy persist failed",error)}
    }
    return advanced;
  }

  let timer=null;
  function startWorldAutonomy(){
    if(timer)return;
    timer=setInterval(()=>worldAutonomyHeartbeat("interval"),CFG.heartbeat_ms);
    setTimeout(()=>worldAutonomyHeartbeat("startup"),0);
  }

  if(typeof document!=="undefined"){
    document.addEventListener("visibilitychange",()=>{
      if(document.visibilityState==="hidden")worldAutonomyHeartbeat("hidden");
      else worldAutonomyHeartbeat("visible");
    });
  }
  if(typeof window!=="undefined"){
    window.addEventListener("focus",()=>worldAutonomyHeartbeat("focus"));
    window.addEventListener("beforeunload",()=>worldAutonomyHeartbeat("beforeunload"));
  }

  globalThis.worldAutonomyHeartbeat=worldAutonomyHeartbeat;
  globalThis.worldAutonomyState=worldAutonomyState;
  globalThis.runWorldDynamicsByClock=runWorldDynamicsByClock;
  globalThis.WORLD_AUTONOMY_CONFIG=Object.freeze({...CFG});
  startWorldAutonomy();
})();
