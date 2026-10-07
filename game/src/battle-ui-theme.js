(()=>{"use strict";
const sprite="./assets/art/battle-sd-portraits.svg#";
const make=(tag,cls)=>{const el=document.createElement(tag);if(cls)el.className=cls;return el};
const pick=(text,fallback="warrior")=>{const s=String(text||"");if(/魔法|術士|法師|巫師|咒術|mage|wizard/i.test(s))return"mage";if(/治療|牧師|祭司|僧侶|healer|priest/i.test(s))return"healer";if(/弓|射手|刺客|盜賊|遊俠|scout|rogue|archer/i.test(s))return"scout";if(/龍|dragon/i.test(s))return"dragon";if(/骷髏|亡靈|不死|屍|wraith|undead/i.test(s))return"undead";if(/史萊姆|黏液|slime|ooze/i.test(s))return"slime";if(/石像|魔像|傀儡|golem/i.test(s))return"golem";if(/哥布林|地精|強盜|盜匪|goblin|raider|bandit/i.test(s))return"raider";if(/冰元素|火元素|冰靈|炎靈|元素|elemental/i.test(s))return"elemental";if(/狼|犬|野獸|beast|wolf|hound/i.test(s))return"beast";if(/惡魔|魔族|角魔|惡鬼|demon|devil/i.test(s))return"demon";if(/怪物|魔物|魔獸|敵人|monster/i.test(s))return"monster";return fallback};
const highDetailSprite={warrior:["characters",0],healer:["characters",1],mage:["characters",2],scout:["characters",3],beast:["monsters",0],undead:["monsters",1],slime:["monsters",2],demon:["monsters",3],dragon:["monstersExpanded",0],golem:["monstersExpanded",1],raider:["monstersExpanded",2],elemental:["monstersExpanded",3],monster:["monsters",0],familiar:["monsters",0],knight:["classes",0],rogue:["classes",1],druid:["classes",2],spellblade:["classes",3]};
const classPick=text=>{const s=String(text||"");if(/魔劍|魔劍騎士|奧術騎士|戰鬥法師|龍脈劍豪|龍法師|龍召喚士|戰鬥鍊金師|戰術學者/.test(s))return"spellblade";if(/重騎士|守誓騎士|聖盾騎士|聖武士|騎士|盾衛|重裝戰士|守衛者/.test(s))return"knight";if(/盜賊|刺客|影刃|影舞|雙刃|暗影|飛刀|rogue|assassin|shadow/i.test(s))return"rogue";if(/德魯伊|薩滿|精靈使|馴龍師|占星|先知|預言|元素使|自然|spirit/i.test(s))return"druid";if(/法師|術士|魔導|巫師|魔女|咒術|賢者|幻術|死靈|血法|召喚|符文|鍊金|mage|wizard|spell/i.test(s))return"mage";if(/治療|療術|牧師|祭司|僧侶|神官|司祭|聖職|聖者|驅魔|審判|healer|priest|cleric/i.test(s))return"healer";if(/遊俠|弓|斥候|獵人|巡林|吟遊|舞者|海盜|陷阱|archer|scout/i.test(s))return"scout";return"warrior"};
function portrait(type){const box=make("span","xuan-sd-portrait");box.setAttribute("aria-hidden","true");const painted=highDetailSprite[type];if(painted){box.classList.add("xuan-painted-sprite");box.dataset.sheet=painted[0];box.dataset.index=String(painted[1]);return box}const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 128 160");svg.setAttribute("focusable","false");const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href",sprite+type);svg.appendChild(use);box.appendChild(svg);return box}
function replacePortraitArt(unit,art){
 if(!unit||!art?.src)return;
 const old=unit.querySelector(".xuan-sd-portrait");if(!old)return;
 const box=make("span","xuan-sd-portrait ij-atlas-art");
 box.dataset.artIndex=String(art.index);box.style.setProperty("--sprite-column",art.column);box.style.setProperty("--sprite-row",art.row);
 const img=document.createElement("img");img.src=art.src;img.alt="";img.decoding="async";box.appendChild(img);old.replaceWith(box)
}
function wrapUnit(unit,type,extra=""){if(!unit||unit.querySelector(".xuan-sd-portrait"))return;unit.classList.add("xuan-unit-card");extra.split(/\s+/).filter(Boolean).forEach(token=>unit.classList.add(token));const avatar=portrait(type),info=make("div","xuan-unit-info");unit.insertBefore(avatar,unit.firstChild);while(unit.childNodes.length>1)info.appendChild(unit.childNodes[1]);unit.appendChild(info)}
function miniPortrait(unit,type){if(unit&&!unit.querySelector(".xuan-sd-portrait"))unit.insertBefore(portrait(type),unit.firstChild)}
function stageFigure(source,kind){
 if(!source)return null;
 const figure=make("figure","xuan-stage-figure "+(kind||""));
 figure.setAttribute("aria-hidden","true");
 const avatar=source.querySelector(".xuan-sd-portrait");
 if(avatar)figure.appendChild(avatar.cloneNode(true));
 const info=source.querySelector(".xuan-unit-info")||source;
 const nameNode=info.querySelector(":scope > b")||info.querySelector("b");
 const smallNode=info.querySelector(":scope > .small")||info.querySelector("span");
 const name=make("b","xuan-stage-name");name.textContent=(nameNode?.textContent||"旅人").trim();
 const detail=make("small","xuan-stage-detail");detail.textContent=(smallNode?.textContent||"").trim();
 figure.append(name,detail);
 const bar=source.querySelector(".hpbar");if(bar)figure.appendChild(bar.cloneNode(true));
 return figure;
}
function decorate(){
 const back=document.getElementById("battleBack"),box=back?.querySelector(".battlebox"),body=document.getElementById("battleBody");if(!box||!body)return;box.classList.add("xuan-battlebox");
 const location=typeof G!=="undefined"&&G&&G.character&&typeof loc==="function"?loc(G.character.locationId):null;
 const sceneText=[location?.name,location?.description,location?.summary].join(" ");
 box.dataset.scene=location?.kind==="dungeon"?"dungeon":/山|峰|嶺|峽|雪/.test(sceneText)?"mountain":/河|湖|溪|海|港/.test(sceneText)?"river":location?.kind==="town"?"town":"forest";
 const banner=document.getElementById("battleTitle");
 if(banner&&typeof G!=="undefined"&&G&&G.battle)banner.textContent="「"+(G.character.name||"旅人")+"」的回合・選擇指令";
 const head=body.querySelector(".battlehead");
 if(head&&!head.dataset.xuanStyled){
  const player=head.querySelector(":scope > .battleunit:not(.enemy):not(.companion)"),party=head.querySelector(":scope > .party-battle-strip"),comp=head.querySelector(":scope > .battleunit.companion"),vs=head.querySelector(":scope > .battleversus"),enemy=head.querySelector(":scope > .battleunit.enemy");
  const allies=make("section","xuan-battle-side xuan-allies"),foes=make("section","xuan-battle-side xuan-foes");
  allies.setAttribute("aria-label","我方戰場");foes.setAttribute("aria-label","敵方戰場");
  const allyTitle=make("div","xuan-side-heading");allyTitle.innerHTML="<span>我方</span><small>隊伍</small>";allies.appendChild(allyTitle);
  const foeTitle=make("div","xuan-side-heading");foeTitle.innerHTML="<span>敵方</span><small>目標</small>";foes.appendChild(foeTitle);
  const allyFigures=make("div","xuan-stage-figures xuan-ally-figures"),enemyFigures=make("div","xuan-stage-figures xuan-enemy-figures");
  let playerMini=null;
  if(player){
   const role=player.querySelector(".small")?.textContent||"";
   wrapUnit(player,classPick(role),"xuan-main-unit xuan-player-unit");
   replacePortraitArt(player,globalThis.YijieBattleArt?.classById?.(G?.character?.classId)||globalThis.YijieBattleArt?.classByText?.(role));
   const info=player.querySelector(".xuan-unit-info"),name=info?.querySelector(":scope > b")?.textContent||"旅人";
   const stats=Array.from(info?.querySelectorAll(":scope > div")||[]).find(el=>!el.classList.contains("small")&&!el.classList.contains("hpbar"))?.textContent||"";
   playerMini=make("div","party-mini xuan-player-mini");playerMini.setAttribute("aria-label",name+" 隊伍狀態");miniPortrait(playerMini,classPick(role));
   replacePortraitArt(playerMini,globalThis.YijieBattleArt?.classById?.(G?.character?.classId)||globalThis.YijieBattleArt?.classByText?.(role));
   const title=make("b");title.textContent=name;const subtitle=make("span");subtitle.textContent=role||"旅人";const status=make("div");status.textContent=stats;
   playerMini.append(title,subtitle,status);const bar=info?.querySelector(".hpbar");if(bar)playerMini.appendChild(bar.cloneNode(true));
   const figure=stageFigure(player,"xuan-player-figure");if(figure)allyFigures.appendChild(figure);
  }
  if(party){
   party.classList.add("xuan-party-strip");
   party.querySelectorAll(".party-mini").forEach((unit,index)=>{
    const role=unit.querySelector("span")?.textContent||["warrior","mage","scout","healer"][index%4];
    miniPortrait(unit,classPick(role));
    replacePortraitArt(unit,globalThis.YijieBattleArt?.classByText?.(role));
    const figure=stageFigure(unit,"xuan-party-figure");if(figure)allyFigures.appendChild(figure);
   });
  }
  if(comp){
   wrapUnit(comp,"familiar","xuan-companion-unit");
   replacePortraitArt(comp,globalThis.YijieBattleArt?.monsterByText?.(G?.battle?.companion?.name||comp.textContent));
   const figure=stageFigure(comp,"xuan-companion-figure");if(figure)allyFigures.appendChild(figure);
  }
  if(vs)vs.setAttribute("aria-hidden","true");
  if(enemy){
   wrapUnit(enemy,pick(enemy.querySelector(".small")?.textContent,"monster"),"xuan-enemy-unit");
   replacePortraitArt(enemy,globalThis.YijieBattleArt?.monsterById?.(G?.battle?.enemy?.id)||globalThis.YijieBattleArt?.monsterByText?.(enemy.textContent));
   const figure=stageFigure(enemy,"xuan-enemy-figure");if(figure)enemyFigures.appendChild(figure);
  }
  if(enemyFigures.childElementCount===1)enemyFigures.classList.add("xuan-enemy-figures-single");
  foes.appendChild(enemyFigures);allies.appendChild(allyFigures);
  head.replaceChildren(foes,allies);head.classList.add("xuan-battle-head","xuan-battle-stage");head.dataset.xuanStyled="true";
  const roster=party||make("div","party-battle-strip xuan-party-strip"),statusBand=make("section","xuan-party-status");statusBand.setAttribute("aria-label","隊伍戰鬥狀態");
  if(playerMini)roster.insertBefore(playerMini,roster.firstChild);
  if(comp){
   const info=comp.querySelector(".xuan-unit-info"),name=info?.querySelector(":scope > b")?.textContent||"夥伴",role=info?.querySelector(".small")?.textContent||"同行夥伴",stats=Array.from(info?.querySelectorAll(":scope > div")||[]).find(el=>!el.classList.contains("small")&&!el.classList.contains("hpbar"))?.textContent||"";
   const pet=make("div","party-mini xuan-companion-mini");pet.setAttribute("aria-label",name+" 戰鬥狀態");miniPortrait(pet,"familiar");
   replacePortraitArt(pet,globalThis.YijieBattleArt?.monsterByText?.(name));
   const title=make("b");title.textContent=name;const subtitle=make("span");subtitle.textContent=role;const status=make("div");status.textContent=stats;pet.append(title,subtitle,status);
   const bar=info?.querySelector(".hpbar");if(bar)pet.appendChild(bar.cloneNode(true));roster.appendChild(pet);
  }
  roster.classList.add("xuan-party-strip");statusBand.appendChild(roster);body.insertBefore(statusBand,head.nextSibling);
 }
 const statusBand=body.querySelector(".xuan-party-status"),log=body.querySelector(".battlelog");
 if(statusBand&&log&&!body.querySelector(".xuan-battle-info")){
  const info=make("div","xuan-battle-info");body.insertBefore(info,statusBand);info.append(statusBand,log);
 }
 const actions=body.querySelector(".battleactions");
 if(actions&&!actions.parentElement?.classList.contains("xuan-command-panel")){
  const panel=make("section","xuan-command-panel");
  const title=make("div","xuan-command-heading");title.textContent="戰鬥指令";
  actions.parentNode.insertBefore(panel,actions);panel.append(title,actions);
  const secondary=body.querySelector(".battle-secondary-actions");if(secondary)panel.appendChild(secondary);
 }
 if(actions&&!actions.dataset.xuanStyled){
  const names=["攻擊","魔法","技能","道具"],icons=["blade","crystal","book","potion"];
  actions.querySelectorAll("button").forEach(function(button,index){
   const originalLabel=button.textContent.trim();button.classList.add("xuan-command-button");button.dataset.command=["attack","magic","skill","item"][index]||"command";button.setAttribute("aria-label",originalLabel);
   button.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><use href="./assets/art/item-skill-icons.svg#'+(icons[index]||"mark")+'"></use></svg><span>'+(names[index]||originalLabel)+'</span>';
  });
  actions.dataset.xuanStyled="true";
 }
}

let lastEffectLog="";
function battleEffect(){const box=document.querySelector("#battleBack .battlebox"),body=document.getElementById("battleBody"),row=body?.querySelector(".battlelog>div:last-child"),line=String(row?.textContent||"").trim();if(!box||!line||line===lastEffectLog)return;lastEffectLog=line;if(!/造成|傷害|治療|回復|命中|未命中|爆擊|格擋|施放/.test(line))return;const type=/爆擊/.test(line)?"critical":/火|焰|炎/.test(line)?"fire":/水|冰|霜/.test(line)?"ice":/治療|回復/.test(line)?"heal":/未命中/.test(line)?"miss":/魔法|施放|術式/.test(line)?"magic":"slash";const fx=make("div","xuan-hit-fx fx-"+type);fx.setAttribute("aria-hidden","true");box.appendChild(fx);setTimeout(()=>fx.remove(),900)}
let decorateFrame=0;function scheduleDecorate(){if(decorateFrame)return;const run=()=>{decorateFrame=0;decorate();battleEffect()};decorateFrame=typeof requestAnimationFrame==="function"?requestAnimationFrame(run):setTimeout(run,16)}
const watchRoot=document.getElementById("battleBack")||document.getElementById("battleBody")||document.body;if(watchRoot){new MutationObserver(scheduleDecorate).observe(watchRoot,{childList:true,subtree:true,characterData:true});decorate();battleEffect()}
})();
