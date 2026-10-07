(()=>{"use strict";
const iconFor=(slot,d)=>{
 const text=String(slot||"")+" "+String(d?.name||"")+" "+String(d?.type||"")+" "+String(d?.catalog_subcategory||"");
 if(/盾|盔|甲|手套|鞋|披風|防具/.test(text))return "armor";
 if(/飾品|戒|項鍊|護符/.test(text))return "accessory";
 if(/武器|劍|刀|弓|杖|槍|斧|錘|匕首/.test(text))return "blade";
 return "mark"
};
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const coreLabels={attack:"物理攻擊",magicPower:"魔法威力",defense:"物理防禦",magicDefense:"魔法防禦",accuracy:"命中",evasion:"閃避",critRate:"爆擊率",critDamage:"爆擊傷害",attackSpeed:"攻擊速度",castSpeed:"詠唱速度",blockRate:"格擋",statusResist:"狀態抗性"};
const advancedLabels={moveSpeed:"移動速度",range:"射程",armorPenPct:"破甲",magicPenPct:"魔法穿透",blockValue:"格擋減傷",poise:"韌性",statusAccuracy:"異常命中",lifeSteal:"生命偷取",healingPower:"治療效果",manaRegen:"MP回復",hpRegen:"HP回復",critResist:"爆擊抗性",threat:"威脅值",stealth:"潛行",perception:"感知",carryCapacity:"負重上限",initiative:"先攻"};
const percentKeys=new Set(["accuracy","evasion","critRate","critDamage","blockRate","statusResist","armorPenPct","magicPenPct","statusAccuracy","lifeSteal","healingPower","critResist"]);
function format(key,value){const n=Number(value)||0,body=Number.isInteger(n)?String(n):n.toFixed(2).replace(/0+$/,"").replace(/\.$/,"");return (n>0?"+":"")+body+(percentKeys.has(key)?"%":key==="range"?"m":key==="carryCapacity"?"kg":"")}
function durability(eq,d){const max=Math.max(1,Number(eq?.maxDurability)||Number(d?.durability)||1),current=Math.max(0,Math.min(max,Number(eq?.durability??max))),ratio=current/max,condition=ratio<=0?"已損壞":ratio<.3?"嚴重磨損":ratio<.75?"需要修理":"狀況良好";return {max,current,ratio,condition}}
function gearEntries(){const equipment=G?.character?.equipment||{},rows=Object.entries(equipment).map(([slot,eq])=>({slot,eq}));const off=G?.character?.weaponSet?.offhand;if(off)rows.push({slot:"副手",eq:off});return rows}
function render(){
 const title=document.querySelector("#modalTitle"),body=document.querySelector("#modalBody");
 if(!title||title.textContent!=="裝備"||!body||!G?.character)return;
 const rows=gearEntries().map(({slot,eq})=>{
  const d=eq?item(eq.id):null;if(!d)return `<div class="xu-gear-slot empty"><span class="xu-gear-icon" aria-hidden="true">${slotIcon(slot,null)}</span><b>${esc(slot)}</b><span class="small">尚未裝備</span></div>`;
  const state=durability(eq,d),pct=Math.round(state.ratio*100);
  return `<div class="xu-gear-slot" data-condition="${state.ratio<=0?"broken":state.ratio<.3?"worn":"ok"}"><span class="xu-gear-icon" aria-hidden="true">${slotIcon(slot,d)}</span><b>${esc(slot)}</b><span class="xu-gear-name">${esc(d.name)} <span class="tier">${esc(d.tier||"")}</span></span><span class="small">${state.condition}｜${state.current}/${state.max}</span><span class="xu-gear-bar" role="img" aria-label="${esc(slot)}耐久${pct}%"><i style="width:${pct}%"></i></span></div>`
 }).join("");
 const core=typeof equipmentCombat==="function"?equipmentCombat():{},advanced=typeof advancedEquipment==="function"?advancedEquipment():{};
 const bonuses=[...Object.entries(core).map(([key,value])=>({key,label:coreLabels[key]||key,value})),...Object.entries(advanced).map(([key,value])=>({key,label:advancedLabels[key]||key,value}))].filter(x=>Number(x.value));
 const bonusHtml=bonuses.map(x=>`<div class="xu-gear-bonus"><span>${esc(x.label)}</span><b>${esc(format(x.key,x.value))}</b></div>`).join("")||'<div class="small">目前裝備沒有額外戰鬥加成。</div>';
 const html=`<section class="xu-gear-detail" aria-label="裝備明細"><div class="xu-gear-detail-head"><b>裝備部位與耐久</b><span class="small">${rows.length} 個裝備欄位</span></div><div class="xu-gear-slot-grid">${rows}</div><div class="xu-gear-bonus-panel"><b>裝備加成總覽</b><span class="small">只計算目前穿戴裝備，並依耐久與封印狀態套用遊戲規則。</span><div class="xu-gear-bonus-grid">${bonusHtml}</div></div></section>`;
 const hero=body.querySelector(".equipment-art-hero");
 if(!hero||body.querySelector(".xu-gear-detail"))return;
 hero.insertAdjacentHTML("afterend",html)
}
function slotIcon(slot,d){return `<svg viewBox="0 0 120 120"><use href="./assets/art/item-skill-icons.svg#${iconFor(slot,d)}"></use></svg>`}
function install(){
 if(typeof globalThis.openEquipment!=="function"||globalThis.__XU_GEAR_DETAIL_PATCHED)return false;
 const original=globalThis.openEquipment;
 globalThis.openEquipment=function(){const result=original.apply(this,arguments);render();return result};
 globalThis.__XU_GEAR_DETAIL_PATCHED=true;return true
}
install();
})();