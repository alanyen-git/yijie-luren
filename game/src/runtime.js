
const CURRENT_VERSION="CURRENT-1.129.0";
const AUDIT_INTERVAL_TURNS=20;
const HISTORY_RETENTION_LIMIT=500,HISTORY_DISPLAY_LIMIT=80;
DB.meta.current_version=CURRENT_VERSION;
DB.hard_rules.audit_every_turns=AUDIT_INTERVAL_TURNS;
DB.meta.runtime_optimization_revision="RUNTIME-OPT-1.4";
DB.meta.ui_runtime_revision="UI-RUNTIME-1.0";
DB.meta.quality_audit_revision="QUALITY-AUDIT-1.0";
DB.meta.status_runtime_revision="STATUS-1.11";
DB.runtime_optimization_system.version="RUNTIME-OPT-1.4";
DB.status_system.version="STATUS-1.11";
Object.assign(DB.status_system.definitions,{
 confusion:{name:"混亂",category:"control",cleanse:["confusion"],effect:"每回合45%無法行動，命中下降"},
 petrify:{name:"石化",category:"control",cleanse:["petrify"],effect:"無法行動"},
 charm:{name:"魅惑",category:"control",cleanse:["charm"],effect:"每回合35%無法行動"}
});
DB.quality_audit_system={version:"QUALITY-AUDIT-1.0",scope:["介面","內容","程序"],rules:["所有物品狀態引用必須有定義與runtime。","製作每次嘗試都消耗完整配方材料，成功與否不影響扣料。","戰鬥行動須先驗證道具與資源，再推進角色狀態回合。","窄螢幕不得因角色摘要造成水平溢位。"],save_schema_changed:false,canonical_world_content_changed:false};
DB.ui_runtime_system={version:"UI-RUNTIME-1.0",features:["連線中靜態DOM快取","相同HTML略過重寫","行動列依狀態簽章更新","動態按鈕補齊button型別","彈窗Tab焦點循環","目前導覽aria-current","存檔失敗可視提示"],rules:["快取只保存DOM參照與顯示字串，不寫入存檔。","戰鬥與首頁共用同一次combatStats結果。","介面重構不得改變角色數值、世界內容或存檔schema。"],save_schema_changed:false,canonical_world_content_changed:false};
DB.management_ai[7].responsibility="每回合自動存檔、每20回合自檢";
DB.management_ai[7].validations[1]="每20回合稽核";
DB.generation_pipeline.steps[11]="二十回合績效與一致性稽核";
DB.system_orchestrator.domains[11].responsibility="每回合寫回、二十回合自檢與整合健康度";
DB.integration_registry.optimization_notes.push("RUNTIME-STABILITY-1.0：每次玩家行動合併為一次存檔與一次畫面繪製，並將角色動態自檢調整為每20回合；不改canonical世界內容與存檔結構。");
DB.integration_registry.optimization_notes.push("CURRENT-1.52.0／QUALITY-AUDIT-1.0：修正製作扣料、戰鬥行動驗證、狀態引用/runtime與窄螢幕可讀性；不改canonical世界內容與存檔結構。");
DB.integration_registry.optimization_notes.push("CURRENT-1.53.0／UI-RUNTIME-1.0：快取靜態DOM、略過相同介面重寫、批次同步背包型委託、共用戰鬥數值，並補齊彈窗鍵盤焦點；不改canonical世界內容與存檔結構。");
DB.integration_registry.optimization_notes.push("CURRENT-1.54.0／RUNTIME-OPT-1.4：補齊能力點與技能XP舊存檔正規化、三次教會復活、商店每日庫存及每日收購資金；不改canonical世界內容與既有角色資料。");
DB.integration_registry.optimization_notes.push("CURRENT-1.55.0／CONTENT-DEPTH-1.0：西境河谷加入地點限定奇遇、F～C級委託、設施委託、地方傳聞、節慶、微歷史與民俗；既有存檔原地相容。");
DB.integration_registry.optimization_notes.push("CURRENT-1.57.0／WEB-DEPLOY-1.0：正式版改由GitHub Pages發布，版本檢查使用相對路徑並定期偵測更新；遊玩與發布皆不依賴Netlify。");
let G=null;
function retainRecentHistory(history,entry){
 const rows=Array.isArray(history)?history:[];
 if(entry!==undefined)rows.push(entry);
 if(rows.length>HISTORY_RETENTION_LIMIT)rows.splice(0,rows.length-HISTORY_RETENTION_LIMIT);
 return rows
}
function trimHistoryLog(el){
 if(!el)return;
 while(el.children.length>HISTORY_DISPLAY_LIMIT)el.removeChild(el.firstElementChild)
}
let creation={race:null,raceSubtype:null,origin:null,element:null,classId:null,randomLeft:10};
const DOM_CACHE=new Map(),UI_HTML_CACHE=new WeakMap();
const $=s=>{
 if(/^#[A-Za-z][\w-]*$/.test(s)){
   const cached=DOM_CACHE.get(s);if(cached?.isConnected)return cached;
   const found=document.querySelector(s);if(found)DOM_CACHE.set(s,found);return found
 }
 return document.querySelector(s)
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=n=>Math.floor(Math.random()*n);
function normalizeUIButtonTypes(html){return String(html??"").replace(/<button\b(?![^>]*\btype\s*=)/gi,'<button type="button"')}
function setUIHTML(el,html){
 if(!el)return false;const safe=normalizeUIButtonTypes(html);if(UI_HTML_CACHE.get(el)===safe)return false;
 el.innerHTML=safe;UI_HTML_CACHE.set(el,safe);return true
}
function setUIText(el,text){if(!el)return false;const value=String(text??"");if(el.textContent===value)return false;el.textContent=value;return true}
const IDX={
 item:new Map(DB.items.map(x=>[x.id,x])),loc:new Map(DB.locations.map(x=>[x.id,x])),cls:new Map(DB.combat_classes.map(x=>[x.id,x])),
 origin:new Map(DB.origins.map(x=>[x.id,x])),sub:new Map(DB.subjobs.map(x=>[x.id,x])),talent:new Map((DB.talents||[]).map(x=>[x.id,x])),
 monster:new Map((DB.monsters||[]).map(x=>[x.id,x])),quest:new Map([...(DB.quest_templates||[]),...(DB.shop_quests||[])].map(x=>[x.id,x])),recipe:new Map((DB.recipes||[]).map(x=>[x.id,x])),
 companion:new Map((DB.companion_species||[]).map(x=>[x.id,x])),partyTemplate:new Map((DB.party_member_templates||[]).map(x=>[x.id,x])),
 faith:new Map((DB.faith_entities||[]).map(x=>[x.id,x])),faithOath:new Map((DB.faith_oaths||[]).map(x=>[x.id,x])),pantheon:new Map((DB.pantheons||[]).map(x=>[x.id,x])),
 worldOrg:new Map((DB.world_organizations||[]).map(x=>[x.id,x])),adventureEvent:new Map((DB.adventure_event_templates||[]).map(x=>[x.id,x])),
 dialogue:new Map((DB.dialogue_database?.records||[]).map(x=>[x.id,x])),intel:new Map((DB.intel_database?.records||[]).map(x=>[x.id,x])),
 lore:new Map((DB.lore_records||[]).map(x=>[x.id,x])),polity:new Map((DB.political_entities||[]).map(x=>[x.id,x])),
 culture:new Map((DB.culture_profiles||[]).map(x=>[x.id,x])),worldRegion:new Map((DB.world_regions||[]).map(x=>[x.id,x])),
 authority:new Map((DB.political_authority_catalog||DB.authority_archetypes||[]).map(x=>[x.id,x])),
 authorityTier:new Map((DB.authority_tiers||[]).map(x=>[x.id,x])),authorityRight:new Map((DB.authority_rights_catalog||[]).map(x=>[x.id,x])),
 authorityProfile:new Map((DB.polity_authority_profiles||[]).map(x=>[x.polity_id,x])),authorityRequest:new Map((DB.authority_request_archetypes||[]).map(x=>[x.id,x])),
 discipline:new Map((DB.discipline_factions||[]).map(x=>[x.id,x])),sTier:new Map((DB.s_tier_combatants||[]).map(x=>[x.id,x])),
 historyEvent:new Map((DB.world_timeline||[]).map(x=>[x.id,x])),historySubperiod:new Map((DB.historical_subperiods||[]).map(x=>[x.id,x])),
 historyChain:new Map((DB.historical_causal_chains||[]).map(x=>[x.id,x])),historicalDispute:new Map((DB.historical_disputes||[]).map(x=>[x.id,x])),
 regionalPower:new Map((DB.regional_powers||[]).map(x=>[x.id,x])),materialPack:new Map((DB.generator_material_packs||[]).map(x=>[x.region_id,x])),
 historicalRelation:new Map((DB.historical_relationship_records||[]).map(x=>[x.id,x]))
};
let TRAVEL_CACHE=null;
function ensureTravelCache(){if(TRAVEL_CACHE)return TRAVEL_CACHE;const ids=DB.locations.map(x=>x.id),ix=new Map(ids.map((id,i)=>[id,i])),n=ids.length,d=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?0:Infinity));for(const l of DB.locations){const i=ix.get(l.id);for(const e of (l.links||[])){const j=ix.get(e.to);if(j!=null&&Number.isFinite(e.hours))d[i][j]=Math.min(d[i][j],e.hours)}}for(let k=0;k<n;k++)for(let i=0;i<n;i++){if(!Number.isFinite(d[i][k]))continue;for(let j=0;j<n;j++){const nd=d[i][k]+d[k][j];if(nd<d[i][j])d[i][j]=nd}}TRAVEL_CACHE={ix,d};return TRAVEL_CACHE}
const ENCOUNTER_CACHE=new Map();
const CRAFT_INDEX=new Map();
function craftingItemsFor(fid,tier){const k=`${fid}|${tier}`;if(!CRAFT_INDEX.has(k))CRAFT_INDEX.set(k,(DB.items||[]).filter(d=>d.craft_recipe?.requires_facility===fid&&d.tier===tier));return CRAFT_INDEX.get(k)}
const by=(arr,id)=>arr.find(x=>x.id===id),item=id=>IDX.item.get(id),loc=id=>IDX.loc.get(id),cls=id=>IDX.cls.get(id),org=id=>IDX.origin.get(id),sub=id=>IDX.sub.get(id),monster=id=>IDX.monster.get(id);
function nowId(p){return p+"-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase()}
function rollD20(){return 1+rand(20)}
function weightedPick(pairs){let total=pairs.reduce((s,x)=>s+x[1],0),r=Math.random()*total;for(const x of pairs){r-=x[1];if(r<=0)return x[0]}return pairs.at(-1)[0]}
function tierOrder(t){return {F:0,E:1,D:2,C:3,B:4,A:5,S:6}[t]??0}
function equipId(v){return v&&typeof v==="object"?v.id:v}
function makeEquip(id,dur=null){const d=item(id);return {id,durability:dur??d.durability,maxDurability:d.durability}}
function init(){let raw=null;try{raw=window.localStorage?localStorage.getItem("yijie_luren_save"):null}catch(e){}if(raw){try{G=JSON.parse(raw);migrateSave();enterGame(true)}catch(e){console.warn(e)}}}
function migrateSave(){
 if(G)G.history=retainRecentHistory(G.history);
 const legacyOriginMap=DB.origin_system?.legacy_origin_map||{};
 const legacyRaceSubtypeMap={"獅":"獅人","虎":"虎人","狼":"狼人","狐":"狐人","貓":"貓人","牛":"獅人"};
 if(G?.character?.raceId==="R-ORC"&&legacyRaceSubtypeMap[G.character.raceSubtype])G.character.raceSubtype=legacyRaceSubtypeMap[G.character.raceSubtype];

 if(G?.character?.originId&&legacyOriginMap[G.character.originId])G.character.originId=legacyOriginMap[G.character.originId];

 if(!G||G.meta?.version===CURRENT_VERSION)return;
 G.meta.version=CURRENT_VERSION;
 const c=G.character;c.politicalStanding=c.politicalStanding||{};c.regionalPowerStanding=c.regionalPowerStanding||{};
 for(const [oldId,newId] of Object.entries({"POL-010":"RP-010","POL-017":"RP-017"})){if(c.politicalStanding[oldId]!=null)c.regionalPowerStanding[newId]=c.politicalStanding[oldId];delete c.politicalStanding[oldId]}
 c.disciplines=c.disciplines||{discovered:[],mastery:{},reputation:{},membershipId:null};
 const dm=DB.discipline_merge_map||{};c.disciplines.discovered=[...new Set((c.disciplines.discovered||[]).map(id=>dm[id]||id))];
 for(const [oldId,newId] of Object.entries(dm)){if(c.disciplines.mastery?.[oldId]!=null)c.disciplines.mastery[newId]=Math.max(Number(c.disciplines.mastery[newId]||0),Number(c.disciplines.mastery[oldId]||0));if(c.disciplines.reputation?.[oldId]!=null)c.disciplines.reputation[newId]=Math.max(Number(c.disciplines.reputation[newId]||-100),Number(c.disciplines.reputation[oldId]||0));delete c.disciplines.mastery?.[oldId];delete c.disciplines.reputation?.[oldId]}
 c.politicalStanding=c.politicalStanding||{};c.disciplines=c.disciplines||{discovered:[],mastery:{},reputation:{},membershipId:null};c.disciplines.discovered=Array.isArray(c.disciplines.discovered)?c.disciplines.discovered:[];c.disciplines.mastery=c.disciplines.mastery||{};c.disciplines.reputation=c.disciplines.reputation||{};G.worldState=G.worldState||{};G.worldState.disciplineEvents=Array.isArray(G.worldState.disciplineEvents)?G.worldState.disciplineEvents.slice(0,30):[];G.worldState.integratedEvents=Array.isArray(G.worldState.integratedEvents)?G.worldState.integratedEvents.slice(0,60):[];G.worldState.politicalRelations=G.worldState.politicalRelations||{};G.worldState.politicalEvents=Array.isArray(G.worldState.politicalEvents)?G.worldState.politicalEvents.slice(0,30):[];G.worldState.authorityEvents=Array.isArray(G.worldState.authorityEvents)?G.worldState.authorityEvents.slice(0,30):[];G.worldState.sTierEvents=Array.isArray(G.worldState.sTierEvents)?G.worldState.sTierEvents.slice(0,20):[];G.worldState.orchestrator=G.worldState.orchestrator||{lastWorldDynamicTurn:-1};c.knownLoreIds=Array.isArray(c.knownLoreIds)?c.knownLoreIds:starterLoreForCharacter(c.raceId,c.classId);c.knownLoreIds=[...new Set([...c.knownLoreIds,...starterLoreForCharacter(c.raceId,c.classId)])].slice(-300);c.organizations=c.organizations||{membershipId:null,memberships:[],formerMemberships:[],reputation:{},discovered:[]};c.organizations.memberships=Array.isArray(c.organizations.memberships)?c.organizations.memberships:[];c.organizations.formerMemberships=Array.isArray(c.organizations.formerMemberships)?c.organizations.formerMemberships:[];c.organizations.reputation=c.organizations.reputation||{};c.organizations.discovered=Array.isArray(c.organizations.discovered)?c.organizations.discovered:[];G.pendingOrganizationEncounter=G.pendingOrganizationEncounter||null;G.worldState.orgRelations=G.worldState.orgRelations||{};G.worldState.orgEvents=Array.isArray(G.worldState.orgEvents)?G.worldState.orgEvents.slice(0,30):[];c.faith=c.faith||{patronDeityId:null,oathId:null,standing:{}};c.faith.standing=c.faith.standing||{};G.dialogueMemory=Array.isArray(G.dialogueMemory)?G.dialogueMemory.slice(-12):[];G.knownIntel=Array.isArray(G.knownIntel)?G.knownIntel.slice(-120):[];G.explorationIntel=Array.isArray(G.explorationIntel)?G.explorationIntel.slice(-(DB.quest_system?.quest_intel_system?.exploration_record_cap||120)):[];G.intelBoardCache=G.intelBoardCache||{};G.pendingAdventureEvent=G.pendingAdventureEvent||null;G.pendingPartyOpportunity=G.pendingPartyOpportunity||null;c.adventureParty=c.adventureParty||null;if(c.adventureParty){c.adventureParty.members=Array.isArray(c.adventureParty.members)?c.adventureParty.members.slice(0,4):[];if(!c.adventureParty.members.length)c.adventureParty=null;}G.pendingPetOpportunity=G.pendingPetOpportunity||null;c.companions=Array.isArray(c.companions)?c.companions.slice(0,3):[];c.activeCompanionId=c.companions.some(x=>x.uid===c.activeCompanionId)?c.activeCompanionId:(c.companions[0]?.uid||null);G.worldState.lastAdventureEventTurn=G.worldState.lastAdventureEventTurn??-999;
 const rr=by(DB.races,c.raceId)||DB.races[0],rs=(c.raceId==="R-ORC"&&c.raceSubtype)?(DB.race_system.beastfolk_subtypes[c.raceSubtype]||{}):{};
 c.raceTraits=c.raceTraits||[...(rr.traits||[]),...(rs.traits||[])];
 c.raceResistances=c.raceResistances||{...(rr.element_resistances||{})};
 if(!Array.isArray(c.talents)||c.talents.length!==DB.talent_system.character_limit){
   const ctx=talentContext(c.raceId,c.raceSubtype,c.originId,c.classId,c.element,c.subjobs||[]);
   c.talents=drawTalents(ctx,DB.talent_system.character_limit).map(t=>t.id)
 }


 c.stats.幸運=c.stats.幸運??10;c.buffs=c.buffs||[];c.thirst=c.thirst??10;c.alive=c.hp>0;c.maxMana=c.maxMana??(12+(c.stats.智力||10)+Math.floor((c.stats.意志||10)/2)+talentSpecial("maxMana"));c.mana=c.mana??c.maxMana;c.toxicity=c.toxicity??0;c.statusEffects=c.statusEffects||[];
 c.guildReputation=c.guildReputation??0;c.guildRestrictionUntilTurn=c.guildRestrictionUntilTurn??0;G.quests=G.quests||[];G.questHistory=G.questHistory||[];
 for(const q of (G.quests||[])){if(!q.sourceType){const s=questSourceMeta(q);q.sourceType=s.type;q.sourceId=s.id;}}for(const q of G.quests){
   if(q.templateId==="Q-PATROL"){
     const fresh=questTemplate("Q-PATROL"),oldProgress=Math.min(q.progress||0,fresh.objective.target||2);
     q.objective=JSON.parse(JSON.stringify(fresh.objective));
     q.description=fresh.description;
     q.patrolVisited=(q.patrolVisited||fresh.objective.checkpoints.slice(0,oldProgress)).slice(0,oldProgress);
     q.progress=oldProgress
   }
 }for(const q of G.quests){if(q.status==="ready"&&!q.reportDeadlineHour)q.reportDeadlineHour=Math.max(q.deadlineHour||totalHours(),totalHours()+(DB.quest_system.report_grace_hours||24));}c.classMastery=c.classMastery??0;c.classHistory=c.classHistory||[];c.unlockedClassRoutes=c.unlockedClassRoutes||[];c.knownRecipes=c.knownRecipes||[];c.weaponSet=c.weaponSet||{offhand:null};for(const sj of (c.subjobs||[]))sj.xp=sj.xp??0;
 const mainD=item(equipId(c.equipment?.主武器));if(mainD&&isShieldItem(mainD)){if(!c.weaponSet.offhand)c.weaponSet.offhand=c.equipment.主武器;c.equipment.主武器=makeEquip("EQ-IRON-SWORD")}
 if(mainIsTwoHanded()&&c.weaponSet.offhand)unequipOffhand(true);
 const offD=c.weaponSet.offhand&&item(equipId(c.weaponSet.offhand));if(offD&&!offhandEligible(offD))unequipOffhand(true);
c.currentFacility=null;c.battle=null;
 const slotMap={主武器:"EQ-IRON-SWORD",頭盔:"EQ-HELM",盔甲:"EQ-CLOTH",手套:"EQ-GLOVE",鞋子:"EQ-SHOE",披風:"EQ-CLOAK",飾品1:null,飾品2:null};
 for(const slot of DB.hard_rules.equipment_slots){let v=c.equipment?.[slot];let id=equipId(v);if(id&&!item(id))id=slotMap[slot];c.equipment[slot]=id?makeEquip(id,v?.durability):null}
 c.inventory=(c.inventory||[]).map(x=>({...x}));normalizeCharacterSkills();
 normalizeAbilityPoints();normalizeRevivalState();for(const s of (c.skills||[]))normalizeSkillXp(s);G.worldState.questMarketLedger=Array.isArray(G.worldState.questMarketLedger)?G.worldState.questMarketLedger:[];for(const q of (G.quests||[])){const o=q.objective||{};if(["item","gather"].includes(o.kind)&&o.item_id)o.consume_on_turnin=true;const cap=DB.progression_system.quest_xp_by_tier[q.tier]||12;q.xp_reward=Math.min(Number(q.xp_reward||cap),cap)}syncAllQuestInventoryProgress(true);
 normalizeAffiliationMemberships();syncResourceCaps(true);persist()
}
let lastPersistError=null;
function renderSaveHealth(error=null){
 const el=$("#saveWarning");if(!el)return;
 if(error){el.classList.remove("hide");const msg=el.querySelector("span");if(msg)msg.textContent=`${error} 請先匯出存檔備份。`}
 else el.classList.add("hide")
}
function persist(){
 try{
   if(!window.localStorage)throw new Error("瀏覽器未提供本機儲存空間。");
   const serialized=JSON.stringify(G);localStorage.setItem("yijie_luren_save",serialized);globalThis.__LAST_SAVE_BYTES=serialized.length;
   if(lastPersistError){lastPersistError=null;renderSaveHealth(null)}
   return true
 }catch(e){
   const message=e?.name==="QuotaExceededError"?"本機儲存空間已滿。":"目前無法寫入本機存檔。";
   if(lastPersistError!==message)console.error("local save failed",e);
   lastPersistError=message;renderSaveHealth(message);return false
 }
}

function talentById(id){return IDX.talent.get(id)||null}
function talentContext(raceId,raceSubtype,originId,classId,element,subjobs=[]){
 const r=by(DB.races,raceId),o=org(originId),c=cls(classId);
 return {race:r,subtype:raceSubtype,origin:o,cls:c,element,subjobs,weaponGroup:talentWeaponGroupForClass(c)}
}
function talentWeaponGroupForClass(c){
 if(!c)return null;
 const d=item(c.weapon),name=(d?.name||"")+" "+(c.name||""),sub=d?.catalog_subcategory||"";
 if(/盾/.test(name))return "盾牌";
 if(/巨劍|大劍/.test(name))return "巨劍";
 if(/弩/.test(name))return "弩";
 if(/弓/.test(name)||sub==="弓弩")return "弓";
 if(/飛刀|投擲/.test(name))return "投擲";
 if(/槍|矛|戟/.test(name)||sub==="槍矛長兵")return "長槍";
 if(/拳|武僧|僧侶/.test(name))return "徒手";
 if(/匕首|短刃|影刃|雙刃/.test(name))return "匕首";
 if(/斧|錘|鎚|釘頭/.test(name)||["斧","錘"].includes(sub))return "斧錘";
 if(/劍|刀/.test(name)||["劍","武士刀"].includes(sub))return "長劍";
 return sub||"其他"
}
function talentMatchBlock(block,ctx){
 if(!block)return 0;
 let hits=0,defined=0;
 const checks=[
  ["race_ids",ctx.race?.id],["race_groups",ctx.race?.group],["class_ids",ctx.cls?.id],
  ["class_categories",ctx.cls?.category],["origin_ids",ctx.origin?.id],["origin_categories",ctx.origin?.category],
  ["elements",ctx.element],["primary",ctx.cls?.primary],["weapon_groups",ctx.weaponGroup]
 ];
 for(const [k,v] of checks){
   if(block[k]?.length){defined++;if(block[k].includes(v))hits++}
 }
 if(block.starter_subjobs?.length){
   defined++;
   const have=new Set([...(ctx.origin?.starter_subjobs||[]),...(ctx.subjobs||[]).map(x=>x.id||x)]);
   if(block.starter_subjobs.some(x=>have.has(x)))hits++
 }
 return {hits,defined}
}
function talentEligible(t,ctx){
 const r=talentMatchBlock(t.required,ctx);
 return !r.defined||r.hits>0
}
function talentScore(t,ctx){
 if(!talentEligible(t,ctx))return 0;
 let s=Number(t.weight||1);
 const p=talentMatchBlock(t.preferred,ctx);
 s+=p.hits*6;
 if(t.universal)s+=2;
 return Math.max(.1,s)
}
function talentCandidates(ctx,starterOnly=true){
 let pool=DB.talents.filter(t=>!starterOnly||t.starter_eligible!==false).map(t=>[t,talentScore(t,ctx)]).filter(x=>x[1]>0);
 const strong=pool.filter(([t])=>{const p=talentMatchBlock(t.preferred,ctx),r=talentMatchBlock(t.required,ctx);return p.hits>0||r.hits>0});
 let out=strong;
 if(out.length<6){
   const ids=new Set(out.map(([t])=>t.id));
   const fallback=pool.filter(([t])=>t.universal&&!ids.has(t.id)).sort((a,b)=>b[1]-a[1]);
   out=[...out,...fallback.slice(0,8-out.length)]
 }
 out.sort((a,b)=>b[1]-a[1]||a[0].id.localeCompare(b[0].id));return out
}
function drawTalents(ctx,count=2,starterOnly=true){
 const pool=talentCandidates(ctx,starterOnly).slice(),out=[];
 while(out.length<count&&pool.length){
   const pick=weightedPick(pool.map(([t,s])=>[t,s]));out.push(pick);
   const i=pool.findIndex(([t])=>t.id===pick.id);if(i>=0)pool.splice(i,1)
 }
 return out
}
function refreshTalentPreview(){
 const el=$("#talentPreview");if(!el)return;
 if(!creation.race||!creation.origin||!creation.classId||!creation.element){
   el.textContent="完成種族、出身與職業後顯示；建立角色時會從合適候選中無重複抽2個。";return
 }
 const ctx=talentContext(creation.race,creation.raceSubtype,creation.origin,creation.classId,creation.element,[]);
 const pool=talentCandidates(ctx);
 el.innerHTML=`候選 ${pool.length} 個：${pool.slice(0,10).map(([t])=>t.name).join("、")}${pool.length>10?"……":""}<br>建立角色時依權重無重複抽2個。`
}
function characterTalents(){return (G?.character?.talents||[]).map(talentById).filter(Boolean)}
function talentStatBonus(n){return characterTalents().reduce((s,t)=>s+(t.effects?.stats?.[n]||0),0)}
function talentSpecial(key){return characterTalents().reduce((s,t)=>s+(t.effects?.special?.[key]||0),0)}
function talentSubjobBonus(sid,key){
 if(!sid||!G?.character?.subjobs?.some(x=>x.id===sid))return 0;
 let total=0;
 for(const t of characterTalents()){
   const s=t.effects?.subjob;if(!s)continue;
   if(s.all||(s.ids||[]).includes(sid))total+=Number(s[key]||0)
 }
 return total
}
function talentCombat(){
 const out={attack:0,magicPower:0,defense:0,magicDefense:0,accuracy:0,evasion:0,critRate:0,critDamage:0,attackSpeed:0,castSpeed:0,blockRate:0,statusResist:0};
 for(const t of characterTalents()){
   const c=t.effects?.combat||{};
   for(const k of Object.keys(out))out[k]+=c[k]||0
 }
 return out
}
function talentResistances(){
 const out={光明:0,黑暗:0,火:0,風:0,水:0,地:0,雷:0,生命:0,死亡:0};
 for(const t of characterTalents())for(const [k,v] of Object.entries(t.effects?.resist||{}))if(k in out)out[k]+=v;
 return out
}
function talentSurvival(){
 const out={hungerRate:1,fatigueRate:1,thirstRate:1};
 for(const t of characterTalents()){
   const s=t.effects?.survival||{};
   if(s.hungerRate)out.hungerRate*=s.hungerRate;
   if(s.fatigueRate)out.fatigueRate*=s.fatigueRate;
   if(s.thirstRate)out.thirstRate*=s.thirstRate
 }
 return out
}
function talentActionBonus(tag){
 return characterTalents().reduce((s,t)=>s+(t.effects?.action_bonus?.[tag]||0),0)
}
function talentTargetBonus(enemy){
 let bonus=0;
 for(const t of characterTalents()){
   const x=t.effects?.target_bonus;if(!x)continue;
   const catOk=!x.categories?.length||x.categories.includes(enemy.category);
   const nameOk=!x.name_keywords?.length||x.name_keywords.some(k=>(enemy.name||"").includes(k));
   if(catOk&&nameOk)bonus+=x.damage||0
 }
 return bonus
}
function rollRace(){
 const r=weightedPick(DB.races.map(x=>[x,Number(x.weight||1)]));
 creation.race=r.id;
 creation.raceSubtype=r.subtypes?.length?r.subtypes[rand(r.subtypes.length)]:null;
 $("#raceResult").innerHTML=`<b>${r.name}${creation.raceSubtype?`（${creation.raceSubtype}）`:""}</b><br><span class="small">${r.group||""}｜${r.description||""}</span>`;
 deriveElement();refreshTalentPreview()
}
function rollOrigin(){
 const o=weightedPick(DB.origins.map(x=>[x,Number(x.weight||1)]));
 creation.origin=o.id;
 $("#originResult").innerHTML=`<b>${o.name}</b><br><span class="small">${o.category}｜${o.description}</span>`;
 deriveElement();refreshTalentPreview()
}
function deriveElement(){if(!creation.race||!creation.origin){creation.element=null;$("#elementResult").textContent="依種族＋出身自動隨機";return}const r=by(DB.races,creation.race),o=org(creation.origin),pool=[...(r.affinity_bias||[]),...(o.affinities||[]),...(o.affinities||[])];creation.element=pool[rand(pool.length)]||"地";$("#elementResult").textContent=creation.element+"親和";refreshTalentPreview()}
function showClassSelect(){const list=DB.combat_classes.filter(x=>x.selectable);setUIHTML($("#classSelectBox"),`<div class="ij-class-grid">${list.map(c=>`<button class="ij-class-card" onclick="selectClass('${c.id}')"><img src="${c.portrait_uri||""}" alt="${c.name}立繪"><span><b>${c.name}</b> <span class="tier">${c.tier}</span><small>${c.combat_role||""}｜${c.weapon_group||""}</small></span></button>`).join("")}</div>`);$("#classSelectBox").classList.remove("hide")}
function selectClass(id){creation.classId=id;$("#classResult").innerHTML=`${cls(id).name} <span class="tier">${cls(id).tier}</span>（自選）`;$("#classSelectBox").classList.add("hide");refreshTalentPreview()}
function rollClass(){
 if(creation.randomLeft<=0){alert("隨機職業機會已用完。");return}
 creation.randomLeft--;
 const r=creation.race?by(DB.races,creation.race):null,o=creation.origin?org(creation.origin):null;
 const raceBias=new Set(r?.class_bias||[]),originBias=new Set(o?.class_bias||[]);
 const pool=DB.combat_classes.map(c=>{
   let w=c.selectable?12:(c.weight||3);
   if(raceBias.has(c.id))w*=1.65;
   if(originBias.has(c.id))w*=1.45;
   return [c.id,w]
 });
 const id=weightedPick(pool),c=cls(id);creation.classId=id;
 $("#classResult").innerHTML=`${c.name} <span class="tier">${c.tier}</span>${c.sealed?"（高階能力封印）":""}`;
 $("#randomCount").textContent=`隨機剩餘 ${creation.randomLeft} 次`
;refreshTalentPreview()}
function createCharacter(){
 if(!creation.race||!creation.origin||!creation.element||!creation.classId){alert("請先完成種族、出身與職業。");return}
 const r=by(DB.races,creation.race),o=org(creation.origin),cc=cls(creation.classId),id=nowId("CHAR");
 const pool=DB.skill_pools[cc.id]||DB.skill_pools["C-WAR"],starterPool=[...new Map(pool.filter(s=>s.tier==="F").map(s=>[skillKey(s),s])).values()],fallbackPool=[...new Map(pool.map(s=>[skillKey(s),s])).values()],chosen=(starterPool.length>=2?starterPool:fallbackPool).slice().sort(()=>Math.random()-.5).slice(0,2);
 const originItems=(o.items||[]).filter(id=>item(id));
 const inv=[{id:"I-WATER",qty:2,acquiredHour:8},{id:"I-BREAD",qty:2,acquiredHour:8},{id:"I-JERKY",qty:1,acquiredHour:8}];
 for(const iid of originItems){const found=inv.find(x=>x.id===iid);if(found)found.qty++;else inv.push({id:iid,qty:1,acquiredHour:8})}
 const startH=o.survival_start||{};
 G={meta:{version:CURRENT_VERSION,characterId:id,saveIndex:[]},turn:0,worldTime:{year:317,season:"初春",day:1,hour:8,minute:0},worldState:{weather:"晴朗",eventClock:0,politicalRelations:{},politicalEvents:[],authorityEvents:[],disciplineEvents:[],orgRelations:{},orgEvents:[],sTierEvents:[],integratedEvents:[],orchestrator:{lastWorldDynamicTurn:-1}},
 character:{id,name:($("#nameInput").value||"旅人").trim(),raceId:r.id,raceSubtype:creation.raceSubtype,originId:o.id,originFlags:[...(o.flags||[])],originKnowledge:[...(o.knowledge||[])],element:creation.element,classId:cc.id,level:1,xp:0,abilityPoints:0,spentAbilityPoints:0,abilityPointEntitlement:0,adventureRank:"F",combatGrade:"F",classSealed:!!cc.sealed,classGate:cc.gate||null,classMastery:0,classHistory:[],unlockedClassRoutes:[],
 subjobs:(o.starter_subjobs||[]).slice(0,1).map(sid=>({id:sid,grade:"F",xp:0,source:"出身"})),stats:{力量:10,敏捷:10,智力:10,意志:10,體力:10,魅力:10,幸運:10},hp:28,maxHp:28,stamina:22,maxStamina:22,mana:24,maxMana:24,toxicity:0,statusEffects:[],hunger:startH.hunger??10,fatigue:startH.fatigue??5,thirst:startH.thirst??10,weightCap:28+(r.weight_mod||0)+(o.weight_mod||0),moneySilver:o.silver||30,guildReputation:0,guildRestrictionUntilTurn:0,politicalStanding:{},disciplines:{discovered:[],mastery:{},reputation:{},membershipId:null},organizations:{membershipId:null,memberships:[],formerMemberships:[],reputation:{},discovered:[]},locationId:"L-WILLOW",currentFacility:null,alive:true,revival:{base:3,bonus:0,max:3,used:0,remaining:3},buffs:[],
 skills:chosen.map(s=>({...s,type:"戰鬥",mastery:6,skillXp:Math.round(skillXpThresholds()[1]*.55*100)/100})),companions:[],activeCompanionId:null,adventureParty:null,equipment:{主武器:makeEquip(cc.starter_weapon_id||cc.weapon),頭盔:makeEquip("EQ-HELM"),盔甲:makeEquip("EQ-CLOTH"),手套:makeEquip("EQ-GLOVE"),鞋子:makeEquip("EQ-SHOE"),披風:makeEquip("EQ-CLOAK"),飾品1:null,飾品2:null},
 inventory:inv,weaponSet:{offhand:cc.starter_offhand_id?makeEquip(cc.starter_offhand_id):null},knownRecipes:[],knownLoreIds:starterLoreForCharacter(r.id,cc.id),conditions:[],trainingToday:{day:1,combat:0,survival:0,body:0}},history:[],dialogueMemory:[],knownIntel:[],explorationIntel:[],intelBoardCache:{},questBoard:[],quests:[],questHistory:[],battle:null};
 const tctx=talentContext(r.id,creation.raceSubtype,o.id,cc.id,creation.element,G.character.subjobs);
 const drawnTalents=drawTalents(tctx,DB.talent_system.character_limit);
 G.character.talents=drawnTalents.map(t=>t.id);
 Object.entries(r.stats||{}).forEach(([k,v])=>G.character.stats[k]=(G.character.stats[k]||10)+v);const rs=(r.id==="R-ORC"&&creation.raceSubtype)?(DB.race_system.beastfolk_subtypes[creation.raceSubtype]||{}):{};
 Object.entries(rs.stats||{}).forEach(([k,v])=>G.character.stats[k]=(G.character.stats[k]||10)+v);
 G.character.raceTraits=[...(r.traits||[]),...(rs.traits||[])];
 G.character.raceResistances={...(r.element_resistances||{})};
 Object.entries(o.stats||{}).forEach(([k,v])=>G.character.stats[k]=(G.character.stats[k]||10)+v);
 Object.entries(cc.stats||{}).forEach(([k,v])=>G.character.stats[k]=(G.character.stats[k]||10)+(v>0?Math.max(1,Math.round(v*(cc.creation_stat_scale??1))):Math.round(v*(cc.creation_stat_scale??1))));
 if(r.adaptive_primary_bonus&&cc.primary)G.character.stats[cc.primary]=(G.character.stats[cc.primary]||10)+r.adaptive_primary_bonus;
 syncResourceCaps(false);
 autosave("建立角色");enterGame(false);
 log("系統",`角色建立：${displayRace()}／${o.name}／${cc.name}［${cc.tier}］。`,"ok");log("天賦",`候選池${talentCandidates(tctx).length}個，抽取：${characterTalents().map(t=>t.name).join("、")}。`,"ok");
 if((o.starter_subjobs||[]).length)log("出身",`因「${o.name}」取得起始副職業：${sub(o.starter_subjobs[0]).name}［F］。`,"ok");
 if((o.items||[]).length)log("出身",`出身物資已加入背包：${o.items.map(id=>item(id)?.name).filter(Boolean).join("、")}。`);
 log("世界誌",`已載入西境河谷、洛文邊侯領、${r.name}與${cc.name}的起始歷史文化記錄，共${G.character.knownLoreIds.length}筆。`,"ok");
 if(cc.sealed)log("職業",`高階職業能力保持封印：${cc.gate}`,"warnText")
}
function enterGame(resume){$("#createPanel").classList.add("hide");$("#gamePanel").classList.remove("hide");$("#fixedNav").classList.remove("hide");if(resume)log("系統",`已讀取存檔並更新至${CURRENT_VERSION}。`,"save");renderAll();if(typeof window.renderTownHome==="function")window.renderTownHome()}
function displayRace(){const r=by(DB.races,G.character.raceId);return r.name+(G.character.raceSubtype?`（${G.character.raceSubtype}）`:"")}
function timeText(){const t=G.worldTime;return `紀元${t.year}年・${t.season}・第${t.day}日 ${String(t.hour).padStart(2,"0")}:${String(t.minute).padStart(2,"0")}`}
function totalHours(){return (G.worldTime.day-1)*24+G.worldTime.hour+G.worldTime.minute/60}
function autosave(reason){const id=`AUTO-${G.meta.characterId.slice(-6)}-T${String(G.turn).padStart(5,"0")}-${Date.now().toString(36).slice(-5).toUpperCase()}`;G.meta.saveIndex.push({id,turn:G.turn,time:timeText(),reason,type:"AUTO"});if(G.meta.saveIndex.length>180)G.meta.saveIndex.shift();persist()}
function beginTurn(reason){if(G.pendingOrganizationEncounter){openPendingOrganizationEncounter();return false}if(G.pendingPartyOpportunity){openPendingPartyOpportunity();return false}if(G.pendingPetOpportunity){const sp=companionSpecies(G.pendingPetOpportunity.speciesId);if(sp)showModal(`寵物機緣・${sp.name}`,`<div class="card"><b>${sp.name}</b> <span class="tier">${sp.tier}</span><br><span class="small">尚未處理先前的馴養機緣。</span></div><div class="actions"><button class="good" onclick="resolvePetOpportunity(true)">嘗試馴養</button><button onclick="resolvePetOpportunity(false)">不打擾牠</button></div>`);return false}if(G.pendingAdventureEvent){openPendingAdventureEvent();return false}if(!G.character.alive){log("系統","角色已死亡，無法行動。","danger");return false}G.turn++;autosave(reason);log("回合",`<span class="time">【${timeText()}】</span>　回合 ${G.turn}　<span class="save">${G.meta.saveIndex.at(-1).id}</span>`);return true}
function advance(h){
 let m=Math.round(h*60);G.worldTime.minute+=m;
 while(G.worldTime.minute>=60){G.worldTime.minute-=60;G.worldTime.hour++}
 while(G.worldTime.hour>=24){G.worldTime.hour-=24;G.worldTime.day++}
 const ts=talentSurvival(),cs=combatStats(),rates=DB.survival_balance?.per_hour||{hunger:.85,fatigue:1.15,thirst:1.15};
 G.character.hunger=clamp(G.character.hunger+h*rates.hunger*ts.hungerRate,0,120);
 G.character.fatigue=clamp(G.character.fatigue+h*rates.fatigue*ts.fatigueRate,0,120);
 G.character.thirst=clamp(G.character.thirst+h*rates.thirst*ts.thirstRate,0,120);
 G.character.hp=clamp(G.character.hp+cs.hpRegen*h,0,G.character.maxHp);
 G.character.mana=clamp(G.character.mana+cs.manaRegen*h,0,G.character.maxMana);
 G.character.buffs=(G.character.buffs||[]).map(b=>({...b,hours:b.hours-h})).filter(b=>b.hours>0);
 G.character.toxicity=clamp((G.character.toxicity||0)-h*4,0,100);
 decayFood();applySurvival()
}
function endTurn(h){advance(h);updateQuestDeadlines();runWorldDynamics();if(typeof phase2Heartbeat==="function")try{phase2Heartbeat("turn")}catch(error){console.warn("world phase2 turn update failed",error)}if(G.character.alive&&G.turn>0&&G.turn%AUDIT_INTERVAL_TURNS===0)runAudit();persist();renderAll()}

function decayFood(){const now=totalHours();G.character.inventory.forEach(x=>{const d=item(x.id);if(d?.fresh_hours)x.freshness=clamp(Math.round(100-(now-(x.acquiredHour??now))/d.fresh_hours*100),0,100)})}
function applySurvival(){
 const c=G.character,cs=combatStats();c.conditions=[];
 for(const [n,v] of [["飢餓",c.hunger],["疲勞",c.fatigue],["口渴",c.thirst]]){
   if(v>=70)c.conditions.push(`${n}≥70%：D20受罰`);
   if(v>=90)c.conditions.push(`${n}≥90%：能力減半`)
 }
 const lethal=[c.hunger,c.fatigue,c.thirst].filter(v=>v>=100).length;
 if(lethal){const dmg=lethal*2;c.hp=clamp(c.hp-dmg,0,c.maxHp);c.conditions.push(`生存危機扣血${dmg}`)}
 if(calcWeight()>cs.carryCapacity)c.conditions.push(`超重：D20-2／移動速度下降`);
 if(c.hp<=0){c.alive=false;c.conditions.push("死亡");log("死亡","生命值歸零。","danger")}
}
function effectiveStat(n){
 let v=(G.character.stats[n]||10)+talentStatBonus(n);
 for(const b of (G.character.buffs||[]))v+=b[`stat_${n}`]||0;
 if(G.battle?.active&&G.battle.playerBuff)v+=G.battle.playerBuff[`stat_${n}`]||0;
 if(G.character.hunger>=90||G.character.fatigue>=90||G.character.thirst>=90)v=Math.floor(v/2);
 return Math.max(1,v)
}
function survivalPenalty(){let p=0;[G.character.hunger,G.character.fatigue,G.character.thirst].forEach(v=>{if(v>=70)p-=2});if(calcWeight()>G.character.weightCap)p-=2;return p}
function isShieldItem(d){return !!d&&d.catalog_subcategory==="盾牌"}
function isOneHandedWeapon(d){return !!d&&d.type==="主武器"&&!isShieldItem(d)&&(d.weapon_profile?.hands||1)===1}
function offhandEligible(d){return isShieldItem(d)||isOneHandedWeapon(d)}
function canEquipOffhandItem(d){
 const gate=canEquipItem(d);if(!gate.ok)return gate;
 if(!offhandEligible(d))return {ok:false,reason:"副手只能裝備盾牌或單手武器"};
 if(mainIsTwoHanded())return {ok:false,reason:"目前主手為雙手武器，不能同時使用副手"};
 return {ok:true,reason:""}
}
function offhandEquip(){return G.character.weaponSet?.offhand||null}
function equippedEntries(){
 const arr=Object.entries(G.character.equipment||{}).map(([slot,eq])=>({slot,eq})).filter(x=>x.eq);
 if(offhandEquip())arr.push({slot:"副手",eq:offhandEquip()});return arr
}
function mainIsTwoHanded(){
 const d=mainWeaponData();return (d?.weapon_profile?.hands||1)>=2
}
function unequipOffhand(silent=false){
 const eq=offhandEquip();if(!eq)return;
 addItem(eq.id,1,{durability:eq.durability});G.character.weaponSet.offhand=null;
 if(!silent){persist();renderAll();openEquipment()}
}function equipmentCombat(){
 const out={attack:0,magicPower:0,defense:0,magicDefense:0,accuracy:0,evasion:0,critRate:0,critDamage:0,attackSpeed:0,castSpeed:0,blockRate:0,statusResist:0};
 equippedEntries().forEach(({eq})=>{
   const d=item(equipId(eq));if(!d)return;const ratio=(eq.durability??1)/(eq.maxDurability||d.durability||1);
   let scale=ratio<=0?0:ratio<.3?.6:1;if(d.sealed)scale*=.35;
   for(const k of Object.keys(out))out[k]+=(d.combat?.[k]||0)*scale
 });return out
}
function skillCombat(){
 const out={attack:0,magicPower:0,defense:0,magicDefense:0,accuracy:0,evasion:0,critRate:0,critDamage:0,attackSpeed:0,castSpeed:0,blockRate:0,statusResist:0};
 G.character.skills.forEach(s=>{
   if(s.kind==="被動"){
     out.attack+=s.power||0;out.defense+=s.defense||0;out.accuracy+=s.accuracy||0;out.evasion+=s.evasion||0;
     for(const k of ["magicPower","magicDefense","critRate","critDamage","attackSpeed","castSpeed","blockRate","statusResist"])out[k]+=s[k]||0
   }
 });return out
}
function buffCombat(){
 const out={attack:0,magicPower:0,defense:0,magicDefense:0,accuracy:0,evasion:0,critRate:0,critDamage:0,attackSpeed:0,castSpeed:0,blockRate:0,statusResist:0};
 (G.character.buffs||[]).forEach(b=>{for(const k of Object.keys(out))out[k]+=b[k]||0});
 if(G.battle?.active&&G.battle.playerBuff){for(const k of Object.keys(out))out[k]+=G.battle.playerBuff[k]||0}
 return out
}
function battlePercentBuffs(){
 const b=G.battle?.active?G.battle.playerBuffPct:null;
 return {defensePct:Number(b?.defensePct||0),magicDefensePct:Number(b?.magicDefensePct||0)}
}
function raceData(){return by(DB.races,G.character.raceId)||{}}
function raceSubtypeData(){
 if(G.character.raceId!=="R-ORC"||!G.character.raceSubtype)return {};
 return DB.race_system?.beastfolk_subtypes?.[G.character.raceSubtype]||{}
}
function raceCombat(){
 const out={attack:0,magicPower:0,defense:0,magicDefense:0,accuracy:0,evasion:0,critRate:0,critDamage:0,attackSpeed:0,castSpeed:0,blockRate:0,statusResist:0};
 for(const src of [raceData().combat||{},raceSubtypeData().combat||{}])for(const k of Object.keys(out))out[k]+=src[k]||0;
 return out
}
function raceResistances(){
 const out={光明:0,黑暗:0,火:0,風:0,水:0,地:0,雷:0,生命:0,死亡:0};
 for(const [k,v] of Object.entries(raceData().element_resistances||{}))if(k in out)out[k]+=v;
 const tr=talentResistances();for(const k of Object.keys(out))out[k]+=tr[k]||0;
 return out
}
function permanentStat(n){return Math.max(1,(G.character.stats[n]||10)+talentStatBonus(n))}
function statCode(code,effective=true){
 const map={STR:"力量",DEX:"敏捷",CON:"體力",INT:"智力",WIS:"意志",CHA:"魅力",LUK:"幸運"},k=map[code]||code;
 return effective?effectiveStat(k):permanentStat(k)
}
function mainWeaponData(){const eq=G.character.equipment?.主武器;return eq?item(equipId(eq)):null}
function mainWeaponProfile(){
 const d=mainWeaponData();return d?.weapon_profile||{group:"其他",range:1.2,armor_pen_pct:0,required_str:null,required_dex:null}
}
function advancedEquipment(){
 const out={moveSpeed:0,range:0,armorPenPct:0,magicPenPct:0,blockValue:0,poise:0,statusAccuracy:0,lifeSteal:0,healingPower:0,manaRegen:0,hpRegen:0,critResist:0,threat:0,stealth:0,perception:0,carryCapacity:0,initiative:0,blockRate:0};
 equippedEntries().forEach(({eq})=>{
   const d=item(equipId(eq));if(!d)return;const ratio=(eq.durability??1)/(eq.maxDurability||d.durability||1),scale=ratio<=0?0:ratio<.3?.6:1;
   for(const [k,v] of Object.entries(d.advanced_combat||{}))if(k in out)out[k]+=Number(v||0)*scale
 });return out
}
function advancedBuffs(){
 const out={moveSpeed:0,range:0,armorPenPct:0,magicPenPct:0,blockRate:0,blockValue:0,poise:0,statusAccuracy:0,lifeSteal:0,healingPower:0,manaRegen:0,hpRegen:0,critResist:0,threat:0,stealth:0,perception:0,carryCapacity:0,initiative:0};
 for(const b of (G.character.buffs||[])){
   for(const k of Object.keys(out))out[k]+=Number(b[k]||0);
   out.hpRegen+=Number(b.hp_regen||0);out.manaRegen+=Number(b.mana_regen||0)
 }
 if(G.battle?.active&&G.battle.playerBuff)for(const k of Object.keys(out))out[k]+=Number(G.battle.playerBuff[k]||0);
 return out
}
function classCombatAdvanced(){
 const role=cls(G.character.classId)?.combat_role||"",out={initiative:0,moveSpeed:0,blockValue:0,poise:0,statusAccuracy:0,healingPower:0,manaRegen:0,threat:0,stealth:0,perception:0,summonPower:0};
 if(role.includes("防禦")){out.threat+=25;out.blockValue+=7;out.poise+=8}
 if(role.includes("敏捷")){out.initiative+=4;out.stealth+=6}
 if(role.includes("遠程")){out.perception+=5;out.initiative+=2}
 if(role.includes("治療")){out.healingPower+=10;out.manaRegen+=.4}
 if(role.includes("施法")){out.statusAccuracy+=4;out.manaRegen+=.3}
 if(role.includes("支援")){out.summonPower+=5}
 return out
}

function syncBodyScrollLock(){
 const modalOpen=!$("#modalBack")?.classList.contains("hide"),battleOpen=!!G?.battle?.active&&!$("#battleBack")?.classList.contains("hide");
 document.body.classList.toggle("modal-open",!!modalOpen);document.body.classList.toggle("battle-open",!!battleOpen)
}
function abilityPointsEarned(level=G?.character?.level||1){return Math.floor(Math.max(1,level)/5)}
function normalizeAbilityPoints(){
 if(!G?.character)return;const c=G.character;c.spentAbilityPoints=Math.max(0,Number(c.spentAbilityPoints||0));
 const entitled=abilityPointsEarned(c.level);
 c.abilityPoints=Math.max(0,entitled-c.spentAbilityPoints);c.abilityPointEntitlement=entitled
}
function normalizeRevivalState(){
 if(!G?.character)return null;const c=G.character,legacy=c.revival||{};
 const bonus=Math.max(0,Math.floor(Number(legacy.bonus||talentSpecial("revivalCharges")||0))),max=3+bonus;
 const used=Math.max(0,Math.min(max,Math.floor(Number(legacy.used||0))));
 c.revival={base:3,bonus,max,used,remaining:Math.max(0,max-used)};
 return c.revival
}
function spendAbilityPoint(stat){
 normalizeAbilityPoints();if(!DB.ability_point_system?.spend_stats?.includes(stat)||G.character.abilityPoints<=0)return;
 G.character.abilityPoints--;G.character.spentAbilityPoints=(G.character.spentAbilityPoints||0)+1;G.character.stats[stat]=(G.character.stats[stat]||10)+1;
 syncResourceCaps(true);persist();openCharacter()
}
function skillXpThresholds(){return DB.skill_scaling_system?.skill_xp_system?.xp_thresholds||[0,12,30,55,85,120,160,205,255,310]}
function skillXpFromLegacyMastery(s){
 const m=clamp(Number(s?.mastery||0),0,100),old=DB.skill_scaling_system?.mastery_level_thresholds||[0,10,20,30,40,50,60,70,82,94],xp=skillXpThresholds();
 let lv=1;for(let i=1;i<old.length;i++)if(m>=old[i])lv=i+1;
 const i=lv-1;if(i>=9)return xp[9];const lo=old[i]||0,hi=old[i+1]||100,t=(m-lo)/Math.max(1,hi-lo);return Math.round((xp[i]+(xp[i+1]-xp[i])*t)*100)/100
}
function normalizeSkillXp(s){
 if(!s)return 0;const cap=skillXpThresholds().at(-1);
 if(s.skillXp==null)s.skillXp=skillXpFromLegacyMastery(s);
 s.skillXp=clamp(Number.isFinite(Number(s.skillXp))?Number(s.skillXp):0,0,cap);syncSkillMasteryFromXp(s);return s.skillXp
}
function syncSkillMasteryFromXp(s){
 if(!s)return;const xp=skillXpThresholds(),v=Math.max(0,Number(s.skillXp||0));let lv=1;for(let i=1;i<xp.length;i++)if(v>=xp[i])lv=i+1;
 const i=lv-1;if(i>=9){s.mastery=100;return}const lo=xp[i],hi=xp[i+1],old=DB.skill_scaling_system?.mastery_level_thresholds||[0,10,20,30,40,50,60,70,82,94];const t=clamp((v-lo)/Math.max(1,hi-lo),0,1);s.mastery=Math.round(((old[i]||0)+((old[i+1]||100)-(old[i]||0))*t)*100)/100
}
function gainSkillXp(skill,amount,source="技能使用"){
 if(!skill||amount<=0)return;normalizeSkillXp(skill);const before=skillLevel(skill),cap=skillXpThresholds().at(-1);skill.skillXp=clamp(skill.skillXp+Number(amount||0),0,cap);syncSkillMasteryFromXp(skill);const after=skillLevel(skill);
 if(after>before){const msg=`${skill.name}提升至Lv${after}，技能效果增強。`;if(G?.battle?.active)battleLog(msg);else log("技能",msg,"ok")}
 if(source&&source!=="技能使用"&&!G?.battle?.active)log("技能",`${skill.name}獲得${Number(amount).toFixed(amount%1?1:0)}技能XP（${source}）。`)
}
function skillXpProgressText(s){normalizeSkillXp(s);const lv=skillLevel(s),xp=skillXpThresholds();return lv>=10?`${Math.round(s.skillXp)}/${xp[9]} MAX`:`${Math.round(s.skillXp)}/${xp[lv]}`}
function openSkillXpScroll(invIndex){
 const x=G.character.inventory[invIndex],d=item(x?.id);if(!d?.skill_xp)return;const rows=(G.character.skills||[]).map((s,i)=>`<div class="itemrow"><span><b>${s.name}</b> <span class="tier">Lv${skillLevel(s)}</span><br><span class="small">技能XP ${skillXpProgressText(s)}</span></span><button ${skillLevel(s)>=10?"disabled":""} onclick="applySkillXpScroll(${invIndex},${i})">研讀</button></div>`).join("");showModal(d.name,`<div class="card small">選擇一個已學技能，獲得 ${d.skill_xp} 技能XP。</div>${rows}`)
}
function applySkillXpScroll(invIndex,skillIndex){
 const x=G.character.inventory[invIndex],d=item(x?.id),s=G.character.skills?.[skillIndex];if(!d?.skill_xp||!s)return;if(skillLevel(s)>=10){alert("此技能已達Lv10。");return}removeItem(x.id,1,invIndex);gainSkillXp(s,d.skill_xp,d.name);persist();openCharacterSkills()
}
function questObjectiveConsumesItems(q){const o=q?.objective||{};return ["item","gather"].includes(o.kind)&&!!o.item_id&&o.consume_on_turnin!==false}
function inventoryQuantityMap(){
 const quantities=new Map();for(const x of G?.character?.inventory||[])quantities.set(x.id,(quantities.get(x.id)||0)+(x.qty||1));return quantities
}
function syncQuestInventoryProgressOne(q,quiet=true,quantities=null){
 if(!q||!["active","ready"].includes(q.status))return;const o=q.objective||{};if(!["item","gather"].includes(o.kind)||!o.item_id)return;
 const before=q.status,have=quantities?quantities.get(o.item_id)||0:inventoryQty(o.item_id),target=o.target||1;q.progress=Math.min(target,have);q.status=q.progress>=target?"ready":"active";
 if(q.status==="ready"&&before!=="ready"){q.completedHour=totalHours();const grace=q.completionGraceHours??DB.quest_system.report_grace_hours??24;q.reportDeadlineHour=Math.max(q.deadlineHour||totalHours(),totalHours()+grace);if(!quiet)log("委託",`${q.name}：已備妥 ${item(o.item_id)?.name||o.item_id} ×${target}，可前往回報。`,"ok")}
}
function syncAllQuestInventoryProgress(quiet=true){const quantities=inventoryQuantityMap();for(const q of G?.quests||[])syncQuestInventoryProgressOne(q,quiet,quantities)}
function questMarketKey(q){const o=q?.objective||{};if(["item","gather"].includes(o.kind)&&o.item_id)return `item:${o.item_id}`;if(o.kind==="kill")return `kill:${(o.monster_keywords||[]).slice().sort().join("+")}`;return null}
function questMarketRegionId(){return loc(G.character.locationId)?.world_region_id||loc(G.character.locationId)?.region_id||"REG-18"}
function questMarketLedger(){G.worldState=G.worldState||{};G.worldState.questMarketLedger=Array.isArray(G.worldState.questMarketLedger)?G.worldState.questMarketLedger:[];const win=DB.quest_system?.market_demand?.window_hours||120,now=totalHours();G.worldState.questMarketLedger=G.worldState.questMarketLedger.filter(x=>now-x.hour<=win);return G.worldState.questMarketLedger}
function questMarketPressure(q,regionId=questMarketRegionId()){const key=questMarketKey(q);if(!key)return 0;const now=totalHours(),win=DB.quest_system?.market_demand?.window_hours||120;return questMarketLedger().filter(x=>x.regionId===regionId&&x.key===key).reduce((n,x)=>n+(x.qty||1)*Math.max(.25,1-(now-x.hour)/win),0)}
function questMarketFactor(q,regionId=questMarketRegionId()){
 const key=questMarketKey(q);if(!key)return 1;const p=questMarketPressure(q,regionId),steps=DB.quest_system?.market_demand?.pressure_steps||[];for(const s of steps)if(p<=s.max)return s.factor;return 0
}
function questMarketAvailable(q){return questMarketFactor(q)>0}
function adjustedRewardRange(q){const af=affiliationEffects(),f=questMarketFactor(q)*(1+af.quest_reward_pct/100),r=q.reward||[q.rewardSilver||0,q.rewardSilver||0];return [Math.max(1,Math.round(r[0]*f)),Math.max(1,Math.round(r[1]*f)),f]}
function registerQuestMarketCompletion(q){const key=questMarketKey(q);if(!key)return;questMarketLedger().push({hour:totalHours(),regionId:questMarketRegionId(),key,qty:q.objective?.target||1,source:q.sourceType||q.type||"quest"});if(G.worldState.questMarketLedger.length>120)G.worldState.questMarketLedger=G.worldState.questMarketLedger.slice(-120)}
function marketPressureText(q){const f=questMarketFactor(q);return f>=1?"需求正常":f<=0?"市場飽和・暫停發布":`需求轉弱・報酬${Math.round(f*100)}%`}
function regionalItemMarketFactor(d){const rid=questMarketRegionId(),ctx=regionalEconomyContext(rid,loc(G.character.locationId)?.political_entity_id);let f=1;if(d?.regional_origin_id===rid)f*=DB.market_economy_system?.regional_origin_factor||.95;else if(d?.regional_origin_id)f*=DB.market_economy_system?.imported_origin_factor||1.05;const text=[d?.name,d?.material,d?.material_group,d?.type].filter(Boolean).join(" ");if(ctx?.exports?.some(k=>text.includes(k)))f*=.95;if(ctx?.imports?.some(k=>text.includes(k)))f*=1.05;return clamp(f,...(DB.market_economy_system?.price_factor_range||[.8,1.2]))}
function guildBuybackUnitPrice(d){
 const bonus=clamp(talentSpecial("sellBonus"),0,.25),market=Math.max(1,Math.floor((d?.value||1)*.5*(1+bonus)*regionalItemMarketFactor(d)*affiliationPriceMultiplier("sell")));
 return Math.max(1,Math.floor(market*.9))
}
function combatScale(){return Number(globalThis.IJ_COMBAT_SCALE||2)}
function combatScalar(value){const n=Number(value||0);return Math.round(n*combatScale()*100)/100}
function resourceCaps(){
 const str=statCode("STR",false),con=statCode("CON",false),intl=statCode("INT",false),wis=statCode("WIS",false),lv=Math.max(1,G.character.level||1);
 const r=raceData(),o=org(G.character.originId);
 return {
   hp:combatScalar(Math.max(1,Math.round(16+con*1.2+(lv-1)*2))),
   stamina:combatScalar(Math.max(1,Math.round(12+con*.6+str*.4+(lv-1)*.8))),
   mana:combatScalar(Math.max(0,Math.round(9+intl+wis*.5+(lv-1)*.7+talentSpecial("maxMana")))),
   carry:Math.max(20,Math.round((30+str*1.4+con*.6+(r?.weight_mod||0)+(o?.weight_mod||0)+talentSpecial("carryCapacity"))*10)/10)
 }
}

function syncResourceCaps(preserve=true){
 const c=G.character,caps=resourceCaps(),hr=c.maxHp?c.hp/c.maxHp:1,sr=c.maxStamina?c.stamina/c.maxStamina:1,mr=c.maxMana?c.mana/c.maxMana:1;
 c.maxHp=caps.hp;c.maxStamina=caps.stamina;c.maxMana=caps.mana;c.weightCap=caps.carry;
 c.hp=preserve?clamp(Math.round(c.maxHp*hr),0,c.maxHp):c.maxHp;
 c.stamina=preserve?clamp(Math.round(c.maxStamina*sr),0,c.maxStamina):c.maxStamina;
 c.mana=preserve?clamp(Math.round(c.maxMana*mr),0,c.maxMana):c.maxMana
}
function elementalResistances(){
 const out={光明:0,黑暗:0,火:0,風:0,水:0,地:0,雷:0,生命:0,死亡:0};
 for(const [k,v] of Object.entries(raceResistances()))if(k in out)out[k]+=Number(v||0);
 for(const {eq} of equippedEntries()){if(!eq)continue;const d=item(equipId(eq));for(const [k,v] of Object.entries(d?.element_resistances||{}))if(k in out)out[k]+=Number(v||0)}
 for(const b of (G.character.buffs||[]))for(const [k,v] of Object.entries(b.element_resistances||{}))if(k in out)out[k]+=Number(v||0);
 return out
}
function poisonResistance(){return clamp(combatStats().statusResist+talentSpecial("poisonResist"),0,95)}
function combatStats(){
 const e=equipmentCombat(),s=skillCombat(),b=buffCombat(),bp=battlePercentBuffs(),af=affiliationEffects(),r=raceCombat(),t=talentCombat(),ae=advancedEquipment(),ab=advancedBuffs(),ca=classCombatAdvanced(),wp=mainWeaponProfile();
 const str=effectiveStat("力量"),dex=effectiveStat("敏捷"),con=effectiveStat("體力"),intl=effectiveStat("智力"),wis=effectiveStat("意志"),cha=effectiveStat("魅力"),luck=effectiveStat("幸運");
 const cc=cls(G.character.classId),role=cc?.combat_role||"",group=wp.group;
 let atkBase;
 if(["弓","弩","投擲"].includes(group))atkBase=3+dex*1.05+str*.30;
 else if(group==="匕首")atkBase=3+dex*.72+str*.58;
 else if(group==="徒手")atkBase=3+dex*.55+str*.72;
 else atkBase=3+str*1.05+dex*.20;
 let magicBase;
 if(role.includes("治療")||/牧師|神官|祭司|聖職/.test(cc?.name||""))magicBase=2+wis*.95+intl*.45;
 else if(/吟遊|舞者/.test(cc?.name||""))magicBase=2+cha*.82+intl*.38+wis*.20;
 else magicBase=2+intl*1.05+wis*.30;
 const attackSpeed=clamp((.82+dex*.012+e.attackSpeed+s.attackSpeed+b.attackSpeed+r.attackSpeed+t.attackSpeed)*(1+af.attack_speed_pct/100),.55,2.5);
 const castSpeed=clamp((.78+intl*.009+wis*.008+e.castSpeed+s.castSpeed+b.castSpeed+r.castSpeed+t.castSpeed)*(1+af.cast_speed_pct/100),.55,2.5);
 const carry=resourceCaps().carry+ae.carryCapacity+ab.carryCapacity+af.carryCapacity;
 const loadRatio=carry>0?calcWeight()/carry:0,overloadMove=loadRatio>1?Math.min(35,(loadRatio-1)*50):0;
 const blockRate=clamp(Math.round(2+con*.18+e.blockRate+s.blockRate+b.blockRate+r.blockRate+t.blockRate+(ae.blockRate||0)+af.blockRate),0,75);
 const cs={
   attack:Math.round((atkBase+e.attack+s.attack+b.attack+r.attack+t.attack)*(1+af.attack_pct/100)),
   magicPower:Math.round((magicBase+e.magicPower+s.magicPower+b.magicPower+r.magicPower+t.magicPower)*(1+af.magic_attack_pct/100)),
   defense:Math.round((2+con*.78+str*.18+e.defense+s.defense+b.defense+r.defense+t.defense)*(1+bp.defensePct/100)*(1+af.defense_pct/100)),
   magicDefense:Math.round((2+wis*.82+con*.26+e.magicDefense+s.magicDefense+b.magicDefense+r.magicDefense+t.magicDefense)*(1+bp.magicDefensePct/100)*(1+af.magic_defense_pct/100)),
   accuracy:clamp(Math.round(50+dex*1.6+luck*.2+e.accuracy+s.accuracy+b.accuracy+r.accuracy+t.accuracy+af.accuracy),5,99),
   evasion:clamp(Math.round(2+dex*.65+luck*.20+e.evasion+s.evasion+b.evasion+r.evasion+t.evasion+af.evasion),0,80),
   critRate:clamp(Math.round(2+luck*.5+dex*.10+e.critRate+s.critRate+b.critRate+r.critRate+t.critRate+af.critRate),0,75),
   critDamage:clamp(Math.round(145+str*.25+dex*.20+intl*.10+e.critDamage+s.critDamage+b.critDamage+r.critDamage+t.critDamage+af.critDamage),125,300),
   initiative:Math.round((5+dex*1.35+luck*.35+(attackSpeed-1)*10+ae.initiative+ab.initiative+ca.initiative+talentSpecial("initiative"))*(1+af.initiative_pct/100)),
   moveSpeed:Math.round(clamp(100+dex*1.35+ae.moveSpeed+ab.moveSpeed+ca.moveSpeed+talentSpecial("moveSpeed")+af.moveSpeed-overloadMove,55,180)),
   attackSpeed,castSpeed,
   range:Math.round((Math.max(.8,wp.range+ae.range+ab.range))*10)/10,
   armorPenPct:Math.round(clamp((wp.armor_pen_pct||0)+str*.12+ae.armorPenPct+ab.armorPenPct+talentSpecial("armorPierce")+af.armorPenPct,0,60)*10)/10,
   magicPenPct:Math.round(clamp(intl*.10+wis*.06+ae.magicPenPct+ab.magicPenPct+talentSpecial("magicPierce")+af.magicPenPct,0,60)*10)/10,
   blockRate,
   blockValue:Math.round(clamp(20+con*.7+ae.blockValue+ab.blockValue+ca.blockValue+talentSpecial("blockValue"),10,80)),
   poise:Math.round(10+con*1.1+str*.35+ae.poise+ab.poise+ca.poise+talentSpecial("poise")),
   statusAccuracy:Math.round(clamp(5+wis*.65+intl*.35+luck*.2+ae.statusAccuracy+ab.statusAccuracy+ca.statusAccuracy+talentSpecial("statusAccuracy")+af.statusAccuracy,0,95)),
   statusResist:clamp(Math.round(5+wis*1.0+con*.45+e.statusResist+s.statusResist+b.statusResist+r.statusResist+t.statusResist+af.statusResist),0,90),
   lifeSteal:Math.round(clamp(talentSpecial("lifeSteal")*100+ae.lifeSteal+ab.lifeSteal+(G.battle?.weaponOil?.lifeSteal||0)*100,0,50)*10)/10,
   healingPower:Math.round(clamp(100+wis*1.2+intl*.35+talentSpecial("healingBonus")*100+ae.healingPower+ab.healingPower+ca.healingPower+af.healingPower,70,250)),
   manaRegen:Math.round((.5+wis*.10+intl*.03+ae.manaRegen+ab.manaRegen+ca.manaRegen+talentSpecial("manaRegen")+af.manaRegen)*100)/100,
   hpRegen:Math.round((.15+con*.04+talentSpecial("hpRegenPerHour")+ae.hpRegen+ab.hpRegen)*100)/100,
   critResist:Math.round(clamp(con*.20+wis*.15+ae.critResist+ab.critResist+talentSpecial("critResist"),0,60)*10)/10,
   threat:Math.round(100+con*1.4+str*.4+ae.threat+ab.threat+ca.threat+talentSpecial("threat")),
   stealth:Math.round(clamp(20+dex*1.4+luck*.3+ae.stealth+ab.stealth+ca.stealth+talentSpecial("stealth")+af.stealth,0,150)),
   perception:Math.round(clamp(20+wis*1.5+dex*.4+luck*.2+ae.perception+ab.perception+ca.perception+talentSpecial("perception")+af.perception,0,160)),
   carryCapacity:Math.round(carry*10)/10,
   summonPower:Math.round(10+cha*1.4+wis*.4+intl*.3+(ca.summonPower||0)+af.summonPower),
   lootRate:Math.round(clamp(100+luck*1.5+af.lootRate,100,200)),
   rareEventRate:Math.round(clamp(.5+luck*.15,1,20)*10)/10
 };
 for(const k of ["attack","magicPower","defense","magicDefense","manaRegen","hpRegen"])cs[k]=combatScalar(cs[k]);
 const statusIds=new Set((G.character.statusEffects||[]).map(x=>x?.id||x));
 if(statusIds.has("slow")){
   cs.accuracy=clamp(cs.accuracy-5,5,99);cs.evasion=clamp(cs.evasion-5,0,80);
   cs.initiative=Math.round(cs.initiative*.8);cs.moveSpeed=Math.round(clamp(cs.moveSpeed-15,55,180))
 }
 if(statusIds.has("blind"))cs.accuracy=clamp(cs.accuracy-20,5,99);
 if(statusIds.has("curse"))for(const k of ["attack","magicPower","defense","magicDefense"])cs[k]=Math.max(0,Math.round(cs[k]*.85));
 return cs
}
function calcWeight(){
 let w=0;G.character.inventory.forEach(x=>{const d=item(x.id);if(d)w+=d.weight*(x.qty||1)});
 equippedEntries().forEach(({eq})=>{const d=item(equipId(eq));if(d)w+=d.weight});
 return Math.round(w*10)/10
}
function addItem(id,q=1,extra={}){
 const d=item(id),isEq=d&&["主武器","頭盔","盔甲","手套","鞋子","披風","飾品"].includes(d.type);
 if(isEq){for(let i=0;i<q;i++)G.character.inventory.push({id,qty:1,durability:extra.durability??d.durability,maxDurability:d.durability,acquiredHour:totalHours()});return}
 let x=G.character.inventory.find(v=>v.id===id&&!v.durability);if(!x){x={id,qty:0,acquiredHour:totalHours()};G.character.inventory.push(x)}x.qty+=q;
 if(extra.skipQuestProgress!==true)updateQuestProgress("item",{item_id:id,qty:q})
}
function removeItem(id,q=1,index=null){if(index!==null){const x=G.character.inventory[index];if(!x||x.id!==id)return false;if((x.qty||1)<=q)G.character.inventory.splice(index,1);else x.qty-=q;return true}let x=G.character.inventory.find(v=>v.id===id&&(v.qty||0)>0);if(!x)return false;if((x.qty||1)<=q)G.character.inventory.splice(G.character.inventory.indexOf(x),1);else x.qty-=q;return true}
function stripHtmlText(v){
 const temp=document.createElement("div");temp.innerHTML=String(v??"");return (temp.textContent||temp.innerText||"").trim()
}
function locationNarrative(){
 const l=loc(G.character.locationId);
 const place=l?.description||l?.desc||l?.flavor||"";
 const facility=G.character.currentFacility?DB.facilities[G.character.currentFacility]?.name:null;
 const context=facility?`目前位於${l.name}的${facility}。`:`目前位於${l.name}。`;
 return place?`${context} ${place}`:context
}
function latestNarrativeEntry(){
 const h=(G?.history||[]).at(-1);
 if(!h)return locationNarrative();
 const text=stripHtmlText(h.text||"");
 return text?`${h.tag?`【${h.tag}】`:""}${text}`:locationNarrative()
}
function renderNarrative(){renderHistoryLog()}

function renderHistoryLog(force=false){
 const el=$("#log");if(!el||!G)return;
 if(!force&&el.dataset.historyVersion===String((G.history||[]).length))return;
 const history=(G.history||[]).slice(-HISTORY_DISPLAY_LIMIT);
 el.innerHTML=history.map(h=>`<div class="entry ${h.className||""}"><span class="badge">${h.tag||"旅誌"}</span> ${h.html||String(h.text||"")}<div class="entrymeta small">${h.time||""}${h.turn!=null?`｜T${h.turn}`:""}</div></div>`).join("");
 el.dataset.historyVersion=String((G.history||[]).length);
 el.scrollTop=el.scrollHeight;
}
function ensureActionsVisible(){
 const sec=$("#playSection");if(!sec||!G)return;
 // If the action section is partly hidden under the fixed bottom navigation, lift it into view.
 if(typeof sec.getBoundingClientRect!=="function")return;
 const r=sec.getBoundingClientRect(),nav=$("#fixedNav"),navRect=nav&&typeof nav.getBoundingClientRect==="function"?nav.getBoundingClientRect():null;
 const bottomLimit=navRect&&navRect.top>0?navRect.top:window.innerHeight-82;
 if(r.bottom>bottomLimit+2||r.top<0){
   sec.scrollIntoView({block:"nearest",behavior:"smooth"})
 }
}
function log(tag,msg,cl=""){
 const el=$("#log"),plain=stripHtmlText(msg);
 if(G)G.history=retainRecentHistory(G.history,{turn:G.turn,time:timeText(),tag,text:plain,html:String(msg),className:cl||""});
 if(el){
   const d=document.createElement("div");d.className="entry "+cl;
   d.innerHTML=`<span class="badge">${tag}</span> ${msg}<div class="entrymeta small">${timeText()}｜T${G?.turn??0}</div>`;
   el.appendChild(d);trimHistoryLog(el);el.dataset.historyVersion=String((G?.history||[]).length);el.scrollTop=el.scrollHeight
 }
}
function resourceCard(kind,label,value,max,percent){
 const p=clamp(Number(percent||0),0,100),sev=p>=90?"danger":p>=70?"warning":"";
 return `<div class="resource-card ${kind} ${sev}"><div class="resource-name">${label}</div><div class="resource-value">${value}</div><div class="resource-track"><i style="width:${p}%"></i></div></div>`
}
function renderAll(){
 if(!G)return;syncBodyScrollLock();normalizeAbilityPoints();normalizeRevivalState();syncAllQuestInventoryProgress(true);
 const c=G.character,cs=combatStats(),weight=calcWeight(),hpPct=c.maxHp?c.hp/c.maxHp*100:0,spPct=c.maxStamina?c.stamina/c.maxStamina*100:0,mpPct=c.maxMana?c.mana/c.maxMana*100:0;
 setUIText($("#timeTop"),timeText());setUIText($("#turnTop"),G.turn);
 const here=loc(c.locationId);setUIHTML($("#locTop"),`<span class="loc-main">${here.name} <span class="tier">${here.tier}</span>｜安全${locationSafety(here)}/100 ${safetyLabel(here)}</span>`);
 setUIText($("#moneyTop"),"");
 const topStateText=c.alive?`${c.name}｜Lv${c.level}｜XP ${c.level>=99?"MAX":`${c.xp||0}/${xpToNext(c.level)}`}｜職業 ${(c.classMastery||0).toFixed(0)}%`:"角色已死亡",topState=$("#topState");
 setUIText(topState,topStateText);topState.title=topStateText;
 setUIHTML($("#statusSummary"),`<div class="resource-grid">
   ${resourceCard("hp","HP",`${Math.round(c.hp)}/${c.maxHp}`,c.maxHp,hpPct)}
   ${resourceCard("sp","SP",`${Math.round(c.stamina)}/${c.maxStamina}`,c.maxStamina,spPct)}
   ${resourceCard("mp","MP",`${Math.round(c.mana)}/${c.maxMana}`,c.maxMana,mpPct)}
   ${resourceCard("hunger","飢餓",`${Math.round(c.hunger)}%`,100,c.hunger)}
   ${resourceCard("fatigue","疲勞",`${Math.round(c.fatigue)}%`,100,c.fatigue)}
   ${resourceCard("thirst","口渴",`${Math.round(c.thirst)}%`,100,c.thirst)}
 </div>
 ${c.conditions.length?`<div class="condition-strip">${c.conditions.join("｜")}</div>`:""}
 <div class="hud-foot"><span>先攻 ${cs.initiative}｜移速 ${cs.moveSpeed}</span><span>負重 ${weight}/${cs.carryCapacity}kg</span></div>
 <div class="hud-silver">銀幣 <b>${Number(c.moneySilver||0)}</b></div>`);
 renderActions();renderHistoryLog();if(G.battle?.active)renderBattle(cs);else{$("#battleBack")?.classList.add("hide");closeBattleSkillPopup();syncBodyScrollLock()}
}

function renderActions(){
 const l=loc(G.character.locationId),box=$("#actionButtons"),rev=normalizeRevivalState(),signature=[l.id,l.kind,G.character.alive,rev?.remaining,!!G.pendingAdventureEvent,!!G.pendingPartyOpportunity,!!G.pendingPetOpportunity].join("|");
 if(box.dataset.actionSignature===signature)return;box.dataset.actionSignature=signature;box.innerHTML="";
 const add=(t,f,cl="")=>box.insertAdjacentHTML("beforeend",`<button type="button" class="${cl}" onclick="${f}">${t}</button>`);
 if(!G.character.alive){if(rev?.remaining>0)add(`復活（剩餘 ${rev.remaining} 次）`,`reviveAtChurch()`,`good`);else box.insertAdjacentHTML("beforeend",`<button type="button" disabled>復活次數已用盡</button>`);return}
 if(G.pendingAdventureEvent)add("處理目前奇遇","openPendingAdventureEvent()","warn");if(G.pendingPartyOpportunity)add("處理隊友奇遇","openPendingPartyOpportunity()","warn");if(G.pendingPetOpportunity)add("處理寵物機緣","resolvePetOpportunity(false)","warn");
 if(l.kind==="town"){
   add("探索所在地","actExplore()","good");add("自主訓練","openTraining()");add("料理","openCooking()");add("移動","openMap()")
 }else{
   add("探索","actExplore()","good");add("採集","actGather()");add("打獵","actHunt()");add("野外休息","openRestChoice()");add("料理","openCooking()");add("自主訓練","openTraining()");add("移動","openMap()")
 }
 if(typeof requestAnimationFrame==="function")requestAnimationFrame(()=>ensureActionsVisible())
}
function checkRoll(stat,tag){
 const r=rollD20(),cs=combatStats(),sense=["探索","打獵","釣魚","採集"].includes(tag)?Math.floor((cs.perception-35)/20):0;
 const bonus=talentActionBonus(tag)+sense,mod=Math.floor((effectiveStat(stat)-10)/2)+survivalPenalty()+bonus,total=r+mod;
 log("D20",`${tag}：${r}${mod>=0?"+":""}${mod}＝<b>${total}</b>${bonus?`（天賦/感知${bonus>=0?"+":""}${bonus}）`:""}。`);return total
}
function degradeEquipment(){
 const red=clamp(talentSubjobBonus("SJ-REPAIR","durabilityLossReduction"),0,.5);
 for(const {slot,eq} of equippedEntries()){
   let loss=slot==="主武器"?1+rand(3):rand(2);if(slot==="副手")loss=rand(2);
   if(loss>0&&red>0&&Math.random()<red)loss=Math.max(0,loss-1);
   eq.durability=clamp(eq.durability-loss,0,eq.maxDurability)
 }
}

function monsterEcology(m){
 return m?.ecology_profile||{body_scale:"medium",tags:[]}
}
function monsterFitsLocationEcology(m,l){
 if(!m||!l)return false;
 const p=l.encounter_profile||{},e=monsterEcology(m),tags=new Set(e.tags||[]);
 const ar=p.archetype||(l.kind==="wild"?"open_wild":"artificial_ruin");
 const space=p.space_class||(l.kind==="wild"?"open":"standard");
 const scaleOrder={small:0,medium:1,large:2,huge:3};
 const maxScale={cramped:"medium",standard:"large",large:"huge",open:"huge"}[space]||"large";

 if((scaleOrder[e.body_scale]??1)>(scaleOrder[maxScale]??2))return false;
 if(tags.has("aquatic")&&!p.allow_aquatic)return false;
 if(tags.has("undead")&&!p.allow_undead)return false;
 if(tags.has("mounted")&&!["large","open"].includes(space))return false;
 if(tags.has("giant")&&!["large","open"].includes(space))return false;

 if(tags.has("dragonkin")&&l.kind==="dungeon"&&!["natural_cave","natural_water_cave","swamp_ruin"].includes(ar))return false;

 const artificial=["artificial_cellar","waterway_ruin","mine","tomb","shrine_ruin","artificial_ruin","fortress_basement"];
 if(artificial.includes(ar)){
   if(tags.has("large_wildlife"))return false;
   if(tags.has("wildlife")&&!tags.has("small_intruder"))return false;
 }

 if(["artificial_cellar","waterway_ruin","fortress_basement"].includes(ar)&&tags.has("fey_plant"))return false;
 if(["mine","tomb","fortress_basement"].includes(ar)&&tags.has("fey_plant"))return false;
 if(ar==="tomb"&&tags.has("elemental"))return false;

 if(ar==="artificial_cellar"){
   const allowed=["small_intruder","humanoid_squatter","slime","invertebrate","construct"];
   if(!allowed.some(x=>tags.has(x)))return false;
 }
 if(ar==="waterway_ruin"){
   const allowed=["small_intruder","humanoid_squatter","slime","invertebrate","aquatic","construct"];
   if(!allowed.some(x=>tags.has(x)))return false;
 }
 if(ar==="mine"){
   const allowed=["small_intruder","humanoid_squatter","slime","invertebrate","elemental","construct"];
   if(!allowed.some(x=>tags.has(x)))return false;
 }
 if(ar==="tomb"){
   const allowed=["small_intruder","humanoid_squatter","slime","invertebrate","undead","construct"];
   if(!allowed.some(x=>tags.has(x)))return false;
 }
 if(["shrine_ruin","artificial_ruin","fortress_basement"].includes(ar)){
   const allowed=["small_intruder","humanoid_squatter","slime","invertebrate","undead","elemental","construct","magical"];
   if(!allowed.some(x=>tags.has(x)))return false;
 }
 return true
}
function encounterWeightForLocation(m,l){
 let w=Math.max(.01,Number(m?.encounter_weight||1));
 const p=l?.encounter_profile||{},tags=new Set(monsterEcology(m).tags||[]),ar=p.archetype||"open_wild";
 if((p.preferred_monster_ids||[]).includes(m.id))w*=2.4;
 if(ar==="artificial_cellar"){
   if(tags.has("small_intruder"))w*=1.35;
   if(tags.has("humanoid_squatter"))w*=1.1;
 }
 if(ar==="tomb"&&tags.has("undead"))w*=2;
 if(ar==="mine"){
   if(tags.has("humanoid_squatter")||tags.has("small_intruder"))w*=1.25;
   if(tags.has("elemental"))w*=.75;
 }
 if(ar==="waterway_ruin"&&tags.has("aquatic"))w*=1.35;
 if(ar==="natural_burrow"&&tags.has("wildlife"))w*=1.5;
 return Math.max(.01,w)
}
function encounterCandidates(l){
 if(!l||!["wild","dungeon"].includes(l.kind))return [];
 if(ENCOUNTER_CACHE.has(l.id))return ENCOUNTER_CACHE.get(l.id);
 const p=l.encounter_profile||{},tags=l.encounter_tags||[],maxTier=tierOrder(p.max_tier||l.tier);
 const out=DB.monsters.filter(m=>{
   if(m.encounter_enabled===false||m.domestic)return false;
   if(tierOrder(m.tier)>maxTier)return false;
   if(!(m.habitats||[]).some(h=>tags.includes(h)))return false;
   if(p.zone==="town_outskirts"&&!m.near_town_eligible)return false;
   if(m.category==="元素植物魔法生物系"&&!p.allow_magical_ecology)return false;
   if(m.category==="惡魔與深淵地獄系"&&!p.allow_demons)return false;
   if(p.zone==="town_outskirts"&&["龍與亞龍爬蟲系","不死系","元素植物魔法生物系","惡魔與深淵地獄系"].includes(m.category))return false;
   if(!monsterFitsLocationEcology(m,l))return false;
   return true
 });
 ENCOUNTER_CACHE.set(l.id,out);return out
}
function activeKillQuestTargets(l,pool){
 const out=[];
 for(const q of (G.quests||[])){
   if(q.status!=="active"||q.objective?.kind!=="kill")continue;
   const valid=q.viableLocationIds||questViableLocations(questTemplate(q.templateId)||q);
   if(valid.length&&!valid.includes(l.id))continue;
   const keys=q.objective.monster_keywords||[],matched=pool.filter(m=>keys.some(k=>m.name.includes(k)));
   if(matched.length){
     const chance=q.target_spawn_boost??questTemplate(q.templateId)?.target_spawn_boost??DB.quest_system.target_information_bonus.kill_target_encounter_chance;
     out.push(...matched.map(m=>[m,chance]))
   }
 }
 return out
}
function locationSafety(l){return clamp(Number(l?.safety_score??70),0,100)}
function safetyLabel(l){return l?.safety_label||"未知"}
function encounterChanceForLocation(l,context="探索"){
 if(!l||!["wild","dungeon"].includes(l.kind))return 0;
 const score=locationSafety(l),risk=(100-score)/100,zone=l.encounter_profile?.zone||"town_outskirts";
 const base={town_outskirts:.03,frontier:.05,deep_wild:.07,dungeon:.08}[zone]??.04;
 const factor={town_outskirts:.22,frontier:.32,deep_wild:.38,dungeon:.45}[zone]??.28;
 const ctx=DB.map_safety_system?.context_modifiers?.[context]??0;
 return clamp(base+risk*factor+ctx,.02,.68)
}
function maybeEncounter(context){
 const l=loc(G.character.locationId),cs=combatStats();
 const stealthCut=clamp((cs.stealth-30)/250,0,.22),baseChance=encounterChanceForLocation(l,context),finalChance=baseChance*(1-stealthCut);
 if(!["wild","dungeon"].includes(l.kind)||Math.random()>finalChance)return false;
 const pool=encounterCandidates(l);
 if(!pool.length){log("遭遇","此地目前沒有符合層級與生態條件的敵對生物。");return false}
 const questTargets=activeKillQuestTargets(l,pool);let chosen=null;
 if(questTargets.length){const maxBoost=Math.max(...questTargets.map(x=>x[1]||0));if(Math.random()<maxBoost)chosen=questTargets[rand(questTargets.length)][0]}
 if(!chosen)chosen=weightedPick(pool.map(m=>[m,encounterWeightForLocation(m,l)]));
 log("安全度",`${l.name}安全度 ${locationSafety(l)}/100（${safetyLabel(l)}），本次${context}敵對遭遇基礎機率約${Math.round(baseChance*100)}%。`);
 startBattle(chosen,context);return true
}
function playerAdventureTier(){
 const lv=G.character.level||1;
 if(lv>=90)return "S";if(lv>=70)return "A";if(lv>=50)return "B";if(lv>=35)return "C";if(lv>=20)return "D";if(lv>=8)return "E";return "F"
}
function adventureEventMoneyCap(l=loc(G.character.locationId)){
 return Math.min(12,3+tierOrder(l.tier)*2+Math.floor((G.character.level||1)/10)*2)
}
function adventureEventCandidates(l){
 const maxTier=Math.min(tierOrder(l.tier),tierOrder(playerAdventureTier()));
 const zone=l.encounter_profile?.zone||"town_outskirts";
 return (DB.adventure_event_templates||[]).filter(e=>
   tierOrder(e.tier)<=maxTier &&
   (!(e.location_ids||[]).length||(e.location_ids||[]).includes(l.id)) &&
   (e.kinds||[]).includes(l.kind) &&
   (!(e.zones||[]).length||(e.zones||[]).includes(zone))
 )
}
function generateAdventureEvent(context){
 const l=loc(G.character.locationId),sys=DB.adventure_event_system;
 if(!sys||G.pendingAdventureEvent||!sys.trigger_contexts.includes(context))return null;
 const last=G.worldState.lastAdventureEventTurn??-999;
 if(G.turn-last<sys.cooldown_turns)return null;
 const base=sys.base_chance[context]??.04,luck=(combatStats().rareEventRate||1)/sys.luck_divisor;
 if(Math.random()>clamp(base+luck,.02,.14))return null;
 const pool=adventureEventCandidates(l);if(!pool.length)return null;
 const template=pool[rand(pool.length)];
 const ev={id:`AE-RUN-${G.turn}-${rand(9999)}`,templateId:template.id,name:template.name,tier:template.tier,locationId:l.id,context,createdTurn:G.turn};
 G.pendingAdventureEvent=ev;G.worldState.lastAdventureEventTurn=G.turn;persist();return ev
}
function adventureEventTemplate(ev=G.pendingAdventureEvent){return ev?(IDX.adventureEvent.get(ev.templateId)||null):null}
function openPendingAdventureEvent(){
 const ev=G.pendingAdventureEvent,t=adventureEventTemplate(ev);if(!ev||!t)return;
 const l=loc(ev.locationId),cap=adventureEventMoneyCap(l);
 showModal(`奇遇・${t.name}`,`<div class="card"><b>${l.name}</b> <span class="tier">${t.tier}</span>｜安全度${locationSafety(l)}/100（${safetyLabel(l)}）<br><span class="small">${t.text}</span></div>
 <div class="card small">這類奇遇受角色等級、地圖層級與獎勵上限控制；本地小額銀幣上限約${cap}銀，不會直接給C級以上裝備。</div>
 <div class="actions"><button class="good" onclick="resolveAdventureEvent('engage')">介入／調查</button><button onclick="resolveAdventureEvent('leave')">離開</button></div>`)
}
function validAdventureRewardItem(id,l){
 const d=item(id);if(!d)return false;
 if(["主武器","頭盔","盔甲","手套","鞋子","披風","飾品"].includes(d.type))return false;
 return tierOrder(d.tier)<=Math.min(tierOrder(l.tier),tierOrder("E"))
}
function applyAdventureEventReward(t){
 const l=loc(G.character.locationId),r=t.reward||{},parts=[];
 if(r.money){
   const cap=adventureEventMoneyCap(l),amt=Math.min(cap,randomInt(r.money[0],r.money[1]));
   if(amt>0){G.character.moneySilver+=amt;parts.push(`${amt}銀`)}
 }
 if(r.item_pool?.length){
   const pool=r.item_pool.filter(id=>validAdventureRewardItem(id,l));
   if(pool.length){
     const id=pool[rand(pool.length)],range=r.item_qty||[1,1],q=Math.max(1,Math.min(2,randomInt(range[0],range[1])));
     addItem(id,q);parts.push(`${item(id).name}×${q}`)
   }
 }
 if(r.reputation){G.character.guildReputation=(G.character.guildReputation||0)+r.reputation;parts.push(`公會信用+${r.reputation}`)}
 if(r.event_clock){G.worldState.eventClock=(G.worldState.eventClock||0)+r.event_clock;parts.push("取得一條地方線索")}
 if(r.thirst_relief){G.character.thirst=clamp(G.character.thirst-r.thirst_relief,0,120);parts.push(`口渴-${r.thirst_relief}`)}
 if(r.mastery_gain||r.skill_xp_gain){
   const learnable=(G.character.skills||[]).filter(s=>skillLevel(s)<10);
   if(learnable.length){const s=learnable[rand(learnable.length)],gain=r.skill_xp_gain||Math.max(3,Math.round(r.mastery_gain*10));gainSkillXp(s,gain,r.skill_xp_gain?"大師指導":"冒險心得");parts.push(`${s.name}技能XP+${gain}`)}
 }
 return parts
}
function resolveAdventureEvent(choice){
 const ev=G.pendingAdventureEvent,t=adventureEventTemplate(ev);if(!ev||!t)return;
 if(choice==="leave"){
   log("奇遇",`${t.name}：你選擇不介入，事件沒有進一步發展。`);G.pendingAdventureEvent=null;closeModal();persist();renderAll();return
 }
 const roll=rollD20(),mod=Math.floor((effectiveStat(t.stat)-10)/2)+survivalPenalty(),total=roll+mod,success=total>=t.dc;
 let parts=[];
 if(success){parts=applyAdventureEventReward(t);log("奇遇",`${t.name}：D20 ${roll}${mod>=0?"+":""}${mod}=${total}，成功。${t.success}${parts.length?` 獲得：${parts.join("、")}。`:""}`,"ok")}
 else{
   const f=t.failure||{};if(f.fatigue)G.character.fatigue=clamp(G.character.fatigue+f.fatigue,0,120);
   log("奇遇",`${t.name}：D20 ${roll}${mod>=0?"+":""}${mod}=${total}，未達DC${t.dc}。${t.fail}${f.fatigue?` 疲勞+${f.fatigue}。`:""}`)
 }
 emitIntegratedEvent("adventure_event","location",ev.locationId,`${t.name}：${success?"成功處理":"未成功處理"}`,{templateId:t.id,success});G.pendingAdventureEvent=null;applySurvival();closeModal();persist();renderAll()
}
function maybeAdventureEvent(context){
 const ev=generateAdventureEvent(context);if(!ev)return false;
 log("奇遇",`在${loc(ev.locationId).name}發生「${ev.name}」。你需要決定是否介入。`,"ok");
 openPendingAdventureEvent();return true
}
function actExplore(){
 if(!beginTurn("探索"))return;
 const l=loc(G.character.locationId),results=l.explore||[["街巷",1]],r=weightedPick(results),t=checkRoll(l.kind==="town"?"魅力":"敏捷","探索");
 log("探索",`${l.name}［${l.tier}］：${r}。${t>=14?"取得較完整資訊。":"只得到片段資訊。"}`,t>=14?"ok":"");
 recordExplorationIntel(l.id,r,t);
 const rid=l.world_region_id||l.region_id;
 if(rid&&Math.random()<0.14){
   const fp=regionalFolkloreFor(rid),hp=localHistoryFor(rid),pool=[
     ...fp.map(x=>`民俗線索「${x.title}」：${x.text}`),
     ...hp.map(x=>`舊跡線索「${x.title}」：${x.summary}`)
   ];
   if(pool.length)recordExplorationIntel(l.id,pool[rand(pool.length)],Math.max(10,t));
 }
 updateQuestProgress("action",{action:"探索",location_id:l.id});
 updateQuestProgress("patrol",{location_id:l.id});
 const battled=maybeEncounter("探索");
 let evented=false;if(!battled)evented=maybeAdventureEvent("探索");
 let peted=false;if(!battled&&!evented)peted=maybePetOpportunity();
 let socialed=false;if(!battled&&!evented&&!peted)socialed=maybePartySocialEvent("探索");
 if(!battled&&!evented&&!peted&&!socialed)maybeOrganizationEncounter("探索");
 endTurn(l.kind==="town"?.8:1.4)
}
function hasTool(effect){return G.character.inventory.some(x=>item(x.id)?.tool_effect===effect)}
function gatherResourceIds(l){
 const raw=l?.gather;
 if(Array.isArray(raw))return raw.filter(id=>typeof id==="string"&&id.trim()).map(id=>id.trim());
 if(typeof raw==="string")return raw.split(/[,，;；|\s]+/).map(id=>id.trim()).filter(Boolean);
 return []
}
function gatherEligiblePool(l){
 if(!l)return [];
 const out=[];
 for(const id of gatherResourceIds(l)){
   const d=item(id);if(!d||!d.wild_gather_eligible)continue;
   const src=Array.isArray(d.acquisition_sources)?d.acquisition_sources:[];
   if(src.includes("mining")&&!hasTool("mining"))continue;
   if(src.includes("woodcut")&&!hasTool("woodcut"))continue;
   out.push(id)
 }
 return out
}
function activeGatherTarget(l,pool){
 if(!l||!Array.isArray(pool)||!Array.isArray(G?.quests))return null;
 for(const q of G.quests){
   if(q?.status!=="active"||q.objective?.kind!=="gather")continue;
   const template=questTemplate(q.templateId)||q;
   let valid=Array.isArray(q.viableLocationIds)?q.viableLocationIds:null;
   if(!valid){try{valid=questViableLocations(template)}catch{valid=[]}}
   if(!Array.isArray(valid))valid=[];
   if(valid.length&&!valid.includes(l.id))continue;
   if(pool.includes(q.objective.item_id)){
     const fallback=DB.quest_system?.target_information_bonus?.gather_target_chance??.12;
     const configured=q.target_spawn_boost??template?.target_spawn_boost??fallback;
     const numeric=Number(configured);
     const chance=Number.isFinite(numeric)?clamp(numeric,0,1):.12;
     return {id:q.objective.item_id,chance}
   }
 }
 return null
}
function actGather(){
 try{
   if(!beginTurn("採集"))return;
   const l=loc(G?.character?.locationId);
   if(!l){log("採集","目前位置資料未載入，採集已安全停止。","danger");persist();return}
   const ids=gatherResourceIds(l),pool=gatherEligiblePool(l);
   if(!pool.length){
     const hasLocked=ids.some(id=>item(id)?.gather_tool);
     log("採集",hasLocked?"此處資源需要對應採集工具。":"此處缺乏可直接採集的自然資源。");
     maybeGatherEncounter(l);endTurn(.5);return
   }
   const t=checkRoll("意志","採集"),n=t>=16?3:t>=10?2:1,got=[],target=activeGatherTarget(l,pool);
   for(let i=0;i<n;i++){
     const id=target&&Math.random()<target.chance?target.id:pool[rand(pool.length)],d=item(id);
     if(!d)continue;
     let q=1;
     const src=Array.isArray(d.acquisition_sources)?d.acquisition_sources:[];
     if(src.includes("mining")&&hasTool("mining")&&t>=14)q++;
     if(src.includes("woodcut")&&hasTool("woodcut")&&t>=14)q++;
     addItem(id,q,{skipQuestProgress:true});got.push(`${d.name||id}×${q}`)
   }
   syncAllQuestInventoryProgress(false);
   log("採集",got.join("、")||"沒有取得可用資源。","ok");maybeGatherEncounter(l);endTurn(1)
 }catch(error){
   console.error("[採集] 採集流程已中止並保留目前畫面。",error);
   try{log("採集","採集流程遇到錯誤，已安全停止；請重新載入後再試。","danger")}catch(logError){console.error("[採集] 無法新增錯誤紀錄。",logError)}
   let recovered=false;try{recovered=typeof abortRuntimeAction==="function"&&abortRuntimeAction(error)}catch(recoveryError){console.error("[採集] 穩定層復原失敗。",recoveryError)}
   if(!recovered){try{persist()}catch(saveError){console.error("[採集] 無法保存目前狀態。",saveError)}try{renderAll()}catch(renderError){console.error("[採集] 畫面復原失敗。",renderError)}}
 }
}
function actHunt(){
 if(!beginTurn("打獵"))return;
 const l=loc(G.character.locationId),land=l.hunt||[],fish=l.fish||[],canFish=fish.length&&hasTool("fishing");
 if(!land.length&&!canFish){
   log("打獵",fish.length?"此地有魚群，但需要釣具。":"此地目前沒有合理的可狩獵目標。");
   maybeEncounter("打獵");endTurn(1.2);return
 }
 const useFish=canFish&&(!land.length||Math.random()<.45),pool=useFish?fish:land,t=checkRoll("敏捷",useFish?"釣魚":"打獵");
 if(t>=12){
   const id=pool[rand(pool.length)],d=item(id),q=t>=17?2:1;
   addItem(id,q);log(useFish?"釣魚":"打獵",`取得${d.name}×${q}`,"ok")
 }else log(useFish?"釣魚":"打獵","未取得獵物。");
 maybeEncounter("打獵");endTurn(useFish?1.5:2)
}
function openRestChoice(){showModal("野外休息","<div class='actions'><button onclick='wildRest(2)'>2小時</button><button onclick='wildRest(4)'>4小時</button><button onclick='wildRest(6)'>6小時</button></div>")}
function wildRest(h){closeModal();if(!beginTurn("野外休息"))return;G.character.fatigue=clamp(G.character.fatigue-h*12,0,120);G.character.stamina=G.character.maxStamina;maybeEncounter("休息");endTurn(h)}
function openTraining(){showModal("自主訓練","<div class='actions'><button onclick=\"train('combat')\">戰鬥訓練</button><button onclick=\"train('survival')\">生存訓練</button><button onclick=\"train('body')\">體能訓練</button></div>")}
function train(type){closeModal();if(!beginTurn("自主訓練"))return;G.character.fatigue=clamp(G.character.fatigue+6,0,120);log("訓練","完成基礎訓練；成長仍受每日上限控制。","ok");endTurn(1.5)}
function openCooking(){
 const hasCook=G.character.subjobs.some(x=>x.id==="SJ-COOK"),rank=hasCook?G.character.subjobs.find(x=>x.id==="SJ-COOK").grade:null;
 let list=DB.recipes.filter(r=>!r.cook_grade||(rank&&tierOrder(rank)>=tierOrder(r.cook_grade)));
 let b=`<div class="small">沒有烹飪副職業也能製作F級基礎料理；E級以上需烹飪資格。批量製作會按實際次數消耗材料與時間。</div>`+
 list.map(r=>{
   const result=item(r.result);
   return `<div class="itemrow"><span><b>${r.name}</b> <span class="tier">${r.tier}</span>
   <br><span class="small">${craftResultLine(result)}<br>${cookingMaterialText(r,true)}</span></span>
   <span class="craft-batch"><button onclick="cookBatch('${r.id}',1)">製作1</button><button onclick="cookBatch('${r.id}',5)">×5</button><button onclick="cookBatch('${r.id}',10)">×10</button></span></div>`
 }).join("");
 showModal("料理",b,"openCooking()")
}
function getMissingMaterials(r){
 const miss=[];
 if(r.requires){
  for(const [id,q] of Object.entries(r.requires)){
   const total=G.character.inventory.filter(x=>x.id===id).reduce((s,x)=>s+(x.qty||1),0);
   if(total<q)miss.push({name:item(id)?.name||id,tier:item(id)?.tier||"F",need:q,have:total,missing:q-total})
  }
 }
 if(r.requires_any_food){
  const total=G.character.inventory.filter(x=>item(x.id)?.type==="食材").reduce((s,x)=>s+(x.qty||1),0);
  if(total<r.requires_any_food)miss.push({name:"任意食材",tier:"F",need:r.requires_any_food,have:total,missing:r.requires_any_food-total})
 }
 return miss
}
function hasIngredients(r){return getMissingMaterials(r).length===0}
function showMissingMaterials(r,miss){
 const rows=miss.map(x=>`<div class="itemrow"><span><b>${x.name}</b> <span class="tier">${x.tier}</span></span><span>需要 ${x.need}｜現有 ${x.have}｜<b class="danger">缺少 ${x.missing}</b></span></div>`).join("");
 showModal("材料不足",`<div class="card"><b>${r.name}</b><br><span class="small">材料不足，請補齊以下項目後再製作。</span></div>${rows}<div class="actions"><button onclick="openCooking()">返回料理</button></div>`)
}

function cookingMissingBatch(r,count){const miss=[];for(const [id,q] of Object.entries(r.requires||{})){const need=q*count,have=inventoryQty(id);if(have<need)miss.push({id,need,have})}if(r.requires_any_food){const need=r.requires_any_food*count,have=(G.character.inventory||[]).reduce((n,x)=>n+(item(x.id)?.type==="食材"?(x.qty||1):0),0);if(have<need)miss.push({id:"ANY_FOOD",need,have})}return miss}
function consumeAnyFood(qty){let n=qty;for(let i=G.character.inventory.length-1;i>=0&&n>0;i--){const x=G.character.inventory[i];if(item(x.id)?.type!=="食材")continue;const take=Math.min(n,x.qty||1);removeItem(x.id,take,i);n-=take}return n<=0}
function cookBatch(rid,count=1){
 count=Math.max(1,Math.min(10,Number(count)||1));const r=IDX.recipe.get(rid);if(!r)return;const miss=cookingMissingBatch(r,count);if(miss.length){alert("批量材料不足："+miss.map(x=>`${x.id==="ANY_FOOD"?"任意食材":item(x.id)?.name||x.id} ${x.have}/${x.need}`).join("、"));return}closeModal();if(!beginTurn(`批量料理：${r.name}×${count}`))return;const hasCook=G.character.subjobs.some(x=>x.id==="SJ-COOK"),chance=clamp(42+effectiveStat("敏捷")*2+effectiveStat("幸運")*2+(hasCook?18:0)-tierOrder(r.tier)*8+talentSubjobBonus("SJ-COOK","success"),25,95);let success=0,fail=0;for(let n=0;n<count;n++){if(r.requires)for(const [id,q] of Object.entries(r.requires))consumeIngredient(id,q);if(r.requires_any_food)consumeAnyFood(r.requires_any_food);if(1+rand(100)<=chance){addItem(r.result);success++}else fail++;if(hasCook)gainSubjobXp("SJ-COOK",(tierOrder(r.tier)+1)*6)}log("料理",`${r.name}×${count}：成功${success}、失敗${fail}（單次成功率${chance}%）。`,success?"ok":"danger");const red=clamp(talentSubjobBonus("SJ-COOK","timeReduction"),0,.35);endTurn(Math.max(.25,Math.round(count*(1-red)*100)/100));openCooking()
}
function cook(rid){return cookBatch(rid,1)}

function activeQuests(){return G?.quests||[]}
function questTemplate(id){return IDX.quest.get(id)||null}
function questObjectiveText(q){
 const o=q.objective||{};
 if(o.kind==="item")return `取得 ${item(o.item_id)?.name||o.item_id} ×${o.target}`;
 if(o.kind==="gather")return `採集 ${item(o.item_id)?.name||o.item_id} ×${o.target}`;
 if(o.kind==="kill")return `討伐 ${(o.monster_keywords||[]).join("／")} 類敵人 ×${o.target}`;
 if(o.kind==="patrol"){
   const done=q.patrolVisited||[];
   const cp=(o.checkpoints||[]).map((n,i)=>`${done.includes(n)?"✓":"□"}${i+1}.${n}`).join("、");
   return `前往 ${loc(o.location_id)?.name||o.location_id} 完成${o.target}個不同巡查點：${cp}`
 }
 if(o.kind==="action")return `${loc(o.location_id)?.name||o.location_id}：${o.action} ×${o.target}`;
 return "完成指定目標"
}
function shortestTravelHours(fromId,toId){const c=ensureTravelCache(),i=c.ix.get(fromId),j=c.ix.get(toId);return i==null||j==null?Infinity:c.d[i][j]}
function questLocationValid(t,l){
 if(!l)return false;const o=t.objective||{};
 if(o.kind==="gather")return ["wild","dungeon"].includes(l.kind)&&(l.gather||[]).includes(o.item_id);
 if(o.kind==="item"){
   if(["wild","dungeon"].includes(l.kind)&&(l.gather||[]).includes(o.item_id))return true;
   if(l.kind==="town")return (l.facilities||[]).some(fid=>(DB.facilities[fid]?.stock||[]).includes(o.item_id));
   return false
 }
 if(o.kind==="patrol")return l.id===o.location_id&&Array.isArray(o.checkpoints)&&o.checkpoints.length>=o.target;
 if(o.kind==="action")return l.id===o.location_id;
 if(o.kind==="kill")return ["wild","dungeon"].includes(l.kind)&&encounterCandidates(l).some(m=>(o.monster_keywords||[]).some(k=>m.name.includes(k)));
 return false
}
function questViableLocations(t){
 const preferred=(t.recommended_locations||[]).map(loc).filter(l=>questLocationValid(t,l)).map(l=>l.id);
 if(preferred.length)return preferred;
 return DB.locations.filter(l=>questLocationValid(t,l)).map(l=>l.id)
}
function questTemplateViable(t){
 if(!t||G.character.level<t.min_level||G.character.level>t.max_level)return false;
 const places=questViableLocations(t);if(!places.length)return false;
 return places.some(id=>Number.isFinite(shortestTravelHours(G.character.locationId,id)))
}
function questTimeAllowance(t){
 const minByTier=DB.quest_system.minimum_time_by_tier[t.tier]||72,places=questViableLocations(t);
 const reachable=places.map(id=>shortestTravelHours(G.character.locationId,id)).filter(Number.isFinite);
 if(!reachable.length)return Infinity;
 const travel=Math.min(...reachable),o=t.objective||{};
 const work=o.kind==="kill"?(o.target||1)*4:o.kind==="gather"?(o.target||1)*1.5:o.kind==="patrol"?(o.target||1)*1.4:(o.target||1)*1.5;
 return Math.ceil(Math.max(t.base_time_limit_hours||t.time_limit_hours||0,minByTier,travel*2+work+12))
}
function questEffectiveDeadline(q){return q.status==="ready"?(q.reportDeadlineHour??q.deadlineHour):q.deadlineHour}
function questRemainingHours(q){return Math.max(0,(questEffectiveDeadline(q)??totalHours())-totalHours())}
function questTimeLabel(q){return q.status==="ready"?"回報寬限":"目標時限"}
function questPenaltyText(q){
 const p=DB.quest_system.abandon_penalties[q.tier]||DB.quest_system.abandon_penalties.F;
 return `公會信用 -${p.reputation}、罰款 ${p.silver}銀、${p.restriction_turns}回合內無法接取新公會委託`
}
function updateQuestProgress(kind,data={}){
 if(!G?.quests?.length)return;
 for(const q of G.quests){
   if(!["active","ready"].includes(q.status))continue;const o=q.objective||{};
   if(["item","gather"].includes(o.kind)&&o.item_id){syncQuestInventoryProgressOne(q,false);continue}
   if(q.status!=="active")continue;let add=0;
   if(kind==="kill"&&o.kind==="kill"&&(o.monster_keywords||[]).some(k=>(data.name||"").includes(k)))add=1;
   if(kind==="action"&&o.kind==="action"&&o.action===data.action&&(!o.location_id||o.location_id===data.location_id))add=1;
   if(kind==="patrol"&&o.kind==="patrol"&&o.location_id===data.location_id){q.patrolVisited=q.patrolVisited||[];const next=(o.checkpoints||[]).find(cp=>!q.patrolVisited.includes(cp));if(next){q.patrolVisited.push(next);add=1;log("巡查",`${q.name}：完成巡查點「${next}」(${q.patrolVisited.length}/${o.target})。`,"ok")}}
   if(add){q.progress=Math.min(o.target||1,(q.progress||0)+add);if(q.progress>=(o.target||1)){q.status="ready";q.completedHour=totalHours();const grace=q.completionGraceHours??DB.quest_system.report_grace_hours??24;q.reportDeadlineHour=Math.max(q.deadlineHour||totalHours(),totalHours()+grace);log("委託",`${q.name}：目標已完成，請在回報寬限內返回指定設施。`,"ok")}}
 }
}

function applyQuestPenalty(q,reason="解除"){
 const p=DB.quest_system.abandon_penalties[q.tier]||DB.quest_system.abandon_penalties.F;
 G.character.guildReputation=(G.character.guildReputation||0)-p.reputation;
 const paid=Math.min(G.character.moneySilver,p.silver);G.character.moneySilver-=paid;
 G.character.guildRestrictionUntilTurn=Math.max(G.character.guildRestrictionUntilTurn||0,G.turn+p.restriction_turns);
 G.questHistory=G.questHistory||[];
 G.questHistory.unshift({id:q.id,name:q.name,tier:q.tier,status:reason,time:timeText(),penalty:{...p,paid}});
 if(G.questHistory.length>30)G.questHistory.length=30;
 log("委託",`${q.name}${reason==="逾期失敗"?"逾期失敗":"已解除"}：公會信用-${p.reputation}、支付${paid}銀，${p.restriction_turns}回合內無法接取新委託。`,"warnText")
}
function updateQuestDeadlines(){
 if(!G?.quests?.length)return;
 const expired=G.quests.filter(q=>questRemainingHours(q)<=0);
 for(const q of expired)applyQuestPenalty(q,"逾期失敗");
 if(expired.length)G.quests=G.quests.filter(q=>!expired.includes(q))
}
function openQuestLog(){
 syncAllQuestInventoryProgress(true);
 const qs=activeQuests();
 const rows=qs.map(q=>{
   const o=q.objective||{},left=questRemainingHours(q),ready=q.status==="ready",turnin=q.turninFacility||"guild",turninName=DB.facilities[turnin]?.name||"冒險者公會";
   const pct=Math.min(100,Math.round((q.progress||0)/(o.target||1)*100));
   return `<div class="quest-card">
     <div class="quest-card-title">${q.name} <span class="tier">${q.tier}</span>［${q.type}］</div>
     <div class="small">${q.description}<br>
       目標：${questObjectiveText(q)}<br>
       進度：${q.progress||0}/${o.target||1}（${pct}%）｜${questTimeLabel(q)}：${left.toFixed(1)}小時｜報酬：${q.rewardSilver}銀／${q.xp_reward||0}XP<br>
       回報：${turninName}｜狀態：${ready?"<span class='ok'>可回報</span>":"進行中"}<br>
       解除懲罰：${questPenaltyText(q)}<br>
       ${ready&&G.character.currentFacility===turnin?"可在目前設施回報完成":`請至${turninName}的委託櫃回報`}
     </div>
     <div class="quest-card-actions">
       ${ready&&G.character.currentFacility===turnin?`<button class="good" onclick="turnInQuest('${q.id}','questlog')">回報完成</button>`:""}
       <button class="bad" onclick="abandonQuest('${q.id}')">解除委託</button>
     </div>
   </div>`
 }).join("")||"<div class='soft-card small'>目前沒有已接取的委託。</div>";
 const rep=`<div class="quest-rep-card"><b>冒險者公會信用：${G.character.guildReputation||0}</b><br><span class="small">解除或逾期會降低信用並產生短期接取限制。</span></div>`;
 const hist=(G.questHistory||[]).slice(0,5).map(x=>`<div class="small">${x.time}｜${x.name}［${x.tier}］｜${x.status}</div>`).join("");
 showModal("已接取委託",rep+rows+(hist?`<div class="recent-history"><b>近期紀錄</b>${hist}</div>`:""),"openQuestLog()")
}
function abandonQuest(id){
 const q=G.quests?.find(x=>x.id===id);if(!q)return;
 if(!confirm(`確定解除「${q.name}」？\n懲罰：${questPenaltyText(q)}`))return;
 closeModal();if(!beginTurn("解除公會委託"))return;
 applyQuestPenalty(q,"解除");
 G.quests=G.quests.filter(x=>x.id!==id);
 endTurn(.1);openQuestLog()
}
function acceptGuildQuest(templateId){
 if(G.character.currentFacility!=="guild")return;const t=questTemplate(templateId);if(!t||!questTemplateViable(t)||!questMarketAvailable(t)){alert("此委託目前不可發布，可能已達市場飽和。 ");return}
 if((G.character.guildRestrictionUntilTurn||0)>G.turn){alert(`公會目前暫停受理你的新委託，還需 ${G.character.guildRestrictionUntilTurn-G.turn} 回合。`);return}if((G.quests||[]).length>=DB.quest_system.max_active){alert(`同時最多接取 ${DB.quest_system.max_active} 個委託。`);return}if((G.quests||[]).some(q=>q.templateId===templateId)){alert("此委託已接取。");return}
 if(!beginTurn("接取公會委託"))return;const rr=adjustedRewardRange(t),reward=randomInt(rr[0],rr[1]),timeLimit=questTimeAllowance(t),xp=DB.progression_system.quest_xp_by_tier[t.tier]||12;const q={id:`AQ-${templateId}-${Date.now().toString(36).slice(-5)}`,templateId:t.id,name:t.name,tier:t.tier,type:t.type,description:t.description,objective:JSON.parse(JSON.stringify(t.objective)),progress:0,status:"active",acceptedHour:totalHours(),deadlineHour:totalHours()+timeLimit,timeLimitHours:timeLimit,rewardSilver:reward,target_spawn_boost:t.target_spawn_boost||0,completionGraceHours:t.completion_grace_hours||DB.quest_system.report_grace_hours,viableLocationIds:questViableLocations(t),xp_reward:xp,turninFacility:"guild",sourceType:"guild",sourceId:"ORG-001",marketFactorAtAcceptance:rr[2]};G.quests.push(q);syncQuestInventoryProgressOne(q,false);log("委託",`接取 ${q.name}［${q.tier}］；市場需求倍率${Math.round(rr[2]*100)}%，完成報酬${reward}銀／${xp}XP。`,"ok");endTurn(.1);guildQuests()
}
function questDeliveryReady(q){const o=q.objective||{};if(!questObjectiveConsumesItems(q))return true;return inventoryQty(o.item_id)>=(o.target||1)}


function reopenQuestViewAfterTurnIn(view,arg,q){
 const v=view||q?.sourceType||"";
 if(v==="questlog"){openQuestLog();return}
 if(v==="guild"){guildQuests();return}
 if(v==="faith"){openFaithMissions();return}
 if(v==="authority"){openAuthorityRequests(arg||q?.politicalEntityId);return}
 if(v==="organization"){openOrganizationContracts(arg||q?.organizationId||q?.sourceId);return}
 if(v==="facility"){facilityQuest(arg||q?.turninFacility||q?.sourceId);return}
 if(q?.sourceType==="guild"){guildQuests();return}
 if(q?.sourceType==="faith"||q?.faithPantheonId){openFaithMissions();return}
 if(q?.sourceType==="authority"||q?.politicalAuthorityOfficeId){openAuthorityRequests(q?.politicalEntityId);return}
 if(q?.sourceType==="organization"||q?.organizationId){openOrganizationContracts(q?.organizationId||q?.sourceId);return}
 if(q?.sourceType==="facility"){facilityQuest(q?.turninFacility||q?.sourceId);return}
 renderFacility(q?.turninFacility||"guild")
}
function turnInQuest(id,returnView=null,returnArg=null){
 const q=G.quests?.find(x=>x.id===id);if(!q)return;syncQuestInventoryProgressOne(q,true);const turnin=q.turninFacility||"guild";
 if(q.status!=="ready"||G.character.currentFacility!==turnin)return;
 if(!questDeliveryReady(q)){alert(`回報需要保留 ${item(q.objective.item_id)?.name||q.objective.item_id} ×${q.objective.target}。`);syncQuestInventoryProgressOne(q,true);return}
 if(!beginTurn("回報委託"))return;
 if(questObjectiveConsumesItems(q))consumeIngredient(q.objective.item_id,q.objective.target||1);
 const cap=DB.progression_system.quest_xp_by_tier[q.tier]||12,xp=Math.min(Number(q.xp_reward||cap),cap);G.character.moneySilver+=q.rewardSilver;gainCharacterXp(xp,`委託：${q.name}`);
 registerQuestMarketCompletion(q);
 const rep=(q.faithPantheonId||q.organizationId||q.politicalAuthorityOfficeId)?0:(DB.quest_system.completion_reputation[q.tier]||1);G.character.guildReputation=(G.character.guildReputation||0)+rep;
 if(q.faithPantheonId)changeFaithStanding(q.faithPantheonId,q.faithStandingReward||2);if(q.organizationId)changeOrgRep(q.organizationId,q.organizationRepReward||2);if(q.politicalEntityId&&q.politicalAuthorityOfficeId)changePoliticalStanding(q.politicalEntityId,q.politicalStandingReward||2);
 G.questHistory=G.questHistory||[];const src=questSourceMeta(q);G.questHistory.unshift({id:q.id,name:q.name,tier:q.tier,status:"完成",time:timeText(),reward:q.rewardSilver,reputation:rep,sourceType:src.type,sourceId:src.id,sourceName:src.name});emitIntegratedEvent("quest_complete",src.type,src.id,`完成${src.name}的${q.name}`,{questId:q.id,reward:q.rewardSilver,tier:q.tier});if(G.questHistory.length>30)G.questHistory.length=30;G.quests=G.quests.filter(x=>x.id!==id);
 log("委託",`完成 ${q.name}：交付素材完成，獲得${q.rewardSilver}銀／${xp}XP${rep?`、公會信用+${rep}`:""}${q.faithPantheonId?`、${pantheon(q.faithPantheonId)?.name||"神系"}聲望+${q.faithStandingReward||2}`:""}${q.politicalEntityId&&q.politicalAuthorityOfficeId?`、${politicalEntity(q.politicalEntityId)?.name||"地方"}政治聲望+${q.politicalStandingReward||2}`:""}。`,"ok");endTurn(.2);reopenQuestViewAfterTurnIn(returnView,returnArg,q)
}

function turnInGuildQuest(id){turnInQuest(id)}
function openFacilities(){const l=loc(G.character.locationId);showModal("城鎮設施",l.facilities.map(id=>`<div class="itemrow"><span><b>${DB.facilities[id].name}</b></span><button onclick="visitFacility('${id}')">進入</button></div>`).join(""))}
function visitFacility(fid){G.character.currentFacility=fid;persist();renderFacility(fid)}
function subjobForProfession(prof){const sid=DB.crafting_system.profession_subjob[prof];return G.character.subjobs.find(x=>x.id===sid)}
function subjobGradeIndex(j){return j?tierOrder(j.grade||"F"):-1}
function craftRecipeMaterials(d){const r=d.craft_recipe||{};return [...(r.base_materials||[]),...(r.monster_components||[])]}
function craftMaterialText(d,showOwned=true){
 const mats=craftRecipeMaterials(d);
 if(!mats.length)return "需要素材：無";
 return "需要素材："+mats.map(x=>{
   const n=item(x.id)?.name||x.id;
   const owned=inventoryQty(x.id);
   return `${n}×${x.qty}${showOwned?`（持有${owned}）`:""}`
 }).join("、")
}
function cookingMaterialText(r,showOwned=true){
 const parts=[];
 for(const [id,q] of Object.entries(r.requires||{})){
   const n=item(id)?.name||id,owned=inventoryQty(id);
   parts.push(`${n}×${q}${showOwned?`（持有${owned}）`:""}`)
 }
 if(r.requires_any_food){
   const owned=(G.character.inventory||[]).reduce((n,x)=>n+(item(x.id)?.type==="食材"?(x.qty||1):0),0);
   parts.push(`任意食材×${r.requires_any_food}${showOwned?`（持有${owned}）`:""}`)
 }
 return "需要素材："+(parts.length?parts.join("、"):"無")
}
function inventoryQty(id){let n=0;for(const x of G.character.inventory||[])if(x.id===id)n+=x.qty||1;return n}
function craftingMissing(d){return craftRecipeMaterials(d).filter(x=>inventoryQty(x.id)<x.qty).map(x=>({id:x.id,need:x.qty,have:inventoryQty(x.id)}))}
function recipeKnown(d){
 if(d.recipe_access==="public")return true;
 return (G.character.knownRecipes||[]).includes(d.recipe_id)
}
function recipeCanLearn(d){
 const j=subjobForProfession(d.craft_recipe?.profession),access=d.recipe_access;
 return ["trainer"].includes(access)&&j&&tierOrder(j.grade)>=tierOrder(d.tier)&&G.character.level>=(d.recipe_level||1)
}
function recipeLearnFee(d){return Math.max(4,Math.ceil((d.value||20)*.08)+(tierOrder(d.tier)+1)*6)}
function learnCraftRecipe(itemId){
 const d=item(itemId);if(!d?.craft_recipe||!recipeCanLearn(d)||recipeKnown(d))return;
 const fee=recipeLearnFee(d);if(G.character.moneySilver<fee){alert(`需要 ${fee} 銀。`);return}
 closeModal();if(!beginTurn("學習製作配方"))return;
 G.character.moneySilver-=fee;G.character.knownRecipes=G.character.knownRecipes||[];G.character.knownRecipes.push(d.recipe_id);
 log("製作",`學會 ${d.name}［${d.tier}］配方，支付${fee}銀。`,"ok");endTurn(2);openCrafting(d.craft_recipe.requires_facility,d.tier)
}
function consumeIngredient(id,qty){
 let left=qty;
 for(let i=G.character.inventory.length-1;i>=0&&left>0;i--){
   const x=G.character.inventory[i];if(x.id!==id)continue;
   const take=Math.min(left,x.qty||1);removeItem(id,take,i);left-=take
 }
 return left<=0
}
function subjobThreshold(grade){return DB.crafting_system.subjob_xp_thresholds[grade]??Infinity}
function gainSubjobXp(sid,amount){
 const j=G.character.subjobs.find(x=>x.id===sid);if(!j)return;
 const rate=talentSubjobBonus(sid,"xpRate");
 amount=Math.max(0,Math.round(amount*(1+rate)*100)/100);
 j.xp=(j.xp||0)+amount;
 const idx=tierOrder(j.grade||"F");
 if(idx>=6)return;
 const next=["F","E","D","C","B","A","S"][idx+1],need=subjobThreshold(next),lv=DB.class_design_system.unlock_levels[next]||99;
 if(j.xp>=need&&G.character.level>=lv){j.grade=next;log("副職業",`${sub(sid).name}熟練提升為［${next}］。`,"ok")}
}
function craftSuccessChance(d,j){
 const prof=d.craft_recipe.profession,primary=prof==="鍛造"?"力量":prof==="裁縫"?"敏捷":"智力";
 const sid=j?.id||DB.crafting_system.profession_subjob[prof],tal=talentSubjobBonus(sid,"success");
 return clamp(58+effectiveStat(primary)*1.5+(j?tierOrder(j.grade)*7:0)-tierOrder(d.tier)*9+effectiveStat("幸運")*.5+tal+affiliationEffects().craft_success,25,95)
}
function craftTimeHours(d,j){
 const base=d.recipe_time_hours||1,red=clamp(talentSubjobBonus(j?.id,"timeReduction"),0,.35);
 return Math.max(.25,Math.round(base*(1-red)*100)/100)
}

function craftingMissingBatch(d,count){return craftRecipeMaterials(d).filter(x=>inventoryQty(x.id)<x.qty*count).map(x=>({id:x.id,need:x.qty*count,have:inventoryQty(x.id)}))}
function craftMaxBatch(d,limit=10){
 const mats=craftRecipeMaterials(d);if(!mats.length)return limit;
 return Math.max(0,Math.min(limit,...mats.map(x=>Math.floor(inventoryQty(x.id)/Math.max(1,x.qty)))))
}
function craftItemBatch(itemId,count=1){
 count=Math.max(1,Math.min(10,Number(count)||1));const d=item(itemId),r=d?.craft_recipe,j=d&&subjobForProfession(r?.profession);if(!d||!r||!j){alert("缺少對應副職業。");return}if(!recipeKnown(d)){alert("尚未學會此配方。");return}if(tierOrder(j.grade)<tierOrder(d.tier)){alert(`副職業階級不足，需要${d.tier}級。`);return}if(G.character.level<(d.recipe_level||1)){alert(`需要角色Lv${d.recipe_level}。`);return}const missing=craftingMissingBatch(d,count);if(missing.length){alert("批量材料不足："+missing.map(x=>`${item(x.id)?.name||x.id} ${x.have}/${x.need}`).join("、"));return}closeModal();if(!beginTurn(`批量製作：${d.name}×${count}`))return;const chance=craftSuccessChance(d,j);let success=0,fail=0;for(let n=0;n<count;n++){const roll=1+rand(100),ok=roll<=chance;for(const x of craftRecipeMaterials(d))consumeIngredient(x.id,x.qty);if(ok){addItem(d.id,1);success++}else fail++;gainSubjobXp(DB.crafting_system.profession_subjob[r.profession],(tierOrder(d.tier)+1)*8)}log("製作",`${d.name}×${count}：成功${success}、失敗${fail}（單次成功率${chance}%）。`,success?"ok":"danger");endTurn(craftTimeHours(d,j)*count);openCrafting(r.requires_facility,d.tier)
}
function craftItem(itemId){return craftItemBatch(itemId,1)}

function openCrafting(fid,tierFilter="F"){
 const prof=DB.crafting_system.facility_profession[fid];if(!prof)return;
 const locTier=loc(G.character.locationId).tier,j=subjobForProfession(prof);
 const allowed=["F","E","D","C","B","A","S"].filter(t=>tierOrder(t)<=tierOrder(locTier));
 if(!allowed.includes(tierFilter))tierFilter=allowed.at(-1)||"F";
 const tabs=allowed.map(t=>`<button ${t===tierFilter?'class="primary"':""} onclick="openCrafting('${fid}','${t}')">${t}</button>`).join("");
 const all=craftingItemsFor(fid,tierFilter);
 const rows=all.slice(0,80).map(d=>{
   const known=recipeKnown(d),canLearn=!known&&recipeCanLearn(d),missing=craftingMissing(d),chance=j?craftSuccessChance(d,j):0,maxBatch=known?craftMaxBatch(d,10):0;
   const mats=craftMaterialText(d,true);
   const gradeOk=j&&tierOrder(j.grade)>=tierOrder(d.tier),canCraft=gradeOk&&G.character.level>=(d.recipe_level||1);
   return `<div class="itemrow"><span><b>${d.name}</b> <span class="tier">${d.tier}</span><br><span class="small">${craftResultLine(d)}<br>${mats}<br>${known?`成功率約${chance}%｜${craftTimeHours(d,j)}小時｜可連做${maxBatch}次`:`配方：${d.recipe_access==="special"?"特殊來源":d.recipe_access==="trainer"?"師傅教授":"公開"}`}${missing.length?`｜缺料${missing.length}種`:""}</span></span><span>${canLearn?`<button onclick="learnCraftRecipe('${d.id}')">學配方 ${recipeLearnFee(d)}銀</button>`:""} ${known?`<span class="craft-batch"><button ${canCraft&&maxBatch>=1?"":"disabled"} onclick="craftItemBatch('${d.id}',1)">製作1</button><button ${canCraft&&maxBatch>=5?"":"disabled"} onclick="craftItemBatch('${d.id}',5)">×5</button><button ${canCraft&&maxBatch>=10?"":"disabled"} onclick="craftItemBatch('${d.id}',10)">×10</button></span>`:""}</span></div>`
 }).join("")||"<div class='small'>此階級沒有可用配方。</div>";
 const sj=j?`${sub(j.id).name}［${j.grade}］ XP ${j.xp||0}`:"尚未取得對應副職業";
 showModal(`${DB.facilities[fid].name}・製作`,`<div class="card small">${sj}<br>F公開；E/D可由師傅教授；C以上需要特殊配方來源。</div><div class="actions">${tabs}</div>${rows}<div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`,`openCrafting(\'${fid}\',\'${tierFilter}\')`)
}function pantheon(id){return IDX.pantheon.get(id)||null}
function faithEntity(id){return IDX.faith.get(id)}
function deity(id){const x=faithEntity(id);return x?.entity_type==="deity"?x:null}
function faithProfile(){
 const l=loc(G.character.locationId),p=DB.local_faith_profiles?.[l.id];
 return p||{recognized:["PTH-01","PTH-03"],primary:"PTH-01",hidden:["PTH-08"]}
}
function faithState(){
 const c=G.character;
 c.faith=c.faith||{patronDeityId:null,oathId:null,standing:{}};
 c.faith.standing=c.faith.standing||{};
 return c.faith
}
function faithStanding(pid){return faithState().standing[pid]||0}
function changeFaithStanding(pid,delta){
 const f=faithState();f.standing[pid]=clamp((f.standing[pid]||0)+delta,-100,100)
}
function localFaithEntities(){
 const p=faithProfile(),recognized=new Set(p.recognized||[]);
 return (DB.faith_entities||[]).filter(x=>recognized.has(x.pantheon_id)&&!["hidden","forbidden"].includes(x.visibility))
}
function localDeities(){
 return localFaithEntities().filter(x=>x.entity_type==="deity")
}
function faithRelation(a,b){
 if(a===b)return {relation:"same",reason:"同一神系"};
 return (DB.faith_relations||[]).find(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a))||{relation:"neutral",reason:"目前沒有正式關係紀錄"}
}
function faithRelationLabel(rel){
 return {same:"同一神系",cooperative:"合作",respectful:"互相尊重",competitive:"競爭",hostile:"敵對",neutral:"中立"}[rel]||rel
}
function openFaithDirectory(){
 const p=faithProfile(),sections=(p.recognized||[]).map(pid=>{
   const pan=pantheon(pid),ents=localFaithEntities().filter(x=>x.pantheon_id===pid),gods=ents.filter(x=>x.entity_type==="deity");
   const rel=faithRelation(p.primary,pid);
   return `<div class="card"><b>${pan.name}</b>${p.primary===pid?" <span class='tier'>地方主要信仰</span>":""}<br><span class="small">${pan.theme}｜信仰聲望 ${faithStanding(pid)}${p.primary!==pid?`｜與地方主系：${faithRelationLabel(rel.relation)}（${rel.reason}）`:""}</span>
   <div class="actions">${gods.map(g=>`<button onclick="openFaithEntity('${g.id}')">${g.name}</button>`).join("")}</div></div>`
 }).join("");
 showModal("神系與教會",`<div class="card small">公開名冊只顯示本地合法或受承認神系；地下邪教不會因普通教會介面自動曝光。</div>${sections}<div class="actions"><button onclick="renderFacility('church')">上一頁</button></div>`)
}
function childFaithEntities(parentId){return (DB.faith_entities||[]).filter(x=>x.parent_id===parentId)}
function openFaithEntity(id){
 const e=faithEntity(id);if(!e)return;
 const pan=pantheon(e.pantheon_id),children=childFaithEntities(id);
 let lineage=e.parent_id?`上級：${faithEntity(e.parent_id)?.name||"未知"}<br>`:"";
 let childHtml=children.length?`<h3>下轄／關聯組織</h3>${children.map(x=>`<div class="itemrow"><span>${x.name}［${x.entity_type}］</span><button onclick="openFaithEntity('${x.id}')">查看</button></div>`).join("")}`:"";
 let patronBtn=e.entity_type==="deity"&&!["hidden","forbidden","restricted"].includes(e.visibility)?`<button class="good" onclick="choosePatronDeity('${e.id}')">${faithState().patronDeityId===e.id?"目前敬奉":"選為主神"}</button>`:"";
 showModal(e.name,`<div class="card"><b>${e.name}</b><br>${pan.name}｜${e.entity_type}<br><span class="small">${lineage}領域：${(e.domains||[]).join("、")}｜立場：${e.alignment}｜公開狀態：${e.visibility}</span></div>${childHtml}<div class="actions">${patronBtn}<button onclick="openLoreScope('faith_entity','${e.id}','${e.name}・信仰脈絡')">歷史脈絡</button><button onclick="openLoreScope('pantheon','${pan.id}','${pan.name}・神系沿革')">神系沿革</button><button onclick="openFaithDirectory()">上一頁</button></div>`)
}
function choosePatronDeity(id){
 const e=deity(id);if(!e||["hidden","forbidden","restricted"].includes(e.visibility))return;
 const f=faithState();
 if(f.patronDeityId&&f.patronDeityId!==id&&!confirm(`更換主神會解除目前誓言。確定改為敬奉${e.name}？`))return;
 if(f.patronDeityId!==id){f.patronDeityId=id;f.oathId=null;changeFaithStanding(e.pantheon_id,1);discoverScopeLore("pantheon",e.pantheon_id,"信仰");discoverScopeLore("faith_entity",e.id,"信仰");log("信仰",`你開始正式敬奉${e.name}。`,"ok");persist()}
 openFaithProfile()
}
function faithOathEligible(){
 const n=cls(G.character.classId)?.name||"";
 return ["守誓騎士","聖盾騎士","聖武士","聖劍士"].some(k=>n.includes(k))
}
function oathForPatron(){
 const d=deity(faithState().patronDeityId);if(!d)return [];
 return (DB.faith_oaths||[]).filter(o=>o.pantheons.includes(d.pantheon_id))
}
function swearFaithOath(id){
 if(!faithOathEligible()){alert("目前戰鬥職業不是可立聖騎士誓言的職業。");return}
 const o=(DB.faith_oaths||[]).find(x=>x.id===id),d=deity(faithState().patronDeityId);
 if(!o||!d||!o.pantheons.includes(d.pantheon_id))return;
 faithState().oathId=o.id;changeFaithStanding(d.pantheon_id,2);persist();log("誓言",`你在${d.name}信仰下立下「${o.name}」。`,"ok");openFaithProfile()
}
function openFaithProfile(){
 const f=faithState(),d=deity(f.patronDeityId),o=(DB.faith_oaths||[]).find(x=>x.id===f.oathId);
 const standings=Object.entries(f.standing||{}).filter(([,v])=>v!==0).map(([pid,v])=>`${pantheon(pid)?.name||pid} ${v>=0?"+":""}${v}`).join("、")||"尚無";
 const oathBtns=d&&faithOathEligible()&&!o?oathForPatron().map(x=>`<button onclick="swearFaithOath('${x.id}')">${x.name}</button>`).join(""):"";
 showModal("信仰",`<div class="card"><b>主神</b>：${d?d.name:"未選擇"}<br><b>誓言</b>：${o?o.name:"無"}<br><span class="small">神系聲望：${standings}</span></div>
 ${o?`<div class="card"><b>${o.name}</b><br><span class="small">${o.tenets.join("／")}｜教會治療折扣${o.church_heal_discount}銀｜神殿委託金錢加成${Math.round(o.faith_reward_bonus*100)}%</span></div>`:""}
 <div class="actions">${oathBtns}<button onclick="openFaithDirectory()">查看神系</button></div>`)
}
function faithMissionArchetypeValid(a){
 const o=a.objective||{};
 if(o.kind==="gather")return DB.locations.some(l=>["wild","dungeon"].includes(l.kind)&&(l.gather||[]).includes(o.item_id));
 if(o.kind==="item")return !!item(o.item_id);
 if(o.kind==="action")return !!loc(o.location_id);
 return false
}
function generateFaithMissions(){
 const p=faithProfile(),recognized=p.recognized||[],level=G.character.level,candidates=[];for(const pid of recognized)for(const a of (DB.faith_mission_archetypes||[])){const gate={F:1,E:8,D:20,C:35,B:50,A:70,S:90}[a.tier]||1;if(a.allowed_pantheons.includes(pid)&&level>=gate&&faithMissionArchetypeValid(a))candidates.push({pid,a})}
 const out=[],seen=new Set(),seed=(G.worldTime.day||1)+(G.character.locationId||"").length*7;for(let i=0;i<candidates.length&&out.length<4;i++){const x=candidates[(i+seed)%candidates.length],key=x.pid+"|"+x.a.id;if(seen.has(key))continue;seen.add(key);const pan=pantheon(x.pid),q={id:`FM-${G.character.locationId}-${G.worldTime.day}-${x.pid}-${x.a.id}`,templateId:x.a.id,name:`${pan.name}・${x.a.name}`,tier:x.a.tier,type:"神殿委託",description:`由${pan.name}地方神職發布的${x.a.name}。`,objective:JSON.parse(JSON.stringify(x.a.objective)),reward:x.a.reward,xp_reward:DB.progression_system.quest_xp_by_tier[x.a.tier]||12,faithPantheonId:x.pid,faithStandingReward:x.a.standing,turninFacility:"church"};if(questMarketAvailable(q))out.push(q)}return out
}

function openFaithMissions(){
 if(G.character.currentFacility!=="church")return;syncAllQuestInventoryProgress(true);
 const generated=generateFaithMissions(),activeFaith=(G.quests||[]).filter(x=>x.sourceType==="faith"||x.faithPantheonId);
 const seen=new Set(generated.map(x=>`${x.faithPantheonId}|${x.templateId}`));
 const restored=activeFaith.filter(x=>!seen.has(`${x.faithPantheonId}|${x.templateId}`)).map(x=>({
   id:x.faithMissionId||x.id,templateId:x.templateId,faithPantheonId:x.faithPantheonId,name:x.name,tier:x.tier,type:x.type,description:x.description,
   objective:JSON.parse(JSON.stringify(x.objective||{})),reward:[x.rewardSilver,x.rewardSilver],xp_reward:x.xp_reward,faithStandingReward:x.faithStandingReward||2,turninFacility:"church",restored_active:true
 }));
 const missions=[...generated,...restored],rows=missions.map(q=>{const active=(G.quests||[]).find(x=>x.faithPantheonId===q.faithPantheonId&&x.templateId===q.templateId),rr=adjustedRewardRange(q);let action;if(active){action=active.status==="ready"?`<button class="good" onclick="turnInQuest('${active.id}','faith')">回報完成</button>`:`<button disabled>進行中 ${active.progress||0}/${active.objective?.target||1}</button>`}else action=`<button onclick="acceptFaithMission('${q.id}')">接取</button>`;return `<div class="card"><b>${q.name}</b> <span class="tier">${q.tier}</span><br><span class="small">${q.description}<br>目標：${questObjectiveText(q)}｜基礎報酬${rr[0]}～${rr[1]}銀／${q.xp_reward}XP｜神系聲望+${q.faithStandingReward}｜${marketPressureText(q)}</span><div class="actions">${action}</div></div>`}).join("")||"<div class='card small'>目前沒有適合你的神殿委託，或近期同類需求已飽和。</div>";G.tempFaithMissions=missions;showModal("神殿委託",rows+`<div class="actions"><button onclick="renderFacility('church')">上一頁</button></div>`,"openFaithMissions()")
}

function acceptFaithMission(id){
 if(G.character.currentFacility!=="church")return;const q=(G.tempFaithMissions||generateFaithMissions()).find(x=>x.id===id);if(!q||!questMarketAvailable(q))return;if((G.quests||[]).length>=DB.quest_system.max_active){alert(`同時最多接取 ${DB.quest_system.max_active} 個委託。`);return}if((G.quests||[]).some(x=>x.faithPantheonId===q.faithPantheonId&&x.templateId===q.templateId)){alert("同一神系的這類神殿委託已在進行中。");return}closeModal();if(!beginTurn("接取神殿委託"))return;const rr=adjustedRewardRange(q),base=randomInt(rr[0],rr[1]),oath=(DB.faith_oaths||[]).find(x=>x.id===faithState().oathId),bonus=oath&&oath.pantheons.includes(q.faithPantheonId)?oath.faith_reward_bonus:0,reward=Math.round(base*(1+bonus)),timeLimit=Math.max(72,questTimeAllowance(q));const aq={id:`AQ-${q.id}-${Date.now().toString(36).slice(-5)}`,templateId:q.templateId,faithMissionId:q.id,name:q.name,tier:q.tier,type:q.type,description:q.description,objective:JSON.parse(JSON.stringify(q.objective)),progress:0,status:"active",acceptedHour:totalHours(),deadlineHour:totalHours()+timeLimit,timeLimitHours:timeLimit,rewardSilver:reward,xp_reward:q.xp_reward,completionGraceHours:24,viableLocationIds:q.objective.location_id?[q.objective.location_id]:[],turninFacility:"church",faithPantheonId:q.faithPantheonId,faithStandingReward:q.faithStandingReward,sourceType:"faith",sourceId:q.faithPantheonId,marketFactorAtAcceptance:rr[2]};G.quests.push(aq);syncQuestInventoryProgressOne(aq,false);log("神殿委託",`接取${q.name}，完成後回教會回報。`,"ok");endTurn(.1);openFaithMissions()
}

function generateFaithEncounter(fid){
 if(!["church","tavern"].includes(fid))return null;
 const ents=localFaithEntities().filter(x=>["church","temple","monastic_order","knightly_order","druidic_order","academy_church","library_church"].includes(x.entity_type));
 if(!ents.length)return null;
 const e=ents[(G.turn+G.worldTime.hour+fid.length)%ents.length],pan=pantheon(e.pantheon_id);
 const roles=["巡迴牧師","修會使者","神殿侍祭","護教騎士","地方神職者"];
 const role=roles[(G.turn+e.index)%roles.length];
 return {entity:e,pantheon:pan,role,text:`一名${role}來自${e.name}，正在談論${(e.domains||[]).join("、")}相關的地方事務。`}
}
function openFaithEncounter(fid){
 const x=generateFaithEncounter(fid);if(!x){showModal("信仰人物","<div class='card small'>目前沒有公開活動的神職人物。</div>");return}
 showModal(`${fid==="tavern"?"酒館":"教會"}・信仰人物`,`<div class="card"><b>${x.role}</b>｜${x.entity.name}<br><span class="small">${x.pantheon.name}｜${x.text}</span></div><div class="actions"><button onclick="openFaithEntity('${x.entity.id}')">了解其組織</button><button onclick="renderFacility('${fid}')">上一頁</button></div>`)
}
function worldOrg(id){return IDX.worldOrg.get(id)}
function loreRecord(id){return IDX.lore.get(id)}
function politicalEntity(id){return IDX.polity.get(id)}
function cultureProfile(id){return IDX.culture.get(id)}
function worldRegion(id){return IDX.worldRegion.get(id)}
function authorityTierInfo(id){return IDX.authorityTier.get(id)||null}
function authorityRight(id){return IDX.authorityRight.get(id)||null}
function authorityArchetype(id){return IDX.authority.get(id)||null}
function authorityProfile(polityId){return IDX.authorityProfile.get(polityId)||null}
function authorityOffice(polityId,officeId){return authorityProfile(polityId)?.office_nodes?.find(x=>x.id===officeId)||null}
function authorityTierLevel(id){return Number(String(id||"AUTH-0").split("-")[1]||0)}
function politicalStanding(polityId){G.character.politicalStanding=G.character.politicalStanding||{};return G.character.politicalStanding[polityId]||0}
function changePoliticalStanding(polityId,delta){G.character.politicalStanding=G.character.politicalStanding||{};G.character.politicalStanding[polityId]=clamp((G.character.politicalStanding[polityId]||0)+delta,-100,100)}
function maxPoliticalAccessTier(polityId){
 const standing=politicalStanding(polityId),level=G.character.level||1;let best="AUTH-0";
 for(const x of (DB.political_access_system?.player_access_levels||[]))if(level>=x.min_level&&standing>=x.min_standing&&authorityTierLevel(x.authority_tier)>=authorityTierLevel(best))best=x.authority_tier;
 return best
}
function authorityOfficeAccessible(polityId,o){return !!o&&authorityTierLevel(o.authority_tier)<=authorityTierLevel(maxPoliticalAccessTier(polityId))}
function successionContext(polityId,officeId){
 const p=politicalEntity(polityId),o=authorityOffice(polityId,officeId),a=authorityArchetype(o?.authority_archetype_id);
 if(!o)return {method:"未知",basis:"沒有可驗證職位資料",multistage:true};
 return {method:a?.succession_method||`依${p?.legal_tradition||"地方傳統"}與上級確認`,basis:a?`${a.name}的法統規則`:`${p?.name||"政治體"}的既有法統`,multistage:true}
}
function authorityRightNames(o){return (o?.rights||[]).map(x=>authorityRight(x)?.name||x)}
function openAuthorityHierarchy(polityId){
 const p=politicalEntity(polityId),prof=authorityProfile(polityId);if(!p||!prof)return;
 const access=maxPoliticalAccessTier(polityId),standing=politicalStanding(polityId);
 const rows=prof.office_nodes.slice().sort((a,b)=>authorityTierLevel(b.authority_tier)-authorityTierLevel(a.authority_tier)).map(o=>{
   const t=authorityTierInfo(o.authority_tier),parent=o.reports_to?authorityOffice(polityId,o.reports_to):null,can=authorityOfficeAccessible(polityId,o);
   return `<div class="itemrow"><span><b>${o.title}</b> <span class="tier">${o.authority_tier}</span><br><span class="small">${t?.name||""}｜${parent?`上級：${parent.title}`:"最高／獨立權位"}${o.parallel_authority_ids?.length?`｜平行權力：${o.parallel_authority_ids.map(x=>authorityOffice(polityId,x)?.title||x).join("、")}`:""}｜${can?"可接觸":"目前僅能查閱公開資料"}</span></span><button onclick="openAuthorityOffice('${polityId}','${o.id}')">查看</button></div>`
 }).join("");
 showModal(`${p.name}・權力層級`,`<div class="card"><b>政治權力 ≠ 戰鬥力</b><br><span class="small">你的地方政治聲望 ${standing}｜目前最高可接觸 ${access}（${authorityTierInfo(access)?.name||""}）。AUTH只描述統治範圍與法定權利，不使用F–S戰力判定。</span></div>${rows}<div class="actions"><button onclick="openAuthorityRequests('${polityId}')">地方政務委託</button><button onclick="openPolity('${polityId}')">上一頁</button></div>`)
}
function openAuthorityOffice(polityId,officeId){
 const p=politicalEntity(polityId),o=authorityOffice(polityId,officeId);if(!p||!o)return;
 const t=authorityTierInfo(o.authority_tier),a=authorityArchetype(o.authority_archetype_id),s=successionContext(polityId,officeId),parent=o.reports_to?authorityOffice(polityId,o.reports_to):null;
 const rights=authorityRightNames(o).map(x=>`<span class="authority-right">${x}</span>`).join(" ");
 showModal(`${p.name}・${o.title}`,`<div class="card"><b>${o.title}</b> <span class="tier">${o.authority_tier}</span><br>${t?.name||""}｜${t?.scope||""}<br><span class="small">${o.notes||"此職位依政治體既有法統行使職權。"}</span></div>
 <div class="card"><b>明列權利</b><br>${rights||"<span class='small'>沒有公共統治權。</span>"}</div>
 <div class="card"><b>權力關係</b><br><span class="small">上級：${parent?.title||"無／最高職位"}${o.parallel_authority_ids?.length?`<br>平行權力：${o.parallel_authority_ids.map(x=>authorityOffice(polityId,x)?.title||x).join("、")}`:""}<br>繼承／承認：${s.method}<br>最高權位更替必須走多階段法統事件，不能單次隨機完成。</span></div>
 ${a?`<div class="card"><b>統治文化原型：${a.name}</b><br><span class="small">${a.jurisdiction}<br>象徵：${a.symbols.join("、")}<br>玩家互動：${a.player_interaction}</span></div>`:""}
 <div class="actions">${a?`<button onclick="openLoreScope('authority_archetype','${a.id}','${a.name}・權力傳統')">歷史文化</button>`:""}<button onclick="openAuthorityHierarchy('${polityId}')">返回權力層級</button></div>`)
}
function openAuthorityArchetypes(){
 const rows=(DB.authority_archetypes||[]).map(a=>`<div class="itemrow"><span><b>${a.name}</b> <span class="tier">${a.authority_tier}</span><br><span class="small">${a.culture}｜${a.succession_method}</span></span><button onclick="openLoreScope('authority_archetype','${a.id}','${a.name}・權力傳統')">查看</button></div>`).join("");
 showModal("20種統治職位原型",rows+`<div class="actions"><button onclick="openLorePolitics()">上一頁</button></div>`)
}
function authorityLiaisonFacility(){
 const l=loc(G.character.locationId),fs=l?.facilities||[];
 return fs.includes("guild")?"guild":fs.includes("tavern")?"tavern":fs.includes("church")?"church":fs[0]||null
}
function authorityRequestOffice(polityId,template){
 const prof=authorityProfile(polityId),maxAccess=maxPoliticalAccessTier(polityId),templateMax=template.max_authority_tier||"AUTH-2",ceiling=Math.min(authorityTierLevel(maxAccess),authorityTierLevel(templateMax));
 return (prof?.office_nodes||[]).filter(o=>authorityTierLevel(o.authority_tier)<=ceiling&&authorityTierLevel(o.authority_tier)>=1).sort((a,b)=>authorityTierLevel(b.authority_tier)-authorityTierLevel(a.authority_tier))[0]||null
}
function generateAuthorityRequests(polityId){
 const p=politicalEntity(polityId),ctx=politicalContextForLocation(),liaison=authorityLiaisonFacility();if(!p||ctx.polity?.id!==polityId||!liaison)return [];return (DB.authority_request_archetypes||[]).map(t=>{const office=authorityRequestOffice(polityId,t);if(!office)return null;const q={id:`ARQ-${polityId}-${office.id}-${t.id}-${G.worldTime.day}`,templateId:t.id,name:`${office.title}・${t.name}`,tier:"F",type:"地方政務",description:`由${p.name}的${office.title}透過${DB.facilities[liaison]?.name||"地方聯絡處"}公開委託。`,objective:JSON.parse(JSON.stringify(t.objective)),reward:t.reward,xp_reward:DB.progression_system.quest_xp_by_tier.F,politicalEntityId:polityId,politicalAuthorityOfficeId:office.id,politicalStandingReward:t.standing,turninFacility:liaison,sourceType:"authority",sourceId:office.id};return questMarketAvailable(q)?q:null}).filter(Boolean)
}

function openAuthorityRequests(polityId){
 syncAllQuestInventoryProgress(true);const p=politicalEntity(polityId),ctx=politicalContextForLocation(),liaison=authorityLiaisonFacility(),here=ctx.polity?.id===polityId&&G.character.currentFacility===liaison;if(!p)return;
 const generated=generateAuthorityRequests(polityId),activeAuthority=(G.quests||[]).filter(x=>x.sourceType==="authority"&&x.politicalEntityId===polityId);
 const seen=new Set(generated.map(x=>`${x.sourceId}|${x.templateId}`));
 const restored=activeAuthority.filter(x=>!seen.has(`${x.sourceId}|${x.templateId}`)).map(x=>({
   id:x.id,templateId:x.templateId,name:x.name,tier:x.tier,type:x.type,description:x.description,objective:JSON.parse(JSON.stringify(x.objective||{})),
   reward:[x.rewardSilver,x.rewardSilver],xp_reward:x.xp_reward,politicalEntityId:x.politicalEntityId,politicalAuthorityOfficeId:x.politicalAuthorityOfficeId,
   politicalStandingReward:x.politicalStandingReward||2,turninFacility:x.turninFacility,sourceType:"authority",sourceId:x.sourceId,restored_active:true
 }));
 const rows=[...generated,...restored].map(q=>{const active=(G.quests||[]).find(x=>x.sourceType==="authority"&&x.sourceId===q.sourceId&&x.templateId===q.templateId),office=authorityOffice(polityId,q.sourceId),rr=adjustedRewardRange(q);const action=active?(active.status==="ready"&&here?`<button class="good" onclick="turnInQuest('${active.id}','authority','${polityId}')">回報完成</button>`:`<button disabled>${active.status==="ready"?`需到${DB.facilities[liaison]?.name||"聯絡處"}回報`:`進行中 ${active.progress||0}/${active.objective?.target||1}`}</button>`):`<button ${here?"":"disabled"} onclick="acceptAuthorityRequest('${polityId}','${q.sourceId}','${q.templateId}')">${here?"接受委託":`需在${DB.facilities[liaison]?.name||"聯絡處"}接洽`}</button>`;return `<div class="card"><b>${q.name}</b><br><span class="small">${office?.authority_tier}｜${q.description}<br>目標：${questObjectiveText(q)}｜報酬${rr[0]}–${rr[1]}銀／${q.xp_reward}XP｜地方政治聲望+${q.politicalStandingReward}｜${marketPressureText(q)}</span><div class="actions">${action}</div></div>`}).join("")||"<div class='card small'>目前沒有符合接觸層級與市場需求的地方政務委託。</div>";showModal(`${p.name}・地方政務`,`<div class="card small">目前政治聲望 ${politicalStanding(polityId)}｜最高可接觸 ${maxPoliticalAccessTier(polityId)}。完成採集／交付型政務時會實際扣除素材。</div>${rows}<div class="actions"><button onclick="openAuthorityHierarchy('${polityId}')">返回權力層級</button></div>`,`openAuthorityRequests(\'${polityId}\')`)
}

function acceptAuthorityRequest(polityId,officeId,templateId){
 const ctx=politicalContextForLocation(),liaison=authorityLiaisonFacility(),p=politicalEntity(polityId),o=authorityOffice(polityId,officeId),t=(DB.authority_request_archetypes||[]).find(x=>x.id===templateId);if(!p||!o||!t||ctx.polity?.id!==polityId||G.character.currentFacility!==liaison){alert("請到目前政治體的公開聯絡設施接洽。");return}if(!authorityOfficeAccessible(polityId,o)){alert("你的等級或地方政治聲望不足以接觸這個權位。");return}if((G.quests||[]).length>=DB.quest_system.max_active){alert(`同時最多接取 ${DB.quest_system.max_active} 個委託。`);return}if((G.quests||[]).some(q=>q.sourceType==="authority"&&q.sourceId===officeId&&q.templateId===templateId)){alert("同類政務委託已在進行。");return}const proto={tier:"F",objective:t.objective,reward:t.reward};if(!questMarketAvailable(proto)){alert("近期同類物資／獵物供應已飽和，地方暫停此委託。");return}closeModal();if(!beginTurn("接受地方政務委託"))return;const rr=adjustedRewardRange(proto),reward=randomInt(rr[0],rr[1]),timeLimit=Math.max(72,questTimeAllowance(t));const q={id:`AQ-${polityId}-${officeId}-${templateId}-${Date.now().toString(36).slice(-5)}`,templateId:t.id,name:`${o.title}・${t.name}`,tier:"F",type:"地方政務",description:`${p.name}的${o.title}透過地方聯絡處發布的委託。`,objective:JSON.parse(JSON.stringify(t.objective)),progress:0,status:"active",acceptedHour:totalHours(),deadlineHour:totalHours()+timeLimit,timeLimitHours:timeLimit,rewardSilver:reward,xp_reward:DB.progression_system.quest_xp_by_tier.F,completionGraceHours:24,turninFacility:liaison,sourceType:"authority",sourceId:o.id,politicalEntityId:polityId,politicalAuthorityOfficeId:o.id,politicalStandingReward:t.standing,viableLocationIds:t.objective.location_id?[t.objective.location_id]:[],marketFactorAtAcceptance:rr[2]};G.quests.push(q);syncQuestInventoryProgressOne(q,false);log("地方政務",`接受${p.name}・${o.title}的「${t.name}」。`,"ok");endTurn(.1);openAuthorityRequests(polityId)
}

function authorityConflictType(shared){
 if(shared.includes("AR-003"))return "稅役／徵召權爭議";
 if(shared.includes("AR-005"))return "司法管轄爭議";
 if(shared.includes("AR-002"))return "冊封／任命權爭議";
 if(shared.includes("AR-006"))return "宗教正統／加冕權爭議";
 if(shared.includes("AR-007"))return "奧術監管爭議";
 if(shared.includes("AR-008")||shared.includes("AR-011"))return "商路／城市特許爭議";
 if(shared.includes("AR-004"))return "軍事動員爭議";
 if(shared.includes("AR-009")||shared.includes("AR-012"))return "領域／傳統守護爭議";
 return "職權邊界爭議"
}
function evaluateAuthorityDynamics(){
 const sys=DB.authority_system;if(!sys||G.turn<=0||G.turn%sys.dynamic_check_every_turns!==0)return false;if(Math.random()>sys.dynamic_event_chance)return false;
 const prof=(DB.polity_authority_profiles||[])[rand((DB.polity_authority_profiles||[]).length)];if(!prof)return false;const pairs=[];
 for(let i=0;i<prof.office_nodes.length;i++)for(let j=i+1;j<prof.office_nodes.length;j++){const a=prof.office_nodes[i],b=prof.office_nodes[j],shared=(a.rights||[]).filter(x=>(b.rights||[]).includes(x));if(shared.length)pairs.push({a,b,shared})}
 if(!pairs.length)return false;const pair=pairs[rand(pairs.length)],type=authorityConflictType(pair.shared),polity=politicalEntity(prof.polity_id);
 G.worldState.authorityEvents=Array.isArray(G.worldState.authorityEvents)?G.worldState.authorityEvents:[];
 const last=G.worldState.authorityEvents.find(e=>e.polityId===prof.polity_id&&((e.a===pair.a.id&&e.b===pair.b.id)||(e.a===pair.b.id&&e.b===pair.a.id)));if(last&&G.turn-last.turn<48)return false;
 const ev={turn:G.turn,time:timeText(),polityId:prof.polity_id,a:pair.a.id,b:pair.b.id,type,sharedRights:pair.shared,summary:`${polity.name}的${pair.a.title}與${pair.b.title}出現「${type}」。`,severity:"地方／制度性"};
 G.worldState.authorityEvents.unshift(ev);if(G.worldState.authorityEvents.length>30)G.worldState.authorityEvents.length=30;
 emitIntegratedEvent("authority_conflict","polity",prof.polity_id,ev.summary,{officeA:pair.a.id,officeB:pair.b.id,type,sharedRights:pair.shared});
 log("權力動向",`${ev.summary} 目前仍屬制度內協商，不代表政權崩潰。`);return true
}
function dynamicAuthorityIntelRows(fid){
 if(!["guild","tavern","inn","church"].includes(fid))return [];const polityId=loc(G.character.locationId)?.political_entity_id;if(!polityId)return [];
 return (G.worldState.authorityEvents||[]).filter(e=>e.polityId===polityId).slice(0,6).map(e=>({
   id:`INT-AUTH-${e.turn}-${e.a}-${e.b}`,facility:fid,category:"地方權力動向",text:e.summary,reliability:fid==="guild"?86:72,reliability_label:fid==="guild"?"可靠":"可信",
   scope:"local_or_regional",tier_ceiling:"C",weight:2.6,source_type:fid==="guild"?"record":"witness",political_entity_id:polityId,political_authority_office_id:e.a,dynamic:true,
   source_ref:{type:"authority_event",id:`${e.turn}:${e.polityId}:${e.a}:${e.b}`}
 }))
}

function authorityProfileForPolity(id){return authorityProfile(id)}
function successionContextForPolity(id){
 const p=politicalEntity(id),profile=authorityProfile(id);if(!p||!profile)return null;
 const top=authorityOffice(id,profile.top_office_ids?.[0]),archetype=authorityArchetype(top?.authority_archetype_id);
 return {polity:p,profile,archetype}
}
function localAuthorityForLocation(id=G.character.locationId){const l=loc(id);return l?.local_authority||null}
function authorityInteractionForPlayer(id=G.character.locationId){
 const l=loc(id),p=politicalEntity(l?.political_entity_id),profile=authorityProfile(p?.id);if(!p||!profile)return null;
 const max=maxPoliticalAccessTier(p.id),layer=profile.office_nodes.filter(x=>authorityTierLevel(x.authority_tier)<=authorityTierLevel(max)).sort((a,b)=>authorityTierLevel(b.authority_tier)-authorityTierLevel(a.authority_tier))[0]||null;
 return {polity:p,layer,local:localAuthorityForLocation(id)}
}
function authorityRightsText(rights){return (rights||[]).map(x=>authorityRight(typeof x==='string'?x:x.id)?.name||x.name||x).join('、')||'—'}
function authorityRankLabel(n){return authorityTierInfo(`AUTH-${n}`)?.name||`權級${n}`}
function authorityLadderHtml(profile){
 return (profile?.office_nodes||[]).slice().sort((a,b)=>authorityTierLevel(b.authority_tier)-authorityTierLevel(a.authority_tier)).map(x=>`<div class="itemrow"><span><b>${x.title}</b>［${authorityTierInfo(x.authority_tier)?.name||x.authority_tier}］<br><span class="small">${x.scope||''}${x.appointment?`｜${x.appointment}`:''}<br>權能：${authorityRightsText(x.rights)}</span></span></div>`).join('')||"<div class='small'>沒有可顯示的權力鏈。</div>"
}
function openAuthorityArchetype(id){
 const a=authorityArchetype(id);if(!a)return;
 showModal(a.name,`<div class="card"><b>${a.name}</b> <span class="tier">${a.authority_tier}</span><br>${a.culture}｜${a.power_style||''}<br><span class="small">上位／承認：${a.succession_method}<br>管轄：${a.jurisdiction}</span></div>
 <div class="card"><b>象徵與下轄</b><div class="small">象徵：${(a.symbols||[]).join('、')}<br>常見下轄：${(a.subordinate_titles||[]).join('、')}</div></div>
 <div class="card"><b>玩家互動</b><div class="small">${a.player_interaction}<br><b>注意：</b>此權位不代表個人F–S戰鬥力。</div></div>
 <div class="actions"><button onclick="openLoreScope('authority_archetype','${a.id}','${a.name}・權力傳統')">歷史脈絡</button><button onclick="openAuthorityArchetypes()">上一頁</button></div>`)
}
function openPoliticalAuthorityCatalog(){return openAuthorityArchetypes()}
function openPolityAuthority(id){return openAuthorityHierarchy(id)}


function easternSwordTradition(id){return (DB.eastern_sword_traditions||[]).find(x=>x.id===id)}
function easternSwordFigure(id){return (DB.eastern_sword_figures||[]).find(x=>x.id===id)}
function notableFamily(id){return (DB.notable_families||[]).find(x=>x.id===id)}
function hiddenSwordSite(id){return (DB.hidden_sites||[]).find(x=>x.id===id)}
function easternSwordTechnique(id){return (DB.eastern_sword_techniques||[]).find(x=>x.id===id)}
function raikoKnown(){return disciplineState().discovered.includes("DSC-PHY-31")||loreFor("discipline","DSC-PHY-31").some(x=>knownLore().includes(x.id))}
function easternTraditionVisible(t){if(!t)return false;if(t.id==="EST-RAIKO")return raikoKnown();return !String(t.visibility||"").includes("hidden")}
function easternFigureVisible(f){if(!f)return false;if(f.id==="FIG-RAIKO-FIFTH")return false;if(raikoKnown())return true;return ["public_adventurer","regional_public"].includes(f.visibility)}
function raikoTechniqueEligibility(id){
 const t=easternSwordTechnique(id);if(!t)return {ok:false,reason:"技法不存在"};
 if(!raikoKnown())return {ok:false,reason:"尚未取得雷煌流正式傳承來源"};
 if((G.character.level||1)<t.min_level)return {ok:false,reason:`需要Lv${t.min_level}`};
 if(disciplineMastery("DSC-PHY-31")<(t.min_discipline_mastery||0))return {ok:false,reason:`雷煌流研習度需${t.min_discipline_mastery}%`};
 if(t.requires_douqi&&tierOrder(G.character.combatGrade||"F")<tierOrder("C"))return {ok:false,reason:"尚未達到可運用鬥氣的戰鬥階級"};
 if(id==="EST-SK-RAIKO-06"&&tierOrder(G.character.combatGrade||"F")<tierOrder("A"))return {ok:false,reason:"雷殛需要A級劍術境界與鬥氣控制"};
 return {ok:true,reason:"符合研習前置條件；仍需正式師承與技能欄位空間"}
}
function openEasternSwordTraditions(){
 const visible=(DB.eastern_sword_traditions||[]).filter(easternTraditionVisible);
 const rows=visible.map(t=>`<div class="itemrow"><span><b>${t.name}</b>［${t.status}］<br><span class="small">${t.style}<br>${t.aliases?.length?`別稱／舊稱：${t.aliases.join("、")}`:""}</span></span><button onclick="openEasternSwordTradition('${t.id}')">查看</button></div>`).join("");
 showModal("東方劍術傳承",`<div class="card small">CURRENT固定階級：F見習劍客 → E正式劍客 → D高級劍客 → C資深劍客 → B劍豪 → A劍聖 → S劍聖（資深）。「新晉／資深」可作同階資歷描述，不改變正式階級。</div>${rows}<div class="actions"><button onclick="openWorldLore()">返回世界誌</button></div>`)
}
function openEasternSwordTradition(id){
 const t=easternSwordTradition(id);if(!t||!easternTraditionVisible(t))return;
 const rels=(DB.eastern_sword_relations||[]).filter(r=>r.a===id||r.b===id).map(r=>{const other=r.a===id?r.b:r.a;const o=easternSwordTradition(other)||notableFamily(other);return `<div class="small">${o?.name||other}：${r.type}｜${r.reason}</div>`}).join("")||"<div class='small'>暫無公開關係記錄。</div>";
 const figs=(t.known_figures||[]).map(easternSwordFigure).filter(easternFigureVisible).map(f=>`<button onclick="openEasternSwordFigure('${f.id}')">${f.name}</button>`).join("");
 const extra=id==="EST-RAIKO"?`<div class="card"><b>秘技結構</b><br>${(DB.eastern_sword_techniques||[]).filter(x=>x.tradition_id===id).filter(x=>x.visibility!=="core_secret"||raikoKnown()).map(x=>`<span class="discipline-tag">${x.name}［${x.tier}］</span>`).join(" ")}<br><span class="small">心眼不是全知；雷殛需要A級境界與鬥氣。</span></div>`:"";
 showModal(t.name,`<div class="card"><b>${t.name}</b>｜${t.status}<br><span class="small">${t.history}<br><br>${t.style}</span></div><div class="card"><b>關係</b>${rels}</div>${extra}${figs?`<div class="card"><b>可查人物</b><div class="actions">${figs}</div></div>`:""}<div class="actions"><button onclick="openLoreScope('${t.id==='EST-RAIKO'?'discipline':'tradition'}','${t.id==='EST-RAIKO'?'DSC-PHY-31':t.id}','${t.name}・歷史')">世界誌記錄</button><button onclick="openEasternSwordTraditions()">上一頁</button></div>`)
}
function openEasternSwordFigure(id){
 const f=easternSwordFigure(id);if(!f||!easternFigureVisible(f))return;
 const tier=f.combat_tier?`${f.combat_tier}級${f.eastern_rank||f.class_label||""}${f.rank_seniority?`（資歷：${f.rank_seniority}）`:""}`:(f.class_label||"資料未公開");
 const weapon=(DB.named_weapons||[]).find(x=>x.id===f.weapon_id),fam=notableFamily(f.family_id);
 showModal(f.name,`<div class="card"><b>${f.name}</b>${f.aliases?.length?`｜${f.aliases.join("／")}`:""}<br>${tier}<br><span class="small">${fam?`家系：${fam.name}<br>`:""}${weapon?`持有：${weapon.name}［${weapon.tier}］<br>`:""}現況：${f.current_status||"未公開"}</span></div><div class="card"><b>經歷</b><br><span class="small">${(f.history||[]).join("<br>")}</span></div><div class="card"><b>人物</b><br><span class="small">${f.personality||"資料未公開"}</span></div><div class="actions"><button onclick="openEasternSwordTraditions()">返回東方劍術</button></div>`)
}
function disciplineFor(id){return IDX.discipline.get(DB.discipline_merge_map?.[id]||id)}
function allCanonicalNames(){
 const arr=[];for(const key of ["political_entities","world_regions","locations","world_organizations","discipline_factions","faith_entities","deities","combat_classes","monsters","talents","s_tier_combatants"])for(const x of (DB[key]||[]))if(x?.name)arr.push(x.name);return arr
}
function validateGeneratedName(name,type="person",culture="asdale_west"){
 const s=String(name||"").trim();if(!s)return {ok:false,reason:"空白名稱"};
 if(s.length>14)return {ok:false,reason:"名稱過長"};
 if(/[A-Za-z_]{3,}/.test(s))return {ok:false,reason:"含現代代碼或英文識別字"};
 if(["專案","模組","系統AI","研究所","處理器"].some(x=>s.includes(x)))return {ok:false,reason:"現代術語"};
 if(type==="person"&&/(.)\1/.test(s))return {ok:false,reason:"連續重字"};
 if(type==="person"&&s.length>=3&&new Set([...s]).size<2)return {ok:false,reason:"音節過度重複"};
 if(type==="person"&&s.length>=3&&s[0]===s[s.length-1])return {ok:false,reason:"首尾重音"};
 if(allCanonicalNames().includes(s))return {ok:false,reason:"與CURRENT正式名稱重複"};
 return {ok:true,reason:"通過NAME-AI-1.0"};
}
function generateWorldName(type="person",culture="asdale_west",context={}){
 const p=DB.naming_ai?.culture_sound_profiles?.[culture]||DB.naming_ai?.culture_sound_profiles?.asdale_west||{};
 const roots=p.place_roots||["河","石","林","灣"];
 const used=new Set([...(context?.usedNames||[]),...allCanonicalNames()]);
 for(let n=0;n<60;n++){
   let v="";
   if(type==="settlement"){
     v=roots[rand(roots.length)]+["城","鎮","村","港","堡"][rand(5)];
   }else{
     const parts=p.person_parts;
     if(parts?.start?.length&&parts?.end?.length){
       const a=parts.start[rand(parts.start.length)];
       const b=(parts.middle?.length&&Math.random()<0.72)?parts.middle[rand(parts.middle.length)]:"";
       const c=parts.end[rand(parts.end.length)];
       v=a+b+c;
     }else{
       const syl=p.syllables||["阿","洛","維","爾","恩","德"];
       const count=2+rand(2);
       for(let i=0;i<count;i++)v+=syl[rand(syl.length)];
     }
   }
   if(used.has(v))continue;
   const chk=validateGeneratedName(v,type,culture);
   if(chk.ok)return v;
 }
 return type==="settlement"?"河灣鎮":"洛恩";
}
function disciplineState(){
 const c=G.character;
 c.disciplines=c.disciplines||{discovered:[],mastery:{},reputation:{},membershipId:null};
 c.disciplines.discovered=Array.isArray(c.disciplines.discovered)?c.disciplines.discovered:[];
 c.disciplines.mastery=c.disciplines.mastery||{};
 c.disciplines.reputation=c.disciplines.reputation||{};
 if(!c.disciplines.membershipId||!disciplineFor(c.disciplines.membershipId))c.disciplines.membershipId=null;
 return c.disciplines
}
function disciplineMastery(id){return clamp(Number(disciplineState().mastery[id]||0),0,100)}
function disciplineRep(id){return clamp(Number(disciplineState().reputation[id]||0),-100,100)}
function discoverDiscipline(id,source="接觸"){
 const d=disciplineFor(id);if(!d)return false;const s=disciplineState();
 if(!s.discovered.includes(id)){s.discovered.push(id);discoverScopeLore("discipline",id,source);log("流派",`你得知「${d.name}」的正式傳承資料。`,"ok");return true}
 return false
}
function disciplineTrackLabel(d){return d?.track==="physical"?"物理系":"魔法系"}
function disciplineKindLabel(d){
 const m={academy:"學院",school:"劍館／流派",knightly_order:"騎士團",martial_order:"武技結社",military_corps:"軍團",marksman_guild:"射手會",monastic_school:"修院",martial_circle:"武鬥會",mage_council:"法師議會",conclave:"術士結社",arcane_school:"術法學院",guild:"公會",arcane_guild:"術法公會",mage_tower:"法師塔",tower:"術塔",arcane_troupe:"幻術團",specialist_order:"專門修會"};
 return m[d?.kind]||String(d?.kind||"").replaceAll("_"," ")
}
function disciplineContactsHere(fid=null){
 const lid=G.character.locationId;
 return (DB.discipline_factions||[]).filter(d=>d.contact_location_ids?.includes(lid)&&(!fid||d.primary_facility===fid))
}
function disciplineClassCompatible(d){
 const c=G.character,cc=cls(c.classId);
 if(d.related_class_ids?.includes(c.classId))return true;
 const track=cc?.combat_track_label||combatTrackText(cc);
 return d.track==="physical"?track==="物理系":track==="魔法系"||track==="魔武雙修"
}
function disciplineStudyReason(d){
 if(!d)return "流派不存在";
 if(!d.contact_location_ids?.includes(G.character.locationId))return "目前所在地沒有正式接觸點";
 if(G.character.currentFacility!==d.primary_facility)return `需在${DB.facilities[d.primary_facility]?.name||d.primary_facility}接洽`;
 if((G.character.level||1)<d.min_level)return `角色等級需達Lv${d.min_level}`;
 if(!disciplineClassCompatible(d))return "目前戰鬥職業與此流派訓練方向不相容";
 return ""
}
function disciplineStudyCost(d){
 return Math.max(3,Math.round((DB.discipline_system?.base_study_cost_silver||4)+Math.min(8,d.min_level/8)+tierOrder(d.training_tier_ceiling||"F")))
}
function disciplineMasteryLabel(v){
 return v>=75?"核心門人":v>=50?"進階研習":v>=25?"正式研習":v>=10?"基礎研習":v>0?"入門觀摩":"未研習"
}
function openDisciplineDirectory(track="all",fid=null){
 const discovered=new Set(disciplineState().discovered||[]),visible=d=>(d.discovery!=="hidden_restricted"||discovered.has(d.id));
 const all=(DB.discipline_factions||[]).filter(d=>visible(d)&&(track==="all"||d.track===track)&&(!fid||d.primary_facility===fid));
 const here=all.filter(d=>d.contact_location_ids?.includes(G.character.locationId));
 for(const d of here)if(d.discovery==="public")discoverDiscipline(d.id,"地方流派名錄");
 const body=(fid?here:all).map(d=>{const known=discovered.has(d.id),m=disciplineMastery(d.id),locs=(d.contact_location_ids||[]).map(id=>loc(id)?.name||id).join("、")||"非公開";
   return `<div class="itemrow"><span><b>${disciplineState().membershipId===d.id?"★ ":""}${d.name}</b>［${disciplineTrackLabel(d)}］<br><span class="small">${disciplineKindLabel(d)}｜${d.specialty}<br>接觸點：${locs}${d.substyles?.length?`<br>分支：${d.substyles.join("、")}`:""}${known?`<br>研習：${disciplineMasteryLabel(m)} ${m.toFixed(1)}%`:""}${disciplineState().membershipId===d.id?`<br>加成生效：${affiliationBonusText(d.member_bonus)}`:""}</span></span><button onclick="openDiscipline('${d.id}')">查看</button></div>`
 }).join("")||"<div class='card small'>目前沒有符合條件的流派接觸點。</div>";
 const pc=(DB.discipline_factions||[]).filter(x=>x.track==="physical").length,mc=(DB.discipline_factions||[]).filter(x=>x.track==="magic").length;
 const title=fid?`${DB.facilities[fid]?.name||"設施"}・流派`:"武技／魔法流派";
 showModal(title,`<div class="actions"><button onclick="openDisciplineDirectory('physical',${fid?`'${fid}'`:"null"})">物理系${pc}</button><button onclick="openDisciplineDirectory('magic',${fid?`'${fid}'`:"null"})">魔法系${mc}</button><button onclick="openDisciplineDirectory('all',${fid?`'${fid}'`:"null"})">全部</button></div>${body}${fid?`<div class="actions"><button onclick="renderFacility('${fid}')">返回設施</button></div>`:`<div class="actions"><button onclick="openCharacter()">返回角色</button></div>`}`)
}

function canJoinDiscipline(d){
 if(!d)return {ok:false,reason:"流派不存在"};
 const s=disciplineState(),active=s.membershipId;
 if(active===d.id)return {ok:false,reason:"已加入"};
 if(active&&active!==d.id)return {ok:false,reason:`需先退出${disciplineFor(active)?.name||"目前流派"}`};
 if(!s.discovered.includes(d.id))return {ok:false,reason:"尚未取得正式接觸"};
 const reason=disciplineStudyReason(d);if(reason)return {ok:false,reason};
 const need=DB.discipline_bonus_system?.minimum_mastery_to_join||10;
 if(disciplineMastery(d.id)<need)return {ok:false,reason:`基礎研習需達${need}%`};
 return {ok:true,reason:""}
}
function joinDiscipline(id){
 const d=disciplineFor(id),gate=canJoinDiscipline(d);if(!gate.ok){alert(gate.reason);return}
 disciplineState().membershipId=d.id;persist();
 log("流派",`你正式加入${d.name}，啟用「${d.member_bonus?.name||"流派加成"}」：${affiliationBonusText(d.member_bonus)}。`,"ok");openDiscipline(id)
}
function leaveDiscipline(id){
 const d=disciplineFor(id),s=disciplineState();if(s.membershipId!==id||!confirm(`確定退出${d.name}？退出後將立即失去流派加成。`))return;
 s.membershipId=null;persist();log("流派",`你退出${d.name}，「${d.member_bonus?.name||"流派加成"}」已取消。`);openDiscipline(id)
}
function openDiscipline(id){
 const d=disciplineFor(id);if(!d)return;if(d.discovery==="hidden_restricted"&&!disciplineState().discovered.includes(id)){alert("你目前沒有可靠來源能確認這個流派。");return}discoverDiscipline(id,"查閱流派");
 const m=disciplineMastery(id),rep=disciplineRep(id),reason=disciplineStudyReason(d),cost=disciplineStudyCost(d),s=disciplineState(),member=s.membershipId===id,joinGate=canJoinDiscipline(d);
 const orgName=d.parent_org_id?worldOrg(d.parent_org_id)?.name:"獨立傳承";
 const clsNames=(d.related_class_ids||[]).map(x=>cls(x)?.name||x).slice(0,8).join("、"),b=d.member_bonus;
 showModal(d.name,`<div class="card"><b>${d.name}</b>［${disciplineTrackLabel(d)}］<br>${disciplineKindLabel(d)}｜${d.family}<br><span class="small">隸屬／合作：${orgName}<br>最早紀錄：群陸紀元${d.first_attested_year}年前後<br>${d.historical_origin}</span></div>
 <div class="card"><b>流派加成｜${b?.name||"未設定"}</b><br><span class="small">${affiliationBonusText(b)}<br>${member?"目前生效中；退出流派後立即取消。":"正式加入後生效；角色同時只能加入一個流派。"}</span></div>
 <div class="card"><b>教範</b><br><span class="small">${d.specialty}<br>${d.institutional_culture}${d.substyles?.length?`<br>內部分支：${d.substyles.join("、")}`:""}<br>相關職業：${clsNames||"依個別師承判定"}<br>訓練內容上限：${d.training_tier_ceiling}</span></div>
 <div class="card"><b>你的進度</b><br>${disciplineMasteryLabel(m)} ${m.toFixed(1)}%｜流派聲望 ${rep}<br><span class="small">${reason?`目前不可研習：${reason}`:`可進行基礎研習，費用${cost}銀／${DB.discipline_system.study_hours}小時。`}<br>正式加入條件：基礎研習${DB.discipline_bonus_system?.minimum_mastery_to_join||10}%以上；研習不會直接授予C級以上裝備或跳過技能學習條件。</span></div>
 <div class="actions"><button ${reason?"disabled":""} class="good" onclick="studyDiscipline('${id}')">研習</button>${member?`<button class="bad" onclick="leaveDiscipline('${id}')">退出流派</button>`:`<button ${joinGate.ok?"":"disabled"} onclick="joinDiscipline('${id}')">${joinGate.ok?"正式加入":joinGate.reason}</button>`}<button onclick="openLoreScope('discipline','${id}','${d.name}・沿革')">歷史脈絡</button><button onclick="openDisciplineDirectory('${d.track}',${G.character.currentFacility?`'${G.character.currentFacility}'`:"null"})">上一頁</button></div>`)
}
function studyDiscipline(id){
 const d=disciplineFor(id),reason=disciplineStudyReason(d);if(!d||reason){alert(reason||"目前無法研習。");return}
 const cost=disciplineStudyCost(d);if(G.character.moneySilver<cost){alert(`需要${cost}銀。`);return}
 closeModal();if(!beginTurn(`研習流派：${d.name}`))return;
 G.character.moneySilver-=cost;const s=disciplineState(),before=disciplineMastery(id),gain=1.1+Math.random()*.9;
 s.mastery[id]=clamp(before+gain,0,100);s.reputation[id]=clamp((s.reputation[id]||0)+(before<10?1:0),-100,100);
 gainClassMastery(.15);
 log("流派研習",`${d.name}研習度 ${before.toFixed(1)}% → ${s.mastery[id].toFixed(1)}%；花費${cost}銀。`,"ok");
 if(before<10&&s.mastery[id]>=10)log("流派",`你完成${d.name}的基礎研習階段。這代表傳承理解提升，不等於自動學會新技能。`,"ok");
 endTurn(DB.discipline_system.study_hours||.75)
}
function disciplineRelation(a,b){
 return (DB.discipline_relations||[]).find(r=>(r.a===a&&r.b===b)||(r.a===b&&r.b===a))||null
}
function disciplineEventType(r){
 if((r?.score||0)>=35)return ["公開演武","教範交流","聯合護送","講師互訪"][rand(4)];
 if((r?.score||0)<=-20)return ["招生爭議","教範論戰","競技挑戰","師承資格爭議"][rand(4)];
 return ["公開演武","學術討論","訓練交流","招生活動"][rand(4)]
}
function evaluateDisciplineDynamics(){
 const sys=DB.discipline_system;if(!sys||G.turn<=0||G.turn%sys.dynamic_check_every_turns!==0)return false;
 if(Math.random()>sys.dynamic_event_chance)return false;
 const rels=(DB.discipline_relations||[]).filter(r=>r.visibility!=="restricted"||raikoKnown());if(!rels.length)return false;
 const r=rels[rand(rels.length)],a=disciplineFor(r.a),b=disciplineFor(r.b);if(!a||!b)return false;
 G.worldState.disciplineEvents=Array.isArray(G.worldState.disciplineEvents)?G.worldState.disciplineEvents:[];
 const last=G.worldState.disciplineEvents.find(e=>(e.a===r.a&&e.b===r.b)||(e.a===r.b&&e.b===r.a));if(last&&G.turn-last.turn<54)return false;
 const common=a.contact_location_ids.find(x=>b.contact_location_ids.includes(x)),locationId=common||a.contact_location_ids[0]||b.contact_location_ids[0];
 const type=disciplineEventType(r),ev={turn:G.turn,time:timeText(),a:r.a,b:r.b,locationId,type,score:r.score,
   summary:`${a.name}與${b.name}在${loc(locationId)?.name||"某地"}出現「${type}」。`,severity:"低中強度"};
 G.worldState.disciplineEvents.unshift(ev);if(G.worldState.disciplineEvents.length>30)G.worldState.disciplineEvents.length=30;
 emitIntegratedEvent("discipline_event","discipline",r.a,ev.summary,{otherDisciplineId:r.b,locationId,type,score:r.score});
 if(locationId===G.character.locationId)log("流派動向",ev.summary);
 return true
}
function dynamicDisciplineIntelRows(fid){
 const lid=G.character.locationId;
 return (G.worldState.disciplineEvents||[]).filter(e=>e.locationId===lid).filter(e=>raikoKnown()||(e.a!=="DSC-PHY-31"&&e.b!=="DSC-PHY-31")).slice(0,6).filter(e=>{
   const a=disciplineFor(e.a),b=disciplineFor(e.b);return a?.primary_facility===fid||b?.primary_facility===fid||fid==="tavern"||fid==="guild"
 }).map(e=>({
   id:`INT-DSC-${e.turn}-${e.a}-${e.b}`,facility:fid,category:"流派動向",text:e.summary,
   reliability:fid==="guild"||fid==="mageguild"?86:72,reliability_label:fid==="guild"||fid==="mageguild"?"可靠":"可信",
   scope:"local_or_regional",tier_ceiling:"C",weight:2.2,source_type:fid==="tavern"?"witness":"record",
   discipline_id:e.a,dynamic:true,source_ref:{type:"discipline_event",id:`${e.turn}:${e.a}:${e.b}`}
 }))
}

function sTierCombatant(id){return IDX.sTier.get(id)||null}
function sTierRelationsFor(id){return (DB.s_tier_relations||[]).filter(r=>r.a===id||r.b===id)}
function sTierKnown(id){return loreFor("s_tier_combatant",id).some(r=>knownLore().includes(r.id))}
function sTierVisible(x){return !!x&&(x.visibility==="public_legend"||sTierKnown(x.id))}
function sTierPublicName(x){return sTierVisible(x)?x.name:"未公開世界級戰力"}
function sTierRelationName(ref){
 const s=sTierCombatant(ref);if(s)return sTierPublicName(s);
 const f=typeof easternSwordFigure==="function"?easternSwordFigure(ref):null;return f?f.name:ref
}
function openSTierRegistry(){
 const visible=(DB.s_tier_combatants||[]).filter(sTierVisible);
 const rows=visible.map(x=>{
   const p=politicalEntity(x.primary_polity_id),r=worldRegion(x.current_region_id);
   return `<div class="itemrow"><span><b>${x.name}</b>｜${x.epithet} <span class="tier">S</span><br><span class="small">${x.species_label}｜${x.combat_class_name||"自然／特殊戰力"}${p?`｜${p.name}`:"｜無固定政治歸屬"}${r?`｜${r.name}`:""}</span></span><button onclick="openSTierCombatant('${x.id}')">查看</button></div>`
 }).join("")||"<div class='card small'>目前角色沒有足夠情報可辨識任何S級人物。</div>";
 showModal("S級世界戰力名錄",`<div class="card"><b>S-POWER-1.0</b><br><span class="small">世界硬上限40；CURRENT確認30名，另有10個永久保留空白席位。政治權位、冒險者等級與S級戰力彼此獨立。低階角色只會看到公開傳說或已取得情報的人物。</span></div>${rows}<div class="actions"><button onclick="openWorldLore()">返回世界誌</button></div>`)
}
function openSTierCombatant(id){
 const x=sTierCombatant(id);if(!x||!sTierVisible(x))return;
 const p=politicalEntity(x.primary_polity_id),r=worldRegion(x.current_region_id),rels=sTierRelationsFor(id).filter(rel=>{
   if(rel.visibility==="public")return true;
   const other=rel.a===id?rel.b:rel.a;return sTierCombatant(other)?sTierKnown(other):knownLore().some(lid=>loreRecord(lid)?.source_refs?.includes(other))
 });
 const orgs=(x.organization_links||[]).map(o=>`<div class="small">${o.organization_name}｜${o.role}｜${o.control}</div>`).join("")||"<div class='small'>沒有固定所轄或隸屬組織。</div>";
 const hist=(x.history||[]).filter(ev=>x.visibility==="public_legend"||sTierKnown(id)).map(ev=>`<div class="small">${ev.year}年｜<b>${ev.title}</b>：${ev.text}</div>`).join("")||"<div class='small'>詳細歷史尚未取得。</div>";
 const rr=rels.map(rel=>{const other=rel.a===id?rel.b:rel.a;return `<div class="small">${sTierRelationName(other)}｜${rel.type}｜${rel.summary}</div>`}).join("")||"<div class='small'>目前沒有可公開的人際關係紀錄。</div>";
 showModal(`${x.name}｜${x.epithet}`,`<div class="card"><b>${x.name}</b> <span class="tier">S</span><br>${x.epithet}<br><span class="small">${x.species_label}｜${x.combat_class_name||"自然／特殊戰力"}${x.formal_class_tier?`［${x.formal_class_tier}職業］`:""}${p?`｜${p.name}`:"｜無固定政治歸屬"}${r?`｜${r.name}`:""}<br>${x.s_rank_path}</span></div>
 <div class="card"><b>背景與現況</b><p>${x.background}</p><span class="small">性格：${x.temperament}<br>目前目標：${x.current_goal}<br>明確限制：${x.known_limitations}</span></div>
 <div class="card"><b>組織關係</b>${orgs}</div>
 <div class="card"><b>歷史</b>${hist}</div>
 <div class="card"><b>人際關係</b>${rr}</div>
 <div class="card"><b>世界影響</b><br><span class="small">${(x.world_impact||[]).join("<br>")||"尚無公開資料。"}${x.public_rumor?`<br><br>民間傳聞：${x.public_rumor}`:""}</span></div>
 <div class="actions"><button onclick="openLoreScope('s_tier_combatant','${x.id}','${x.name}・世界誌')">世界誌紀錄</button><button onclick="openSTierRegistry()">返回名錄</button></div>`)
}
function evaluateSTierInfluence(){
 const sys=DB.s_tier_power_system;if(!sys||G.turn<=0||G.turn%120!==0)return false;
 if(Math.random()>.035)return false;
 const publicRels=(DB.s_tier_relations||[]).filter(r=>r.visibility==="public"&&sTierCombatant(r.a)&&sTierCombatant(r.b));
 if(!publicRels.length)return false;
 const rel=publicRels[rand(publicRels.length)],a=sTierCombatant(rel.a),b=sTierCombatant(rel.b);
 G.worldState.sTierEvents=Array.isArray(G.worldState.sTierEvents)?G.worldState.sTierEvents:[];
 const last=G.worldState.sTierEvents.find(e=>(e.a===rel.a&&e.b===rel.b)||(e.a===rel.b&&e.b===rel.a));
 if(last&&G.turn-last.turn<240)return false;
 const ev={turn:G.turn,time:timeText(),a:rel.a,b:rel.b,type:"distant_influence",
   summary:`遠方消息提到${a.name}與${b.name}相關勢力近期因既有關係而有所往來。`,severity:"indirect"};
 G.worldState.sTierEvents.unshift(ev);if(G.worldState.sTierEvents.length>20)G.worldState.sTierEvents.length=20;
 emitIntegratedEvent("s_tier_influence","world_power",rel.a,ev.summary,{otherId:rel.b,relationId:rel.id});
 return true
}
function loreFor(scopeType,scopeId){return (DB.lore_query_index?.[`${scopeType}:${scopeId}`]||[]).map(loreRecord).filter(Boolean)}
function loreVerificationLabel(v){return {current:"CURRENT狀態",recorded:"正式紀錄",multi_source:"多來源印證",oral_tradition:"口述傳承",mythic_tradition:"神話傳承",contested:"有爭議"}[v]||v}
function starterLoreForCharacter(raceId,classId){
 const ids=[...(DB.lore_system?.starter_common_record_ids||[])];
 ids.push(...loreFor("race",raceId).map(x=>x.id),...loreFor("class",classId).map(x=>x.id));
 ids.push(...loreFor("region","REG-18").filter(x=>x.common_knowledge).map(x=>x.id));
 ids.push(...loreFor("polity","POL-018").map(x=>x.id));
 ids.push(...loreFor("location","L-WILLOW").map(x=>x.id),...loreFor("location","L-LOVEN").filter(x=>x.common_knowledge).map(x=>x.id));
 return [...new Set(ids)].slice(0,300)
}
function knownLore(){G.character.knownLoreIds=Array.isArray(G.character.knownLoreIds)?G.character.knownLoreIds:[];return G.character.knownLoreIds}
function loreVisible(r){
 if(!r)return false;
 if(r.common_knowledge||knownLore().includes(r.id))return true;
 if(r.scope_type==="discipline"){const d=disciplineFor(r.scope_id);return !!d&&(d.discovery!=="hidden_restricted"||disciplineState().discovered.includes(d.id))}
 if(r.scope_type==="tradition"){const t=easternSwordTradition(r.scope_id);return !!t&&easternTraditionVisible(t)}
 if(r.scope_type==="family"){const f=notableFamily(r.scope_id);return !!f&&!String(f.visibility||"").startsWith("restricted")}
 if(r.scope_type==="eastern_sword_figure"){return easternFigureVisible(easternSwordFigure(r.scope_id))}
 if(r.scope_type==="hidden_site"||r.scope_type==="bloodline")return knownLore().includes(r.id);
 if(r.scope_type==="s_tier_combatant"){const s=sTierCombatant(r.scope_id);return !!s&&(r.common_knowledge||knownLore().includes(r.id));}
 if(["world","race","pantheon","class","class_tradition","polity","culture","region","authority","authority_archetype"].includes(r.scope_type))return true;
 if(r.scope_type==="organization"){const o=worldOrg(r.scope_id);return !!o&&(publicOrganization(o)||orgState().discovered.includes(o.id))}
 if(r.scope_type==="faith_entity"){const e=faithEntity(r.scope_id);return !!e&&!["hidden","forbidden"].includes(e.visibility)}
 if(r.scope_type==="location")return r.scope_id===G.character.locationId;
 return false
}
function discoverLore(ids,source="探索"){
 const k=knownLore();let added=0;
 for(const id of ids||[]){if(loreRecord(id)&&!k.includes(id)){k.push(id);added++}}
 if(k.length>300)G.character.knownLoreIds=k.slice(-300);
 if(added)emitIntegratedEvent("lore_discovered","lore",source,`新增${added}筆可查詢世界誌記錄`,{count:added});
 return added
}
function discoverScopeLore(type,id,source="探索"){return discoverLore(loreFor(type,id).map(x=>x.id),source)}
function loreCards(records,backFn="openWorldLore()"){
 const rows=records.filter(loreVisible).map(r=>`<div class="card"><b>${r.title}</b><br><span class="small">${loreVerificationLabel(r.verification)}｜${r.era_id}</span><p>${r.text}</p><div class="small">來源：${(r.source_refs||[]).join("、")||"CURRENT資料庫"}</div></div>`).join("")||"<div class='card small'>目前沒有角色可查閱的可靠記錄。</div>";
 return rows+`<div class="actions"><button onclick="${backFn}">上一頁</button></div>`
}
function openLoreScope(type,id,title){
 const records=loreFor(type,id);showModal(title||"世界誌",loreCards(records))
}

function historyEvent(id){return IDX.historyEvent.get(id)||null}
function historySubperiod(id){return IDX.historySubperiod.get(id)||null}
function historyChainFor(id){return IDX.historyChain.get(id)||null}
function historicalDispute(id){return IDX.historicalDispute.get(id)||null}
function historyEventVisible(e){return !!e&&(e.visibility!=="restricted"||knownLore().includes(e.lore_record_id))}
function historyChainVisible(c){return !!c&&(c.visibility!=="restricted"||(c.event_ids||[]).some(id=>historyEventVisible(historyEvent(id))))}
function historyDisputeVisible(d){return !!d&&(d.visibility!=="restricted"||knownLore().includes(d.lore_record_id))}
function historyForEntity(ref){return (DB.history_entity_index?.[ref]||[]).map(historyEvent).filter(Boolean)}
function historyRefLabel(ref){
 const p=politicalEntity(ref);if(p)return p.name;const rp=regionalPower(ref);if(rp)return rp.name;
 const rg=worldRegion(ref);if(rg)return rg.name;
 const o=organization(ref);if(o)return o.name;
 const rc=DB.races?.find(x=>x.id===ref);if(rc)return rc.name;
 const pt=DB.pantheons?.find(x=>x.id===ref);if(pt)return pt.name;
 const d=disciplineFor(ref);if(d)return d.name;
 const et=DB.eastern_sword_traditions?.find(x=>x.id===ref);if(et)return et.name;
 const f=DB.eastern_sword_figures?.find(x=>x.id===ref);if(f)return f.name;
 const s=sTierCombatant(ref);if(s)return sTierVisible(s)?s.name:"未公開世界級人物";
 return ref
}
function openHistoricalEvent(id){
 const e=historyEvent(id);if(!historyEventVisible(e))return;
 const causes=(e.cause_ids||[]).map(historyEvent).filter(historyEventVisible).map(x=>`<button onclick="openHistoricalEvent('${x.id}')">${x.year} ${x.title}</button>`).join("")||"<span class='small'>沒有已確認的直接前置事件。</span>";
 const effects=(e.consequence_ids||[]).map(historyEvent).filter(historyEventVisible).map(x=>`<button onclick="openHistoricalEvent('${x.id}')">${x.year} ${x.title}</button>`).join("")||"<span class='small'>沒有已確認的直接後續事件。</span>";
 const refs=(e.affected_refs||[]).map(historyRefLabel).filter(Boolean).join("、")||"—";
 const per=historySubperiod(e.subperiod_id),era=(DB.historical_eras||[]).find(x=>x.id===e.era_id);
 showModal(`${e.year}年｜${e.title}`,`<div class="card"><b>${e.title}</b><br><span class="small">${loreVerificationLabel(e.verification)}｜${era?.name||e.era_id}／${per?.name||e.subperiod_id}</span><p>${e.summary}</p><span class="small">影響：${refs}</span></div>
 <div class="card"><b>前置原因</b><div class="actions">${causes}</div></div>
 <div class="card"><b>後續影響</b><div class="actions">${effects}</div></div>
 <div class="actions"><button onclick="openLoreChronology()">返回年表</button></div>`)
}
function openHistoricalPeriods(){
 const rows=(DB.historical_subperiods||[]).map(x=>`<div class="itemrow"><span><b>${x.name}</b>｜${x.start_year}～${x.end_year}<br><span class="small">${x.summary}</span></span><button onclick="openHistoricalPeriod('${x.id}')">查看</button></div>`).join("");
 showModal("世界史細分時期",rows+`<div class="actions"><button onclick="openLoreChronology()">返回年表</button></div>`)
}
function openHistoricalPeriod(id){
 const p=historySubperiod(id);if(!p)return;
 const rows=(DB.history_entity_index?.[id]||[]).map(historyEvent).filter(historyEventVisible).map(e=>`<div class="itemrow"><span><b>${e.year}年｜${e.title}</b><br><span class="small">${loreVerificationLabel(e.verification)}｜${e.summary}</span></span><button onclick="openHistoricalEvent('${e.id}')">查看</button></div>`).join("");
 showModal(p.name,`<div class="card small">${p.start_year}～${p.end_year}｜${p.summary}</div>${rows}<div class="actions"><button onclick="openHistoricalPeriods()">返回分期</button></div>`)
}
function openHistoricalChains(){
 const rows=(DB.historical_causal_chains||[]).filter(historyChainVisible).map(c=>`<div class="itemrow"><span><b>${c.name}</b><br><span class="small">${c.theme}｜CURRENT：${c.current_effect}</span></span><button onclick="openHistoricalChain('${c.id}')">查看</button></div>`).join("");
 showModal("世界史因果脈絡",rows+`<div class="actions"><button onclick="openLoreChronology()">返回年表</button></div>`)
}
function openHistoricalChain(id){
 const c=historyChainFor(id);if(!historyChainVisible(c))return;
 const rows=(c.event_ids||[]).map(historyEvent).filter(historyEventVisible).sort((a,b)=>a.year-b.year).map(e=>`<div class="itemrow"><span><b>${e.year}年｜${e.title}</b><br><span class="small">${e.summary}</span></span><button onclick="openHistoricalEvent('${e.id}')">查看</button></div>`).join("");
 showModal(c.name,`<div class="card"><b>${c.theme}</b><br><span class="small">CURRENT後果：${c.current_effect}</span></div>${rows}<div class="actions"><button onclick="openHistoricalChains()">返回因果脈絡</button></div>`)
}
function openHistoricalDisputes(){
 const rows=(DB.historical_disputes||[]).filter(historyDisputeVisible).map(d=>`<div class="itemrow"><span><b>${d.title}</b><br><span class="small">${loreVerificationLabel(d.verification)}｜${d.status}</span></span><button onclick="openHistoricalDispute('${d.id}')">查看</button></div>`).join("");
 showModal("爭議史與未解問題",rows+`<div class="actions"><button onclick="openLoreChronology()">返回年表</button></div>`)
}
function openHistoricalDispute(id){
 const d=historicalDispute(id);if(!historyDisputeVisible(d))return;
 const pos=(d.positions||[]).map(x=>`<div class="small">• ${x}</div>`).join("");
 const ev=(d.related_event_ids||[]).map(historyEvent).filter(historyEventVisible).map(x=>`<button onclick="openHistoricalEvent('${x.id}')">${x.year} ${x.title}</button>`).join("");
 showModal(d.title,`<div class="card"><b>${d.status}</b>｜${loreVerificationLabel(d.verification)}<br>${pos}<br><span class="small">CURRENT規則：${d.rule}</span></div><div class="actions">${ev}</div><div class="actions"><button onclick="openHistoricalDisputes()">返回爭議史</button></div>`)
}
function openLoreChronology(){
 const rows=(DB.world_timeline||[]).filter(historyEventVisible).slice().sort((a,b)=>a.year-b.year).map(e=>`<div class="itemrow"><span><b>${e.year}年｜${e.title}</b><br><span class="small">${loreVerificationLabel(e.verification)}｜${historySubperiod(e.subperiod_id)?.name||""}｜${e.summary}</span></span><button onclick="openHistoricalEvent('${e.id}')">查看</button></div>`).join("");
 showModal("世界史年表",`<div class="card small">HISTORY-2.0｜5個大時代、12個細分時期、${DB.world_timeline.length}個世界級事件、${DB.historical_causal_chains.length}條因果鏈。受限史料只有在角色取得相應世界誌後才顯示。</div><div class="actions"><button onclick="openHistoricalPeriods()">歷史分期</button><button onclick="openHistoricalChains()">因果脈絡</button><button onclick="openHistoricalDisputes()">爭議史</button></div>`+rows+`<div class="actions"><button onclick="openWorldLore()">上一頁</button></div>`)
}
function politicalRelationKey(a,b){return [a,b].sort().join("|")}
function basePoliticalRelation(a,b){return (DB.political_relations||[]).find(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a))||{score:0,state:"neutral",reason:"沒有固定外交紀錄"}}
function politicalRelationState(score){return score>=60?"盟屬／緊密同盟":score>=25?"合作":score>-25?"中立／競爭":score>-60?"敵對":"交戰邊緣"}
function currentPoliticalRelation(a,b){
 const base=basePoliticalRelation(a,b),x=G.worldState.politicalRelations?.[politicalRelationKey(a,b)],score=x?.score??base.score;
 return {score,state:politicalRelationState(score),reason:x?.reason||base.reason,lastEventTurn:x?.lastEventTurn??-999}
}
function setPoliticalRelation(a,b,score,reason,type){
 G.worldState.politicalRelations=G.worldState.politicalRelations||{};
 G.worldState.politicalRelations[politicalRelationKey(a,b)]={score:clamp(Math.round(score),-100,100),reason,type,lastEventTurn:G.turn}
}
function openPolity(id){
 const p=politicalEntity(id);if(!p)return;const cul=cultureProfile(p.culture_id),reg=worldRegion(p.core_region_id),prof=authorityProfile(id);
 const rels=(DB.political_entities||[]).filter(x=>x.id!==id).map(x=>({p:x,r:currentPoliticalRelation(id,x.id)})).filter(x=>Math.abs(x.r.score)>=20).sort((a,b)=>Math.abs(b.r.score)-Math.abs(a.r.score)).slice(0,6);
 const rh=rels.map(x=>`<div class="small">${x.p.name}：${x.r.state} ${x.r.score>=0?"+":""}${x.r.score}</div>`).join("")||"<div class='small'>沒有特別強烈的公開外交關係。</div>";
 const tops=(prof?.top_office_ids||[]).map(x=>authorityOffice(id,x)?.title).filter(Boolean);
 showModal(p.name,`<div class="card"><b>${p.name}</b> <span class="tier">${p.world_tier}</span><br>${p.government_type}｜首府：${p.capital}<br><span class="small">${p.ruling_structure}<br>法統：${p.legal_tradition}<br>核心地區：${reg?.name||p.core_region_id}｜文化：${cul?.name||p.culture_id}${p.vassal_of?`<br>名義宗主：${politicalEntity(p.vassal_of)?.name||p.vassal_of}`:""}<br>最高權位：${tops.join("、")||"無固定統治者"}｜權力上限：${p.top_authority_tier||"—"}</span></div>
 <div class="card"><b>你的政治接觸</b><br><span class="small">對${p.name}聲望 ${politicalStanding(id)}｜目前最高可接觸 ${maxPoliticalAccessTier(id)}。政治聲望只代表可信度與接觸資格，不增加戰鬥力。</span></div>
 <div class="card"><b>對外關係</b>${rh}</div>
 <div class="actions"><button onclick="openAuthorityHierarchy('${p.id}')">權力層級</button><button onclick="openAuthorityRequests('${p.id}')">地方政務</button><button onclick="openLoreScope('polity','${p.id}','${p.name}・歷史')">歷史脈絡</button><button onclick="openLoreScope('culture','${p.culture_id}','${cul?.name||"文化"}')">文化</button><button onclick="openLorePolitics()">政治體列表</button></div>`)
}

function continentalPolityFor(id){const p=politicalEntity(id);return p?.continental_status==="recognized_mainland_polity"||DB.continental_political_order?.recognized_mainland_polity_ids?.includes(id)?p:null}
function overseasHorizonFor(id){return (DB.overseas_unknown_horizons||[]).find(x=>x.id===id)||null}
function openOverseasUnknown(){
 const rows=(DB.overseas_unknown_horizons||[]).map(x=>`<div class="card"><b>${x.people}海外政治體</b>｜<span class="warnText">未知</span><br><span class="small">${x.evidence.join("<br>")}<br><br>目前未知：國名、首都、政府、君主、疆界與正式外交。<br>${x.forbidden_inference}</span></div>`).join("");
 showModal("海外未知文明",`<div class="card small">CURRENT只承認可重複驗證的政治資料。魔族、龍族、鳳族即使在大陸有個體、混血、遺跡或傳說，也不能反推出海外國家。</div>${rows}<div class="actions"><button onclick="openLorePolitics()">大陸政治體</button><button onclick="openWorldLore()">返回世界誌</button></div>`)
}
function regionalPower(id){return IDX.regionalPower.get(id)||null}
function regionalPowersForRegion(regionId){return (DB.regional_powers||[]).filter(x=>x.home_region_id===regionId)}
function regionalPowerStanding(id){G.character.regionalPowerStanding=G.character.regionalPowerStanding||{};return clamp(Number(G.character.regionalPowerStanding[id]||0),-100,100)}
function openRegionalPower(id){
 const p=regionalPower(id);if(!p)return;const reg=worldRegion(p.home_region_id),cul=cultureProfile(p.culture_id),prof=(DB.regional_power_authority_profiles||[]).find(x=>x.regional_power_id===id);
 showModal(p.name,`<div class="card"><b>${p.name}</b> <span class="tier">${p.world_tier}</span><br>${p.category}<br><span class="small">活動區：${reg?.name||p.home_region_id}｜據點：${p.base||"—"}<br>${p.structure}<br>政治定位：${p.political_role}<br>最高協調權：${prof?.top_office||p.leader_title}｜權限上限：${prof?.authority_tier||p.authority_ceiling}<br><b>不具主權政體資格</b></span></div>
 <div class="card"><b>你的區域勢力聲望</b><br><span class="small">${regionalPowerStanding(id)}｜此數值只代表與該勢力的往來，不等於政治爵位或國家官職。</span></div>
 <div class="actions"><button onclick="openLoreScope('regional_power','${id}','${p.name}・歷史')">歷史脈絡</button><button onclick="openLoreScope('region','${p.home_region_id}','${reg?.name||"地區"}・地方誌')">地區</button><button onclick="openLorePolitics()">上一頁</button></div>`)
}
function openLorePolitics(){
 const governed=(DB.political_entities||[]).filter(p=>p.continental_status==="recognized_mainland_polity");
 const nonstate=(DB.political_entities||[]).filter(p=>p.continental_status!=="recognized_mainland_polity");
 const polityRows=governed.map(p=>`<div class="itemrow"><span><b>${p.name}</b>［${p.government_type}］<br><span class="small">${p.core_region_id==="REG-18"?"CURRENT可玩區｜":""}${p.identity}<br>核心地區：${worldRegion(p.core_region_id)?.name||p.core_region_id}｜最高權力層級：${p.top_authority_tier||"—"}</span></span><button onclick="openPolity('${p.id}')">查看</button></div>`).join("");
 const powerRows=(DB.regional_powers||[]).map(p=>`<div class="itemrow"><span><b>${p.name}</b>［區域勢力］<br><span class="small">${worldRegion(p.home_region_id)?.name||p.home_region_id}｜${p.political_role}</span></span><button onclick="openRegionalPower('${p.id}')">查看</button></div>`).join("");
 const zoneRows=nonstate.map(p=>`<div class="itemrow"><span><b>${p.name}</b>［非國家政治區］<br><span class="small">${p.identity}</span></span><button onclick="openPolity('${p.id}')">查看</button></div>`).join("");
 showModal("大陸政治體",`<div class="card small">CURRENT主大陸：${governed.length}個被承認政體、${DB.regional_powers?.length||0}個主要區域勢力、${nonstate.length}個非國家政治區。金衡、灰刃、卡薩維爾統一採「自由都市」主權類型；黑潮船長同盟與鐵旗軍鎮聯盟不具國家資格。</div><div class="actions"><button onclick="openAuthorityArchetypes()">20種統治職位原型</button><button onclick="openOverseasUnknown()">海外未知</button></div><h3>被承認政體</h3>${polityRows}<h3>區域勢力</h3>${powerRows}${zoneRows?`<h3>非國家政治區</h3>${zoneRows}`:""}<div class="actions"><button onclick="openWorldLore()">上一頁</button></div>`)
}
function openLoreRaces(){
 const rows=DB.races.map(r=>`<div class="itemrow"><span><b>${r.name}</b><br><span class="small">${r.historical_identity||r.description}</span></span><button onclick="openLoreScope('race','${r.id}','${r.name}・歷史文化')">查看</button></div>`).join("");
 showModal("種族史",rows+`<div class="actions"><button onclick="openWorldLore()">上一頁</button></div>`)
}
function openLorePantheonEntities(pid){
 const p=(DB.pantheons||[]).find(x=>x.id===pid);if(!p)return;
 const rows=(DB.faith_entities||[]).filter(e=>e.pantheon_id===pid&&!["hidden","forbidden"].includes(e.visibility)).map(e=>`<div class="itemrow"><span><b>${e.name}</b>［${e.entity_type}］<br><span class="small">${(e.domains||[]).join("、")}</span></span><button onclick="openLoreScope('faith_entity','${e.id}','${e.name}・信仰脈絡')">查看</button></div>`).join("");
 showModal(`${p.name}・神明與組織`,rows+`<div class="actions"><button onclick="openLorePantheons()">上一頁</button></div>`)
}
function openLorePantheons(){
 const rows=DB.pantheons.map(p=>`<div class="itemrow"><span><b>${p.name}</b><br><span class="small">${p.theme}</span></span><span><button onclick="openLoreScope('pantheon','${p.id}','${p.name}・沿革')">神系沿革</button> <button onclick="openLorePantheonEntities('${p.id}')">神明／組織</button></span></div>`).join("");
 showModal("神明與神系",rows+`<div class="actions"><button onclick="openWorldLore()">上一頁</button></div>`)
}
function openLoreClasses(){
 const groups=[...new Set(DB.combat_classes.map(c=>c.category))];
 const body=groups.map(g=>`<div class="card"><b>${g}</b><div class="actions">${DB.combat_classes.filter(c=>c.category===g).map(c=>`<button onclick="openLoreScope('class','${c.id}','${c.name}・職業傳承')">${c.name}［${c.tier}］</button>`).join("")}</div></div>`).join("");
 showModal("職業史",body+`<div class="actions"><button onclick="openWorldLore()">上一頁</button></div>`)
}
function openLoreOrganizations(){
 const rows=(DB.world_organizations||[]).filter(o=>publicOrganization(o)||orgState().discovered.includes(o.id)).map(o=>`<div class="itemrow"><span><b>${o.name}</b>［${o.category}］<br><span class="small">最早紀錄：紀元${o.first_attested_year}年前後</span></span><button onclick="openLoreScope('organization','${o.id}','${o.name}・沿革')">歷史</button></div>`).join("");
 showModal("世界組織史",rows+`<div class="actions"><button onclick="openWorldLore()">上一頁</button></div>`)
}
function openLoreRegions(){
 const rows=(DB.world_regions||[]).map(r=>{
   const primary=politicalEntity(r.political_entity_id)?.name||"無確認主權";
   const secondary=(r.secondary_political_entity_ids||[]).map(id=>politicalEntity(id)?.name||id).join("、");
   const powers=regionalPowersForRegion(r.id).map(x=>x.name).join("、");
   return `<div class="itemrow"><span><b>${r.name}</b> <span class="tier">${r.recommended_tier}</span><br><span class="small">${primary}${secondary?`／重疊：${secondary}`:""}${powers?`／區域勢力：${powers}`:""}｜${r.terrain}${r.map_status==="playable_current"?"｜CURRENT可玩區":""}</span></span><button onclick="openLoreScope('region','${r.id}','${r.name}・地方誌')">查看</button></div>`
 }).join("");
 showModal("地區史",rows+`<div class="actions"><button onclick="openWorldLore()">上一頁</button></div>`)
}
function visiblePoliticalEvents(){
 const l=loc(G.character.locationId),cur=l?.political_entity_id,p=politicalEntity(cur),visible=new Set([cur,p?.vassal_of].filter(Boolean));
 return (G.worldState.politicalEvents||[]).filter(e=>visible.has(e.a)||visible.has(e.b))
}

function cultureMaterialFor(cultureId){
 const c=IDX.culture.get(cultureId);if(!c)return null;
 return {
   culture:c,
   festivals:(DB.cultural_festivals||[]).filter(x=>x.culture_id===cultureId),
   sayings:c.sayings||[],cuisine:c.cuisine||[],social_tensions:c.social_tensions||[],
   etiquette:c.etiquette||"",dress:c.dress||""
 }
}
function regionalRumorsFor(regionId,opts={}){
 const all=(DB.regional_rumors||[]).filter(x=>x.region_id===regionId);
 if(opts.theme)return all.filter(x=>x.theme===opts.theme);
 return all;
}
function regionalFolkloreFor(regionId){
 return (DB.regional_folklore||[]).filter(x=>x.region_id===regionId)
}
function localHistoryFor(regionId){
 return (DB.local_historical_incidents||[]).filter(x=>x.region_id===regionId).sort((a,b)=>a.year-b.year)
}
function mythMotifsFor(pantheonId){
 return (DB.myth_cycle_records||[]).filter(x=>x.pantheon_id===pantheonId)
}
function generatorMaterialPackFor(regionId){return IDX.materialPack.get(regionId)||null}
function currentRegionMaterialPack(){
 const l=loc(G?.character?.locationId);
 const rid=l?.world_region_id||l?.region_id||DB.world_setting?.starter_region||"REG-18";
 return generatorMaterialPackFor(rid)
}
function openCulturalLifeDirectory(){
 const rows=(DB.culture_profiles||[]).map(c=>`<div class="itemrow"><span><b>${c.name}</b><br><span class="small">${(c.values||[]).join("、")}</span></span><button onclick="openCulturalLife('${c.id}')">查看</button></div>`).join("");
 showModal("文化生活",rows)
}
function openCulturalLife(id){
 const m=cultureMaterialFor(id);if(!m)return;
 const c=m.culture;
 const fs=m.festivals.map(x=>`<div class="small">• <b>${x.name}</b>｜${x.timing}｜${(x.activities||[]).join("、")}</div>`).join("");
 const sayings=(c.sayings||[]).map(x=>`<div class="small">「${x}」</div>`).join("");
 showModal(c.name,`
 <div class="card"><b>待客與禮節</b><br><span class="small">${c.etiquette||""}</span></div>
 <div class="card"><b>飲食</b><br><span class="small">${(c.cuisine||[]).join("、")}</span></div>
 <div class="card"><b>服飾</b><br><span class="small">${c.dress||""}</span></div>
 <div class="card"><b>地方俗諺</b>${sayings}</div>
 <div class="card"><b>社會張力</b><br><span class="small">${(c.social_tensions||[]).join("／")}</span></div>
 <div class="card"><b>節慶</b>${fs}</div>`)
}
function openRegionalMaterial(){
 const pack=currentRegionMaterialPack();if(!pack)return;
 const hist=localHistoryFor(pack.region_id).map(x=>`<div class="small">• ${x.year}年｜<b>${x.title}</b>｜${x.summary}</div>`).join("");
 const folk=regionalFolkloreFor(pack.region_id).map(x=>`<div class="small">• <b>${x.title}</b>｜${x.text}</div>`).join("");
 showModal(`${pack.region_name}・地方誌素材`,`
 <div class="card"><b>地方微歷史</b>${hist||"<div class='small'>無</div>"}</div>
 <div class="card"><b>民俗傳說</b>${folk||"<div class='small'>無</div>"}</div>
 <div class="card"><b>常見玩法母題</b><br><span class="small">委託：${(pack.quest_motifs||[]).join("、")}<br>探索：${(pack.exploration_motifs||[]).join("、")}<br>NPC：${(pack.npc_motifs||[]).join("、")}</span></div>`)
}
function openRegionalRumorArchive(){
 const pack=currentRegionMaterialPack();if(!pack)return;
 const rs=regionalRumorsFor(pack.region_id);
 const rows=rs.map(x=>`<div class="card"><b>${x.theme}</b>｜可信度：${x.reliability}<br><span class="small">${x.public_claim}</span></div>`).join("");
 showModal(`${pack.region_name}・地方傳聞`,rows||"<div class='card small'>目前沒有地方傳聞。</div>")
}
function openMythCycleDirectory(){
 const rows=(DB.pantheons||[]).map(p=>`<div class="itemrow"><span><b>${p.name}</b><br><span class="small">${p.theme||""}</span></span><button onclick="openMythCycle('${p.id}')">查看</button></div>`).join("");
 showModal("神話母題",rows)
}
function openMythCycle(id){
 const p=(DB.pantheons||[]).find(x=>x.id===id);if(!p)return;
 const rows=mythMotifsFor(id).map(x=>`<div class="card"><b>${x.title}</b><br><span class="small">${x.public_text}<br>［神話傳承｜不等同客觀史實］</span></div>`).join("");
 showModal(`${p.name}・神話母題`,rows||"<div class='card small'>目前沒有可查神話。</div>")
}

function relationEntityName(type,id){
 if(type==="race")return (DB.races||[]).find(x=>x.id===id)?.name||id;
 if(type==="polity")return politicalEntity(id)?.name||id;
 if(type==="regional_power")return regionalPower(id)?.name||id;
 if(type==="organization")return worldOrg(id)?.name||id;
 if(type==="faith")return (DB.faith_entities||[]).find(x=>x.id===id)?.name||id;
 return id
}
function historicalRelation(id){return IDX.historicalRelation.get(id)||null}
function historicalRelationsFor(type,id){return (DB.historical_relationship_index?.[`${type}:${id}`]||[]).map(historicalRelation).filter(Boolean)}
function relationStateLabel(state){return DB.relationship_state_catalog?.[state]?.label||state}
function relationVisible(r){return !!r&&(r.visibility!=="restricted"||knownLore().includes(r.lore_record_id))}
function relationIncidentCandidates(regionId){
 const reg=worldRegion(regionId);if(!reg)return [];
 const ids=new Set([reg.political_entity_id, ...(reg.secondary_political_entity_ids||[])] .filter(Boolean));
 for(const rp of DB.regional_powers||[])if(rp.core_region_id===regionId||rp.region_id===regionId||rp.home_region_id===regionId)ids.add(rp.id);
 return (DB.historical_relationship_records||[]).filter(r=>relationVisible(r)&&((r.a_type==="polity"||r.a_type==="regional_power")&&ids.has(r.a_id)||(r.b_type==="polity"||r.b_type==="regional_power")&&ids.has(r.b_id)));
}
function relationQuestCandidates(regionId){
 return relationIncidentCandidates(regionId).map(r=>({relation_id:r.id,state:r.state,score:r.score,
  themes:r.state==="alliance"||r.state==="cooperation"?["護送","共同補給","聯合巡查"]:
         r.state==="competitive_cooperation"||r.state==="regulated_conflict"?["仲裁","查證","界線巡查"]:
         r.state==="tension"||r.state==="hostility"||r.state==="hatred"?["情報","救援","停火護送"]:["交涉","調查"],
  max_scale:"region"}));
}
function relationRumorCandidates(regionId){
 return relationIncidentCandidates(regionId).filter(r=>r.visibility==="public").map(r=>({relation_id:r.id,
   text:`${relationEntityName(r.a_type,r.a_id)}與${relationEntityName(r.b_type,r.b_id)}目前以「${relationStateLabel(r.state)}」為主要關係。`,verification:"relationship_context"}));
}
function openWorldRelations(filter="all"){
 const rows=(DB.historical_relationship_records||[]).filter(relationVisible).filter(r=>filter==="all"||r.a_type===filter||r.b_type===filter)
  .map(r=>`<div class="itemrow"><span><b>${relationEntityName(r.a_type,r.a_id)} × ${relationEntityName(r.b_type,r.b_id)}</b><br><span class="small">${relationStateLabel(r.state)}｜${r.score>=0?"+":""}${r.score}｜${r.historical_basis}</span></span><button onclick="openHistoricalRelation('${r.id}')">查看</button></div>`).join("");
 showModal("世界關係史",`<div class="actions"><button onclick="openWorldRelations('race')">種族</button><button onclick="openWorldRelations('polity')">政體</button><button onclick="openWorldRelations('organization')">組織</button><button onclick="openWorldRelations('faith')">教會</button><button onclick="openPoliticalRelationHistory()">政體外交17</button><button onclick="openOrganizationRelationHistory()">組織間278</button><button onclick="openWorldRelations('all')">全部</button></div>${rows||"<div class='card small'>沒有可公開關係。</div>"}`)
}

function openPoliticalRelationHistory(){
 const rows=(DB.political_relations||[]).map((r,i)=>`<div class="itemrow"><span><b>${politicalEntity(r.a)?.name||r.a} × ${politicalEntity(r.b)?.name||r.b}</b><br><span class="small">${r.state}｜${r.score>=0?"+":""}${r.score}｜${r.historical_basis||r.reason||""}</span></span><button onclick="openEstablishedRelation('political',${i})">查看</button></div>`).join("");
 showModal("政體外交關係史",rows||"<div class='card small'>沒有資料。</div>")
}
function openOrganizationRelationHistory(){
 const rows=(DB.organization_relations||[]).map((r,i)=>`<div class="itemrow"><span><b>${organization(r.a)?.name||r.a} × ${organization(r.b)?.name||r.b}</b><br><span class="small">${r.state}｜${r.score>=0?"+":""}${r.score}｜${r.historical_basis||r.reason||""}</span></span><button onclick="openEstablishedRelation('organization',${i})">查看</button></div>`).join("");
 showModal("世界組織關係史",rows||"<div class='card small'>沒有資料。</div>")
}
function openEstablishedRelation(kind,index){
 const r=kind==="political"?(DB.political_relations||[])[index]:(DB.organization_relations||[])[index];if(!r)return;
 const a=kind==="political"?(politicalEntity(r.a)?.name||r.a):(organization(r.a)?.name||r.a),b=kind==="political"?(politicalEntity(r.b)?.name||r.b):(organization(r.b)?.name||r.b);
 const turns=(r.turning_points||[]).map(x=>`<div class="small">• ${x.year}年｜${x.event}<br>${x.impact||""}</div>`).join("");
 showModal(`${a} × ${b}`,`<div class="card"><b>${r.state}</b>｜${r.score>=0?"+":""}${r.score}<br><span class="small">${r.historical_basis||r.reason||""}</span></div>${turns?`<div class="card"><b>歷史轉折</b>${turns}</div>`:""}<div class="card"><b>CURRENT影響</b><br><span class="small">${(r.current_effects||[]).join("<br>")}</span></div>`)
}
function openHistoricalRelation(id){
 const r=historicalRelation(id);if(!relationVisible(r))return;
 const turns=(r.turning_points||[]).map(x=>`<div class="small">• ${x.year}年｜${x.event}<br>${x.impact}</div>`).join("");
 const co=(r.cooperation_axes||[]).join("、")||"—",cf=(r.conflict_axes||[]).join("、")||"—";
 const up=(r.escalation_triggers||[]).join("、")||"—",dn=(r.deescalation_triggers||[]).join("、")||"—";
 showModal(`${relationEntityName(r.a_type,r.a_id)} × ${relationEntityName(r.b_type,r.b_id)}`,`
 <div class="card"><b>${relationStateLabel(r.state)}</b>｜${r.score>=0?"+":""}${r.score}<br><span class="small">${r.historical_basis}</span></div>
 <div class="card"><b>歷史轉折</b>${turns}</div>
 <div class="card"><b>合作面</b><br><span class="small">${co}</span><br><b>衝突面</b><br><span class="small">${cf}</span></div>
 <div class="card"><b>可能惡化</b><br><span class="small">${up}</span><br><b>可能改善</b><br><span class="small">${dn}</span></div>
 <div class="card small">群體關係只代表歷史與制度背景，不決定任何個體NPC的必然態度。</div>`)
}
function openWorldLore(){
 const known=knownLore().length,events=visiblePoliticalEvents().slice(0,4).map(e=>`<div class="small">${e.time}｜${e.summary}</div>`).join("")||"<div class='small'>目前沒有新的政治局勢紀錄。</div>";
 showModal("世界誌",`<div class="card"><b>${DB.world_setting.world_name}</b><br><span class="small">${DB.world_setting.calendar_name}317年｜已知記錄 ${known}/${DB.lore_system.record_count}｜世界史事件 ${DB.world_timeline.length}<br>${DB.world_setting.technology_frame}</span></div>
 <div class="card"><b>近期政治動向</b>${events}</div>
 <div class="actions"><button onclick="openLoreChronology()">世界史年表</button><button onclick="openWorldRelations()">世界關係史</button><button onclick="openCulturalLifeDirectory()">文化生活</button><button onclick="openRegionalMaterial()">地方誌素材</button><button onclick="openRegionalRumorArchive()">地方傳聞</button><button onclick="openMythCycleDirectory()">神話母題</button><button onclick="openLorePolitics()">大陸政治體</button><button onclick="openOverseasUnknown()">海外未知</button><button onclick="openPoliticalAuthorityCatalog()">權力層級</button><button onclick="openLoreRegions()">地區史</button><button onclick="openRegionalContext()">地方生活脈絡</button><button onclick="openLoreRaces()">種族史</button><button onclick="openLorePantheons()">神明／神系</button><button onclick="openLoreOrganizations()">組織史</button><button onclick="openDisciplineDirectory()">武技／魔法流派</button><button onclick="openEasternSwordTraditions()">東方劍術傳承</button><button onclick="openSTierRegistry()">S級戰力名錄</button><button onclick="openLoreClasses()">職業史</button><button onclick="openLocationLore('${G.character.locationId}')">目前地方誌</button></div>`)
}
function openLocationLore(id){
 const l=loc(id);if(!l)return;discoverScopeLore("location",id,"地方誌");
 if(l.world_region_id)discoverScopeLore("region",l.world_region_id,"地方誌");
 if(l.political_entity_id)discoverScopeLore("polity",l.political_entity_id,"地方誌");
 const local=loreFor("location",id),regional=l.world_region_id?loreFor("region",l.world_region_id).filter(r=>r.common_knowledge||knownLore().includes(r.id)):[];
 const records=[...local,...regional].filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i);
 const la=localAuthorityForLocation(id),prefix=`<div class="card"><b>地方統治</b><br>${la?.title||politicalEntity(l.political_entity_id)?.top_office||"未確認"}<br><span class="small">${la?.reports_to?`上級：${la.reports_to}`:`政體：${politicalEntity(l.political_entity_id)?.name||"無"}`}</span></div>`;
 showModal(`${l.name}・地方誌`,prefix+loreCards(records,"openMap()"))
}
function politicalContextForLocation(id=G.character.locationId){
 const l=loc(id),p=politicalEntity(l?.political_entity_id),r=worldRegion(l?.world_region_id),c=cultureProfile(l?.culture_id);
 return {location:l,polity:p,region:r,culture:c}
}
function cultureContextForLocation(id=G.character.locationId){return politicalContextForLocation(id).culture}
function politicalEventType(rel,a,b){
 const pa=politicalEntity(a),pb=politicalEntity(b),shared=(pa?.recognized_pantheon_ids||[]).some(x=>(pb?.recognized_pantheon_ids||[]).includes(x));
 if(rel.score>=25)return ["商路協議","封臣議事","使節會談",shared?"朝聖護路協定":"互市續約"][rand(4)];
 if(rel.score<=-25)return ["邊境爭議","關卡加徵","使節抗議","巡防摩擦"][rand(4)];
 return ["使節會談","商路談判","邊界勘定","地方盟約續議"][rand(4)]
}
function evaluatePoliticalDynamics(){
 const sys=DB.political_system;if(!sys||G.turn<=0||G.turn%sys.dynamic_check_every_turns!==0)return false;
 if(Math.random()>sys.dynamic_event_chance)return false;
 const base=(DB.political_relations||[])[rand((DB.political_relations||[]).length)];if(!base)return false;
 const rel=currentPoliticalRelation(base.a,base.b);if(G.turn-rel.lastEventTurn<72)return false;
 const type=politicalEventType(rel,base.a,base.b),positive=["商路協議","封臣議事","使節會談","朝聖護路協定","互市續約","地方盟約續議"].includes(type);
 const delta=positive?randomInt(2,6):-randomInt(2,6),next=clamp(rel.score+delta,-100,100);
 const pa=politicalEntity(base.a),pb=politicalEntity(base.b),reason=`${type}使雙方公開關係由${rel.score}調整為${next}`;
 setPoliticalRelation(base.a,base.b,next,reason,type);
 const ev={turn:G.turn,time:timeText(),type,a:base.a,b:base.b,summary:`${pa.name}與${pb.name}進行「${type}」。`,relationScore:next};
 G.worldState.politicalEvents.unshift(ev);if(G.worldState.politicalEvents.length>30)G.worldState.politicalEvents.length=30;
 emitIntegratedEvent("political_event","polity",base.a,ev.summary,{otherPolityId:base.b,eventType:type,relationScore:next});
 log("政治局勢",`${ev.summary} 關係：${politicalRelationState(next)}。`);
 return true
}
function dynamicPoliticalIntelRows(fid){
 const l=loc(G.character.locationId),cur=l?.political_entity_id,cp=politicalEntity(cur),related=new Set([cur,cp?.vassal_of].filter(Boolean));
 const rows=[];
 for(const e of (G.worldState.politicalEvents||[]).slice(0,8)){
   if(!related.has(e.a)&&!related.has(e.b))continue;
   if(!["guild","tavern","church","inn"].includes(fid))continue;
   const a=politicalEntity(e.a),b=politicalEntity(e.b);
   rows.push({id:`INT-POL-${e.turn}-${e.a}-${e.b}`,facility:fid,category:"地方政治動向",text:e.summary,
     reliability:fid==="guild"||fid==="church"?84:70,reliability_label:fid==="guild"||fid==="church"?"可靠":"可信",
     scope:"regional",tier_ceiling:"C",weight:2.5,source_type:fid==="guild"?"record":"witness",
     political_entity_id:related.has(e.a)?e.a:e.b,dynamic:true,source_ref:{type:"political_event",id:`${e.turn}:${e.a}:${e.b}`}})
 }
 return rows
}


function tierIndex(t){return ({F:0,E:1,D:2,C:3,B:4,A:5,S:6})[t]??0}
function regionalEquipmentPool(regionId,maxTier="C"){
 const cap=tierIndex(maxTier);
 return (DB.items||[]).filter(x=>
   ["武器","防具","飾品"].includes(x.catalog_group)&&
   tierIndex(x.tier)<=cap&&
   (!x.regional_origin_id||x.regional_origin_id===regionId||["F","E"].includes(x.tier))
 )
}
function potionCatalogForTier(maxTier="C"){
 const cap=tierIndex(maxTier);
 return (DB.items||[]).filter(x=>x.type==="藥劑"&&tierIndex(x.tier)<=cap)
}
function utilityItemPool(regionId=null){
 return (DB.items||[]).filter(x=>
   ["工具","補給","消耗品","食材","草藥素材","工藝素材","卷軸","符文","書籍","寶藏","鑰匙"].includes(x.type)&&
   (!regionId||!x.regional_origin_id||x.regional_origin_id===regionId)
 )
}

function generateOrganizationContracts(orgOrId){const o=typeof orgOrId==="string"?worldOrg(orgOrId):orgOrId;if(!o)return [];return organizationContractCandidates(o).filter(q=>{const oid=q?.objective?.location_id;return (!oid||!!loc(oid))&&questMarketAvailable(q)}).map(q=>({...q,generator:"GEN-ORG-CONTRACT",source_organization_id:o.id}))}

function disciplineOpportunityQuest(dOrId){
 const d=typeof dOrId==="string"?disciplineFor(dOrId):dOrId;
 if(!d||!d.joinable)return null;
 if((G?.character?.level||1)<(d.min_level||1))return null;
 const contact=(d.contact_location_ids||[]).map(loc).find(Boolean);
 if(!contact)return null;
 return {
   id:`DSCQ-${d.id}`,
   generator:"GEN-DISCIPLINE-QUEST",
   discipline_id:d.id,
   name:`${d.name}・基礎接觸`,
   tier:(d.min_level||1)>=20?"D":(d.min_level||1)>=8?"E":"F",
   location_id:contact.id,
   objective:{kind:"contact",location_id:contact.id,target:1},
   reward_rule:"只提供研習機會、聲望或一般報酬；不直接授予C+裝備或封印技能。",
   runtime_candidate:true
 }
}
function hiddenSwordSiteContext(siteId){
 const s=hiddenSwordSite(siteId);if(!s)return null;
 const disc=s.related_discipline_id;
 const known=!!G&&((G.character?.disciplines?.discovered||[]).includes(disc))&&(disciplineRep(disc)>=40);
 if(s.visibility==="core_secret"&&!known){
   return {id:s.id,name:"未確認的封閉山谷",visibility:"unknown",accessible:false,public_description:null,broad_area:null,related_discipline_id:null}
 }
 if(!known){
   return {id:s.id,name:s.name,visibility:s.visibility,accessible:false,public_description:s.public_description||"只有模糊的山區傳聞。",broad_area:s.kind==="cover_village"?s.broad_area:null,related_discipline_id:null}
 }
 return {...s,accessible:s.visibility!=="core_secret"||disciplineRep(disc)>=70}
}
function sTierHistoryFor(id){
 const s=sTierCombatant(id);if(!s)return null;
 const allowed=new Set(["recorded","multi_source","current"]);
 return {
   id:s.id,name:s.name,epithet:s.epithet,combat_tier:s.combat_tier,
   history:(s.history||[]).filter(x=>allowed.has(x.verification||"recorded")).map(x=>({...x})),
   organization_links:(s.organization_links||[]).filter(x=>x.public!==false).map(x=>({...x})),
   world_impact:[...(s.world_impact||[])],
   rule:"只回傳CURRENT canonical與可驗證歷史；public_rumor不會升格為史實。"
 }
}
function craftRecipePool(maxTier="C",profession=null){
 const cap=tierIndex(maxTier);
 return (DB.items||[]).filter(x=>x.craft_recipe&&tierIndex(x.tier)<=cap&&(!profession||x.craft_recipe.profession===profession))
}
function shopStockForFacility(fid,maxTier="C"){
 const f=DB.facilities?.[fid];if(!f)return [];
 const cap=tierIndex(maxTier);
 return (f.stock||[]).map(item).filter(x=>x&&tierIndex(x.tier)<=cap)
}
function npcArchetypePool(regionId){
 return (DB.regional_npc_archetypes||[]).filter(x=>x.region_id===regionId).map(x=>({...x}))
}
function dungeonPoolForRegion(regionId,maxTier="C"){
 const cap=tierIndex(maxTier);
 return (DB.locations||[]).filter(x=>(x.kind==="dungeon"||String(x.id||"").startsWith("D-"))&&(x.world_region_id===regionId||x.region_id===regionId)&&tierIndex(x.tier||"F")<=cap)
}
function worldEventCandidatePool(regionId){
 return [
   ...(DB.regional_life_events||[]).filter(x=>x.region_id===regionId).map(x=>({...x,source_kind:"regional_life"})),
   ...(DB.regional_adventure_hooks||[]).filter(x=>x.region_id===regionId).map(x=>({...x,source_kind:"adventure_hook"})),
   ...(DB.regional_rumors||[]).filter(x=>x.region_id===regionId).map(x=>({...x,source_kind:"rumor",canonical_mutation:false}))
 ]
}
function generatorRuntimeFunctionExists(name){
 if(!name)return false;
 try{return typeof eval(name)==="function"}catch{return false}
}
function integrationLinks(){
 return DB.content_link_index||{item_sources:{},facility_content:{},location_content:{}}
}
function itemSourceData(id){return integrationLinks().item_sources?.[id]||{shops:[],gather_locations:[],monster_drops:[],recipe_inputs:[],recipe_outputs:[]}}
function itemSourceSummary(id){
 const s=itemSourceData(id),p=[];
 if(s.shops.length)p.push(`商店:${s.shops.map(x=>DB.facilities[x]?.name||x).join("、")}`);
 if(s.gather_locations.length)p.push(`採集:${s.gather_locations.slice(0,3).map(x=>loc(x)?.name||x).join("、")}${s.gather_locations.length>3?"等":""}`);
 if(s.monster_drops.length)p.push(`魔物掉落:${s.monster_drops.length}種`);
 if(s.recipe_inputs.length)p.push(`製作用途:${s.recipe_inputs.length}`);
 return p.join("｜")||"目前無明確固定來源"
}
function facilityIntegration(fid){return integrationLinks().facility_content?.[fid]||{organization_ids:[],subjob_ids:[],dialogue_record_ids:[],intel_record_ids:[],shop_item_ids:[]}}
function locationIntegration(id){return integrationLinks().location_content?.[id]||{facility_ids:[],gather_item_ids:[],fish_item_ids:[],encounter_monster_ids:[],companion_species_ids:[],organization_ids:[],pantheon_ids:[]}}
function emitIntegratedEvent(type,sourceType,sourceId,summary,data={}){
 G.worldState.integratedEvents=Array.isArray(G.worldState.integratedEvents)?G.worldState.integratedEvents:[];
 const ev={id:`WE-${G.turn}-${Date.now().toString(36).slice(-5)}`,turn:G.turn,time:timeText(),type,sourceType,sourceId,summary,data};
 G.worldState.integratedEvents.unshift(ev);if(G.worldState.integratedEvents.length>60)G.worldState.integratedEvents.length=60;return ev
}
function recentIntegratedEvents(sourceType=null,sourceId=null,limit=6){
 return (G.worldState.integratedEvents||[]).filter(e=>(!sourceType||e.sourceType===sourceType)&&(!sourceId||e.sourceId===sourceId)).slice(0,limit)
}
function questSourceMeta(q){
 if(q.sourceType&&q.sourceId){
   if(q.sourceType==="organization")return {type:"organization",id:q.sourceId,name:worldOrg(q.sourceId)?.name||"組織"};
   if(q.sourceType==="authority"){const p=politicalEntity(q.politicalEntityId),o=authorityOffice(q.politicalEntityId,q.sourceId);return {type:"authority",id:q.sourceId,name:`${p?.name||"政治體"}・${o?.title||"統治機構"}`};}
   if(q.sourceType==="faith")return {type:"faith",id:q.sourceId,name:pantheon(q.sourceId)?.name||"神系"};
   if(q.sourceType==="facility")return {type:"facility",id:q.sourceId,name:DB.facilities[q.sourceId]?.name||"設施"};
   if(q.sourceType==="guild")return {type:"guild",id:q.sourceId,name:"冒險者公會"}
 }
 if(q.organizationId)return {type:"organization",id:q.organizationId,name:worldOrg(q.organizationId)?.name||"組織"};
 if(q.politicalAuthorityOfficeId){const p=politicalEntity(q.politicalEntityId),o=authorityOffice(q.politicalEntityId,q.politicalAuthorityOfficeId);return {type:"authority",id:q.politicalAuthorityOfficeId,name:`${p?.name||"政治體"}・${o?.title||"統治機構"}`};}
 if(q.faithPantheonId)return {type:"faith",id:q.faithPantheonId,name:pantheon(q.faithPantheonId)?.name||"神系"};
 if(q.type==="臨時委託")return {type:"facility",id:q.turninFacility||"",name:DB.facilities[q.turninFacility]?.name||"設施"};
 return {type:"guild",id:"ORG-001",name:"冒險者公會"}
}
function contextualDialogueWeight(r,fid){
 let w=r.weight||1;
 if(r.organization_id){
   if(orgState().memberships.includes(r.organization_id))w*=2.4;
   else if(orgState().discovered.includes(r.organization_id))w*=1.5;
   const rep=orgRep(r.organization_id);if(rep>10)w*=1.2;
 }
 if(r.source_ref?.type==="facility"&&r.source_ref.id===fid)w*=1.1;
 return w
}
function dynamicOrgIntelRows(fid){
 const rows=[];
 for(const e of (G.worldState.orgEvents||[]).slice(0,8)){
   const a=worldOrg(e.a),b=worldOrg(e.b);if(!a||!b)continue;
   const visibleA=publicOrganization(a)||orgState().discovered.includes(a.id),visibleB=publicOrganization(b)||orgState().discovered.includes(b.id);
   if(!visibleA&&!visibleB)continue;
   if(!["tavern","guild",a.primary_facility,b.primary_facility].includes(fid))continue;
   rows.push({
     id:`INT-DYN-${e.turn}-${e.a}-${e.b}`,facility:fid,category:"即時勢力動向",
     text:e.summary,reliability:fid==="guild"?82:68,reliability_label:fid==="guild"?"可靠":"可信",
     scope:"local_or_regional",tier_ceiling:"C",weight:2.2,source_type:fid==="guild"?"record":"witness",
     organization_id:visibleA?a.id:b.id,dynamic:true,source_ref:{type:"world_event",id:`${e.turn}:${e.a}:${e.b}`}
   })
 }
 return rows
}

function orgState(){
 const c=G.character;
 c.organizations=c.organizations||{membershipId:null,memberships:[],formerMemberships:[],reputation:{},discovered:[]};
 c.organizations.memberships=Array.isArray(c.organizations.memberships)?c.organizations.memberships:[];
 c.organizations.formerMemberships=Array.isArray(c.organizations.formerMemberships)?c.organizations.formerMemberships:[];
 c.organizations.reputation=c.organizations.reputation||{};
 c.organizations.discovered=Array.isArray(c.organizations.discovered)?c.organizations.discovered:[];
 const valid=[...new Set(c.organizations.memberships.filter(id=>worldOrg(id)))];
 let active=worldOrg(c.organizations.membershipId)?c.organizations.membershipId:null;
 if(!active&&valid.length)active=valid.at(-1);
 for(const id of valid)if(id!==active&&!c.organizations.formerMemberships.includes(id))c.organizations.formerMemberships.push(id);
 c.organizations.membershipId=active||null;
 c.organizations.memberships=active?[active]:[];
 G.worldState.orgRelations=G.worldState.orgRelations||{};
 G.worldState.orgEvents=G.worldState.orgEvents||[];
 return c.organizations
}
function orgRep(id){return orgState().reputation[id]||0}
function changeOrgRep(id,delta){const s=orgState();s.reputation[id]=clamp((s.reputation[id]||0)+delta,-100,100)}

function activeOrganizationId(){return orgState().membershipId||null}
function activeDisciplineId(){return disciplineState().membershipId||null}
function activeOrganizationBonus(){const id=activeOrganizationId(),o=id?worldOrg(id):null;return o?.member_bonus||null}
function activeDisciplineBonus(){const id=activeDisciplineId(),d=id?disciplineFor(id):null;return d?.member_bonus||null}
function affiliationBonusText(b){return b?.text||"無"}
function affiliationEffects(){
 const out={buy_price_pct:0,sell_price_pct:0,craft_success:0,quest_reward_pct:0,attack_pct:0,magic_attack_pct:0,defense_pct:0,magic_defense_pct:0,accuracy:0,evasion:0,critRate:0,attack_speed_pct:0,cast_speed_pct:0,initiative_pct:0,statusResist:0,statusAccuracy:0,perception:0,stealth:0,carryCapacity:0,healingPower:0,manaRegen:0,moveSpeed:0,blockRate:0,armorPenPct:0,magicPenPct:0,lootRate:0,summonPower:0,critDamage:0};
 for(const bonus of [activeOrganizationBonus(),activeDisciplineBonus()]){
   for(const [k,v] of Object.entries(bonus?.effects||{}))if(k in out)out[k]+=Number(v||0)
 }
 return out
}
function affiliationPriceMultiplier(kind){
 const a=affiliationEffects(),pct=kind==="buy"?a.buy_price_pct:a.sell_price_pct;
 return Math.max(.5,1+pct/100)
}
function normalizeAffiliationMemberships(){
 if(!G?.character)return;
 orgState();disciplineState()
}

function orgRelationKey(a,b){return [a,b].sort().join("|")}
function baseOrgRelation(a,b){
 const r=(DB.organization_relations||[]).find(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a));
 return r||{a,b,score:0,state:"competitive",reason:"沒有固定關係，維持有限競合"}
}
function orgRelationState(score){return score>=60?"allied":score>=25?"cooperative":score>-25?"competitive":score>-60?"hostile":"enemy"}
function currentOrgRelation(a,b){
 const base=baseOrgRelation(a,b),key=orgRelationKey(a,b),override=G.worldState.orgRelations?.[key];
 const score=override?.score??base.score;
 return {a,b,score,state:orgRelationState(score),reason:override?.reason||base.reason,lastEventTurn:override?.lastEventTurn??-999}
}
function setOrgRelation(a,b,score,reason,eventType){
 const key=orgRelationKey(a,b);G.worldState.orgRelations=G.worldState.orgRelations||{};
 G.worldState.orgRelations[key]={score:clamp(Math.round(score),-100,100),reason,lastEventTurn:G.turn,eventType};
}
function orgRelationLabel(s){return {allied:"結盟",cooperative:"合作",competitive:"競合",hostile:"敵視",enemy:"死敵"}[s]||s}
function publicOrganization(o){return o&&o.visibility==="public"&&o.legal_status==="legal"}
function localOrganizations(fid=null){
 const all=(DB.world_organizations||[]).filter(o=>{
   if(fid&&o.primary_facility!==fid)return false;
   if(publicOrganization(o))return true;
   return orgState().discovered.includes(o.id)
 });
 return all.filter(o=>G.character.level>=Math.min(o.min_join_level||1,G.character.level+20))
}
function discoverOrganization(id){
 const s=orgState();if(!s.discovered.includes(id)){s.discovered.push(id);if(s.discovered.length>80)s.discovered=s.discovered.slice(-80)}
}
function organizationCompatibility(o){
 let score=50+Math.round(orgRep(o.id)*.45)+Math.round((G.character.guildReputation||0)*.15);
 const cc=cls(G.character.classId),name=cc?.name||"",cat=o.category;
 if(cat==="軍事與武力"&&/(騎士|戰士|劍|武僧|聖武)/.test(name))score+=10;
 if(cat==="魔法與學術"&&/(法師|術|魔導|神官)/.test(name))score+=10;
 if(cat==="冒險與探索"&&/(遊俠|盜賊|劍|戰士)/.test(name))score+=7;
 if(G.character.level>=o.min_join_level)score+=8; else score-=25;
 for(const mid of orgState().memberships){
   const rel=currentOrgRelation(mid,o.id);
   if(rel.score<=-60)score-=30;
   else if(rel.score<=-25)score-=12;
   else if(rel.score>=60)score+=6;
 }
 return clamp(score,0,100)
}
function canJoinOrganization(o){
 if(!o?.joinable)return {ok:false,reason:"不可加入"};
 const s=orgState(),active=s.membershipId;
 if(active===o.id)return {ok:false,reason:"已加入"};
 if(active&&active!==o.id)return {ok:false,reason:`需先退出${worldOrg(active)?.name||"目前組織"}`};
 if(G.character.level<o.min_join_level)return {ok:false,reason:`需要Lv${o.min_join_level}`};
 if(orgRep(o.id)<(o.join_reputation||0))return {ok:false,reason:`需要組織聲望${o.join_reputation||0}`};
 if(o.visibility!=="public"&&!s.discovered.includes(o.id))return {ok:false,reason:"尚未建立聯絡"};
 return {ok:true,reason:""}
}
function attemptJoinOrganization(id){
 const o=worldOrg(id),gate=canJoinOrganization(o);if(!gate.ok){alert(gate.reason);return}
 const chance=organizationCompatibility(o),r=randomInt(1,100);
 if(r>chance){changeOrgRep(id,-1);log("組織",`${o.name}暫時拒絕你的加入申請（接受度${chance}/100，判定${r}）。`);openOrganization(id);return}
 const s=orgState();s.membershipId=id;s.memberships=[id];
 changeOrgRep(id,5);discoverOrganization(id);discoverScopeLore("organization",id,"加入組織");persist();
 log("組織",`你正式加入${o.name}，啟用「${o.member_bonus?.name||"組織加成"}」：${affiliationBonusText(o.member_bonus)}。`,"ok");openOrganization(id)
}
function leaveOrganization(id){
 const o=worldOrg(id),s=orgState();if(s.membershipId!==id||!confirm(`確定退出${o.name}？退出後將立即失去組織加成。`))return;
 if(!s.formerMemberships.includes(id))s.formerMemberships.push(id);
 s.membershipId=null;s.memberships=[];changeOrgRep(id,-8);persist();
 log("組織",`你退出${o.name}，「${o.member_bonus?.name||"組織加成"}」已取消。`);openOrganization(id)
}
function openWorldOrganizations(){
 const s=orgState(),known=(DB.world_organizations||[]).filter(o=>publicOrganization(o)||s.discovered.includes(o.id)),active=s.membershipId?worldOrg(s.membershipId):null;
 const groups=["冒險與探索","軍事與武力","黑暗與地下","商業與貿易","魔法與學術","王權／種族／職人"];
 const body=groups.map(cat=>{
   const rows=known.filter(o=>o.category===cat).slice(0,25).map(o=>`<button onclick="openOrganization('${o.id}')">${s.membershipId===o.id?"★ ":""}${o.name}</button>`).join("");
   return rows?`<div class="card"><b>${cat}</b><div class="actions">${rows}</div></div>`:""
 }).join("");
 const events=(G.worldState.orgEvents||[]).slice(0,5).map(e=>`<div class="small">${e.time}｜${e.summary}</div>`).join("")||"<div class='small'>目前沒有近期組織事件。</div>";
 showModal("世界組織",`<div class="card small">目前加入：${active?`${active.name}<br>加成：${affiliationBonusText(active.member_bonus)}`:"無"}<br>角色同時只能正式加入一個組織；退出後加成立即取消。公開組織可直接查看；地下組織需透過情報、奇遇或其他關係發現。</div><div class="card"><b>近期勢力動向</b>${events}</div>${body}`)
}
function openOrganization(id){
 const o=worldOrg(id);if(!o)return;discoverOrganization(id);
 const s=orgState(),member=s.membershipId===id,gate=canJoinOrganization(o);
 const rels=(DB.world_organizations||[]).filter(x=>x.id!==id).map(x=>({o:x,r:currentOrgRelation(id,x.id)})).filter(x=>Math.abs(x.r.score)>=25).sort((a,b)=>Math.abs(b.r.score)-Math.abs(a.r.score)).slice(0,5);
 const relHtml=rels.map(x=>`<div class="small">${x.o.name}：${orgRelationLabel(x.r.state)} ${x.r.score>=0?"+":""}${x.r.score}</div>`).join("")||"<div class='small'>目前沒有明顯外交關係。</div>";
 const b=o.member_bonus;
 showModal(o.name,`<div class="card"><b>${o.name}</b> <span class="tier">${o.alignment==="light"?"光明":o.alignment==="dark"?"黑暗":"中立"}</span><br>${o.category}｜${o.scope}<br><span class="small">${o.description}<br>聲望 ${orgRep(id)}｜主要據點介面：${DB.facilities[o.primary_facility]?.name||o.primary_facility}</span></div>
 <div class="card"><b>組織加成｜${b?.name||"未設定"}</b><br><span class="small">${affiliationBonusText(b)}<br>${member?"目前生效中；退出組織後立即取消。":"正式加入後生效；角色同時只能加入一個組織。"}</span></div>
 <div class="card"><b>主要關係</b>${relHtml}</div>
 <div class="actions">${member?`<button class="bad" onclick="leaveOrganization('${id}')">退出組織</button>`:`<button ${gate.ok?"":"disabled"} onclick="attemptJoinOrganization('${id}')">${gate.ok?`申請加入（接受度${organizationCompatibility(o)}/100）`:gate.reason}</button>`}
 <button onclick="openOrganizationContracts('${id}')">委託／契約</button><button onclick="openLoreScope('organization','${id}','${o.name}・歷史')">歷史文化</button><button onclick="openWorldOrganizations()">返回組織名錄</button></div>`)
}
function organizationContractCandidates(o){
 return (DB.organization_contract_archetypes||[]).filter(a=>a.categories.includes(o.category)).map(a=>{
   const q=JSON.parse(JSON.stringify(a));
   q.organizationId=o.id;q.name=`${o.name}・${a.label}`;q.description=`${o.name}發布的${a.label}。`;
   return q
 })
}
function openOrganizationContracts(id){
 const o=worldOrg(id);if(!o)return;
 if(o.visibility!=="public"&&!orgState().discovered.includes(id)){alert("尚未建立聯絡");return}
 const here=G.character.currentFacility===o.primary_facility;
 const rows=organizationContractCandidates(o).map(a=>{
   const active=(G.quests||[]).find(q=>q.organizationId===id&&q.templateId===a.id);
   const action=active
     ?(active.status==="ready"&&here?`<button class="good" onclick="turnInQuest('${active.id}','organization','${id}')">回報完成</button>`:`<button disabled>${active.status==="ready"?"需到"+DB.facilities[o.primary_facility].name+"回報":"進行中"}</button>`)
     :`<button ${here?"":"disabled"} onclick="acceptOrganizationContract('${id}','${a.id}')">${here?"接受契約":"需在"+DB.facilities[o.primary_facility].name+"接洽"}</button>`;
   return `<div class="card"><b>${a.name}</b> <span class="tier">${a.tier}</span><br><span class="small">${a.description}<br>目標：${questObjectiveText(a)}｜報酬${a.reward[0]}–${a.reward[1]}銀／${a.xp}XP｜組織聲望+2</span><div class="actions">${action}</div></div>`
 }).join("")||"<div class='card small'>目前沒有適合的契約。</div>";
 showModal(`${o.name}・委託／契約`,`<div class="card small">接取與回報地點：${DB.facilities[o.primary_facility]?.name||o.primary_facility}。</div>${rows}<div class="actions"><button onclick="openOrganization('${id}')">上一頁</button></div>`,`openOrganizationContracts(\'${id}\')`)
}
function acceptOrganizationContract(orgId,templateId){
 const o=worldOrg(orgId),a=(DB.organization_contract_archetypes||[]).find(x=>x.id===templateId);if(!o||!a)return;if(G.character.currentFacility!==o.primary_facility){alert(`請到${DB.facilities[o.primary_facility]?.name||"對應據點"}接洽。`);return}
 if((G.quests||[]).length>=DB.quest_system.max_active){alert(`同時最多接取 ${DB.quest_system.max_active} 個委託。`);return}
 if((G.quests||[]).some(q=>q.organizationId===orgId&&q.templateId===templateId)){alert("此組織的同類契約已在進行。");return}
 closeModal();if(!beginTurn("接受組織契約"))return;
 const reward=randomInt(a.reward[0],a.reward[1]),timeLimit=Math.max(72,questTimeAllowance(a));
 G.quests.push({id:`OQ-${orgId}-${templateId}-${Date.now().toString(36).slice(-5)}`,templateId:a.id,organizationId:orgId,name:`${o.name}・${a.label}`,tier:a.tier,type:"組織契約",description:`${o.name}發布的${a.label}。`,
 objective:JSON.parse(JSON.stringify(a.objective)),progress:0,status:"active",acceptedHour:totalHours(),deadlineHour:totalHours()+timeLimit,timeLimitHours:timeLimit,
 rewardSilver:reward,xp_reward:a.xp,organizationRepReward:2,turninFacility:o.primary_facility,completionGraceHours:24,
 viableLocationIds:a.objective.location_id?[a.objective.location_id]:[],sourceType:"organization",sourceId:orgId});
 log("組織契約",`接受${o.name}的「${a.label}」。`,"ok");endTurn(.1);openOrganizationContracts(orgId)
}
function openFacilityOrganizations(fid){
 const list=localOrganizations(fid).slice(0,20);
 const rows=list.map(o=>`<div class="itemrow"><span><b>${orgState().membershipId===o.id?"★ ":""}${o.name}</b>［${o.category}］<br><span class="small">${o.alignment==="dark"?"地下／灰色":"公開"}｜聲望${orgRep(o.id)}</span></span><button onclick="openOrganization('${o.id}')">查看</button></div>`).join("")||"<div class='card small'>目前沒有可公開聯絡的組織。</div>";
 showModal(`${DB.facilities[fid].name}・組織`,rows+`<div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`)
}
function orgEventTypeFor(rel,a,b){
 const oa=worldOrg(a),ob=worldOrg(b),positive=rel.score>20,hostile=rel.score<-25,dark=oa?.alignment==="dark"||ob?.alignment==="dark";
 const pool=positive?["合作","結盟","競爭","背叛"]:hostile?(dark?["妨礙","暗殺事件","競爭","停戰"]:["妨礙","競爭","停戰"]):["合作","競爭","妨礙"];
 return pool[rand(pool.length)]
}
function evaluateOrganizationDynamics(){
 G.worldState.orgRelations=G.worldState.orgRelations||{};G.worldState.orgEvents=Array.isArray(G.worldState.orgEvents)?G.worldState.orgEvents:[];
 if(!DB.organization_system||G.turn<=0||G.turn%DB.organization_system.dynamic_check_every_turns!==0)return false;
 if(Math.random()>DB.organization_system.dynamic_event_chance)return false;
 const base=(DB.organization_relations||[])[rand((DB.organization_relations||[]).length)];if(!base)return false;
 const rel=currentOrgRelation(base.a,base.b);if(G.turn-(rel.lastEventTurn||-999)<24)return false;
 let type=orgEventTypeFor(rel,base.a,base.b),delta=0;
 if(type==="合作")delta=8;
 if(type==="結盟")delta=12;
 if(type==="競爭")delta=-5;
 if(type==="妨礙")delta=-9;
 if(type==="背叛"){if(rel.score<=20)return false;delta=-20}
 if(type==="暗殺事件"){if(rel.score>-25&&worldOrg(base.a)?.alignment!=="dark"&&worldOrg(base.b)?.alignment!=="dark")return false;delta=-18}
 if(type==="停戰")delta=12;
 const next=clamp(rel.score+delta,-100,100),reason=`${type}使雙方關係由${rel.score}變為${next}`;
 setOrgRelation(base.a,base.b,next,reason,type);
 const oa=worldOrg(base.a),ob=worldOrg(base.b),ev={turn:G.turn,time:timeText(),type,a:base.a,b:base.b,summary:`${oa.name}與${ob.name}發生「${type}」事件。`};
 G.worldState.orgEvents.unshift(ev);if(G.worldState.orgEvents.length>30)G.worldState.orgEvents.length=30;emitIntegratedEvent("organization_relation", "organization", base.a, ev.summary,{otherOrganizationId:base.b,eventType:type,relationScore:next});
 log("世界組織",`${ev.summary} 目前關係：${orgRelationLabel(orgRelationState(next))}。`);return true
}
function generateOrganizationEncounter(context){
 if(!["探索","旅行"].includes(context)||Math.random()>.022)return null;
 const publicPool=(DB.world_organizations||[]).filter(o=>publicOrganization(o)&&G.character.level>=Math.min(o.min_join_level,20));
 if(!publicPool.length)return null;
 const o=publicPool[rand(publicPool.length)];discoverOrganization(o.id);
 return {organizationId:o.id,name:`${o.name}的旅途接觸`,text:`你遇到與${o.name}有關的人員，他們正在處理地方層級事務。`,context}
}
function maybeOrganizationEncounter(context){
 if(G.pendingOrganizationEncounter)return false;
 const e=generateOrganizationEncounter(context);if(!e)return false;
 G.pendingOrganizationEncounter=e;openPendingOrganizationEncounter();persist();return true
}
function openPendingOrganizationEncounter(){
 const e=G.pendingOrganizationEncounter;if(!e)return;const o=worldOrg(e.organizationId);
 showModal(`組織奇遇・${o.name}`,`<div class="card">${e.text}<br><span class="small">你可以詢問工作或保持距離；此事件不會直接把你拉進大陸級主線。</span></div><div class="actions"><button class="good" onclick="resolveOrganizationEncounter(true)">交談</button><button onclick="resolveOrganizationEncounter(false)">離開</button></div>`)
}
function resolveOrganizationEncounter(engage){
 const e=G.pendingOrganizationEncounter;if(!e)return;const o=worldOrg(e.organizationId);
 if(engage){changeOrgRep(o.id,1);log("組織奇遇",`你與${o.name}的人員短暫交談，建立了初步聯絡。`,"ok")}
 else log("組織奇遇",`你沒有介入${o.name}的地方事務。`);
 G.pendingOrganizationEncounter=null;closeModal();persist();renderAll()
}
function renderFacility(fid){const f=DB.facilities[fid],l=loc(G.character.locationId),ix=facilityIntegration(fid);let b=`<div class="xu-indoor-scene" data-facility="${fid}" role="img" aria-label="原創設施室內場景"><svg viewBox="0 0 800 500" aria-hidden="true"><use href="./assets/art/town/facility-interiors.svg#${fid}"></use></svg><div class="xu-indoor-caption"><b>${f.name}</b><span>設施室內</span></div></div><div class="card"><b>${f.name}</b><br><span class="small">${l.name}［${l.tier}］｜關聯組織${ix.organization_ids.length}｜情報${ix.intel_record_ids.length}｜對話${ix.dialogue_record_ids.length}${ix.subjob_ids.length?`｜可學副職${ix.subjob_ids.length}`:""}</span></div><div class="actions"><button onclick="facilityDialogue('${fid}')">對話</button><button onclick="facilityIntel('${fid}')">情報</button>`;if(f.shop)b+=`<button onclick="shopBuy('${fid}')">${fid==="tavern"||fid==="inn"?"購買料理":"購買"}</button><button onclick="shopSell('${fid}')">${fid==="tavern"?"收購食材":"出售"}</button>`;if(fid==="guild")b+=`<button onclick="guildQuests()">公會委託</button><button onclick="openGuildBuyback()">收購櫃檯</button><button onclick="openRecruitTeammates('guild')">招募隊友</button><button onclick="openJoinAdventureParty()">加入冒險團</button><button onclick="classTraining()">本職技能</button><button onclick="guildBasicTraining()">跨職基礎技能</button><button onclick="openClassAdvancement()">職業進階</button>`;if(fid==="tavern")b+=`<button onclick="openRecruitTeammates('tavern')">招募隊友</button>`;if(fid==="tavern")b+=`<button onclick="openFaithEncounter('tavern')">信仰人物</button>`;if(fid==="tavern"||fid==="inn")b+=`<button class="good" onclick="openMealService('${fid}')">用餐${mealPeriod()?`・${DB.meal_service_system.service_windows[mealPeriod()].label}`:""}</button>`;if(fid==="mageguild")b+=`<button onclick="openSummonResearch()">召喚研究</button><button onclick="openContractRitual()">契約儀式</button>`;if(fid==="enchanter")b+=`<button onclick="openContractRitual()">契約儀式</button>`;if(["blacksmith","tailor","alchemy"].includes(fid))b+=`<button onclick="openCrafting('${fid}')">製作</button>`;if(fid==="blacksmith")b+=`<button onclick="openRepair()">修理裝備</button>`;if(fid==="church"||fid==="clinic")b+=`<button onclick="facilityHeal('${fid}')">治療</button>`;if(fid==="church")b+=`<button onclick="openFaithDirectory()">神系與教會</button><button onclick="openFaithMissions()">神殿委託</button><button onclick="openFaithProfile()">祈禱／誓言</button><button onclick="openFaithEncounter('church')">地方神職</button>`;if(fid==="alchemy"||fid==="church")b+=`<button onclick="facilityQuest('${fid}')">臨時委託</button>`;if(DB.subjobs.some(s=>s.facilities.includes(fid)))b+=`<button onclick="learnSubjobHere('${fid}')">副職業學習</button>`;if(fid==="inn")b+=`<button onclick="innRest()">住宿</button>`;if(["guild","tavern","general","blacksmith","tailor","alchemy","enchanter","mageguild","clinic"].includes(fid))b+=`<button onclick="openFacilityOrganizations('${fid}')">組織／勢力</button>`;if(disciplineContactsHere(fid).length)b+=`<button onclick="openDisciplineDirectory('all','${fid}')">武技／魔法流派 ${disciplineContactsHere(fid).length}</button>`;if(fid===authorityLiaisonFacility()&&politicalContextForLocation().polity)b+=`<button onclick="openAuthorityRequests(\'${politicalContextForLocation().polity.id}\')">地方政務</button>`;b+="</div>";showModal(f.name,b,`renderFacility(\'${fid}\')`)}
function gameHourDecimal(){return G.worldTime.hour+G.worldTime.minute/60}
function mealPeriod(){
 const h=gameHourDecimal(),w=DB.meal_service_system.service_windows;
 for(const [key,x] of Object.entries(w))if(h>=x.start&&h<x.end)return key;
 return null
}
function nextMealPeriodText(){
 const h=gameHourDecimal(),w=DB.meal_service_system.service_windows;
 if(h<w.breakfast.start)return "早餐 06:00開始";
 if(h<w.lunch.start)return "中餐 11:00開始";
 if(h<w.dinner.start)return "晚餐 17:00開始";
 return "明日早餐 06:00開始"
}
function openMealService(fid){
 if(!["tavern","inn"].includes(fid)||G.character.currentFacility!==fid)return;
 const period=mealPeriod(),venue=DB.meal_service_system.venues[fid],sys=DB.meal_service_system;
 if(!period){
   showModal(`${venue.label}・用餐`,`<div class="card">現在是 ${String(G.worldTime.hour).padStart(2,"0")}:${String(G.worldTime.minute).padStart(2,"0")}，廚房目前不供應正餐。<br><span class="small">${nextMealPeriodText()}。供餐：早餐06:00–10:30／中餐11:00–14:30／晚餐17:00–21:30。</span></div><div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`);return
 }
 const label=sys.service_windows[period].label,meals=venue[period]||[];
 const rows=meals.map(m=>`<div class="itemrow"><span><b>${m.name}</b>｜${m.price}銀<br><span class="small">飢餓-${m.hunger}｜口渴-${m.thirst||0}｜疲勞-${m.fatigue||0}${m.hp?`｜HP+${m.hp}`:""}</span></span><button ${G.character.moneySilver>=m.price?"":"disabled"} onclick="eatFacilityMeal('${fid}','${period}','${m.id}')">用餐</button></div>`).join("");
 showModal(`${venue.label}・${label}`,`<div class="card small">目前供應${label}｜${String(G.worldTime.hour).padStart(2,"0")}:${String(G.worldTime.minute).padStart(2,"0")}。不同時段餐價與份量不同。</div>${rows}<div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`)
}
function eatFacilityMeal(fid,period,mealId){
 if(G.character.currentFacility!==fid||mealPeriod()!==period)return;
 const m=(DB.meal_service_system.venues[fid]?.[period]||[]).find(x=>x.id===mealId);if(!m||G.character.moneySilver<m.price)return;
 closeModal();if(!beginTurn("用餐"))return;
 G.character.moneySilver-=m.price;
 G.character.hunger=clamp(G.character.hunger-m.hunger,0,120);
 G.character.thirst=clamp(G.character.thirst-(m.thirst||0),0,120);
 G.character.fatigue=clamp(G.character.fatigue-(m.fatigue||0),0,120);
 if(m.hp)G.character.hp=clamp(G.character.hp+m.hp,0,G.character.maxHp);
 log("用餐",`${DB.facilities[fid].name}：享用${m.name}，支付${m.price}銀。`,"ok");
 endTurn(.5)
}

function regionalContentProfile(regionId,polityId=null){
 const rows=(DB.regional_content_profiles||[]).filter(x=>x.region_id===regionId);
 if(!rows.length)return null;
 if(polityId){const exact=rows.find(x=>x.polity_id===polityId);if(exact)return exact}
 return rows.find(x=>x.id!=="RCP-BLACKMOON")||rows[0]
}
function currentRegionalProfile(){const c=politicalContextForLocation();return regionalContentProfile(c.region?.id,c.polity?.id)}
function regionalNpcArchetypes(regionId,polityId=null){return (DB.regional_npc_archetypes||[]).filter(x=>x.region_id===regionId&&(!polityId||!x.polity_id||x.polity_id===polityId))}
function regionalAdventureHooks(regionId,polityId=null){return (DB.regional_adventure_hooks||[]).filter(x=>x.region_id===regionId&&(!polityId||!x.polity_id||x.polity_id===polityId))}
function regionalEconomyContext(regionId,polityId=null){const rows=(DB.regional_economy_profiles||[]).filter(x=>x.region_id===regionId);return (polityId?rows.find(x=>x.polity_id===polityId):null)||rows[0]||null}
function regionalLifeEvents(regionId){return (DB.regional_life_events||[]).filter(x=>x.region_id===regionId)}
function openRegionalContext(){
 const c=politicalContextForLocation(),p=currentRegionalProfile();
 if(!p){showModal("地方生活脈絡",`<div class="card small">目前位置尚未歸入可驗證的宏觀地區；只顯示所在地圖本身資料，不補造政治與文化背景。</div><div class="actions"><button onclick="openWorldLore()">返回世界誌</button></div>`);return}
 const eco=regionalEconomyContext(p.region_id,p.polity_id),npcs=regionalNpcArchetypes(p.region_id,p.polity_id).slice(0,6),hooks=regionalAdventureHooks(p.region_id,p.polity_id).slice(0,4),life=regionalLifeEvents(p.region_id);
 const npcRows=npcs.map(x=>`<div class="small">• <b>${x.role}</b>｜${x.knowledge_scope}｜戰力上限${x.combat_tier_ceiling}</div>`).join("");
 const hookRows=hooks.map(x=>`<div class="small">• <b>${x.title}</b>：${x.premise}</div>`).join("");
 const lifeRows=life.map(x=>`<div class="small">• <b>${x.name}</b>：${x.text}</div>`).join("");
 showModal(`${p.region_name}・地方生活`,`<div class="card"><b>${p.region_name}</b><br><span class="small">${p.identity}<br>地形：${p.terrain}｜建議層級：${p.recommended_tier}<br>常見輸出：${p.common_exports.join("、")}<br>常見輸入：${p.common_imports.join("、")}<br>常見飲食：${p.food_staples.join("、")}<br>反覆風險：${p.recurring_risks.join("、")}</span></div><div class="card"><b>居民與從業者原型</b>${npcRows}</div><div class="card"><b>可衍生冒險脈絡</b>${hookRows}</div><div class="card"><b>地方生活事件</b>${lifeRows}</div><div class="card"><b>經濟原則</b><br><span class="small">本地輸出只會略便宜、外來貨只會略高；真正大幅價格變動必須由戰爭、災害、封路或組織事件觸發。</span></div><div class="actions"><button onclick="openWorldLore()">返回世界誌</button></div>`)
}
function contextualRecordMatches(r){
 const c=politicalContextForLocation();
 if(r.world_region_id&&r.world_region_id!==c.region?.id)return false;
 if(r.political_entity_id&&r.political_entity_id!==c.polity?.id)return false;
 return true
}
function runWorldDynamics(){
 G.worldState=G.worldState||{};G.worldState.orchestrator=G.worldState.orchestrator||{lastWorldDynamicTurn:-1};
 if(G.worldState.orchestrator.lastWorldDynamicTurn===G.turn)return false;
 G.worldState.orchestrator.lastWorldDynamicTurn=G.turn;
 evaluateOrganizationDynamics();evaluatePoliticalDynamics();evaluateAuthorityDynamics();evaluateDisciplineDynamics();evaluateSTierInfluence();
 return true
}
function systemDomainHealth(){
 const ds=DB.system_orchestrator?.domains||[],g=new Set(DB.generators.map(x=>x.id)),a=new Set(DB.management_ai.map(x=>x.id)),seenG=new Set(),seenA=new Set(),issues=[];
 for(const d of ds){for(const id of d.generator_ids||[]){if(!g.has(id))issues.push(`生成器領域引用缺失:${id}`);if(seenG.has(id))issues.push(`生成器重複領域:${id}`);seenG.add(id)}for(const id of d.management_ai_ids||[]){if(!a.has(id))issues.push(`管理AI領域引用缺失:${id}`);if(seenA.has(id))issues.push(`管理AI重複領域:${id}`);seenA.add(id)}}
 for(const id of g)if(!seenG.has(id))issues.push(`孤立生成器:${id}`);for(const id of a)if(!seenA.has(id))issues.push(`孤立管理AI:${id}`);
 return {issues,generatorAssigned:seenG.size,aiAssigned:seenA.size,domainCount:ds.length}
}
function dialogueTimeTag(){
 const h=gameHourDecimal();return h<10.5?"morning":h>=17?"evening":"day"
}
function generateDialogue(fid){
 const records=(DB.dialogue_database?.records||[]).filter(x=>x.facility===fid&&contextualRecordMatches(x));
 if(!records.length)return null;
 const tag=dialogueTimeTag(),recent=new Set((G.dialogueMemory||[]).slice(-6));
 let pool=records.filter(x=>x.time_tag===tag&&!recent.has(x.id));
 if(!pool.length)pool=records.filter(x=>!recent.has(x.id));
 if(!pool.length)pool=records;
 const row=weightedPick(pool.map(x=>[x,contextualDialogueWeight(x,fid)]));
 G.dialogueMemory=(G.dialogueMemory||[]).concat(row.id).slice(-12);
 return row
}
function intelDayKey(){return `${G.worldTime.year}-${G.worldTime.season}-${G.worldTime.day}`}
function intelRecordValid(x,fid){return !!x&&x.facility===fid&&contextualRecordMatches(x)&&Number.isFinite(x.reliability)&&x.reliability>=0&&x.reliability<=100&&tierOrder(x.tier_ceiling||"F")<=tierOrder("C")}


function dynamicRegionalRumorRows(fid){
 const l=loc(G?.character?.locationId);if(!l)return [];
 const rid=l.world_region_id||l.region_id;if(!rid)return [];
 const rows=regionalRumorsFor(rid);if(!rows.length)return [];
 const day=String(intelDayKey?.()||G.turn||0);
 let seed=0;for(const ch of `${day}|${rid}|${fid}`)seed=(seed*31+ch.charCodeAt(0))>>>0;
 const start=seed%rows.length,ordered=rows.slice(start).concat(rows.slice(0,start));
 return ordered.map((r,i)=>({
   id:`DYN-${r.id}-${fid}`,
   facility:fid,
   category:`地方傳聞・${r.theme}`,
   reliability:r.reliability==="中"?68:r.reliability==="低"?42:50,
   reliability_label:r.reliability||"未知",
   text:r.public_claim,
   source_type:"rumor",
   source_ref:{region_id:rid,rumor_id:r.id},
   world_region_id:rid,
   political_entity_id:l.political_entity_id||null,
   tier_ceiling:"C",
   weight:i<2?1.4:0.8,
   dynamic:true,
   rumor_id:r.id
 }))
}
function generateIntelBoard(fid){
 G.intelBoardCache=G.intelBoardCache||{};
 const day=intelDayKey(),prefix=`${day}|`,key=`${day}|${G.character.locationId}|${fid}`;
 for(const k of Object.keys(G.intelBoardCache))if(!k.startsWith(prefix))delete G.intelBoardCache[k];
 if(G.intelBoardCache[key])return G.intelBoardCache[key];
 const staticPool=(DB.intel_database?.records||[]).filter(x=>intelRecordValid(x,fid));
 const dynamicPool=[...dynamicRegionalRumorRows(fid),...dynamicDisciplineIntelRows(fid),...dynamicAuthorityIntelRows(fid),...dynamicPoliticalIntelRows(fid),...dynamicOrgIntelRows(fid)],chosen=[],used=new Set();
 if(dynamicPool.length){const x=dynamicPool[0];chosen.push(x);used.add(x.id)}
 const pool=[...dynamicPool,...staticPool];
 while(chosen.length<3&&used.size<pool.length){
   const avail=pool.filter(x=>!used.has(x.id));if(!avail.length)break;
   const x=weightedPick(avail.map(v=>[v,(v.weight||1)*(v.organization_id&&orgState().memberships.includes(v.organization_id)?1.8:1)]));
   used.add(x.id);chosen.push(x)
 }
 G.intelBoardCache[key]=chosen;persist();return chosen
}
function explorationIntel(){return Array.isArray(G.explorationIntel)?G.explorationIntel:[]}
function recordExplorationIntel(locationId,result,roll){
 const l=loc(locationId);if(!l)return;
 G.explorationIntel=explorationIntel();
 const key=`${locationId}|${String(result)}`,old=G.explorationIntel.find(x=>x.key===key),quality=roll>=14?"較完整":"片段";
 if(old){old.lastSeenTurn=G.turn;old.time=timeText();old.timesSeen=(old.timesSeen||1)+1;if(roll>(old.roll||0)){old.roll=roll;old.quality=quality;old.text=`${l.name}探索紀錄：${result}。${roll>=14?"路線與環境資訊較完整。":"目前只掌握片段線索。"}`}}
 else G.explorationIntel.push({id:`EXPINT-${locationId}-${Math.abs(String(result).split("").reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),7)).toString(36)}`,key,sourceType:"exploration",locationId,worldRegionId:l.world_region_id||null,politicalEntityId:l.political_entity_id||null,recordedTurn:G.turn,lastSeenTurn:G.turn,time:timeText(),roll,quality,text:`${l.name}探索紀錄：${result}。${roll>=14?"路線與環境資訊較完整。":"目前只掌握片段線索。"}`,timesSeen:1});
 if(G.explorationIntel.length>(DB.quest_system?.quest_intel_system?.exploration_record_cap||120))G.explorationIntel=G.explorationIntel.slice(-(DB.quest_system?.quest_intel_system?.exploration_record_cap||120));
 persist()
}
function knownIntelEntry(k){
 const cached=Object.values(G.intelBoardCache||{}).flat().find(v=>v.id===k.id),src=IDX.intel.get(k.id)||cached||null;
 return {id:k.id,sourceType:"facility",facility:k.facility||src?.facility||null,locationId:k.locationId||null,worldRegionId:src?.world_region_id||loc(k.locationId)?.world_region_id||null,politicalEntityId:src?.political_entity_id||loc(k.locationId)?.political_entity_id||null,sourceRef:k.sourceRef||src?.source_ref||null,category:src?.category||"情報",reliability:src?.reliability??null,reliabilityLabel:src?.reliability_label||null,time:k.time||null,recordedTurn:k.recordedTurn??null,text:k.textSnapshot||src?.text||"已記錄情報"}
}
function questIntelContext(refId){return (G.quests||[]).find(q=>q.id===refId)||questTemplate(refId)||null}
function questIntelTargets(q){
 const o=q?.objective||{},tokens=[],ids=[];
 if(o.item_id){const d=item(o.item_id);ids.push(o.item_id);if(d?.name)tokens.push(d.name)}
 for(const k of o.monster_keywords||[])tokens.push(k);
 for(const c of o.checkpoints||[])tokens.push(c);
 if(o.action)tokens.push(o.action);
 const viable=(q?.viableLocationIds||questViableLocations(q)||[]).filter(Boolean),locNames=viable.map(id=>loc(id)?.name).filter(Boolean);
 if(o.location_id&&!viable.includes(o.location_id))viable.push(o.location_id);
 for(const n of locNames)tokens.push(n);
 return {tokens:[...new Set(tokens.filter(x=>String(x).length>=2))],ids:[...new Set(ids)],viable:[...new Set(viable)],locNames:[...new Set(locNames)]}
}
function questIntelScore(q,r){
 const t=questIntelTargets(q),text=String(r.text||""),l=r.locationId?loc(r.locationId):null;let score=0;
 if(r.locationId&&t.viable.includes(r.locationId))score+=9;
 for(const n of t.locNames)if(text.includes(n))score+=6;
 for(const tok of t.tokens)if(text.includes(tok))score+=5;
 const ref=r.sourceRef?.id||r.sourceRef;if(ref&&t.ids.includes(ref))score+=8;
 const regions=new Set(t.viable.map(id=>loc(id)?.world_region_id).filter(Boolean)),polities=new Set(t.viable.map(id=>loc(id)?.political_entity_id).filter(Boolean));
 if((r.worldRegionId||l?.world_region_id)&&regions.has(r.worldRegionId||l?.world_region_id))score+=2;
 if((r.politicalEntityId||l?.political_entity_id)&&polities.has(r.politicalEntityId||l?.political_entity_id))score+=1;
 if(q?.sourceType==="authority"&&r.sourceRef?.id===q.sourceId)score+=4;
 if(q?.sourceType==="organization"&&r.sourceRef?.id===q.sourceId)score+=4;
 return score
}
function questKnownIntel(refId){
 const q=questIntelContext(refId);if(!q)return [];
 const facility=(G.knownIntel||[]).map(knownIntelEntry),explore=explorationIntel().map(x=>({...x,sourceType:"exploration"}));
 return [...facility,...explore].map(r=>({r,score:questIntelScore(q,r)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||((b.r.recordedTurn||0)-(a.r.recordedTurn||0))).slice(0,DB.quest_system?.quest_intel_system?.max_display_records||16).map(x=>x.r)
}
function questIntelSourceLabel(r){
 if(r.sourceType==="exploration")return `探索取得・${loc(r.locationId)?.name||"未知地點"}`;
 return `城鎮設施取得・${DB.facilities[r.facility]?.name||"未知設施"}${r.locationId?`／${loc(r.locationId)?.name||""}`:""}`
}
function openQuestIntel(refId){
 const q=questIntelContext(refId);if(!q)return;
 const rows=questKnownIntel(refId),body=rows.length?rows.map(r=>`<div class="card"><b>${r.category||"探索情報"}</b>${r.reliability!=null?`｜可信度 ${r.reliability}%${r.reliabilityLabel?`（${r.reliabilityLabel}）`:""}`:""}<br>${r.text}<br><span class="small">來源：${questIntelSourceLabel(r)}${r.time?`｜取得：${r.time}`:""}</span></div>`).join(""):`<div class="card small">目前沒有已取得且與此委託相關的情報。你可以先到城鎮設施蒐集情報，或親自前往相關地點探索。</div>`;
 showModal(`${q.name}・已取得情報`,`<div class="card small">只顯示角色已經取得的情報；不會揭露尚未記錄的設施消息、未探索地點或隱藏資料。</div>${body}`)
}
function intelArchiveEntries(){
 const facility=(G.knownIntel||[]).map(knownIntelEntry).map(x=>({...x,archiveSource:"facility"}));
 const explore=explorationIntel().map(x=>({...x,archiveSource:"exploration"}));
 return [...facility,...explore].sort((a,b)=>((b.recordedTurn??b.lastSeenTurn??0)-(a.recordedTurn??a.lastSeenTurn??0))||String(b.time||"").localeCompare(String(a.time||"")))
}
function intelArchiveCard(r){
 if(r.archiveSource==="exploration")return `<div class="card intel-archive-card"><b>${loc(r.locationId)?.name||"未知地點"}・探索情報</b><br>${r.text||"已取得探索紀錄"}<br><span class="small">來源：探索取得${r.quality?`｜完整度：${r.quality}`:""}${r.time?`｜取得：${r.time}`:""}${r.timesSeen>1?`｜確認 ${r.timesSeen} 次`:""}</span></div>`;
 return `<div class="card intel-archive-card"><b>${r.category||"地方情報"}</b>${r.reliability!=null?`｜可信度 ${r.reliability}%${r.reliabilityLabel?`（${r.reliabilityLabel}）`:""}`:""}<br>${r.text||"已記錄情報"}<br><span class="small">來源：城鎮設施取得・${DB.facilities[r.facility]?.name||"未知設施"}${r.locationId?`／${loc(r.locationId)?.name||""}`:""}${r.time?`｜取得：${r.time}`:""}</span></div>`
}
function openIntelArchive(){
 const rows=intelArchiveEntries(),facility=rows.filter(x=>x.archiveSource==="facility"),explore=rows.filter(x=>x.archiveSource==="exploration");
 const facHtml=facility.length?facility.map(intelArchiveCard).join(""):`<div class="card small intel-archive-card intel-archive-empty">尚未在城鎮設施記錄情報。</div>`;
 const expHtml=explore.length?explore.map(intelArchiveCard).join(""):`<div class="card small intel-archive-card intel-archive-empty">尚未透過探索取得情報。</div>`;
 showModal("已取得情報",`<div class="card small">固定情報頁只顯示角色已經取得的資料；不會讀取未記錄的設施消息、未探索地點或隱藏資料。查閱情報不消耗回合。每一類最多同時顯示4則，可使用右側拖曳條上下捲動。</div><section class="intel-archive-section"><h3>城鎮設施取得（${facility.length}）</h3><div class="intel-archive-scroll" data-intel-source="facility" aria-label="城鎮設施取得情報清單">${facHtml}</div></section><section class="intel-archive-section"><h3>探索取得（${explore.length}）</h3><div class="intel-archive-scroll" data-intel-source="exploration" aria-label="探索取得情報清單">${expHtml}</div></section>`,"openIntelArchive()")
}
function knownIntelHas(id){return (G.knownIntel||[]).some(x=>x.id===id)}
function recordIntel(id){
 const cached=Object.values(G.intelBoardCache||{}).flat().find(v=>v.id===id);
 const x=IDX.intel.get(id)||cached;if(!x||knownIntelHas(id))return;
 G.knownIntel=G.knownIntel||[];
 G.knownIntel.push({id:x.id,recordedTurn:G.turn,time:timeText(),facility:x.facility,locationId:G.character.locationId,sourceRef:x.source_ref||null,textSnapshot:x.dynamic?x.text:null});
 if(x.organization_id){discoverOrganization(x.organization_id);discoverScopeLore("organization",x.organization_id,"情報");log("組織情報",`你從情報中得知${worldOrg(x.organization_id)?.name||"一個組織"}的動向。`)}
 if(x.political_entity_id){discoverScopeLore("polity",x.political_entity_id,"政治情報")}
 if(x.discipline_id){discoverDiscipline(x.discipline_id,"情報")}
 if(G.knownIntel.length>120)G.knownIntel=G.knownIntel.slice(-120);
 emitIntegratedEvent("intel_recorded","intel",x.id,`記錄情報：${x.text}`,x.source_ref||{});
 persist();log("情報",`記錄情報：${x.text}`,"ok");facilityIntel(x.facility)
}
function facilityDialogue(fid){
 const f=DB.facilities[fid],row=generateDialogue(fid);if(row?.discipline_id)discoverDiscipline(row.discipline_id,"對話");
 if(!row){showModal(f.name+"・對話",`<div class="card">對方目前沒有特別想談的事。</div><button onclick="renderFacility('${fid}')">上一頁</button>`);return}
 showModal(f.name+"・對話",`<div class="card"><b>${row.speaker_role}</b><br>${row.text}</div><div class="small">情境：${dialogueTimeTag()==="morning"?"上午":dialogueTimeTag()==="evening"?"傍晚／夜間":"白天"}｜一般對話不等於已驗證情報。</div><div class="actions"><button onclick="facilityDialogue('${fid}')">再聊聊</button><button onclick="renderFacility('${fid}')">上一頁</button></div>`)
}
function facilityIntel(fid){
 const rows=generateIntelBoard(fid).filter(x=>!knownIntelHas(x.id)),f=DB.facilities[fid];
 const body=rows.length?rows.map(x=>`<div class="card"><b>${x.category}</b>｜可信度 ${x.reliability}%（${x.reliability_label}）<br>${x.text}<br><span class="small">來源：${x.source_type==="record"?"紀錄／專業來源":x.source_type==="witness"?"往來者／目擊者":"流言"}｜範圍：地方／區域</span><div class="actions"><button onclick="recordIntel('${x.id}')">記錄情報</button></div></div>`).join(""):"<div class='card'>目前沒有新的情報；已取得的情報不再顯示於設施情報列表。</div>";
 showModal(f.name+"・情報",`<div class="card small">同一設施在同一遊戲日提供固定情報板；已取得的情報會立即從此列表移除。可信度代表來源可靠程度，不代表流言必定為真。</div>${body}<div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`,`facilityIntel(\'${fid}\')`)
}

function questListAction(active,acceptHtml,expectedFacility=null,returnView=null,returnArg=null){
 if(!active)return acceptHtml;
 syncQuestInventoryProgressOne(active,true);
 const turnin=active.turninFacility||expectedFacility||"guild";
 if(active.status==="ready"){
   if(G.character.currentFacility===turnin){
     const v=returnView?`,'${returnView}'`:"";
     const a=returnArg!=null?`,'${String(returnArg)}'`:"";
     return `<button class="good" onclick="turnInQuest('${active.id}'${v}${a})">回報完成</button>`
   }
   return `<button disabled>需到${DB.facilities[turnin]?.name||"指定設施"}回報</button>`
 }
 return `<button disabled>進行中 ${active.progress||0}/${active.objective?.target||1}</button>`
}
function guildQuests(){
 if(G.character.currentFacility!=="guild")return;
 syncAllQuestInventoryProgress(true);
 const lv=G.character.level,restricted=Math.max(0,(G.character.guildRestrictionUntilTurn||0)-G.turn);
 const q=DB.quest_templates.filter(x=>{const active=(G.quests||[]).some(a=>a.templateId===x.id&&a.turninFacility==="guild");return active||(lv>=x.min_level&&lv<=x.max_level&&questTemplateViable(x)&&questMarketAvailable(x))});
 const rows=q.map(x=>{
   const active=(G.quests||[]).find(a=>a.templateId===x.id&&a.turninFacility==="guild");
   const disabled=restricted>0||(G.quests||[]).length>=DB.quest_system.max_active;
   const time=questTimeAllowance(x),rr=adjustedRewardRange(x);
   const places=questViableLocations(x).filter(id=>Number.isFinite(shortestTravelHours(G.character.locationId,id))).sort((a,b)=>shortestTravelHours(G.character.locationId,a)-shortestTravelHours(G.character.locationId,b)).slice(0,3).map(id=>loc(id)?.name).filter(Boolean);
   const accept=`<button ${disabled?"disabled":""} onclick="acceptGuildQuest('${x.id}')">${restricted>0?"暫停受理":"接取委託"}</button>`;
   const action=questListAction(active,accept,"guild","guild");
   const live=active?`<br>目前進度：${active.progress||0}/${active.objective?.target||1}${active.status==="ready"?"｜<span class='ok'>已達成，可回報</span>":""}`:"";
   return `<div class="card"><b>${x.name}</b> <span class="tier">${x.tier}</span>［${x.type}］<br><span class="small">${x.description}<br>目標：${questObjectiveText(x)}${live}<br>可執行地點：${places.join("、")||"無"}<br>合理時限：${time}小時｜報酬：${rr[0]}～${rr[1]}銀／${DB.progression_system.quest_xp_by_tier[x.tier]}XP｜<span class="${rr[2]<1?'market-low':''}">${marketPressureText(x)}</span></span><div class="actions">${action}</div></div>`
 }).join("")||"<div class='small'>目前沒有符合條件或市場需求的公會委託。</div>";
 const notice=restricted?`<div class="card warnText">因近期解除／逾期委託，還需 ${restricted} 回合才能接取新公會委託。</div>`:"";
 showModal("冒險者公會・公會委託",notice+rows+`<div class="actions"><button onclick="renderFacility('guild')">上一頁</button></div>`,"guildQuests()")
}
function skillKey(s){return s?.canonical_skill_id||s?.id||`${s?.name||""}|${s?.tier||""}|${s?.kind||""}`}
function sharedSkill(id){return (DB.shared_skills||[]).find(s=>s.id===id)}
function knownSkillKeys(){return new Set((G.character.skills||[]).map(skillKey))}
function sharedTrackAllowed(current,track){
 const from=classCombatTrack(current);
 if(from==="hybrid")return ["physical","magic","hybrid"].includes(track);
 return from===track
}
function skillRequirementText(s){
 const parts=[];
 if(s.required_stat)parts.push(`${s.required_stat}≥${DB.guild_training.primary_stat_requirement}`);
 if(s.weapon_requirements?.length)parts.push(`使用需求：${s.weapon_requirements.join("／")}`);
 return parts.join("｜")
}
function findPoolSkillByKey(cid,key){return (DB.skill_pools[cid]||[]).find(s=>skillKey(s)===key||s.name===key)}
function sharedSkillForLegacy(s){
 const base=s?.base_name||String(s?.name||"").replace(/－通用（.*?）$/,"");
 const candidates=(DB.shared_skills||[]).filter(x=>x.base_name===base);
 if(!candidates.length)return null;
 const sig=[s.kind,s.damage_type,s.element??null,s.resource,s.target,s.status??null];
 return candidates.find(c=>(c.legacy_signatures||[]).some(ls=>JSON.stringify(ls)===JSON.stringify(sig)))
   ||candidates.find(c=>c.kind===s.kind&&c.damage_type===s.damage_type&&c.resource===s.resource&&c.target===s.target)
   ||null
}
function normalizeCharacterSkills(){
 const c=G?.character;if(!c||!Array.isArray(c.skills))return;
 const out=[],seen=new Map();
 for(const old of c.skills){
   const shared=old.canonical_skill_id?sharedSkill(old.canonical_skill_id):sharedSkillForLegacy(old);
   const pool=findPoolSkillByKey(c.classId,skillKey(old))||findPoolSkillByKey(c.classId,old.name);
   const base=shared||pool||old;
   const s={...base,type:old.type||"戰鬥",mastery:old.mastery??0,skillXp:old.skillXp,crossClass:old.crossClass||false};
   normalizeSkillXp(s);
   const key=skillKey(s);
   if(seen.has(key)){
     const kept=seen.get(key);
     kept.skillXp=Math.max(Number(kept.skillXp||0),Number(s.skillXp||0));
     kept.mastery=Math.max(Number(kept.mastery||0),Number(s.mastery||0));
     kept.crossClass=kept.crossClass||s.crossClass;
     syncSkillMasteryFromXp(kept);
     continue
   }
   seen.set(key,s);out.push(s)
 }
 if(out.length<2){
   for(const s of (DB.skill_pools[c.classId]||[]).filter(x=>x.tier==="F")){
     if(out.length>=2)break;const key=skillKey(s);if(seen.has(key))continue;
     const add={...s,type:"戰鬥",mastery:1,skillXp:0};normalizeSkillXp(add);seen.set(key,add);out.push(add)
   }
 }
 c.skills=out.slice(0,10)
}
function classTraining(){
 const pool=DB.skill_pools[G.character.classId]||[],known=knownSkillKeys(),seen=new Set(),avail=[];
 for(const s of pool){
   const key=skillKey(s);if(seen.has(key)||known.has(key)||tierOrder(s.tier)>tierOrder(G.character.combatGrade))continue;
   seen.add(key);avail.push(s)
 }
 const rows=avail.map(s=>`<div class="itemrow"><span><b>${s.name}</b> <span class="tier">${s.tier}</span>［${s.kind}／${s.school||"戰技"}］<br>
 <span class="small">${skillDescriptionText(s)}<br>${s.kind!=="被動"?`命中${(s.accuracy||0)+skillLevelBonus(s,"accuracy_bonus")}｜${s.resource==="mana"?"MP":"體力"}${s.resource_cost??s.stamina_cost??0}`:"常駐生效"}${s.canonical_skill_id?`｜通用技能`:""}</span></span>
 <button onclick="learnCombatSkill('${skillKey(s)}')">學習</button></div>`).join("")||"<div class='small'>目前沒有符合階級的新技能。</div>";
 showModal("冒險者公會・本職技能",rows+`<div class="actions"><button onclick="renderFacility('guild')">上一頁</button></div>`)
}
function classCombatTrack(c){return c?.combat_track||((c?.resource_type==="混合")?"hybrid":(c?.resource_type==="MP"?"magic":"physical"))}
function canCrossTrainClass(fromClass,toClass){
 const from=classCombatTrack(fromClass),to=classCombatTrack(toClass);
 if(from==="hybrid")return ["physical","magic","hybrid"].includes(to);
 return from===to
}
function combatTrackText(c){return {"physical":"物理系","magic":"魔法系","hybrid":"魔武雙修"}[classCombatTrack(c)]||"未分類"}
function guildBasicTraining(){
 if(G.character.currentFacility!=="guild")return;
 const current=cls(G.character.classId),rows=[],known=knownSkillKeys(),seenLocal=new Set();

 const rowTrack=(s,c=null)=>{
   if(c?.combat_track==="magic")return "magic";
   if(c?.combat_track==="physical")return "physical";
   if(s?.shared_scope==="magic")return "magic";
   if(s?.shared_scope==="physical")return "physical";
   if(s?.damage_type==="magic"||s?.scaling_stat==="magic")return "magic";
   return "physical"
 };

 for(const s of (DB.shared_skills||[])){
   if(s.tier!=="F"||known.has(s.id)||!sharedTrackAllowed(current,s.shared_scope))continue;
   const statOk=(G.character.stats[s.required_stat]||0)>=DB.guild_training.primary_stat_requirement;
   const moneyOk=G.character.moneySilver>=DB.guild_training.cross_profession_fee;
   rows.push({shared:true,key:s.id,s,ok:statOk&&moneyOk,source:`通用（${s.shared_scope_label}）`,track:rowTrack(s)})
 }

 for(const [cid,pool] of Object.entries(DB.skill_pools)){
   const c=cls(cid);if(!c||c.sealed||cid===G.character.classId||!canCrossTrainClass(current,c))continue;
   for(const s of pool){
     const key=skillKey(s);if(s.tier!=="F"||s.canonical_skill_id||known.has(key))continue;
     const localKey=`${cid}|${key}`;if(seenLocal.has(localKey))continue;seenLocal.add(localKey);
     const statOk=(G.character.stats[c.primary]||0)>=DB.guild_training.primary_stat_requirement;
     const moneyOk=G.character.moneySilver>=DB.guild_training.cross_profession_fee;
     rows.push({shared:false,key,cid,s,ok:statOk&&moneyOk,source:`${c.name}［${combatTrackText(c)}］`,track:rowTrack(s,c)})
   }
 }

 const sorter=(a,b)=>(a.shared===b.shared?0:(a.shared?-1:1))||a.s.name.localeCompare(b.s.name,"zh-Hant");
 const physical=rows.filter(r=>r.track==="physical").sort(sorter);
 const magic=rows.filter(r=>r.track==="magic").sort(sorter);

 const rowHtml=r=>`<div class="itemrow"><span><b>${r.s.name}</b> <span class="tier">F</span>｜${r.source}<br>
 <span class="small">${skillDescriptionText(r.s)}<br>前置：${r.shared?skillRequirementText(r.s):`${cls(r.cid).primary}≥${DB.guild_training.primary_stat_requirement}`}</span></span>
 <button ${r.ok?"":"disabled"} onclick="learnGuildBasic('${r.key}'${r.shared?"":`,'${r.cid}'`})">${r.ok?"學習":"未達條件"}</button></div>`;

 const emptyText=track=>{
   const currentTrack=current.combat_track||"physical";
   if(currentTrack==="hybrid")return "目前沒有可學習的公開F級技能。";
   if(currentTrack!==track)return track==="physical"?"目前職業不可跨學物理系技能。":"目前職業不可跨學魔法系技能。";
   return "目前沒有符合條件或尚未學會的公開F級技能。"
 };

 const section=(title,track,list,icon)=>`<section class="guild-cross-skill-section">
   <h3>${icon} ${title} <span class="small">(${list.length})</span></h3>
   ${list.length?list.map(rowHtml).join(""):`<div class="card small">${emptyText(track)}</div>`}
 </section>`;

 const rule=`目前職業：${current.name}［${combatTrackText(current)}］。物理系只能跨學物理系；魔法系只能跨學魔法系；只有魔武雙修可同時跨學兩系。魔武雙修通用技能依主要作用系別歸類且只顯示一次。`;
 showModal("冒險者公會・跨職基礎技能",
   `<div class="card small">${rule}<br>只教授公開F級技能；每項${DB.guild_training.cross_profession_fee}銀。通用技能以canonical ID去重。</div>`+
   section("物理系","physical",physical,"⚔")+
   section("魔法系","magic",magic,"✦")+
   `<div class="actions"><button onclick="renderFacility('guild')">上一頁</button></div>`,
   "guildBasicTraining()")
}
function learnGuildBasic(ref,cid=""){
 if(G.character.currentFacility!=="guild")return;
 const current=cls(G.character.classId);let s=null,sourceClass=null;
 if(ref.startsWith("SK-COM-")){
   s=sharedSkill(ref);if(!s||s.tier!=="F"||!sharedTrackAllowed(current,s.shared_scope))return;
   if((G.character.stats[s.required_stat]||0)<DB.guild_training.primary_stat_requirement)return
 }else{
   sourceClass=cls(cid);s=findPoolSkillByKey(cid,ref);
   if(!sourceClass||sourceClass.sealed||!s||s.tier!=="F"||!canCrossTrainClass(current,sourceClass))return;
   if((G.character.stats[sourceClass.primary]||0)<DB.guild_training.primary_stat_requirement)return
 }
 if(G.character.moneySilver<DB.guild_training.cross_profession_fee)return;
 if(knownSkillKeys().has(skillKey(s))){alert("已學會同一技能，不能從其它職業重複學習。");return}
 if(G.character.skills.length>=10){alert("技能已達10個上限，請先遺忘技能。");return}
 closeModal();if(!beginTurn("公會跨職技能訓練"))return;
 G.character.moneySilver-=DB.guild_training.cross_profession_fee;
 G.character.skills.push({...s,type:"戰鬥",mastery:.5,crossClass:true});
 log("技能",`學會 ${s.name}［F］${s.canonical_skill_id?"（跨職通用）":sourceClass?`（${sourceClass.name}基礎）`:""}。`,"ok");endTurn(4)
}
function learnCombatSkill(key){
 const d=findPoolSkillByKey(G.character.classId,key);if(!d)return;
 if(knownSkillKeys().has(skillKey(d))){alert("已學會同一技能。");return}
 if(G.character.skills.length>=10){alert("技能已達10個，請先在角色頁遺忘技能。");return}
 closeModal();if(!beginTurn("學習技能"))return;
 const shared=d.canonical_skill_id?sharedSkill(d.canonical_skill_id):null;
 G.character.skills.push({...shared||d,type:"戰鬥",mastery:1});
 log("技能",`學會${(shared||d).name}［${d.tier}］。`,"ok");endTurn(3)
}
function prereqText(s){return Object.entries(s.prereq||{}).map(([k,v])=>`${k}≥${v}`).join("、")}
function meetsSubjob(s){return Object.entries(s.prereq||{}).every(([k,v])=>(G.character.stats[k]||0)>=v)}
function learnSubjobHere(fid){
 if(G.character.subjobs.length>=2){showModal("副職業",`已達2個副職業上限。<div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`);return}
 const list=DB.subjobs.filter(s=>s.facilities.includes(fid)&&!G.character.subjobs.some(x=>x.id===s.id));
 const rows=list.map(s=>{const ok=meetsSubjob(s)&&G.character.moneySilver>=s.fee;return `<div class="itemrow"><span><b>${s.name}</b> <span class="tier">${s.tier}</span><br><span class="small">${s.desc}<br>前置：${prereqText(s)}｜學費${s.fee}銀</span></span><button ${ok?"":"disabled"} onclick="learnSubjob('${fid}','${s.id}')">${ok?"學習":"未達條件"}</button></div>`}).join("")||"<div class='small'>此設施沒有可學副職業。</div>";
 showModal("副職業學習",rows+`<div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`)
}
function learnSubjob(fid,sid){const s=sub(sid);if(!s||!s.facilities.includes(fid)||!meetsSubjob(s)||G.character.moneySilver<s.fee)return;closeModal();if(!beginTurn("學習副職業"))return;G.character.moneySilver-=s.fee;G.character.subjobs.push({id:sid,grade:"F",xp:0});log("副職業",`取得${s.name}［F］入門資格。`,"ok");endTurn(4)}
function facilityQuest(fid){
 syncAllQuestInventoryProgress(true);
 const lv=G.character.level;
 const pool=DB.shop_quests.filter(q=>{if(q.facility!==fid)return false;const active=(G.quests||[]).some(a=>a.templateId===q.id&&a.turninFacility===fid);return active||(lv>=q.min_level&&lv<=q.max_level&&questTemplateViable(q)&&questMarketAvailable(q))});
 const rows=pool.map(q=>{
   const active=(G.quests||[]).find(a=>a.templateId===q.id&&a.turninFacility===fid);
   const rr=adjustedRewardRange(q);
   const accept=`<button onclick="acceptFacilityQuest('${fid}','${q.id}')">接取委託</button>`;
   const action=questListAction(active,accept,fid,"facility",fid);
   const live=active?`<br>目前進度：${active.progress||0}/${active.objective?.target||1}${active.status==="ready"?"｜<span class='ok'>已達成，可回報</span>":""}`:"";
   return `<div class="card"><b>${q.name}</b> <span class="tier">${q.tier}</span><br><span class="small">${q.desc}<br>目標：${questObjectiveText(q)}${live}<br>時限約${questTimeAllowance(q)}小時｜報酬${rr[0]}～${rr[1]}銀／${DB.progression_system.quest_xp_by_tier[q.tier]}XP｜${marketPressureText(q)}</span><div class="actions">${action}</div></div>`
 }).join("")||"<div class='small'>目前沒有符合條件或市場需求的臨時委託。</div>";
 showModal(`${DB.facilities[fid].name}・臨時委託`,rows+`<div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`,`facilityQuest(\'${fid}\')`)
}
function acceptFacilityQuest(fid,templateId){
 if(G.character.currentFacility!==fid)return;const t=questTemplate(templateId);if(!t||t.facility!==fid||!questTemplateViable(t)||!questMarketAvailable(t))return;if((G.quests||[]).length>=DB.quest_system.max_active){alert(`同時最多接取 ${DB.quest_system.max_active} 個委託。`);return}if((G.quests||[]).some(q=>q.templateId===templateId)){alert("此委託已接取。");return}closeModal();if(!beginTurn("接取設施委託"))return;const rr=adjustedRewardRange(t),reward=randomInt(rr[0],rr[1]),timeLimit=questTimeAllowance(t),xp=DB.progression_system.quest_xp_by_tier[t.tier]||12;const q={id:`AQ-${templateId}-${Date.now().toString(36).slice(-5)}`,templateId:t.id,name:t.name,tier:t.tier,type:"設施委託",description:t.desc,objective:JSON.parse(JSON.stringify(t.objective)),progress:0,status:"active",acceptedHour:totalHours(),deadlineHour:totalHours()+timeLimit,timeLimitHours:timeLimit,rewardSilver:reward,xp_reward:xp,target_spawn_boost:t.target_spawn_boost||0,completionGraceHours:t.completion_grace_hours||24,viableLocationIds:questViableLocations(t),turninFacility:fid,sourceType:"facility",sourceId:fid,marketFactorAtAcceptance:rr[2]};G.quests.push(q);syncQuestInventoryProgressOne(q,false);log("委託",`接取 ${t.name}［${t.tier}］，回報地點：${DB.facilities[fid].name}。`,"ok");endTurn(.1);facilityQuest(fid)
}

function facilityHeal(fid){
 const oath=(DB.faith_oaths||[]).find(x=>x.id===faithState().oathId);
 const base=fid==="clinic"?8:5,fee=Math.max(1,base-(fid==="church"?(oath?.church_heal_discount||0):0));
 if(G.character.moneySilver<fee){alert("銀幣不足");return}
 G.character.moneySilver-=fee;G.character.hp=clamp(G.character.hp+12,0,G.character.maxHp);
 for(const m of partyMembers()){m.hp=clamp((m.hp||1)+12,1,m.maxHp||partyMemberCombatStats(m).maxHp)}
 log("治療",`${DB.facilities[fid].name}治療，支付${fee}銀${fid==="church"&&oath?.church_heal_discount?`（誓言折扣${oath.church_heal_discount}銀）`:""}。`,"ok");
 persist();renderFacility(fid)
}

function marketDayKey(){return `${G.worldTime.year}-${G.worldTime.season}-${G.worldTime.day}`}
function marketFacilityState(fid){
 G.worldState.localMarkets=G.worldState.localMarkets||{};const key=`${G.character.locationId}|${fid}`,day=marketDayKey(),rank=tierOrder(loc(G.character.locationId)?.tier||"F"),base=[80,160,320,640,1280,2500,5000][rank]||80;
 let s=G.worldState.localMarkets[key];if(!s||s.day!==day)s=G.worldState.localMarkets[key]={day,budgetMax:Math.round(base*(fid==="guild"?1.5:["tavern","inn"].includes(fid)?.65:1)),budgetRemaining:Math.round(base*(fid==="guild"?1.5:["tavern","inn"].includes(fid)?.65:1)),stock:{}};
 s.stock=s.stock||{};s.budgetRemaining=clamp(Number(s.budgetRemaining??s.budgetMax),0,Math.max(1,s.budgetMax*2));return s
}
function marketStockLimit(d){
 const access=Math.max(0,tierOrder(loc(G.character.locationId)?.tier||"F")-tierOrder(d?.tier||"F")),bulk=["食材","素材","草藥素材","工藝素材","礦石","藥劑","料理","食物","補給"].includes(d?.type);
 return clamp((bulk?4:1)+access*(bulk?2:1),1,bulk?12:5)
}
function marketStockQty(fid,d){const s=marketFacilityState(fid);if(s.stock[d.id]==null)s.stock[d.id]=marketStockLimit(d);return Math.max(0,Math.floor(s.stock[d.id]))}
function shopBuyUnitPrice(d){const disc=clamp(talentSpecial("buyDiscount"),0,.25);return Math.max(1,Math.ceil(d.value*1.15*regionalItemMarketFactor(d)*(1-disc)*affiliationPriceMultiplier("buy")))}
function shopSellUnitPrice(d){const bonus=clamp(talentSpecial("sellBonus"),0,.25);return Math.max(1,Math.floor(d.value*.5*(1+bonus)*regionalItemMarketFactor(d)*affiliationPriceMultiplier("sell")))}
function openGuildBuyback(){
 if(G.character.currentFacility!=="guild")return;const market=marketFacilityState("guild"),list=G.character.inventory.map((x,i)=>[x,i]).filter(([x])=>!!item(x.id));
 const rows=list.map(([x,i])=>{const d=item(x.id),p=guildBuybackUnitPrice(d),factor=Math.round(regionalItemMarketFactor(d)*100),affordable=Math.min(x.qty||1,Math.floor(market.budgetRemaining/p));return `<div class="itemrow"><span><b>${d.name}</b> <span class="tier">${d.tier}</span> ×${x.qty||1}<br><span class="small">市場係數${factor}%｜一般市場收購價再減10%｜單價${p}銀</span></span><span><button ${affordable>=1?"":"disabled"} onclick="guildSellItem(${i},${p},1)">出售1</button>${(x.qty||1)>1?`<button ${affordable>=1?"":"disabled"} onclick="guildSellItem(${i},${p},${x.qty||1})">${affordable<(x.qty||1)?`出售${affordable}`:"全售"}</button>`:""}</span></div>`}).join("")||"<div class='card small'>背包內目前沒有可出售物品。</div>";
 showModal("冒險者公會・收購櫃檯",`<div class="card small">收購所有背包物品種類；價格連動地區供需，固定比一般市場收購價低10%。本日剩餘收購資金：<b>${market.budgetRemaining}銀</b>，隔日恢復。</div>${rows}<div class="actions"><button onclick="renderFacility('guild')">上一頁</button></div>`)
}
function guildSellItem(index,unitPrice,qty=1){
 if(G.character.currentFacility!=="guild")return;const x=G.character.inventory[index],d=x&&item(x.id);if(!x||!d)return;const market=marketFacilityState("guild"),price=guildBuybackUnitPrice(d),affordable=Math.floor(market.budgetRemaining/price);
 qty=Math.max(0,Math.min(Number(qty)||1,x.qty||1,affordable));if(qty<1){alert("公會本日收購資金不足，請隔日再來。");return}const id=x.id;if(!removeItem(id,qty,index))return;market.budgetRemaining-=price*qty;G.character.moneySilver+=price*qty;persist();openGuildBuyback()
}
function shopBuy(fid){
 if(G.character.currentFacility!==fid)return;
 const f=DB.facilities[fid],stock=(f.stock||[]).map(item).filter(Boolean),market=marketFacilityState(fid);
 const rows=stock.map(d=>{const p=shopBuyUnitPrice(d),qty=marketStockQty(fid,d);return `<div class="itemrow"><span><b>${d.name}</b> <span class="tier">${d.tier}</span><br><span class="small">${itemStatsText(d)}｜今日庫存 ${qty}</span></span><span>${p}銀 <button ${qty>0?"":"disabled"} onclick="buyItem('${fid}','${d.id}',${p})">${qty>0?"購買":"售罄"}</button></span></div>`}).join("")||"目前沒有庫存。";
 showModal(f.name+"・購買",`<div class="card small">商品有每日庫存上限，售罄後於隔日補貨。</div>${rows}<div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`)
}
function buyItem(fid,id,p){
 if(G.character.currentFacility!==fid)return;const d=item(id),f=DB.facilities[fid];if(!d||!(f?.stock||[]).includes(id))return;const market=marketFacilityState(fid),price=shopBuyUnitPrice(d),qty=marketStockQty(fid,d);if(qty<=0){alert("今日庫存已售罄。");shopBuy(fid);return}if(G.character.moneySilver<price){alert("銀幣不足");return}
 G.character.moneySilver-=price;market.stock[id]=qty-1;market.budgetRemaining=Math.min(market.budgetMax*2,market.budgetRemaining+price);addItem(id);persist();shopBuy(fid)
}
function canSellTo(fid,d){if(fid==="tavern")return d.type==="食材";if(fid==="blacksmith")return ["主武器","盔甲","頭盔","手套","鞋子","披風","礦石"].includes(d.type);if(fid==="alchemy")return ["素材","藥劑"].includes(d.type);return true}
function shopSell(fid){
 if(G.character.currentFacility!==fid)return;
 const market=marketFacilityState(fid),list=G.character.inventory.map((x,i)=>[x,i]).filter(([x])=>{const d=item(x.id);return d&&canSellTo(fid,d)});
 const rows=list.map(([x,i])=>{const d=item(x.id),p=shopSellUnitPrice(d),ok=market.budgetRemaining>=p;return `<div class="itemrow"><span>${d.name} <span class="tier">${d.tier}</span> ×${x.qty||1}</span><span>${p}銀 <button ${ok?"":"disabled"} onclick="sellItem('${fid}',${i},${p})">出售1</button></span></div>`}).join("")||"沒有此設施會收購的物品。";
 showModal(DB.facilities[fid].name+"・出售",`<div class="card small">本日剩餘收購資金：<b>${market.budgetRemaining}銀</b>，隔日恢復。</div>${rows}<div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`)
}
function sellItem(fid,index,p){
 if(G.character.currentFacility!==fid)return;const x=G.character.inventory[index],d=x&&item(x.id);if(!x||!d||!canSellTo(fid,d))return;const market=marketFacilityState(fid),price=shopSellUnitPrice(d);if(market.budgetRemaining<price){alert("店家本日收購資金不足，請隔日再來。");return}
 if(!removeItem(x.id,1,index))return;market.budgetRemaining-=price;G.character.moneySilver+=price;persist();shopSell(fid)
}
function repairServiceCost(eq,d){
 const base=Math.max(1,Math.ceil((eq.maxDurability-eq.durability)*d.value/d.durability*.25));
 const disc=clamp(talentSubjobBonus("SJ-REPAIR","serviceDiscount"),0,.35);
 return Math.max(1,Math.ceil(base*(1-disc)))
}
function openRepair(){
 const rows=[];
 for(const [slot,eq] of Object.entries(G.character.equipment)){if(eq&&eq.durability<eq.maxDurability){const d=item(eq.id),cost=repairServiceCost(eq,d);rows.push(`<div class="itemrow"><span>${slot}：${d.name} <span class="tier">${d.tier}</span><br><span class="dur">${eq.durability}/${eq.maxDurability}</span></span><button onclick="repairEquipped('${slot}',${cost})">修理 ${cost}銀</button></div>`)}}
 const off=offhandEquip();if(off&&off.durability<off.maxDurability){const d=item(off.id),cost=repairServiceCost(off,d);rows.push(`<div class="itemrow"><span>副手：${d.name} <span class="tier">${d.tier}</span><br><span class="dur">${off.durability}/${off.maxDurability}</span></span><button onclick="repairOffhand(${cost})">修理 ${cost}銀</button></div>`)}
 G.character.inventory.forEach((x,i)=>{if(x.durability!=null&&x.durability<x.maxDurability){const d=item(x.id),cost=repairServiceCost(x,d);rows.push(`<div class="itemrow"><span>背包：${d.name}<br><span class="dur">${x.durability}/${x.maxDurability}</span></span><button onclick="repairInventory(${i},${cost})">修理 ${cost}銀</button></div>`)}});
 showModal("鐵匠鋪・修理",(rows.join("")||"目前沒有需要修理的裝備。")+`<div class="actions"><button onclick="renderFacility('blacksmith')">上一頁</button></div>`)
}
function repairOffhand(cost){const eq=offhandEquip();if(!eq||G.character.moneySilver<cost){alert("銀幣不足");return}G.character.moneySilver-=cost;eq.durability=eq.maxDurability;persist();openRepair()}
function repairEquipped(slot,cost){if(G.character.moneySilver<cost){alert("銀幣不足");return}G.character.moneySilver-=cost;const eq=G.character.equipment[slot];eq.durability=eq.maxDurability;persist();openRepair()}
function repairInventory(i,cost){if(G.character.moneySilver<cost){alert("銀幣不足");return}G.character.moneySilver-=cost;G.character.inventory[i].durability=G.character.inventory[i].maxDurability;persist();openRepair()}
function innRest(){closeModal();if(!beginTurn("旅館住宿"))return;if(G.character.moneySilver<6){log("旅館","住宿費不足。","warnText");endTurn(.1);return}G.character.moneySilver-=6;G.character.fatigue=clamp(G.character.fatigue-75,0,120);G.character.hp=G.character.maxHp;healPartyFull();endTurn(8)}

function craftEffectText(d){
 if(!d)return "無資料";
 const out=[],use=d.use||{},combat=d.combat||{},buff=d.buff||{};
 const add=(text)=>{if(text&&!out.includes(text))out.push(text)};
 const signed=(n)=>`${Number(n)>0?"+":""}${Math.round(Number(n)*100)/100}`;
 const pctSpeed=(n)=>`${Number(n)>0?"+":""}${Math.round(Number(n)*100)}%`;

 if(use.hunger){
   const n=Number(use.hunger);
   add(n<0?`降低飢餓${Math.abs(n)}`:`增加飢餓${n}`)
 }
 if(use.thirst){
   const n=Number(use.thirst);
   add(n<0?`降低口渴${Math.abs(n)}`:`增加口渴${n}`)
 }
 if(use.hp)add(`恢復HP ${combatScalar(use.hp)}`);
 if(use.hp_percent)add(`HP恢復至${use.hp_percent}%`);
 if(use.stamina)add(`恢復SP ${combatScalar(use.stamina)}`);
 if(use.mana)add(`恢復MP ${combatScalar(use.mana)}`);
 if(use.mana_percent)add(`MP恢復至${use.mana_percent}%`);
 if(Array.isArray(use.conditions)&&use.conditions.length){
   const names={poison:"中毒",bleed:"流血",burn:"燃燒",freeze:"冰凍",fear:"恐懼",blind:"致盲",slow:"緩慢"};
   add(`清除${use.conditions.map(x=>names[x]||x).join("、")}`)
 }
 if(d.revive)add(`倒下時復甦並恢復${d.revive.hp_percent||0}%HP`);
 if(d.toxicity)add(`毒性+${d.toxicity}`);
 if(d.battle_effect){
   const be=d.battle_effect;
   add(`投擲造成${be.damage||0}${be.element?`點${be.element}屬性`:"點"}傷害`)
 }
 if(d.weapon_oil)add(`武器塗油，持續${d.weapon_oil.rounds||4}回合`);
 if(d.tool_effect)add(`工具效果：${d.tool_effect}`);

 const combatNames={
   attack:"物理攻擊",magicPower:"魔法攻擊",defense:"物理防禦",magicDefense:"魔法防禦",
   accuracy:"命中",evasion:"閃避",critRate:"爆擊率",critDamage:"爆擊傷害",
   blockRate:"格擋率",statusResist:"異常抗性",attackSpeed:"攻擊速度",castSpeed:"施法速度"
 };
 const combatPctKeys=new Set(["accuracy","evasion","critRate","critDamage","blockRate","statusResist"]);
 const combatParts=[];
 for(const [k,v] of Object.entries(combat)){
   const n=Number(v||0);if(!n)continue;
   if(k==="attackSpeed"||k==="castSpeed")combatParts.push(`${combatNames[k]||k}${pctSpeed(n)}`);
   else if(combatPctKeys.has(k))combatParts.push(`${combatNames[k]||k}${signed(n)}%`);
   else combatParts.push(`${combatNames[k]||k}${signed(n)}`)
 }
 if(combatParts.length){
   if(d.type==="料理")add(`餐後增益：${combatParts.join("、")}${d.duration?`（${d.duration}小時）`:""}`);
   else add(combatParts.join("、"))
 }

 const buffParts=[];
 const buffNames={
   attack:"物理攻擊",magicPower:"魔法攻擊",defense:"物理防禦",magicDefense:"魔法防禦",
   accuracy:"命中",evasion:"閃避",critRate:"爆擊率",blockRate:"格擋率",statusResist:"異常抗性",
   hp_regen:"HP回復",mana_regen:"MP回復",lifeSteal:"生命偷取",thorns:"反傷",
   resist_fire:"火抗性",resist_ice:"冰抗性",resist_lightning:"雷抗性",resist_water:"水抗性",
   resist_poison:"毒抗性",resist_dark:"暗抗性",resist_light:"光抗性",allResist:"全抗性"
 };
 const buffPctKeys=new Set(["accuracy","evasion","critRate","blockRate","statusResist","lifeSteal","resist_fire","resist_ice","resist_lightning","resist_water","resist_poison","resist_dark","resist_light","allResist"]);
 for(const [k,v] of Object.entries(buff)){
   if(k==="hours")continue;
   const n=Number(v||0);if(!n)continue;
   if(k==="attackSpeed"||k==="castSpeed")buffParts.push(`${combatNames[k]||k}${pctSpeed(n)}`);
   else if(k.startsWith("stat_"))buffParts.push(`${k.slice(5)}${signed(n)}`);
   else if(buffPctKeys.has(k))buffParts.push(`${buffNames[k]||k}${signed(n)}%`);
   else buffParts.push(`${buffNames[k]||k}${signed(n)}`)
 }
 if(buffParts.length)add(`使用增益：${buffParts.join("、")}${buff.hours?`（${buff.hours}小時）`:""}`);

 return out.join("｜")||d.desc||"無額外能力效果"
}
function craftResultLine(d){
 return `成品：${d?.name||"未知"}｜效果：${craftEffectText(d)}`
}
function itemStatsText(d){
 const a=[];
 // PLAYER-FACING ITEM DESCRIPTION POLICY:
 // Keep category/material/requirements/rarity and all mechanical effects.
 // Acquisition sources, crafting profession/grade, recipe links and crafting-component metadata remain in DB only.
 if(d.catalog_subcategory)a.push(d.catalog_subcategory);
 if(d.consumable_group)a.push(d.consumable_group);if(d.material_group)a.push(d.material_group);if(d.tool_effect)a.push(`工具：${d.tool_effect}`);if(d.knowledge_tag)a.push(`知識：${d.knowledge_tag}`);if(d.monster_drop_group)a.push(d.monster_drop_group);
 if(d.material)a.push(d.material);
 if(d.required_level)a.push(`建議Lv${d.required_level}+`);
 if(d.rarity)a.push(d.rarity);
 if(d.sealed)a.push("封印中：高階加成受限");
 if(d.combat){
   const names={attack:"攻擊",magicPower:"魔法威力",defense:"防禦",magicDefense:"魔防",accuracy:"命中",evasion:"閃避",critRate:"爆擊",critDamage:"爆傷",attackSpeed:"攻速",castSpeed:"施法速度",blockRate:"格擋",statusResist:"抗性"};
   for(const [k,v] of Object.entries(d.combat))if(v)a.push(`${names[k]||k}${v>0?"+":""}${typeof v==="number"&&Math.abs(v)<1?v.toFixed(2):v}`);
 }
 if(d.use?.hp)a.push(`HP+${d.use.hp}`);if(d.use?.hp_percent)a.push(`HP恢復至${d.use.hp_percent}%`);
 if(d.use?.mana)a.push(`MP+${d.use.mana}`);if(d.use?.mana_percent)a.push(`MP恢復至${d.use.mana_percent}%`);
 if(d.use?.stamina)a.push(`體力+${d.use.stamina}`);if(d.use?.hunger)a.push(`飢餓${d.use.hunger}`);if(d.use?.thirst)a.push(`口渴${d.use.thirst}`);
 if(d.revive)a.push(`倒下自動復甦${d.revive.hp_percent}%`);
 if(d.toxicity)a.push(`毒性+${d.toxicity}`);
 if(d.battle_effect)a.push(`投擲${d.battle_effect.damage||0}傷害${d.battle_effect.element?`／${d.battle_effect.element}`:""}`);
 if(d.weapon_oil)a.push(`武器塗油／${d.weapon_oil.rounds||4}回合`);
 if(d.durability)a.push(`耐久${d.durability}`);if(d.weight!=null)a.push(`重量${Number(d.weight).toFixed(d.weight<1?2:1)}kg`);
 return a.join("｜")||d.type
}
function statusHitChance(attAcc,targetRes,base=50){return clamp(Math.round(base+attAcc-targetRes),5,95)}
function applyEnemyStatus(status,baseChance=50,rounds=2){
 if(!G.battle?.active||!DB.status_system.definitions[status])return false;const e=G.battle.enemy,cs=combatStats(),chance=statusHitChance(cs.statusAccuracy,e.statusResist||0,baseChance);
 if(Math.random()*100>=chance){battleLog(`${e.name}抵抗「${statusName(status)}」。`);return false}
 G.battle.enemyStatuses=G.battle.enemyStatuses||[];const old=G.battle.enemyStatuses.find(x=>x.id===status);
 if(old)old.rounds=Math.max(old.rounds,rounds);else G.battle.enemyStatuses.push({id:status,rounds});
 battleLog(`${e.name}受到「${statusName(status)}」影響（${chance}%判定）。`);return true
}
function applyPlayerStatus(status,enemy,baseChance=35,rounds=2){
 if(!DB.status_system.definitions[status])return false;const cs=combatStats(),targetRes=status==="poison"?poisonResistance():cs.statusResist,chance=statusHitChance(enemy.statusAccuracy||10,targetRes,baseChance);
 if(Math.random()*100>=chance){battleLog(`${G.character.name}抵抗「${statusName(status)}」。`);return false}
 G.character.statusEffects=G.character.statusEffects||[];const old=G.character.statusEffects.find(x=>(x.id||x)===status);
 if(old&&typeof old==="object")old.rounds=Math.max(old.rounds||0,rounds);else G.character.statusEffects.push({id:status,rounds});
 battleLog(`${G.character.name}受到「${statusName(status)}」影響。`);return true
}
function statusName(id){return DB.status_system.definitions[id]?.name||id}
function processEnemyStatuses(){
 if(!G.battle?.active)return false;let skip=false,e=G.battle.enemy;
 for(const s of (G.battle.enemyStatuses||[])){
   if(s.id==="poison"){const d=Math.max(1,Math.round(e.maxHp*.04));e.hp=Math.max(0,e.hp-d);battleLog(`${e.name}受到中毒 ${d} 傷害。`)}
   if(s.id==="bleed"){const d=Math.max(1,Math.round(e.maxHp*.03));e.hp=Math.max(0,e.hp-d);battleLog(`${e.name}受到流血 ${d} 傷害。`)}
   if(s.id==="burn"){const d=Math.max(1,Math.round(e.maxHp*.03));e.hp=Math.max(0,e.hp-d);battleLog(`${e.name}受到灼燒 ${d} 傷害。`)}
   if(["sleep","paralysis","petrify"].includes(s.id))skip=true;
   if(s.id==="fear"&&Math.random()<.45)skip=true;
   if(s.id==="confusion"&&Math.random()<.45)skip=true;
   if(s.id==="charm"&&Math.random()<.35)skip=true;
   s.rounds--
 }
 G.battle.enemyStatuses=(G.battle.enemyStatuses||[]).filter(s=>s.rounds>0);return skip
}
function processPlayerStatuses(){
 let skip=false;
 for(const s of (G.character.statusEffects||[])){
   if(typeof s!=="object")continue;
   if(s.id==="poison"){const d=Math.max(1,Math.round(G.character.maxHp*.025));G.character.hp=clamp(G.character.hp-d,0,G.character.maxHp);battleLog(`${G.character.name}受到中毒 ${d} 傷害。`)}
   if(s.id==="bleed"){const d=Math.max(1,Math.round(G.character.maxHp*.03));G.character.hp=clamp(G.character.hp-d,0,G.character.maxHp);battleLog(`${G.character.name}受到流血 ${d} 傷害。`)}
   if(s.id==="burn"){const d=Math.max(1,Math.round(G.character.maxHp*.03));G.character.hp=clamp(G.character.hp-d,0,G.character.maxHp);battleLog(`${G.character.name}受到灼燒 ${d} 傷害。`)}
   if(["sleep","paralysis","petrify"].includes(s.id))skip=true;
   if(s.id==="fear"&&Math.random()<.45)skip=true;
   if(s.id==="confusion"&&Math.random()<.45)skip=true;
   if(s.id==="charm"&&Math.random()<.35)skip=true;
   s.rounds=(s.rounds??2)-1
 }
 G.character.statusEffects=(G.character.statusEffects||[]).filter(s=>typeof s!=="object"||s.rounds>0);return skip
}
function beginPlayerBattleAction(){
 if(!G.battle?.active)return false;
 G.battle.awaitingCompanion=true;
 const blocked=processPlayerStatuses();
 if(G.character.hp<=0){if(tryAutoRevive())return false;finishBattle("戰敗");return false}
 if(blocked){battleLog("負面狀態使本回合無法正常行動。");enemyBattleTurn();return false}
 return true
}
let battleLastFocus=null,battleSkillLastFocus=null;
function startBattle(monster,context){
 battleLastFocus=document.activeElement;
 const enemy={...monster,maxHp:monster.hp,hp:monster.hp},cs=combatStats();
 const playerInit=cs.initiative+Math.min(6,cs.range/8),enemyInit=(enemy.initiative||10)+Math.min(4,(enemy.range||1)/8);
 G.battle={active:true,context,round:1,enemy,playerBuff:{},enemyBuff:{},enemyStatuses:[],weaponOil:null,defending:false,playerStaggered:false,awaitingCompanion:false,companion:battleCompanionSnapshot(),party:partyBattleSnapshots(),
 log:[`${context}時遭遇 ${monster.name}［${monster.tier}］。`,`先攻：${G.character.name} ${playerInit.toFixed(1)}／${monster.name} ${enemyInit.toFixed(1)}。`]};
 if(G.battle.party.length)G.battle.log.push(`冒險團隊友：${G.battle.party.map(x=>x.name).join("、")}。`);if(G.battle.companion)G.battle.log.push(`出戰夥伴：${G.battle.companion.name}［${G.battle.companion.tier}］／${G.battle.companion.aiLabel}。`);persist();renderAll();
 if(enemyInit>playerInit){battleLog(`${monster.name}取得先攻。`);enemyBattleTurn()}else battleLog(`${G.character.name}取得先攻。`)
}
function battleLog(msg){if(!G.battle)return;G.battle.log.push(msg);if(G.battle.log.length>14)G.battle.log.shift()}
function skillResourceCost(s){
 const raw=s.stamina_cost||0,base=skillUsesMana(s)?Math.max(0,raw-talentSpecial("spellCostReduction")):raw;
 return Math.max(0,Math.round(combatScalar(base)))
}
function skillUsesMana(s){return (s.resource||"stamina")==="mana"}
function battleCritFromRoll(roll,critRate){const steps=Math.max(0,Math.floor(critRate/5));return steps>0&&roll>=Math.max(11,21-steps)}
function renderBattle(sharedCombatStats=null){
 const back=$("#battleBack");if(!G.battle?.active){back.classList.add("hide");document.body.classList.remove("battle-open");return}
 const opening=back.classList.contains("hide"),b=G.battle,e=b.enemy,c=G.character,cs=sharedCombatStats||combatStats(),php=clamp(c.hp/c.maxHp*100,0,100),ehp=clamp(e.hp/e.maxHp*100,0,100);
 setUIHTML($("#battleBody"),`<div class="battlehead">
 <div class="battleunit"><b>${c.name}</b><div class="small">Lv${c.level}｜${cls(c.classId).name}</div>
 <div>HP ${Math.round(c.hp)}/${c.maxHp}　SP ${Math.round(c.stamina)}/${c.maxStamina}　MP ${Math.round(c.mana)}/${c.maxMana}</div>
 <div class="small">先攻${cs.initiative}｜移速${cs.moveSpeed}｜射程${cs.range}m｜格擋${cs.blockRate}%/${cs.blockValue}%${b.playerStaggered?"｜硬直":""}</div>
 <div class="hpbar"><i style="width:${php}%"></i></div></div>
 ${b.party?.length?`<div class="party-battle-strip">${b.party.map(m=>`<div class="party-mini ${m.knockedOut?"ko":""}"><b>${m.name}</b><span>${m.roleLabel}｜AI</span><div>HP ${Math.max(0,Math.round(m.hp))}/${m.maxHp}</div><div class="hpbar"><i style="width:${clamp(m.hp/m.maxHp*100,0,100)}%"></i></div></div>`).join("")}</div>`:""}
 ${b.companion?`<div class="battleunit companion"><b>${b.companion.name} <span class="tier">${b.companion.tier}</span></b><div class="small">${b.companion.aiLabel}｜AI自動${b.companion.knockedOut?"｜失去戰鬥能力":""}</div><div>HP ${Math.max(0,Math.round(b.companion.hp))}/${b.companion.maxHp}</div><div class="hpbar"><i style="width:${clamp(b.companion.hp/b.companion.maxHp*100,0,100)}%"></i></div></div>`:""}
 <div class="battleversus">VS</div>
 <div class="battleunit enemy"><b>${e.name} <span class="tier">${e.tier}</span></b><div class="small">${e.category||"敵人"}｜戰鬥回合 ${b.round}</div>
 <div>HP ${Math.max(0,Math.round(e.hp))}/${e.maxHp}</div><div class="small">先攻${Math.round(e.initiative||0)}｜移速${Math.round(e.moveSpeed||100)}｜韌性${Math.round(e.poise||0)}</div><div class="hpbar"><i style="width:${ehp}%"></i></div></div></div>
 <div class="battlelog" role="log" aria-live="polite" aria-relevant="additions text">${b.log.map(x=>`<div>・${x}</div>`).join("")}</div>
 <div class="battleactions">
 <button class="good" onclick="battleGeneralAttack()">一般攻擊</button>
 <button onclick="battleSkillMenu('magic')">魔法</button>
 <button onclick="battleSkillMenu('skill')">技能</button>
 <button onclick="battleItemMenu()">使用道具</button>
 </div><div class="battle-secondary-actions" aria-label="其他戰鬥行動">
 <button onclick="battleDefend()">防禦</button>
 <button class="warn" onclick="battleFlee()">逃跑</button>
 </div><div id="battleChoice" class="battlechoice"></div>`);
 back.classList.remove("hide");document.body.classList.add("battle-open");
 if(opening&&typeof requestAnimationFrame==="function")requestAnimationFrame(()=>$("#battleBody")?.querySelector(".battleactions button:not([disabled])")?.focus({preventScroll:true}))
}
function battleGeneralAttack(){
 if(!G.battle?.active||!beginPlayerBattleAction())return;
 const b=G.battle,e=b.enemy,cs=combatStats(),r=rollD20(),stagger=b.playerStaggered?3:0,rangeBonus=b.round===1&&cs.range>(e.range||1)?2:0;
 b.playerStaggered=false;
 const score=r+Math.floor((cs.accuracy+rangeBonus-stagger-(e.evasion+(b.enemyBuff.evasion||0)-enemyStatusEvasionPenalty()))/10);
 if(score>=10){
   const crit=battleCritFromRoll(r,Math.max(0,cs.critRate-(e.critResist||0)));
   let atk=cs.attack+combatScalar(b.weaponOil?.attack||0)+combatScalar(talentTargetBonus(e)),def=Math.max(0,e.defense+(b.enemyBuff.defense||0)-enemyStatusDefensePenalty());
   def*=1-cs.armorPenPct/100;
   if(e.hp/e.maxHp<=.25)atk+=combatScalar(talentSpecial("executeBonus"));
   let dmg=Math.max(1,Math.round(atk-def*.45));
   if(b.weaponOil?.element&&["光明","黑暗","火","風","水","地","雷","生命","死亡"].includes(b.weaponOil.element))dmg=applyElementDamage(dmg,e,b.weaponOil.element);
   if(crit)dmg=Math.round(dmg*cs.critDamage/100);
   if((e.blockRate||0)>0&&r>=Math.max(12,21-Math.floor(e.blockRate/5))){dmg=Math.max(1,Math.round(dmg*(1-(e.blockValue||25)/100)));battleLog(`${e.name}格擋部分傷害。`)}
   e.hp=Math.max(0,e.hp-dmg);
   if(cs.lifeSteal>0)G.character.hp=clamp(G.character.hp+dmg*(cs.lifeSteal/100),0,G.character.maxHp);
   battleLog(`一般攻擊 D20=${r} 命中，造成 ${dmg} 傷害${crit?"（爆擊）":""}${stagger?"（硬直影響命中）":""}${b.weaponOil?.element?`／${b.weaponOil.element}塗油`:""}。`);
 }else battleLog(`一般攻擊 D20=${r} 未命中。`);
 degradeEquipment();tickBattleEffects();
 if(e.hp<=0){finishBattle("勝利");return}
 enemyBattleTurn()
}
function closeBattleSkillPopup(){const p=$("#battleSkillPopup"),wasOpen=p&&!p.classList.contains("hide");if(p)p.classList.add("hide");if(wasOpen&&battleSkillLastFocus?.isConnected)battleSkillLastFocus.focus({preventScroll:true});battleSkillLastFocus=null}
function battleSkillPopupBackClose(e){if(e.target?.id==="battleSkillPopup")closeBattleSkillPopup()}
function battleSkillMenu(category="all"){
 if(!G.battle?.active)return;
 const usable=G.character.skills.map((s,i)=>[s,i]).filter(([s])=>s.kind!=="被動"&&s.manual_battle_use!==false&&(category==="all"||(category==="magic"?skillUsesMana(s):!skillUsesMana(s)))),body=$("#battleSkillPopupBody");
 $("#battleSkillPopupTitle").textContent=category==="magic"?"選擇魔法":category==="skill"?"選擇技能":"選擇技能／魔法";
 battleSkillLastFocus=document.activeElement;
 setUIHTML(body,usable.map(([s,i])=>{
   normalizeSkillXp(s);const mana=skillUsesMana(s),cost=skillResourceCost(s),res=mana?G.character.mana:G.character.stamina;
   const meta=[`類型：${skillUseTypeLabel(s)}`,s.school||"戰技",s.element||null].filter(Boolean).join("／");
   return `<div class="itemrow"><span><b>${s.name}</b> <span class="tier">${s.tier||"F"}</span>
   <br><span class="small">${meta}</span>
   <br><span class="small"><b>Lv${skillLevel(s)}</b>｜技能XP ${skillXpProgressText(s)}</span>
   <br><span class="small">${skillDescriptionText(s)}</span>
   <br><span class="small">命中${(s.accuracy||0)+skillLevelBonus(s,"accuracy_bonus")}｜${mana?"MP":"體力"}消耗${cost}</span></span>
   <button ${res<cost?"disabled":""} onclick="battleChooseSkill(${i})">使用</button></div>`
 }).join("")||`<div class='small'>沒有可主動使用的${category==="magic"?"魔法":"技能"}。</div>`);
 $("#battleSkillPopup")?.classList.remove("hide");
 if(typeof requestAnimationFrame==="function")requestAnimationFrame(()=>body.querySelector("button:not([disabled])")?.focus({preventScroll:true}))
}
function enemyElementResistance(e,element){return element?(e.element_resistances?.[element]||0):0}
function applyElementDamage(raw,e,element){
 const resist=clamp(enemyElementResistance(e,element),-50,80);
 return Math.max(1,Math.round(raw*(1-resist/100)))
}
function battleUseSkill(index,targetKey="self"){
 if(!G.battle?.active)return;closeBattleSkillPopup();
 const s=G.character.skills[index];if(!s||s.kind==="被動")return;
 const mana=skillUsesMana(s),cost=skillResourceCost(s),resource=mana?"MP":"體力";
 if((mana?G.character.mana:G.character.stamina)<cost){battleLog(`${resource}不足。`);return}
 if(!beginPlayerBattleAction())return;
 if(mana&&(G.character.statusEffects||[]).some(x=>(x.id||x)==="silence")){battleLog("沉默狀態下無法施放魔法技能。");enemyBattleTurn();return}
 if(mana)G.character.mana-=cost;else G.character.stamina-=cost;gainSkillMastery(s);
 const b=G.battle,e=b.enemy,cs=combatStats(),dtype=s.damage_type||"physical",stagger=b.playerStaggered?3:0,lvl=skillLevel(s);b.playerStaggered=false;

 if(dtype==="heal"){
   const pct=skillPowerPercent(s)/100,extra=skillLevelBonus(s,"target_max_hp_heal_pct");
   mutateBattleSupportTarget(targetKey,t=>{
     const amount=Math.max(1,Math.round(cs.magicPower*pct+(t.maxHp||0)*extra/100))*(cs.healingPower/100);
     t.hp=clamp((t.hp||0)+amount,0,t.maxHp||amount);battleLog(`${s.name}使${t.name||G.character.name}恢復 ${Math.round(amount)} HP。`)
   });enemyBattleTurn();return
 }
 if(dtype==="cleanse"){
   const exclusions=new Set(s.cleanse_exclusions||["poison","hunger","thirst","fatigue"]),count=(s.cleanse_count||1)+skillLevelBonus(s,"cleanse_count_bonus");
   mutateBattleSupportTarget(targetKey,t=>{
     const arr=t.statusEffects||[],keep=[],removed=[];for(const st of arr){const id=st.id||st;if(removed.length<count&&!exclusions.has(id))removed.push(st);else keep.push(st)}
     t.statusEffects=keep;
     if(skillLevelBonus(s,"post_cleanse_heal_magic_pct")>0){const amount=Math.max(1,Math.round(cs.magicPower*skillLevelBonus(s,"post_cleanse_heal_magic_pct")/100));t.hp=clamp((t.hp||0)+amount,0,t.maxHp||amount)}
     battleLog(`${s.name}為${t.name||G.character.name}清除 ${removed.length} 個可淨化負面狀態。`)
   });enemyBattleTurn();return
 }
 if(dtype==="buff"){
   b.playerBuff.attack=(b.playerBuff.attack||0)+(s.power||0);b.playerBuff.defense=(b.playerBuff.defense||0)+(s.defense||0);
   b.playerBuff.accuracy=(b.playerBuff.accuracy||0)+(s.accuracy||0)+skillLevelBonus(s,"accuracy_bonus");b.playerBuff.evasion=(b.playerBuff.evasion||0)+(s.evasion||0);
   for(const k of ["magicPower","magicDefense","critRate","critDamage","attackSpeed","castSpeed","blockRate","statusResist"])b.playerBuff[k]=(b.playerBuff[k]||0)+(s[k]||0);
   b.playerBuff.statusResist=(b.playerBuff.statusResist||0)+skillLevelBonus(s,"status_resist_bonus");
   b.playerBuffPct=b.playerBuffPct||{};
   const defPct=supportPercentValue(s,"defense_pct"),mdefPct=supportPercentValue(s,"magic_defense_pct");
   if(defPct)b.playerBuffPct.defensePct=Math.max(Number(b.playerBuffPct.defensePct||0),defPct);
   if(mdefPct)b.playerBuffPct.magicDefensePct=Math.max(Number(b.playerBuffPct.magicDefensePct||0),mdefPct);
   battleLog(`使用 ${s.name}：${supportEffectText(s)}。`);enemyBattleTurn();return
 }
 if(dtype==="debuff"){
   for(const [k,v] of Object.entries(s.debuff||{}))b.enemyBuff[k]=(b.enemyBuff[k]||0)+v;
   if(s.status)applyEnemyStatus(s.status,(s.status_chance||50)+skillLevelBonus(s,"status_chance_bonus"),(s.status_rounds||2)+skillLevelBonus(s,"status_rounds_bonus"));
   battleLog(`${s.name} 削弱 ${e.name}。`);enemyBattleTurn();return
 }

 const r=rollD20(),scale=s.scaling_stat|| (dtype==="magic"?"magic":dtype==="physical"?"physical":"hybrid"),pct=skillPowerPercent(s)/100;
 let baseAtk=scale==="magic"?cs.magicPower:scale==="physical"?cs.attack:Math.round((cs.attack+cs.magicPower)/2);
 let atk=baseAtk*pct+talentTargetBonus(e);
 let edef=(dtype==="magic"?(e.magicDefense||e.defense):dtype==="hybrid"?Math.round((e.defense+(e.magicDefense||e.defense))/2):e.defense)-enemyStatusDefensePenalty();
 edef=Math.max(0,edef);
 let pen=dtype==="magic"?cs.magicPenPct:cs.armorPenPct;
 if(dtype==="magic")pen+=skillLevelBonus(s,"magic_pen_pct");else if(dtype==="hybrid")pen+=Math.max(skillLevelBonus(s,"armor_pen_pct"),skillLevelBonus(s,"magic_pen_pct"));else pen+=skillLevelBonus(s,"armor_pen_pct");
 edef*=1-pen/100;
 if(e.hp/e.maxHp<=.25)atk+=talentSpecial("executeBonus");
 const score=r+Math.floor((cs.accuracy+(s.accuracy||0)+skillLevelBonus(s,"accuracy_bonus")-stagger-(e.evasion+(b.enemyBuff.evasion||0)-enemyStatusEvasionPenalty()))/10);
 if(score>=10){
   const crit=battleCritFromRoll(r,Math.max(0,cs.critRate-(e.critResist||0))),raw=Math.max(1,Math.round(atk-edef*.42));
   let dmg=applyElementDamage(raw,e,s.element);if(crit)dmg=Math.round(dmg*cs.critDamage/100);
   e.hp=Math.max(0,e.hp-dmg);if(cs.lifeSteal>0)G.character.hp=clamp(G.character.hp+dmg*(cs.lifeSteal/100),0,G.character.maxHp);
   if(s.status)applyEnemyStatus(s.status,(s.status_chance||45)+skillLevelBonus(s,"status_chance_bonus"),(s.status_rounds||2)+skillLevelBonus(s,"status_rounds_bonus"));
   const er=enemyElementResistance(e,s.element);
   battleLog(`${s.name} Lv${lvl} D20=${r} 命中，造成 ${dmg} ${dtype==="physical"?"物理":dtype==="hybrid"?"混合":"魔法"}傷害${s.element?`／${s.element}`:""}${er>0?"（抗性）":er<0?"（弱點）":""}${crit?"（爆擊）":""}。`)
 }else battleLog(`${s.name} Lv${lvl} D20=${r} 未命中。`);
 degradeEquipment();tickBattleEffects();
 if(e.hp<=0){finishBattle("勝利");return}
 enemyBattleTurn()
}
function battleDefend(){if(!G.battle?.active||!beginPlayerBattleAction())return;G.battle.defending=true;G.battle.playerStaggered=false;battleLog("採取防禦姿態，本次敵方攻擊獲得防禦與格擋加成，並穩定自身架勢。");enemyBattleTurn()}
function battleItemMenu(){
 if(!G.battle?.active)return;
 const list=G.character.inventory.map((x,i)=>[x,i]).filter(([x])=>{
   const d=item(x.id);return d&&["藥劑","卷軸"].includes(d.type)&&(d.use||d.buff||d.battle_effect||d.weapon_oil)
 });
 setUIHTML($("#battleChoice"),list.map(([x,i])=>{const d=item(x.id);return `<div class="itemrow"><span><b>${d.name}</b> <span class="tier">${d.tier}</span> ×${x.qty||1}<br><span class="small">${itemStatsText(d)}</span></span><button onclick="battleUseItem(${i})">使用</button></div>`}).join("")||"<div class='small'>沒有可在戰鬥中使用的藥劑／道具。</div>")
}
function battleUseItem(index){
 if(!G.battle?.active)return;
 const x=G.character.inventory[index],d=x&&item(x.id);if(!d)return;
 if(!["藥劑","卷軸"].includes(d.type)||!(d.use||d.buff||d.battle_effect||d.weapon_oil))return;
 if(d.toxicity&&(G.character.toxicity||0)+d.toxicity>100){alert(`毒性將超過100（目前${Math.round(G.character.toxicity||0)}）`);return}
 if(!beginPlayerBattleAction())return;
 if(d.battle_effect){
   const ef=d.battle_effect;
   if(ef.special==="repel"){battleLog(`使用 ${d.name}，強烈氣味迫使敵人退開。`);removeItem(x.id,1,index);finishBattle("逃跑成功");return}
   if(ef.special==="lure"){battleLog(`使用 ${d.name}，敵人受到誘餌干擾，命中下降。`);G.battle.enemyBuff.accuracy=(G.battle.enemyBuff.accuracy||0)-4}
   const dmg=Math.max(0,Math.round(combatScalar(ef.damage||0)));if(dmg){G.battle.enemy.hp=Math.max(0,G.battle.enemy.hp-dmg);battleLog(`投擲 ${d.name}，造成 ${dmg} ${ef.element||""}傷害。`)}
   if(ef.enemyDebuff)for(const [k,v] of Object.entries(ef.enemyDebuff))if(k!=="rounds")G.battle.enemyBuff[k]=(G.battle.enemyBuff[k]||0)+v;
   if(ef.status)applyEnemyStatus(ef.status,ef.status_chance||55,ef.rounds||2)
 }else if(d.weapon_oil){
   G.battle.weaponOil={...d.weapon_oil,rounds:d.weapon_oil.rounds||4};battleLog(`將 ${d.name} 塗於武器，本場戰鬥暫時生效。`)
 }else{
   const rr=applyConsumable(d);if(!rr.ok){alert(rr.msg);return}battleLog(`使用 ${d.name}。`)
 }
 removeItem(x.id,1,index);persist();
 if(G.battle?.enemy.hp<=0){finishBattle("勝利");return}
 enemyBattleTurn()
}
function battleFlee(){
 if(!G.battle?.active||!beginPlayerBattleAction())return;
 const e=G.battle.enemy,cs=combatStats(),r=rollD20(),
 mod=Math.floor((effectiveStat("敏捷")+effectiveStat("幸運")-20)/4)+Math.floor(cs.evasion/15)+Math.floor((cs.moveSpeed-(e.moveSpeed||100))/12)-tierOrder(e.tier)+talentSpecial("fleeBonus");
 if(r+mod>=11){battleLog(`逃跑 D20=${r} 成功脫離戰鬥。`);finishBattle("逃跑成功");return}
 battleLog(`逃跑 D20=${r} 失敗。`);enemyBattleTurn()
}
function tryAutoRevive(){
 const idx=G.character.inventory.findIndex(x=>item(x.id)?.revive);
 if(idx<0)return false;
 const x=G.character.inventory[idx],d=item(x.id),pct=d.revive.hp_percent||25;
 G.character.hp=Math.max(1,Math.round(G.character.maxHp*pct/100));removeItem(x.id,1,idx);
 battleLog(`${d.name} 自動發動，角色以 ${pct}% HP 復甦。`);return true
}
function tickBattleEffects(){
 if(!G.battle)return;
 if(G.battle.weaponOil){G.battle.weaponOil.rounds--;if(G.battle.weaponOil.rounds<=0){battleLog("武器塗油效果消失。");G.battle.weaponOil=null}}
}
function enemyHasStatus(id){return (G.battle?.enemyStatuses||[]).some(s=>s.id===id)}
function enemyStatusAccuracyPenalty(){return (enemyHasStatus("blind")?4:0)+(enemyHasStatus("confusion")?2:0)+(enemyHasStatus("slow")?1:0)}
function enemyStatusEvasionPenalty(){return enemyHasStatus("slow")?1:0}
function enemyStatusDefensePenalty(){return enemyHasStatus("curse")?2:0}
function companionBattleLog(msg){battleLog(`【夥伴】${msg}`)}
function resolveCompanionTurn(){
 const b=G.battle,c=b?.companion,e=b?.enemy;if(!b?.active||!c||c.knockedOut||c.hp<=0||e.hp<=0)return;
 const player=G.character,playerRatio=player.hp/player.maxHp,compRatio=c.hp/c.maxHp;
 if(c.ai==="support"&&playerRatio<.65){
   const heal=Math.max(2,Math.round(c.magic*.75));player.hp=clamp(player.hp+heal,0,player.maxHp);companionBattleLog(`${c.name}施展支援治療，恢復${heal}HP。`);return
 }
 if(c.ai==="guardian"&&playerRatio<.60){
   c.guarding=true;companionBattleLog(`${c.name}進入護衛姿態，準備替主人承受攻擊。`);return
 }
 const roll=rollD20(),magic=["caster","support","legend"].includes(c.ai),atk=magic?c.magic:c.attack;
 const accBonus=c.ai==="skirmisher"?8:0,score=roll+Math.floor((c.accuracy+accBonus-(e.evasion||0))/10);
 if(score<10){companionBattleLog(`${c.name}攻擊未命中。`);return}
 let defense=magic?(e.magicDefense||e.defense||0):(e.defense||0),dmg=Math.max(1,Math.round(atk-defense*.35));
 if(c.ai==="assault")dmg=Math.round(dmg*1.08);
 if(c.ai==="skirmisher"&&roll>=18)dmg=Math.round(dmg*1.35);
 if(c.ai==="dark")dmg=Math.round(dmg*1.12);
 if(c.ai==="legend"&&playerRatio>.55)dmg=Math.round(dmg*1.12);
 if(c.element)dmg=applyElementDamage(dmg,e,c.element);
 e.hp=Math.max(0,e.hp-dmg);
 if(c.ai==="dark")c.hp=clamp(c.hp+Math.max(1,Math.round(dmg*.18)),0,c.maxHp);
 if(c.ai==="caster"&&roll>=17){b.enemyBuff.accuracy=(b.enemyBuff.accuracy||0)-2;companionBattleLog(`${c.name}的術法造成${dmg}傷害，並干擾敵人命中。`)}
 else companionBattleLog(`${c.name}造成${dmg}傷害${c.element?`／${c.element}`:""}。`)
}
function enemyTargetsCompanion(){
 const b=G.battle,c=b?.companion;if(!c||c.knockedOut||c.hp<=0)return false;
 if(c.guarding)return true;
 const base={guardian:.38,assault:.24,skirmisher:.18,caster:.18,support:.20,dark:.24,legend:.28}[c.ai]??.2;
 return Math.random()<base
}
function enemyBattleTurn(){
 if(!G.battle?.active)return;
 const b=G.battle,e=b.enemy,cs=combatStats();
 if(b.awaitingCompanion){b.awaitingCompanion=false;resolvePartyTurns();if(e.hp<=0){finishBattle("勝利");return}resolveCompanionTurn();if(e.hp<=0){finishBattle("勝利");return}}
 if(processEnemyStatuses()){battleLog(`${e.name}因狀態影響無法正常行動。`);b.round++;persist();renderAll();return}
 if(e.hp<=0){finishBattle("勝利");return}
 const r=rollD20(),targets=[{type:"player",weight:combatStats().threat||100},...partyThreatTargets()];
 if(b.companion&&!b.companion.knockedOut&&b.companion.hp>0)targets.push({type:"companion",unit:b.companion,weight:b.companion.guarding?180:70});
 let pick=weightedPick(targets.map(x=>[x,x.weight])),targetCompanion=pick?.type==="companion",targetParty=pick?.type==="party";
 if(targetCompanion){
   const c=pick.unit;c.guarding=false;
   const score=r+Math.floor((e.accuracy-(c.evasion||0))/10);
   if(score>=10){let dmg=Math.max(1,Math.round(e.attack-(c.defense||0)*.42));c.hp=Math.max(0,c.hp-dmg);battleLog(`${e.name}轉向攻擊${c.name}，造成${dmg}傷害。`);if(c.hp<=0){c.knockedOut=true;companionBattleLog(`${c.name}本場戰鬥失去戰鬥能力。`)}}else battleLog(`${e.name}攻擊${c.name}但未命中。`)
 }else if(targetParty){
   const c=pick.unit;c.guarding=false;
   const score=r+Math.floor((e.accuracy-(c.evasion||0))/10);
   if(score>=10){let dmg=Math.max(1,Math.round(e.attack-(c.defense||0)*.42));c.hp=Math.max(0,c.hp-dmg);battleLog(`${e.name}攻擊隊友${c.name}，造成${dmg}傷害。`);if(c.hp<=0){c.knockedOut=true;partyBattleLog(`${c.name}本場戰鬥失去戰鬥能力。`)}}else battleLog(`${e.name}攻擊${c.name}但未命中。`)
 }else{
   const wasDefending=!!b.defending,defendBonus=b.defending?7:0,enemyAcc=e.accuracy+(b.enemyBuff.accuracy||0)-enemyStatusAccuracyPenalty();
   const score=r+Math.floor((enemyAcc-(cs.evasion+(b.defending?4:0)))/10);
   if(score>=10){
     let pdef=Math.max(0,cs.defense+defendBonus);pdef*=1-(e.armorPenPct||0)/100;
     let dmg=Math.max(1,Math.round(e.attack-pdef*.42));
     const blocked=r>=Math.max(11,21-Math.floor((cs.blockRate+(b.defending?15:0))/5));
     const enemyCrit=Math.max(0,(e.critRate||5)-cs.critResist),crit=battleCritFromRoll(r,enemyCrit);
     if(crit)dmg=Math.round(dmg*(e.critDamage||150)/100);
     if(e.primary_element){const res=clamp(elementalResistances()[e.primary_element]||0,-50,80);dmg=Math.max(1,Math.round(dmg*(1-res/100)))}
     if(blocked)dmg=Math.max(1,Math.round(dmg*(1-cs.blockValue/100)));
     G.character.hp=clamp(G.character.hp-dmg,0,G.character.maxHp);
     const impactPct=dmg/Math.max(1,G.character.maxHp)*100;if(impactPct>12+cs.poise*.38){b.playerStaggered=true;battleLog("強烈衝擊造成硬直，下一次行動命中下降。")}
     battleLog(`${e.name} D20=${r} 命中，造成 ${dmg} 傷害${e.primary_element?`／${e.primary_element}`:""}${crit?"（爆擊）":""}${blocked?`（格擋${cs.blockValue}%）`:""}。`);
     if(e.status_attack)applyPlayerStatus(e.status_attack.id,e,e.status_attack.base_chance,e.status_attack.rounds);
     const thorn=combatScalar(talentSpecial("thorns"));if(thorn){e.hp=Math.max(0,e.hp-thorn);battleLog(`荊棘反傷 ${thorn}。`)}
     const counter=combatScalar(talentSpecial("counterDamage"));if(counter&&wasDefending){e.hp=Math.max(0,e.hp-counter);battleLog(`反擊造成 ${counter} 傷害。`)}
   }else battleLog(`${e.name} D20=${r} 攻擊未命中。`);
 }
 if(!targetCompanion&&!targetParty)degradeEquipment();b.defending=false;tickBattleEffects();
 if(e.hp<=0){finishBattle("勝利");return}
 if(G.character.hp<=0){if(tryAutoRevive()){b.round++;persist();renderAll();return}finishBattle("戰敗");return}
 b.round++;persist();renderAll()
}
function randomInt(a,b){return a+rand(b-a+1)}
function validEnemyLootEntry(enemy,entry){
 if(!enemy||!entry||!item(entry.id))return false;
 const p=enemy.loot_profile;
 if(!p||p.version!=="LOOT-ECOLOGY-1.0")return false;
 return (p.allowed_material_ids||[]).includes(entry.id)
}
function rollEnemyLoot(enemy){
 const gained=[],lootMult=combatStats().lootRate/100;
 for(const l of (enemy.loot_materials||[])){
   if(!validEnemyLootEntry(enemy,l))continue;
   if(Math.random()<=Math.min(.98,l.chance*lootMult)){
     const q=randomInt(l.min||1,l.max||1);
     addItem(l.id,q);gained.push(`${item(l.id)?.name||l.id}×${q}`)
   }
 }
 if(enemy.humanoid===true){
   const md=enemy.money_drop;if(md&&Math.random()<=Math.min(.98,md.chance*lootMult)){const money=randomInt(md.min,md.max);G.character.moneySilver+=money;gained.push(`${money}銀`)}
   const ed=enemy.equipment_drop;if(ed&&Math.random()<=Math.min(.95,ed.chance*lootMult)){
     const candidates=DB.items.filter(x=>["主武器","盔甲","頭盔","手套","鞋子","披風","飾品"].includes(x.type)&&ed.tiers.includes(x.tier)&&ed.types.includes(x.type)&&!x.sealed);
     if(candidates.length){const d=candidates[rand(candidates.length)],dur=Math.max(1,Math.round(d.durability*(.45+Math.random()*.45)));addItem(d.id,1,{durability:dur});gained.push(`${d.name}［${d.tier}］`)}
   }
 }
 log("戰利品",gained.length?`取得：${gained.join("、")}。`:"沒有取得可用戰利品。",gained.length?"ok":"");return gained
}
function nearestChurchTown(startId){
 const dist={[startId]:0},used=new Set();
 while(true){
   let cur=null,best=Infinity;for(const [id,d] of Object.entries(dist))if(!used.has(id)&&d<best){best=d;cur=id}
   if(cur===null)break;const here=loc(cur);
   if(here?.kind==="town"&&here.facilities?.includes("church"))return {id:cur,hours:best};
   used.add(cur);for(const edge of (here?.links||[])){const nd=best+(edge.hours||1);if(nd<(dist[edge.to]??Infinity))dist[edge.to]=nd}
 }
 return {id:"L-WILLOW",hours:6}
}
function handleBattleDefeat(enemy){
 const c=G.character,rescue=nearestChurchTown(c.locationId),town=loc(rescue.id),rev=normalizeRevivalState();
 c.alive=false;c.hp=0;c.conditions=[...(c.conditions||[]).filter(x=>x!=="死亡"),"死亡"];
 G.pendingRevival={locationId:rescue.id,hours:Math.max(3,Math.ceil(rescue.hours+2)),enemyName:enemy?.name||"未知敵人"};
 if(rev.remaining>0)log("戰敗",`遭 ${enemy.name} 擊敗。可使用復活機會，在 ${town.name} 教會復活；剩餘 ${rev.remaining} 次。`,"danger");
 else log("戰敗",`遭 ${enemy.name} 擊敗，復活機會已用盡。`,"danger")
}
function reviveAtChurch(){
 if(G.character.alive)return;const rev=normalizeRevivalState();if(!rev||rev.remaining<=0){alert("復活次數已用盡；可從設定匯入較早的存檔備份。");return}
 const c=G.character,rescue=G.pendingRevival||(()=>{const r=nearestChurchTown(c.locationId);return {locationId:r.id,hours:Math.max(3,Math.ceil(r.hours+2)),enemyName:"生存危機"}})(),town=loc(rescue.locationId);
 rev.used++;rev.remaining=Math.max(0,rev.max-rev.used);c.revival=rev;c.alive=true;c.locationId=rescue.locationId;c.currentFacility="church";
 c.hp=Math.max(1,Math.round(c.maxHp*.40));c.stamina=Math.max(1,Math.round(c.maxStamina*.35));c.mana=Math.max(1,Math.round(c.maxMana*.35));
 c.fatigue=clamp(Math.max(c.fatigue,58),0,120);c.hunger=clamp(c.hunger+8,0,120);c.thirst=clamp(c.thirst+10,0,120);c.conditions=(c.conditions||[]).filter(x=>x!=="死亡");
 for(const m of partyMembers()){const s=partyMemberCombatStats(m);m.maxHp=s.maxHp;m.hp=Math.max(1,Math.round(s.maxHp*.40))}
 G.pendingRevival=null;G.turn++;advance(rescue.hours);updateQuestDeadlines();runWorldDynamics();log("教會復活",`在 ${town?.name||"最近城鎮"} 教會復活，耗時約 ${rescue.hours} 小時；剩餘 ${rev.remaining} 次。`,"ok");autosave("死亡後在教會復活");renderAll()
}
function xpToNext(level){return Math.round(55+level*35+level*level*6)}
function gainCharacterXp(amount,source=""){
 const c=G.character;if(!amount||c.level>=DB.progression_system.max_level)return;normalizeAbilityPoints();const startLevel=c.level;
 c.xp=(c.xp||0)+Math.max(0,Math.round(amount));let leveled=0;
 while(c.level<DB.progression_system.max_level&&c.xp>=xpToNext(c.level)){c.xp-=xpToNext(c.level);c.level++;leveled++;syncResourceCaps(true)}
 const gainedPoints=Math.max(0,abilityPointsEarned(c.level)-abilityPointsEarned(startLevel));if(gainedPoints)c.abilityPoints=(c.abilityPoints||0)+gainedPoints;
 if(amount)log("成長",`獲得 ${Math.round(amount)} XP${source?`（${source}）`:""}。${leveled?` 等級提升至 Lv${c.level}！`:""}${gainedPoints?` 獲得能力點+${gainedPoints}。`:""}`,leveled?"ok":"")
}

function gainClassMastery(amount){
 const c=G.character;c.classMastery=clamp((c.classMastery||0)+amount,0,100)
}
function gainSkillMastery(skill,amount=null){
 if(!skill)return;const cfg=DB.skill_scaling_system?.skill_xp_system||{},gain=amount==null?(cfg.use_xp_by_tier?.[skill.tier]||3):Math.max(1,Number(amount)*10);gainSkillXp(skill,gain,amount==null?"技能使用":"實戰心得")
}

function skillLevelFromMastery(s){
 normalizeSkillXp(s);const xp=skillXpThresholds(),v=Number(s?.skillXp||0);let lv=1;for(let i=1;i<xp.length;i++)if(v>=xp[i])lv=i+1;return Math.min(10,lv)
}

function skillLevel(s){return skillLevelFromMastery(s)}
function skillEffectiveLevel(s){
 if(!s)return 1;
 if(s.skillXp==null&&s.mastery==null)return 1;
 return skillLevel(s)
}
function skillLevelBonus(s,key){
 const lv=skillEffectiveLevel(s),b=s?.level_bonuses||{};let total=0;
 for(const at of [6,10])if(lv>=at)total+=Number(b[String(at)]?.[key]||0);
 return total
}
function skillPowerPercent(s){
 const base=Number(s?.base_power_percent||0),growth=Number(s?.power_growth_percent_per_level||0);
 return base?Math.round(base+growth*(skillEffectiveLevel(s)-1)):0
}
function skillScalingLabel(s){
 return s?.scaling_stat==="physical"?"物理攻擊力":s?.scaling_stat==="magic"?"魔法攻擊力":s?.scaling_stat==="hybrid"?"物魔平均攻擊力":""
}
function skillLevelExtraText(s){
 const lv=skillEffectiveLevel(s),out=[];
 for(const at of [6,10])if(lv>=at&&s?.level_bonuses?.[String(at)]?.text)out.push(`Lv${at}：${s.level_bonuses[String(at)].text}`);
 return out.join("｜")
}

function skillUseTypeLabel(s){
 const k=s?.display_type||s?.kind||"主動";
 return ["主動","被動","輔助"].includes(k)?k:"主動"
}
function supportPercentValue(s,key){
 const base=Number(s?.support_percent_effects?.[key]||0);
 const growth=Number(s?.support_percent_growth_per_level?.[key]||0);
 return Math.round((base+growth*Math.max(0,skillEffectiveLevel(s)-1))*10)/10
}
function passiveEffectText(s){
 const out=[],add=(v,label,suffix="")=>{const n=Number(v||0);if(n)out.push(`${label}${n>0?"+":""}${Math.round(n*100)/100}${suffix}`)};
 add(s?.power,"物理攻擊");add(s?.magicPower,"魔法攻擊");add(s?.defense,"物理防禦");add(s?.magicDefense,"魔法防禦");
 add(s?.accuracy,"命中","%");add(s?.evasion,"閃避","%");add(s?.critRate,"爆擊率","%");add(s?.critDamage,"爆擊傷害","%");
 add(s?.blockRate,"格擋率","%");add(s?.statusResist,"異常抗性","%");
 return out.join("、")||s?.effect_text||s?.desc||"持續生效"
}
function supportEffectText(s){
 const dt=s?.damage_type||"buff";
 if(dt==="heal"){
   const pct=skillPowerPercent(s),extra=skillLevelBonus(s,"target_max_hp_heal_pct");
   return `恢復自己或隊友生命：魔法攻擊力${pct}%${extra?`＋目標最大HP ${extra}%`:""}`
 }
 if(dt==="cleanse"){
   const cnt=(s.cleanse_count||1)+skillLevelBonus(s,"cleanse_count_bonus"),heal=skillLevelBonus(s,"post_cleanse_heal_magic_pct");
   return `清除自己或隊友身上${cnt}個可淨化負面效果；不包含中毒、飢餓、口渴與疲勞${heal?`；淨化後恢復魔法攻擊力${heal}%生命`:""}`
 }
 if(dt==="debuff"){
   const out=[],names={accuracy:"敵方命中",evasion:"敵方閃避",attackSpeed:"敵方攻擊速度",castSpeed:"敵方施法速度",defense:"敵方防禦",magicDefense:"敵方魔防"};
   for(const [k,v] of Object.entries(s?.debuff||{})){
     const n=Number(v||0);if(!n)continue;
     if(["attackSpeed","castSpeed"].includes(k))out.push(`${names[k]||k}${n>0?"+":""}${Math.round(n*100)}%`);
     else out.push(`${names[k]||k}${n>0?"+":""}${Math.round(n*100)/100}%`)
   }
   if(s?.status)out.push(`${Math.round(Number(s.status_chance||50)+skillLevelBonus(s,"status_chance_bonus"))}%機率附加${s.status}，持續${Number(s.status_rounds||2)+skillLevelBonus(s,"status_rounds_bonus")}回合`);
   const extra=skillLevelExtraText(s);return [out.join("、")||s?.effect_text||"削弱敵人",extra].filter(Boolean).join("｜")
 }
 const out=[],add=(v,label,suffix="")=>{const n=Number(v||0);if(n)out.push(`${label}${n>0?"+":""}${Math.round(n*100)/100}${suffix}`)};
 const dp=supportPercentValue(s,"defense_pct"),mdp=supportPercentValue(s,"magic_defense_pct");
 if(dp)out.push(`物理防禦+${dp}%`);
 if(mdp)out.push(`魔法防禦+${mdp}%`);
 add(s?.power,"物理攻擊");add(s?.magicPower,"魔法攻擊");add(s?.defense,"物理防禦");add(s?.magicDefense,"魔法防禦");
 add(s?.accuracy,"命中","%");add(s?.evasion,"閃避","%");add(s?.critRate,"爆擊率","%");add(s?.critDamage,"爆擊傷害","%");
 add(s?.blockRate,"格擋率","%");add(s?.statusResist,"異常抗性","%");
 if(Number(s?.attackSpeed||0))out.push(`攻擊速度+${Math.round(Number(s.attackSpeed)*100)}%`);
 if(Number(s?.castSpeed||0))out.push(`施法速度+${Math.round(Number(s.castSpeed)*100)}%`);
 const duration=s?.support_duration==="battle"?"持續至本場戰鬥結束":"";
 const extra=skillLevelExtraText(s);
 return [out.join("、")||s?.effect_text||s?.desc||"依技能效果生效",duration,extra].filter(Boolean).join("｜")
}
function skillDescriptionText(s){
 return `【${skillUseTypeLabel(s)}】效果：${skillEffectText(s)}`
}
function skillEffectText(s){
 const kind=skillUseTypeLabel(s);
 if(kind==="被動")return passiveEffectText(s);
 if(kind==="輔助")return supportEffectText(s);
 const dt=s?.damage_type||"physical",pct=skillPowerPercent(s);let base="";
 if(["physical","magic","hybrid"].includes(dt))base=`${skillScalingLabel(s)}${pct}%${dt==="hybrid"?"（混合傷害）":""}`;
 else if(dt==="heal")base=`恢復自己或隊友生命：魔法攻擊力${pct}%`;
 else if(dt==="cleanse"){
   const cnt=(s.cleanse_count||1)+skillLevelBonus(s,"cleanse_count_bonus");
   base=`清除自己或隊友身上${cnt}個可淨化負面效果；不包含中毒、飢餓、口渴與疲勞`
 }else base=s?.effect_text||s?.desc||"依技能效果生效";
 const extra=skillLevelExtraText(s);return extra?`${base}｜${extra}`:base
}
function battleSupportTargets(){
 const out=[{key:"self",name:G.character.name||"自己",hp:G.character.hp,maxHp:G.character.maxHp,statusEffects:G.character.statusEffects||[]}];
 for(let i=0;i<(G.battle?.party||[]).length;i++){const x=G.battle.party[i];if(!x.knockedOut)out.push({key:`party:${i}`,name:x.name,hp:x.hp,maxHp:x.maxHp,statusEffects:x.statusEffects||[]})}
 const c=G.battle?.companion;if(c&&!c.knockedOut)out.push({key:"companion",name:c.name,hp:c.hp,maxHp:c.maxHp,statusEffects:c.statusEffects||[]});
 return out
}
function mutateBattleSupportTarget(key,fn){
 if(key==="self")return fn(G.character);
 if(key==="companion"&&G.battle?.companion)return fn(G.battle.companion);
 if(String(key).startsWith("party:")){const i=Number(String(key).split(":")[1]),x=G.battle?.party?.[i];if(x)return fn(x)}
 return null
}
function battleChooseSkill(index){const s=G.character.skills[index];if(!s)return;if(["heal","cleanse"].includes(s.damage_type)&&battleSupportTargets().length>1){$("#battleSkillPopupTitle").textContent=s.damage_type==="heal"?"選擇治療目標":"選擇淨化目標";$("#battleSkillPopupBody").innerHTML=battleSupportTargets().map(t=>`<div class="itemrow"><span><b>${t.name}</b><br><span class="small">HP ${Math.round(t.hp)}/${Math.round(t.maxHp)}</span></span><button onclick="battleUseSkill(${index},'${t.key}')">選擇</button></div>`).join("");return}battleUseSkill(index,"self")}

function skillMasteryMultiplier(s){return 1+clamp(s?.mastery||0,0,100)/500}
function classMasteryNeed(tier){return DB.progression_system.class_mastery_required[tier]||100}
function classAdvanceCandidates(){
 const cur=cls(G.character.classId),c=G.character;
 if(c.classSealed)return [];return DB.combat_classes.filter(n=>Array.isArray(n.progression_from)&&n.progression_from.includes(cur.id)).map(n=>{
   const special=["B","A","S"].includes(n.tier),specialOk=!special||(c.unlockedClassRoutes||[]).includes(n.id);
   const ok=c.level>=(n.unlock_level||1)&&(c.classMastery||0)>=classMasteryNeed(n.tier)&&specialOk;
   return {c:n,ok,special,specialOk}
 })
}
function openClassAdvancement(){
 const c=G.character,cur=cls(c.classId),sealed=c.classSealed;
 let rows="";
 if(sealed){
   const needLv=cur.unlock_level||1,needM=classMasteryNeed(cur.tier),special=["B","A","S"].includes(cur.tier),specialOk=!special||(c.unlockedClassRoutes||[]).includes(cur.id);
   const ok=c.level>=needLv&&(c.classMastery||0)>=needM&&specialOk;
   rows+=`<div class="card"><b>${cur.name}［${cur.tier}］解封</b><br><span class="small">Lv${needLv}｜職業熟練${needM}%${special?"｜特殊資格":""}</span><div class="actions"><button ${ok?"":"disabled"} onclick="unsealCurrentClass()">${ok?"正式解封":"未達條件"}</button></div></div>`
 }
 rows+=classAdvanceCandidates().map(x=>`<div class="card"><b>${x.c.name}</b> <span class="tier">${x.c.tier}</span>｜${x.c.combat_role||""}<br><span class="small">需要：Lv${x.c.unlock_level||1}、目前職業熟練${classMasteryNeed(x.c.tier)}%${x.special?"、特殊路線資格":""}<br>目前：Lv${c.level}／${(c.classMastery||0).toFixed(1)}%</span><div class="actions"><button ${x.ok?"":"disabled"} onclick="advanceCombatClass('${x.c.id}')">${x.ok?"轉職":"未達條件"}</button></div></div>`).join("");
 showModal("冒險者公會・職業進階",(rows||"<div class='small'>目前沒有直接進階路線。</div>")+`<div class="actions"><button onclick="renderFacility('guild')">上一頁</button></div>`)
}
function advanceCombatClass(targetId){
 const cur=cls(G.character.classId),t=cls(targetId),cand=classAdvanceCandidates().find(x=>x.c.id===targetId);
 if(!t||!cand?.ok)return;
 closeModal();if(!beginTurn("職業進階"))return;
 G.character.classHistory=G.character.classHistory||[];
 G.character.classHistory.push({id:cur.id,name:cur.name,tier:cur.tier,mastery:G.character.classMastery||0,time:timeText()});
 G.character.classId=t.id;G.character.combatGrade=t.tier;G.character.classSealed=false;G.character.classGate=null;G.character.classMastery=0;
 log("職業",`正式進階為 ${t.name}［${t.tier}］。冒險者等級仍為 ${G.character.adventureRank}，兩者獨立。`,"ok");
 endTurn(4);renderFacility("guild")
}
function unsealCurrentClass(){
 const c=G.character,t=cls(c.classId),need=classMasteryNeed(t.tier),special=["B","A","S"].includes(t.tier);
 if(!c.classSealed||c.level<(t.unlock_level||1)||(c.classMastery||0)<need||(special&&!(c.unlockedClassRoutes||[]).includes(t.id)))return;
 closeModal();if(!beginTurn("職業解封"))return;
 c.classSealed=false;c.combatGrade=t.tier;c.classGate=null;
 log("職業",`${t.name}［${t.tier}］的正式能力資格已解封。`,"ok");endTurn(4);renderFacility("guild")
}
function awardBattleProgress(enemy){
 const xp=enemy.xp_reward||DB.progression_system.monster_xp_by_tier[enemy.tier]||10;
 gainCharacterXp(xp,enemy.name);
 gainClassMastery(Math.max(.35,1.1+tierOrder(enemy.tier)*.18));gainCompanionXp(Math.max(1,Math.round(xp*.35)));gainPartyXp(Math.max(1,Math.round(xp*.28)))
}function finishBattle(result){
 if(!G.battle)return;const enemy=G.battle.enemy;syncPartyAfterBattle();G.battle.active=false;$("#battleBack").classList.add("hide");
 if(result==="勝利"){emitIntegratedEvent("battle_victory","monster",enemy.id,`擊退${enemy.name}［${enemy.tier}］`,{locationId:G.character.locationId});const kh=talentSpecial("killHeal");if(kh)G.character.hp=clamp(G.character.hp+kh,0,G.character.maxHp);log("戰鬥",`擊退 ${enemy.name}［${enemy.tier}］。${kh?` 天賦恢復${kh}HP。`:""}`,"ok");updateQuestProgress("kill",{name:enemy.name,id:enemy.id});rollEnemyLoot(enemy);awardBattleProgress(enemy)}
 else if(result==="戰敗")handleBattleDefeat(enemy);else log("戰鬥",result,"warnText");
 G.battle=null;closeBattleSkillPopup();document.body.classList.remove("battle-open");persist();renderAll();syncBodyScrollLock();if(battleLastFocus?.isConnected)battleLastFocus.focus({preventScroll:true});battleLastFocus=null
}

function setNavActive(btnOrKey){
 const nav=document.querySelector("#fixedNav");if(!nav)return;
 const buttons=[...nav.querySelectorAll("button[data-nav]")];
 const key=typeof btnOrKey==="string"?btnOrKey:btnOrKey?.dataset?.nav;
 buttons.forEach(b=>{const active=b.dataset.nav===key;b.classList.toggle("active",active);if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")})
}
function companionSpecies(id){return IDX.companion.get(id)}
function companions(){return G?.character?.companions||[]}
function activeCompanionInstance(){return companions().find(x=>x.uid===G.character.activeCompanionId)||null}
function activeCompanionSpecies(){const c=activeCompanionInstance();return c?companionSpecies(c.speciesId):null}
function companionRosterCount(){return companions().length}
function highestSummonSkillTier(){
 let best=-1;
 for(const s of (G.character.skills||[])){
   if((s.family==="SF-SUMMON"||String(s.name||"").includes("召喚"))&&tierOrder(s.tier||"F")>best)best=tierOrder(s.tier||"F")
 }
 return best<0?null:["F","E","D","C","B","A","S"][best]
}
function companionXpToNext(level){return Math.round(30+level*18+level*level*2.5)}
function makeCompanionInstance(speciesId,source="未知"){
 const sp=companionSpecies(speciesId);if(!sp)return null;
 const level=Math.max(1,Math.min(G.character.level||1,sp.min_owner_level||1));
 return {uid:`CP-${Date.now().toString(36)}-${rand(99999)}`,speciesId:sp.id,level,xp:0,bond:0,source,obtainedTurn:G.turn||0}
}
function canAcquireCompanion(sp){
 if(!sp)return {ok:false,reason:"資料不存在"};
 if(companionRosterCount()>=DB.companion_system.roster_limit)return {ok:false,reason:"夥伴已達3隻上限"};
 if((G.character.level||1)<sp.min_owner_level)return {ok:false,reason:`需要Lv${sp.min_owner_level}`};
 if(sp.companion_kind==="summon"){
   const t=highestSummonSkillTier();
   if(!t||tierOrder(t)<tierOrder(sp.tier))return {ok:false,reason:`需要${sp.tier}級以上召喚技能`};
 }
 if(sp.companion_kind==="contract"){
   const summonTier=highestSummonSkillTier(),combat=G.character.combatGrade||"F";
   const powerTier=Math.max(summonTier?tierOrder(summonTier):-1,tierOrder(combat));
   if(powerTier<tierOrder(sp.tier))return {ok:false,reason:`需要${sp.tier}級戰鬥／召喚資格`};
   const needCha=12+tierOrder(sp.tier)*2;
   if((G.character.stats.魅力||0)<needCha)return {ok:false,reason:`魅力需要${needCha}`};
 }
 return {ok:true,reason:""}
}
function acquireCompanion(speciesId,source="取得"){
 const sp=companionSpecies(speciesId),gate=canAcquireCompanion(sp);if(!gate.ok){alert(gate.reason);return false}
 const c=makeCompanionInstance(speciesId,source);G.character.companions.push(c);
 if(!G.character.activeCompanionId)G.character.activeCompanionId=c.uid;
 log("夥伴",`${sp.name}［${sp.tier}］加入隊伍（${sp.companion_kind_label}／${sp.ai_label}）。`,"ok");
 persist();return true
}
function setActiveCompanion(uid){
 const c=companions().find(x=>x.uid===uid);if(!c)return;
 G.character.activeCompanionId=uid;persist();
 const sp=companionSpecies(c.speciesId);log("夥伴",`${sp.name}設為出戰夥伴。`,"ok");
 openCompanionPanel(sp.companion_kind==="summon"?"summon":"pet")
}
function setCompanionStandby(uid){
 const c=companions().find(x=>x.uid===uid);if(!c)return;
 const others=companions().filter(x=>x.uid!==uid);
 if(G.character.activeCompanionId===uid&&others.length){
   G.character.activeCompanionId=others[0].uid;persist();
   const sp=companionSpecies(others[0].speciesId);log("夥伴",`${sp.name}自動接替出戰位置。`,"ok")
 }
 const sp=companionSpecies(c.speciesId);openCompanionPanel(sp.companion_kind==="summon"?"summon":"pet")
}
function releaseCompanion(uid){
 const idx=companions().findIndex(x=>x.uid===uid);if(idx<0)return;
 const sp=companionSpecies(companions()[idx].speciesId);
 if(!confirm(`確定讓${sp.name}離隊？`))return;
 G.character.companions.splice(idx,1);
 if(G.character.activeCompanionId===uid)G.character.activeCompanionId=G.character.companions[0]?.uid||null;
 persist();openCompanionPanel(sp.companion_kind==="summon"?"summon":"pet")
}
function gainCompanionXp(amount){
 const c=activeCompanionInstance();if(!c||!amount)return;
 c.xp=(c.xp||0)+Math.max(1,Math.round(amount));
 let up=0;
 while(c.level<G.character.level&&c.xp>=companionXpToNext(c.level)){
   c.xp-=companionXpToNext(c.level);c.level++;up++
 }
 c.bond=clamp((c.bond||0)+.35,0,100);
 const sp=companionSpecies(c.speciesId);
 if(up)log("夥伴",`${sp.name}提升至Lv${c.level}。`,"ok")
}
function companionCombatStats(inst){
 const sp=companionSpecies(inst?.speciesId);if(!sp)return null;
 const b=sp.base_stats||{},lv=Math.max(1,inst.level||1),scale=1+(lv-1)*.035;
 const owner=combatStats(),bond=clamp(inst.bond||0,0,100);
 let power=1+bond/600;
 if(sp.companion_kind==="summon")power*=1+owner.summonPower/350;
 else if(sp.companion_kind==="contract")power*=1+owner.summonPower/500;
 return {
   hp:Math.round((b.hp||18)*scale*power),attack:Math.round((b.attack||6)*scale*power),
   magic:Math.round((b.magic||4)*scale*power),defense:Math.round((b.defense||4)*scale*power),
   accuracy:clamp(Math.round((b.accuracy||58)+(lv-1)*.5),40,95),
   evasion:clamp(Math.round((b.evasion||8)+(lv-1)*.22),0,55),
   speed:Math.round((b.speed||10)+(lv-1)*.15),element:sp.element,ai:sp.ai_profile
 }
}
function battleCompanionSnapshot(){
 const inst=activeCompanionInstance();if(!inst)return null;
 const sp=companionSpecies(inst.speciesId),cs=companionCombatStats(inst);
 return {uid:inst.uid,speciesId:sp.id,name:sp.name,tier:sp.tier,kind:sp.companion_kind,kindLabel:sp.companion_kind_label,
   ai:sp.ai_profile,aiLabel:sp.ai_label,element:sp.element,maxHp:cs.hp,hp:cs.hp,attack:cs.attack,magic:cs.magic,defense:cs.defense,
   accuracy:cs.accuracy,evasion:cs.evasion,speed:cs.speed,statusEffects:[],guarding:false,knockedOut:false}
}
function companionRosterSummary(){
 const a=activeCompanionInstance(),sp=a?companionSpecies(a.speciesId):null;
 return `出戰：${sp?sp.name:"無"}｜待機：${Math.max(0,companions().length-(a?1:0))}/${DB.companion_system.standby_limit}｜總數：${companions().length}/${DB.companion_system.roster_limit}`
}
function openCharacterSkills(){
 const c=G.character,skills=c.skills.map((s,i)=>{
   normalizeSkillXp(s);const mana=skillUsesMana(s),cost=skillResourceCost(s);
   const effect=s.summon_qualification?`【${skillUseTypeLabel(s)}】效果：最高支援${s.tier||"F"}級召喚研究｜戰鬥由召喚獸AI自動執行`:skillDescriptionText(s);
   return `<div class="itemrow"><span><b>${s.name}</b> <span class="tier">${s.tier||"F"}</span>［${skillUseTypeLabel(s)}／${s.school||"戰技"}］
   <br><span class="small">Lv${skillLevel(s)}｜技能XP ${skillXpProgressText(s)}｜熟練 ${Number(s.mastery||0).toFixed(1)}%</span>
   <br><span class="small">${effect}${s.kind!=="被動"?`｜命中${(s.accuracy||0)+skillLevelBonus(s,"accuracy_bonus")}｜${mana?"MP":"SP"}消耗${cost}`:"｜常駐生效"}</span></span>
   <button class="bad" onclick="forgetSkill(${i})">遺忘</button></div>`
 }).join("");
 showModal("技能",skills||"<div class='card small'>尚未學會技能。</div>")
}
function openCompanionPanel(filter="pet"){
 const isSummon=filter==="summon",list=companions().filter(c=>{
   const k=companionSpecies(c.speciesId)?.companion_kind;return isSummon?k==="summon":k==="pet"||k==="contract"
 });
 const rows=list.map(c=>{const sp=companionSpecies(c.speciesId),active=G.character.activeCompanionId===c.uid;
   return `<div class="card"><b>${sp.name}</b> <span class="tier">${sp.tier}</span>［${sp.companion_kind_label}／${sp.ai_label}］${active?" <span class='ok'>出戰中</span>":""}<br>
   <span class="small">Lv${c.level}｜XP ${c.xp||0}/${c.level>=G.character.level?"主人等級上限":companionXpToNext(c.level)}｜羈絆${(c.bond||0).toFixed(1)}%${sp.element?`｜${sp.element}`:""}<br>${DB.companion_system.ai_profiles[sp.ai_profile].behavior}</span>
   <div class="actions">${active?`<button disabled>出戰中</button>`:`<button class="good" onclick="setActiveCompanion('${c.uid}')">設為出戰</button>`}<button class="bad" onclick="releaseCompanion('${c.uid}')">離隊</button></div></div>`
 }).join("")||`<div class="card small">目前沒有${isSummon?"召喚獸":"寵物／契約獸"}。</div>`;
 const hint=isSummon?`召喚獸需在法師公會進行召喚研究；最高研究階級：${highestSummonSkillTier()||"尚無召喚技能"}。`:"寵物可在符合地區與階級的探索機緣中馴養；契約獸需進行契約儀式。";
 showModal(isSummon?"召喚":"寵物／契約",`<div class="card small"><b>${companionRosterSummary()}</b><br>${hint}<br>所有夥伴戰鬥時由AI自動操作。</div>${rows}`)
}
function companionResearchCost(sp){return Math.round(12+Math.pow(tierOrder(sp.tier)+1,2)*14)}
function openSummonResearch(){
 if(G.character.currentFacility!=="mageguild")return;
 const max=highestSummonSkillTier();
 if(!max){showModal("召喚研究","<div class='card small'>你尚未掌握召喚系技能，無法建立穩定召喚陣。</div><div class='actions'><button onclick=\"renderFacility('mageguild')\">上一頁</button></div>");return}
 const owned=new Set(companions().map(x=>x.speciesId));
 const pool=(DB.companion_species||[]).filter(sp=>sp.companion_kind==="summon"&&!owned.has(sp.id)&&tierOrder(sp.tier)<=tierOrder(max)&&G.character.level>=sp.min_owner_level);
 const rows=pool.map(sp=>{const cost=companionResearchCost(sp),gate=canAcquireCompanion(sp);return `<div class="itemrow"><span><b>${sp.name}</b> <span class="tier">${sp.tier}</span>［${sp.ai_label}］<br><span class="small">${sp.family}${sp.element?`｜${sp.element}`:""}｜研究費${cost}銀</span></span><button ${gate.ok&&G.character.moneySilver>=cost?"":"disabled"} onclick="researchSummon('${sp.id}',${cost})">${gate.ok?"研究":"未達條件"}</button></div>`}).join("")||"<div class='card small'>目前沒有符合召喚能力與等級的研究對象。</div>";
 showModal("召喚研究",`<div class="card small">召喚研究受已學召喚技能最高階級限制；持有總數仍上限3隻。</div>${rows}<div class="actions"><button onclick="renderFacility('mageguild')">上一頁</button></div>`)
}
function researchSummon(speciesId,cost){
 const sp=companionSpecies(speciesId),gate=canAcquireCompanion(sp);if(!gate.ok||G.character.moneySilver<cost)return;
 closeModal();if(!beginTurn("召喚研究"))return;G.character.moneySilver-=cost;
 acquireCompanion(speciesId,"法師公會召喚研究");endTurn(3);openSummonResearch()
}
function openContractRitual(){
 if(!["mageguild","enchanter"].includes(G.character.currentFacility))return;
 const owned=new Set(companions().map(x=>x.speciesId));
 const pool=(DB.companion_species||[]).filter(sp=>sp.companion_kind==="contract"&&!owned.has(sp.id)&&G.character.level>=sp.min_owner_level);
 const rows=pool.map(sp=>{const cost=Math.round(30+Math.pow(tierOrder(sp.tier)+1,2)*28),gate=canAcquireCompanion(sp);return `<div class="itemrow"><span><b>${sp.name}</b> <span class="tier">${sp.tier}</span>［${sp.ai_label}］<br><span class="small">${sp.family}${sp.element?`｜${sp.element}`:""}｜契約費${cost}銀｜${gate.ok?"條件符合":gate.reason}</span></span><button ${gate.ok&&G.character.moneySilver>=cost?"":"disabled"} onclick="performContract('${sp.id}',${cost})">契約</button></div>`}).join("")||"<div class='card small'>目前沒有符合條件的契約對象。</div>";
 showModal("契約儀式",`<div class="card small">契約獸受角色等級、戰鬥／召喚階級與魅力共同限制；不會因單次隨機事件直接加入。</div>${rows}<div class="actions"><button onclick="renderFacility('${G.character.currentFacility}')">上一頁</button></div>`)
}
function performContract(speciesId,cost){
 const sp=companionSpecies(speciesId),gate=canAcquireCompanion(sp);if(!gate.ok||G.character.moneySilver<cost)return;
 closeModal();if(!beginTurn("契約儀式"))return;G.character.moneySilver-=cost;
 acquireCompanion(speciesId,"正式契約儀式");endTurn(5);openContractRitual()
}
function petOpportunityCandidates(l){
 const maxTier=Math.min(tierOrder(l.tier),tierOrder(playerAdventureTier()));
 const zone=l.encounter_profile?.zone||"town_outskirts";
 return (DB.companion_species||[]).filter(sp=>sp.companion_kind==="pet"&&tierOrder(sp.tier)<=maxTier&&G.character.level>=sp.min_owner_level&&(sp.habitat_zones||[]).includes(zone))
}
function maybePetOpportunity(){
 if(companionRosterCount()>=DB.companion_system.roster_limit)return false;
 const l=loc(G.character.locationId);if(!["wild","dungeon"].includes(l.kind))return false;
 if(Math.random()>.035)return false;
 const pool=petOpportunityCandidates(l);if(!pool.length)return false;
 const sp=pool[rand(pool.length)];G.pendingPetOpportunity={speciesId:sp.id,locationId:l.id,turn:G.turn};
 showModal(`寵物機緣・${sp.name}`,`<div class="card"><b>${sp.name}</b> <span class="tier">${sp.tier}</span>［${sp.ai_label}］<br><span class="small">你在${l.name}遇見一隻可嘗試接近的${sp.name}。馴養成功仍受3隻總上限限制。</span></div><div class="actions"><button class="good" onclick="resolvePetOpportunity(true)">嘗試馴養</button><button onclick="resolvePetOpportunity(false)">不打擾牠</button></div>`);
 return true
}
function resolvePetOpportunity(tryTame){
 const o=G.pendingPetOpportunity,sp=o?companionSpecies(o.speciesId):null;if(!o||!sp)return;
 if(!tryTame){log("寵物",`你沒有嘗試馴養${sp.name}。`);G.pendingPetOpportunity=null;closeModal();persist();return}
 const dc=9+tierOrder(sp.tier)*3,r=rollD20(),mod=Math.floor((effectiveStat("魅力")+effectiveStat("意志")-20)/4),total=r+mod;
 if(total>=dc&&acquireCompanion(sp.id,`於${loc(o.locationId).name}馴養`))log("寵物",`馴養判定 ${r}${mod>=0?"+":""}${mod}=${total}，${sp.name}願意跟隨你。`,"ok");
 else log("寵物",`馴養判定 ${r}${mod>=0?"+":""}${mod}=${total}，${sp.name}保持距離後離開。`);
 G.pendingPetOpportunity=null;closeModal();persist();renderAll()
}
function partyTemplate(id){return IDX.partyTemplate.get(id)}
function adventureParty(){return G?.character?.adventureParty||null}
function partyMembers(){return adventureParty()?.members||[]}
function partySize(){return 1+partyMembers().length}
function partyLeaderName(){
 const p=adventureParty();if(!p)return G.character.name;
 if(p.leader==="player")return G.character.name;
 const m=partyMembers().find(x=>x.uid===p.leader);return m?partyTemplate(m.templateId)?.name||"NPC領隊":"NPC領隊"
}
function playerRaceLabel(){return displayRace().replace(/\(.+?\)/g,"")}
function playerOriginCategory(){return org(G.character.originId)?.category||""}
function playerRoleFamily(){
 const cc=cls(G.character.classId),r=cc?.combat_role||"";
 if(r.includes("治療"))return "healer";
 if(r.includes("防禦"))return "tank";
 if(r.includes("遠程"))return "ranged";
 if(r.includes("敏捷"))return "scout";
 if(r.includes("施法"))return "caster";
 if(r.includes("混合")||cc?.combat_track==="hybrid")return "hybrid";
 return "frontline"
}
function partyRoleNeeds(){
 const have=new Set([playerRoleFamily(),...partyMembers().map(m=>partyTemplate(m.templateId)?.role)]);
 const needs=[];
 if(!have.has("tank"))needs.push("tank");
 if(!have.has("healer"))needs.push("healer");
 if(!have.has("ranged")&&!have.has("caster"))needs.push("ranged","caster");
 return needs
}
function recruitMaxTier(){
 const locTier=tierOrder(loc(G.character.locationId)?.tier||"F");
 const charTier=tierOrder(G.character.combatGrade||"F");
 return ["F","E","D","C"][Math.min(3,Math.max(locTier,charTier)+1)]||"F"
}
function partyCompatibility(template,mode="recruit"){
 let score=DB.adventure_party_system.acceptance_score.base,reasons=[];
 const rep=G.character.guildReputation||0,repBonus=Math.round(clamp(rep,-20,40)*DB.adventure_party_system.acceptance_score.guild_rep_weight);
 score+=repBonus;reasons.push(`公會信用${repBonus>=0?"+":""}${repBonus}`);
 const pr=playerRaceLabel();
 if(pr.includes(template.race)||template.race.includes(pr)){score+=5;reasons.push("種族背景相近+5")}
 else if((pr.includes("魔裔")&&template.race==="天裔")||(pr.includes("天裔")&&template.race==="魔裔")){score-=5;reasons.push("種族立場差異-5")}
 const oc=playerOriginCategory();
 const bg=template.background;
 let bgBonus=0;
 if(oc.includes("軍")&&bg==="軍旅")bgBonus=5;
 else if(oc.includes("貴族")&&["軍旅","信仰"].includes(bg))bgBonus=3;
 else if(oc.includes("信仰")&&bg==="信仰")bgBonus=5;
 else if(oc.includes("魔法")&&bg==="魔法學術")bgBonus=5;
 else if(oc.includes("平民")&&["平民／冒險者","工匠","商旅"].includes(bg))bgBonus=4;
 else if(oc.includes("命運")&&["傭兵／漂泊","異族／特殊"].includes(bg))bgBonus=2;
 if(bgBonus){score+=bgBonus;reasons.push(`出身契合+${bgBonus}`)}
 const needs=partyRoleNeeds();
 if(needs.includes(template.role)){score+=12;reasons.push("隊伍職能互補+12")}
 if(template.role===playerRoleFamily()){score+=3;reasons.push("職業路線相近+3")}if((template.class_affinity_ids||[]).includes(G.character.classId)){score+=6;reasons.push("職業專長契合+6")}
 if(mode==="join")score+=2;
 if(mode==="recruit"&&adventureParty()?.mode==="joined"){score-=5;reasons.push("需現任領隊同意-5")}
 score-=Math.max(0,partyMembers().length-2)*3;
 return {score:clamp(Math.round(score),0,100),reasons}
}
function recruitChanceText(s){return s>=80?"很高":s>=65?"高":s>=50?"普通":s>=35?"低":"很低"}
function teammateRecruitFee(t){
 const r=DB.adventure_party_system.recruit_fee_by_tier[t.tier]||[5,9];
 return Math.round((r[0]+r[1])/2)
}
function teammateLevel(t){return Math.max(t.min_player_level,Math.min(G.character.level,Math.max(1,G.character.level-rand(3))))}
function makePartyMember(templateId,source="招募"){
 const t=partyTemplate(templateId),level=teammateLevel(t),scale=1+(level-1)*.035,b=t.base_stats;
 const maxHp=Math.round(b.hp*scale);
 return {uid:`PMI-${Date.now().toString(36)}-${rand(99999)}`,templateId:t.id,level,xp:0,bond:0,source,
   maxHp,hp:maxHp,joinedTurn:G.turn||0}
}
function createSelfLedParty(member){
 G.character.adventureParty={id:`PTY-${Date.now().toString(36)}`,name:`${G.character.name}的冒險團`,mode:"self-led",leader:"player",members:[member],createdTurn:G.turn||0}
}
function addPartyMember(templateId,source="招募"){
 if(partyMembers().length>=DB.adventure_party_system.npc_member_max)return false;
 const m=makePartyMember(templateId,source);
 if(!adventureParty())createSelfLedParty(m);else G.character.adventureParty.members.push(m);
 persist();return true
}
function leaveAdventureParty(){
 const p=adventureParty();if(!p)return;
 if(!confirm("確定離開目前冒險團？"))return;
 const old=p.name;G.character.adventureParty=null;persist();log("冒險團",`離開「${old}」，恢復單獨行動。`);openAdventureParty()
}
function dismissPartyMember(uid){
 const p=adventureParty();if(!p||p.mode!=="self-led")return;
 const m=p.members.find(x=>x.uid===uid);if(!m)return;
 const t=partyTemplate(m.templateId);if(!confirm(`確定讓${t.name}離隊？`))return;
 p.members=p.members.filter(x=>x.uid!==uid);
 if(!p.members.length){G.character.adventureParty=null;log("冒險團","最後一名隊友離隊，冒險團解散。")}
 else log("冒險團",`${t.name}離開冒險團。`);
 persist();openAdventureParty()
}
function openAdventureParty(){
 const p=adventureParty();
 if(!p){showModal("冒險團",`<div class="card"><b>目前沒有正式冒險團</b><br><span class="small">前往冒險者公會或酒館招募至少1名隊友，或在公會加入既有冒險團。正式編制包含你本人共2–5人。</span></div>`);return}
 const rows=p.members.map(m=>{const t=partyTemplate(m.templateId);return `<div class="card"><b>${t.name}</b> <span class="tier">${t.tier}</span>［${t.race}／${t.role_label}］${p.leader===m.uid?" <span class='tier'>領隊</span>":""}<br><span class="small">Lv${m.level}｜HP ${Math.round(m.hp)}/${m.maxHp}｜羈絆${(m.bond||0).toFixed(1)}%｜${t.background}<br>戰鬥：${DB.adventure_party_system.ai_profiles[t.role]}</span>${p.mode==="self-led"?`<div class="actions"><button class="bad" onclick="dismissPartyMember('${m.uid}')">請其離隊</button></div>`:""}</div>`}).join("");
 showModal("冒險團",`<div class="card"><b>${p.name}</b><br>${p.mode==="self-led"?"你是領隊":`領隊：${partyLeaderName()}`}｜編制 ${partySize()}/5<br><span class="small">NPC隊友戰鬥皆由AI自動操作；玩家本人也計入冒險團人數。</span></div>${rows}<div class="actions"><button class="bad" onclick="leaveAdventureParty()">離開／解散冒險團</button></div>`)
}
function candidateLegal(t){
 if(!t?.recruitable)return false;
 if(G.character.level<t.min_player_level)return false;
 if(tierOrder(t.tier)>tierOrder(recruitMaxTier()))return false;
 return true
}
function generateRecruitCandidates(place="guild"){
 const pool=(DB.party_member_templates||[]).filter(candidateLegal);
 const weighted=pool.map(t=>{
   let w=1;
   if(place==="tavern"&&["傭兵／漂泊","平民／冒險者","商旅"].includes(t.background))w+=2;
   if(place==="guild"&&["軍旅","信仰","魔法學術","學術／情報"].includes(t.background))w+=1.2;
   if(partyRoleNeeds().includes(t.role))w+=2.5;
   return [t,w]
 });
 const out=[],used=new Set();
 while(out.length<8&&weighted.length){
   const remain=weighted.filter(([x])=>!used.has(x.id));if(!remain.length)break;
   const t=weightedPick(remain);if(!t)break;used.add(t.id);out.push(t)
 }
 return out
}
function openRecruitTeammates(place="guild"){
 if(partyMembers().length>=4){showModal("招募隊友","<div class='card small'>冒險團已達5人上限（含你本人）。</div>");return}
 G.recruitOfferCache=G.recruitOfferCache||{};const cached=G.recruitOfferCache[place],ttl=DB.adventure_party_system.offer_refresh_turns||4;
 const list=cached&&G.turn-cached.turn<ttl?cached.list:generateRecruitCandidates(place);
 if(!cached||G.turn-cached.turn>=ttl)G.recruitOfferCache[place]={turn:G.turn,list};
 const rows=list.map(t=>{const fit=partyCompatibility(t,"recruit"),fee=teammateRecruitFee(t);return `<div class="card"><b>${t.name}</b> <span class="tier">${t.tier}</span>［${t.race}／${t.role_label}］<br><span class="small">${t.background}｜Lv門檻${t.min_player_level}｜招募費${fee}銀<br>接受意願：${fit.score}/100（${recruitChanceText(fit.score)}）｜${fit.reasons.join("、")}</span><div class="actions"><button ${G.character.moneySilver>=fee?"":"disabled"} onclick="attemptRecruit('${t.id}',${fee},'${place}')">提出邀請</button></div></div>`}).join("")||"<div class='card small'>目前沒有符合你所在區域與等級的隊友。</div>";
 showModal(place==="tavern"?"酒館・招募隊友":"冒險者公會・招募隊友",`<div class="card small">招募判定會考慮職業互補、種族、出身與公會信用。拒絕不扣招募費。</div>${rows}<div class="actions"><button onclick="renderFacility('${place}')">上一頁</button></div>`)
}
function attemptRecruit(templateId,fee,place){
 const t=partyTemplate(templateId);if(!candidateLegal(t)||partyMembers().length>=4)return;
 const fit=partyCompatibility(t,"recruit"),roll=randomInt(1,100);
 if(roll>fit.score){if(G.recruitOfferCache?.[place])G.recruitOfferCache[place].list=G.recruitOfferCache[place].list.filter(x=>x.id!==t.id);log("招募",`${t.name}婉拒加入。接受意願${fit.score}/100，判定${roll}。本輪招募期內不會重複提出邀請。`);openRecruitTeammates(place);return}
 if(G.character.moneySilver<fee)return;
 closeModal();if(!beginTurn("招募隊友"))return;
 G.character.moneySilver-=fee;addPartyMember(t.id,`${place==="tavern"?"酒館":"冒險者公會"}招募`);
 if(G.recruitOfferCache?.[place])G.recruitOfferCache[place].list=G.recruitOfferCache[place].list.filter(x=>x.id!==t.id);
 log("冒險團",`${t.name}接受邀請加入冒險團。招募費${fee}銀。`,"ok");endTurn(.5);openAdventureParty()
}
function generateJoinOffers(){
 const pool=(DB.party_member_templates||[]).filter(candidateLegal),offers=[];
 for(let n=0;n<5;n++){
   const count=1+rand(4),members=[],used=new Set();
   for(let i=0;i<count;i++){
     const available=pool.filter(t=>!used.has(t.id));if(!available.length)break;
     const t=available[rand(available.length)];used.add(t.id);members.push(t)
   }
   if(!members.length)continue;
   const leader=members[0],fit=partyCompatibility(leader,"join");
   offers.push({id:`OFFER-${G.turn}-${n}`,members,leader,score:fit.score,reasons:fit.reasons})
 }
 return offers
}
function openJoinAdventureParty(){
 if(adventureParty()){showModal("加入冒險團","<div class='card small'>你已經在冒險團中；請先離開目前隊伍。</div>");return}
 const ttl=DB.adventure_party_system.offer_refresh_turns||4,cached=G.joinOfferCache;
 const offers=cached&&G.turn-cached.turn<ttl?cached.offers:generateJoinOffers();
 if(!cached||G.turn-cached.turn>=ttl)G.joinOfferCache={turn:G.turn,offers};
 const rows=offers.map((o,i)=>`<div class="card"><b>${o.leader.name}領隊的小隊</b>｜加入後${o.members.length+1}/5人<br><span class="small">${o.members.map(x=>`${x.name}［${x.role_label}］`).join("、")}<br>對你的接受意願：${o.score}/100（${recruitChanceText(o.score)}）｜${o.reasons.join("、")}</span><div class="actions"><button onclick="attemptJoinParty(${i})">申請加入</button></div></div>`).join("");
 G.tempJoinOffers=offers;
 showModal("冒險者公會・加入冒險團",`<div class="card small">既有冒險團會評估你的職業、種族、出身與公會信用。加入後NPC領隊仍保有領隊身分。</div>${rows}<div class="actions"><button onclick="renderFacility('guild')">上一頁</button></div>`)
}
function attemptJoinParty(index){
 const o=G.tempJoinOffers?.[index];if(!o||adventureParty())return;
 const roll=randomInt(1,100);
 if(roll>o.score){if(G.joinOfferCache)G.joinOfferCache.offers=G.joinOfferCache.offers.filter(x=>x.id!==o.id);G.tempJoinOffers=G.joinOfferCache?.offers||[];log("冒險團",`${o.leader.name}領隊的小隊婉拒你的加入申請。意願${o.score}/100，判定${roll}。本輪招募期內不再重複申請。`);openJoinAdventureParty();return}
 closeModal();if(!beginTurn("加入冒險團"))return;
 const members=o.members.slice(0,4).map(t=>makePartyMember(t.id,"公會冒險團"));
 G.character.adventureParty={id:`PTY-${Date.now().toString(36)}`,name:`${o.leader.name}的小隊`,mode:"joined",leader:members[0].uid,members,createdTurn:G.turn};
 G.tempJoinOffers=null;G.joinOfferCache=null;log("冒險團",`你獲准加入「${G.character.adventureParty.name}」，目前編制${partySize()}/5。`,"ok");endTurn(.4);openAdventureParty()
}
function partyMemberCombatStats(inst){
 const t=partyTemplate(inst.templateId),b=t.base_stats,scale=1+(inst.level-1)*.035,bond=1+clamp(inst.bond||0,0,100)/700;
 return {maxHp:Math.round(b.hp*scale*bond),attack:Math.round(b.attack*scale*bond),magic:Math.round(b.magic*scale*bond),
   defense:Math.round(b.defense*scale*bond),accuracy:clamp(Math.round(b.accuracy+(inst.level-1)*.45),40,95),
   evasion:clamp(Math.round(b.evasion+(inst.level-1)*.2),0,55),speed:Math.round(b.speed+(inst.level-1)*.12)}
}
function partyBattleSnapshots(){
 return partyMembers().map(inst=>{const t=partyTemplate(inst.templateId),s=partyMemberCombatStats(inst),ratio=clamp((inst.hp??inst.maxHp)/Math.max(1,inst.maxHp||s.maxHp),0.05,1);
   return {uid:inst.uid,templateId:t.id,name:t.name,tier:t.tier,role:t.role,roleLabel:t.role_label,maxHp:s.maxHp,hp:Math.max(1,Math.round(s.maxHp*ratio)),
     attack:s.attack,magic:s.magic,defense:s.defense,accuracy:s.accuracy,evasion:s.evasion,speed:s.speed,statusEffects:[],knockedOut:false,guarding:false}
 })
}
function partyBattleLog(msg){battleLog(`【隊友】${msg}`)}
function lowestPartyTarget(){
 const units=[{type:"player",ratio:G.character.hp/G.character.maxHp,name:G.character.name}];
 for(const m of (G.battle?.party||[]))if(!m.knockedOut&&m.hp>0)units.push({type:"member",uid:m.uid,ratio:m.hp/m.maxHp,name:m.name});
 return units.sort((a,b)=>a.ratio-b.ratio)[0]
}
function resolvePartyTurns(){
 const b=G.battle,e=b?.enemy;if(!b?.active||!Array.isArray(b.party))return;
 for(const m of b.party){
   if(!b.active||e.hp<=0||m.knockedOut||m.hp<=0)continue;
   const t=partyTemplate(m.templateId),target=lowestPartyTarget();
   if(m.role==="healer"&&target&&target.ratio<.68){
     const heal=Math.max(2,Math.round(m.magic*.75));
     if(target.type==="player"){G.character.hp=clamp(G.character.hp+heal,0,G.character.maxHp)}
     else {const x=b.party.find(v=>v.uid===target.uid);x.hp=clamp(x.hp+heal,0,x.maxHp)}
     partyBattleLog(`${m.name}治療${target.name}，恢復${heal}HP。`);continue
   }
   if(m.role==="tank"&&target&&target.ratio<.62){m.guarding=true;partyBattleLog(`${m.name}進入護衛姿態。`);continue}
   if(m.role==="support"&&G.character.hp/G.character.maxHp<.75){G.character.hp=clamp(G.character.hp+Math.max(1,Math.round(m.magic*.35)),0,G.character.maxHp);partyBattleLog(`${m.name}提供支援，穩定隊伍狀態。`);continue}
   let useMagic=m.role==="caster"||(m.role==="hybrid"&&(e.magicDefense||e.defense||0)<(e.defense||0)),atk=useMagic?m.magic:m.attack;
   const bonusAcc=m.role==="ranged"?5:m.role==="scout"?7:0,roll=rollD20(),score=roll+Math.floor((m.accuracy+bonusAcc-(e.evasion||0))/10);
   if(score<10){partyBattleLog(`${m.name}攻擊未命中。`);continue}
   let def=useMagic?(e.magicDefense||e.defense||0):(e.defense||0),dmg=Math.max(1,Math.round(atk-def*.34));
   if(m.role==="frontline")dmg=Math.round(dmg*1.06);
   if(m.role==="scout"&&roll>=18)dmg=Math.round(dmg*1.35);
   if(m.role==="specialist")dmg=Math.max(1,Math.round(dmg*.72));
   e.hp=Math.max(0,e.hp-dmg);partyBattleLog(`${m.name}造成${dmg}傷害。`)
 }
}
function partyThreatTargets(){
 const out=[];
 for(const m of (G.battle?.party||[])){
   if(m.knockedOut||m.hp<=0)continue;
   const w={tank:185,frontline:125,ranged:75,scout:65,caster:72,hybrid:105,healer:82,support:68,specialist:55}[m.role]||70;
   out.push({type:"party",unit:m,weight:w+(m.guarding?100:0)})
 }
 return out
}
function syncPartyAfterBattle(){
 const p=adventureParty();if(!p||!G.battle?.party)return;
 for(const snap of G.battle.party){
   const inst=p.members.find(x=>x.uid===snap.uid);if(!inst)continue;
   const stats=partyMemberCombatStats(inst);inst.maxHp=stats.maxHp;inst.hp=Math.max(1,Math.round(clamp(snap.hp/snap.maxHp,0.03,1)*stats.maxHp))
 }
}
function gainPartyXp(amount){
 const p=adventureParty();if(!p)return;
 for(const m of p.members){
   m.xp=(m.xp||0)+Math.max(1,Math.round(amount));
   const need=lv=>Math.round(45+lv*22+lv*lv*2.2);
   while(m.level<G.character.level&&m.xp>=need(m.level)){m.xp-=need(m.level);m.level++;const s=partyMemberCombatStats(m);m.maxHp=s.maxHp;m.hp=s.maxHp}
   m.bond=clamp((m.bond||0)+.22,0,100)
 }
}
function healPartyFull(){
 for(const m of partyMembers()){const s=partyMemberCombatStats(m);m.maxHp=s.maxHp;m.hp=s.maxHp}
}
function partyOpportunityCandidate(){
 const pool=(DB.party_member_templates||[]).filter(candidateLegal);if(!pool.length)return null;
 return pool[rand(pool.length)]
}
function maybePartySocialEvent(context){
 if(partyMembers().length>=4||G.pendingPartyOpportunity)return false;
 if(!["探索","旅行"].includes(context)||Math.random()>.025)return false;
 if(Math.random()<.58){
   const t=partyOpportunityCandidate();if(!t)return false;
   G.pendingPartyOpportunity={kind:"candidate",templateId:t.id,context,turn:G.turn};
   const fit=partyCompatibility(t,"recruit");
   showModal(`奇遇・${t.name}`,`<div class="card"><b>${t.name}</b> <span class="tier">${t.tier}</span>［${t.race}／${t.role_label}］<br><span class="small">旅途中短暫同行後，對方似乎願意討論加入你的隊伍。接受意願${fit.score}/100。</span></div><div class="actions"><button class="good" onclick="resolvePartyOpportunity(true)">邀請加入</button><button onclick="resolvePartyOpportunity(false)">告別</button></div>`);return true
 }else if(!adventureParty()){
   const offers=generateJoinOffers();if(!offers.length)return false;
   const o=offers[0];G.pendingPartyOpportunity={kind:"party",offer:o,context,turn:G.turn};
   showModal("奇遇・野外冒險團",`<div class="card"><b>${o.leader.name}領隊的小隊</b><br><span class="small">${o.members.map(x=>x.name).join("、")}。他們正在找人同行，對你的接受意願${o.score}/100。</span></div><div class="actions"><button class="good" onclick="resolvePartyOpportunity(true)">詢問能否同行</button><button onclick="resolvePartyOpportunity(false)">婉拒</button></div>`);return true
 }
 return false
}
function openPendingPartyOpportunity(){
 const o=G.pendingPartyOpportunity;if(!o)return;
 if(o.kind==="candidate"){
   const t=partyTemplate(o.templateId);if(!t){G.pendingPartyOpportunity=null;return}
   const fit=partyCompatibility(t,"recruit");
   showModal(`奇遇・${t.name}`,`<div class="card"><b>${t.name}</b> <span class="tier">${t.tier}</span>［${t.race}／${t.role_label}］<br><span class="small">先前遇到的冒險者仍在等待你的決定。接受意願${fit.score}/100。</span></div><div class="actions"><button class="good" onclick="resolvePartyOpportunity(true)">邀請加入</button><button onclick="resolvePartyOpportunity(false)">告別</button></div>`)
 }else{
   const x=o.offer;if(!x){G.pendingPartyOpportunity=null;return}
   showModal("奇遇・野外冒險團",`<div class="card"><b>${x.leader.name}領隊的小隊</b><br><span class="small">${x.members.map(v=>v.name).join("、")}。對你的接受意願${x.score}/100。</span></div><div class="actions"><button class="good" onclick="resolvePartyOpportunity(true)">詢問能否同行</button><button onclick="resolvePartyOpportunity(false)">婉拒</button></div>`)
 }
}
function resolvePartyOpportunity(accept){
 const o=G.pendingPartyOpportunity;if(!o)return;
 if(!accept){log("奇遇",o.kind==="candidate"?"你與旅途中遇到的冒險者告別。":"你沒有加入路上遇到的冒險團。");G.pendingPartyOpportunity=null;closeModal();persist();return}
 if(o.kind==="candidate"){
   const t=partyTemplate(o.templateId),fit=partyCompatibility(t,"recruit"),roll=randomInt(1,100);
   if(roll<=fit.score&&addPartyMember(t.id,"奇遇同行"))log("奇遇",`${t.name}決定加入你的冒險團。`,"ok");
   else log("奇遇",`${t.name}考慮後沒有正式加入。`)
 }else{
   const offer=o.offer,roll=randomInt(1,100);
   if(!adventureParty()&&roll<=offer.score){
     const members=offer.members.slice(0,4).map(t=>makePartyMember(t.id,"奇遇冒險團"));
     G.character.adventureParty={id:`PTY-${Date.now().toString(36)}`,name:`${offer.leader.name}的小隊`,mode:"joined",leader:members[0].uid,members,createdTurn:G.turn};
     log("奇遇",`你加入了${offer.leader.name}領隊的冒險團。`,"ok")
   }else log("奇遇","對方衡量隊伍狀況後沒有正式邀請你加入。")
 }
 G.pendingPartyOpportunity=null;closeModal();persist();renderAll()
}
let characterDockContext=false;
let characterDockActiveKey=null;
function characterDockState(){
 if(!G?.character)return null;
 return {
  skill:{label:"技能",icon:"✧",aria:"技能"},
  pet:{label:"寵物",icon:"♞",aria:"寵物／契約"},
  summon:{label:"召喚",icon:"◇",aria:"召喚"},
  party:{label:"冒團",icon:"♜",aria:"冒險團"},
  faith:{label:"信仰",icon:"☼",aria:"信仰"},
  organization:{label:"勢力",icon:"◆",aria:"世界組織與勢力"},
  discipline:{label:"流派",icon:"⌘",aria:"武技／魔法流派"}
 }
}
function characterDockHtml(){
 const state=characterDockState();if(!state)return "";
 return Object.entries(state).map(([key,x])=>`<button data-character-dock="${key}" class="${characterDockActiveKey===key?"active":""}" onclick="openCharacterDockSection('${key}')" aria-label="${x.aria}"><span class="character-dock-icon">${x.icon}</span><span class="character-dock-label">${x.label}</span></button>`).join("")
}
function syncCharacterDock(){
 const dock=$("#characterDock"),modal=document.querySelector("#modalBack .modal");if(!dock||!modal)return;
 if(!characterDockContext||$("#modalBack")?.classList.contains("hide")){
  dock.classList.remove("show");dock.innerHTML="";modal.classList.remove("character-dock-open");return
 }
 dock.innerHTML=characterDockHtml();dock.classList.add("show");modal.classList.add("character-dock-open")
}
function openCharacterDockSection(key){
 characterDockContext=true;characterDockActiveKey=key;
 if(key==="skill")return openCharacterSkills();
 if(key==="pet")return openCompanionPanel("pet");
 if(key==="summon")return openCompanionPanel("summon");
 if(key==="party")return openAdventureParty();
 if(key==="faith")return openFaithProfile();
 if(key==="organization")return openWorldOrganizations();
 if(key==="discipline")return openDisciplineDirectory();
}

function denominationMoney(totalSilver){
 const n=Math.max(0,Math.floor(Number(totalSilver||0)));
 const gold=Math.floor(n/100),silver=n%100,copper=0;
 return `${gold}金幣 ${silver}銀幣 ${copper}銅幣`
}
function openMoreMenu(){
 setNavActive("more");
 showModal("更多",`<div class="more-grid">
   <button class="more-card" onclick="openEquipment()"><span class="more-icon">⚔</span><span>裝備</span></button>
   <button class="more-card" onclick="openIntelArchive()"><span class="more-icon">◉</span><span>情報</span></button>
   <button class="more-card" onclick="openMap()"><span class="more-icon">⌖</span><span>地圖</span></button>
   <button class="more-card" onclick="openSettings()"><span class="more-icon">⚙</span><span>設定</span></button>
 </div>`)
}
function openCharacter(){
 characterDockContext=true;characterDockActiveKey=null;
 normalizeAbilityPoints();const revival=normalizeRevivalState();
 const c=G.character,cc=cls(c.classId),cs=combatStats(),eres=elementalResistances();
 const roleText=cc.combat_role||"—",trackText=cc.combat_track_label||combatTrackText(cc);
 const subjobText=c.subjobs.length?c.subjobs.map(x=>`${sub(x.id).name}［${x.grade}］`).join("、"):"無";
 const safePartyText=v=>String(v||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const members=[{name:c.name,role:cc.name,type:"warrior"},...partyMembers().map(m=>{const t=partyTemplate(m.templateId)||{},role=t.role||t.classId||"隊友",type=/治療|祭司|僧侶/.test(role)?"healer":/魔法|術士|法師/.test(role)?"mage":/弓|斥候|遊俠/.test(role)?"scout":"warrior";return{name:t.name||"冒險團隊友",role,type}})];
 const partyPortraitIndex={warrior:0,healer:1,mage:2,scout:3};const partyVisual=`<section class="xu-party-formation"><h3>冒險團隊形・${members.length} 人</h3>${members.map(m=>`<div class="xu-party-member"><span class="xuan-sd-portrait xuan-painted-sprite" data-sheet="characters" data-index="${partyPortraitIndex[m.type]??0}" aria-hidden="true"></span><b>${safePartyText(m.name)}</b><small>${safePartyText(m.role)}</small></div>`).join("")}</section>`;
 const attrs=[["STR 力量","力量"],["DEX 敏捷","敏捷"],["CON 體質","體力"],["INT 智力","智力"],["WIS 精神","意志"],["CHA 魅力","魅力"],["LUK 幸運","幸運"]].map(([label,key])=>`<div class="card"><b>${label}</b><br>${c.stats[key]}${effectiveStat(key)!==c.stats[key]?` → ${effectiveStat(key)}`:""}${c.abilityPoints>0?` <button class="stat-up good" onclick="spendAbilityPoint('${key}')">＋1</button>`:""}</div>`).join("");
 const core=`<div class="grid3"><div class="card"><b>物理攻擊</b><br>${cs.attack}</div><div class="card"><b>魔法攻擊</b><br>${cs.magicPower}</div><div class="card"><b>物理防禦</b><br>${cs.defense}</div><div class="card"><b>魔法防禦</b><br>${cs.magicDefense}</div><div class="card"><b>命中率</b><br>${cs.accuracy}%</div><div class="card"><b>閃避率</b><br>${cs.evasion}%</div><div class="card"><b>爆擊率</b><br>${cs.critRate}%</div><div class="card"><b>爆擊傷害</b><br>${cs.critDamage}%</div><div class="card"><b>速度／先攻</b><br>${cs.initiative}</div></div>`;
 const advanced=`<div class="grid3"><div class="card"><b>移動速度</b><br>${cs.moveSpeed}</div><div class="card"><b>攻擊速度</b><br>${cs.attackSpeed.toFixed(2)}×</div><div class="card"><b>詠唱速度</b><br>${cs.castSpeed.toFixed(2)}×</div><div class="card"><b>射程</b><br>${cs.range}m</div><div class="card"><b>破甲／魔穿</b><br>${cs.armorPenPct}% / ${cs.magicPenPct}%</div><div class="card"><b>格擋</b><br>${cs.blockRate}% / 減傷${cs.blockValue}%</div><div class="card"><b>韌性</b><br>${cs.poise}</div><div class="card"><b>異常命中</b><br>${cs.statusAccuracy}%</div><div class="card"><b>異常抗性</b><br>${cs.statusResist}%</div><div class="card"><b>生命偷取</b><br>${cs.lifeSteal}%</div><div class="card"><b>治療效果</b><br>${cs.healingPower}%</div><div class="card"><b>MP回復</b><br>${cs.manaRegen}/時</div><div class="card"><b>HP回復</b><br>${cs.hpRegen}/時</div><div class="card"><b>爆擊抗性</b><br>${cs.critResist}%</div><div class="card"><b>威脅值</b><br>${cs.threat}</div><div class="card"><b>潛行</b><br>${cs.stealth}</div><div class="card"><b>感知</b><br>${cs.perception}</div><div class="card"><b>負重上限</b><br>${cs.carryCapacity}kg</div></div>`;
 const resist=`<div class="card small resist-card"><b>屬性抗性</b><div class="resist-grid">${Object.entries(eres).map(([k,v])=>`<span class="resist-item"><span class="resist-name">${k}</span><b class="resist-val">${v>=0?"+":""}${Math.round(v)}%</b></span>`).join("")}</div><div class="resist-poison">毒素抗性：${Math.round(poisonResistance())}%</div></div>`;
 showModal("角色",`
 <div class="profile-card">
   <div class="profile-name">${c.name}</div>
   <div class="profile-row"><span class="profile-key">種族／出身</span><span class="profile-value">${displayRace()}｜${org(c.originId).name}</span></div>
   <div class="profile-row"><span class="profile-key">戰鬥職業</span><span class="profile-value">${cc.name} <span class="tier">${cc.tier}</span></span></div>
   <div class="profile-row"><span class="profile-key">職業定位</span><span class="profile-value">${roleText}｜${trackText}</span></div>
   <div class="profile-row"><span class="profile-key">職業階級</span><span class="profile-value">${c.combatGrade}${c.classSealed?"｜能力封印中":""}</span></div>
   <div class="profile-row"><span class="profile-key">等級／經驗</span><span class="profile-value">Lv${c.level}｜XP ${c.xp||0}/${c.level>=99?"MAX":xpToNext(c.level)}</span></div>
   <div class="profile-row"><span class="profile-key">職業熟練</span><span class="profile-value">${(c.classMastery||0).toFixed(1)}%</span></div>
   <div class="profile-row"><span class="profile-key">元素親和</span><span class="profile-value">${c.element}</span></div>
   <div class="profile-row"><span class="profile-key">副職業</span><span class="profile-value">${subjobText}</span></div>
 </div>
 ${partyVisual}
 <div class="money-card"><div class="money-title">持有金額</div><div class="money-display">${denominationMoney(c.moneySilver||0)}</div></div>
 <div class="resource-list-card">
   <div class="resource-list-row"><span class="resource-list-key">HP</span><span class="resource-list-value">${Math.round(c.hp)}/${c.maxHp}</span></div>
   <div class="resource-list-row"><span class="resource-list-key">MP</span><span class="resource-list-value">${Math.round(c.mana)}/${c.maxMana}</span></div>
   <div class="resource-list-row"><span class="resource-list-key">SP</span><span class="resource-list-value">${Math.round(c.stamina)}/${c.maxStamina}</span></div>
   <div class="resource-list-row"><span class="resource-list-key">毒性</span><span class="resource-list-value">${Math.round(c.toxicity||0)}/100</span></div>
   <div class="resource-list-row"><span class="resource-list-key">負重</span><span class="resource-list-value">${calcWeight()}/${cs.carryCapacity}kg</span></div>
   <div class="resource-list-row"><span class="resource-list-key">復活機會</span><span class="resource-list-value">${revival.remaining}/${revival.max}</span></div>
 </div>
 <div class="character-extra-section">
   <h3>基礎能力</h3>
   <div class="ability-point-bar"><span>每5級獲得1點，可自由分配。</span><span class="ability-point-badge">可用 ${c.abilityPoints}</span></div>
   <div class="grid3">${attrs}</div>
   <h3>核心戰鬥數值</h3>${core}${resist}
   <h3>進階戰鬥素質</h3>${advanced}
   <div class="card small"><b>CHA／LUK衍生</b><br>召喚強度 ${cs.summonPower}｜掉寶倍率 ${cs.lootRate}%｜稀有事件基準 ${cs.rareEventRate}%</div>
   <h3>天賦</h3>${characterTalents().map(t=>`<div class="itemrow"><span><b>${t.name}</b> <span class="tier">${t.tier}</span>［${t.category}］<br><span class="small">${t.description}</span></span></div>`).join("")}
 </div>`)
}
function forgetSkill(i){if(G.character.skills.length<=2){alert("至少保留2個技能。");return}if(confirm(`確定遺忘${G.character.skills[i].name}？`)){G.character.skills.splice(i,1);persist();openCharacter()}}
function openEquipment(){
 let b=Object.entries(G.character.equipment).map(([slot,eq])=>{
   if(!eq)return `<div class="itemrow"><span>${slot}</span><b>—</b></div>`;
   const d=item(eq.id);return `<div class="itemrow"><span><b>${slot}</b>：${d.name} <span class="tier">${d.tier}</span><br><span class="small">${itemStatsText(d)}｜耐久${eq.durability}/${eq.maxDurability}</span></span><button onclick="unequip('${slot}')">卸下</button></div>`
 }).join("");
 const off=offhandEquip(),od=off&&item(off.id);
 b+=`<div class="itemrow"><span><b>副手</b>：${od?`${od.name} <span class="tier">${od.tier}</span><br><span class="small">${itemStatsText(od)}｜耐久${off.durability}/${off.maxDurability}</span>`:"—"}</span>${off?`<button onclick="unequipOffhand()">卸下</button>`:""}</div>`;
 showModal("裝備",b+`<div class="card small">固定頂層裝備欄仍為8格；副手可裝備盾牌或任一單手武器，主手與副手可同時裝備單手武器。雙手武器與任何副手裝備互斥。</div>`)
}
function unequip(slot){const eq=G.character.equipment[slot];if(!eq)return;addItem(eq.id,1,{durability:eq.durability});G.character.equipment[slot]=null;persist();renderAll();openEquipment()}
function slotForItem(d){if(d.type==="飾品")return G.character.equipment.飾品1?"飾品2":"飾品1";return d.type}
function canEquipItem(d){
 if(!d)return {ok:false,reason:"裝備資料不存在"};
 if(d.required_level&&G.character.level<d.required_level)return {ok:false,reason:`需要角色Lv${d.required_level}以上（目前Lv${G.character.level}）`};
 for(const [stat,need] of Object.entries(d.required_stats||{})){
   if(effectiveStat(stat)<need)return {ok:false,reason:`需要${stat==="體力"?"體質":stat} ${need}以上（目前${effectiveStat(stat)}）`}
 }
 if(["B","A","S"].includes(d.tier)&&d.sealed)return {ok:false,reason:`${d.tier}級裝備仍處於封印狀態，需完成對應資格／解封條件`};
 return {ok:true,reason:""}
}
function equipOffhandFromInventory(index){
 const x=G.character.inventory[index],d=x&&item(x.id);if(!d)return;
 const gate=canEquipOffhandItem(d);if(!gate.ok){alert(`無法裝備副手：${gate.reason}`);return}
 if(!G.character.weaponSet)G.character.weaponSet={offhand:null};
 if(G.character.weaponSet.offhand){const old=G.character.weaponSet.offhand;addItem(old.id,1,{durability:old.durability})}
 G.character.weaponSet.offhand=makeEquip(x.id,x.durability??d.durability);
 removeItem(x.id,1,index);persist();renderAll();openInventory()
}
function equipFromInventory(index){
 const x=G.character.inventory[index],d=x&&item(x.id);if(!d)return;
 const gate=canEquipItem(d);if(!gate.ok){alert(`無法裝備：${gate.reason}`);return}
 if(isShieldItem(d)){equipOffhandFromInventory(index);return}
 const slot=slotForItem(d);if(!DB.hard_rules.equipment_slots.includes(slot))return;
 if(slot==="主武器"&&(d.weapon_profile?.hands||1)>=2&&offhandEquip())unequipOffhand(true);
 if(G.character.equipment[slot]){const old=G.character.equipment[slot];addItem(old.id,1,{durability:old.durability})}
 G.character.equipment[slot]=makeEquip(x.id,x.durability??d.durability);removeItem(x.id,1,index);persist();renderAll();openInventory()
}
function inventoryCategory(d){
 if(!d)return {key:"其他",order:99};
 if(d.inventory_group==="食物")return {key:"食物",order:30};
 if(d.inventory_group==="食材")return {key:"食材",order:35};
 if(d.catalog_group==="武器"||d.catalog_group==="防具"||d.catalog_group==="飾品"||["主武器","頭盔","盔甲","手套","鞋子","披風","飾品"].includes(d.type))return {key:"裝備",order:10};
 if(d.type==="藥劑"||d.consumable_group||d.battle_effect||d.weapon_oil)return {key:"藥劑／消耗品",order:20};
 if(d.type==="料理"||d.type==="食物")return {key:"食物",order:30};
 if(d.type==="食材")return {key:"食材",order:35};
 if(d.type==="補給")return {key:"補給",order:38};
 if(d.type==="工具"||d.tool_effect)return {key:"工具",order:40};
 if(["素材","草藥素材","工藝素材","礦石","魔物素材","寶石素材"].includes(d.type)||d.material_group||d.monster_drop_core)return {key:"素材",order:50};
 if(["書籍","卷軸","符文"].includes(d.type)||d.knowledge_tag)return {key:"書籍／卷軸／符文",order:60};
 if(["任務","寶藏","鑰匙"].includes(d.type))return {key:"任務／寶物",order:70};
 return {key:"其他",order:90}
}
function inventorySortCompare(a,b){
 const da=item(a.id),db=item(b.id),ca=inventoryCategory(da),cb=inventoryCategory(db);
 return ca.order-cb.order || tierOrder(db?.tier||"F")-tierOrder(da?.tier||"F") || String(da?.name||a.id).localeCompare(String(db?.name||b.id),"zh-Hant") || (a.durability??999)-(b.durability??999)
}
function inventorySummary(){
 const inv=G.character.inventory||[],groups=new Map();let qty=0;
 for(const x of inv){const c=inventoryCategory(item(x.id)),n=x.qty||1,cur=groups.get(c.key)||{order:c.order,qty:0};cur.qty+=n;groups.set(c.key,cur);qty+=n}
 const weight=calcWeight(),cap=combatStats().carryCapacity,pct=cap?Math.round(weight/cap*100):0;
 return {groups:[...groups.entries()].sort((a,b)=>a[1].order-b[1].order),stacks:inv.length,qty,weight,cap,pct}
}
function jumpInventoryCategory(name){
 const body=document.querySelector("#modalBody");if(!body)return;
 const target=[...body.querySelectorAll(".inventory-category-title")].find(el=>el.dataset.inventoryCat===String(name));
 if(!target)return;
 try{target.scrollIntoView({block:"start",behavior:"smooth"})}catch(e){target.scrollIntoView(true)}
}
function organizeInventory(){
 const inv=G.character.inventory;
 inv.sort(inventorySortCompare);
 persist();openInventory()
}
function openInventory(){
 const list=G.character.inventory,summary=inventorySummary();let lastCat="";
 const view=list.map((x,i)=>({x,i})).sort((a,b)=>inventorySortCompare(a.x,b.x));
 const rows=view.map(({x,i})=>{
   const d=item(x.id),cat=inventoryCategory(d),isEq=d&&["主武器","頭盔","盔甲","手套","鞋子","披風","飾品"].includes(d.type),usable=!!d.use||!!d.buff||!!d.utility_effect||!!d.battle_effect||d.type==="料理";
   const head=cat.key!==lastCat?(lastCat=cat.key,`<div class="inventory-category-title" data-inventory-cat="${cat.key}">${cat.key}</div>`):"";
   let equipButtons="";
   if(isEq){
     const g=canEquipItem(d);
     if(isShieldItem(d)){
       const og=canEquipOffhandItem(d);equipButtons=`<button ${og.ok?"":"disabled"} onclick="equipOffhandFromInventory(${i})">${og.ok?"裝備副手":"副手不可用"}</button>`
     }else if(isOneHandedWeapon(d)){
       const og=canEquipOffhandItem(d);equipButtons=`<button ${g.ok?"":"disabled"} onclick="equipFromInventory(${i})">${g.ok?"裝備主手":"未達條件"}</button><button ${og.ok?"":"disabled"} onclick="equipOffhandFromInventory(${i})">${og.ok?"裝備副手":"副手不可用"}</button>`
     }else if(d.type==="主武器"){
       equipButtons=`<button ${g.ok?"":"disabled"} onclick="equipFromInventory(${i})">${g.ok?"裝備":"未達條件"}</button>`
     }else equipButtons=`<button ${g.ok?"":"disabled"} onclick="equipFromInventory(${i})">${g.ok?"裝備":"未達條件"}</button>`
   }
   const actions=[equipButtons,usable?`<button onclick="useItem(${i})">使用</button>`:"",`<button class="bad" onclick="dropItem(${i})">丟棄</button>`].filter(Boolean).join("");
   const actionCount=(actions.match(/<button/g)||[]).length;
   return `${head}<div class="inventory-item">
     <div class="inventory-item-head">${d.name} <span class="tier">${d.tier}</span> ×${x.qty||1}</div>
     <div class="inventory-item-meta">${itemStatsText(d)}${x.durability!=null?`｜耐久${x.durability}/${x.maxDurability}`:""}</div>
     <div class="inventory-item-actions ${actionCount===1?"one":""}">${actions}</div>
   </div>`
 }).join("")||"<div class='small'>背包為空。</div>";
 const chips=summary.groups.map(([name,v])=>`<button type="button" class="inventory-chip" onclick="jumpInventoryCategory('${name}')" aria-label="跳到${name}分類">${name} ${v.qty}</button>`).join("");
 const loadClass=summary.pct>=100?"danger":summary.pct>=85?"warnText":"ok";
 showModal("背包",`<div class="inventory-summary"><div class="inventory-summary-top"><span>物品 ${summary.qty} 件｜堆疊 ${summary.stacks}</span><span class="${loadClass}">負重 ${summary.weight}/${summary.cap}kg（${summary.pct}%）</span></div><div class="inventory-chiprow">${chips}</div></div><div class="inventory-sortbar"><button class="good" onclick="organizeInventory()">一鍵整理</button><span class="small">目前已依分類顯示；整理會固定此排序。</span></div>${rows}`,"openInventory()")
}
function removeStatuses(list){
 if(!list?.length)return;
 G.character.statusEffects=(G.character.statusEffects||[]).filter(s=>!list.includes(s.id||s))
}
function applyConsumable(d){
 const c=G.character;
 if(d.toxicity){
   if((c.toxicity||0)+d.toxicity>100)return {ok:false,msg:`毒性將超過100（目前${Math.round(c.toxicity||0)}）`};
   c.toxicity=clamp((c.toxicity||0)+d.toxicity,0,100)
 }
 if(d.use){
   if(d.use.hunger)c.hunger=clamp(c.hunger+d.use.hunger,0,120);
   if(d.use.thirst)c.thirst=clamp(c.thirst+d.use.thirst,0,120);
   if(d.use.hp)c.hp=clamp(c.hp+combatScalar(d.use.hp)*(combatStats().healingPower/100),0,c.maxHp);
   if(d.use.hp_percent)c.hp=clamp(c.maxHp*d.use.hp_percent/100,0,c.maxHp);
   if(d.use.stamina)c.stamina=clamp(c.stamina+combatScalar(d.use.stamina),0,c.maxStamina);
   if(d.use.mana)c.mana=clamp(c.mana+combatScalar(d.use.mana),0,c.maxMana);
   if(d.use.mana_percent)c.mana=clamp(c.maxMana*d.use.mana_percent/100,0,c.maxMana);
   if(d.use.conditions)removeStatuses(d.use.conditions)
 }
 if(d.buff)c.buffs.push({...d.buff,hours:d.buff.hours||2,name:d.name});
 return {ok:true,msg:""}
}
function useItem(i){
 const x=G.character.inventory[i],d=item(x?.id);if(!d)return;
 if(d.use_context==="battle"){alert("此道具只能在戰鬥介面使用。");return}
 if(d.utility_effect==="open_map"){closeModal();openMap();return}
 if(d.utility_effect==="return_town"){
   const rescue=nearestChurchTown(G.character.locationId),town=loc(rescue.id);
   if(!beginTurn("使用傳送卷軸"))return;
   G.character.locationId=rescue.id;G.character.currentFacility=null;removeItem(x.id,1,i);
   log("道具",`使用${d.name}返回${town.name}。`,"ok");endTurn(.1);return
 }
 if(d.utility_effect==="skill_xp_scroll"){openSkillXpScroll(i);return}
 if(d.utility_effect==="inspect_inventory"){
   removeItem(x.id,1,i);persist();alert("目前版本沒有未鑑定裝備；卷軸確認背包中沒有需要鑑定的物品。");openInventory();return
 }
 const r=applyConsumable(d);if(!r.ok){alert(r.msg);return}
 if(d.type==="料理"&&d.combat)G.character.buffs.push({...d.combat,hours:d.duration||2,name:d.name});
 removeItem(x.id,1,i);applySurvival();persist();renderAll();openInventory()
}
function dropItem(i){const x=G.character.inventory[i];if(x&&confirm(`丟棄${item(x.id).name}？`)){removeItem(x.id,1,i);persist();openInventory()}}
function realmRegionMap(id){return (DB.realm_region_maps||[]).find(x=>x.id===id)||null}
function provinceRegion(id){return (DB.province_region_maps||[]).find(x=>x.id===id)||null}
function settlementRegionMap(id){return (DB.settlement_region_maps||[]).find(x=>x.id===id)||null}
function settlementTierProfile(v){
 const tier=typeof v==="string"&&v.length===1?v:(typeof v==="string"?loc(v)?.settlement_world_tier:v?.settlement_world_tier)||"F";
 return (DB.settlement_world_tier_system?.tiers||[]).find(x=>x.tier===tier)||null
}
function rootPolityIdForLocation(id=G.character.locationId){
 let p=politicalEntity(loc(id)?.political_entity_id);const seen=new Set();
 while(p?.vassal_of&&!seen.has(p.id)){seen.add(p.id);p=politicalEntity(p.vassal_of)}
 return p?.id||null
}
function mapHierarchyForLocation(id=G.character.locationId){
 const l=loc(id);if(!l)return {location:null,settlement:null,province:null,realm:null,world:DB.world_map||null};
 const settlement=settlementRegionMap(l.settlement_region_id);
 const province=provinceRegion(l.province_region_id||settlement?.parent_province_region_id||worldRegion(l.world_region_id)?.province_region_id);
 const realm=realmRegionMap(l.realm_region_map_id||province?.parent_realm_map_id||`RMAP-${rootPolityIdForLocation(id)}`);
 return {location:l,settlement,province,realm,world:DB.world_map||null}
}
function provinceRegionForLocation(id=G.character.locationId){return mapHierarchyForLocation(id).province}
function mapKindLabel(k){return ({town:"聚落",wild:"野外",dungeon:"地下城"})[k]||k}
function canDirectTravelTo(id){const l=loc(G.character.locationId);return !!l&&(l.links||[]).some(x=>x.to===id)}
function directTravelHours(id){return (loc(G.character.locationId)?.links||[]).find(x=>x.to===id)?.hours??null}
function mapBreadcrumb(ctx){
 const a=[];a.push(`<button onclick="openWorldMapHierarchy()">世界</button>`);
 if(ctx?.realm)a.push(`<button onclick="openRealmRegionMap('${ctx.realm.id}')">${politicalEntity(ctx.realm.political_entity_id)?.name||"政體"}</button>`);
 if(ctx?.province)a.push(`<button onclick="openProvinceRegionMap('${ctx.province.id}')">${ctx.province.name}</button>`);
 return `<div class="actions mapCrumbs">${a.join("")}</div>`
}
function openWorldMapHierarchy(){
 const rows=(DB.realm_region_maps||[]).map(r=>{
   const p=politicalEntity(r.political_entity_id),subs=(r.province_region_ids||[]).length;
   return `<div class="itemrow"><span><b>${p?.name||r.name}</b> <span class="tier">${r.world_tier||p?.world_tier||"—"}</span><br><span class="small">${p?.government_type||""}｜首府：${p?.capital||"未固定"}｜行省級區域 ${subs}${(r.vassal_polity_ids||[]).length?`｜封臣 ${r.vassal_polity_ids.length}`:""}</span></span><button onclick="openRealmRegionMap('${r.id}')">查看</button></div>`
 }).join("");
 const powerRows=(DB.world_map?.regional_power_region_ids||[]).map(rid=>{const r=worldRegion(rid),ps=regionalPowersForRegion(rid);return `<div class="itemrow"><span><b>${r?.name||rid}</b> <span class="tier">${r?.recommended_tier||"—"}</span><br><span class="small">非主權大區｜主要勢力：${ps.map(x=>x.name).join("、")||"無"}</span></span><button onclick="openLoreScope('region','${rid}','${r?.name||"地區"}・地方誌')">查看</button></div>`}).join("");
 showModal("世界地圖",`<div class="card small">主要查看層級：世界地圖 ＞ 王國／政體區域 ＞ 行省級區域。行省內再分城鎮、野外、地下城三類；區域勢力不會被誤列為王國／政體地圖。</div>${rows}${powerRows?`<h3>非主權區域</h3>${powerRows}`:""}`)
}
function openRealmRegionMap(id){
 const r=realmRegionMap(id);if(!r)return;const p=politicalEntity(r.political_entity_id);
 const provinces=(r.province_region_ids||[]).map(provinceRegion).filter(Boolean);
 const rows=provinces.map(x=>`<div class="itemrow"><span><b>${x.name}</b> <span class="tier">${x.world_tier}</span><br><span class="small">${x.administrative_type}｜${x.map_status==="playable_current"?"CURRENT可玩":"背景資料"}｜首府：${loc(x.capital_location_id)?.name||p?.capital||"—"}</span></span><button onclick="openProvinceRegionMap('${x.id}')">查看</button></div>`).join("")||`<div class="card small">此政治體目前只建立王國／政體區域層級，尚未展開行省級可玩地圖；既有政治與世界誌資料仍有效。</div>`;
 showModal(`${p?.name||r.name}・${String(p?.government_type||"").includes("王國")?"王國區域地圖":"政體區域地圖"}`,`${mapBreadcrumb({realm:r})}<div class="card"><b>${p?.name||r.name}</b> <span class="tier">${r.world_tier||p?.world_tier||"—"}</span><br><span class="small">${p?.government_type||""}｜首府：${p?.capital||"未固定"}｜${p?.identity||""}</span><div class="actions">${p?`<button onclick="openPolity('${p.id}')">政治體</button>`:""}</div></div>${rows}`)
}

function worldTierRank(t){return ({F:0,E:1,D:2,C:3,B:4,A:5,S:6})[t]??-1}
function provinceCategoryLocations(p,kind,reachableOnly=true){
 if(!p)return [];
 let ids=[];
 if(kind==="town")ids=p.all_settlement_ids||[p.capital_location_id,...(p.peer_city_ids||[]),...(p.subordinate_settlement_ids||[])].filter(Boolean);
 else if(kind==="wild")ids=p.wild_location_ids||[];
 else ids=p.dungeon_location_ids||[];
 let rows=[...new Set(ids)].map(loc).filter(Boolean);
 if(reachableOnly)rows=rows.filter(l=>l.id===G.character.locationId||canDirectTravelTo(l.id));
 rows.sort((a,b)=>worldTierRank((b.kind==="town"?b.settlement_world_tier:b.tier)||"F")-worldTierRank((a.kind==="town"?a.settlement_world_tier:a.tier)||"F")||a.name.localeCompare(b.name,"zh-Hant"));
 return rows
}
function provinceCategoryLabel(kind){return kind==="town"?"城鎮":kind==="wild"?"野外":"地下城"}
function openProvinceCategoryMap(pid,kind){
 const p=provinceRegion(pid);if(!p)return;const realm=realmRegionMap(p.parent_realm_map_id),rows=provinceCategoryLocations(p,kind,true);
 const body=rows.map(l=>{
   const tier=l.kind==="town"?(l.settlement_world_tier||l.tier):l.tier,here=l.id===G.character.locationId,hours=here?0:directTravelHours(l.id);
   return `<div class="itemrow"><span><b>${l.name}</b> <span class="tier">${tier}</span><br><span class="small">${l.size||provinceCategoryLabel(kind)}｜安全度 ${locationSafety(l)}/100（${safetyLabel(l)}）</span></span>${here?`<span class="tier">目前</span>`:hours!==null?`<button onclick="travel('${l.id}',${hours})">前往 ${hours}小時</button>`:""}</div>`
 }).join("");
 showModal(`${p.name}・${provinceCategoryLabel(kind)}`,`${mapBreadcrumb({realm,province:p})}<div class="card small">只顯示目前位置與可直接前往的${provinceCategoryLabel(kind)}；不可前往區域已隱藏。依世界層級由高至低排列。</div>${body||"<div class='card small'>目前沒有可直接前往的區域。</div>"}`)
}
function openProvinceRegionMap(id){
 const p=provinceRegion(id);if(!p)return;const realm=realmRegionMap(p.parent_realm_map_id),ctx={realm,province:p};
 const kinds=["town","wild","dungeon"];
 const cards=kinds.map(kind=>{
   const all=provinceCategoryLocations(p,kind,false),reachable=provinceCategoryLocations(p,kind,true);
   return `<div class="itemrow"><span><b>${provinceCategoryLabel(kind)}</b><br><span class="small">已建置 ${all.length}｜目前可前往 ${reachable.filter(x=>x.id!==G.character.locationId).length}${reachable.some(x=>x.id===G.character.locationId)?"｜含目前位置":""}</span></span><button onclick="openProvinceCategoryMap('${p.id}','${kind}')">查看</button></div>`
 }).join("");
 showModal(`${p.name}・行省級區域`,`${mapBreadcrumb(ctx)}<div class="card"><b>${p.display_name||p.name}</b> <span class="tier">${p.world_tier}</span><br><span class="small">${p.administrative_type}<br>${p.identity||""}</span>${(p.lore_record_ids||[]).length?`<div class="actions"><button onclick="openLoreScope('province_region','${p.id}','${p.name}・地方史')">地方史</button></div>`:""}</div><div class="card small">省級地圖簡化為「城鎮／野外／地下城」三類。移動清單只顯示可以前往的區域；不可前往區域不顯示。</div>${cards}`)
}
function openProvinceTerrainMap(pid,kind){return openProvinceCategoryMap(pid,kind)}
function openSettlementRegionMap(id){
 const sm=settlementRegionMap(id);if(!sm)return;const p=provinceRegion(sm.parent_province_region_id);
 if(p)return openProvinceRegionMap(p.id);
 return openWorldMapHierarchy()
}
function openMapLocationDetail(id){
 const l=loc(id);if(!l)return;const ctx=mapHierarchyForLocation(id),ix=locationIntegration(l.id),pc=politicalContextForLocation(l.id);
 const currentLocation=loc(G.character.locationId),arrivalRoute=(currentLocation?.links||[]).find(route=>route.to===l.id),arrivalAction=arrivalRoute?`<div class="actions"><button class="good" onclick="travel('${l.id}',${Number(arrivalRoute.hours)||1})">前往此地</button></div>`:"";const links=(l.links||[]).map(x=>{const d=loc(x.to);return `<div class="itemrow"><span>${d?.name||x.to} <span class="tier">${d?.kind==="town"?(d?.settlement_world_tier||d?.tier):d?.tier||"—"}</span><br><span class="small">${x.hours}小時</span></span>${l.id===G.character.locationId?`<button onclick="travel('${x.to}',${x.hours})">前往</button>`:""}</div>`}).join("");
 showModal(l.name,`${mapBreadcrumb(ctx)}${arrivalAction}<div class="card"><b>${l.name}</b> <span class="tier">${l.kind==="town"?(l.settlement_world_tier||l.tier):l.tier}</span>｜${l.size||mapKindLabel(l.kind)}<br><span class="small">${mapKindLabel(l.kind)}｜安全度 ${locationSafety(l)}/100（${safetyLabel(l)}）${l.kind==="town"?`<br>城市世界層級：${l.settlement_world_tier||l.tier}｜${settlementTierProfile(l)?.label||""}`:""}<br>政治：${pc.polity?.name||"未確認"}｜行省級：${ctx.province?.name||"未建立"}｜城鎮區域：${ctx.settlement?.name||"未建立"}<br>整合資料：素材${ix.gather_item_ids.length+ix.fish_item_ids.length}｜組織${ix.organization_ids.length}｜神系${ix.pantheon_ids.length}</span><div class="actions"><button onclick="openLocationLore('${l.id}')">地方誌</button>${ctx.settlement?`<button onclick="openSettlementRegionMap('${ctx.settlement.id}')">城鎮區域</button>`:""}</div></div><div class="card"><b>道路連結</b></div>${links||"<div class='small'>沒有已建檔道路。</div>"}`)
}
function openMap(){
 const ctx=mapHierarchyForLocation();
 if(ctx.province)return openProvinceRegionMap(ctx.province.id);
 if(ctx.realm)return openRealmRegionMap(ctx.realm.id);
 return openWorldMapHierarchy()
}
function travel(id,h){
 const from=loc(G.character.locationId);if(!from.links.some(x=>x.to===id))return;
 closeModal();if(!beginTurn("旅行"))return;
 const to=loc(id),routeRisk=["wild","dungeon"].includes(from.kind)||["wild","dungeon"].includes(to.kind);
 G.character.locationId=id;G.character.currentFacility=null;discoverScopeLore("location",id,"旅行");if(to.world_region_id)discoverScopeLore("region",to.world_region_id,"旅行");if(to.political_entity_id)discoverScopeLore("polity",to.political_entity_id,"旅行");
 log("旅行",`抵達${to.name}［${to.tier}］；安全度${locationSafety(to)}/100（${safetyLabel(to)}）。`,"ok");
 let battled=false;
 if(routeRisk)battled=maybeEncounter("旅行");
 let evented=false;if(!battled&&["wild","dungeon"].includes(to.kind))evented=maybeAdventureEvent("旅行");
 let socialed=false;if(!battled&&!evented&&["wild","dungeon"].includes(to.kind))socialed=maybePartySocialEvent("旅行");
 if(!battled&&!evented&&!socialed&&["wild","dungeon"].includes(to.kind))maybeOrganizationEncounter("旅行");
 endTurn(h)
}
function showAdventure(){setNavActive("adventure");closeModal();if(!G?.battle?.active){$("#battleBack")?.classList.add("hide");document.body.classList.remove("battle-open");closeBattleSkillPopup()}syncBodyScrollLock();window.scrollTo({top:0,behavior:"smooth"});renderHistoryLog();setTimeout(()=>{ensureActionsVisible();syncBodyScrollLock()},0)}


function currentSaveEntry(){
 return G?.meta?.saveIndex?.at(-1)||null
}
function saveInfoHtml(){
 const s=currentSaveEntry();
 if(!G)return `<div class="card"><b>目前存檔</b><br><span class="small">尚未開始遊戲。</span></div>`;
 return `<div class="card"><b>目前存檔</b><br>${s?`${s.id}<br><span class="small">${s.time||timeText()}｜T${s.turn??G.turn}｜${s.type||"AUTO"}${s.reason?`｜${s.reason}`:""}</span>`:`<span class="small">尚無存檔紀錄</span>`}<br><span class="small">存檔筆數：${G.meta.saveIndex.length}/180</span></div>`
}
function openSettings(){showModal("設定",`${saveInfoHtml()}<h3>世界與權柄</h3><div class="actions"><button onclick="openWorldLore()">世界誌 ${knownLore().length}/${DB.lore_system.record_count}</button><button onclick="openPoliticalAuthorityCatalog()">權柄20原型</button></div><hr><div class="actions"><button onclick="manualSave()">手動存檔</button><button onclick="checkForGameUpdate(true)">檢查遊戲更新</button><button onclick="exportSave()">匯出存檔</button><button class="bad" onclick="resetGame()">重開新檔</button></div><hr><h3>世界資料庫</h3><div class="rulebox">版本：${DB.meta.current_version}<br>職業：${DB.combat_classes.length}<br>戰士／騎士系：${DB.profession_tree.categories["戰士／騎士系"].length}<br>遊俠／盜賊／吟遊系：${DB.profession_tree.categories["遊俠／盜賊／吟遊系"].length}<br>法師／術士系：${DB.profession_tree.categories["法師／術士系"].length}<br>神職／自然系：${DB.profession_tree.categories["神職／自然系"].length}<br>混合／上位／傳說系：${DB.profession_tree.categories["混合／上位／傳說系"].length}<br>技能定義：${Object.values(DB.skill_pools).reduce((s,a)=>s+a.length,0)}<br>技能進階家族：${DB.skill_families.length}<br>裝備：${DB.items.filter(x=>["主武器","盔甲","頭盔","手套","鞋子","披風","飾品"].includes(x.type)).length}<br>武器核心：${DB.equipment_system.catalog_counts["武器"]}<br>防具核心：${DB.equipment_system.catalog_counts["防具"]}<br>飾品核心：${DB.equipment_system.catalog_counts["飾品"]}<br>藥劑／戰鬥消耗品核心：${DB.items.filter(x=>x.type==="藥劑").length}<br>技能紀錄：${DB.skill_design_system.skill_records}<br>技能家族：${DB.skill_design_system.family_count}<br>戰鬥職業：${DB.class_design_system.count}<br>裝備核心：${DB.item_material_design_system.equipment_core_count}<br>藥劑：${DB.item_material_design_system.potion_count}<br>退出新生成的舊怪物素材：${DB.item_material_design_system.legacy_monster_materials_retired_from_generation}<br>公會跨職規則：${DB.guild_training.cross_track_rule}<br>同時委託上限：${DB.quest_system.max_active}<br>生成器：${DB.generators.length}（共同邏輯管線）<br>管理AI：${DB.management_ai.length}（輸入／驗證／回退規則）<br>網站模式：${location.protocol==="https:"?"公開HTTPS":"本機／預覽"}｜網域：${location.host||"local"}<br>戰鬥數值核心：${DB.combat_stat_system.count}項<br>CON/SP分離：啟用｜先攻/破甲/韌性/狀態命中：啟用<br>角色成長：Lv1–${DB.progression_system.max_level}｜職業熟練／轉職啟用<br>製作閉環：${DB.items.filter(x=>x.craft_recipe).length}筆配方資料｜鍛造／裁縫／藥劑介面啟用<br>武器組：8頂層欄＋內部副手（單手武器／盾牌）｜狀態系統：${Object.keys(DB.status_system.definitions).length}種<br>天賦核心：${DB.talent_system.core_count}<br>角色天賦上限：${DB.talent_system.character_limit}<br>體質／生存：${DB.talent_system.category_counts["體質與生存"]}<br>戰鬥專精：${DB.talent_system.category_counts["戰鬥專精"]}<br>魔法／血脈：${DB.talent_system.category_counts["魔法與血脈"]}<br>技巧／生活／命運：${DB.talent_system.category_counts["技巧生活與命運"]}<br>核心種族：${DB.race_system.core_count}<br>常見種族：${DB.race_system.groups["常見種族"].length}<br>精靈分支：${DB.race_system.groups["精靈族"].length}<br>混血種族：${DB.race_system.groups["混血種族"].length}<br>特殊種族：${DB.race_system.groups["特殊種族"].length}<br>角色出身核心：${DB.origin_system.core_count}<br>平民與鄉野：${DB.origin_system.category_counts["平民與鄉野"]}<br>貴族與騎士：${DB.origin_system.category_counts["貴族與騎士"]}<br>軍事與傭兵：${DB.origin_system.category_counts["軍事與傭兵"]}<br>信仰與魔法：${DB.origin_system.category_counts["信仰與魔法"]}<br>詛咒與命運：${DB.origin_system.category_counts["詛咒與命運"]}<br>怪物圖鑑核心：${DB.monster_catalog.core_count}<br>野獸動物：${DB.monster_catalog.category_counts["野獸動物系"]}<br>哥布林／獸人／巨人：${DB.monster_catalog.category_counts["哥布林獸人巨人系"]}<br>龍／亞龍／爬蟲：${DB.monster_catalog.category_counts["龍與亞龍爬蟲系"]}<br>不死：${DB.monster_catalog.category_counts["不死系"]}<br>惡魔／深淵：${DB.monster_catalog.category_counts["惡魔與深淵地獄系"]}<br>元素／植物／魔法生物：${DB.monster_catalog.category_counts["元素植物魔法生物系"]}<br>蟲／水生／軟泥：${DB.monster_catalog.category_counts["蟲水生軟泥系"]}<br>怪物掉落核心：${DB.monster_drop_system.core_count}<br>軟泥／魔像：${DB.monster_drop_system.category_counts["軟泥與魔像系"]}<br>哥布林／獸人／巨人：${DB.monster_drop_system.category_counts["哥布林獸人巨人系"]}<br>野獸：${DB.monster_drop_system.category_counts["野獸系"]}<br>龍與爬蟲：${DB.monster_drop_system.category_counts["龍與爬蟲系"]}<br>不死：${DB.monster_drop_system.category_counts["不死系"]}<br>惡魔／深淵：${DB.monster_drop_system.category_counts["惡魔與深淵系"]}<br>元素／植物／魔法生物：${DB.monster_drop_system.category_counts["元素植物魔法生物系"]}<br>蟲與水生：${DB.monster_drop_system.category_counts["蟲與水生系"]}<br>素材／通用道具核心：${DB.material_system.core_count}<br>草藥植物：${DB.material_system.category_counts["草藥與植物素材"]}<br>礦石金屬：${DB.material_system.category_counts["礦石與金屬素材"]}<br>怪物素材：${DB.material_system.category_counts["怪物素材"]}<br>食材食物：${DB.material_system.category_counts["食材與食物"]}<br>木材布料皮革：${DB.material_system.category_counts["木材布料皮革"]}<br>寶石結晶：${DB.material_system.category_counts["寶石與魔法結晶"]}<br>卷軸符文書籍：${DB.material_system.category_counts["卷軸符文書籍"]}<br>鑰匙工具寶藏：${DB.material_system.category_counts["鑰匙工具寶藏任務"]}<br>生命回復：${DB.consumable_system.category_counts["生命回復"]}<br>魔力與精力：${DB.consumable_system.category_counts["魔力與精力"]}<br>屬性強化：${DB.consumable_system.category_counts["屬性強化"]}<br>抗性防禦：${DB.consumable_system.category_counts["抗性防禦"]}<br>解除淨化：${DB.consumable_system.category_counts["解除淨化"]}<br>攻擊投擲／塗油：${DB.consumable_system.category_counts["攻擊投擲／塗油"]}<br>特殊煎藥／傳奇：${DB.consumable_system.category_counts["特殊煎藥／傳奇"]}<br>料理：${DB.items.filter(x=>x.type==="料理").length}<br>料理配方：${DB.recipes.length}<br>敵人：${DB.monsters.length}<br>敵方專用素材：${DB.items.filter(x=>x.type==="魔物素材").length}<br>野外地圖：${DB.locations.filter(x=>x.kind==="wild").length}<br>地下城：${DB.locations.filter(x=>x.kind==="dungeon").length}<br>城鎮：${DB.locations.filter(x=>x.kind==="town").length}<br>副職業：${DB.subjobs.length}</div><h3>核心規則</h3><div class="rulebox">設施對話與情報遵守知識來源限制。<br>副職業只能在指定設施且符合能力前置與學費後學習。<br>裝備耐久影響戰鬥加成，鐵匠鋪可修復。<br>戰鬥數值集中於角色卡；包含攻擊、魔法威力、防禦、魔防、命中、閃避、爆擊、爆傷、攻速、施法速度、格擋與狀態抗性。<br>遭遇戰鬥改為彈出式回合制介面，可選一般攻擊、技能、防禦、使用道具與逃跑。<br>B級以上內容仍受前置資格與封印規則限制。<br>掉落規則：只有人型敵人可能掉落金錢與裝備；非人型敵人只能掉落素材。<br>戰鬥職業池為100種。<br>核心裝備200件、藥劑200種、通用素材200種；本版新增200種怪物掉落核心，並建立200裝備升級連結與200藥劑鍊金連結。<br>技能命名採傳統RPG結構：動詞＋名詞／元素＋效果；東方系採原創自然意象＋動作。<br>命名AI：以用途可讀性、區域詞根、怪物家族與世界層級生成名稱，並避開專有作品名稱與過度現實訓練術語。</div>`)}
function manualSave(){const id=`MANUAL-${G.meta.characterId.slice(-6)}-T${String(G.turn).padStart(5,"0")}`;G.meta.saveIndex.push({id,turn:G.turn,time:timeText(),type:"MANUAL"});persist();renderAll();log("存檔",`已建立${id}`,"save")}
function exportSave(){const b=new Blob([JSON.stringify(G,null,2)],{type:"application/json;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`${G.character.name}_${G.meta.characterId}_save.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),400)}
function resetGame(){if(confirm("確定清除本機存檔？")){try{localStorage.removeItem("yijie_luren_save")}catch(e){}location.reload()}}
function runGeneratorAudit(){
 const issues=[];
 for(const l of DB.locations){
   if(typeof l.safety_score!=="number"||l.safety_score<0||l.safety_score>100)issues.push(`地圖安全度異常:${l.name}`);
   if(!l.safety_label)issues.push(`地圖安全標籤缺失:${l.name}`);
   if(!["wild","dungeon"].includes(l.kind))continue;
   for(const id of (l.gather||[])){const d=item(id);if(!d?.wild_gather_eligible)issues.push(`${l.name}採集池含非法來源:${d?.name||id}`);if(d&&tierOrder(d.tier)>tierOrder(l.tier))issues.push(`${l.name}採集超階:${d.name}`)}
   if(l.ecology_zone==="town_outskirts"){const bad=encounterCandidates(l).filter(m=>["元素植物魔法生物系","龍與亞龍爬蟲系","不死系","惡魔與深淵地獄系"].includes(m.category));if(bad.length)issues.push(`${l.name}近郊生態違規:${bad[0].name}`)}
 }
 for(const d of (DB.domestic_creatures||[]))if(d.encounter_enabled!==false)issues.push(`馴養生物誤入遭遇:${d.name}`);
 for(const q of DB.quest_templates)if(!questViableLocations(q).length)issues.push(`委託無目標來源:${q.name}`);
 for(const g of (DB.generators||[]))if(!g.inputs?.length||!g.constraints?.length||!g.fallback)issues.push(`生成器邏輯不完整:${g.name}`);
 for(const ai of (DB.management_ai||[]))if(!ai.inputs?.length||!ai.validations?.length||!ai.fallback)issues.push(`管理AI邏輯不完整:${ai.name}`);
 for(const c of DB.combat_classes)for(const p of (c.progression_from||[]))if(!cls(p))issues.push(`職業進階引用缺失:${c.name}->${p}`);
 for(const d of DB.items.filter(x=>x.craft_recipe))for(const x of craftRecipeMaterials(d))if(!item(x.id))issues.push(`配方引用缺失:${d.name}->${x.id}`);
 for(const s of Object.values(DB.skill_pools).flat())if(s.status&&!DB.status_system.definitions[s.status])issues.push(`技能狀態缺失:${s.name}->${s.status}`);
 for(const d of DB.items||[])for(const id of (d.use?.conditions||[]))if(!DB.status_system.definitions[id])issues.push(`物品狀態引用缺失:${d.name}->${id}`);
 if(DB.status_system?.version!=="STATUS-1.11")issues.push("STATUS-1.11缺失");
 if(DB.quality_audit_system?.version!=="QUALITY-AUDIT-1.0")issues.push("QUALITY-AUDIT-1.0缺失");
 if(DB.combat_number_scale?.multiplier!==2)issues.push("IJ-COMBAT-SCALE-2.0缺失或倍率錯誤");
 const artAudit=globalThis.YijieBattleArt?.audit?.();if(!artAudit?.pass)issues.push(`IJ-ART-CATALOG-2.0覆蓋缺失：職業${artAudit?.classes??"?"}／怪物${artAudit?.monsters??"?"}`);
 for(const e of (DB.adventure_event_templates||[])){
   if(tierOrder(e.tier)>tierOrder("E"))issues.push(`奇遇模板超出目前直接模板上限:${e.name}`);
   if(!e.kinds?.length||!e.stat||!Number.isFinite(e.dc))issues.push(`奇遇模板條件不完整:${e.name}`);
   const r=e.reward||{};
   for(const id of (r.item_pool||[])){
     const d=item(id);if(!d)issues.push(`奇遇獎勵引用缺失:${e.name}->${id}`);
     else if(["主武器","頭盔","盔甲","手套","鞋子","披風","飾品"].includes(d.type)||tierOrder(d.tier)>tierOrder("E"))issues.push(`奇遇獎勵超規:${e.name}->${d.name}`)
   }
   if(r.money&&r.money[1]>12)issues.push(`奇遇金錢上限過高:${e.name}`)
 }
 for(const sp of (DB.companion_species||[])){
   if(!["pet","summon","contract"].includes(sp.companion_kind))issues.push(`夥伴類型錯誤:${sp.name}`);
   if(!DB.companion_system.ai_profiles[sp.ai_profile])issues.push(`夥伴AI缺失:${sp.name}`);
   if(!sp.base_stats||!Number.isFinite(sp.base_stats.hp))issues.push(`夥伴戰鬥資料缺失:${sp.name}`);
 }
 if((DB.companion_species||[]).length!==200)issues.push(`夥伴物種數量異常:${(DB.companion_species||[]).length}`);
 if(G?.character?.companions?.length>DB.companion_system.roster_limit)issues.push(`角色夥伴超過上限`);
 if(G?.character?.activeCompanionId&&!G.character.companions.some(x=>x.uid===G.character.activeCompanionId))issues.push(`出戰夥伴引用無效`);
 for(const t of (DB.party_member_templates||[])){
   if(!DB.adventure_party_system.ai_profiles[t.role])issues.push(`隊友AI角色缺失:${t.name}`);
   if(!t.base_stats||!Number.isFinite(t.base_stats.hp))issues.push(`隊友戰鬥資料缺失:${t.name}`);
   if(tierOrder(t.tier)>tierOrder("C"))issues.push(`普通招募隊友超過C級:${t.name}`);
 }
 if((DB.party_member_templates||[]).length!==200)issues.push(`隊友模板數量異常:${(DB.party_member_templates||[]).length}`);
 if(G?.character?.adventureParty){
   const p=G.character.adventureParty;
   if((p.members||[]).length<1||(p.members||[]).length>4)issues.push(`冒險團人數異常:${1+(p.members||[]).length}`);
   if(p.leader!=="player"&&!p.members.some(x=>x.uid===p.leader))issues.push(`冒險團領隊引用無效`);
   for(const m of p.members)if(!partyTemplate(m.templateId))issues.push(`冒險團隊友引用缺失:${m.templateId}`)
 }
 if((DB.dialogue_database?.records||[]).length<200)issues.push(`對話資料量不足:${(DB.dialogue_database?.records||[]).length}`);
 if((DB.intel_database?.records||[]).length<200)issues.push(`情報資料量不足:${(DB.intel_database?.records||[]).length}`);
 for(const d of (DB.dialogue_database?.records||[])){
   if(!DB.facilities[d.facility])issues.push(`對話設施引用缺失:${d.id}`);
   if(tierOrder(d.tier_ceiling||"F")>tierOrder("C"))issues.push(`普通對話越權:${d.id}`)
 }
 for(const x of (DB.intel_database?.records||[])){
   if(!DB.facilities[x.facility])issues.push(`情報設施引用缺失:${x.id}`);
   if(!Number.isFinite(x.reliability)||x.reliability<0||x.reliability>100)issues.push(`情報可信度異常:${x.id}`);
   if(tierOrder(x.tier_ceiling||"F")>tierOrder("C"))issues.push(`普通情報越權:${x.id}`)
 }
 const mealSys=DB.meal_service_system;
 for(const fid of ["tavern","inn"])for(const p of ["breakfast","lunch","dinner"]){
   const arr=mealSys?.venues?.[fid]?.[p]||[];if(arr.length<3)issues.push(`餐點資料不足:${fid}/${p}`);
   if(arr.some(x=>!Number.isFinite(x.price)||x.price<=0))issues.push(`餐點價格異常:${fid}/${p}`)
 }
 if((DB.pantheons||[]).length!==9)issues.push(`神系數量異常:${(DB.pantheons||[]).length}`);
 if((DB.faith_entities||[]).length!==100)issues.push(`信仰實體數量異常:${(DB.faith_entities||[]).length}`);
 const faithIds=new Set((DB.faith_entities||[]).map(x=>x.id)),pantheonIds=new Set((DB.pantheons||[]).map(x=>x.id));
 for(const e of (DB.faith_entities||[])){
   if(!pantheonIds.has(e.pantheon_id))issues.push(`信仰神系引用缺失:${e.name}`);
   if(e.parent_id&&!faithIds.has(e.parent_id))issues.push(`信仰上級引用缺失:${e.name}`);
 }
 for(const r of (DB.faith_relations||[]))if(!pantheonIds.has(r.a)||!pantheonIds.has(r.b))issues.push(`神系關係引用缺失:${r.a}/${r.b}`);
 for(const [lid,p] of Object.entries(DB.local_faith_profiles||{})){
   if(!loc(lid))continue;
   for(const pid of (p.recognized||[]))if(!pantheonIds.has(pid))issues.push(`地方信仰引用缺失:${lid}/${pid}`)
 }
 if(G?.character?.faith){
   const f=G.character.faith;
   if(f.patronDeityId&&!deity(f.patronDeityId))issues.push(`角色主神引用無效`);
   if(f.oathId&&!(DB.faith_oaths||[]).some(x=>x.id===f.oathId))issues.push(`角色誓言引用無效`)
 }
 if((DB.world_organizations||[]).length!==100)issues.push(`世界組織數量異常:${(DB.world_organizations||[]).length}`);
 const orgIds=new Set((DB.world_organizations||[]).map(x=>x.id));
 const alignCount=(DB.world_organizations||[]).reduce((m,x)=>(m[x.alignment]=(m[x.alignment]||0)+1,m),{});
 if(alignCount.light!==10||alignCount.dark!==20||alignCount.neutral!==70)issues.push(`世界組織陣營分布異常:${JSON.stringify(alignCount)}`);
 for(const o of (DB.world_organizations||[])){
   if(!DB.facilities[o.primary_facility])issues.push(`組織設施引用缺失:${o.name}`);
   if(!o.joinable||!o.mission_issuer||!o.can_be_enemy)issues.push(`組織功能不完整:${o.name}`)
 }
 for(const r of (DB.organization_relations||[])){
   if(!orgIds.has(r.a)||!orgIds.has(r.b))issues.push(`組織關係引用缺失:${r.a}/${r.b}`);
   if(r.score<-100||r.score>100)issues.push(`組織關係值越界:${r.a}/${r.b}`)
 }
 if(G?.character?.organizations){
   for(const id of G.character.organizations.memberships||[])if(!orgIds.has(id))issues.push(`角色組織會籍引用無效:${id}`)
 }
 for(const [k,v] of Object.entries(G?.worldState?.orgRelations||{}))if(v.score<-100||v.score>100)issues.push(`動態組織關係越界:${k}`);
 if(!DB.integration_registry||DB.integration_registry.version!=="INTEGRATION-3.0")issues.push("INTEGRATION-3.0整合索引缺失");
 const ix=DB.content_link_index||{};
 if(Object.keys(ix.item_sources||{}).length!==DB.items.length)issues.push(`物品來源索引數量異常`);
 for(const [iid,s] of Object.entries(ix.item_sources||{})){
   if(!item(iid))issues.push(`物品來源索引指向無效物品:${iid}`);
   for(const lid of (s.gather_locations||[]))if(!loc(lid))issues.push(`物品來源地圖引用缺失:${iid}->${lid}`);
   for(const mid of (s.monster_drops||[]))if(!IDX.monster.has(mid))issues.push(`物品掉落魔物引用缺失:${iid}->${mid}`)
 }
 for(const [lid,x] of Object.entries(ix.location_content||{})){
   if(!loc(lid))issues.push(`地圖整合索引無效:${lid}`);
   for(const mid of (x.encounter_monster_ids||[]))if(!IDX.monster.has(mid))issues.push(`地圖魔物索引缺失:${lid}->${mid}`)
 }
 for(const t of (DB.party_member_templates||[]))for(const cid of (t.class_affinity_ids||[]))if(!cls(cid))issues.push(`隊友職業關聯缺失:${t.name}->${cid}`);for(const t of (DB.party_member_templates||[])){for(const sid of (t.subjob_affinity_ids||[]))if(!sub(sid))issues.push(`隊友副職關聯缺失:${t.name}->${sid}`);if(!(t.class_affinity_ids||[]).length&&!(t.subjob_affinity_ids||[]).length&&t.integration_role!=="noncombat_support")issues.push(`隊友缺少職業整合:${t.name}`)}
 for(const c of (DB.companion_species||[])){
   if(!["active","deferred_high_tier_region","non_wild_or_special_acquisition"].includes(c.habitat_integration_status))issues.push(`夥伴棲地整合狀態缺失:${c.name}`);
   for(const lid of (c.habitat_location_ids||[]))if(!loc(lid))issues.push(`夥伴棲地引用缺失:${c.name}->${lid}`);
   for(const mid of (c.monster_reference_ids||[]))if(!IDX.monster.has(mid))issues.push(`夥伴魔物關聯缺失:${c.name}->${mid}`)
 }
 if((G?.worldState?.integratedEvents||[]).length>60)issues.push("整合世界事件超過60筆");
 if((DB.political_entities||[]).length!==18)issues.push(`政治單位數量異常:${(DB.political_entities||[]).length}`);
 if((DB.world_regions||[]).length!==20)issues.push(`宏觀地區數量異常:${(DB.world_regions||[]).length}`);
 if((DB.culture_profiles||[]).length!==20)issues.push(`文化資料數量異常:${(DB.culture_profiles||[]).length}`);
 const polityIds=new Set((DB.political_entities||[]).map(x=>x.id)),regionIds=new Set((DB.world_regions||[]).map(x=>x.id)),cultureIds=new Set((DB.culture_profiles||[]).map(x=>x.id));
 for(const p of (DB.political_entities||[])){if(!regionIds.has(p.core_region_id))issues.push(`政治體核心地區缺失:${p.name}`);if(!cultureIds.has(p.culture_id))issues.push(`政治體文化缺失:${p.name}`);if(p.vassal_of&&!polityIds.has(p.vassal_of))issues.push(`政治體宗主引用缺失:${p.name}`)}
 for(const r of (DB.political_relations||[])){if(!polityIds.has(r.a)||!polityIds.has(r.b))issues.push(`政治關係引用缺失:${r.a}/${r.b}`);if(r.score<-100||r.score>100)issues.push(`政治關係值越界:${r.a}/${r.b}`)}
 for(const l of DB.locations){if(l.world_region_id&&!regionIds.has(l.world_region_id))issues.push(`地點宏觀地區引用缺失:${l.name}`);if(l.political_entity_id&&!polityIds.has(l.political_entity_id))issues.push(`地點政治體引用缺失:${l.name}`);if(l.culture_id&&!cultureIds.has(l.culture_id))issues.push(`地點文化引用缺失:${l.name}`)}
 if(!DB.lore_system||DB.lore_system.version!=="LORE-1.0")issues.push("LORE-1.0缺失");
 const loreIds=new Set((DB.lore_records||[]).map(x=>x.id));if(loreIds.size!==(DB.lore_records||[]).length)issues.push("世界誌ID重複");
 const validVerify=new Set(Object.keys(DB.lore_system?.verification_levels||{}));
 for(const r of (DB.lore_records||[])){if(!validVerify.has(r.verification))issues.push(`世界誌驗證層級無效:${r.id}`);const k=`${r.scope_type}:${r.scope_id}`;if(!(DB.lore_query_index?.[k]||[]).includes(r.id))issues.push(`世界誌索引缺失:${r.id}`)}
 for(const [k,ids] of Object.entries(DB.lore_query_index||{}))for(const id of ids)if(!loreIds.has(id))issues.push(`世界誌查詢索引斷鏈:${k}->${id}`);
 if((G?.character?.knownLoreIds||[]).length>300)issues.push("角色世界誌已知記錄超過300");
 for(const id of (G?.character?.knownLoreIds||[]))if(!loreIds.has(id))issues.push(`角色世界誌引用缺失:${id}`);
 if((G?.worldState?.politicalEvents||[]).length>30)issues.push("政治事件超過30筆");
 for(const [k,v] of Object.entries(G?.worldState?.politicalRelations||{}))if(v.score<-100||v.score>100)issues.push(`動態政治關係越界:${k}`);

 const authTierIds=new Set((DB.authority_tiers||[]).map(x=>x.id)),authRightIds=new Set((DB.authority_rights_catalog||[]).map(x=>x.id)),authIds=new Set((DB.authority_archetypes||[]).map(x=>x.id));
 if((DB.authority_archetypes||[]).length!==20)issues.push(`權力原型數量異常:${(DB.authority_archetypes||[]).length}`);
 if((DB.polity_authority_profiles||[]).length!==18)issues.push(`政治體權力檔案數量異常:${(DB.polity_authority_profiles||[]).length}`);
 if((DB.political_authority_catalog||[]).length)issues.push(`舊權力catalog仍在參與資料:${DB.political_authority_catalog.length}`);
 for(const a of (DB.authority_archetypes||[])){
   if(!a.succession_method||!a.jurisdiction||!a.symbols?.length||!a.subordinate_titles?.length)issues.push(`權力原型資料不完整:${a.name||a.id}`);
   if(!authTierIds.has(a.authority_tier))issues.push(`權力原型權級缺失:${a.name}/${a.authority_tier}`);
   if(a.combat_power_independent!==true)issues.push(`權力原型錯誤綁定戰力:${a.name}`)
 }
 const profileByPolity=new Map((DB.polity_authority_profiles||[]).map(x=>[x.polity_id,x]));
 for(const p of (DB.political_entities||[])){
   const ap=profileByPolity.get(p.id);if(!ap){issues.push(`政治體權力檔案缺失:${p.name}`);continue}
   const officeIds=new Set((ap.office_nodes||[]).map(x=>x.id));if(!ap.office_nodes?.length)issues.push(`政治體權力鏈空白:${p.name}`);
   for(const o of (ap.office_nodes||[])){
     if(!authTierIds.has(o.authority_tier))issues.push(`政治體權級引用缺失:${p.name}/${o.title}`);
     if(o.reports_to&&!officeIds.has(o.reports_to))issues.push(`政治體上級引用缺失:${p.name}/${o.title}`);
     for(const x of (o.parallel_authority_ids||[]))if(!officeIds.has(x))issues.push(`政治體平行權力引用缺失:${p.name}/${o.title}/${x}`);
     for(const rid of (o.rights||[]))if(!authRightIds.has(rid))issues.push(`政治體權能引用缺失:${p.name}/${o.title}/${rid}`);
     if(o.authority_archetype_id&&!authIds.has(o.authority_archetype_id))issues.push(`政治體主權原型缺失:${p.name}/${o.title}`)
   }
 }
 for(const l of (DB.locations||[]))if(l.kind==='town'&&l.world_region_id==='REG-18'){
   if(!l.local_authority)issues.push(`CURRENT聚落地方統治缺失:${l.name}`);
   else if(!authTierIds.has(l.local_authority.authority_tier))issues.push(`CURRENT地方權級缺失:${l.name}`)
 }
 if((G?.worldState?.authorityEvents||[]).length>30)issues.push('權力事件超過30筆');
 for(const e of (G?.worldState?.authorityEvents||[])){
   const ap=profileByPolity.get(e.polityId),ids=new Set((ap?.office_nodes||[]).map(x=>x.id));
   if(!ap||!ids.has(e.a)||!ids.has(e.b))issues.push(`權力事件職位引用缺失:${e.polityId}/${e.a}/${e.b}`)
 }
 for(const [pid,v] of Object.entries(G?.character?.politicalStanding||{}))if(!politicalEntity(pid)||v<-100||v>100)issues.push(`政治聲望異常:${pid}/${v}`);

 const dsc=DB.discipline_factions||[],dids=new Set(dsc.map(x=>x.id)),sfs=new Set((DB.skill_families||[]).map(x=>x.id)),cids=new Set(DB.combat_classes.map(x=>x.id));
 if(dsc.filter(x=>x.track==="physical").length!==25)issues.push(`物理流派數量異常:${dsc.filter(x=>x.track==="physical").length}`);
 if(dsc.filter(x=>x.track==="magic").length!==24)issues.push(`魔法流派數量異常:${dsc.filter(x=>x.track==="magic").length}`);
 if(dids.size!==49)issues.push(`流派ID重複或數量異常:${dids.size}`);
 const dnames=new Set();for(const d of dsc){
   if(dnames.has(d.name))issues.push(`流派名稱重複:${d.name}`);dnames.add(d.name);
   if(d.parent_org_id&&!orgIds.has(d.parent_org_id))issues.push(`流派父組織缺失:${d.name}->${d.parent_org_id}`);
   if(d.primary_facility&&!DB.facilities[d.primary_facility])issues.push(`流派設施缺失:${d.name}->${d.primary_facility}`);
   for(const lid of (d.contact_location_ids||[]))if(!loc(lid))issues.push(`流派地點缺失:${d.name}->${lid}`);
   for(const cid of (d.related_class_ids||[]))if(!cids.has(cid))issues.push(`流派職業引用缺失:${d.name}->${cid}`);
   for(const sf of (d.skill_family_ids||[]))if(!sfs.has(sf))issues.push(`流派技能家族缺失:${d.name}->${sf}`);
   if(!(d.lore_record_ids||[]).length)issues.push(`流派LORE缺失:${d.name}`);
   for(const x of (d.dialogue_record_ids||[]))if(!IDX.dialogue.has(x))issues.push(`流派對話引用缺失:${d.name}->${x}`);
   for(const x of (d.intel_record_ids||[]))if(!IDX.intel.has(x))issues.push(`流派情報引用缺失:${d.name}->${x}`);
 }
 for(const bad of ["寒冰劍術","烈焰劍術","雷電劍術","暴風劍術"])if(dsc.some(x=>x.name.includes(bad)))issues.push(`元素劍術未合併:${bad}`);
 if(!disciplineFor("DSC-PHY-30")?.substyles?.includes("霜環分支"))issues.push("魔劍元素分支合併缺失");
 if(!disciplineFor("DSC-MAG-09")?.substyles?.includes("焰環"))issues.push("元素塔分環合併缺失");
 for(const r of (DB.discipline_relations||[])){if(!dids.has(r.a)||!dids.has(r.b))issues.push(`流派關係斷鏈:${r.a}/${r.b}`);if(r.score<-100||r.score>100)issues.push(`流派關係值越界:${r.a}/${r.b}`)}
 if((G?.worldState?.disciplineEvents||[]).length>30)issues.push("流派世界事件超過30筆");
 if(G?.character?.disciplines){
   for(const id of G.character.disciplines.discovered||[])if(!dids.has(id))issues.push(`角色流派引用缺失:${id}`);
   for(const [id,v] of Object.entries(G.character.disciplines.mastery||{}))if(!dids.has(id)||v<0||v>100)issues.push(`流派研習度異常:${id}/${v}`)
 }

 const et=DB.eastern_sword_traditions||[],ef=DB.eastern_sword_figures||[],etsk=DB.eastern_sword_techniques||[];
 if(et.length!==3)issues.push(`東方劍術核心傳承數量異常:${et.length}`);
 if(!et.some(x=>x.id==="EST-THUNDERCLAP")||!et.some(x=>x.id==="EST-RAIKO")||!et.some(x=>x.id==="EST-YAGYU-MIND"))issues.push("雷鳴／雷煌／柳生唯心傳承缺失");
 if(!disciplineFor("DSC-PHY-31")||disciplineFor("DSC-PHY-31").discovery!=="hidden_restricted")issues.push("雷煌流隱藏流派設定缺失");
 if((disciplineFor("DSC-PHY-31")?.dialogue_record_ids||[]).length||(disciplineFor("DSC-PHY-31")?.intel_record_ids||[]).length)issues.push("雷煌流誤接入普通公開對話／情報");
 const fifth=ef.find(x=>x.id==="FIG-RAIKO-FIFTH");if(!fifth||fifth.true_name!==null||fifth.visibility!=="core_secret")issues.push("第五弟子秘密資料異常");
 const feilie=ef.find(x=>x.id==="FIG-HUANG-FEILIE"),isshin=ef.find(x=>x.id==="FIG-HUANG-ISSHIN"),maya=ef.find(x=>x.id==="FIG-HUANG-MAYA");
 if(!feilie||feilie.combat_tier!=="A"||feilie.eastern_rank!=="劍聖"||feilie.rank_seniority!=="資深")issues.push("煌飛烈階級資料異常");
 if(!isshin||isshin.combat_tier!=="A"||isshin.eastern_rank!=="劍聖"||isshin.rank_seniority!=="新晉")issues.push("煌一心齋階級資料異常");
 if(!maya||maya.combat_tier!=="B"||maya.eastern_rank!=="劍豪")issues.push("煌真葉階級資料異常");
 const rein=(DB.notable_families||[]).find(x=>x.id==="FAM-REIN");if(!rein||!rein.aliases?.includes("萊恩家族"))issues.push("雷恩／萊恩家族別名索引缺失");
 const yagyu=et.find(x=>x.id==="EST-YAGYU-MIND");if(!yagyu||!yagyu.aliases?.some(x=>x.includes("柳生新陰流")))issues.push("柳生舊稱去重索引缺失");
 const eye=etsk.find(x=>x.id==="EST-SK-RAIKO-05"),rai=etsk.find(x=>x.id==="EST-SK-RAIKO-06");if(!eye||eye.tier!=="B")issues.push("心眼秘技資料異常");if(!rai||rai.tier!=="A"||!rai.requires_douqi)issues.push("雷殛秘傳／鬥氣條件異常");
 if((DB.named_weapons||[]).filter(x=>String(x.id).startsWith("NW-RAIKO-")).some(x=>x.acquisition?.includes("普通商店" )===false?false:false)){}

 const st=DB.s_tier_combatants||[],reservedS=DB.s_tier_reserved_slots||[],stIds=new Set(st.map(x=>x.id));
 if(st.length!==30)issues.push(`S級已確認人數異常:${st.length}`);
 if(reservedS.length!==10)issues.push(`S級保留席數異常:${reservedS.length}`);
 if(st.length+reservedS.length!==40)issues.push(`S級全球席位總數異常:${st.length+reservedS.length}`);
 if(stIds.size!==st.length)issues.push("S級人物ID重複");
 for(const x of reservedS){
   if(x.status!=="reserved_blank"||x.name!==null||x.race_id!==null||x.background!==null||x.locked_for_future!==true)issues.push(`S級保留席被污染:${x.slot_id}`)
 }
 const validRegions=new Set((DB.world_regions||[]).map(x=>x.id)),validPolities=new Set((DB.political_entities||[]).map(x=>x.id)),validClasses=new Set(DB.combat_classes.map(x=>x.id));
 for(const x of st){
   if(x.combat_tier!=="S")issues.push(`S級人物戰力標記錯誤:${x.name}`);
   if(x.primary_polity_id&&!validPolities.has(x.primary_polity_id))issues.push(`S級政治體引用缺失:${x.name}`);
   if(x.current_region_id&&!validRegions.has(x.current_region_id))issues.push(`S級地區引用缺失:${x.name}`);
   if(x.combat_class_id&&!validClasses.has(x.combat_class_id))issues.push(`S級職業引用缺失:${x.name}`);
   if(!x.s_rank_path||!x.known_limitations||!(x.history||[]).length)issues.push(`S級人物脈絡不完整:${x.name}`);
   for(const o of x.organization_links||[])if(!orgIds.has(o.organization_id))issues.push(`S級組織引用缺失:${x.name}->${o.organization_id}`);
   if((x.formal_class_tier==="A"||x.formal_class_tier==="B")&&!String(x.s_rank_path).includes("S級"))issues.push(`A/B職業S級實效說明缺失:${x.name}`)
 }
 const extST=new Set(["FIG-HUANG-FEILIE"]);
 for(const r of DB.s_tier_relations||[]){
   if(!stIds.has(r.a)&&!extST.has(r.a))issues.push(`S級關係A端斷鏈:${r.id}->${r.a}`);
   if(!stIds.has(r.b)&&!extST.has(r.b))issues.push(`S級關係B端斷鏈:${r.id}->${r.b}`);
   if(r.score<-100||r.score>100)issues.push(`S級關係值越界:${r.id}`)
 }
 if((G?.worldState?.sTierEvents||[]).length>20)issues.push("S級世界影響事件超過20筆");

 const cpo=DB.continental_political_order,ou=DB.overseas_unknown_horizons||[];
 if(!cpo||cpo.political_unit_count!==20||cpo.governed_polity_count!==17||cpo.regional_power_count!==2||cpo.nonstate_political_zone_count!==1)issues.push("大陸政治體系統缺失或數量異常");
 if(politicalEntity("POL-020")?.name!=="黑月深庭")issues.push("POL-020未修正為黑月深庭");
 if(politicalEntity("POL-020")?.primary_authority_archetype_id!=="AUT-005")issues.push("黑月深庭主權原型錯誤");
 if(worldRegion("REG-20")?.political_entity_id!==null)issues.push("龍脊火山群誤掛政治體");
 if(worldRegion("REG-20")?.political_status!=="unclaimed_fragmented")issues.push("龍脊火山群無主狀態缺失");
 const stone=worldRegion("REG-13");if(!stone?.secondary_political_entity_ids?.includes("POL-020")||stone.layered_sovereignty!==true)issues.push("石冠山脈／黑月深庭重疊主權缺失");
 for(const rid of (stone?.secondary_political_entity_ids||[]))if(!politicalEntity(rid))issues.push(`宏觀地區次級政治體引用缺失:${rid}`);
 if(ou.length!==3)issues.push(`海外未知文明數量異常:${ou.length}`);
 for(const x of ou){
   if(!["魔族","龍族","鳳族"].includes(x.people))issues.push(`海外未知族群異常:${x.people}`);
   for(const k of ["known_political_entity_id","known_name","known_capital","known_government","known_ruler","known_borders"])if(x[k]!==null)issues.push(`海外未知欄位被污染:${x.people}/${k}`);
 }
 for(const sid of ["ST-28","ST-29","ST-30"])if(sTierCombatant(sid)?.primary_polity_id!==null)issues.push(`古龍被誤掛國籍:${sid}`);
 if((DB.political_relations||[]).some(r=>(r.a==="POL-020"||r.b==="POL-020")&&String(r.reason).includes("龍")))issues.push("POL-020仍殘留龍族政體外交");

 const wh=DB.world_history_system,ht=DB.world_timeline||[],hp=DB.historical_subperiods||[],hc=DB.historical_causal_chains||[],hd=DB.historical_disputes||[];
 if(!wh||wh.version!=="HISTORY-2.0")issues.push("HISTORY-2.0缺失");
 if(hp.length!==12)issues.push(`歷史細分時期數量異常:${hp.length}`);
 if(ht.length!==82)issues.push(`世界史年表數量異常:${ht.length}`);
 if(hc.length!==14)issues.push(`歷史因果鏈數量異常:${hc.length}`);
 if(hd.length!==8)issues.push(`爭議史數量異常:${hd.length}`);
 const heIds=new Set(ht.map(x=>x.id));if(heIds.size!==ht.length)issues.push("世界史事件ID重複");
 const eraMap=new Map((DB.historical_eras||[]).map(x=>[x.id,x])),perMap=new Map(hp.map(x=>[x.id,x]));
 for(const e of ht){
   const er=eraMap.get(e.era_id),pr=perMap.get(e.subperiod_id);
   if(!er||e.year<er.start_year||e.year>er.end_year)issues.push(`世界史時代引用異常:${e.id}`);
   if(!pr||e.year<pr.start_year||e.year>pr.end_year)issues.push(`世界史細分時期異常:${e.id}`);
   if(e.lore_record_id&&!loreIds.has(e.lore_record_id))issues.push(`世界史LORE引用缺失:${e.id}`);
   for(const cid of e.cause_ids||[]){const c=historyEvent(cid);if(!c)issues.push(`世界史原因斷鏈:${e.id}->${cid}`);else if(c.year>e.year)issues.push(`世界史逆時間因果:${cid}->${e.id}`)}
   for(const xid of e.consequence_ids||[])if(!heIds.has(xid))issues.push(`世界史後果斷鏈:${e.id}->${xid}`);
 }
 for(const c of hc){for(const eid of c.event_ids||[])if(!heIds.has(eid))issues.push(`歷史因果鏈斷鏈:${c.id}->${eid}`)}
 for(const d of hd){for(const eid of d.related_event_ids||[])if(!heIds.has(eid))issues.push(`爭議史事件斷鏈:${d.id}->${eid}`)}
 if(historyEvent("HIST-067")?.visibility!=="restricted")issues.push("雷煌相關歷史事件未受限");
 if(historicalDispute("HDIS-08")?.status!=="unknown")issues.push("海外未知歷史爭議狀態錯誤");
 for(const p of DB.political_entities||[])if(!(DB.history_entity_index?.[p.id]||[]).length)issues.push(`政治體缺世界史脈絡:${p.name}`);
 for(const r of DB.world_regions||[])if((DB.history_entity_index?.[r.id]||[]).length<2)issues.push(`地區世界史脈絡過薄:${r.name}`);

 const sh=systemDomainHealth();issues.push(...sh.issues);
 if(DB.system_orchestrator?.version!=="ORCHESTRATOR-3.0")issues.push("ORCHESTRATOR-3.0缺失");
 if(DB.generation_pipeline?.version!=="GEN-PIPE-2.0")issues.push("GEN-PIPE-2.0缺失");
 if((DB.regional_content_profiles||[]).length!==21)issues.push(`區域內容檔案數量異常:${(DB.regional_content_profiles||[]).length}`);
 if((DB.regional_npc_archetypes||[]).length!==126)issues.push(`地方NPC原型數量異常:${(DB.regional_npc_archetypes||[]).length}`);
 if((DB.regional_adventure_hooks||[]).length!==84)issues.push(`區域冒險脈絡數量異常:${(DB.regional_adventure_hooks||[]).length}`);
 if((DB.regional_life_events||[]).length!==63)issues.push(`區域生活事件數量異常:${(DB.regional_life_events||[]).length}`);
 if((DB.quest_templates||[]).length!==24)issues.push(`公會委託模板數量異常:${(DB.quest_templates||[]).length}`);
 const expectedAdventureEvents=DB.integration_registry?.counts?.adventure_event_templates??(DB.adventure_event_templates||[]).length;if((DB.adventure_event_templates||[]).length!==expectedAdventureEvents)issues.push(`奇遇模板數量異常:${(DB.adventure_event_templates||[]).length}/${expectedAdventureEvents}`);
 if((DB.dialogue_database?.records||[]).length!==546)issues.push(`對話資料數量異常:${(DB.dialogue_database?.records||[]).length}`);
 if((DB.intel_database?.records||[]).length!==546)issues.push(`情報資料數量異常:${(DB.intel_database?.records||[]).length}`);
 const rgIds=new Set((DB.world_regions||[]).map(x=>x.id));
 for(const x of DB.regional_content_profiles||[]){if(!rgIds.has(x.region_id))issues.push(`區域內容地區斷鏈:${x.id}`);for(const eid of x.history_event_ids||[])if(!historyEvent(eid))issues.push(`區域內容歷史斷鏈:${x.id}->${eid}`)}
 for(const x of DB.regional_npc_archetypes||[]){if(!rgIds.has(x.region_id))issues.push(`NPC原型地區斷鏈:${x.id}`);if(x.combat_tier_ceiling&&tierOrder(x.combat_tier_ceiling)>tierOrder("C"))issues.push(`普通NPC原型戰力越權:${x.id}`)}
 for(const x of DB.regional_adventure_hooks||[]){if(!rgIds.has(x.region_id))issues.push(`區域冒險地區斷鏈:${x.id}`);for(const eid of x.history_event_ids||[])if(!historyEvent(eid))issues.push(`區域冒險歷史斷鏈:${x.id}->${eid}`)}
 for(const x of DB.regional_life_events||[])if(!rgIds.has(x.region_id))issues.push(`區域生活事件地區斷鏈:${x.id}`);
 for(const d of DB.dialogue_database?.records||[]){if(d.world_region_id&&!rgIds.has(d.world_region_id))issues.push(`對話宏觀地區斷鏈:${d.id}`)}
 for(const x of DB.intel_database?.records||[]){if(x.world_region_id&&!rgIds.has(x.world_region_id))issues.push(`情報宏觀地區斷鏈:${x.id}`)}
 if(G?.worldState?.orchestrator?.lastWorldDynamicTurn>G.turn)issues.push("世界動態調度器turn超前");

 const ic=DB.integration_registry?.counts||{};if(ic.lore_records!==DB.lore_records.length||ic.dialogue!==(DB.dialogue_database?.records||[]).length||ic.intel!==(DB.intel_database?.records||[]).length||ic.quest_templates!==DB.quest_templates.length||ic.adventure_event_templates!==DB.adventure_event_templates.length)issues.push("INTEGRATION-3.0統計與CURRENT實際數量不同步");

 const qi=DB.quest_system?.quest_intel_system;if(!qi||qi.version!=="QUEST-INTEL-1.1")issues.push("QUEST-INTEL-1.1缺失");
 if(!Array.isArray(G?.explorationIntel||[]))issues.push("探索情報狀態不是陣列");
 if((G?.explorationIntel||[]).length>(qi?.exploration_record_cap||120))issues.push("探索情報超過上限");
 if(typeof openIntelArchive!=="function"||typeof intelArchiveEntries!=="function")issues.push("固定情報頁runtime缺失");
 if(DB.hard_rules?.ui_bottom_nav_button_count!==8)issues.push("底部固定導覽按鍵數規則不是8");
 if(DB.hard_rules?.guild_quest_no_intel_button!==true||DB.hard_rules?.quest_card_no_intel_button!==true)issues.push("委託情報按鍵位置規則缺失");
 if(DB.hard_rules?.home_screen_hide_save_card!==true)issues.push("主畫面存檔欄位隱藏規則缺失");
 const homeSummary=DB.ui_mobile_panel_system?.main_screen?.summary_cards||[];
 if(homeSummary.join("|")!=="遊戲時間|位置|回合")issues.push(`主畫面摘要欄位順序異常:${homeSummary.join("/")}`);
 if(DB.home_hud_layout_system?.version!=="HOME-HUD-LAYOUT-1.0")issues.push("HOME-HUD-LAYOUT-1.0缺失");
 if(DB.hard_rules?.intel_archive_max_visible_per_source!==4)issues.push("情報頁單來源最大同時顯示數不是4");
 if(DB.hard_rules?.intel_archive_independent_scrollbars!==true||DB.intel_archive_system?.independent_scrollbars!==true)issues.push("情報頁獨立拖曳條規則缺失");
 if(DB.intel_archive_system?.max_visible_per_source!==4)issues.push("情報頁顯示上限metadata異常");

 const mh=DB.map_hierarchy_system,rrm=DB.realm_region_maps||[],prm=DB.province_region_maps||[],srm=DB.settlement_region_maps||[],stsys=DB.settlement_world_tier_system;
 if(!mh||mh.version!=="MAP-HIERARCHY-1.0"||mh.layers?.length!==4)issues.push("MAP-HIERARCHY-1.0缺失或層級異常");
 if(!stsys||stsys.version!=="SETTLEMENT-TIER-1.0"||stsys.tiers?.length!==7)issues.push("SETTLEMENT-TIER-1.0缺失");
 const rmapIds=new Set(rrm.map(x=>x.id)),pmapIds=new Set(prm.map(x=>x.id)),smapIds=new Set(srm.map(x=>x.id));
 for(const p of prm){if(!rmapIds.has(p.parent_realm_map_id))issues.push(`行省上層地圖缺失:${p.name}`);if(p.capital_location_id&&!loc(p.capital_location_id))issues.push(`行省首府缺失:${p.name}`)}
 for(const s of srm){if(!pmapIds.has(s.parent_province_region_id))issues.push(`城鎮區域上層行省缺失:${s.name}`);if(!loc(s.center_location_id))issues.push(`城鎮區域中心缺失:${s.name}`);for(const lid of s.location_ids||[])if(!loc(lid))issues.push(`城鎮區域地點缺失:${s.name}->${lid}`)}
 for(const l of DB.locations){
   if(l.kind==="town"){if(!l.settlement_world_tier)issues.push(`聚落世界層級缺失:${l.name}`);else if(l.settlement_world_tier!==l.tier)issues.push(`聚落世界層級與地點tier不同步:${l.name}`)}
   if(l.world_region_id==="REG-18"){if(!pmapIds.has(l.province_region_id))issues.push(`西境地點行省歸屬缺失:${l.name}`);if(!smapIds.has(l.settlement_region_id))issues.push(`西境地點城鎮區域歸屬缺失:${l.name}`)}
 }
 const lp=DB.loven_province_database;
 if(!lp||lp.version!=="LOVEN-PROVINCE-1.0")issues.push("LOVEN-PROVINCE-1.0缺失");
 else{
   if(lp.capital_city?.location_id!=="L-LOVEN")issues.push("洛文省級首府漂移");
   if(lp.upper_level_city?.location_id!=="L-SELENBURG")issues.push("洛文上一級城市缺失");
   if((lp.same_tier_cities||[]).length<2)issues.push("洛文同級城市不足");
   for(const x of lp.same_tier_cities||[])if(loc(x.location_id)?.settlement_world_tier!=="D")issues.push(`洛文同級城市tier錯誤:${x.location_id}`);
   if(!(lp.wilderness_map_ids||[]).length||!(lp.dungeon_map_ids||[]).length)issues.push("洛文省域野外／地下城資料缺失");
 }

 if((DB.regional_powers||[]).length!==2)issues.push(`區域勢力數量異常:${(DB.regional_powers||[]).length}`);
 for(const rp of (DB.regional_powers||[])){if(rp.recognized_sovereignty!==false)issues.push(`區域勢力誤具主權:${rp.name}`);if(politicalEntity(rp.legacy_polity_id))issues.push(`退役政體仍存在:${rp.legacy_polity_id}`)}
 for(const rid of ["REG-10","REG-17"]){const r=worldRegion(rid);if(r?.political_entity_id!==null)issues.push(`區域勢力地區誤掛政體:${rid}`);if(!regionalPowersForRegion(rid).length)issues.push(`區域勢力地區缺勢力:${rid}`)}
 for(const pid of ["POL-007","POL-008","POL-009"]){if(politicalEntity(pid)?.government_type!=="自由都市")issues.push(`自由都市類型未統整:${pid}`)}
 if((DB.discipline_factions||[]).length!==49)issues.push(`流派精簡未達49:${DB.discipline_factions?.length}`);
 for(const id of ["EST-THUNDERCLAP","EST-RAIKO","EST-YAGYU-MIND"]){if(!(DB.eastern_sword_traditions||[]).some(x=>x.id===id))issues.push(`東方核心傳承缺失:${id}`)}
 if(!disciplineFor("DSC-PHY-31"))issues.push("雷煌流canonical流派缺失");
 for(const [oldId,newId] of Object.entries(DB.discipline_merge_map||{})){if(!disciplineFor(newId))issues.push(`流派整併目標缺失:${oldId}->${newId}`);if((DB.discipline_factions||[]).some(x=>x.id===oldId))issues.push(`舊流派未退役:${oldId}`)}
 if(DB.naming_ai?.version!=="NAME-AI-1.0")issues.push("NAME-AI-1.0缺失");
 for(const banned of ["九璽貴族共和國","七橋自由城邦同盟","五環元素塔議會","七環魔劍士會"]){if(allCanonicalNames().includes(banned))issues.push(`舊公式化名稱仍為canonical:${banned}`)}

 const wm=DB.world_material_system,fest=DB.cultural_festivals||[],myths=DB.myth_cycle_records||[],
       lhist=DB.local_historical_incidents||[],folk=DB.regional_folklore||[],rum=DB.regional_rumors||[],
       packs=DB.generator_material_packs||[];
 if(!wm||wm.version!=="WORLD-MATERIAL-1.0")issues.push("WORLD-MATERIAL-1.0缺失");
 if(fest.length!==40)issues.push(`文化節慶數量異常:${fest.length}`);
 if(myths.length!==27)issues.push(`神話母題數量異常:${myths.length}`);
 if(lhist.length!==40)issues.push(`地方微歷史數量異常:${lhist.length}`);
 if(folk.length!==40)issues.push(`地方民俗數量異常:${folk.length}`);
 if(rum.length!==100)issues.push(`地方傳聞數量異常:${rum.length}`);
 if(packs.length!==20)issues.push(`區域素材包數量異常:${packs.length}`);
 for(const r of DB.world_regions||[]){
   const pack=generatorMaterialPackFor(r.id);if(!pack)issues.push(`地區素材包缺失:${r.id}`);
   if(localHistoryFor(r.id).length<2)issues.push(`地方微歷史不足:${r.id}`);
   if(regionalFolkloreFor(r.id).length<2)issues.push(`地方民俗不足:${r.id}`);
   if(regionalRumorsFor(r.id).length<5)issues.push(`地方傳聞不足:${r.id}`);
 }
 for(const p of DB.pantheons||[])if(mythMotifsFor(p.id).length<3)issues.push(`神系神話素材不足:${p.id}`);
 for(const c of DB.culture_profiles||[]){
   if(!(c.cuisine||[]).length||!(c.sayings||[]).length||!(c.festival_ids||[]).length)issues.push(`文化深化不足:${c.id}`);
 }

 const wrs=DB.world_relationship_system,hr=DB.historical_relationship_records||[],hri=DB.historical_relationship_index||{};
 if(!wrs||wrs.version!=="RELATION-HISTORY-1.0")issues.push("RELATION-HISTORY-1.0缺失");
 if(hr.length!==222)issues.push(`歷史關係數量異常:${hr.length}`);
 const hrIds=new Set(hr.map(x=>x.id));if(hrIds.size!==hr.length)issues.push("歷史關係ID重複");
 for(const r of hr){
   if(r.score<-100||r.score>100)issues.push(`關係分數越界:${r.id}`);
   if(!DB.relationship_state_catalog?.[r.state])issues.push(`關係狀態未知:${r.id}`);
   if(r.lore_record_id&&!loreIds.has(r.lore_record_id))issues.push(`關係LORE缺失:${r.id}`);
 }
 for(const rc of DB.races||[])if(!(hri[`race:${rc.id}`]||[]).length)issues.push(`種族關係史缺失:${rc.id}`);
 for(const pp of DB.political_entities||[])if(!(hri[`polity:${pp.id}`]||[]).length)issues.push(`政體關係史缺失:${pp.id}`);
 for(const rr of DB.regional_powers||[])if(!(hri[`regional_power:${rr.id}`]||[]).length)issues.push(`區域勢力關係史缺失:${rr.id}`);
 for(const x of DB.organization_relations||[])if(!x.historical_basis||!x.current_effects?.length)issues.push(`組織關係未深化:${x.a}/${x.b}`);
 for(const x of DB.political_relations||[])if(!x.historical_basis||!x.current_effects?.length)issues.push(`政治關係未深化:${x.a}/${x.b}`);

 const ics=DB.item_catalog_system||{};
 const eqCount=(DB.items||[]).filter(x=>["武器","防具","飾品"].includes(x.catalog_group)).length;
 const potCount=(DB.items||[]).filter(x=>x.type==="藥劑").length;
 const otherCount=(DB.items||[]).length-eqCount-potCount;
 const craftCount=(DB.items||[]).filter(x=>x.craft_recipe).length;
 if(ics.version!=="ITEM-CATALOG-1.1")issues.push("ITEM-CATALOG-1.1缺失");
 if((DB.items||[]).length!==(DB.hard_rules.item_total_core_count||1098))issues.push(`物品總數異常:${(DB.items||[]).length}`);
 if(eqCount!==280)issues.push(`裝備數量異常:${eqCount}`);
 if(potCount!==240)issues.push(`藥劑數量異常:${potCount}`);
 if(otherCount!==(DB.hard_rules.general_item_core_count||578))issues.push(`一般道具數量異常:${otherCount}`);
 if(craftCount!==520)issues.push(`可製作品數量異常:${craftCount}`);
 if((DB.items||[]).some(x=>x.id?.startsWith("EQ31-")&&["A","S"].includes(x.tier)))issues.push("1.31新增裝備出現A/S級");
 for(const x of (DB.items||[]).filter(x=>x.id?.startsWith("EQ31-")||x.id?.startsWith("P31-"))){
   if(!x.craft_recipe)issues.push(`新增製作品缺配方:${x.id}`);
 }
 for(const fid of ["general","blacksmith","tailor","alchemy","enchanter","mageguild","church","clinic"]){
   for(const iid of DB.facilities?.[fid]?.stock||[])if(!item(iid))issues.push(`商店庫存引用缺失:${fid}/${iid}`);
 }

 if(DB.system_audit_registry?.version!=="SYSTEM-AUDIT-3.0")issues.push("SYSTEM-AUDIT-3.0缺失");
 for(const g of DB.generators||[]){
   if(g.runtime_status==="IMPLEMENTED"&&!generatorRuntimeFunctionExists(g.runtime_function))issues.push(`生成器runtime缺失:${g.id}->${g.runtime_function||"null"}`);
   if(g.audit_status!=="PASS")issues.push(`生成器未通過系統稽核:${g.id}`);
 }
 for(const a of DB.management_ai||[])if(a.audit_status!=="PASS")issues.push(`管理AI未通過系統稽核:${a.id}`);
 const retiredPolities=new Set(["POL-010","POL-017"]);
 for(const [name,rows] of [["regional_content_profiles",DB.regional_content_profiles],["regional_economy_profiles",DB.regional_economy_profiles],["regional_npc_archetypes",DB.regional_npc_archetypes],["regional_adventure_hooks",DB.regional_adventure_hooks]]){
   for(const x of rows||[])if(x.polity_id&&retiredPolities.has(x.polity_id))issues.push(`退役政體殘留:${name}/${x.id}/${x.polity_id}`)
 }
 for(const [iid,s] of Object.entries(DB.content_link_index?.item_sources||{})){
   if(!item(iid))issues.push(`來源索引無效物品:${iid}`);
   if(!["shops","gather_locations","monster_drops","recipe_inputs","recipe_outputs","special_sources"].some(k=>(s[k]||[]).length))issues.push(`物品來源完全空白:${iid}`)
 }

 if(DB.crafting_system?.ui_version!=="CRAFT-UI-1.1")issues.push("CRAFT-UI-1.1缺失");
 if(typeof craftMaterialText!=="function"||typeof cookingMaterialText!=="function")issues.push("製作素材文字函式缺失");

 if(DB.talent_system?.version!=="TALENT-CORE-2.0")issues.push("TALENT-CORE-2.0缺失");
 if((DB.talents||[]).length!==100)issues.push(`天賦數量異常:${(DB.talents||[]).length}`);
 const tc=DB.talent_system?.category_counts||{};
 if(tc["角色能力"]!==25||tc["戰鬥專精"]!==30||tc["戰鬥素質"]!==20||tc["副職業專精"]!==25)issues.push("天賦分類數量異常");
 if(typeof talentSubjobBonus!=="function"||typeof craftTimeHours!=="function")issues.push("天賦副職業runtime缺失");
 if(DB.crafting_system?.profession_subjob?.["附魔"]!=="SJ-ENCHANT")issues.push("附魔副職業映射缺失");

 if(DB.skill_scaling_system?.version!=="SKILL-SCALING-2.2")issues.push("SKILL-SCALING-2.2缺失");
 if(DB.map_navigation_system?.version!=="MAP-NAV-3.0")issues.push("MAP-NAV-3.0缺失");
 const dragon=(DB.skill_pools?.["C-DRAGONBLADE"]||[]).find(x=>x.name==="龍炎斬");
 if(!dragon||dragon.base_power_percent!==110)issues.push("龍炎斬百分比換算異常");
 const heal=(DB.shared_skills||[]).find(x=>x.base_name==="治癒術");
 if(!heal||heal.base_power_percent!==112)issues.push("治癒術百分比換算異常");
 const cleanse=(DB.shared_skills||[]).find(x=>x.base_name==="淨化術");
 if(!cleanse||!String(cleanse.effect_text||"").includes("不包含中毒"))issues.push("淨化術效果敘述異常");

 if(DB.meta?.distribution_mode!=="local_only")issues.push("本機模式未鎖定");
 if(DB.meta?.auto_update_system?.enabled!==false)issues.push("本機版仍啟用背景網站更新");
 if(!DB.ability_point_system||DB.ability_point_system.gain_every_levels!==5)issues.push("能力點系統缺失");
 if(DB.skill_scaling_system?.skill_xp_system?.level_cap!==10)issues.push("技能XP系統缺失");
 if(!DB.quest_system?.market_demand)issues.push("委託市場需求模型缺失");
 if(!DB.management_ai?.some(x=>x.id==="AI-QUEST-MARKET-DEMAND"))issues.push("委託市場需求AI缺失");
 if((DB.items||[]).some(x=>!(Number(x.weight)>0)))issues.push("存在無正重量物品");
 if(typeof craftItemBatch!=="function"||typeof cookBatch!=="function")issues.push("批量製作runtime缺失");
 if(typeof openGuildBuyback!=="function")issues.push("公會收購櫃檯runtime缺失");

 if(DB.encounter_ecology_system?.version!=="ENCOUNTER-ECOLOGY-2.0")issues.push("ENCOUNTER-ECOLOGY-2.0缺失");
 if(typeof monsterFitsLocationEcology!=="function"||typeof encounterWeightForLocation!=="function")issues.push("生態遭遇runtime缺失");
 const brokenTower=loc("D-WATCH"),brokenPool=brokenTower?encounterCandidates(brokenTower):[];
 if(brokenPool.some(m=>m.name==="棕熊"||m.name==="灰熊"||m.name==="洞穴熊"))issues.push("斷塔地下室仍可生成熊類");
 for(const l of DB.locations||[]){
   if(!["wild","dungeon"].includes(l.kind))continue;
   const ep=encounterCandidates(l);
   if(!ep.length)issues.push(`區域生態候選池為空:${l.id}`);
   if(l.encounter_profile?.archetype==="artificial_cellar"&&ep.some(m=>(m.ecology_profile?.tags||[]).includes("large_wildlife")))issues.push(`人工地下室生成大型野獸:${l.id}`);
 }

 if(DB.loot_ecology_system?.version!=="LOOT-ECOLOGY-1.0")issues.push("LOOT-ECOLOGY-1.0缺失");
 if(typeof validEnemyLootEntry!=="function")issues.push("掉落生態驗證函式缺失");
 for(const mon of DB.monsters||[]){
   const lp=mon.loot_profile;
   if(!lp||lp.version!=="LOOT-ECOLOGY-1.0")issues.push(`怪物掉落profile缺失:${mon.id}`);
   if(lp?.fallback_policy!=="none")issues.push(`怪物仍允許掉落fallback:${mon.id}`);
   for(const drop of mon.loot_materials||[]){
     if(!item(drop.id))issues.push(`怪物掉落物不存在:${mon.id}/${drop.id}`);
     if(!validEnemyLootEntry(mon,drop))issues.push(`怪物未授權掉落:${mon.id}/${drop.id}`);
   }
 }
 const halfOrc=monster("MON14-045"),kobold=monster("MON14-038");
 if((halfOrc?.loot_materials||[]).some(x=>item(x.id)?.name.includes("哥布林")))issues.push("半獸人仍掉落哥布林素材");
 if((kobold?.loot_materials||[]).some(x=>item(x.id)?.name.includes("鱗片")))issues.push("狗頭人仍掉落鱗片");

 if(DB.quest_turnin_ui_system?.version!=="QUEST-TURNIN-UI-1.0")issues.push("QUEST-TURNIN-UI-1.0缺失");
 if(typeof questListAction!=="function")issues.push("委託列表回報狀態函式缺失");
 const firewood=questTemplate("Q-FIREWOOD");
 if(!firewood||firewood.objective?.item_id!=="I-BRANCH")issues.push("乾燥枯枝委託item_id異常");
 if(item("I-BRANCH")?.name!=="乾燥枯枝")issues.push("乾燥枯枝canonical item異常");

 if(DB.quest_return_navigation_system?.version!=="QUEST-RETURN-NAV-1.0")issues.push("QUEST-RETURN-NAV-1.0缺失");
 if(typeof reopenQuestViewAfterTurnIn!=="function")issues.push("委託回報原畫面刷新函式缺失");

 if(DB.modal_state_sync_system?.version!=="MODAL-STATE-SYNC-1.0")issues.push("MODAL-STATE-SYNC-1.0缺失");
 if(typeof modalGoBack!=="function"||typeof captureModalPage!=="function")issues.push("modal狀態導覽核心缺失");

 if(DB.skill_description_system?.version!=="SKILL-DESCRIPTION-1.0")issues.push("SKILL-DESCRIPTION-1.0缺失");
 if(DB.skill_scaling_system?.version!=="SKILL-SCALING-2.2")issues.push("SKILL-SCALING-2.2缺失");
 if(typeof skillDescriptionText!=="function"||typeof supportEffectText!=="function"||typeof passiveEffectText!=="function")issues.push("技能文字敘述runtime缺失");
 const windSkill=(DB.skill_pools?.["C9-WINDMAGE"]||[]).find(x=>(x.base_name||x.name)==="風之護盾");
 if(!windSkill||supportPercentValue(windSkill,"defense_pct")<10)issues.push("風之護盾防禦百分比效果缺失");
 if((Object.values(DB.skill_pools||{}).flat()).some(s=>s.kind==="輔助"&&["","獲得戰鬥增益"].includes(String(s.effect_text||""))))issues.push("存在無具體效果的輔助技能");

 if(DB.inventory_organization_system?.version!=="INVENTORY-ORGANIZE-2.0")issues.push("INVENTORY-ORGANIZE-2.0缺失");
 if(DB.modal_scroll_preservation_system?.version!=="MODAL-SCROLL-PRESERVE-1.0")issues.push("MODAL-SCROLL-PRESERVE-1.0缺失");
 if(inventoryCategory(item("I-BREAD")).key!=="食物")issues.push("黑麵包未歸入食物");
 if(inventoryCategory(item("I-RAWMEAT")).key!=="食材")issues.push("生肉未歸入食材");
 if(typeof captureModalScrollState!=="function"||typeof restoreModalScrollState!=="function")issues.push("視窗捲動保存runtime缺失");

 if(DB.crafting_effect_display_system?.version!=="CRAFT-EFFECT-DISPLAY-1.0")issues.push("CRAFT-EFFECT-DISPLAY-1.0缺失");
 if(typeof craftEffectText!=="function"||typeof craftResultLine!=="function")issues.push("製作成品效果顯示runtime缺失");
 const roast=item("F-ROASTMEAT");
 if(!roast||Number(roast.use?.hunger)!==-30)issues.push("烤肉飢餓效果不是-30");
 if(roast&&!craftResultLine(roast).includes("降低飢餓30"))issues.push("烤肉製作描述未顯示降低飢餓30");

 const orgBonusIds=new Set(),discBonusIds=new Set(),supportedAffBonusKeys=new Set(["buy_price_pct","sell_price_pct","craft_success","quest_reward_pct","attack_pct","magic_attack_pct","defense_pct","magic_defense_pct","accuracy","evasion","critRate","attack_speed_pct","cast_speed_pct","initiative_pct","statusResist","statusAccuracy","perception","stealth","carryCapacity","healingPower","manaRegen","moveSpeed","blockRate","armorPenPct","magicPenPct","lootRate","summonPower","critDamage"]);
 for(const o of (DB.world_organizations||[])){const b=o.member_bonus;if(!b?.id||!b?.text||!b?.effects)issues.push(`組織加成缺失:${o.name}`);else{if(orgBonusIds.has(b.id))issues.push(`組織加成ID重複:${b.id}`);orgBonusIds.add(b.id);for(const k of Object.keys(b.effects))if(!supportedAffBonusKeys.has(k))issues.push(`組織加成未接runtime:${o.name}/${k}`)}}
 for(const d of (DB.discipline_factions||[])){const b=d.member_bonus;if(!b?.id||!b?.text||!b?.effects)issues.push(`流派加成缺失:${d.name}`);else{if(discBonusIds.has(b.id))issues.push(`流派加成ID重複:${b.id}`);discBonusIds.add(b.id);for(const k of Object.keys(b.effects))if(!supportedAffBonusKeys.has(k))issues.push(`流派加成未接runtime:${d.name}/${k}`)}}
 if(DB.organization_bonus_system?.version!=="ORG-BONUS-1.0"||DB.organization_bonus_system?.membership_limit!==1)issues.push("ORG-BONUS-1.0規則缺失");
 if(DB.discipline_bonus_system?.version!=="DISC-BONUS-1.0"||DB.discipline_bonus_system?.membership_limit!==1)issues.push("DISC-BONUS-1.0規則缺失");
 if(orgState().memberships.length>1)issues.push("角色同時加入超過1個組織");
 if(disciplineState().membershipId&&!disciplineFor(disciplineState().membershipId))issues.push("角色正式流派引用缺失");
 const merchantBonus=worldOrg("ORG-056")?.member_bonus?.effects||{};
 if(merchantBonus.buy_price_pct!==-10||merchantBonus.sell_price_pct!==-10)issues.push("金衡跨陸商會交易加成錯誤");
 if(disciplineFor("DSC-PHY-21")?.member_bonus?.effects?.accuracy!==10)issues.push("青嵐一刀流命中加成錯誤");
 if(disciplineFor("DSC-PHY-24")?.member_bonus?.effects?.initiative_pct!==10)issues.push("月影拔劍會先攻加成錯誤");

 if(DB.guild_cross_skill_layout_system?.version!=="GUILD-CROSS-SKILL-LAYOUT-1.0")issues.push("GUILD-CROSS-SKILL-LAYOUT-1.0缺失");
 if(DB.hard_rules?.guild_cross_skills_grouped_physical_magic!==true)issues.push("跨職技能物理／魔法分區規則缺失");
 if(DB.ui_runtime_system?.version!=="UI-RUNTIME-1.0")issues.push("UI-RUNTIME-1.0缺失");
 if(typeof setUIHTML!=="function"||typeof inventoryQuantityMap!=="function"||typeof trapOverlayFocus!=="function"||typeof renderSaveHealth!=="function")issues.push("介面runtime重構核心缺失");
 return issues
}
function runAudit(){
 const c=G.character,issues=[];
 if(Object.keys(c.equipment).length!==8)issues.push("8裝備欄異常");
 if(c.subjobs.length>2)issues.push("副職業超過2");
 if(c.skills.length>10)issues.push("技能超過10");if(c.adventureParty&&(1+(c.adventureParty.members||[]).length<2||1+(c.adventureParty.members||[]).length>5))issues.push("冒險團總人數超出2–5");
 if((c.talents||[]).length>2)issues.push("天賦超過2");
 if(c.level<1||c.level>99)issues.push("角色等級超出1–99");
 if((c.classMastery||0)<0||(c.classMastery||0)>100)issues.push("職業熟練異常");
 if(mainIsTwoHanded()&&offhandEquip())issues.push("雙手武器與副手裝備衝突");
 const auditOff=offhandEquip()&&item(equipId(offhandEquip()));if(auditOff&&!offhandEligible(auditOff))issues.push(`副手裝備不合法:${auditOff.name}`);
 for(const {eq} of equippedEntries())if(eq&&(eq.durability<0||eq.durability>eq.maxDurability))issues.push("裝備耐久異常");
 const caps=resourceCaps();if(c.maxHp!==caps.hp||c.maxStamina!==caps.stamina||c.maxMana!==caps.mana)issues.push("資源上限未同步");
 G.lastAudit={turn:G.turn,time:timeText(),issues};
 log("二十回合自檢",issues.length?issues.join("、"):"通過：角色狀態、裝備、技能、資源與旅誌結構一致。",issues.length?"danger":"ok")
}
let modalLastFocus=null;
function modalKindFromTitle(t){
 const s=String(t||"");
 if(s.includes("角色"))return "character";
 if(s.includes("背包"))return "inventory";
 if(s.includes("裝備")||s.includes("修理"))return "equipment";
 if(s.includes("委託"))return "quest";
 if(s.includes("地圖")||s.includes("移動"))return "map";
 if(s.includes("設定")||s.includes("遊戲更新"))return "settings";
 if(s.includes("技能")||s.includes("職業")||s.includes("訓練"))return "training";
 if(s.includes("製作")||s.includes("鍛造")||s.includes("裁縫")||s.includes("煉金"))return "craft";
 if(s.includes("商店")||s.includes("購買")||s.includes("出售"))return "shop";
 return "general"
}
function modalIconForKind(k){
 return {character:"♟",inventory:"▣",equipment:"⚔",quest:"✦",map:"⌖",settings:"⚙",training:"✧",craft:"◇",shop:"¤",general:"◆"}[k]||"◆"
}
let modalHistory=[];
let modalFallbackBackCode=null;
let modalCurrentRefreshCode=null;
let modalRestoring=false;
function modalBackLabel(text){
 const label=String(text||"").replace(/<[^>]+>/g,"").replace(/&larr;/gi,"←").replace(/\s+/g," ").trim().replace(/^←\s*/,"");
 return label==="上一頁"||label==="回上一頁"||label.startsWith("返回");
}
function extractModalNavigation(html){
 let fallbackCode=null;
 let cleaned=String(html??"").replace(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi,(full,attrs,labelHtml)=>{
   if(!modalBackLabel(labelHtml))return full;
   const mm=attrs.match(/\bonclick\s*=\s*(["'])([\s\S]*?)\1/i);
   if(!fallbackCode&&mm)fallbackCode=mm[2];
   return "";
 });
 cleaned=cleaned.replace(/<div\s+class=(["'])actions\1\s*>\s*<\/div>/gi,"");
 return {html:cleaned,fallbackCode};
}

function modalScrollElementKey(el,index){
 if(!el)return `scroll:${index}`;
 if(el.id)return `id:${el.id}`;
 if(el.dataset?.scrollKey)return `data-scroll:${el.dataset.scrollKey}`;
 if(el.dataset?.intelSource)return `intel:${el.dataset.intelSource}`;
 const cls=String(el.className||"").trim().split(/\s+/).filter(Boolean).slice(0,3).join(".");
 return `${String(el.tagName||"el").toLowerCase()}:${cls}:${index}`
}
function modalScrollableElements(body){
 if(!body||typeof body.querySelectorAll!=="function")return [];
 return [...new Set(body.querySelectorAll("[data-scroll-key],[data-intel-source],.rulebox,.intel-archive-scroll"))]
}
function captureModalScrollState(){
 const modal=document.querySelector("#modalBack .modal"),body=$("#modalBody"),nested=[];
 if(body){
   const els=modalScrollableElements(body);
   els.forEach((el,i)=>{
     const top=Number(el.scrollTop||0);
     if(top>0)nested.push({key:modalScrollElementKey(el,i),index:i,top})
   })
 }
 return {modalTop:Number(modal?.scrollTop||0),bodyTop:Number(body?.scrollTop||0),nested}
}
function restoreModalScrollState(state){
 if(!state)return;
 const modal=document.querySelector("#modalBack .modal"),body=$("#modalBody");
 if(modal)modal.scrollTop=Math.max(0,Number(state.modalTop||0));
 if(body)body.scrollTop=Math.max(0,Number(state.bodyTop||0));
 if(body&&Array.isArray(state.nested)){
   const els=modalScrollableElements(body),byKey=new Map();
   els.forEach((el,i)=>byKey.set(modalScrollElementKey(el,i),el));
   for(const s of state.nested){
     const el=byKey.get(s.key)||els[s.index];
     if(el)el.scrollTop=Math.max(0,Number(s.top||0))
   }
 }
}
function captureModalPage(){
 const modal=document.querySelector("#modalBack .modal");
 const title=$("#modalTitle")?.textContent||"";return {title,bodyHTML:$("#modalBody")?.innerHTML||"",kind:modal?.dataset?.kind||"default",fallbackCode:modalFallbackBackCode,refreshCode:modalCurrentRefreshCode,scrollState:captureModalScrollState(),characterDockContext,characterDockActiveKey:title==="角色"?null:characterDockActiveKey};
}
function updateModalBackButton(){
 const btn=$("#modalBackBtn");if(!btn)return;
 btn.textContent="←";
 btn.setAttribute("aria-label",(modalHistory.length||modalFallbackBackCode)?"回上一頁":"返回遊戲畫面");
 btn.title=(modalHistory.length||modalFallbackBackCode)?"回到上一層彈出頁面":"返回遊戲畫面";
}
function restoreModalPage(state){
 if(!state)return false;
 const back=$("#modalBack"),modal=document.querySelector("#modalBack .modal"),body=$("#modalBody");
 $("#modalTitle").textContent=state.title||"";
 $("#modalIcon").textContent=modalIconForKind(state.kind||modalKindFromTitle(state.title||""));
 body.innerHTML=normalizeUIButtonTypes(state.bodyHTML||"");UI_HTML_CACHE.delete(body);
 modalFallbackBackCode=state.fallbackCode||null;
 modalCurrentRefreshCode=state.refreshCode||null;
 characterDockContext=!!state.characterDockContext;characterDockActiveKey=state.characterDockActiveKey||null;
 if(modal){modal.dataset.kind=state.kind||modalKindFromTitle(state.title||"");modal.scrollTop=0}
 body.scrollTop=0;back.classList.remove("hide");document.body.classList.add("modal-open");
 updateModalBackButton();syncCharacterDock();
 if(typeof requestAnimationFrame==="function")requestAnimationFrame(()=>{restoreModalScrollState(state.scrollState);$("#modalBackBtn")?.focus({preventScroll:true})});
 return true
}
function modalGoBack(){
 if(modalHistory.length){
   const state=modalHistory.pop();
   if(state?.refreshCode){
     modalRestoring=true;
     try{Function(state.refreshCode).call(window);if(typeof requestAnimationFrame==="function")requestAnimationFrame(()=>restoreModalScrollState(state.scrollState))}
     catch(err){console.error("modal dynamic back refresh failed",err);restoreModalPage(state)}
     finally{modalRestoring=false}
     updateModalBackButton();return
   }
   restoreModalPage(state);return
 }
 if(modalFallbackBackCode){
   const code=modalFallbackBackCode;modalFallbackBackCode=null;modalRestoring=true;
   try{Function(code).call(window)}catch(err){console.error("modal back navigation failed",err);closeModal();return}
   finally{modalRestoring=false}
   updateModalBackButton();return
 }
 closeModal()
}
function showModal(t,b,refreshCode=null){
 const back=$("#modalBack"),modal=document.querySelector("#modalBack .modal"),body=$("#modalBody"),kind=modalKindFromTitle(t);
 const wasOpen=!back.classList.contains("hide"),oldTitle=$("#modalTitle")?.textContent||"";
 const samePage=wasOpen&&oldTitle===String(t||"");
 const preservedScroll=samePage?captureModalScrollState():null;
 modalLastFocus=document.activeElement;
 if(wasOpen&&!modalRestoring&&!samePage)modalHistory.push(captureModalPage());
 else if(!wasOpen){modalHistory=[];modalFallbackBackCode=null;modalCurrentRefreshCode=null}
 const nav=extractModalNavigation(b);modalFallbackBackCode=nav.fallbackCode;
 modalCurrentRefreshCode=refreshCode||null;
 setUIText($("#modalTitle"),t);setUIText($("#modalIcon"),modalIconForKind(kind));body.innerHTML=normalizeUIButtonTypes(nav.html);UI_HTML_CACHE.delete(body);
 if(modal){modal.dataset.kind=kind;if(!samePage)modal.scrollTop=0}
 if(!samePage)body.scrollTop=0;
 back.classList.remove("hide");document.body.classList.add("modal-open");
 updateModalBackButton();syncCharacterDock();
 if(typeof requestAnimationFrame==="function")requestAnimationFrame(()=>{
   if(samePage)restoreModalScrollState(preservedScroll);
   else $("#modalBackBtn")?.focus({preventScroll:true})
 })
}
function closeModal(){const back=$("#modalBack");back.classList.add("hide");document.body.classList.remove("modal-open");modalHistory=[];modalFallbackBackCode=null;modalCurrentRefreshCode=null;modalRestoring=false;characterDockContext=false;characterDockActiveKey=null;syncCharacterDock();if(modalLastFocus&&typeof modalLastFocus.focus==="function")modalLastFocus.focus();modalLastFocus=null;syncBodyScrollLock()}

function backClose(e){if(e.target.id==="modalBack")closeModal()}
function activeOverlayDialog(){
 const skill=$("#battleSkillPopup");if(skill&&!skill.classList.contains("hide"))return skill.querySelector('[role="dialog"]');
 const modal=$("#modalBack");if(modal&&!modal.classList.contains("hide"))return modal.querySelector('[role="dialog"]');
 const battle=$("#battleBack");if(battle&&!battle.classList.contains("hide"))return battle.querySelector('[role="dialog"]');
 return null
}
function trapOverlayFocus(e){
 if(e.key!=="Tab")return;const dialog=activeOverlayDialog();if(!dialog)return;
 const focusable=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(el=>el.getAttribute("aria-hidden")!=="true");
 if(!focusable.length){e.preventDefault();dialog.focus?.({preventScroll:true});return}
 const first=focusable[0],last=focusable.at(-1),active=document.activeElement;
 if(e.shiftKey&&(active===first||!dialog.contains(active))){e.preventDefault();last.focus({preventScroll:true})}
 else if(!e.shiftKey&&(active===last||!dialog.contains(active))){e.preventDefault();first.focus({preventScroll:true})}
}
document.addEventListener("keydown",e=>{
 trapOverlayFocus(e);
 if(e.key!=="Escape")return;
 if(!$("#battleSkillPopup").classList.contains("hide")){closeBattleSkillPopup();return}
 if(!$("#modalBack").classList.contains("hide")&&!G?.battle?.active)closeModal()
})

const WEB_UPDATE={
 manifest:"version.json",
 checking:false,
 available:null,
 timer:null
};
function parseVersionNumber(v){
 const m=String(v||"").match(/(\d+)\.(\d+)\.(\d+)/);
 return m?m.slice(1).map(Number):[0,0,0]
}
function compareGameVersion(a,b){
 const A=parseVersionNumber(a),B=parseVersionNumber(b);
 for(let i=0;i<3;i++){if(A[i]!==B[i])return A[i]-B[i]}
 return 0
}
function localGameVersion(){const packaged=document.querySelector('meta[name="app-version"]')?.content;return packaged||DB?.meta?.current_version||"CURRENT-0.0.0"}
function updateBannerHtml(info){
 const el=document.querySelector("#gameUpdateBanner");if(!el)return;
 if(!info){el.classList.add("hide");el.innerHTML="";return}
 el.innerHTML=`<b>發現新版本 ${info.version}</b><span>${info.summary||"遊戲已更新"}</span><button type="button" onclick="applyGameUpdate()">更新遊戲</button>`;
 el.classList.remove("hide")
}
function saveUpdateBackup(targetVersion){
 try{
   const raw=localStorage.getItem("yijie_luren_save");
   if(!raw)return null;
   const stamp=new Date().toISOString().replace(/[:.]/g,"-");
   const key=`yijie_luren_save_backup_${localGameVersion()}_to_${targetVersion}_${stamp}`;
   localStorage.setItem(key,raw);
   let index=JSON.parse(localStorage.getItem("yijie_luren_update_backups")||"[]");
   index.unshift({key,from:localGameVersion(),to:targetVersion,time:new Date().toISOString()});
   while(index.length>5){
     const old=index.pop();if(old?.key)localStorage.removeItem(old.key)
   }
   localStorage.setItem("yijie_luren_update_backups",JSON.stringify(index));
   return key
 }catch(e){console.warn("update backup failed",e);return null}
}
async function checkForGameUpdate(manual=false){
 if(WEB_UPDATE.checking)return null;
 WEB_UPDATE.checking=true;
 try{
   const sep=WEB_UPDATE.manifest.includes("?")?"&":"?";
   const res=await fetch(`${WEB_UPDATE.manifest}${sep}t=${Date.now()}`,{cache:"no-store"});
   if(!res.ok)throw new Error(`HTTP ${res.status}`);
   const info=await res.json();
   if(compareGameVersion(info.version,localGameVersion())>0){
     WEB_UPDATE.available=info;updateBannerHtml(info);
     if(manual)showModal("遊戲更新",`<div class="card"><b>${info.version}</b><br>${info.summary||""}<br><span class="small">${(info.changelog||[]).join("<br>")}</span></div><div class="actions"><button class="good" onclick="applyGameUpdate()">備份存檔並更新</button><button onclick="closeModal()">稍後</button></div>`);
     return info
   }
   WEB_UPDATE.available=null;updateBannerHtml(null);
   if(manual)showModal("遊戲更新",`<div class="card ok">目前已是最新版：${localGameVersion()}</div>`);
   return null
 }catch(e){
   console.warn("version check failed",e);
   if(manual)showModal("遊戲更新",`<div class="card warnText">目前無法連線檢查新版；不影響離線中的本地存檔。</div>`);
   return null
 }finally{WEB_UPDATE.checking=false}
}
function applyGameUpdate(){
 const info=WEB_UPDATE.available;if(!info)return;
 saveUpdateBackup(info.version);
 try{persist()}catch(e){}
 const u=new URL(location.href);
 u.searchParams.set("v",String(info.build||Date.now()));
 location.replace(u.toString())
}
function initWebUpdate(){
 WEB_UPDATE.available=null;updateBannerHtml(null);
 if(WEB_UPDATE.timer){clearInterval(WEB_UPDATE.timer);WEB_UPDATE.timer=null}
 let protocol="";
 try{protocol=new URL(location.href).protocol}catch(e){}
 if(!/^https?:$/.test(protocol))return null;
 checkForGameUpdate(false);
 WEB_UPDATE.timer=setInterval(()=>checkForGameUpdate(false),5*60*1000);
 return WEB_UPDATE.timer
}

window.addEventListener("load",()=>{init();initWebUpdate()},{once:true});
