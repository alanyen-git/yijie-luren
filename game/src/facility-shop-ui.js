(function(){
"use strict";
const esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
const attr=function(v){return esc(v)};
const profiles={
  general:{scene:"general",environment:"行旅百貨",english:"GENERAL STORE",headline:"旅途補給，一應俱全",subline:"乾糧、藥品與旅途必需品都在這裡。",primary:["buy","sell","talk","info"],buyIcon:"ration",sellIcon:"accessory"},
  blacksmith:{scene:"blacksmith",environment:"鍛造工坊",english:"BLACKSMITH",headline:"爐火不熄，精工鍛造",subline:"挑選武器、修整護具，打造更可靠的裝備。",primary:["buy","craft","repair","sell"],buyIcon:"blade",sellIcon:"tool"},
  alchemy:{scene:"alchemy",environment:"藥草與蒸餾室",english:"ALCHEMY",headline:"草藥、藥劑與秘方",subline:"在玻璃器皿與蒸餾爐間調製旅人的補給。",primary:["buy","craft","quest","info"],buyIcon:"potion",sellIcon:"herb"},
  tailor:{scene:"tailor",environment:"裁縫與染布間",english:"TAILOR",headline:"量身縫製，旅裝更新",subline:"布料、護具與手工服飾，依旅途所需挑選。",primary:["buy","sell","craft","subjob"],buyIcon:"cloth",sellIcon:"cloth"},
  guild:{scene:"guild",environment:"冒險者公會大廳",english:"ADVENTURERS GUILD",headline:"委託、隊伍與冒險消息",subline:"從公告板出發，讓每段旅程都有方向。",primary:["guildQuests","recruit","training","info"],buyIcon:"book",sellIcon:"accessory"},
  church:{scene:"church",environment:"靜思與祈禱殿堂",english:"CHURCH",headline:"治療、祈禱與神殿委託",subline:"在彩窗與燭光之下，尋求祝福與援助。",primary:["heal","prayer","faithMissions","info"],buyIcon:"mark",sellIcon:"mark"},
  tavern:{scene:"tavern",environment:"旅人酒館",english:"TAVERN",headline:"熱食、傳聞與同行旅人",subline:"坐下歇一會，交換沿途消息與冒險故事。",primary:["meal","buy","sell","recruit"],buyIcon:"ration",sellIcon:"herb"},
  inn:{scene:"inn",environment:"旅店客房與櫃檯",english:"INN",headline:"用餐休憩，養足精神",subline:"整理行裝、享用餐點，或在此留宿一晚。",primary:["meal","rest","buy","info"],buyIcon:"ration",sellIcon:"accessory"},
  clinic:{scene:"clinic",environment:"診療與藥草室",english:"CLINIC",headline:"療傷、調養與藥草",subline:"由地方醫者照料隊伍的傷勢與旅途疲憊。",primary:["heal","buy","talk","info"],buyIcon:"heal",sellIcon:"herb"},
  enchanter:{scene:"enchanter",environment:"附魔工坊",english:"ENCHANTER",headline:"替裝備注入魔力",subline:"研究符文與契約，尋找裝備的另一種力量。",primary:["ritual","buy","sell","info"],buyIcon:"crystal",sellIcon:"crystal"},
  mageguild:{scene:"mageguild",environment:"魔法研究會",english:"MAGE GUILD",headline:"召喚研究與魔法契約",subline:"在典籍與法陣之間，探索魔力的規律。",primary:["summon","ritual","buy","info"],buyIcon:"scroll",sellIcon:"crystal"}
};
const iconFor={
 talk:"mark",info:"book",buy:"ration",sell:"accessory",craft:"tool",repair:"armor",
 guildQuests:"scroll",buyback:"accessory",recruit:"summon",joinParty:"mark",
 training:"blade",crossTraining:"book",advancement:"lightning",faithEncounter:"mark",
 meal:"ration",ritual:"crystal",summon:"summon",heal:"heal",faithDirectory:"book",
 faithMissions:"scroll",prayer:"mark",quest:"scroll",subjob:"cloth",rest:"status",
 orgs:"mark",discipline:"blade",authority:"book"
};
const hintText={
 talk:"與店主交談",info:"查看店內情報",buy:"瀏覽商品",sell:"出售多餘物資",
 craft:"製作專屬裝備",repair:"修復隊伍裝備",guildQuests:"查看冒險委託",
 buyback:"出售戰利品",recruit:"尋找同行夥伴",joinParty:"加入冒險團",
 training:"職業技能訓練",crossTraining:"學習跨職技能",advancement:"職業進階",
 faithEncounter:"拜訪地方神職",meal:"用餐補充狀態",ritual:"進行契約儀式",
 summon:"研究召喚術",heal:"治療隊伍傷勢",faithDirectory:"查看神系與教會",
 faithMissions:"承接神殿委託",prayer:"祈禱與誓言",quest:"查看臨時委託",
 subjob:"學習副職技能",rest:"安排住宿休息",orgs:"查閱關聯組織",
 discipline:"拜訪武技／魔法流派",authority:"處理地方政務"
};
function renderFacility(fid){
  const f=DB.facilities&&DB.facilities[fid];
  if(!f)return;
  const location=typeof loc==="function"?loc(G.character.locationId):null;
  const profile=profiles[fid]||{scene:"general",environment:"設施室內",english:"FACILITY",headline:"旅人服務",subline:"與此處的店主交談，了解可用服務。",primary:["talk","info"],buyIcon:"ration",sellIcon:"accessory"};
  const actions=[];
  const add=function(key,title,hint,icon,call){
    actions.push({key:key,title:title,hint:hint||hintText[key]||"",icon:icon||iconFor[key]||"mark",call:call});
  };
  add("talk","對話",hintText.talk,"mark","facilityDialogue('"+fid+"')");
  add("info","情報",hintText.info,"book","facilityIntel('"+fid+"')");
  if(f.shop){
    add("buy",fid==="tavern"||fid==="inn"?"購買料理":"購買",fid==="tavern"||fid==="inn"?"挑選店內餐點":"瀏覽可用商品",profile.buyIcon,"shopBuy('"+fid+"')");
    add("sell",fid==="tavern"?"收購食材":"出售",fid==="tavern"?"出售可用食材":"出售多餘物資",profile.sellIcon,"shopSell('"+fid+"')");
  }
  if(fid==="guild"){
    add("guildQuests","公會委託",hintText.guildQuests,"scroll","guildQuests()");
    add("buyback","收購櫃檯",hintText.buyback,"accessory","openGuildBuyback()");
    add("recruit","招募隊友",hintText.recruit,"summon","openRecruitTeammates('guild')");
    add("joinParty","加入冒險團",hintText.joinParty,"mark","openJoinAdventureParty()");
    add("training","本職技能",hintText.training,"blade","classTraining()");
    add("crossTraining","跨職訓練",hintText.crossTraining,"book","guildBasicTraining()");
    add("advancement","職業進階",hintText.advancement,"lightning","openClassAdvancement()");
  }
  if(fid==="tavern")add("recruit","招募隊友",hintText.recruit,"summon","openRecruitTeammates('tavern')");
  if(fid==="tavern")add("faithEncounter","信仰人物",hintText.faithEncounter,"mark","openFaithEncounter('tavern')");
  if(fid==="tavern"||fid==="inn")add("meal","用餐",mealPeriod()?"用餐・"+DB.meal_service_system.service_windows[mealPeriod()].label:"享用餐點","ration","openMealService('"+fid+"')");
  if(fid==="mageguild"){
    add("summon","召喚研究",hintText.summon,"summon","openSummonResearch()");
    add("ritual","契約儀式",hintText.ritual,"crystal","openContractRitual()");
  }
  if(fid==="enchanter")add("ritual","契約儀式",hintText.ritual,"crystal","openContractRitual()");
  if(["blacksmith","tailor","alchemy"].includes(fid))add("craft","製作",hintText.craft,fid==="tailor"?"cloth":fid==="alchemy"?"potion":"tool","openCrafting('"+fid+"')");
  if(fid==="blacksmith")add("repair","修理裝備",hintText.repair,"armor","openRepair()");
  if(fid==="church"||fid==="clinic")add("heal","治療",hintText.heal,"heal","facilityHeal('"+fid+"')");
  if(fid==="church"){
    add("faithDirectory","神系與教會",hintText.faithDirectory,"book","openFaithDirectory()");
    add("faithMissions","神殿委託",hintText.faithMissions,"scroll","openFaithMissions()");
    add("prayer","祈禱／誓言",hintText.prayer,"mark","openFaithProfile()");
    add("faithEncounter","地方神職",hintText.faithEncounter,"mark","openFaithEncounter('church')");
  }
  if(fid==="alchemy"||fid==="church")add("quest","臨時委託",hintText.quest,"scroll","facilityQuest('"+fid+"')");
  if(DB.subjobs&&DB.subjobs.some(function(s){return s.facilities.includes(fid)}))add("subjob","副職業學習",hintText.subjob,"cloth","learnSubjobHere('"+fid+"')");
  if(fid==="inn")add("rest","住宿",hintText.rest,"status","innRest()");
  if(["guild","tavern","general","blacksmith","tailor","alchemy","enchanter","mageguild","clinic"].includes(fid))add("orgs","組織／勢力",hintText.orgs,"mark","openFacilityOrganizations('"+fid+"')");
  const contacts=typeof disciplineContactsHere==="function"?disciplineContactsHere(fid):[];
  if(contacts.length)add("discipline","武技／魔法流派 "+contacts.length,hintText.discipline,"blade","openDisciplineDirectory('all','"+fid+"')");
  if(typeof authorityLiaisonFacility==="function"&&fid===authorityLiaisonFacility()){
    const political=typeof politicalContextForLocation==="function"?politicalContextForLocation():null;
    if(political&&political.polity)add("authority","地方政務",hintText.authority,"book","openAuthorityRequests('"+political.polity.id+"')");
  }
  const byKey=Object.create(null);
  actions.forEach(function(a){byKey[a.key]=a});
  const ordered=(profile.primary||[]).map(function(k){return byKey[k]}).filter(Boolean);
  const primaryKeys=new Set(ordered.map(function(a){return a.key}));
  const more=actions.filter(function(a){return !primaryKeys.has(a.key)});
  const renderAction=function(a,featured){
    const classes="xu-store-action "+(featured?"xu-store-action-primary":"xu-store-action-secondary");
    return '<button type="button" class="'+classes+'" data-action="'+attr(a.key)+'" data-icon="'+attr(a.icon)+'" aria-label="'+attr(a.title+"："+a.hint)+'" onclick="'+attr(a.call)+'"><span class="xu-store-action-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="./assets/art/item-skill-icons.svg#'+attr(a.icon)+'"></use></svg></span><span class="xu-store-action-label"><strong>'+esc(a.title)+'</strong></span></button>';
  };
  const room=profile.scene||fid||"general";
  const html='<section class="xu-store-screen store-'+attr(fid)+'" data-facility="'+attr(fid)+'" data-environment="'+attr(room)+'">'+
    '<div class="xu-store-scene" role="group" aria-label="'+attr(f.name+"的"+profile.environment)+'">'+
      '<img class="xu-store-art" src="./assets/art/town/shops/'+attr(room)+'.webp" alt="'+attr(f.name+"的"+profile.environment)+'" decoding="async">'+
      '<div class="xu-store-plaque" aria-hidden="true"><span>'+esc(profile.english)+'</span></div>'+
    '</div>'+
    '<div class="xu-store-actions-primary" aria-label="主要服務">'+ordered.map(function(a){return renderAction(a,true)}).join("")+'</div>'+
    (more.length?'<section class="xu-store-more"><header><b>更多服務</b></header><div class="xu-store-actions-secondary">'+more.map(function(a){return renderAction(a,false)}).join("")+'</div></section>':"")+
  '</section>';
  showModal(f.name,html,"renderFacility('"+fid+"')");
}
window.renderFacility=renderFacility;
})();