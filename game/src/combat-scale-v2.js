(()=>{"use strict";
const S=2,n=v=>Number.isFinite(Number(v))?Math.round(Number(v)*S*100)/100:v;
const scale=(o,keys)=>{if(!o||o.__ijScale2)return;for(const k of keys)if(Number.isFinite(Number(o[k])))o[k]=n(o[k]);if(Array.isArray(o.damage))o.damage=o.damage.map(n);Object.defineProperty(o,"__ijScale2",{value:true,enumerable:false})};
for(const m of (DB.monsters||[]))scale(m,["hp","attack","defense","magicDefense"]);
for(const c of (DB.companion_species||[]))scale(c?.base_stats,["hp","attack","magic","defense"]);
for(const p of (DB.party_member_templates||[]))scale(p?.base_stats,["hp","attack","magic","defense"]);
DB.combat_number_scale={
 version:"IJ-COMBAT-SCALE-2.0",multiplier:2,
 scaled:["HP","SP","MP","攻擊力","魔法攻擊","防禦力","魔法防禦","固定回復","固定戰鬥傷害"],
 preserved:["命中","閃避","爆擊率","爆擊傷害%","攻速","施法速度","格擋率","抗性","破甲%","射程","移速","負重"],
 rationale:[
  "玩家與敵我所有核心絕對數值同步×2，避免單邊強化。",
  "線性傷害公式同步放大：2A−0.45×2D = 2(A−0.45D)，HP亦×2，因此平均擊殺回合數近似不變。",
  "MP/SP與固定技能消耗同步×2，可施放次數近似不變。",
  "百分比、機率、速度與抗性不放大，避免超過原本上限。"
 ],
 monsters:(DB.monsters||[]).length,companions:(DB.companion_species||[]).length,party_templates:(DB.party_member_templates||[]).length
};
DB.meta.combat_number_scale="IJ-COMBAT-SCALE-2.0";
globalThis.IJ_COMBAT_SCALE=2;
globalThis.ijCombatScale=v=>Number.isFinite(Number(v))?Math.round(Number(v)*S*100)/100:v;
})();