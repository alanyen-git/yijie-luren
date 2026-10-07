const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const runtimeSource = fs.readFileSync(path.join(root, "game/src/runtime.js"), "utf8");
const retentionLimit = Number(runtimeSource.match(/HISTORY_RETENTION_LIMIT=(\d+)/)?.[1]);
const displayLimit = Number(runtimeSource.match(/HISTORY_DISPLAY_LIMIT=(\d+)/)?.[1]);
assert.ok(retentionLimit > 0, "history retention must have a positive cap");
assert.ok(displayLimit > 0, "visible history must have a positive cap");
assert.ok(runtimeSource.includes("function migrateSave(){\n if(G)G.history=retainRecentHistory(G.history);"), "legacy saves must be trimmed during load");
assert.ok(runtimeSource.includes("if(G)G.history=retainRecentHistory(G.history,{turn:G.turn"), "new log entries must use bounded retention");
assert.ok(runtimeSource.includes("el.appendChild(d);trimHistoryLog(el);"), "live log elements must be trimmed after append");
assert.ok(runtimeSource.includes("slice(-HISTORY_DISPLAY_LIMIT)"), "redrawn history must honor the visible cap");

function extractFunction(name) {
  const start = runtimeSource.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "missing function " + name);
  const open = runtimeSource.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < runtimeSource.length; i++) {
    if (runtimeSource[i] === "{") depth++;
    else if (runtimeSource[i] === "}" && --depth === 0) return runtimeSource.slice(start, i + 1);
  }
  throw new Error("could not extract function " + name);
}

const context = vm.createContext({});
vm.runInContext(
  "const HISTORY_RETENTION_LIMIT=" + retentionLimit + "; const HISTORY_DISPLAY_LIMIT=" + displayLimit + ";\n" +
    extractFunction("retainRecentHistory") + "\n" +
    extractFunction("trimHistoryLog") + "\n" +
    "globalThis.retainRecentHistory=retainRecentHistory; globalThis.trimHistoryLog=trimHistoryLog;",
  context
);

let history = Array.from({ length: retentionLimit + 275 }, (_, turn) => ({ turn, tag: "舊紀錄" }));
history = context.retainRecentHistory(history);
assert.equal(history.length, retentionLimit, "loading a legacy save must bound stored history");
assert.equal(history[0].turn, 275, "legacy trimming must keep the newest entries");

for (let turn = 0; turn < 1000; turn++) {
  history = context.retainRecentHistory(history, { turn, tag: "採集", text: "木材×1" });
}
assert.equal(history.length, retentionLimit, "repeated gathering logs must stay bounded");
assert.equal(history[0].turn, 500, "repeated gathering must discard the oldest entries");
assert.equal(history.at(-1).turn, 999, "repeated gathering must retain the newest entry");

const logElement = {
  children: [],
  get firstElementChild() { return this.children[0] || null; },
  removeChild(entry) {
    const index = this.children.indexOf(entry);
    if (index < 0) throw new Error("expected a visible history entry");
    this.children.splice(index, 1);
  }
};
for (let id = 0; id < 1000; id++) {
  logElement.children.push({ id });
  context.trimHistoryLog(logElement);
}
assert.equal(logElement.children.length, displayLimit, "live DOM history must stay bounded");
assert.equal(logElement.children[0].id, 1000 - displayLimit, "live DOM must keep the newest entries");

console.log("History retention regression passed.");

