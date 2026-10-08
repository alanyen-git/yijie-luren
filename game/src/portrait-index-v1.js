(()=>{"use strict";
// IJ-PORTRAIT-INDEX-1.0: run after all world-data expansion packs.
// Existing art is retained; only rows with no earlier visual assignment receive a record.
const VER="IJ-PORTRAIT-INDEX-1.0";
const generatedMonsterArt=Object.freeze({
 "MON-ASD-001":"./assets/art/three-head/monsters/generated/asdail-01-01.webp",
 "MON-ASD-002":"./assets/art/three-head/monsters/generated/asdail-01-02.webp",
 "MON-ASD-003":"./assets/art/three-head/monsters/generated/asdail-01-03.webp",
 "MON-ASD-004":"./assets/art/three-head/monsters/generated/asdail-01-04.webp",
 "MON-ASD-005":"./assets/art/three-head/monsters/generated/asdail-01-05.webp",
 "MON-ASD-006":"./assets/art/three-head/monsters/generated/asdail-01-06.webp",
 "MON-ASD-007":"./assets/art/three-head/monsters/generated/asdail-01-07.webp",
 "MON-ASD-008":"./assets/art/three-head/monsters/generated/asdail-01-08.webp",
 "MON-ASD-009":"./assets/art/three-head/monsters/generated/asdail-01-09.webp",
 "MON-ASD-010":"./assets/art/three-head/monsters/generated/asdail-02-01.webp",
 "MON-ASD-011":"./assets/art/three-head/monsters/generated/asdail-02-02.webp",
 "MON-ASD-012":"./assets/art/three-head/monsters/generated/asdail-02-03.webp",
 "MON-ASD2-001":"./assets/art/three-head/monsters/generated/asdail-02-04.webp",
 "MON-ASD2-002":"./assets/art/three-head/monsters/generated/asdail-02-05.webp",
 "MON-ASD2-003":"./assets/art/three-head/monsters/generated/asdail-02-06.webp",
 "MON-ASD2-004":"./assets/art/three-head/monsters/generated/asdail-02-07.webp",
 "MON-ASD2-005":"./assets/art/three-head/monsters/generated/asdail-02-08.webp",
 "MON-ASD2-006":"./assets/art/three-head/monsters/generated/asdail-02-09.webp",
 "MON-ASD2-007":"./assets/art/three-head/monsters/generated/asdail-03-01.webp",
 "MON-ASD2-008":"./assets/art/three-head/monsters/generated/asdail-03-02.webp",
 "MON-ASD2-009":"./assets/art/three-head/monsters/generated/asdail-03-03.webp",
 "MON-ASD2-010":"./assets/art/three-head/monsters/generated/asdail-03-04.webp",
 "MON-ASD2-011":"./assets/art/three-head/monsters/generated/asdail-03-05.webp",
 "MON-ASD2-012":"./assets/art/three-head/monsters/generated/asdail-03-06.webp",
 "MON-ASD2-013":"./assets/art/three-head/monsters/generated/asdail-03-07.webp",
 "MON-ASD2-014":"./assets/art/three-head/monsters/generated/asdail-03-08.webp",
 "MON-ASD2-015":"./assets/art/three-head/monsters/generated/asdail-03-09.webp",
 "MON-ASD2-016":"./assets/art/three-head/monsters/generated/asdail-04-01.webp",
 "MON-ASD2-017":"./assets/art/three-head/monsters/generated/asdail-04-02.webp",
 "MON-ASD2-018":"./assets/art/three-head/monsters/generated/asdail-04-03.webp",
 "MON-ASD2-019":"./assets/art/three-head/monsters/generated/asdail-04-04.webp",
 "MON-ASD2-020":"./assets/art/three-head/monsters/generated/asdail-04-05.webp",
 "MON-REG16-001":"./assets/art/three-head/monsters/generated/asdail-04-06.webp",
 "MON-REG16-002":"./assets/art/three-head/monsters/generated/asdail-04-07.webp",
 "MON-REG16-003":"./assets/art/three-head/monsters/generated/asdail-04-08.webp",
 "MON-REG16-004":"./assets/art/three-head/monsters/generated/asdail-04-09.webp"
});
const sprite=(src,index=0)=>({src,index,columns:1,rows:1,column:0,row:0});
const sharedSprite=(sheet,index)=>({src:`./assets/art/three-head/${sheet}-three-head-v1.webp`,index,columns:4,rows:1,column:index,row:0});
function bindGeneratedMonster(monster){
 const src=generatedMonsterArt[monster.id];
 if(!src||monster.portrait_uri)return;
 const art=sprite(src,monster.id);
 monster.art_profile={version:VER,kind:"monster",source:"generated",sprite:art,portrait_uri:src,battle_sprite_uri:src};
 monster.portrait_uri=src;monster.battle_sprite_uri=src;
}
function visualIndex(record,fallback=0){
 const type=String(record.type||"");
 const text=[record.name,record.role,record.class_name,record.combat_role,record.weapon_group,type].filter(Boolean).join(" ");
 if(type==="healer"||/治療|醫師|牧師|祭司|神官|聖職|療傷/.test(text))return 1;
 if(type==="mage"||/法師|術士|魔導|巫|咒術|鍊金|元素/.test(text))return 2;
 if(type==="scout"||/斥候|遊俠|獵人|弓|盜賊|刺客|旅人|巡林|探索/.test(text))return 3;
 return fallback;
}
function bindSharedPortrait(rows,sheet){
 for(const record of rows||[]){
  if(record.portrait_uri||record.art_profile)continue;
  const art=sharedSprite(sheet,visualIndex(record));
  record.art_profile={version:VER,kind:"character",source:"existing-shared",sprite:art,portrait_uri:art.src,battle_sprite_uri:art.src};
  record.portrait_uri=art.src;record.battle_sprite_uri=art.src;
 }
}
for(const monster of DB.monsters||[])bindGeneratedMonster(monster);
bindSharedPortrait(DB.party_member_templates,"characters");
bindSharedPortrait(DB.regional_npc_archetypes,"npcs");
bindSharedPortrait(DB.s_tier_combatants,"classes");
bindSharedPortrait(DB.eastern_sword_figures,"classes");
const characterGroups=["party_member_templates","regional_npc_archetypes","s_tier_combatants","eastern_sword_figures"];
const allCharacters=()=>characterGroups.flatMap(key=>DB[key]||[]);
const baseArt=globalThis.YijieBattleArt||{};
globalThis.YijieBattleArt={...baseArt,version:VER,
 characterById:id=>allCharacters().find(row=>row.id===id)?.art_profile?.sprite||null,
 audit:()=>({
  pass:[...(DB.combat_classes||[]),...(DB.monsters||[]),...allCharacters()].every(row=>row.art_profile?.sprite&&row.portrait_uri&&row.battle_sprite_uri),
  classes:(DB.combat_classes||[]).length,
  monsters:(DB.monsters||[]).length,
  characters:allCharacters().length,
  generatedMonsterCount:Object.keys(generatedMonsterArt).length
 })
};
DB.portrait_registry={version:VER,policy:"保留既有立繪；僅為後續資料包中缺漏的怪物新增原創立繪，角色改用既有共用立繪並建立明確索引。",generated_monster_ids:Object.keys(generatedMonsterArt),character_groups:characterGroups};
DB.meta.portrait_index_revision=VER;
})();
