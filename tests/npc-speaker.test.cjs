const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../game/src/npc-speaker.js"),"utf8");
const archetypes=[
 {id:"NPC-ARCH-18-02",region_id:"REG-18",facility_affinity:"general",culture_id:"CUL-018",role:"行商與工匠中介",social_layer:"市鎮商旅",knowledge_scope:["商品","道路"],quest_domains:["交易","委託"]},
 {id:"NPC-ARCH-18-06",region_id:"REG-18",facility_affinity:"general",culture_id:"CUL-018",role:"農牧、礦工、船工或普通居民"}
];
const state={worldState:{},character:{locationId:"L-WILLOW"}},calls=[],modals=[];
const sandbox={DB:{locations:[{id:"L-WILLOW",world_region_id:"REG-18",name:"柳橋鎮"}],regional_npc_archetypes:archetypes},G:state,window:{},generateWorldName:(type,culture,context)=>{calls.push({type,culture,usedNames:context.usedNames});return "艾洛恩"},persist:()=>calls.push("persist"),showModal:(title,html)=>modals.push({title,html})};
vm.runInNewContext(source,sandbox);
const resolve=sandbox.window.resolveRegionalNpcSpeaker;
const first=resolve("general","雜貨鋪常駐人員","L-WILLOW","dialogue-one","你提到 <script>危險路段</script>");
assert.equal(first.id,"NPC-ARCH-18-02");assert.equal(first.name,"艾洛恩");assert.equal(first.role,"行商與工匠中介");assert.equal(first.visualStyle,"asdale_west");assert.equal(first.talks,1);
const repeated=resolve("general","商店服務人員","L-WILLOW","dialogue-one","重繪時不替換原紀錄");
assert.equal(repeated.name,"艾洛恩");assert.equal(repeated.talks,1,"observer updates must not count the same dialogue twice");
const second=resolve("general","商店服務人員","L-WILLOW","dialogue-two","後來你又提到石橋");
assert.equal(second.talks,2,"a distinct facility dialogue increments the encounter count");
assert.equal(calls.filter(x=>typeof x==="object").length,1,"speaker name must generate once and persist across conversations");
assert.equal(calls.filter(x=>x==="persist").length,2,"saving only occurs for distinct interactions");
assert.equal(state.worldState.namedDialogueNpcNames[first.id].name,"艾洛恩");
assert.ok(state.worldState.namedDialogueNpcNames[first.id].firstSeenAt);
assert.ok(state.worldState.namedDialogueNpcNames[first.id].lastSeenAt);
assert.equal(sandbox.window.openNpcJournal,sandbox.window.openRegionalNpcJournal);
sandbox.window.openRegionalNpcJournal();
assert.equal(modals.at(-1).title,"人物誌");
assert.ok(modals.at(-1).html.includes("艾洛恩")&&modals.at(-1).html.includes("對話 2 次"));
sandbox.window.openRegionalNpcProfile(first.id);
assert.equal(modals.at(-1).title,"人物資料");
assert.ok(modals.at(-1).html.includes("市鎮商旅")&&modals.at(-1).html.includes("商品、道路"));
assert.ok(modals.at(-1).html.includes("交易、委託"));
assert.ok(modals.at(-1).html.includes("危險路段"));
assert.ok(modals.at(-1).html.includes("&lt;script&gt;"),"recorded player-facing lines must be escaped");
assert.equal(state.worldState.namedDialogueNpcNames[first.id].recentConversations.length,2,"duplicate render must not append another meeting");
assert.equal(state.worldState.namedDialogueNpcNames[first.id].recentConversations[0].locationId,"L-WILLOW");
assert.ok(!modals.at(-1).html.includes("<script>"),"profile fields must be escaped");

// Upgrade an earlier save where this optional extension stored plain name strings.
const migrated={DB:sandbox.DB,G:{worldState:{namedDialogueNpcNames:{"NPC-ARCH-18-02":"舊存檔姓名"}}},window:{},generateWorldName:()=>{throw new Error("migration must keep the saved name")},persist:()=>{}};
vm.runInNewContext(source,migrated);
const restored=migrated.window.resolveRegionalNpcSpeaker("general","商人","L-WILLOW","after-upgrade");
assert.equal(restored.name,"舊存檔姓名");assert.equal(restored.talks,1);
assert.equal(typeof migrated.G.worldState.namedDialogueNpcNames["NPC-ARCH-18-02"],"object");
assert.equal(restored.firstSeenAt,null,"migration does not invent a historic first-seen time");

const unsupported={DB:{locations:[{id:"L-ISLAND",world_region_id:"REG-10"}],regional_npc_archetypes:[{id:"NPC-ARCH-10-01",region_id:"REG-10",facility_affinity:"guild",culture_id:"CUL-010",role:"船團文書"}]},G:{worldState:{}},window:{},generateWorldName:()=>{throw new Error("unsupported culture must not use a fallback name")}};
vm.runInNewContext(source,unsupported);
assert.equal(unsupported.window.resolveRegionalNpcSpeaker("guild","公會常駐人員","L-ISLAND","unsupported"),null);
assert.equal(unsupported.G.worldState.namedDialogueNpcNames,undefined);
console.log("Regional NPC journal persists distinct meetings, migrates old names, and displays source-backed escaped profiles.");
