const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "game", "src", "game-data.js"), "utf8");
const DB = JSON.parse(source.slice("const DB=".length, source.lastIndexOf("};") + 1));
const weapons = DB.items.filter(i => i.type === "主武器" && i.weapon_profile);
assert.ok(weapons.length > 80, "weapon catalog must be loaded");

const GROUPS = new Set(["長劍", "巨劍", "匕首", "徒手", "斧錘", "長槍", "弓", "弩", "法杖", "投擲", "其他"]);
const MELEE = new Set(["長劍", "巨劍", "匕首", "徒手", "斧錘", "長槍"]);
const RANGED = new Set(["弓", "弩"]);
const problems = [];

for (const w of weapons) {
  const p = w.weapon_profile;
  const label = `${w.id} ${w.name}`;
  if (!GROUPS.has(p.group)) problems.push(`${label}: unknown weapon group "${p.group}"`);
  // 名稱是杖／魔導書（錘類除外）就必須是法杖，並使用法杖的射程與手數規則
  const isStaffByName = /杖|魔導書/.test(w.name) && !/MACE/.test(w.id) && w.catalog_subcategory !== "錘";
  if (isStaffByName) {
    if (p.group !== "法杖") problems.push(`${label}: named as a staff but group is "${p.group}"`);
    if (w.catalog_subcategory !== "法杖魔導具") problems.push(`${label}: staff must use subcategory 法杖魔導具, got "${w.catalog_subcategory}"`);
  }
  if (p.group === "法杖") {
    if (!(p.range >= 12)) problems.push(`${label}: staff range ${p.range} is too short`);
    if (w.required_stats && w.required_stats["力量"]) problems.push(`${label}: caster staff must not require 力量`);
  }
  if (MELEE.has(p.group) && !(p.range > 0 && p.range <= 3)) problems.push(`${label}: melee range ${p.range} out of bounds`);
  if (RANGED.has(p.group) && !(p.range >= 20)) problems.push(`${label}: ranged range ${p.range} too short`);
  if (w.catalog_subcategory === "劍" && !["長劍", "巨劍"].includes(p.group)) problems.push(`${label}: sword subcategory with group "${p.group}"`);
  if (w.catalog_subcategory === "法杖魔導具" && p.group !== "法杖") problems.push(`${label}: staff subcategory with group "${p.group}"`);
}
// 起始武器、招牌武器必須存在且為武器
const byId = new Map(DB.items.map(i => [i.id, i]));
for (const c of DB.combat_classes) {
  for (const key of ["starter_weapon_id", "weapon"]) {
    const it = byId.get(c[key]);
    if (!it || it.type !== "主武器") problems.push(`class ${c.id}: ${key} "${c[key]}" is not a main-hand weapon`);
  }
}
assert.deepEqual(problems, [], "weapon data inconsistencies:\n" + problems.join("\n"));
console.log(`PASS weapon data is consistent (${weapons.length} weapons checked, ${DB.combat_classes.length} classes).`);
