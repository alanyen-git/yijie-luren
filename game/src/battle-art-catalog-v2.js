(()=>{"use strict";
// IJ-ART-CATALOG-2.0 compatibility; v3 uses painted assets instead of generated SVG substitutes.
const VER="IJ-ART-CATALOG-3.0";
const heroes="heroes";
const monsters="monsters";
// 配圖規則：名稱優先 → 戰鬥定位／武器 → 分類首段。
// 不再把整段分類文字或英文標籤拿來做子字串比對（例如「爬蟲」含「蟲」、「invertebrate」含「rat」，
// 曾讓龍配到蜘蛛圖、蜘蛛與史萊姆配到老鼠圖，遊俠／盜賊／刺客配到吟遊詩人圖）。
// 規則依序比對，先命中者優先；順序即優先權。
const CLASS_RULES=[
 [14,/鍊金|煉金/],[15,/工匠|工兵|鐵匠/],[0,/魔劍|奧術騎士|戰鬥法師|劍舞/],[1,/聖騎|聖武|聖劍|守誓|聖盾/],
 [7,/刺客|影刃|影舞|忍/],[13,/吟遊|詩人|舞者/],[12,/武僧|僧侶|拳|格鬥|徒手/],[10,/召喚|馴獸|馴龍|契約|精靈使/],
 [9,/白魔|先知|預言|驅魔|牧師|祭司|神官|聖職|聖者|聖女|主教|治療|德魯伊|薩滿/],[11,/黑魔|惡魔術|巫|咒|死靈|血法|魔女/],
 [8,/法師|術士|賢者|魔導|元素/],[5,/弓|弩|射手|遊俠|巡林|獵/],[6,/斥候|盜賊|海盜|飛刀/],[7,/匕首|影/],
 [4,/槍|矛|長兵/],[3,/斧|狂戰|錘|鎚/],[2,/戰士|重裝|守衛|騎士|盾/]
];
const CLASS_CATEGORY_RULES=[[2,"戰士"],[8,"法師"],[5,"遊俠"],[9,"神職"]];
const firstMatch=(rules,text)=>{for(const [index,pattern] of rules)if(pattern.test(text))return index;return null};
function classIndex(c){
 const byName=firstMatch(CLASS_RULES,String(c.name||""));
 if(byName!==null)return byName;
 const byRole=firstMatch(CLASS_RULES,[c.combat_role,c.weapon_group].filter(Boolean).join(" "));
 if(byRole!==null)return byRole;
 const head=String(c.category||"").split("／")[0];
 const byCategory=CLASS_CATEGORY_RULES.find(([,key])=>head.includes(key));
 return byCategory?byCategory[0]:0;
}
const MONSTER_RULES=[
 [0,/史萊姆|軟泥|黏液|人魚|水元素/],[15,/鼠/],[13,/蜘蛛|蛛|蠍|蜂|甲蟲|獨角仙|蟻|蠕蟲|克拉肯/],
 [14,/鷹|鴉|鳥|梟|隼|鷲|蝙蝠/],[5,/紅翼|炎魔/],[12,/龍|蜥|蛇|蟒|鱷|龜|娜迦|美杜莎|海德拉/],
 [2,/^狼人/],[7,/骷髏|亡靈|不死|殭屍|食屍|屍妖|幽靈|幽魂|怨靈|惡靈|女妖|吸血|木乃伊|巫妖|死神|活鎧|活盔|無頭|死亡騎士|墓園|骸骨/],
 [9,/石像鬼|魔像|傀儡|構裝|岩漿|土元素|石巨人/],[10,/火元素|雷元素|風元素|暴風元素|火.*精靈|炎.*精靈/],
 [11,/冰元素|冰霜巨魔|冰.*巨獸/],[4,/惡魔|魔鬼|深淵|地獄/],[8,/(哥布林|地精).*(首領|王|酋長)|(首領|王|酋長).*(哥布林|地精)/],
 [1,/哥布林|地精/],[6,/人型|獸人|巨人|巨魔|食人魔|牛頭人|盜匪|強盜|劫匪|逃兵/],[3,/野豬|豬/]
];
// 名稱沒有命中時才看分類（只比對分類名稱本身），最後落在野獸造型。
const MONSTER_CATEGORY_RULES=[[7,"不死"],[4,"惡魔"],[1,"哥布林"],[12,"龍"],[6,"人型"]];
function monsterIndex(m){
 const byName=firstMatch(MONSTER_RULES,String(m.name||""));
 if(byName!==null)return byName;
 const cat=String(m.category||"");
 const byCategory=MONSTER_CATEGORY_RULES.find(([,key])=>cat.includes(key));
 return byCategory?byCategory[0]:2;
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
