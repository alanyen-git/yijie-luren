const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const app=path.join(__dirname,'../game'),source=fs.readFileSync(path.join(app,'src/runtime.js'),'utf8');
const dataSource=fs.readFileSync(path.join(app,'src/game-data.js'),'utf8');
const context={DB:JSON.parse(dataSource.slice(dataSource.indexOf('=')+1,dataSource.lastIndexOf(';')))};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(app,'src/battle-art-catalog-v2.js'),'utf8'),context);
for(const record of [...context.DB.combat_classes,...context.DB.monsters]){
 const file=path.join(app,record.portrait_uri);assert.ok(fs.existsSync(file),record.name+' portrait exists');assert.equal(fs.readFileSync(file).toString('ascii',0,4),'RIFF');
}
assert.equal(context.YijieBattleArt.monsterByText('巨鼠').index,15);
const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',classList:{remove(){}}});return nodes.get(id)};
Object.assign(context,{G:{battle:{active:true},character:{skills:[{name:'戰技',kind:'主動',resource:'stamina',stamina_cost:1},{name:'法術',kind:'主動',resource:'mana',stamina_cost:1},{name:'被動',kind:'被動'}],mana:50,stamina:50}},document:{activeElement:null},$:node,setUIHTML:(n,h)=>n.innerHTML=h,normalizeSkillXp(){},skillResourceCost:()=>1,skillUseTypeLabel:()=>'',skillLevel:()=>1,skillXpProgressText:()=>'',skillDescriptionText:()=>'',skillLevelBonus:()=>0});
vm.runInContext(source.slice(source.indexOf('function skillUsesMana('),source.indexOf('function skillUsesMana(')+source.slice(source.indexOf('function skillUsesMana(')).indexOf('\n')),context);
vm.runInContext('let battleSkillLastFocus=null;'+source.slice(source.indexOf('function battleSkillMenu('),source.indexOf('function enemyElementResistance(')),context);
context.battleSkillMenu('magic');assert.equal(node('#battleSkillPopupTitle').textContent,'選擇魔法');assert.ok(node('#battleSkillPopupBody').innerHTML.includes('battleChooseSkill(1)'));assert.ok(!node('#battleSkillPopupBody').innerHTML.includes('battleChooseSkill(0)'));
context.battleSkillMenu('skill');assert.equal(node('#battleSkillPopupTitle').textContent,'選擇技能');assert.ok(node('#battleSkillPopupBody').innerHTML.includes('battleChooseSkill(0)'));assert.ok(!node('#battleSkillPopupBody').innerHTML.includes('battleChooseSkill(1)'));assert.ok(!node('#battleSkillPopupBody').innerHTML.includes('battleChooseSkill(2)'));
console.log('Battle reference regression passed: all painted files exist; rat has its own image; magic and skill menus preserve original skill indices.');
