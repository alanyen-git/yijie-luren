// 驗證「名稱 ↔ 共用立繪」配對正確，並確認所有立繪檔案真實存在。
// 期望值刻意與 battle-art-catalog-v2.js 的規則分開撰寫，避免規則與測試一起被改壞。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const app = path.join(__dirname, "..", "game");
const source = fs.readFileSync(path.join(app, "src/game-data.js"), "utf8");
const db = JSON.parse(source.slice(source.indexOf("=") + 1, source.lastIndexOf(";")));
const context = { DB: db }; context.globalThis = context; vm.createContext(context);
for (const rel of ["src/combat-scale-v2.js", "src/battle-art-catalog-v2.js", "src/data-patches.js", "src/asdail-depth-v2.js", "src/political-region-pack-v1.js", "src/portrait-index-v1.js"]) {
  vm.runInContext(fs.readFileSync(path.join(app, rel), "utf8"), context, { filename: rel });
}
const DB = context.DB;
const sharedIndex = (uri, kind) => { const m = new RegExp(`battle-${kind}-(\\d+)\\.webp$`).exec(uri || ""); return m ? Number(m[1]) : null; };
const problems = [];

// --- 怪物：依名稱判斷應使用的共用生態圖（先命中者優先；專屬圖的怪物不在此列）---
const monsterExpect = [
  [/骸骨龍|屍龍|骸骨九頭蛇|幽靈龍/, 12],
  [/骷髏|殭屍|食屍鬼|屍妖|幽靈|怨靈|惡靈|女妖|吸血鬼|木乃伊|巫妖|死神|骸骨巨人/, 7],
  [/龍|蜥蜴|蛇|蟒|鱷|龜|美杜莎|海德拉|娜迦/, 12],
  [/蜘蛛|蠍|殺人蜂|甲蟲|蟻后/, 13],
  [/鷹|鴉|貓頭鷹|蝙蝠|獅鷲/, 14],
  [/鼠/, 15],
  [/史萊姆/, 0],
  [/魔像|石像鬼|石巨人|土元素/, 9],
  [/^(獸人|獸人戰士|半獸人|食人魔|雙頭食人魔|巨魔|山丘巨人|火巨人|牛頭人|獨眼巨人)$/, 6],
  [/^狼人/, 2]
];
const monsters = DB.monsters.filter(m => !/monsters\/generated\//.test(m.portrait_uri || ""));
assert.ok(monsters.length >= 200, "legacy monsters must be present");
for (const m of monsters) {
  const rule = monsterExpect.find(([re]) => re.test(m.name));
  if (!rule) continue;
  const actual = sharedIndex(m.portrait_uri, "monsters");
  if (actual !== rule[1]) problems.push(`monster ${m.name}: expected shared art #${rule[1]} but got #${actual}`);
}

// --- 職業 ---
const classExpect = [
  [/劍舞者/, 0],
  [/刺客|影刃客|影舞者|雙刃客/, 7],
  [/弓|獵|遊俠|巡林客/, 5],
  [/^(盜賊|斥候)$/, 6],
  [/白魔導士|先知|預言家|驅魔人|牧師|祭司|神官|聖職者|聖者/, 9],
  [/僧侶|武僧/, 12],
  [/吟遊詩人|^舞者$/, 13],
  [/鍊金/, 14],
  [/召喚|馴龍師|精靈使/, 10],
  [/聖騎|聖劍士|聖武士|聖盾|守誓/, 1],
  [/黑魔導士|詛咒師|死靈法師|魔女|血法師|巫師/, 11]
];
for (const c of DB.combat_classes) {
  const rule = classExpect.find(([re]) => re.test(c.name));
  if (!rule) continue;
  const actual = sharedIndex(c.portrait_uri, "heroes");
  if (actual !== rule[1]) problems.push(`class ${c.name}: expected shared art #${rule[1]} but got #${actual}`);
}
// 同一分類的職業不應全部共用同一張吟遊詩人圖（舊錯誤：整個「遊俠／盜賊／吟遊系」都拿到吟遊詩人）
const bardArt = DB.combat_classes.filter(c => sharedIndex(c.portrait_uri, "heroes") === 13).map(c => c.name);
assert.ok(bardArt.length <= 3, "only bard/dancer classes may use the bard portrait, got: " + bardArt.join(","));
const dragonish = DB.monsters.filter(m => /龍$/.test(m.name) && !/generated/.test(m.portrait_uri) && sharedIndex(m.portrait_uri, "monsters") === 13);
assert.equal(dragonish.length, 0, "dragons must not use the spider portrait");

// --- 檔案必須真的存在且為有效 WebP ---
const checked = new Map();
const checkFile = (uri, label) => {
  if (!uri) { problems.push(`${label}: missing portrait path`); return; }
  if (checked.has(uri)) return;
  const file = path.join(app, uri); let ok = fs.existsSync(file);
  if (ok) { const head = fs.readFileSync(file).subarray(0, 12); ok = head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP"; }
  checked.set(uri, ok); if (!ok) problems.push(`${label}: portrait file missing or not a valid WebP: ${uri}`);
};
const groups = ["combat_classes", "monsters", "party_member_templates", "regional_npc_archetypes", "s_tier_combatants", "eastern_sword_figures"];
for (const key of groups) for (const row of DB[key]) { checkFile(row.portrait_uri, `${key}/${row.id}`); checkFile(row.battle_sprite_uri, `${key}/${row.id} battle`); }

assert.deepEqual(problems, [], "portrait problems:\n" + problems.join("\n"));
console.log(`PASS portrait mapping is consistent (${monsters.length} legacy monsters, ${DB.combat_classes.length} classes, ${checked.size} image files verified).`);
