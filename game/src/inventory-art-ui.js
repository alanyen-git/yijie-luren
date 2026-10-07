(()=>{"use strict";
const sprite="./assets/art/item-skill-icons.svg#";
const rules=[
 [/劍|刀|弓|杖|武器|攻擊/,"blade"],[/盔|甲|盾|防具|護具|裝備/,"armor"],
 [/藥|生命藥|魔力藥/,"potion"],[/卷|技能|咒|術式|秘笈/,"scroll"],
 [/料理|食物|乾糧|肉|魚/,"ration"],[/礦|素材|鍛造|材料|木材/,"ore"],
 [/草藥|藥草|花|根|葉/,"herb"],[/布|線|皮革|衣料/,"cloth"],
 [/書|日誌|紀錄|契約/,"book"],[/戒指|項鍊|飾品|護符/,"accessory"],
 [/工具|鉗|錘|採集器/,"tool"],[/晶|寶石|魔核|水晶/,"crystal"],
 [/鑰匙|鎖|門扉/,"key"],[/火|焰|炎|燃燒/,"fire"],
 [/水|冰|潮|霜/,"water"],[/風|雷|疾風/,"wind"],[/土|地|石|岩/,"earth"]
];
const skillRules=[
 [/治療波|治療術|治療|治癒|療傷|回復術|補血|回春|復活|聖療|聖光|生命之泉/,"heal"],
 [/盾牆|護盾|守護|援護|格擋|鐵壁|防禦/,"shield"],
 [/劇毒|毒霧|中毒|毒刺/,"poison"],
 [/閃電|雷擊|雷鳴|雷電|電弧|雷/,"lightning"],
 [/召喚|召來|靈獸|使魔|契約獸/,"summon"],
 [/眩暈|沉默|緩速|詛咒|弱化|異常狀態/,"status"]
];
function iconFor(text,isSkill){const value=String(text||"");if(isSkill){const match=skillRules.find(x=>x[0].test(value));if(match)return match[1]}return rules.find(x=>x[0].test(value))?.[1]||"mark"}
function add(host,label,isSkill){if(!host||host.querySelector(":scope > .art-item-icon"))return;const tier=host.querySelector(".tier")?.textContent?.trim()||"";if(/^[FESAB]$/.test(tier))host.dataset.artTier=tier;const box=document.createElement("span");box.className="art-item-icon";box.setAttribute("aria-hidden","true");const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 120 120");const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href",sprite+iconFor(label,isSkill));svg.appendChild(use);box.appendChild(svg);host.insertBefore(box,host.firstChild)}
function decorate(root=document){root.querySelectorAll(".modalbody .itemrow").forEach(el=>add(el,el.textContent||"",false));root.querySelectorAll(".modalbody .skillrow").forEach(el=>add(el,el.textContent||"",true));root.querySelectorAll(".battleactions button:not(.xuan-command-button)").forEach(el=>add(el,el.textContent||"",true))}
const modal=document.querySelector("#modalBody"),battle=document.querySelector("#battleBody");
const pendingRoots=new Set();let decorateFrame=0;function schedule(root){pendingRoots.add(root);if(decorateFrame)return;const run=()=>{decorateFrame=0;const roots=[...pendingRoots];pendingRoots.clear();roots.forEach(decorate)};decorateFrame=typeof requestAnimationFrame==="function"?requestAnimationFrame(run):setTimeout(run,16)}
for(const root of [modal,battle])if(root){new MutationObserver(()=>schedule(root)).observe(root,{childList:true,subtree:true});decorate(root)}
})();
