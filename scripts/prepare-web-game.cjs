const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "game");
const web = path.join(root, "www");
const app = path.join(web, "app");

async function copyTree(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) await copyTree(src, dst);
    else await fs.copyFile(src, dst);
  }
}

async function main() {
  const version = JSON.parse(await fs.readFile(path.join(source, "version.json"), "utf8"));
  if (!String(version.version || "").startsWith("CURRENT-")) throw new Error("異界旅人版本格式錯誤");

  await fs.rm(web, { recursive: true, force: true });
  await fs.mkdir(web, { recursive: true });
  await copyTree(source, app);

  const rootRedirect = `<!doctype html>
<html lang="zh-Hant"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
<meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0">
<title>異界旅人</title>
<style>html,body{height:100%;margin:0;background:#071014;color:#f4e6bd;font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif}body{display:grid;place-items:center;text-align:center}.box{padding:28px}.v{margin-top:10px;color:#d7bd72;font-weight:800}</style>
</head><body><div class="box"><h1>異界旅人</h1><div>正在切換至最新 App 同步版…</div><div class="v">${version.version}</div></div>
<script>
location.replace("./app/?build="+encodeURIComponent("${version.version}"));
</script></body></html>`;

  await fs.writeFile(path.join(web, "index.html"), rootRedirect);
  await fs.writeFile(path.join(web, "version.json"), JSON.stringify({
    game:"異界旅人",
    version:version.version,
    web_entry:"app/",
    exact_app_mirror:true,
    old_game_path_removed:true,
    old_play_path_removed:true
  }, null, 2) + "\n");
  await fs.writeFile(path.join(web, "web-build.json"), JSON.stringify({
    game:"異界旅人",
    version:version.version,
    source:"game",
    entry:"app/",
    exact_app_mirror:true,
    ui_transform:false,
    clean_rebuild:true,
    old_game_path_removed:true,
    old_play_path_removed:true,
    source_commit:process.env.GITHUB_SHA || null
  }, null, 2) + "\n");
  console.log("Built fresh exact App mirror at /app/ " + version.version);
}

main().catch(error=>{console.error(error);process.exitCode=1});
