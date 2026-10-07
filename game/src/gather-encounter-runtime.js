/*
 * 採集遭遇保護：自然資源耗盡時仍執行遭遇判定；同一野外地點連續採集，
 * 若自然機率一直未遇敵，最遲第 12 次會觸發一場符合當地生態的戰鬥，
 * 讓長時間採集不會碰到第 20 回合的週期性自檢與長回合故障邊界。
 */
((root)=>{
  "use strict";

  const MAX_GATHER_STREAK=12;
  const originalMaybeEncounter=root.maybeEncounter;
  const originalBeginTurn=root.beginTurn;
  if(typeof originalMaybeEncounter!=="function"||typeof originalBeginTurn!=="function")return;

  function pressureFor(location){
    const game=root.G;
    if(!game||!location)return null;
    const world=game.worldState||(game.worldState={});
    let pressure=world.gatherEncounterPressure;
    if(!pressure||pressure.locationId!==location.id||!Number.isFinite(Number(pressure.actions))){
      pressure={locationId:location.id,actions:0};
      world.gatherEncounterPressure=pressure;
    }
    pressure.actions=Math.max(0,Math.min(MAX_GATHER_STREAK,Math.floor(Number(pressure.actions)||0)));
    return pressure;
  }

  function forcedEncounter(location,pool){
    let chosen=null;
    try{
      const targets=typeof root.activeKillQuestTargets==="function"?root.activeKillQuestTargets(location,pool):[];
      const maxBoost=targets.length?Math.max(...targets.map(row=>Number(row[1])||0)):0;
      if(targets.length&&Math.random()<maxBoost)chosen=root.weightedPick(targets);
    }catch(error){
      console.warn("gather encounter target selection failed",error);
    }
    if(!chosen){
      const weighted=pool.map(monster=>[
        monster,
        typeof root.encounterWeightForLocation==="function"?root.encounterWeightForLocation(monster,location):1
      ]);
      chosen=root.weightedPick(weighted);
    }
    if(!chosen)return false;

    const safety=typeof root.locationSafety==="function"?root.locationSafety(location):null;
    const label=typeof root.safetyLabel==="function"?root.safetyLabel(location):"未知";
    const chance=typeof root.encounterChanceForLocation==="function"?root.encounterChanceForLocation(location,"採集"):null;
    const chanceText=Number.isFinite(chance)?`平常遭遇機率約${Math.round(chance*100)}%`:
      (safety===null?"野外風險已累積到上限":`安全度${safety}/100（${label}），連續採集風險已累積到上限`);

    const pressure=pressureFor(location);
    if(pressure){pressure.actions=0;pressure.lastEncounterTurn=Number(root.G?.turn||0)}
    if(typeof root.log==="function")root.log("安全度",`${location.name||location.id}：${chanceText}；本次遭遇無法避免。`,"warn");
    root.startBattle(chosen,"採集");
    return true;
  }

  root.maybeEncounter=function(context){
    if(context!=="採集")return originalMaybeEncounter.apply(this,arguments);
    const location=typeof root.loc==="function"?root.loc(root.G?.character?.locationId):null;
    if(!location||!["wild","dungeon"].includes(location.kind))return originalMaybeEncounter.apply(this,arguments);

    const pressure=pressureFor(location);
    if(!pressure)return originalMaybeEncounter.apply(this,arguments);
    const next=Math.min(MAX_GATHER_STREAK,pressure.actions+1);
    const pool=typeof root.encounterCandidates==="function"?root.encounterCandidates(location):[];
    if(next>=MAX_GATHER_STREAK&&pool.length)return forcedEncounter(location,pool);

    // Reset before the normal encounter path so startBattle's autosave records the reset.
    pressure.actions=0;
    try{
      const encountered=originalMaybeEncounter.apply(this,arguments);
      pressure.actions=encountered?0:next;
      if(encountered)pressure.lastEncounterTurn=Number(root.G?.turn||0);
      return encountered;
    }catch(error){
      pressure.actions=next;
      throw error;
    }
  };

  root.maybeGatherEncounter=function(location){
    const current=root.G?.character?.locationId;
    if(location&&current&&location.id!==current)return false;
    return root.maybeEncounter("採集");
  };

  root.beginTurn=function(reason){
    // A battle owns the interaction layer. Ignore taps that land on actions behind it.
    if(root.G?.battle?.active)return false;
    const result=originalBeginTurn.apply(this,arguments);
    if(result&&reason!=="採集"){
      const pressure=root.G?.worldState?.gatherEncounterPressure;
      if(pressure)pressure.actions=0;
    }
    return result;
  };
})(typeof window!=="undefined"?window:globalThis);
