/* 異界旅人：市場價格同步模型 CURRENT-1.59.0
 * 目標：避免商鋪收購價因局部供應快速下跌，但零售價沒有同步反映。
 * 原則：同一商品使用同一個局部供需倍率；收購與零售同向變動；小型市場更敏感、大型城市流動性更高；96小時內逐步衰減。
 */
(()=>{
  if(typeof DB!=="object"||!DB)return;

  DB.meta=DB.meta||{};
  DB.meta.current_version="CURRENT-1.59.0";
  DB.meta.market_economy_revision="MARKET-PRICE-SYNC-2.0";
  DB.market_economy_system=DB.market_economy_system||{};
  DB.market_economy_system.local_trade_flow={
    version:"MARKET-PRICE-SYNC-2.0",
    window_hours:96,
    min_factor:.90,
    max_factor:1.08,
    pressure_per_liquidity:.04,
    guild_supply_weight:.75,
    principle:"同一商品的商鋪收購與零售使用相同局部供需倍率；供應增加時兩端同步緩降，需求增加時兩端同步緩升。"
  };

  const CFG=DB.market_economy_system.local_trade_flow;
  const BULK_TYPES=new Set(["食材","素材","草藥素材","工藝素材","礦石","藥劑","料理","食物","補給"]);

  function marketTradeLedger(){
    if(!G?.worldState)return [];
    G.worldState.itemMarketTradeLedger=Array.isArray(G.worldState.itemMarketTradeLedger)?G.worldState.itemMarketTradeLedger:[];
    const now=totalHours(),windowHours=CFG.window_hours||96;
    G.worldState.itemMarketTradeLedger=G.worldState.itemMarketTradeLedger.filter(x=>Number.isFinite(x?.hour)&&now-x.hour<=windowHours);
    if(G.worldState.itemMarketTradeLedger.length>300)G.worldState.itemMarketTradeLedger=G.worldState.itemMarketTradeLedger.slice(-300);
    return G.worldState.itemMarketTradeLedger;
  }

  function marketLiquidity(d){
    const place=loc(G?.character?.locationId),rank=Math.max(0,tierOrder(place?.tier||"F"));
    const bulk=BULK_TYPES.has(d?.type);
    const base=bulk?12:5;
    return Math.max(3,base*(1+rank*.75));
  }

  function itemTradePressure(d){
    if(!d||!G?.character)return 0;
    const now=totalHours(),windowHours=CFG.window_hours||96,locationId=G.character.locationId;
    let pressure=0;
    for(const row of marketTradeLedger()){
      if(row.locationId!==locationId||row.itemId!==d.id)continue;
      const age=Math.max(0,now-row.hour),decay=Math.max(0,1-age/windowHours);
      pressure+=Number(row.qty||0)*decay;
    }
    return pressure;
  }

  function itemTradeFlowFactor(d){
    const liquidity=marketLiquidity(d),normalized=itemTradePressure(d)/liquidity;
    return clamp(1-normalized*(CFG.pressure_per_liquidity||.04),CFG.min_factor||.90,CFG.max_factor||1.08);
  }

  function itemTradeFlowText(d){
    const f=itemTradeFlowFactor(d),pct=Math.round(f*100);
    if(pct<=92)return `供應偏高 ${pct}%`;
    if(pct<99)return `供應略高 ${pct}%`;
    if(pct>=106)return `需求偏高 ${pct}%`;
    if(pct>101)return `需求略高 ${pct}%`;
    return `供需平衡 ${pct}%`;
  }

  function registerItemMarketTrade(d,qty,source="shop"){
    if(!d||!G?.character||!Number.isFinite(qty)||qty===0)return;
    const weight=source==="guild"?(CFG.guild_supply_weight||.75):1;
    marketTradeLedger().push({
      hour:totalHours(),
      locationId:G.character.locationId,
      regionId:questMarketRegionId(),
      itemId:d.id,
      qty:Number(qty)*weight,
      source
    });
  }

  function combinedItemMarketFactor(d){
    return regionalItemMarketFactor(d)*itemTradeFlowFactor(d);
  }

  shopBuyUnitPrice=function(d){
    const disc=clamp(talentSpecial("buyDiscount"),0,.25);
    return Math.max(1,Math.ceil((d?.value||1)*1.15*combinedItemMarketFactor(d)*(1-disc)*affiliationPriceMultiplier("buy")));
  };

  shopSellUnitPrice=function(d){
    const bonus=clamp(talentSpecial("sellBonus"),0,.25);
    return Math.max(1,Math.floor((d?.value||1)*.5*(1+bonus)*combinedItemMarketFactor(d)*affiliationPriceMultiplier("sell")));
  };

  guildBuybackUnitPrice=function(d){
    const market=Math.max(1,shopSellUnitPrice(d));
    return Math.max(1,Math.floor(market*.9));
  };

  openGuildBuyback=function(){
    if(G.character.currentFacility!=="guild")return;
    const market=marketFacilityState("guild"),list=G.character.inventory.map((x,i)=>[x,i]).filter(([x])=>!!item(x.id));
    const rows=list.map(([x,i])=>{
      const d=item(x.id),p=guildBuybackUnitPrice(d),regional=Math.round(regionalItemMarketFactor(d)*100),local=Math.round(itemTradeFlowFactor(d)*100),affordable=Math.min(x.qty||1,Math.floor(market.budgetRemaining/p));
      return `<div class="itemrow"><span><b>${d.name}</b> <span class="tier">${d.tier}</span> ×${x.qty||1}<br><span class="small">地區${regional}%｜本地供需${local}%｜一般市場收購價再減10%｜單價${p}銀</span></span><span><button ${affordable>=1?"":"disabled"} onclick="guildSellItem(${i},${p},1)">出售1</button>${(x.qty||1)>1?`<button ${affordable>=1?"":"disabled"} onclick="guildSellItem(${i},${p},${x.qty||1})">${affordable<(x.qty||1)?`出售${affordable}`:"全售"}</button>`:""}</span></div>`;
    }).join("")||"<div class='card small'>背包內目前沒有可出售物品。</div>";
    showModal("冒險者公會・收購櫃檯",`<div class="card small">同一商品的收購與零售價格共用本地供需倍率。玩家大量出售只會讓價格緩慢下降，96小時內逐步恢復；單一局部供需最多下壓10%、上推8%。公會收購仍固定比一般市場收購價低10%。本日剩餘收購資金：<b>${market.budgetRemaining}銀</b>。</div>${rows}<div class="actions"><button onclick="renderFacility('guild')">上一頁</button></div>`);
  };

  guildSellItem=function(index,unitPrice,qty=1){
    if(G.character.currentFacility!=="guild")return;
    const x=G.character.inventory[index],d=x&&item(x.id);if(!x||!d)return;
    const market=marketFacilityState("guild"),price=guildBuybackUnitPrice(d),affordable=Math.floor(market.budgetRemaining/price);
    qty=Math.max(0,Math.min(Number(qty)||1,x.qty||1,affordable));
    if(qty<1){alert("公會本日收購資金不足，請隔日再來。");return}
    const id=x.id;
    if(!removeItem(id,qty,index))return;
    market.budgetRemaining-=price*qty;
    G.character.moneySilver+=price*qty;
    registerItemMarketTrade(d,qty,"guild");
    persist();
    openGuildBuyback();
  };

  shopBuy=function(fid){
    if(G.character.currentFacility!==fid)return;
    const f=DB.facilities[fid],stock=(f.stock||[]).map(item).filter(Boolean),market=marketFacilityState(fid);
    const rows=stock.map(d=>{
      const p=shopBuyUnitPrice(d),qty=marketStockQty(fid,d),flow=itemTradeFlowText(d);
      return `<div class="itemrow"><span><b>${d.name}</b> <span class="tier">${d.tier}</span><br><span class="small">${itemStatsText(d)}｜${flow}｜今日庫存 ${qty}</span></span><span>${p}銀 <button ${qty>0?"":"disabled"} onclick="buyItem('${fid}','${d.id}',${p})">${qty>0?"購買":"售罄"}</button></span></div>`;
    }).join("")||"目前沒有庫存。";
    showModal(f.name+"・購買",`<div class="card small">商品有每日庫存上限。收購與售價現在共用同一個本地供需倍率：市場供應增加時兩端同步緩降，需求增加時兩端同步緩升。</div>${rows}<div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`);
  };

  buyItem=function(fid,id,p){
    if(G.character.currentFacility!==fid)return;
    const d=item(id),f=DB.facilities[fid];if(!d||!(f?.stock||[]).includes(id))return;
    const market=marketFacilityState(fid),price=shopBuyUnitPrice(d),qty=marketStockQty(fid,d);
    if(qty<=0){alert("今日庫存已售罄。");shopBuy(fid);return}
    if(G.character.moneySilver<price){alert("銀幣不足");return}
    G.character.moneySilver-=price;
    market.stock[id]=qty-1;
    market.budgetRemaining=Math.min(market.budgetMax*2,market.budgetRemaining+price);
    addItem(id);
    registerItemMarketTrade(d,-1,"shop");
    persist();
    shopBuy(fid);
  };

  shopSell=function(fid){
    if(G.character.currentFacility!==fid)return;
    const market=marketFacilityState(fid),list=G.character.inventory.map((x,i)=>[x,i]).filter(([x])=>{const d=item(x.id);return d&&canSellTo(fid,d)});
    const rows=list.map(([x,i])=>{
      const d=item(x.id),p=shopSellUnitPrice(d),ok=market.budgetRemaining>=p,flow=itemTradeFlowText(d);
      return `<div class="itemrow"><span>${d.name} <span class="tier">${d.tier}</span> ×${x.qty||1}<br><span class="small">${flow}</span></span><span>${p}銀 <button ${ok?"":"disabled"} onclick="sellItem('${fid}',${i},${p})">出售1</button></span></div>`;
    }).join("")||"沒有此設施會收購的物品。";
    showModal(DB.facilities[fid].name+"・出售",`<div class="card small">大量出售不再讓收購價快速崩跌；局部供需變動有上下限，且同商品零售價同步調整。本日剩餘收購資金：<b>${market.budgetRemaining}銀</b>，隔日恢復。</div>${rows}<div class="actions"><button onclick="renderFacility('${fid}')">上一頁</button></div>`);
  };

  sellItem=function(fid,index,p){
    if(G.character.currentFacility!==fid)return;
    const x=G.character.inventory[index],d=x&&item(x.id);if(!x||!d||!canSellTo(fid,d))return;
    const market=marketFacilityState(fid),price=shopSellUnitPrice(d);
    if(market.budgetRemaining<price){alert("店家本日收購資金不足，請隔日再來。");return}
    if(!removeItem(x.id,1,index))return;
    market.budgetRemaining-=price;
    G.character.moneySilver+=price;
    if((DB.facilities[fid]?.stock||[]).includes(d.id)){
      const current=marketStockQty(fid,d),limit=marketStockLimit(d);
      market.stock[d.id]=Math.min(limit,current+1);
    }
    registerItemMarketTrade(d,1,"shop");
    persist();
    shopSell(fid);
  };

  window.itemTradeFlowFactor=itemTradeFlowFactor;
  window.itemTradePressure=itemTradePressure;
  window.marketLiquidity=marketLiquidity;
})();
