const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const app=path.join(__dirname,"..","game");
const source=fs.readFileSync(path.join(app,"src/game-data.js"),"utf8");
const db=JSON.parse(source.slice(source.indexOf("=")+1,source.lastIndexOf(";")));
const context={DB:db};context.globalThis=context;vm.createContext(context);
for(const rel of ["src/combat-scale-v2.js","src/battle-art-catalog-v2.js","src/data-patches.js","src/asdail-depth-v2.js","src/political-region-pack-v1.js","src/portrait-index-v1.js"])vm.runInContext(fs.readFileSync(path.join(app,rel),"utf8"),context,{filename:rel});
const generated=context.DB.portrait_registry.generated_monster_ids;
assert.equal(generated.length,36,"every post-catalog monster must receive original portrait art");
assert.equal(context.DB.monsters.length,246);
assert.ok(context.DB.monsters.every(row=>row.portrait_uri&&row.battle_sprite_uri&&row.art_profile?.sprite));
for(const id of generated){const row=context.DB.monsters.find(monster=>monster.id===id);assert.ok(row,"generated monster must exist: "+id);assert.match(row.portrait_uri,/monsters\/generated\//);const file=path.join(app,row.portrait_uri);assert.ok(fs.existsSync(file),"missing portrait asset: "+id);assert.equal(fs.readFileSync(file).toString("ascii",0,4),"RIFF");}
for(const group of context.DB.portrait_registry.character_groups){const rows=context.DB[group]||[];assert.ok(rows.length>0,group+" must not be empty");assert.ok(rows.every(row=>row.portrait_uri&&row.battle_sprite_uri&&row.art_profile?.sprite),group+" must have indexed existing art");}
const audit=context.YijieBattleArt.audit();assert.equal(audit.pass,true);assert.equal(audit.characters,394);assert.equal(audit.generatedMonsterCount,36);
console.log("Portrait index regression passed: existing art retained; 36 missing monsters and 394 character records are fully indexed.");
