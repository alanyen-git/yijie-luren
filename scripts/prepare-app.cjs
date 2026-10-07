const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "game");
const web = path.join(root, "www");

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
  await fs.access(path.join(source, "project.json"));
  await fs.rm(web, { recursive: true, force: true });
  await copyTree(source, web);
  const version = JSON.parse(await fs.readFile(path.join(source, "version.json"), "utf8"));
  await fs.writeFile(path.join(web, "build-info.json"), JSON.stringify({
    game: "異界旅人",
    target: "android",
    version: version.version,
    source: "game",
    source_commit: process.env.GITHUB_SHA || null
  }, null, 2) + "\n");
  console.log("Prepared 異界旅人 Android bundle from " + version.version);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
