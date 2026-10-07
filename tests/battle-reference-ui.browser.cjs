/* Run with Playwright installed and CHROME_PATH pointing to a Chromium binary. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'../game');
const screenshots=process.env.BATTLE_SCREENSHOTS||path.resolve(__dirname,'../battle-screenshots');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  fs.mkdirSync(screenshots,{recursive:true});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'networkidle'});
  await page.evaluate(()=>{rollRace();rollOrigin();selectClass(DB.combat_classes.find(c=>c.name==='魔劍士').id);createCharacter();G.character.locationId='L-WILLOW';startBattle(DB.monsters.find(m=>m.name==='巨鼠'),'旅行');});
  await page.waitForSelector('.xuan-player-figure .ij-atlas-art img');
  await page.waitForFunction(()=>[...document.querySelectorAll('#battleBack .ij-atlas-art img')].every(i=>i.complete&&i.naturalWidth>0));
  const names=await page.locator('.battleactions button span').allTextContents();
  assert.deepEqual(names,['攻擊','魔法','技能','道具']);
  assert.equal(await page.locator('.xuan-enemy-figure .ij-atlas-art').getAttribute('data-art-index'),'15');
  assert.equal(await page.locator('.battleactions .art-item-icon').count(),0,'one icon per button');
  for(const [width,height] of [[360,800],[390,844],[691,1536],[1280,800],[844,390]]){
   await page.setViewportSize({width,height});
   await page.waitForTimeout(100);
   const rects=await page.locator('.battleactions button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom}}));
   assert.equal(new Set(rects.map(r=>Math.round(r.y))).size,1,'horizontal commands '+width);
   assert.ok(rects.every(r=>r.w>=44&&r.h>=44&&r.bottom<=height),'visible touch targets '+width);
   await page.screenshot({path:path.join(screenshots,'battle-'+width+'x'+height+'.png')});
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{
   const mana=Object.values(DB.skill_pools).flat().find(s=>s.resource==='mana'&&s.kind!=='被動'&&s.manual_battle_use!==false);
   const stamina=Object.values(DB.skill_pools).flat().find(s=>s.resource!=='mana'&&s.kind!=='被動'&&s.manual_battle_use!==false);
   G.character.skills=[{...stamina},{...mana},{...stamina,kind:'被動'}];
  });
  await page.locator('[data-command="magic"]').click();
  assert.equal(await page.locator('#battleSkillPopupTitle').textContent(),'選擇魔法');
  assert.equal(await page.locator('#battleSkillPopupBody button').count(),1);
  assert.equal(await page.locator('#battleSkillPopupBody button').getAttribute('onclick'),'battleChooseSkill(1)');
  await page.getByRole('button',{name:'關閉技能視窗'}).click();
  await page.locator('[data-command="skill"]').click();
  assert.equal(await page.locator('#battleSkillPopupTitle').textContent(),'選擇技能');
  assert.equal(await page.locator('#battleSkillPopupBody button').count(),1);
  assert.equal(await page.locator('#battleSkillPopupBody button').getAttribute('onclick'),'battleChooseSkill(0)');
  await page.getByRole('button',{name:'關閉技能視窗'}).click();
  await page.locator('[data-command="item"]').click();
  assert.ok((await page.locator('#battleChoice').textContent()).trim().length>0,'item menu responds');
  for(let i=0;i<4;i++)await page.evaluate(()=>renderBattle());
  await page.waitForSelector('[data-command="attack"]');
  assert.equal(await page.locator('.battleactions button').count(),4);
  assert.equal(await page.locator('.battleactions svg').count(),4);
  assert.equal(await page.locator('.battle-secondary-actions button').count(),2);
  assert.deepEqual(errors,[],'no runtime errors');
  console.log('Battle visual regression passed: loaded painted portraits, five viewport sizes, four horizontal commands, separate magic/skill indices, item menu, no duplicate icons.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
