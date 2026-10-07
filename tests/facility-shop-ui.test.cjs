const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const app=path.join(__dirname,"..","game");
const source=require("node:fs").readFileSync(path.join(app,"src/facility-shop-ui.js"),"utf8");
const ids=["general","blacksmith","alchemy","tailor","guild","church","tavern","inn","clinic","enchanter","mageguild"];
const scenesDir=path.join(app,"assets/art/town/shops");
const facilities={};for(const id of ids)facilities[id]={id,name:id,shop:true,stock:[]};
let rendered=null;
const context={
 window:{},DB:{facilities,subjobs:[]},G:{character:{locationId:"test"}},
 loc:()=>({name:"測試村",tier:"C"}),
 facilityIntegration:()=>({organization_ids:["org"],intel_record_ids:["intel"],dialogue_record_ids:["talk"],subjob_ids:[]}),
 showModal:(title,html,refresh)=>{rendered={title,html,refresh}},
 disciplineContactsHere:()=>[],authorityLiaisonFacility:()=>"none",politicalContextForLocation:()=>({polity:null}),mealPeriod:()=>null
};
vm.createContext(context);vm.runInContext(source,context);
assert.equal(typeof context.window.renderFacility,"function");
const render=id=>{context.window.renderFacility(id);return rendered.html};
for(const id of ids){const html=render(id);assert.ok(html.includes('data-facility="'+id+'"'),id+" identifies its facility");assert.ok(html.includes('./assets/art/town/shops/'+id+'.webp'),id+" uses its own illustrated room");assert.ok(fs.statSync(path.join(scenesDir,id+'.webp')).size>1000,id+" image asset exists");assert.ok(html.includes('data-action="talk"')&&html.includes('data-action="info"'),id+" keeps common actions");assert.ok(!html.includes('xu-store-summary')&&!html.includes('xu-store-record')&&!html.includes('xu-store-sign'),id+" avoids descriptive text panels")}
const general=render("general"),smith=render("blacksmith"),alchemy=render("alchemy"),tailor=render("tailor"),guild=render("guild"),church=render("church");
assert.match(general,/data-icon="ration"/);assert.match(smith,/data-icon="blade"/);assert.match(alchemy,/data-icon="potion"/);assert.match(tailor,/data-icon="cloth"/);assert.match(church,/data-icon="heal"/);
assert.ok(general.includes("shopBuy(&#39;general&#39;)")&&general.includes("shopSell(&#39;general&#39;)"),"shop purchase and sale handlers remain connected");
assert.ok(smith.includes("openCrafting(&#39;blacksmith&#39;)")&&smith.includes("openRepair()"),"smith crafting and repair remain connected");
assert.ok(alchemy.includes("openCrafting(&#39;alchemy&#39;)")&&alchemy.includes("facilityQuest(&#39;alchemy&#39;)"),"alchemy recipes and quests remain connected");
assert.ok(tailor.includes("openCrafting(&#39;tailor&#39;)"),"tailoring remains connected to crafting");
assert.ok(guild.includes("guildQuests()")&&guild.includes("openRecruitTeammates(&#39;guild&#39;)"),"guild keeps quest and recruitment actions");
assert.ok(church.includes("facilityHeal(&#39;church&#39;)")&&church.includes("openFaithProfile()"),"church keeps healing and prayer actions");
const scenes=ids.slice(0,6).map(id=>{render(id);return rendered.html.match(/data-environment="([^"]+)"/)[1]});
assert.equal(new Set(scenes).size,6,"major facility types use distinct interiors");
console.log("Facility screens use distinct scenes and icons while preserving the existing service handlers.");
