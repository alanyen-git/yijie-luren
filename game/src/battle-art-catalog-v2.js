(()=>{"use strict";
// IJ-ART-CATALOG-2.0 compatibility; v3 uses painted assets instead of generated SVG substitutes.
const VER="IJ-ART-CATALOG-3.0";
const heroes="heroes";
const monsters="monsters";
function classIndex(c){
 const s=[c.name,c.category,c.combat_role,c.weapon_group].filter(Boolean).join(" ");
 if(/鍊金|煉金/.test(s))return 14;
 if(/工匠|工兵|鐵匠/.test(s))return 15;
 if(/魔劍|奧術騎士|戰鬥法師/.test(s))return 0;
 if(/聖騎|聖武|守誓|聖盾/.test(s))return 1;
 if(/吟遊|詩人|舞者/.test(s))return 13;
 if(/武僧|拳|格鬥/.test(s))return 12;
 if(/召喚|馴獸|契約|精靈使/.test(s))return 10;
 if(/牧師|祭司|神官|聖職|治療|德魯伊|薩滿/.test(s))return 9;
 if(/巫|咒|死靈|血法|魔女/.test(s))return 11;
 if(/法師|術士|賢者|魔導|元素/.test(s))return 8;
 if(/刺客|盜賊|匕首|影|忍/.test(s))return 7;
 if(/遊俠|巡林|獵人|斥候/.test(s))return 6;
 if(/弓|弩|射手/.test(s))return 5;
 if(/槍|矛|長兵/.test(s))return 4;
 if(/斧|狂戰|錘|鎚/.test(s))return 3;
 if(/戰士|重裝|守衛|騎士|盾/.test(s))return 2;
 return 0;
}
function monsterIndex(m){
 const s=[m.name,m.category,...(m.ecology_profile?.tags||[])].join(" ");
 if(/鼠|rat|rodent/i.test(s))return 15;
 if(/鳥|鷹|鴉|bird/i.test(s))return 14;
 if(/蟲|蛛|蠍|蜂|甲蟲|insect/i.test(s))return 13;
 if(/冰|霜|雪/.test(s)&&/元素|巨獸|巨魔/.test(s))return 11;
 if(/火|炎|熔|焰/.test(s)&&/元素|精靈/.test(s))return 10;
 if(/石|岩|構裝|魔像|傀儡/.test(s))return 9;
 if(/龍|飛龍|蜥|蛇/.test(s))return 12;
 if(/骷髏|亡靈|不死|殭屍|幽靈/.test(s))return 7;
 if(/紅翼|炎魔/.test(s))return 5;
 if(/惡魔|魔鬼|深淵|地獄/.test(s))return 4;
 if(/哥布林|地精/.test(s))return /首領|王|酋長/.test(s)?8:1;
 if(/人型|獸人|巨人|食人魔|盜匪/.test(s))return 6;
 if(/軟泥|史萊姆|黏液/.test(s))return 0;
 if(/野豬|豬|boar/i.test(s))return 3;
 return 2;
}
const frame=(kind,index)=>({src:`./assets/art/three-head/battle-${kind}-${index}.webp`,index,columns:1,rows:1,column:0,row:0});
function assign(record,kind,index){
 const sprite=frame(kind==="class"?heroes:monsters,index);
 record.art_profile={version:VER,kind,sprite,portrait_uri:sprite.src,battle_sprite_uri:sprite.src};
 record.portrait_uri=sprite.src;record.battle_sprite_uri=sprite.src;
 return sprite;
}
for(const c of DB.combat_classes||[])assign(c,"class",classIndex(c));
for(const m of DB.monsters||[])assign(m,"monster",monsterIndex(m));
const byName=(arr,text)=>arr.find(x=>String(text||"").includes(x.name));
DB.battle_art_system={version:VER,class_count:(DB.combat_classes||[]).length,monster_count:(DB.monsters||[]).length,fields:["art_profile","portrait_uri","battle_sprite_uri"],style:"精緻三頭身奇幻 JRPG 圖片立繪；16職業／16生態造型依資料對照。"};
DB.meta.battle_art_revision=VER;
globalThis.YijieBattleArt={version:VER,
 classById:id=>(DB.combat_classes||[]).find(x=>x.id===id)?.art_profile.sprite,
 monsterById:id=>(DB.monsters||[]).find(x=>x.id===id)?.art_profile.sprite,
 classByText:text=>{const c=byName(DB.combat_classes||[],text);return c?.art_profile.sprite||frame(heroes,classIndex({name:text}))},
 monsterByText:text=>{const m=byName(DB.monsters||[],text);return m?.art_profile.sprite||frame(monsters,monsterIndex({name:text}))},
 audit:()=>({pass:[...(DB.combat_classes||[]),...(DB.monsters||[])].every(x=>x.art_profile?.sprite&&x.portrait_uri&&x.battle_sprite_uri),classes:(DB.combat_classes||[]).length,monsters:(DB.monsters||[]).length})};
})();
