const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "game", "src", "runtime.js"), "utf8");
const encounterPatch = fs.readFileSync(path.join(__dirname, "..", "game", "src", "gather-encounter-runtime.js"), "utf8");
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `runtime should define ${name}`);
  const end = source.indexOf("\n}", start);
  assert.notEqual(end, -1, `${name} should have a top-level closing brace`);
  return source.slice(start, end + 2);
}

const runAudit = extract("runAudit");
assert.doesNotMatch(runAudit, /runGeneratorAudit\s*\(/,
  "the twenty-turn gameplay audit must not rescan static world content during an action");
assert.match(source, /const AUDIT_INTERVAL_TURNS=20;/,
  "the lightweight gameplay audit must run every twenty turns");

const inventory = new Map([[
  "HERB", { id: "HERB", name: "藥草", type: "材料", wild_gather_eligible: true, acquisition_sources: [] }
]]);
const location = { id: "WILD-TEST", kind: "wild", gather: ["HERB"] };
const quest = {
  status: "active", templateId: "GATHER-HERB", target_spawn_boost: 1,
  viableLocationIds: [location.id],
  objective: { kind: "gather", item_id: "HERB", target: 5 }
};
const G = { turn: 0, worldState: {}, battle: null, character: { locationId: location.id, inventory: [] }, quests: [quest] };
const calls = { sync: 0, legacyProgress: 0, turnStarts: 0, endTurn: 0, encounterChecks: 0, battles: 0, errors: [] };
const context = {
  G,
  DB: { quest_system: { target_information_bonus: { gather_target_chance: 0.12 } } },
  console: { error: (...args) => calls.errors.push(args) },
  Math: Object.assign(Object.create(Math), { random: () => 0 }),
  loc: id => id === location.id ? location : null,
  item: id => inventory.get(id) || null,
  gatherEligiblePool: () => G.turn <= 3 ? ["HERB"] : [],
  hasTool: () => false,
  questTemplate: () => null,
  questViableLocations: () => [],
  encounterCandidates: () => [{ id: "WOLF", name: "野狼", tier: "F", hp: 10, encounter_weight: 1 }],
  encounterWeightForLocation: () => 1,
  activeKillQuestTargets: () => [],
  weightedPick: rows => rows[0][0],
  locationSafety: () => 70,
  safetyLabel: () => "需結伴",
  encounterChanceForLocation: () => 0.05,
  startBattle: (enemy, source) => { calls.battles++; G.battle = { active: true, enemy, context: source }; },
  clamp: (n, low, high) => Math.max(low, Math.min(high, n)),
  rand: () => 0,
  totalHours: () => 0,
  beginTurn: () => { calls.turnStarts++; G.turn++; return true; },
  checkRoll: () => 16,
  updateQuestProgress: () => { calls.legacyProgress++; },
  syncAllQuestInventoryProgress: () => {
    calls.sync++;
    const have = G.character.inventory.reduce((sum, row) => sum + (row.id === "HERB" ? row.qty : 0), 0);
    quest.progress = Math.min(quest.objective.target, have);
    if (have >= quest.objective.target) quest.status = "ready";
  },
  log: () => {},
  maybeEncounter: () => { calls.encounterChecks++; return false; },
  endTurn: () => { calls.endTurn++; },
  persist: () => {},
  renderAll: () => {}
};
vm.createContext(context);
vm.runInContext("window=globalThis", context);
vm.runInContext([
  extract("gatherResourceIds"), extract("activeGatherTarget"), extract("addItem"), extract("actGather"), encounterPatch
].join("\n"), context);
let harvestTaps = 0;
for (let i = 0; i < 20; i++) { harvestTaps++; vm.runInContext("actGather()", context); }
const herb = G.character.inventory.find(row => row.id === "HERB");
assert.equal(harvestTaps, 20, "the regression should attempt twenty consecutive harvest taps");
assert.equal(calls.turnStarts, 12, "the runtime should reject harvest actions while the forced battle is active");
assert.equal(G.turn, 12, "a forced encounter should stop further harvesting after twelve completed turns");
assert.equal(herb.qty, 9, "the first three stocked harvests should keep their three-item yield");
assert.equal(quest.status, "ready", "gather quest progress must still update after the batch");
assert.equal(calls.sync, 3, "quest inventory should sync once per harvest, not once per item");
assert.equal(calls.legacyProgress, 0, "gathered items should skip redundant per-item quest scans");
assert.equal(calls.endTurn, 12, "every completed harvest attempt, including depleted-resource attempts, should complete its turn");
assert.equal(calls.encounterChecks, 11, "empty-resource attempts must still run the normal encounter check before the guarantee");
assert.equal(calls.battles, 1, "a valid encounter pool must force a battle by the twelfth consecutive harvest attempt");
assert.equal(G.worldState.gatherEncounterPressure.actions, 0, "the persisted encounter streak should reset after the battle");
assert.equal(calls.errors.length, 0, "twenty consecutive harvest attempts should not throw");
const dataRoot = path.join(__dirname, "..", "game", "src");
const dataContext = {};
vm.createContext(dataContext);
for (const file of ["game-data.js", "data-patches.js", "asdail-depth-v2.js", "political-region-pack-v1.js"]) {
  vm.runInContext(fs.readFileSync(path.join(dataRoot, file), "utf8"), dataContext, { timeout: 15000, filename: file });
}
const encounterFunctions = ["tierOrder", "monsterEcology", "monsterFitsLocationEcology", "encounterCandidates"]
  .map(extract).join("\n");
vm.runInContext("const ENCOUNTER_CACHE=new Map();\n" + encounterFunctions, dataContext);
const unguardedGatherMaps = JSON.parse(vm.runInContext(
  "JSON.stringify(DB.locations.filter(l=>[\"wild\",\"dungeon\"].includes(l.kind)&&(l.gather||[]).some(id=>DB.items.some(x=>x.id===id&&x.wild_gather_eligible))&&!encounterCandidates(l).length).map(l=>l.id))",
  dataContext
));
assert.deepEqual(unguardedGatherMaps, [], "every active gatherable wild/dungeon location needs at least one eligible encounter");
console.log("PASS repeated harvest taps survive resource depletion, preserve quest progress, and force a valid encounter by turn 12 before later actions can run");
