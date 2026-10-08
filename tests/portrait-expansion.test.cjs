const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const app=path.join(__dirname,"..","game");
const source=fs.readFileSync(path.join(app,"src/game-data.js"),"utf8");
const DB=JSON.parse(source.slice(source.indexOf("=")+1,source.lastIndexOf(";")));
const context={DB};context.globalThis=context;vm.createContext(context);
for(const rel of ["src/combat-scale-v2.js","src/battle-art-catalog-v2.js","src/data-patches.js","src/asdail-depth-v2.js","src/political-region-pack-v1.js","src/portrait-index-v1.js","src/portrait-expansion-v2.js"])vm.runInContext(fs.readFileSync(path.join(app,rel),"utf8"),context,{filename:rel});
const atlasRoot="./assets/art/three-head/expanded/";
const atlasNames=["aquatic-monsters-v1","flora-monsters-v1","fae-monsters-v1","party-companions-v1","regional-npcs-v1","s-tier-champions-a-v1","s-tier-champions-b-v1","eastern-swords-v1","races-v1","pets-v1","deities-v1"];
for(const name of atlasNames){const file=path.join(app,atlasRoot,name+".webp");assert.ok(fs.existsSync(file),"missing generated atlas: "+name);assert.equal(fs.readFileSync(file).toString("ascii",0,4),"RIFF",name+" must be a WebP asset");}
const rows=key=>context.DB[key]||[];
const spriteKey=row=>`${row.art_profile?.sprite?.src}#${row.art_profile?.sprite?.index}`;
for(const key of ["party_member_templates","regional_npc_archetypes","s_tier_combatants","eastern_sword_figures","races","companion_species","deities","pantheons"]){assert.ok(rows(key).length,key+" must exist");assert.ok(rows(key).every(row=>row.portrait_uri&&row.battle_sprite_uri&&row.art_profile?.sprite),key+" must have fully indexed portraits");}
assert.equal(new Set(rows("party_member_templates").map(spriteKey)).size,16,"200 party templates must use the full 16-frame companion atlas");
assert.equal(new Set(rows("regional_npc_archetypes").map(spriteKey)).size,16,"regional NPCs must use the full 16-frame NPC atlas");
assert.equal(new Set(rows("s_tier_combatants").map(spriteKey)).size,30,"every S-tier combatant must receive a distinct frame across both champion atlases");
assert.equal(new Set(rows("eastern_sword_figures").map(spriteKey)).size,10,"every eastern sword figure must receive a distinct frame");
assert.equal(new Set(rows("races").map(spriteKey)).size,15,"every race must receive its own portrait frame");
assert.equal(new Set(rows("companion_species").map(spriteKey)).size,16,"pet portraits must use a 16-frame dedicated atlas");
for(const [id,sheet] of [["MON14-198","aquatic-monsters-v1"],["MON14-199","aquatic-monsters-v1"],["MON14-174","flora-monsters-v1"],["MON14-175","flora-monsters-v1"],["MON14-180","fae-monsters-v1"],["MON14-182","fae-monsters-v1"]]){const monster=rows("monsters").find(row=>row.id===id);assert.ok(monster,"required ecological monster missing: "+id);assert.match(monster.portrait_uri,new RegExp(`expanded/${sheet}\\.webp$`),monster.name+" must use its dedicated ecology atlas");assert.doesNotMatch(monster.portrait_uri,/battle-monsters-(0|2)\.webp$/,monster.name+" must not fall back to beast/slime art");}
assert.ok(context.DB.portrait_registry.ecological_coverage.aquatic.length>=6,"water ecology needs dedicated coverage");
assert.ok(context.DB.portrait_registry.ecological_coverage.flora.length>=5,"plant ecology needs dedicated coverage");
assert.ok(context.DB.portrait_registry.ecological_coverage.fae.length>=6,"fae ecology needs dedicated coverage");
assert.deepEqual([...context.DB.portrait_registry.atlas_sources].sort(),[...atlasNames].sort(),"portrait registry must disclose every generated atlas");
const audit=context.YijieBattleArt.audit();assert.equal(audit.pass,true);assert.equal(audit.expandedPass,true);assert.equal(audit.atlasSources,11);
const html=fs.readFileSync(path.join(app,"index.html"),"utf8");const theme=fs.readFileSync(path.join(app,"src/battle-ui-theme.js"),"utf8");
assert.ok(html.includes("src/portrait-expansion-v2.js"),"portrait expansion must load before the runtime");
assert.ok(theme.includes("ij-atlas-sheet")&&theme.includes("backgroundSize"),"battle portrait renderer must crop 4×4 atlas frames");
assert.ok(theme.includes("member?.templateId")&&theme.includes("petById"),"battle companions must consume their data-bound portrait records");
assert.ok(fs.readFileSync(path.join(app,"src/portrait-expansion-v2.js"),"utf8").includes("art-dialogue-atlas"),"regional dialogue must replace generic role art with its own atlas frame");
const sw=fs.readFileSync(path.join(app,"sw.js"),"utf8");assert.ok(sw.includes('CACHE_NAME=CACHE_PREFIX+"v86"'),"portrait assets must advance the offline cache");for(const name of atlasNames)assert.ok(sw.includes(`expanded/${name}.webp`),name+" must be cached offline");
console.log("Portrait expansion regression passed: ecology gaps, 394 character records, races, pets, and deities use dedicated indexed portrait atlases.");
