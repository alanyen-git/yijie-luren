const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const stabilitySource = fs.readFileSync(path.join(root, "game/src/runtime-stability.js"), "utf8");
const runtimeSource = fs.readFileSync(path.join(root, "game/src/runtime.js"), "utf8");
const worldSource = fs.readFileSync(path.join(root, "game/src/world-autonomy-v2.js"), "utf8");
const battleUiSource = fs.readFileSync(path.join(root, "game/src/battle-ui-theme.js"), "utf8");
const inventoryUiSource = fs.readFileSync(path.join(root, "game/src/inventory-art-ui.js"), "utf8");
const eventUiSource = fs.readFileSync(path.join(root, "game/src/event-portrait-ui.js"), "utf8");

const storage = new Map();
const timers = [];
const classes = new Set();
const body = {
  classList: {
    toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
  },
  setAttribute() {},
  removeAttribute() {}
};
const calls = { begin: 0, end: 0, persist: 0, render: 0 };
const context = {
  G: { turn: 0, battle: null, character: { locationId: "WILD-TEST" } },
  console,
  Date,
  Error,
  performance: { now: (() => { let tick = 0; return () => ++tick; })() },
  document: { body },
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, String(value))
  },
  setTimeout: fn => { timers.push(fn); return timers.length; },
  clearTimeout: () => {},
  addEventListener: () => {},
  beginTurn() { calls.begin++; context.G.turn++; context.persist(); return true; },
  endTurn() { calls.end++; context.persist(); context.renderAll(); context.persist(); context.renderAll(); },
  persist() { calls.persist++; return true; },
  renderAll() { calls.render++; }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(stabilitySource, context, { filename: "runtime-stability.js" });

assert.equal(context.RUNTIME_STABILITY.version, "RUNTIME-STABILITY-1.0");
assert.equal(typeof context.exportRuntimeDiagnostics, "function", "diagnostics must be exportable from the installed runtime");
assert.equal(context.beginTurn("採集"), true);
context.persist();
context.renderAll();
assert.equal(context.beginTurn("重複採集"), false, "an in-flight action must reject a re-entrant tap");
for (let i = 0; i < 45; i++) context.beginTurn("連點壓力");
assert.ok(context.RUNTIME_STABILITY.recentDiagnostics().length <= 40, "the diagnostic ring must remain bounded");
context.endTurn(1);
assert.equal(calls.begin, 1);
assert.equal(calls.end, 1);
assert.equal(calls.persist, 1, "all save requests in one action must coalesce into one physical write");
assert.equal(calls.render, 1, "all render requests in one action must coalesce into one full render");
assert.equal(context.beginTurn("排隊中的連點"), false, "a tap queued immediately after commit must be dropped");
while (timers.length) timers.shift()();
assert.equal(context.beginTurn("下一個有效行動"), true);
context.endTurn(1);
assert.equal(calls.persist, 2);
assert.equal(calls.render, 2);
while (timers.length) timers.shift()();

assert.equal(context.beginTurn("故障行動"), true);
context.persist();
assert.equal(context.abortRuntimeAction(new Error("synthetic failure")), true);
assert.equal(calls.persist, 3, "an aborted action must make one recovery save");
assert.equal(calls.render, 3, "an aborted action must make one recovery render");
assert.equal(context.RUNTIME_STABILITY.snapshot().active, false, "abort must always release the action lock");
assert.ok(context.RUNTIME_STABILITY.recentDiagnostics().some(row => row.type === "action_abort"));

assert.match(runtimeSource, /const AUDIT_INTERVAL_TURNS=20;/, "runtime audit interval must be twenty turns");
assert.match(runtimeSource, /phase2Heartbeat\("turn"\)/, "world phase-two updates must finish before the action save");
assert.match(worldSource, /resourcePairsCache/, "world resource pairs must be cached");
assert.match(worldSource, /if\(heartbeatTimer!==null\)return/, "world heartbeat scheduling must coalesce duplicate requests");
assert.match(battleUiSource, /if\(decorateFrame\)return/, "battle mutation updates must be frame-coalesced");
assert.match(inventoryUiSource, /if\(decorateFrame\)return/, "inventory mutation updates must be frame-coalesced");
assert.match(eventUiSource, /if\(updateFrame\)return/, "event mutation updates must be frame-coalesced");

console.log("PASS action transactions coalesce saves/renders, block burst re-entry, recover errors, and keep scheduled work bounded");
