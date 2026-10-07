/* 異界旅人：自主世界第二階段 CURRENT-1.61.0
 * WORLD-AUTONOMY-2.0
 * NPC日程／商隊物流／資源再生／地下城重生與佔領／跨區天候鋒面
 */
(()=>{
  if(typeof DB!=="object"||!DB)return;

  const RELEASE="CURRENT-1.61.0";
  const REVISION="WORLD-AUTONOMY-2.0";
  const CFG={
    heartbeat_ms:30000,
    npc_tick_hours:1,
    caravan_max_transitions_per_tick:64,
    resource_tick_hours:1,
    dungeon_tick_hours:6,
    weather_front_tick_hours:3,
    persist_interval_ms:60000,
    event_history_limit:80
  };

  DB.meta=DB.meta||{};
  DB.meta.current_version=RELEASE;
  DB.meta.world_autonomy_revision=REVISION;
  DB.world_autonomy_phase2_system={
    version:REVISION,
    mode:"persistent_simulated_world_state",
    subsystems:["固定NPC日程與移動","商隊物流與市場脈衝","野外資源容量與再生","地下城重生與佔領","跨區天候鋒面"],
    rules:[
      "所有第二階段狀態寫入G.worldState並隨既有存檔保存。",
      "NPC位置由世界時刻決定，不等待玩家觸發。",
      "商隊離開產地時降低當地供應，抵達目的地時增加當地供應，沿用MARKET-PRICE-SYNC-2.0價格模型。",
      "採集會扣除當地資源節點容量，節點依世界時間逐步恢復。",
      "地下城討伐會降低怪物壓力，之後依世界時間再生並可能改變佔領者。",
      "天候以行省為單位保存，鋒面會跨行省移動；角色所在地天候同步到既有weather欄位。",
      "離線補算只推進世界狀態，不直接傷害角色或強制發生戰鬥。"
    ],
    save_schema_changed:false,
    compatible_with:["WORLD-AUTONOMY-1.0","MARKET-PRICE-SYNC-2.0"]
  };

  const SPECIAL_RESOURCE_CONFIG={
    "ITEM-ASD2-AMBER-HONEY":{max:10,regen_hours_per_unit:8},
    "ITEM-ASD2-BEESWAX":{max:8,regen_hours_per_unit:12},
    "ITEM-ASD2-FLAX":{max:16,regen_hours_per_unit:5},
    "ITEM-ASD2-REEF-SALT":{max:18,regen_hours_per_unit:6},
    "ITEM-ASD2-MIRROR-MUD":{max:3,regen_hours_per_unit:48}
  };

  const GATHER_PATCHES={
    "ASD2-WILD-AMBERFIELDS":["ITEM-ASD2-AMBER-HONEY","ITEM-ASD2-BEESWAX","ITEM-ASD2-FLAX"],
    "ASD2-WILD-SEABREAKREEF":["ITEM-ASD2-REEF-SALT"],
    "ASD2-WILD-NIGHTMARSH":["ITEM-ASD2-MIRROR-MUD"]
  };
  let resourcePairsCache=null,gatherPatchesApplied=false,heartbeatTimer=null,pendingHeartbeatReason="";

  const NPC_SCHEDULES={
    "NPC-ASD2-001":[[0,6,"ASD-CAPITAL","休息"],[6,10,"ASD2-WILD-CROWNFALLOW","道路巡查"],[10,19,"ASD-CAPITAL","道路監理"],[19,24,"ASD-CAPITAL","整理公文"]],
    "NPC-ASD2-002":[[0,7,"ASD-CAPITAL","休息"],[7,19,"ASD-CAPITAL","白塔仲裁"],[19,24,"ASD-CAPITAL","晚禱與卷宗"]],
    "NPC-ASD2-003":[[0,8,"ASD-CAPITAL","休息"],[8,18,"ASD-CAPITAL","公證業務"],[18,24,"ASD-CAPITAL","核對貨單"]],
    "NPC-ASD2-004":[[0,6,"ASD2-AMBERFIELD","休息"],[6,12,"ASD2-WILD-AMBERFIELDS","巡視蜂場"],[12,17,"ASD2-AMBERFIELD","農產協會"],[17,20,"ASD2-WILD-AMBERFIELDS","收箱巡田"],[20,24,"ASD2-AMBERFIELD","休息"]],
    "NPC-ASD2-005":[[0,6,"ASD2-MOONMILL","休息"],[6,11,"ASD2-WILD-MILLCHANNEL","巡查水閘"],[11,18,"ASD2-MOONMILL","渠務所"],[18,20,"ASD2-WILD-MILLCHANNEL","晚間水位檢查"],[20,24,"ASD2-MOONMILL","休息"]],
    "NPC-ASD2-006":[[0,6,"ASD2-MOONMILL","休息"],[6,18,"ASD2-MOONMILL","糧倉盤點"],[18,24,"ASD2-MOONMILL","交接與休息"]],
    "NPC-ASD2-007":[[0,7,"ASD2-IRONFORD","休息"],[7,15,"ASD2-IRONFORD","修車工坊"],[15,18,"ASD2-WILD-IRONTRAIL","道路救援"],[18,24,"ASD2-IRONFORD","休息"]],
    "NPC-ASD2-008":[[0,7,"ASD2-IRONFORD","休息"],[7,17,"ASD2-IRONFORD","礦材鑑定"],[17,20,"ASD2-WILD-IRONTRAIL","抽查礦車"],[20,24,"ASD2-IRONFORD","休息"]],
    "NPC-ASD2-009":[[0,5,"ASD2-NORTHWATCH","堡內值勤"],[5,10,"ASD2-WILD-FROSTLINE","雪線巡邏"],[10,18,"ASD2-NORTHWATCH","守備勤務"],[18,21,"ASD2-WILD-FROSTLINE","烽火巡查"],[21,24,"ASD2-NORTHWATCH","堡內值勤"]],
    "NPC-ASD2-010":[[0,7,"ASD2-NORTHWATCH","休息"],[7,19,"ASD2-NORTHWATCH","傷兵救護"],[19,24,"ASD2-NORTHWATCH","夜間待命"]],
    "NPC-ASD2-011":[[0,5,"ASD2-SEABREAK","休息"],[5,13,"ASD2-WILD-SEABREAKREEF","礁岸巡救"],[13,18,"ASD2-SEABREAK","救難隊整備"],[18,21,"ASD2-WILD-SEABREAKREEF","潮位巡查"],[21,24,"ASD2-SEABREAK","休息"]],
    "NPC-ASD2-012":[[0,7,"ASD2-SEABREAK","休息"],[7,18,"ASD2-SEABREAK","抄錄名冊"],[18,24,"ASD2-SEABREAK","晚禱與整理"]],
    "NPC-ASD2-013":[[0,6,"ASD-CAPITAL","休息"],[6,18,"ASD-CAPITAL","鍛造院外坊"],[18,24,"ASD-CAPITAL","工坊盤點"]],
    "NPC-ASD2-014":[[0,7,"ASD-CAPITAL","休息"],[7,19,"ASD-CAPITAL","煉金調劑"],[19,24,"ASD-CAPITAL","配方整理"]],
    "NPC-ASD2-015":[[0,5,"ASD-CAPITAL","休息"],[5,11,"ASD2-AMBERFIELD","查核民生供應"],[11,20,"ASD-CAPITAL","救濟糧務"],[20,24,"ASD-CAPITAL","休息"]],
    "NPC-ASD2-016":[[0,6,"ASD-SILVER","休息"],[6,15,"ASD2-WILD-NIGHTMARSH","濕地測繪"],[15,20,"ASD-SILVER","整理測繪"],[20,24,"ASD-SILVER","休息"]],
    "NPC-ASD2-017":[[0,7,"ASD-CAPITAL","休息"],[7,17,"ASD-CAPITAL","地下工務"],[17,20,"ASD2-DUNGEON-OLDMINT","結構巡檢"],[20,24,"ASD-CAPITAL","休息"]],
    "NPC-ASD2-018":[[0,6,"ASD-DAWNPORT","休息"],[6,18,"ASD-DAWNPORT","海關查驗"],[18,21,"ASD2-SEABREAK","沿岸貨單抽查"],[21,24,"ASD-DAWNPORT","休息"]]
  };

  const CARAVAN_ROUTES=[
    {id:"CARAVAN-ASD-GRAIN",name:"月磨糧車隊",route:["ASD2-MOONMILL","ASD-SILVER","ASD-CAPITAL"],travel:[5,8,9],dwell:5,risk:.05,cargo:[{itemId:"ITEM-ASD2-MILL-OIL",qty:6},{itemId:"ITEM-ASD2-FLAX",qty:8}]},
    {id:"CARAVAN-ASD-AMBER",name:"琥珀田農產車隊",route:["ASD2-AMBERFIELD","ASD-CAPITAL"],travel:[6,6],dwell:6,risk:.04,cargo:[{itemId:"ITEM-ASD2-AMBER-HONEY",qty:8},{itemId:"ITEM-ASD2-BEESWAX",qty:5},{itemId:"ITEM-ASD2-FLAX",qty:7}]},
    {id:"CARAVAN-ASD-ORE",name:"東境礦材車隊",route:["ASD-REDCLIFF","ASD2-IRONFORD","ASD-CAPITAL"],travel:[7,12,14],dwell:6,risk:.10,cargo:[{itemId:"ITEM-ASD2-BASALT-SCALE",qty:3}]},
    {id:"CARAVAN-ASD-COAST",name:"晨潮沿岸商隊",route:["ASD-DAWNPORT","ASD2-SEABREAK","ASD-CAPITAL"],travel:[6,13,15],dwell:6,risk:.09,cargo:[{itemId:"ITEM-ASD2-REEF-SALT",qty:10},{itemId:"ITEM-ASD2-ROPE-KIT",qty:2}]},
    {id:"CARAVAN-ASD-NORTH",name:"北望補給隊",route:["ASD-CAPITAL","ASD-GRAYGATE","ASD2-NORTHWATCH"],travel:[12,8,17],dwell:8,risk:.12,cargo:[{itemId:"ITEM-ASD2-POTION-FIELD",qty:6},{itemId:"ITEM-ASD2-FROST-SPIKES",qty:4}]}
  ];

  const ASD_PROVINCE_RING=["PROV-ASD-CROWN","PROV-ASD-RIVER","PROV-ASD-NORTH","PROV-ASD-EAST"];
  const FRONT_TYPES={rain:{name:"河谷雨帶",weather:"細雨",severity:2},cold:{name:"北境冷鋒",weather:"寒風",severity:3},wind:{name:"東岸強風帶",weather:"強風",severity:2}};

  function nowHour(){return typeof totalHours==="function"?Number(totalHours()||0):0}
  function worldHourOfDay(){return Math.max(0,Math.min(23,Number(G?.worldTime?.hour||0)))}
  function getLoc(id){return typeof loc==="function"?loc(id):(DB.locations||[]).find(x=>x.id===id)}
  function getItem(id){return typeof item==="function"?item(id):(DB.items||[]).find(x=>x.id===id)}
  function tierRank(t){return typeof tierOrder==="function"?tierOrder(t):({F:0,E:1,D:2,C:3,B:4,A:5,S:6}[t]??0)}
  function clampValue(v,a,b){return typeof clamp==="function"?clamp(v,a,b):Math.max(a,Math.min(b,v))}
  function isKnownLocation(id){return !!getLoc(id)}

  function phase2State(){
    if(!G?.worldState)return null;
    G.worldState.worldAutonomy2=G.worldState.worldAutonomy2||{};
    const s=G.worldState.worldAutonomy2;
    s.version=REVISION;
    s.npcs=s.npcs&&typeof s.npcs==="object"?s.npcs:{};
    s.caravans=s.caravans&&typeof s.caravans==="object"?s.caravans:{};
    s.resourceNodes=s.resourceNodes&&typeof s.resourceNodes==="object"?s.resourceNodes:{};
    s.dungeons=s.dungeons&&typeof s.dungeons==="object"?s.dungeons:{};
    s.regionalWeather=s.regionalWeather&&typeof s.regionalWeather==="object"?s.regionalWeather:{};
    s.weatherFronts=Array.isArray(s.weatherFronts)?s.weatherFronts:[];
    s.events=Array.isArray(s.events)?s.events:[];
    if(!Number.isFinite(Number(s.lastNpcHour)))s.lastNpcHour=nowHour();
    if(!Number.isFinite(Number(s.lastResourceHour)))s.lastResourceHour=nowHour();
    if(!Number.isFinite(Number(s.lastDungeonHour)))s.lastDungeonHour=nowHour();
    if(!Number.isFinite(Number(s.lastWeatherFrontHour)))s.lastWeatherFrontHour=nowHour();
    if(!Number.isFinite(Number(s.lastPersistMs)))s.lastPersistMs=Date.now();
    return s;
  }

  function pushWorldEvent(type,summary,data={}){
    const s=phase2State();if(!s)return;
    s.events.unshift({id:`WA2-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,hour:nowHour(),time:typeof timeText==="function"?timeText():"",type,summary,data});
    if(s.events.length>CFG.event_history_limit)s.events.length=CFG.event_history_limit;
  }

  function applyGatherPatches(){
    if(gatherPatchesApplied)return false;
    let changed=false;
    for(const [locationId,itemIds] of Object.entries(GATHER_PATCHES)){
      const l=getLoc(locationId);if(!l)continue;
      l.gather=Array.isArray(l.gather)?l.gather:[];
      for(const itemId of itemIds){
        if(!l.gather.includes(itemId)){l.gather.push(itemId);changed=true}
        const d=getItem(itemId);if(!d)continue;
        if(!d.wild_gather_eligible){d.wild_gather_eligible=true;changed=true}
        d.acquisition_sources=Array.isArray(d.acquisition_sources)?d.acquisition_sources:[];
        if(!d.acquisition_sources.includes("foraging")){d.acquisition_sources.push("foraging");changed=true}
      }
    }
    gatherPatchesApplied=true;if(changed)resourcePairsCache=null;return changed;
  }

  function scheduleEntry(npcId,hour=worldHourOfDay()){
    const rows=NPC_SCHEDULES[npcId];
    if(Array.isArray(rows)){
      const row=rows.find(x=>hour>=x[0]&&hour<x[1])||rows[0];
      if(row&&isKnownLocation(row[2]))return {locationId:row[2],activity:row[3]};
    }
    const npc=(DB.regional_npc_archetypes||[]).find(x=>x.id===npcId);
    return {locationId:npc?.location_id||null,activity:"日常勤務"};
  }

  function updateNpcSchedules(force=false){
    const s=phase2State();if(!s)return false;
    const current=nowHour(),tick=Math.floor(current/CFG.npc_tick_hours)*CFG.npc_tick_hours;
    if(!force&&tick<=Number(s.lastNpcHour||0))return false;
    const hour=worldHourOfDay();
    for(const npc of (DB.regional_npc_archetypes||[])){
      const next=scheduleEntry(npc.id,hour),prev=s.npcs[npc.id];
      s.npcs[npc.id]={npcId:npc.id,name:npc.name,locationId:next.locationId,activity:next.activity,updatedHour:current};
      if(prev&&prev.locationId!==next.locationId)pushWorldEvent("npc_move",`${npc.name}由${getLoc(prev.locationId)?.name||prev.locationId}前往${getLoc(next.locationId)?.name||next.locationId}。`,{npcId:npc.id,from:prev.locationId,to:next.locationId});
    }
    s.lastNpcHour=tick;
    return true;
  }

  function worldNpcCurrentState(npcId){const s=phase2State();if(!s)return null;if(!s.npcs[npcId])updateNpcSchedules(true);return s.npcs[npcId]||null}
  function routeValid(route){return route.route.every(isKnownLocation)}
  function marketPulse(locationId,itemId,qty,source){
    if(!G?.worldState||!getItem(itemId)||!isKnownLocation(locationId)||!Number.isFinite(Number(qty))||qty===0)return;
    G.worldState.itemMarketTradeLedger=Array.isArray(G.worldState.itemMarketTradeLedger)?G.worldState.itemMarketTradeLedger:[];
    const l=getLoc(locationId);
    G.worldState.itemMarketTradeLedger.push({hour:nowHour(),locationId,regionId:l?.world_region_id||l?.region_id||"REG-ASD-01",itemId,qty:Number(qty),source});
    if(G.worldState.itemMarketTradeLedger.length>400)G.worldState.itemMarketTradeLedger=G.worldState.itemMarketTradeLedger.slice(-400);
  }
  function regionWeatherStateForLocation(locationId){const l=getLoc(locationId),pid=l?.province_id;return pid?phase2State()?.regionalWeather?.[pid]||null:null}
  function caravanRisk(route,locationId){const w=regionWeatherStateForLocation(locationId),weatherRisk=(Number(w?.severity||0))*0.025;return clampValue(Number(route.risk||0)+weatherRisk,0,.35)}
  function ensureCaravanState(route){const s=phase2State(),current=nowHour();if(!s.caravans[route.id])s.caravans[route.id]={routeId:route.id,name:route.name,status:"at_stop",index:0,locationId:route.route[0],nextMoveHour:current+route.dwell,cycle:0,lastIncident:null,lastDeliveredFactor:1};return s.caravans[route.id]}
  function processCaravans(){
    const current=nowHour();let changed=false;
    for(const route of CARAVAN_ROUTES){
      if(!routeValid(route))continue;
      const st=ensureCaravanState(route);let guard=0;
      while(guard++<CFG.caravan_max_transitions_per_tick){
        if(st.status==="at_stop"){
          if(current<Number(st.nextMoveHour||0))break;
          const from=route.route[st.index],nextIndex=(st.index+1)%route.route.length,to=route.route[nextIndex],travel=Number(route.travel[st.index]||8);
          for(const cargo of route.cargo)marketPulse(from,cargo.itemId,-Math.max(1,Math.round(cargo.qty*.35)),"caravan_departure");
          const risk=caravanRisk(route,from),incident=Math.random()<risk,delay=incident?(2+Math.floor(Math.random()*5)):0;
          st.status="in_transit";st.from=from;st.to=to;st.nextIndex=nextIndex;st.departHour=Number(st.nextMoveHour||current);st.arriveHour=st.departHour+travel+delay;st.nextMoveHour=st.arriveHour;st.lastIncident=incident?{hour:st.departHour,type:"delay",delayHours:delay}:null;
          if(incident)pushWorldEvent("caravan_incident",`${route.name}在${getLoc(from)?.name||from}出發後受道路或天候影響，預計延誤${delay}小時。`,{routeId:route.id,from,to,delay});
          changed=true;continue;
        }
        if(st.status==="in_transit"){
          if(current<Number(st.arriveHour||st.nextMoveHour||0))break;
          const factor=st.lastIncident?(.72+Math.random()*.18):1;
          for(const cargo of route.cargo)marketPulse(st.to,cargo.itemId,Math.max(1,Math.round(cargo.qty*factor)),"caravan_arrival");
          st.index=st.nextIndex;st.locationId=st.to;st.status="at_stop";st.cycle=Number(st.cycle||0)+(st.index===0?1:0);st.lastDeliveredFactor=Math.round(factor*100)/100;st.nextMoveHour=Number(st.arriveHour||current)+route.dwell;
          pushWorldEvent("caravan_arrival",`${route.name}抵達${getLoc(st.locationId)?.name||st.locationId}，當地供應已更新。`,{routeId:route.id,locationId:st.locationId,deliveredFactor:st.lastDeliveredFactor});
          changed=true;continue;
        }
        st.status="at_stop";st.nextMoveHour=current+route.dwell;changed=true;
      }
    }
    return changed;
  }

  function genericResourceConfig(l,d){const rank=tierRank(d?.tier||l?.tier||"F"),max=[18,15,12,8,5,3,1][rank]||8,regen=[4,6,8,12,24,48,96][rank]||12;return {max,regen_hours_per_unit:regen}}
  function resourceKey(locationId,itemId){return `${locationId}::${itemId}`}
  function resourceConfig(locationId,itemId){return SPECIAL_RESOURCE_CONFIG[itemId]||genericResourceConfig(getLoc(locationId),getItem(itemId))}
  function ensureResourceNode(locationId,itemId,current=nowHour()){
    const s=phase2State(),key=resourceKey(locationId,itemId),cfg=resourceConfig(locationId,itemId);
    if(!s.resourceNodes[key])s.resourceNodes[key]={locationId,itemId,current:cfg.max,max:cfg.max,regenHoursPerUnit:cfg.regen_hours_per_unit,lastHour:current,regenCarry:0};
    const node=s.resourceNodes[key];node.max=cfg.max;node.regenHoursPerUnit=cfg.regen_hours_per_unit;if(!Number.isFinite(Number(node.current)))node.current=cfg.max;if(!Number.isFinite(Number(node.lastHour)))node.lastHour=current;if(!Number.isFinite(Number(node.regenCarry)))node.regenCarry=0;return node;
  }
  function allResourcePairs(){if(resourcePairsCache)return resourcePairsCache;const pairs=[];for(const l of (DB.locations||[]))for(const itemId of (l.gather||[]))if(getItem(itemId)?.wild_gather_eligible)pairs.push([l.id,itemId]);resourcePairsCache=pairs;return resourcePairsCache}
  function syncResourceNodes(force=false){
    const s=phase2State();if(!s)return false;const current=nowHour(),elapsed=Math.max(0,current-Number(s.lastResourceHour||current));if(!force&&elapsed<CFG.resource_tick_hours)return false;
    for(const [locationId,itemId] of allResourcePairs()){
      const node=ensureResourceNode(locationId,itemId,current),delta=Math.max(0,current-Number(node.lastHour||current)),exact=Number(node.regenCarry||0)+delta/Math.max(1,Number(node.regenHoursPerUnit||12)),gain=Math.floor(exact);
      node.regenCarry=exact-gain;if(gain>0)node.current=Math.min(node.max,Number(node.current||0)+gain);node.lastHour=current;
    }
    s.lastResourceHour=current;return true;
  }
  function worldResourceNodeState(locationId,itemId){syncResourceNodes(false);return ensureResourceNode(locationId,itemId)}
  function resourceAvailable(locationId,itemId){return Number(worldResourceNodeState(locationId,itemId)?.current||0)>0}
  function resourceAvailableAfterSync(locationId,itemId){return Number(ensureResourceNode(locationId,itemId)?.current||0)>0}
  function consumeResource(locationId,itemId,qty){const node=worldResourceNodeState(locationId,itemId);if(!node)return 0;const take=Math.max(0,Math.min(Number(qty||0),Number(node.current||0)));node.current-=take;node.lastHarvestHour=nowHour();if(node.current<=0)pushWorldEvent("resource_depleted",`${getLoc(locationId)?.name||locationId}的${getItem(itemId)?.name||itemId}暫時採盡，等待自然恢復。`,{locationId,itemId});return take}

  function dungeonRespawnHours(tier){return ({F:24,E:30,D:36,C:48,B:72,A:120,S:240})[tier]||48}
  function dungeonOccupierFor(l,population){if(population<.18)return {type:"vacant",id:null,name:"低活動／近乎空置"};const monsters=(DB.monsters||[]).filter(m=>Array.isArray(m.habitat)&&m.habitat.includes(l.id));if(monsters.length){const m=monsters[Math.floor(Math.random()*monsters.length)];return {type:"monster",id:m.id,name:m.name}}if(l.tier==="B")return {type:"restricted",id:null,name:"封鎖區監管與未知活動"};return {type:"wild",id:null,name:"零散魔物與野生生物"}}
  function ensureDungeonState(locationId,current=nowHour()){
    const s=phase2State(),l=getLoc(locationId);if(!l||l.kind!=="dungeon")return null;
    if(!s.dungeons[locationId])s.dungeons[locationId]={locationId,population:1,lastHour:current,nextOccupationHour:current+24,occupier:dungeonOccupierFor(l,1),lastClearedHour:null};
    const d=s.dungeons[locationId];if(!Number.isFinite(Number(d.population)))d.population=1;if(!Number.isFinite(Number(d.lastHour)))d.lastHour=current;if(!Number.isFinite(Number(d.nextOccupationHour)))d.nextOccupationHour=current+24;return d;
  }
  function syncDungeonStates(force=false){
    const s=phase2State();if(!s)return false;const current=nowHour(),elapsed=Math.max(0,current-Number(s.lastDungeonHour||current));if(!force&&elapsed<CFG.dungeon_tick_hours)return false;
    for(const l of (DB.locations||[]).filter(x=>x.kind==="dungeon")){
      const d=ensureDungeonState(l.id,current),delta=Math.max(0,current-Number(d.lastHour||current)),respawn=dungeonRespawnHours(l.tier);d.population=clampValue(Number(d.population||0)+delta/respawn*.35,0,1);d.lastHour=current;
      if(current>=Number(d.nextOccupationHour||0)){const old=d.occupier?.name||"";d.occupier=dungeonOccupierFor(l,d.population);d.nextOccupationHour=current+24;if(old&&old!==d.occupier.name)pushWorldEvent("dungeon_occupation",`${l.name}的活動主體由「${old}」轉為「${d.occupier.name}」。`,{locationId:l.id,occupier:d.occupier})}
    }
    s.lastDungeonHour=current;return true;
  }
  function markDungeonKill(locationId,count=1){const l=getLoc(locationId);if(!l||l.kind!=="dungeon")return;const d=ensureDungeonState(locationId),loss=.12*Math.max(1,Number(count||1));d.population=clampValue(Number(d.population||0)-loss,0,1);d.lastClearedHour=nowHour();d.nextOccupationHour=Math.max(Number(d.nextOccupationHour||0),nowHour()+12);if(d.population<=.15)d.occupier={type:"vacant",id:null,name:"低活動／近乎空置"}}
  function worldDungeonState(locationId){syncDungeonStates(false);return ensureDungeonState(locationId)}

  function seasonBaseWeather(){const season=String(G?.worldTime?.season||"");if(/冬|寒|霜|雪/.test(season))return ["晴冷","多雲","薄霧","寒風"];if(/夏|炎|暑/.test(season))return ["晴朗","炎熱","多雲","陣雨"];return ["晴朗","多雲","薄霧","微風"]}
  function ensureWeatherFronts(){const s=phase2State();if(s.weatherFronts.length)return;s.weatherFronts=[{id:"FRONT-ASD-RAIN",type:"rain",index:0,direction:1,lastMoveHour:nowHour()},{id:"FRONT-ASD-COLD",type:"cold",index:2,direction:-1,lastMoveHour:nowHour()+1},{id:"FRONT-ASD-WIND",type:"wind",index:3,direction:1,lastMoveHour:nowHour()+2}]}
  function rebuildRegionalWeather(current=nowHour()){
    const s=phase2State(),basePool=seasonBaseWeather(),provinces=[...new Set((DB.locations||[]).map(l=>l.province_id).filter(Boolean))];
    for(const pid of provinces){const previous=s.regionalWeather[pid],base=basePool[Math.floor((current+pid.length)%basePool.length)]||basePool[0];s.regionalWeather[pid]={provinceId:pid,weather:previous?.weather||base,front:null,severity:0,updatedHour:current}}
    for(const front of s.weatherFronts){const pid=ASD_PROVINCE_RING[front.index];if(!pid)continue;const meta=FRONT_TYPES[front.type];if(!meta)continue;s.regionalWeather[pid]={provinceId:pid,weather:meta.weather,front:meta.name,severity:meta.severity,updatedHour:current};const nextPid=ASD_PROVINCE_RING[(front.index-front.direction+ASD_PROVINCE_RING.length)%ASD_PROVINCE_RING.length];if(nextPid&&s.regionalWeather[nextPid]&&s.regionalWeather[nextPid].severity<meta.severity-1)s.regionalWeather[nextPid]={provinceId:nextPid,weather:front.type==="cold"?"多雲":"陰天",front:`${meta.name}後緣`,severity:1,updatedHour:current}}
  }
  function syncLocalWeather(){const l=getLoc(G?.character?.locationId),pid=l?.province_id,s=phase2State(),w=pid?s?.regionalWeather?.[pid]:null;if(w?.weather)G.worldState.weather=w.weather}
  function processWeatherFronts(force=false){const s=phase2State();if(!s)return false;ensureWeatherFronts();const current=nowHour(),elapsed=Math.max(0,current-Number(s.lastWeatherFrontHour||current));if(!force&&elapsed<CFG.weather_front_tick_hours){syncLocalWeather();return false}const steps=Math.max(1,Math.min(16,Math.floor(elapsed/CFG.weather_front_tick_hours)||1));for(let step=0;step<steps;step++)for(const front of s.weatherFronts){front.index=(front.index+front.direction+ASD_PROVINCE_RING.length)%ASD_PROVINCE_RING.length;front.lastMoveHour=current}rebuildRegionalWeather(current);syncLocalWeather();s.lastWeatherFrontHour=current;return true}
  function worldRegionalWeather(provinceId){processWeatherFronts(false);return phase2State()?.regionalWeather?.[provinceId]||null}

  function inventoryQtyLocal(id){return (G?.character?.inventory||[]).filter(x=>x.id===id).reduce((n,x)=>n+Number(x.qty||1),0)}
  function patchGatherRuntime(){
    if(globalThis.__WORLD_AUTONOMY2_GATHER_PATCHED)return;
    if(typeof globalThis.gatherEligiblePool==="function"){const originalPool=globalThis.gatherEligiblePool;globalThis.gatherEligiblePool=function(l){syncResourceNodes(false);return originalPool.apply(this,arguments).filter(id=>resourceAvailableAfterSync(l?.id,id))}}
    if(typeof globalThis.actGather==="function"){const originalActGather=globalThis.actGather;globalThis.actGather=function(){const l=getLoc(G?.character?.locationId),ids=Array.isArray(l?.gather)?l.gather.slice():[],before=new Map(ids.map(id=>[id,inventoryQtyLocal(id)]));const result=originalActGather.apply(this,arguments);if(l)for(const id of ids){const gained=Math.max(0,inventoryQtyLocal(id)-Number(before.get(id)||0));if(gained>0)consumeResource(l.id,id,gained)}return result}}
    globalThis.__WORLD_AUTONOMY2_GATHER_PATCHED=true;
  }
  function patchDungeonKillRuntime(){if(globalThis.__WORLD_AUTONOMY2_KILL_PATCHED)return;if(typeof globalThis.updateQuestProgress==="function"){const original=globalThis.updateQuestProgress;globalThis.updateQuestProgress=function(kind,data={}){const result=original.apply(this,arguments);if(kind==="kill"){const l=getLoc(G?.character?.locationId);if(l?.kind==="dungeon")markDungeonKill(l.id,Number(data?.qty||1))}return result}}globalThis.__WORLD_AUTONOMY2_KILL_PATCHED=true}

  function currentProvinceId(){return getLoc(G?.character?.locationId)?.province_id||null}
  function nameForLocation(id){return getLoc(id)?.name||id||"未知"}
  function pct(n){return `${Math.round(clampValue(Number(n||0),0,1)*100)}%`}
  function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
  function openWorldAutonomyPanel(){
    phase2Heartbeat("panel");const s=phase2State(),here=G?.character?.locationId,pid=currentProvinceId(),weather=pid?s.regionalWeather[pid]:null;
    const nearbyNpcs=Object.values(s.npcs).filter(n=>n.locationId===here).slice(0,8),npcHtml=nearbyNpcs.length?nearbyNpcs.map(n=>`<div class="small"><b>${esc(n.name)}</b>｜${esc(n.activity)}</div>`).join(""):"<div class='small'>目前沒有已排程固定NPC停留在此地。</div>";
    const caravanHtml=CARAVAN_ROUTES.filter(route=>s.caravans[route.id]).map(route=>{const c=s.caravans[route.id];return `<div class="small"><b>${esc(route.name)}</b>｜${c.status==="in_transit"?`${esc(nameForLocation(c.from))} → ${esc(nameForLocation(c.to))}（預計${Math.max(0,Math.ceil(c.arriveHour-nowHour()))}小時）`:`停靠 ${esc(nameForLocation(c.locationId))}`}</div>`}).join("")||"<div class='small'>尚無商隊狀態。</div>";
    const resources=allResourcePairs().filter(([lid])=>lid===here).map(([lid,iid])=>worldResourceNodeState(lid,iid)),resourceHtml=resources.length?resources.map(n=>`<div class="small"><b>${esc(getItem(n.itemId)?.name||n.itemId)}</b>｜${Math.floor(n.current)}/${n.max}｜約每${n.regenHoursPerUnit}小時恢復1單位</div>`).join(""):"<div class='small'>此地沒有可採集資源節點。</div>";
    const dungeons=(DB.locations||[]).filter(l=>l.kind==="dungeon"&&(!pid||l.province_id===pid)).slice(0,8),dungeonHtml=dungeons.length?dungeons.map(l=>{const d=worldDungeonState(l.id);return `<div class="small"><b>${esc(l.name)}</b>｜怪物壓力 ${pct(d.population)}｜${esc(d.occupier?.name||"未知")}</div>`}).join(""):"<div class='small'>目前行省沒有已建檔地下城。</div>";
    const regional=ASD_PROVINCE_RING.filter(p=>s.regionalWeather[p]).map(p=>{const w=s.regionalWeather[p];return `<div class="small"><b>${esc(p.replace("PROV-ASD-", ""))}</b>｜${esc(w.weather)}${w.front?`｜${esc(w.front)}`:""}</div>`}).join(""),recent=s.events.slice(0,6).map(e=>`<div class="small">${esc(e.time||"")}｜${esc(e.summary)}</div>`).join("")||"<div class='small'>尚無近期自主事件。</div>";
    if(typeof showModal==="function")showModal("世界動態",`<div class="card"><b>所在地天候</b><br><span class="small">${esc(weather?.weather||G?.worldState?.weather||"未知")}${weather?.front?`｜${esc(weather.front)}`:""}</span></div><div class="card"><b>目前在此地的固定NPC</b>${npcHtml}</div><div class="card"><b>商隊物流</b>${caravanHtml}</div><div class="card"><b>當地資源</b>${resourceHtml}</div><div class="card"><b>本行省地下城</b>${dungeonHtml}</div><div class="card"><b>阿斯戴爾跨區天候</b>${regional||"<div class='small'>尚未建立。</div>"}</div><div class="card"><b>近期世界事件</b>${recent}</div>`);
  }
  function patchMoreMenu(){if(globalThis.__WORLD_AUTONOMY2_MENU_PATCHED||typeof globalThis.openMoreMenu!=="function")return;const original=globalThis.openMoreMenu;globalThis.openMoreMenu=function(){const result=original.apply(this,arguments);setTimeout(()=>{const grid=document.querySelector("#modalBody .more-grid");if(grid&&!grid.querySelector("[data-world-autonomy2]")){const b=document.createElement("button");b.className="more-card";b.dataset.worldAutonomy2="1";b.innerHTML='<span class="more-icon">◌</span><span>世界動態</span>';b.addEventListener("click",openWorldAutonomyPanel);grid.appendChild(b)}},0);return result};globalThis.__WORLD_AUTONOMY2_MENU_PATCHED=true}
  function schedulePhase2Heartbeat(reason="scheduled",delay=0){pendingHeartbeatReason=pendingHeartbeatReason||reason;if(heartbeatTimer!==null)return;heartbeatTimer=setTimeout(()=>{const nextReason=pendingHeartbeatReason||reason;heartbeatTimer=null;pendingHeartbeatReason="";phase2Heartbeat(nextReason)},Math.max(0,Number(delay)||0))}
  function initializePhase2(){
    if(typeof G==="undefined"||!G?.worldState)return false;G.meta=G.meta||{};G.meta.version=RELEASE;applyGatherPatches();const s=phase2State();
    if(!s.initialized){s.initialized=true;s.initializedHour=nowHour();updateNpcSchedules(true);syncResourceNodes(true);syncDungeonStates(true);ensureWeatherFronts();rebuildRegionalWeather(nowHour());syncLocalWeather();for(const route of CARAVAN_ROUTES)if(routeValid(route))ensureCaravanState(route);pushWorldEvent("phase2_init","自主世界第二階段已啟動：NPC、商隊、資源、地下城與區域天候開始依世界時間運作。",{})}
    patchGatherRuntime();patchDungeonKillRuntime();patchMoreMenu();return true;
  }
  function phase2Heartbeat(reason="interval"){
    if(typeof G==="undefined"||!G?.worldState||!G?.worldTime)return false;initializePhase2();const s=phase2State(),changed=[updateNpcSchedules(false),processCaravans(),syncResourceNodes(false),syncDungeonStates(false),processWeatherFronts(false)].some(Boolean);
    if(changed&&Date.now()-Number(s.lastPersistMs||0)>=CFG.persist_interval_ms&&typeof persist==="function"){s.lastPersistMs=Date.now();try{persist()}catch(error){console.warn("world autonomy phase2 persist failed",error)}}return changed;
  }

  globalThis.phase2Heartbeat=phase2Heartbeat;
  globalThis.worldNpcCurrentState=worldNpcCurrentState;
  globalThis.worldResourceNodeState=worldResourceNodeState;
  globalThis.worldDungeonState=worldDungeonState;
  globalThis.worldRegionalWeather=worldRegionalWeather;
  globalThis.worldCaravanStates=()=>phase2State()?.caravans||{};
  globalThis.openWorldAutonomyPanel=openWorldAutonomyPanel;
  globalThis.WORLD_AUTONOMY_PHASE2_CONFIG=Object.freeze({...CFG});
  if(typeof document!=="undefined")document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")schedulePhase2Heartbeat("visible",40)});
  if(typeof window!=="undefined")window.addEventListener("focus",()=>schedulePhase2Heartbeat("focus",40));
  setInterval(()=>phase2Heartbeat("interval"),CFG.heartbeat_ms);
  schedulePhase2Heartbeat("startup",50);
})();
