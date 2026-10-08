// 自動執行 tests/ 下所有 *.test.cjs，避免新增測試後忘記加入 package.json 而從未被執行。
// game-bundle.test.cjs 需要先 prepare:web 產生 /app 鏡像，所以由 npm test 的後段單獨執行。
// *.browser.cjs 需要 Playwright，由 Android 工作流程另行執行。
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const testsDir = path.join(__dirname, "..", "tests");
const SEPARATE = new Set(["game-bundle.test.cjs"]);
const files = fs.readdirSync(testsDir)
  .filter(name => name.endsWith(".test.cjs") && !SEPARATE.has(name))
  .sort();
if (!files.length) { console.error("No test files found in tests/"); process.exit(1); }

const failed = [];
for (const name of files) {
  const result = spawnSync(process.execPath, [path.join(testsDir, name)], { encoding: "utf8" });
  if (result.status === 0) {
    console.log("PASS " + name);
  } else {
    failed.push(name);
    console.log("FAIL " + name);
    process.stdout.write((result.stdout || "") + (result.stderr || ""));
  }
}
console.log(`\n${files.length - failed.length}/${files.length} test files passed.`);
if (failed.length) { console.error("Failed: " + failed.join(", ")); process.exit(1); }
