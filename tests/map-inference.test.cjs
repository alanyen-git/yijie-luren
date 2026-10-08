const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const app=path.join(__dirname,"..","game");
const source=fs.readFileSync(path.join(app,"src/game-data.js"),"utf8");
const db=JSON.parse(source.slice(source.indexOf("=")+1,source.lastIndexOf(";")));
const context={DB:db};
context.globalThis=context;
vm.createContext(context);
for(const rel of ["src/data-patches.js","src/asdail-depth-v2.js","src/political-region-pack-v1.js","src/map-inference-pack-v1.js"]){
  vm.runInContext(fs.readFileSync(path.join(app,rel),"utf8"),context,{filename:rel});
}

const DB=context.DB;
const registry=DB.map_inference_registry;
assert.equal(registry.version,"MAP-INFERENCE-1.0");
assert.equal(registry.generated.length,15,"all sovereign maps without authored provinces receive a background map chain");
assert.equal(registry.coverage.nodes_per_province.town,2);
assert.equal(registry.coverage.nodes_per_province.wild,2);
assert.equal(registry.coverage.nodes_per_province.dungeon,2);

const provinces=new Map((DB.province_region_maps||[]).map(row=>[row.id,row]));
const locals=new Map((DB.settlement_region_maps||[]).map(row=>[row.id,row]));
const locations=new Map((DB.locations||[]).map(row=>[row.id,row]));
for(const item of registry.generated){
  const realm=(DB.realm_region_maps||[]).find(row=>row.id===item.realm_map_id);
  const province=provinces.get(item.province_region_id);
  assert.ok(realm,"inferred realm must exist: "+item.realm_map_id);
  assert.ok(realm.province_region_ids.includes(item.province_region_id),"realm links inferred province: "+item.realm_map_id);
  assert.ok(province,"inferred province must exist: "+item.province_region_id);
  assert.equal(province.parent_realm_map_id,item.realm_map_id);
  assert.equal(province.map_status,"mapped_background");
  assert.equal(province.all_location_ids.length,6);
  assert.equal(item.settlement_region_ids.length,2);
  assert.equal(item.location_ids.length,6);
  for(const localId of item.settlement_region_ids){
    const local=locals.get(localId);
    assert.ok(local,"inferred local region must exist: "+localId);
    assert.equal(local.parent_province_region_id,item.province_region_id);
    assert.ok(locations.has(local.center_location_id),"local center exists: "+localId);
  }
  for(const locationId of item.location_ids){
    const location=locations.get(locationId);
    assert.ok(location,"inferred location must exist: "+locationId);
    assert.equal(location.province_region_id,item.province_region_id);
    assert.equal(location.realm_region_map_id,item.realm_map_id);
    assert.equal(location.travel_unlock,"unavailable_until_story_or_permit","background data never unlocks travel");
    for(const link of location.links||[]){
      const target=locations.get(link.to);
      assert.ok(target,"inferred route target exists: "+locationId+" -> "+link.to);
      assert.equal(target.province_region_id,item.province_region_id,"inferred routes do not cross into existing playable regions");
      assert.ok((target.links||[]).some(back=>back.to===locationId),"inferred routes are bidirectional: "+locationId+" -> "+link.to);
    }
  }
}

const sovereignRealms=(DB.realm_region_maps||[]).filter(row=>row.political_entity_id);
assert.ok(sovereignRealms.every(row=>Array.isArray(row.province_region_ids)&&row.province_region_ids.length>0),"every sovereign realm can now drill down to a province map");
console.log("Map inference regression passed: 15 realms, 15 provinces, 30 local maps, and 90 gated background nodes.");
