const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const app = path.join(root, "game");
const project = JSON.parse(fs.readFileSync(path.join(app, "project.json"), "utf8"));
assert.equal(project.repository, "alanyen-git/yijie-luren");
assert.equal(project.independent, true);
for (const file of ["index.html","manifest.webmanifest","sw.js","assets/css/game.css","assets/css/app-theme.css","assets/art/yijie-party-portraits.svg","assets/art/battle-sd-portraits.svg","assets/art/three-head/characters-three-head-v1.webp","assets/art/three-head/monsters-three-head-v1.webp","assets/art/three-head/monsters-expanded-three-head-v1.webp","assets/art/three-head/classes-three-head-v1.webp","assets/art/three-head/npcs-three-head-v1.webp","assets/art/maps/willow-town.svg","assets/art/maps/old-forest.svg","assets/art/maps/stone-vault.svg","assets/art/maps/mountain-pass.svg","assets/art/maps/river-valley.svg","assets/art/maps/region-atlas.svg","assets/art/maps/terrain-scenes.svg","assets/art/event-scenes.svg","assets/art/ui/equipment-display.svg","assets/art/town/facility-interiors.svg","assets/art/town/shop-badges-v1.webp","./assets/art/town/shops/general.webp","./assets/art/town/shops/blacksmith.webp","./assets/art/town/shops/alchemy.webp","./assets/art/town/shops/tailor.webp","./assets/art/town/shops/guild.webp","./assets/art/town/shops/church.webp","./assets/art/town/shops/tavern.webp","./assets/art/town/shops/inn.webp","./assets/art/town/shops/clinic.webp","./assets/art/town/shops/enchanter.webp","./assets/art/town/shops/mageguild.webp", "assets/art/town/facility-buildings.svg","src/battle-ui-theme.js","src/mobile-map-ui.js","src/town-home-ui.js","src/facility-shop-ui.js","src/event-portrait-ui.js","assets/art/npc-portrait-sprites.svg","src/inventory-art-ui.js","assets/art/item-skill-icons.svg","src/game-data.js","src/runtime.js","src/runtime-stability.js","src/gather-encounter-runtime.js","src/equipment-detail-ui.js","src/data-patches.js","src/pwa.js","src/political-region-pack-v1.js","src/combat-scale-v2.js","src/battle-art-catalog-v2.js"]) {
  assert.ok(fs.existsSync(path.join(app, file)), "missing imported app file: " + file);
}
const html = fs.readFileSync(path.join(app, "index.html"), "utf8");
const version = JSON.parse(fs.readFileSync(path.join(app, "version.json"), "utf8"));
assert.ok(html.includes(version.version), "app title must match the published version");
assert.ok(html.includes("<title>異界旅人 " + version.version + "</title>"), "standalone app title must be 異界旅人");
const packagedVersion = html.match(/<meta name="app-version" content="([^"]+)">/);
assert.ok(packagedVersion, "standalone app must expose its packaged version");
assert.equal(packagedVersion[1], version.version, "packaged version must match version.json");
const runtimeSource = fs.readFileSync(path.join(app, "src/runtime.js"), "utf8");
assert.ok(runtimeSource.includes('meta[name="app-version"]'), "web updater must compare against packaged app version");
const mapSource = fs.readFileSync(path.join(app, "src/xuanyuan-map-ui.js"), "utf8");
const battleTheme = fs.readFileSync(path.join(app, "src/battle-ui-theme.js"), "utf8");
const mapTheme = fs.readFileSync(path.join(app, "assets/css/app-theme.css"), "utf8");
const emptyRealmResult = {};
const emptyRealmContext = {
  DB: {
    realm_region_maps: [{ id: "realm-empty", political_entity_id: "polity-empty", name: "雲杉王國", province_region_ids: [] }],
    world_regions: [
      { id: "region-core", name: "杉影高地", terrain: "山地", political_entity_id: "polity-empty" },
      { id: "region-unrelated", name: "遠海群島", terrain: "礁島", political_entity_id: "other-polity" }
    ]
  },
  window: null,
  realmRegionMap: () => ({ id: "realm-empty", political_entity_id: "polity-empty", name: "雲杉王國", province_region_ids: [] }),
  politicalEntity: id => ({ id, name: "雲杉王國", core_region_id: "region-core" }),
  showModal: (title, html) => Object.assign(emptyRealmResult, { title, html })
};
emptyRealmContext.window = emptyRealmContext;
vm.createContext(emptyRealmContext);
vm.runInContext(mapSource, emptyRealmContext);
emptyRealmContext.xuRealm("realm-empty");
assert.match(emptyRealmResult.html, /此政體目前尚未登錄行省級地圖資料/);
assert.match(emptyRealmResult.html, /世界/);
assert.match(emptyRealmResult.html, /已登錄核心地理區域（非行省）/);
assert.match(emptyRealmResult.html, /杉影高地/);
assert.match(emptyRealmResult.html, /地形：山地/);
assert.match(emptyRealmResult.html, /地理區域不代表行政區/);
assert.doesNotMatch(emptyRealmResult.html, /遠海群島/);
assert.doesNotMatch(emptyRealmResult.html, /xuProvince\(/);
assert.ok(mapSource.includes("world-map-v1.png")&&mapSource.includes("kingdom-map-v1.png")&&mapSource.includes("local-map-v1.png"), "world, kingdom, province and local maps use original detailed map art");
assert.ok(mapSource.includes('"local-map-v1.png"'), "outdoor and dungeon locations render the detailed local map");
assert.ok(mapSource.includes("exploreState"), "map locations must reflect current and previously visited places");
assert.ok(mapSource.includes("openMapLocationDetail"), "wild and dungeon map nodes must retain location details");
assert.ok(mapTheme.includes("XUANYUAN-MAP-UI-1.2"), "five-layer map art and exploration layout must be present");
assert.ok(mapSource.includes("function local(id)"), "province map must open the local-area layer");
assert.ok(mapSource.includes("function locationMap(id)"), "wild and dungeon nodes must open their illustrated location layer");
assert.ok(mapSource.includes("window.openSettlementRegionMap=local"), "existing settlement-map entrypoint must route to local-area map");
const manifest = JSON.parse(fs.readFileSync(path.join(app, "manifest.webmanifest"), "utf8"));
assert.equal(manifest.name, "異界旅人");
assert.equal(manifest.short_name, "異界旅人");
assert.ok(html.includes('src/game-data.js'));
assert.ok(html.includes('src/runtime.js'));
assert.ok(html.includes('src/combat-scale-v2.js'), "balanced 2x combat scale must load");
assert.ok(html.includes('src/battle-art-catalog-v2.js'), "full class/monster art catalog must load");
const combatScaleSource = fs.readFileSync(path.join(app, "src/combat-scale-v2.js"), "utf8");
const battleArtCatalog = fs.readFileSync(path.join(app, "src/battle-art-catalog-v2.js"), "utf8");
assert.ok(combatScaleSource.includes('IJ-COMBAT-SCALE-2.0') && combatScaleSource.includes('multiplier:2'));
assert.ok(battleArtCatalog.includes('IJ-ART-CATALOG-2.0'));

assert.ok(html.includes('src/runtime-stability.js'));
assert.ok(html.includes('src/gather-encounter-runtime.js'));
assert.ok(fs.readFileSync(path.join(app, "sw.js"), "utf8").includes('"./src/gather-encounter-runtime.js"'));
assert.ok(fs.readFileSync(path.join(app, "sw.js"), "utf8").includes('"./src/runtime-stability.js"'));
assert.ok(html.includes('assets/css/app-theme.css'));
assert.ok(html.includes('src/mobile-map-ui.js'));
assert.ok(html.includes('src/battle-ui-theme.js'));
assert.ok(!html.includes("dalu-game-web"));
assert.ok(fs.statSync(path.join(app, "src/game-data.js")).size > 3000000);
assert.ok(html.includes('src/town-home-ui.js'), "town home module must load");
assert.ok(html.includes('src/event-portrait-ui.js'), "event portraits must load");
assert.ok(html.includes('src/npc-speaker.js'), "regional dialogue speaker resolver must load");
assert.ok(html.includes('src/inventory-art-ui.js'), "inventory and skill icons must load");
assert.ok(html.includes('src/equipment-detail-ui.js'),"equipment detail module must load after runtime");
assert.ok(fs.readFileSync(path.join(app,"src/inventory-art-ui.js"),"utf8").includes("item-skill-icons.svg#"), "inventory art uses original SVG icons");
const inventoryArt=fs.readFileSync(path.join(app,"src/inventory-art-ui.js"),"utf8");
const itemSkillIcons=fs.readFileSync(path.join(app,"assets/art/item-skill-icons.svg"),"utf8");
for(const icon of ["heal","shield","poison","lightning","summon","status"])assert.ok(itemSkillIcons.includes(`symbol id="${icon}"`),"skill effect art must exist for "+icon);
assert.ok(inventoryArt.includes("const skillRules=")&&inventoryArt.includes("add(el,el.textContent||\"\",true)"),"skills must select effect-specific icons");
assert.equal(version.item_skill_icon_revision,"ITEM-SKILL-ICONS-2.0");
const iconSandbox={window:{},document:{querySelector:()=>null},MutationObserver:class{},requestAnimationFrame:fn=>fn()};
vm.runInNewContext(inventoryArt.replace("function iconFor","window.iconFor=iconFor; function iconFor"),iconSandbox);
assert.equal(iconSandbox.window.iconFor("治療術",true),"heal");
assert.equal(iconSandbox.window.iconFor("盾牆",true),"shield");
assert.equal(iconSandbox.window.iconFor("連鎖閃電",true),"lightning");
assert.equal(iconSandbox.window.iconFor("召喚靈獸",true),"summon");
assert.equal(iconSandbox.window.iconFor("生命藥劑",false),"potion");
assert.equal(iconSandbox.window.iconFor("鐵盾",false),"armor");
assert.ok(fs.readFileSync(path.join(app,"assets/art/maps/stone-vault.svg"),"utf8").includes("connected chamber rooms"), "dungeon artwork must include rooms and corridors");
assert.equal(html.includes('data-nav="adventure"'), false, "legacy adventure-home nav must be gone");
assert.ok(html.includes('data-nav="home"'), "town map is the home nav");
const townHome = fs.readFileSync(path.join(app, "src/town-home-ui.js"), "utf8");
assert.ok(townHome.includes("dataset.locationId"), "town map must expose active location state for scene styling");
assert.ok(townHome.includes("townHomeActions"), "actions must appear inside the town-map page");
assert.ok(townHome.includes("xuRouteMapForLocation"),"town and wilderness exits must use the clickable shared map");
assert.ok(townHome.includes("town-map-building-badge")&&!townHome.includes("facility-buildings.svg#")&&mapTheme.includes(".town-map-building-badge"),"town home replaces old storefront icons with forged shop badges");
assert.ok(mapSource.includes('call("travel",l.id,Number(route.hours)||1)')&&mapSource.includes("routeCanvas(nodes,edges"),"road pins must pass the destination and route duration into travel");
assert.ok(mapSource.includes("window.xuFacility=function(id)"),"town building taps must be connected to facility interactions");
assert.ok(mapSource.includes("xu-facility-badge")&&!mapSource.includes("facility-buildings.svg#")&&mapTheme.includes(".xu-facility-badge"),"layered town map replaces storefront icons with forged shop badges");
assert.ok(runtimeSource.includes("arrivalRoute")&&runtimeSource.includes("前往此地"),"an adjacent map destination must offer a direct travel action");
assert.ok(runtimeSource.includes('data-sheet="characters"')&&runtimeSource.includes("xuan-painted-sprite")&&!runtimeSource.includes("battle-sd-portraits.svg#"),"party profile must use detailed painted character portraits");
assert.ok(!townHome.includes("town-home-shortcuts"),"duplicate character shortcuts must be removed from the town-map page");
assert.ok(["character","inventory","quest","more"].every(key=>html.includes('data-nav="'+key+'"')),"fixed bottom navigation must retain character, inventory, quest, and more entries");
assert.equal(runtimeSource.includes('add("城鎮設施","openFacilities()")'), false, "generic town-facilities action must be removed");
assert.ok(fs.readFileSync(path.join(app, "assets/css/app-theme.css"), "utf8").includes("XUANYUAN-HOME-1.0"));
assert.ok(mapTheme.includes("XUANYUAN-REGION-ATLAS-1.0"), "new regional map art styles must be present");
assert.ok(fs.readFileSync(path.join(app,"src/runtime.js"),"utf8").includes("facility-interiors.svg#${fid}"), "facility entries must render a matching original indoor scene");
assert.ok(runtimeSource.includes("xu-party-formation"), "character data must show the active party visually");
assert.ok(!runtimeSource.includes("equipment-art-hero"), "equipment view must not render the old hero banner");
assert.ok(fs.readFileSync(path.join(app,"src/event-portrait-ui.js"),"utf8").includes("event-scenes.svg#"), "story and event scenes must use original illustrations");
assert.ok(battleTheme.includes("xuan-hit-fx"), "battle actions must show animated hit feedback");
assert.ok(battleTheme.includes('document.getElementById("battleBack")'),"battle styling observes the bounded dynamic encounter surface");
assert.ok(!battleTheme.includes('classList.add("xuan-unit-card",extra)'),"battle class tokens are applied individually");
assert.equal(version.battle_ui_revision,"BATTLE-REFERENCE-3.0");
assert.ok(battleTheme.includes("xuan-stage-figures")&&battleTheme.includes("xuan-command-panel"),"battle scene arranges SD units and illustrated commands");
assert.match(version.home_ui_revision,/^TOWN-MAP-HOME-\d+\.\d+$/,"home UI revision must remain versioned");
assert.match(version.facility_shop_ui_revision,/^FACILITY-[A-Z-]+-\d+\.\d+$/,"facility UI revision must remain versioned");
const facilityUiSource=fs.readFileSync(path.join(app,"src/facility-shop-ui.js"),"utf8");
assert.ok(html.indexOf("src/runtime.js")<html.indexOf("src/facility-shop-ui.js"),"facility interaction override must load after the game runtime");
assert.ok(facilityUiSource.includes("xu-store-actions-primary")&&facilityUiSource.includes("assets/art/town/shops/"),"facility screens need original shop illustrations and service controls");
assert.ok(battleTheme.includes("xuan-battle-stage")&&battleTheme.includes("xuan-party-status")&&mapTheme.includes("XUANYUAN-BATTLE-FIELD-LAYOUT-1.0"),"battle uses a full field scene and bottom party status row");
const sw = fs.readFileSync(path.join(app, "sw.js"), "utf8");
const cacheMarker = 'CACHE_NAME=CACHE_PREFIX+"v';
const cacheOffset = sw.indexOf(cacheMarker);
const cacheVersion = cacheOffset < 0 ? 0 : Number(sw.slice(cacheOffset + cacheMarker.length).split('"')[0]);
assert.ok(cacheVersion > 34, "illustrated App updates must advance the offline cache");
assert.ok(sw.includes('"./assets/css/polish-v1.css"'), "the refined App skin must be included in the offline cache");
const portraitArt = fs.readFileSync(path.join(app,"assets/art/npc-portrait-sprites.svg"),"utf8");
const portraitUI = fs.readFileSync(path.join(app,"src/event-portrait-ui.js"),"utf8");
for (const role of ["healer","guardian","mage","innkeeper"]) {
  assert.ok(portraitArt.includes(`<symbol id="${role}"`), `${role} portrait art must exist`);
  assert.ok(portraitUI.includes(`id:"${role}"`), `${role} must be selectable from dialogue`);
}
const paintedTheme=fs.readFileSync(path.join(app,"assets/css/polish-v1.css"),"utf8");
assert.ok(html.includes("assets/css/polish-v1.css"),"painted sprite styling must load");
for(const asset of ["characters-three-head-v1.webp","monsters-three-head-v1.webp"])assert.ok(sw.includes(asset),"painted sprite sheets must be cached offline: "+asset);
assert.ok(battleTheme.includes("xuan-painted-sprite")&&battleTheme.includes('["monsters",3]'),"battle roles and common monsters must use detailed sprite sheets");
assert.ok(portraitUI.includes("art-dialogue-painted"),"dialogue roles must render the painted three-head art");
assert.ok(paintedTheme.includes("characters-three-head-v1.webp")&&paintedTheme.includes("monsters-three-head-v1.webp"),"painted sprite sheets must use their intended CSS crops");
for (const art of ["willow-town.svg", "old-forest.svg", "stone-vault.svg", "mountain-pass.svg", "river-valley.svg", "npc-portrait-sprites.svg", "item-skill-icons.svg", "region-atlas.svg", "facility-interiors.svg", "terrain-scenes.svg", "event-scenes.svg", "equipment-display.svg", "facility-buildings.svg","shop-badges-v1.webp"]) assert.ok(sw.includes(art), "scene artwork must be included in the offline cache");
assert.ok(battleTheme.includes("dataset.scene"), "battle background art must follow the current game region");
assert.ok(mapTheme.includes("XUANYUAN-BATTLE-SCENE-1.0"), "battle UI must reuse region scene artwork");
assert.ok(mapTheme.includes("XUANYUAN-DATA-UI-1.0"), "data screens must share the antique interface style");
assert.ok(mapTheme.includes("XUANYUAN-DIALOGUE-ART-1.0"), "event and character artwork styling must be present");
assert.ok(mapTheme.includes("XUANYUAN-ARTKIT-0.1"), "original scene art styles must be present");
assert.equal(version.scene_art_revision, "ORIGINAL-MAP-SCENES-3.0");
assert.ok(mapSource.includes('?"mountain":') && mapSource.includes('?"river":'), "wilderness map selects terrain art by location context");
require("./apk-update.test.cjs");
require("./map-controls.test.cjs");
require("./npc-speaker.test.cjs");
require("./equipment-detail-ui.test.cjs");
console.log("Independent 異界旅人 game source and project identity are present.");

const mapControls=fs.readFileSync(path.join(app,"src/map-controls.js"),"utf8");
assert.ok(html.includes('src/map-controls.js'),"map controls must load in the standalone app");
assert.ok(mapControls.includes("放大地圖")&&mapControls.includes("縮小地圖")&&mapControls.includes("重設為初始 3 倍視野"),"map controls must be accessible");
assert.ok(mapControls.includes("pointermove")&&mapControls.includes("translate("),"map must support touch panning");
assert.ok(cacheVersion > 34&&sw.includes("map-controls.js"),"map controls must ship in a fresh offline cache");
assert.equal(version.map_ui_revision,"XUANYUAN-MAP-UI-1.21");
assert.equal(version.regional_map_revision,"REGIONAL-MAP-SCENES-1.5");
const regionAtlas=fs.readFileSync(path.join(app,"assets/art/maps/region-atlas.svg"),"utf8");
for(const scene of ["region-islands","region-steppe","region-forest","region-highland","region-marsh","region-desert","region-city","region-riverland"])assert.ok(regionAtlas.includes(`symbol id="${scene}"`),"regional scene art must exist for "+scene);
assert.ok(mapSource.includes("function regionalScene(text)")&&mapSource.includes("kingdom-map-v1.png"),"administrative maps use the kingdom scale illustration");

const dungeonMap=fs.readFileSync(path.join(app,"src/xuanyuan-map-ui.js"),"utf8");
assert.ok(dungeonMap.includes("function dungeonIndex(l)")&&dungeonMap.includes("G.explorationIntel"),"dungeon map must reflect saved exploration records");
assert.ok(sw.includes("npc-speaker.js"),"regional speaker resolver must be available offline");
assert.ok(sw.includes("equipment-detail-ui.js"),"equipment detail module must be available offline");
assert.equal(version.character_equipment_revision,"EQUIPMENT-DETAIL-1.0");
assert.ok(dungeonMap.includes("encounter_profile")&&dungeonMap.includes("xu-dungeon-index"),"dungeon scenes and indexes must use existing dungeon data");
assert.ok(mapTheme.includes("XUANYUAN-DUNGEON-INDEX-1.0"),"dungeon discovery index must use responsive original styling");
assert.equal(version.dungeon_index_revision,"DUNGEON-INDEX-1.0");
const dbSource=fs.readFileSync(path.join(app,"src/game-data.js"),"utf8");
const db=JSON.parse(dbSource.slice(dbSource.indexOf("=")+1,dbSource.lastIndexOf(";")));
{
 const sandbox={DB:db,globalThis:null};sandbox.globalThis=sandbox;
 vm.createContext(sandbox);
 vm.runInContext(combatScaleSource,sandbox);
 vm.runInContext(battleArtCatalog,sandbox);
 assert.equal(sandbox.DB.combat_number_scale.multiplier,2);
 assert.equal(sandbox.DB.combat_classes.length,100);
 assert.ok(sandbox.DB.monsters.length>=210);
 assert.ok(sandbox.DB.combat_classes.every(x=>x.portrait_uri&&x.battle_sprite_uri));
 assert.ok(sandbox.DB.monsters.every(x=>x.portrait_uri&&x.battle_sprite_uri));
 assert.equal(sandbox.YijieBattleArt.audit().pass,true);
}

const dungeons=db.locations.filter(x=>x.kind==="dungeon");
assert.equal(dungeons.length,18,"index should cover every existing dungeon");
for(const dungeon of dungeons){assert.ok(Array.isArray(dungeon.explore)&&dungeon.explore.length===5,dungeon.id+" must have five source exploration points");assert.equal(dungeon.explore.reduce((sum,x)=>sum+(Number(x[1])||0),0),100,dungeon.id+" exploration weights must total 100");}

const portraitSource=fs.readFileSync(path.join(app,"src/event-portrait-ui.js"),"utf8");
assert.ok(portraitSource.includes('body.querySelector(".card b")')&&portraitSource.includes("speakerPortraits"),"dialogue portraits must prefer the source speaker role");
assert.ok(portraitSource.includes("art-dialogue-speaker")&&portraitSource.includes('identity.name+"，"+identity.role'),"speaker name and source role must be visible and accessible");
assert.ok(portraitSource.includes("identity?.visualStyle")&&portraitSource.includes("culture-"),"regional dialogue portraits must receive a source culture style");
assert.ok(portraitSource.includes('portraitAllowed=/・對話$/.test(title)||/^人物資料$/.test(title)')&&portraitSource.includes("if(!portraitAllowed||!target)"),"general interfaces must not display character portraits");
assert.ok(!portraitSource.includes("portraits.find(x=>x.keys.test(text))"),"portrait selection must not scan generic modal text");
const portraitAssets=fs.readFileSync(path.join(app,"assets/art/npc-portrait-sprites.svg"),"utf8");
for(const style of ["asdale_west","valrek_imperial","free_city","elven","dwarven","beast_steppe","dark_elf"])assert.ok(portraitAssets.includes("culture-"+style),"regional portrait art must exist for "+style);
assert.equal(version.regional_portrait_revision,"REGIONAL-PORTRAIT-1.1");
assert.ok(mapTheme.includes("XUANYUAN-DIALOGUE-SPEAKER-1.0"),"speaker role captions must use responsive original styling");
assert.equal(version.dialogue_portrait_revision,"DIALOGUE-PORTRAIT-1.1");

const npcSpeakerSource=fs.readFileSync(path.join(app,"src/npc-speaker.js"),"utf8");
assert.ok(npcSpeakerSource.includes("DB.regional_npc_archetypes")&&npcSpeakerSource.includes("generateWorldName"),"dialogue identities must use source archetypes and the existing naming AI");
assert.ok(npcSpeakerSource.includes("namedDialogueNpcNames"),"generated identities and encounter records must persist in an optional save extension");
assert.ok(npcSpeakerSource.includes("function openJournal()")&&npcSpeakerSource.includes("function openProfile(id)"),"journal and profile views must use saved encounters and source archetypes");
assert.equal(version.named_dialogue_npc_revision,"REGIONAL-NPC-JOURNAL-1.2");

assert.ok(mapTheme.includes("REGIONAL-NPC-SPEAKER-1.0"),"regional speaker labels must stay readable on mobile");

assert.ok(portraitSource.includes('/・對話$/.test(title)'),"named identities must only be created in facility dialogue windows");


const regionPackSource = fs.readFileSync(path.join(app,"src/political-region-pack-v1.js"),"utf8");
const regionIndexText = fs.readFileSync(path.join(app,"index.html"),"utf8");
const regionSwText = fs.readFileSync(path.join(app,"sw.js"),"utf8");
assert.ok(regionIndexText.indexOf("src/asdail-depth-v2.js") < regionIndexText.indexOf("src/political-region-pack-v1.js"),"region pack must load before runtime indexing");
assert.ok(cacheVersion > 34&&regionSwText.includes("./src/political-region-pack-v1.js"),"the new region pack must be cached offline");
assert.equal(version.political_region_revision,"FROSTHORN-REGION-PACK-1.0");
const regionFixture = {
  meta:{},
  political_entities:[{id:"POL-016",name:"霜角酋邦",core_region_id:"REG-16"}],
  world_regions:[{id:"REG-16",name:"霜角高地",political_entity_id:"POL-016",terrain:"高山谷地"}],
  realm_region_maps:[{id:"RMAP-POL-016",name:"霜角酋邦區域地圖",political_entity_id:"POL-016",core_region_id:"REG-16",province_region_ids:[]}],
  province_region_maps:[],settlement_region_maps:[],locations:[],regional_npc_archetypes:[],
  dialogue_database:{records:[]},monsters:[],quest_templates:[],adventure_event_templates:[]
};
vm.runInNewContext(regionPackSource,{DB:regionFixture});
const regionProvince=regionFixture.province_region_maps.find(x=>x.id==="PROV-016-FROST-VALLEY");
assert.ok(regionProvince,"霜角核心行省級區域 must be registered");
assert.ok(regionFixture.realm_region_maps[0].province_region_ids.includes(regionProvince.id),"realm map must link to the new province");
assert.equal(regionFixture.world_regions[0].province_region_id,regionProvince.id,"core geography must link to its first playable province");
const regionLocations=regionFixture.locations.filter(x=>x.political_entity_id==="POL-016");
for(const [kind,count] of [["town",2],["wild",2],["dungeon",2]])assert.equal(regionLocations.filter(x=>x.kind===kind).length,count,"region must have "+count+" "+kind+" locations");
const regionLocationIds=new Set(regionLocations.map(x=>x.id));
for(const place of regionLocations){
  for(const link of place.links||[]){
    assert.ok(regionLocationIds.has(link.to),place.id+" route target must exist");
    assert.ok(regionFixture.locations.find(x=>x.id===link.to).links.some(x=>x.to===place.id),place.id+" route must be reciprocal");
  }
  if(place.settlement_region_id)assert.ok(regionFixture.settlement_region_maps.some(x=>x.id===place.settlement_region_id),"place must link to its local area");
}
for(const id of [...regionProvince.all_settlement_ids,...regionProvince.wild_location_ids,...regionProvince.dungeon_location_ids])assert.ok(regionLocationIds.has(id),"province index must reference a registered location");
for(const area of regionFixture.settlement_region_maps)for(const id of area.location_ids)assert.ok(regionLocationIds.has(id),"local area must reference registered locations");
for(const npc of regionFixture.regional_npc_archetypes)assert.ok(regionLocationIds.has(npc.location_id),"NPC archetype must have a local location");
assert.ok(!Array.isArray(regionFixture.dialogue_database)&&regionFixture.dialogue_database.records.length===4,"regional dialogue must append without replacing the dialogue database object");
for(const dialogue of regionFixture.dialogue_database.records)assert.ok(regionFixture.regional_npc_archetypes.some(x=>x.id===dialogue.speaker_id),"dialogue speaker must resolve to an NPC archetype");
for(const monster of regionFixture.monsters)assert.ok(regionLocations.some(x=>(x.encounter_tags||[]).some(tag=>(monster.habitats||[]).includes(tag))),"regional monster habitats must match a local encounter tag");
for(const quest of regionFixture.quest_templates)assert.ok((quest.recommended_locations||[]).every(id=>regionLocationIds.has(id)),"regional quest targets must exist");
for(const event of regionFixture.adventure_event_templates)assert.ok((event.location_ids||[]).every(id=>regionLocationIds.has(id)),"regional event targets must exist");
const onceCounts=[regionFixture.locations.length,regionFixture.regional_npc_archetypes.length,regionFixture.dialogue_database.records.length,regionFixture.quest_templates.length,regionFixture.adventure_event_templates.length];
vm.runInNewContext(regionPackSource,{DB:regionFixture});
assert.deepEqual([regionFixture.locations.length,regionFixture.regional_npc_archetypes.length,regionFixture.dialogue_database.records.length,regionFixture.quest_templates.length,regionFixture.adventure_event_templates.length],onceCounts,"loading the region pack twice must not duplicate data");
const regionMapUiSource=fs.readFileSync(path.join(app,"src/xuanyuan-map-ui.js"),"utf8");
const mapContext={
  DB:regionFixture,rendered:null,
  realmRegionMap:id=>regionFixture.realm_region_maps.find(x=>x.id===id),
  provinceRegion:id=>regionFixture.province_region_maps.find(x=>x.id===id),
  politicalEntity:id=>regionFixture.political_entities.find(x=>x.id===id),
  worldRegion:id=>regionFixture.world_regions.find(x=>x.id===id),
  areas:id=>regionFixture.settlement_region_maps.filter(x=>x.parent_province_region_id===id),
  getLoc:id=>regionFixture.locations.find(x=>x.id===id),
  provinceCategoryLocations:(p,k)=>regionFixture.locations.filter(x=>x.province_region_id===p.id&&x.kind===(k==="town"?"town":k==="wild"?"wild":"dungeon")),
  exploreState:()=>"未探索",esc:x=>String(x),
  call:(name,id)=>name+"("+id+")",crumb:(name)=>"<b>"+name+"</b>",
  node:(name,meta,action,kind)=>"<button data-kind='"+kind+"'>"+name+" "+meta+"</button>",
  frame:(name,crumbs,body)=>"<main>"+crumbs+body+"</main>",
  board:(kind,body)=>"<section data-map='"+kind+"'>"+body+"</section>",
  regionalScene:()=>""
};
mapContext.window=mapContext;
const visitedFacilities=[];mapContext.visitFacility=id=>visitedFacilities.push(id);
mapContext.showModal=(title,html)=>{mapContext.rendered={title,html}};
vm.createContext(mapContext);
vm.runInContext(regionMapUiSource,mapContext);
mapContext.xuFacility("general");assert.deepEqual(visitedFacilities,["general"],"shop pin must dispatch to the facility interaction");
mapContext.xuRealm("RMAP-POL-016");
assert.match(mapContext.rendered.html,/霜角高地會盟領/,"realm map must expose the new province node");
mapContext.xuProvince("PROV-016-FROST-VALLEY");
for(const name of ["霜角石圈聚落區","白角溪寨聚落區"])assert.ok(mapContext.rendered.html.includes(name),"province map must expose local area "+name);
assert.match(mapContext.rendered.html,/class="xu-route-marker is-area/,"province local areas must be clickable map pins");
assert.ok(mapContext.rendered.html.includes("xuLocal("),"province area pins must open their real local road map");
for(const area of regionFixture.settlement_region_maps){mapContext.xuLocal(area.id);for(const id of area.location_ids){const place=regionFixture.locations.find(x=>x.id===id);assert.ok(mapContext.rendered.html.includes(place.name),"local map must expose "+place.name)}}

const battleArt = fs.readFileSync(path.join(app, "src/battle-ui-theme.js"), "utf8");
const dialoguePortraitCode = fs.readFileSync(path.join(app, "src/event-portrait-ui.js"), "utf8");
const serviceWorker = fs.readFileSync(path.join(app, "sw.js"), "utf8");
assert.match(battleArt, /dragon:\["monstersExpanded",0\].*golem:\["monstersExpanded",1\].*raider:\["monstersExpanded",2\].*elemental:\["monstersExpanded",3\]/);
assert.match(dialoguePortraitCode, /guild:\{sheet:"npcs",index:0\}.*merchant:\{sheet:"npcs",index:1\}.*artisan:\{sheet:"npcs",index:2\}.*scholar:\{sheet:"npcs",index:3\}/);
assert.equal(serviceWorker.match(/CACHE_PREFIX\+"(v\d+)"/)?.[1], version.pwa_cache_revision, "service-worker cache must match app version metadata");
assert.match(serviceWorker, /three-head\/npcs-three-head-v1\.webp/);
assert.match(serviceWorker, /three-head\/monsters-expanded-three-head-v1\.webp/);

const classPickerMatch = battleArt.match(/const classPick=.*?};/);
assert.ok(classPickerMatch, "party and player portraits must use a role-aware class mapper");
const classPicker = vm.runInNewContext("(" + classPickerMatch[0].replace(/^const classPick=/, "").replace(/;$/, "") + ")");
const classDataSource = fs.readFileSync(path.join(app, "src/game-data.js"), "utf8");
const classCatalog = JSON.parse(classDataSource.slice(classDataSource.indexOf("=")+1,classDataSource.lastIndexOf(";")));
assert.equal(classCatalog.combat_classes.length, 100, "portrait coverage must track the complete combat class catalog");
const coveredClassTypes = new Set(classCatalog.combat_classes.map(entry => classPicker(entry.name)));
assert.deepEqual([...coveredClassTypes].sort(), ["druid", "healer", "knight", "mage", "rogue", "scout", "spellblade", "warrior"]);
assert.match(battleArt, /knight:\["classes",0\].*rogue:\["classes",1\].*druid:\["classes",2\].*spellblade:\["classes",3\]/);

assert.match(serviceWorker, /three-head\/classes-three-head-v1\.webp/);

require("./gather-regression.test.cjs");
