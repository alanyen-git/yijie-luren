const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.join(__dirname, "..");
const source = path.join(root, "game");
const web = path.join(root, "www");
const app = path.join(web, "app");

const rootVersion=JSON.parse(fs.readFileSync(path.join(web,"version.json"),"utf8"));
const build=JSON.parse(fs.readFileSync(path.join(web,"web-build.json"),"utf8"));
const rootHtml=fs.readFileSync(path.join(web,"index.html"),"utf8");
const appVersion=JSON.parse(fs.readFileSync(path.join(app,"version.json"),"utf8"));

assert.equal(rootVersion.version,appVersion.version);
assert.equal(rootVersion.web_entry,"app/");
assert.equal(rootVersion.exact_app_mirror,true);
assert.equal(rootVersion.old_game_path_removed,true);
assert.equal(rootVersion.old_play_path_removed,true);
assert.equal(build.entry,"app/");
assert.equal(build.exact_app_mirror,true);
assert.equal(build.ui_transform,false);
assert.equal(fs.existsSync(path.join(web,"game")),false,"old /game/ must not exist");
assert.equal(fs.existsSync(path.join(web,"play")),false,"old /play/ must not exist");
assert.ok(rootHtml.includes("./app/"));

const digest=file=>crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
for(const rel of [
 "index.html","version.json","manifest.webmanifest","sw.js",
 "src/runtime.js","src/game-data.js","src/town-home-ui.js","src/combat-scale-v2.js","src/battle-art-catalog-v2.js",
 "assets/css/game.css","assets/css/app-theme.css","assets/css/polish-v1.css","assets/css/character-creation.css"
]){
 const src=path.join(source,rel), dst=path.join(app,rel);
 assert.ok(fs.existsSync(dst),"App mirror missing "+rel);
 assert.equal(digest(dst),digest(src),"Web /app/ must exactly equal App source: "+rel);
}

const appHtml=fs.readFileSync(path.join(app,"index.html"),"utf8");
const townHome=fs.readFileSync(path.join(app,"src/town-home-ui.js"),"utf8");
const runtime=fs.readFileSync(path.join(app,"src/runtime.js"),"utf8");
assert.ok(!appHtml.includes("NEW WEB"));
assert.ok(!appHtml.includes("web-build-badge"));
assert.ok(!appHtml.includes("WEB 2.0"));
assert.ok(!appHtml.includes("冒險指揮台"));
assert.ok(townHome.includes("異界旅人・旅途據點"));
assert.ok(townHome.includes("柳橋鎮")||townHome.includes("townHomePlace"));
assert.ok(townHome.includes("世界地圖"));
assert.ok(townHome.includes("設定"));
assert.ok(townHome.includes("當地地圖"));
assert.ok(townHome.includes("ensureTownHome"));
assert.ok(runtime.includes('if(typeof window.renderTownHome==="function")window.renderTownHome()'));
console.log("PASS fresh /app/ is exact current App mirror; old /game/ and /play/ absent.");
