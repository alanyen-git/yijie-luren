(()=>{"use strict";
const namingProfiles={"CUL-001":"asdale_west","CUL-002":"valrek_imperial","CUL-003":"asdale_west","CUL-004":"asdale_west","CUL-005":"free_city","CUL-006":"free_city","CUL-007":"free_city","CUL-008":"free_city","CUL-009":"free_city","CUL-011":"asdale_west","CUL-012":"elven","CUL-013":"dwarven","CUL-014":"beast_steppe","CUL-015":"beast_steppe","CUL-016":"beast_steppe","CUL-017":"valrek_imperial","CUL-018":"asdale_west","CUL-019":"free_city","CUL-020":"dark_elf"};
function esc(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
function now(){try{return new Date().toISOString()}catch(e){return ""}}
function resolve(facilityId,speakerRole,locationId,interactionKey,conversationSummary){
 if(typeof DB!=="object"||!DB||typeof G==="undefined"||!G?.worldState)return null;
 const location=(DB.locations||[]).find(x=>x.id===locationId);if(!location)return null;
 const regionId=location.world_region_id||location.region_id;if(!regionId)return null;
 const candidates=(DB.regional_npc_archetypes||[]).filter(x=>x.region_id===regionId&&x.facility_affinity===facilityId);
 if(!candidates.length)return null;
 const role=String(speakerRole||"");let archetype=null;
 if(facilityId==="general"&&/商鋪|商店|雜貨|商人|交易/.test(role))archetype=candidates.find(x=>/行商|工匠/.test(x.role||""));
 if(!archetype&&facilityId==="general"&&/農|居民|村民/.test(role))archetype=candidates.find(x=>/農牧|普通居民/.test(x.role||""));
 archetype=archetype||candidates[0];
 const profile=namingProfiles[archetype.culture_id];if(!profile||typeof generateWorldName!=="function")return null;
 const state=G.worldState,registry=state.namedDialogueNpcNames&&typeof state.namedDialogueNpcNames==="object"?state.namedDialogueNpcNames:(state.namedDialogueNpcNames={});
 const timestamp=now();let entry=registry[archetype.id],migrated=false,created=false;
 if(typeof entry==="string"){entry={name:entry,firstSeenAt:null,lastSeenAt:null,locationId:"",talks:0,lastInteractionKey:""};migrated=true}
 if(!entry||typeof entry!=="object"||!entry.name){
  let name;try{name=generateWorldName("person",profile,{usedNames:Object.values(registry).map(v=>typeof v==="string"?v:v?.name).filter(Boolean)})}catch(e){return null}
  if(!name)return null;entry={name:String(name),firstSeenAt:timestamp,lastSeenAt:null,locationId:"",talks:0,lastInteractionKey:""};created=true;
 }
 const key=String(interactionKey||"").trim(),isNewInteraction=!!key&&entry.lastInteractionKey!==key;
 if(!Array.isArray(entry.recentConversations))entry.recentConversations=[];
 if(!entry.firstSeenAt&&!migrated)entry.firstSeenAt=timestamp;
 if(isNewInteraction){
  entry.talks=(Number(entry.talks)||0)+1;entry.lastInteractionKey=key;entry.lastSeenAt=timestamp;entry.locationId=locationId||entry.locationId||"";
  entry.recentConversations.push({at:timestamp,locationId:locationId||"",facilityId,speakerRole:String(speakerRole||""),summary:String(conversationSummary||"").trim().slice(0,240)});
  entry.recentConversations=entry.recentConversations.slice(-5);
 }else if(created||migrated){
  entry.lastSeenAt=timestamp;entry.locationId=locationId||entry.locationId||"";
 }
 registry[archetype.id]=entry;
 if((isNewInteraction||created||migrated)&&typeof persist==="function")try{persist()}catch(e){}
 return {id:archetype.id,name:String(entry.name),role:archetype.role,regionId,cultureId:archetype.culture_id,visualStyle:profile,firstSeenAt:entry.firstSeenAt||null,lastSeenAt:entry.lastSeenAt||null,locationId:entry.locationId||"",talks:Number(entry.talks)||0};
}
function values(value){return Array.isArray(value)?value.filter(Boolean).map(esc).join("、"):esc(value||"未登錄")}
function encountered(){const registry=G?.worldState?.namedDialogueNpcNames||{};return Object.entries(registry).map(([id,value])=>{const archetype=(DB.regional_npc_archetypes||[]).find(x=>x.id===id);const entry=typeof value==="string"?{name:value}:value;if(!archetype||!entry?.name)return null;return {id,entry,archetype}}).filter(Boolean)}
function openJournal(){
 if(typeof DB!=="object"||!DB||typeof G==="undefined"||!G?.worldState||typeof showModal!=="function")return;
 const rows=encountered().sort((a,b)=>String(a.entry.name).localeCompare(String(b.entry.name),"zh-Hant")).map(({id,entry,archetype})=>{
  const cardId=esc(id),location=(DB.locations||[]).find(x=>x.id===(entry.locationId||""));
  return `<div class="itemrow"><span><b>${esc(entry.name)}</b> <span class="tier">${esc(archetype.role||"")}</span><br><span class="small">${esc(location?.name||archetype.region_id||"")}｜${esc(archetype.social_layer||"社會層級未登錄")}｜對話 ${Number(entry.talks)||0} 次</span></span><button onclick="openRegionalNpcProfile('${cardId}')">人物資料</button></div>`
 }).join("")||'<div class="card small">尚未遇見地區角色。與城鎮設施人員對話後，人物會依現有地區原型加入人物誌。</div>';
 showModal("人物誌",`<div class="card small">已遇見 ${encountered().length} 名地區人物。人物姓名與資料取自目前世界存檔和既有角色原型。</div>${rows}`);
}
function openProfile(id){
 if(typeof DB!=="object"||!DB||typeof G==="undefined"||!G?.worldState||typeof showModal!=="function")return;
 const found=encountered().find(x=>x.id===id);if(!found)return;
 const {entry,archetype}=found,location=(DB.locations||[]).find(x=>x.id===(entry.locationId||""));
 const first=entry.firstSeenAt?esc(entry.firstSeenAt):"版本升級前已遇見（日期未記錄）",last=entry.lastSeenAt?esc(entry.lastSeenAt):"日期未記錄";
 const meetings=(Array.isArray(entry.recentConversations)?entry.recentConversations:[]).slice(-5).reverse();
 const history=meetings.map(m=>{const place=(DB.locations||[]).find(x=>x.id===m.locationId),facility=DB.facilities?.[m.facilityId]?.name||m.facilityId||"設施對話";return `<div class="itemrow"><span><b>${esc(m.at||"日期未記錄")}</b><br><span class="small">${esc(place?.name||m.locationId||"地點未登錄")}｜${esc(facility)}｜${esc(m.speakerRole||"")}</span><br><span>${esc(m.summary||"未記錄對話摘要")}</span></span></div>`}).join("")||'<div class="small">此舊存檔尚無可回看的對話摘要；再次與此人物交談後會開始記錄。</div>';
 const html=`<div class="card"><h3>${esc(entry.name)}</h3><b>${esc(archetype.role||"")}</b><p class="small">${esc(location?.name||archetype.region_id||"")}｜${esc(archetype.region_id||"")}</p></div><div class="card small"><b>所屬文化：</b>${esc(archetype.culture_id||"未登錄")}<br><b>社會層級：</b>${esc(archetype.social_layer||"未登錄")}<br><b>知識範圍：</b>${values(archetype.knowledge_scope)}<br><b>相關委託：</b>${values(archetype.quest_domains)}<br><b>對話次數：</b>${Number(entry.talks)||0}<br><b>初次遇見：</b>${first}<br><b>最近遇見：</b>${last}</div><div class="card"><b>近期對話紀錄（最多 5 則）</b>${history}</div><button onclick="openRegionalNpcJournal()">返回人物誌</button>`;
 showModal("人物資料",html);
}
if(typeof window!=="undefined"){window.resolveRegionalNpcSpeaker=resolve;window.openRegionalNpcJournal=openJournal;window.openRegionalNpcProfile=openProfile;window.openNpcJournal=openJournal}
if(typeof globalThis!=="undefined"){globalThis.resolveRegionalNpcSpeaker=resolve;globalThis.openRegionalNpcJournal=openJournal;globalThis.openRegionalNpcProfile=openProfile;globalThis.openNpcJournal=openJournal}
})();