(()=>{"use strict";
// IJ-PORTRAIT-EXPANSION-2.0: dedicated atlas art for ecology gaps and world records.
const VER="IJ-PORTRAIT-EXPANSION-2.0";
const ROOT="./assets/art/three-head/expanded/";
const atlas=(sheet,index)=>{
 const slot=((Number(index)||0)%16+16)%16;
 return {src:ROOT+sheet+".webp",index:slot,columns:4,rows:4,column:slot%4,row:Math.floor(slot/4),atlas:true};
};
const words=record=>[record?.id,record?.name,record?.category,record?.role,record?.role_label,record?.combat_class_name,record?.epithet,record?.entity_type].filter(Boolean).join(" ");
const hash=value=>Array.from(String(value||""),char=>char.codePointAt(0)).reduce((total,code)=>(total*33+code)>>>0,5381);
function bind(record,kind,sheet,index,source){
 if(!record)return;
 const sprite=atlas(sheet,index);
 record.art_profile={version:VER,kind,source,sprite,portrait_uri:sprite.src,battle_sprite_uri:sprite.src};
 record.portrait_uri=sprite.src;
 record.battle_sprite_uri=sprite.src;
}
const ecology={
 fae:/妖精龍|仙女龍|花仙子|小妖精|皮克精|森林妖精|湖之仙女|妖精|皮克|仙女|小妖/,
 flora:/樹人|荊棘|蘑菇|南瓜|纏根|根脈|樹精|藤|食人花|植物|孢子|菌|苔/,
 aquatic:/人魚|娜迦|海怪|克拉肯|海德拉|水元素|沼澤鱷|巨龜|龍龜|沼泥|潮骨|潮洞|黑水|渠泥|咬魚|鉗蟹|盲鰻|鏡沼|水棲|河妖|海妖|水母|鱷|海/ 
};
const ecologicalCoverage={aquatic:[],flora:[],fae:[]};
for(const monster of DB.monsters||[]){
 // Original generated portraits remain untouched; this only replaces the old generic fallback.
 if(monster.art_profile?.source==="generated")continue;
 const text=[monster.id,monster.name].filter(Boolean).join(" ");
 const key=Object.keys(ecology).find(name=>ecology[name].test(text));
 if(!key)continue;
 const sheet=key==="aquatic"?"aquatic-monsters-v1":key==="flora"?"flora-monsters-v1":"fae-monsters-v1";
 bind(monster,"monster",sheet,hash(monster.id+monster.name),"dedicated-"+key+"-atlas");
 ecologicalCoverage[key].push(monster.id);
}
function bindRows(key,kind,sheet,source){
 for(const [index,record] of (DB[key]||[]).entries())bind(record,kind,sheet,index,source);
}
bindRows("party_member_templates","party_member","party-companions-v1","party-companion-atlas");
bindRows("regional_npc_archetypes","regional_npc","regional-npcs-v1","regional-npc-atlas");
for(const [index,record] of (DB.s_tier_combatants||[]).entries())bind(record,"s_tier_combatant",index<16?"s-tier-champions-a-v1":"s-tier-champions-b-v1",index%16,"s-tier-champion-atlas");
bindRows("eastern_sword_figures","eastern_sword_figure","eastern-swords-v1","eastern-sword-atlas");
bindRows("races","race","races-v1","race-atlas");
bindRows("companion_species","pet","pets-v1","pet-atlas");
bindRows("deities","deity","deities-v1","deity-atlas");
bindRows("pantheons","pantheon","deities-v1","pantheon-atlas");
for(const [index,record] of (DB.faith_entities||[]).entries())if(record.entity_type==="deity")bind(record,"deity","deities-v1",index,"deity-atlas");
const supplementalGroups=["races","companion_species","deities","pantheons"];
const sourceSet=new Set(["aquatic-monsters-v1","flora-monsters-v1","fae-monsters-v1","party-companions-v1","regional-npcs-v1","s-tier-champions-a-v1","s-tier-champions-b-v1","eastern-swords-v1","races-v1","pets-v1","deities-v1"]);
const previous=DB.portrait_registry||{};
DB.portrait_registry={...previous,version:VER,policy:"保留既有立繪；只為未覆蓋生態與缺欄位資料補上原創 4×4 三頭身圖集。水棲、植物、妖精各自使用專屬圖集，不得回退為史萊姆或狼。",atlas_sources:Array.from(sourceSet),ecological_coverage:ecologicalCoverage,supplemental_groups:supplementalGroups};
DB.meta.portrait_expansion_revision=VER;
const baseArt=globalThis.YijieBattleArt||{};
const legacyAudit=typeof baseArt.audit==="function"?baseArt.audit:null;
const rows=keys=>keys.flatMap(key=>DB[key]||[]);
const isComplete=row=>Boolean(row?.art_profile?.sprite&&row.portrait_uri&&row.battle_sprite_uri);
globalThis.YijieBattleArt={...baseArt,version:VER,
 raceById:id=>(DB.races||[]).find(row=>row.id===id)?.art_profile?.sprite||null,
 petById:id=>(DB.companion_species||[]).find(row=>row.id===id)?.art_profile?.sprite||null,
 deityById:id=>[...(DB.deities||[]),...(DB.faith_entities||[])].find(row=>row.id===id)?.art_profile?.sprite||null,
 audit:()=>{
  const legacy=legacyAudit?legacyAudit():{};
  const expanded=rows(["party_member_templates","regional_npc_archetypes","s_tier_combatants","eastern_sword_figures",...supplementalGroups]).every(isComplete);
  const ecologyPass=Object.values(ecologicalCoverage).flat().every(id=>{
   const source=(DB.monsters||[]).find(monster=>monster.id===id)?.art_profile?.source||"";
   return /^dedicated-(aquatic|flora|fae)-atlas$/.test(source);
  });
  return {...legacy,pass:Boolean(legacy.pass&&expanded&&ecologyPass),expandedPass:expanded&&ecologyPass,atlasSources:sourceSet.size,ecologicalCoverage:Object.fromEntries(Object.entries(ecologicalCoverage).map(([key,value])=>[key,value.length]))};
 }
};
})();
(()=>{"use strict";
// The dialogue shell is created later by event-portrait-ui; then replace its generic role art with the NPC's own atlas frame.
if(typeof document==="undefined")return;
const dialogueFrame=()=>document.querySelector("#modalBody > .art-dialogue-portrait");
const savedName=entry=>typeof entry==="string"?entry:String(entry?.name||"");
function regionalDialogueRecord(frame){
 const speaker=String(frame?.dataset?.speaker||"").split("｜")[0];
 const registry=typeof G!=="undefined"?G?.worldState?.namedDialogueNpcNames||{}:{};
 const id=Object.entries(registry).find(([,entry])=>savedName(entry)===speaker)?.[0];
 return (DB.regional_npc_archetypes||[]).find(record=>record.id===id)||null;
}
function paintRegionalDialogue(){
 const frame=dialogueFrame(),record=regionalDialogueRecord(frame),sprite=record?.art_profile?.sprite;
 if(!frame||!sprite?.src||(frame.dataset.atlasId===record.id&&frame.querySelector(".art-dialogue-atlas")))return;
 frame.querySelectorAll(":scope > .art-dialogue-painted, :scope > svg").forEach(node=>node.remove());
 const columns=Number(sprite.columns)||1,rows=Number(sprite.rows)||1,column=Number(sprite.column)||0,row=Number(sprite.row)||0;
 const art=document.createElement("span");art.className="art-dialogue-painted art-dialogue-atlas";art.setAttribute("aria-hidden","true");
 art.style.backgroundImage=`url("${sprite.src}")`;art.style.backgroundSize=`${columns*100}% ${rows*100}%`;art.style.backgroundPosition=`${columns>1?column/(columns-1)*100:0}% ${rows>1?row/(rows-1)*100:0}%`;
 frame.dataset.atlasId=record.id;frame.insertBefore(art,frame.firstChild);
}
let queued=false;function scheduleRegionalDialogue(){if(queued)return;queued=true;const run=()=>{queued=false;paintRegionalDialogue()};typeof requestAnimationFrame==="function"?requestAnimationFrame(run):setTimeout(run,16)}
const body=document.querySelector("#modalBody");if(body)new MutationObserver(scheduleRegionalDialogue).observe(body,{childList:true,subtree:true,characterData:true});scheduleRegionalDialogue();
})();
