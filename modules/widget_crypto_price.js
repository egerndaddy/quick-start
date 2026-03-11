/*
 * Crypto Price Widget - Generic Script
 * 获取主流加密货币实时价格，根据 widgetFamily 生成不同 UI
 */

var COINS = "bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2";
var API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=" + COINS + "&vs_currencies=usd&include_24hr_change=true";

var COIN_MAP = {
  bitcoin:      { symbol: "BTC",  name: "Bitcoin",   icon: "bitcoinsign.circle.fill",  color: "#F7931A" },
  ethereum:     { symbol: "ETH",  name: "Ethereum",  icon: "diamond.fill",             color: "#627EEA" },
  solana:       { symbol: "SOL",  name: "Solana",    icon: "sun.max.fill",             color: "#9945FF" },
  binancecoin:  { symbol: "BNB",  name: "BNB Chain", icon: "hexagon.fill",             color: "#F3BA2F" },
  ripple:       { symbol: "XRP",  name: "Ripple",    icon: "drop.fill",                color: "#00AAE4" },
  dogecoin:     { symbol: "DOGE", name: "Dogecoin",  icon: "hare.fill",                color: "#C3A634" },
  cardano:      { symbol: "ADA",  name: "Cardano",   icon: "circle.grid.cross.fill",   color: "#0033AD" },
  "avalanche-2":{ symbol: "AVAX", name: "Avalanche", icon: "triangle.fill",            color: "#E84142" },
};

var ALL_IDS = Object.keys(COIN_MAP);

function formatPrice(price) {
  if (price >= 1000) return "$" + price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (price >= 1) return "$" + price.toFixed(2);
  return "$" + price.toFixed(4);
}

function formatChange(change) {
  if (change == null) return "+0.0%";
  var sign = change >= 0 ? "+" : "";
  return sign + change.toFixed(1) + "%";
}

function changeColor(change) {
  return change >= 0 ? "#34C759" : "#FF3B30";
}

function changeIcon(change) {
  return change >= 0 ? "arrow.up.right" : "arrow.down.right";
}

// --- DSL Builders ---

function txt(text, fontSize, weight, color, opts) {
  var el = {
    type: "text",
    text: text,
    font: { weight: weight || "regular", size: fontSize, family: "Menlo" },
  };
  if (color) el.textColor = color;
  if (opts) { for (var k in opts) el[k] = opts[k]; }
  return el;
}

function icon(systemName, size, tintColor, opts) {
  var el = {
    type: "image",
    src: "sf-symbol:" + systemName,
    width: size,
    height: size,
  };
  if (tintColor) el.color = tintColor;
  if (opts) { for (var k in opts) el[k] = opts[k]; }
  return el;
}

function hstack(children, opts) {
  var el = {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: children,
  };
  if (opts) { for (var k in opts) el[k] = opts[k]; }
  return el;
}

function vstack(children, opts) {
  var el = {
    type: "stack",
    direction: "column",
    alignItems: "start",
    children: children,
  };
  if (opts) { for (var k in opts) el[k] = opts[k]; }
  return el;
}

function spacer(length) {
  var el = { type: "spacer" };
  if (length != null) el.length = length;
  return el;
}

function dateTxt(dateStr, style, fontSize, weight, color) {
  return {
    type: "date",
    date: dateStr,
    format: style,
    font: { size: fontSize, weight: weight || "medium" },
    textColor: color,
  };
}

function coinIcon(info, size) {
  var pad = Math.round(size * 0.3);
  var total = size + pad * 2;
  return vstack([icon(info.icon, size, info.color)], {
    alignItems: "center",
    padding: [pad, pad, pad, pad],
    backgroundColor: info.color + "33",
    borderRadius: total / 2,
  });
}

function cardGradient(color) {
  return {
    type: "linear",
    colors: [color + "33", color + "11"],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
}

// --- Shared UI Components ---

function separator() {
  return hstack([spacer()], { height: 1, backgroundColor: "rgba(255,255,255,0.08)" });
}

function headerBar(title, titleSize, iconSize, showTime) {
  var children = [
    icon("chart.line.uptrend.xyaxis.circle.fill", iconSize, "#FFD700"),
    txt(title, titleSize, "heavy", "#FFD700", {
      shadowColor: "rgba(255,215,0,0.4)",
      shadowRadius: 4,
      shadowOffset: { x: 0, y: 0 },
    }),
    spacer(),
  ];
  if (showTime) {
    children.push(dateTxt(new Date().toISOString(), "time", Math.max(9, titleSize - 4), "medium", "rgba(255,255,255,0.5)"));
  }
  return hstack(children, { gap: 4 });
}

function footerBar() {
  return hstack([
    icon("clock.arrow.circlepath", 8, "rgba(255,255,255,0.3)"),
    dateTxt(new Date().toISOString(), "relative", 9, "medium", "rgba(255,255,255,0.3)"),
    spacer(),
    txt("CoinGecko", 8, "medium", "rgba(255,255,255,0.2)"),
  ], { gap: 3 });
}

function sectionLabel(label) {
  return txt(label, 10, "semibold", "rgba(255,255,255,0.3)");
}

// --- Row / Card Builders ---

var CARD_PRESETS = {
  small:  { layout: "column", iconSize: 14, priceSize: 15, symbolSize: 12, changeSize: 11, changeIconSize: 8,  borderRadius: 10, padding: [8, 10, 8, 10],   borderWidth: 0.5, nameSize: 0,  innerGap: 3 },
  medium: { layout: "row",    iconSize: 20, priceSize: 18, symbolSize: 16, changeSize: 13, changeIconSize: 10, borderRadius: 14, padding: [10, 12, 10, 12], borderWidth: 1,   nameSize: 10, innerGap: 6 },
  large:  { layout: "row",    iconSize: 26, priceSize: 24, symbolSize: 18, changeSize: 15, changeIconSize: 12, borderRadius: 14, padding: [14, 16, 14, 16], borderWidth: 1,   nameSize: 11, innerGap: 8 },
};

function coinCard(id, data, variant) {
  var info = COIN_MAP[id];
  var change = data.usd_24h_change;
  var p = CARD_PRESETS[variant];

  var changeRow = hstack([
    icon(changeIcon(change), p.changeIconSize, changeColor(change)),
    txt(formatChange(change), p.changeSize, "semibold", changeColor(change)),
  ], { gap: 2 });

  var cardOpts = {
    gap: p.innerGap,
    padding: p.padding,
    backgroundGradient: cardGradient(info.color),
    borderRadius: p.borderRadius,
    borderWidth: p.borderWidth,
    borderColor: info.color + (p.borderWidth >= 1 ? "55" : "44"),
  };

  if (p.layout === "column") {
    return vstack([
      hstack([coinIcon(info, p.iconSize), txt(info.symbol, p.symbolSize, "bold", "#FFFFFF")], { gap: 4 }),
      txt(formatPrice(data.usd), p.priceSize, "semibold", "#FFFFFF", { minScale: 0.6, maxLines: 1 }),
      changeRow,
    ], cardOpts);
  }

  var nameItems = [txt(info.symbol, p.symbolSize, "heavy", "#FFFFFF")];
  if (p.nameSize) {
    nameItems.push(txt(info.name, p.nameSize, "medium", "rgba(255,255,255,0.5)"));
  }

  return vstack([
    hstack([
      coinIcon(info, p.iconSize),
      vstack(nameItems, { gap: 0 }),
      spacer(),
      vstack([
        txt(formatPrice(data.usd), p.priceSize, "bold", "#FFFFFF"),
        changeRow,
      ], { alignItems: "end", gap: 1 }),
    ], { gap: p.innerGap }),
  ], cardOpts);
}

function coinRow(id, data, compact) {
  var info = COIN_MAP[id];
  var change = data.usd_24h_change;
  var sz = compact ? 11 : 13;
  var iconSz = compact ? 11 : 14;

  return hstack([
    coinIcon(info, iconSz),
    txt(info.symbol, sz, "medium", "#FFFFFF", { maxLines: 1 }),
    spacer(),
    txt(formatPrice(data.usd), sz, "semibold", "#FFFFFF", { maxLines: 1, minScale: 0.7 }),
    txt(formatChange(change), sz, "medium", changeColor(change)),
  ], { gap: compact ? 4 : 6 });
}

function rowGroup(items, gap) {
  return vstack(items, { gap: gap || 6 });
}

function filterAvailable(ids, prices) {
  return ids.filter(function (id) { return prices[id]; });
}

// --- System Widget Shell ---

function systemWidget(gradientColors, padding, children, extraOpts) {
  var opts = {
    type: "widget",
    gap: 0,
    padding: padding,
    backgroundGradient: {
      type: "linear",
      colors: gradientColors,
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 },
    },
    children: children,
  };
  if (extraOpts) { for (var k in extraOpts) opts[k] = opts[k] || extraOpts[k]; }
  return opts;
}

function systemBody(title, titleSize, iconSize, bodyChildren) {
  return [
    headerBar(title, titleSize, iconSize, true),
    spacer(6),
    separator(),
    spacer(),
  ].concat(bodyChildren).concat([
    spacer(),
    footerBar(),
  ]);
}

// --- Layout Builders ---

function buildAccessoryCircular(prices) {
  var btc = prices.bitcoin;
  var change = btc ? btc.usd_24h_change : 0;
  return {
    type: "widget",
    gap: 2,
    children: [
      spacer(),
      icon("bitcoinsign.circle.fill", 18),
      txt(btc ? formatPrice(btc.usd) : "--", 12, "bold", null, { minScale: 0.5 }),
      txt(btc ? formatChange(change) : "", 9, "medium", null, { minScale: 0.5 }),
      spacer(),
    ],
  };
}

function buildAccessoryRectangular(prices) {
  var ids = filterAvailable(["bitcoin", "ethereum", "solana", "binancecoin"], prices);
  var rows = ids.map(function (id) {
    var data = prices[id];
    var info = COIN_MAP[id];
    var change = data.usd_24h_change;
    return hstack([
      icon(info.icon, 9),
      vstack([txt(info.symbol, 10, "bold")], { width: 30, height: 12 }),
      spacer(),
      txt(formatPrice(data.usd), 10, "semibold", null, { minScale: 0.5, maxLines: 1 }),
      vstack([txt(formatChange(change), 9, "medium")], { alignItems: "end", width: 42, height: 12 }),
    ], { gap: 3 });
  });
  return { type: "widget", gap: 2, children: rows };
}

function buildAccessoryInline(prices) {
  var btc = prices.bitcoin;
  var eth = prices.ethereum;
  var text = "";
  if (btc) text += "BTC " + formatPrice(btc.usd) + " " + formatChange(btc.usd_24h_change);
  else text += "BTC --";
  if (eth) text += " | ETH " + formatPrice(eth.usd);
  return {
    type: "widget",
    children: [
      icon("bitcoinsign.circle.fill", 12),
      txt(text, 12, "medium", null, { minScale: 0.7, maxLines: 1 }),
    ],
  };
}

function buildSystemSmall(prices) {
  var rows = filterAvailable(["bitcoin", "ethereum", "solana", "binancecoin"], prices)
    .map(function (id) { return coinRow(id, prices[id], true); });

  return systemWidget(
    ["#1A1A2E", "#16213E", "#0F3460"],
    [12, 14, 10, 14],
    systemBody("Crypto", 13, 14, [
      rowGroup(rows, 6),
    ])
  );
}

function buildSystemMedium(prices) {
  var ids = filterAvailable(ALL_IDS, prices);
  var left = ids.slice(0, 4).map(function (id) { return coinRow(id, prices[id], true); });
  var right = ids.slice(4).map(function (id) { return coinRow(id, prices[id], true); });

  return systemWidget(
    ["#0D0D1A", "#1A1A3E", "#2D1B69"],
    [12, 14, 10, 14],
    systemBody("Crypto Tracker", 14, 18, [
      hstack([
        rowGroup(left, 5),
        vstack([], { width: 1, backgroundColor: "rgba(255,255,255,0.08)" }),
        rowGroup(right, 5),
      ], { alignItems: "start", gap: 10 }),
    ])
  );
}

function buildSystemLarge(prices) {
  var featured = filterAvailable(["bitcoin", "ethereum"], prices)
    .map(function (id) { return coinCard(id, prices[id], "medium"); });

  var restIds = ALL_IDS.filter(function (id) { return id !== "bitcoin" && id !== "ethereum"; });
  var rows = filterAvailable(restIds, prices)
    .map(function (id) { return coinRow(id, prices[id], true); });

  return systemWidget(
    ["#0B0B1E", "#151538", "#1E0A3C"],
    [12, 14, 10, 14],
    systemBody("Crypto Tracker", 16, 20, [
      rowGroup(featured, 8),
      spacer(),
      sectionLabel("MARKET"),
      spacer(4),
      rowGroup(rows, 6),
    ]),
    { backgroundGradient: {
      type: "linear",
      colors: ["#0B0B1E", "#151538", "#1E0A3C"],
      stops: [0, 0.5, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0.8, y: 1 },
    }}
  );
}

function buildSystemExtraLarge(prices) {
  var featured = filterAvailable(["bitcoin", "ethereum", "solana"], prices)
    .map(function (id) { return coinCard(id, prices[id], "large"); });

  var restIds = ALL_IDS.filter(function (id) {
    return id !== "bitcoin" && id !== "ethereum" && id !== "solana";
  });
  var restCards = filterAvailable(restIds, prices)
    .map(function (id) { return coinCard(id, prices[id], "small"); });

  return systemWidget(
    ["#0B0B1E", "#0E1A3D", "#1E0A3C"],
    [14, 16, 12, 16],
    systemBody("Crypto Tracker", 20, 24, [
      hstack(featured, { gap: 10 }),
      spacer(),
      sectionLabel("MARKET"),
      spacer(4),
      hstack(restCards, { gap: 8 }),
    ])
  );
}

function errorWidget() {
  return {
    type: "widget",
    padding: 16,
    backgroundColor: "#1A1A2E",
    children: [
      icon("wifi.exclamationmark", 32, "#FF3B30"),
      txt("Failed to load prices", 14, "medium", "#FF3B30"),
    ],
  };
}

// --- Render ---

var BUILDERS = {
  accessoryCircular:    buildAccessoryCircular,
  accessoryRectangular: buildAccessoryRectangular,
  accessoryInline:      buildAccessoryInline,
  systemSmall:          buildSystemSmall,
  systemMedium:         buildSystemMedium,
  systemLarge:          buildSystemLarge,
  systemExtraLarge:     buildSystemExtraLarge,
};

function render(prices, family) {
  var build = BUILDERS[family] || buildSystemMedium;
  var widget = build(prices);
  widget.refreshAfter = new Date(Date.now() + 60 * 1000).toISOString();
  return widget;
}

// --- Cache ---

var CACHE_KEY = "crypto_prices_cache";
var CACHE_TTL = 60 * 1000;

function loadCache(ctx) {
  var cache = ctx.storage.getJSON(CACHE_KEY);
  if (!cache) return null;
  if (Date.now() - cache.ts < CACHE_TTL) return cache.prices;
  return null;
}

function saveCache(ctx, prices) {
  ctx.storage.setJSON(CACHE_KEY, { ts: Date.now(), prices: prices });
}

// --- Main ---

export default async function(ctx) {
  var family = ctx.widgetFamily;
  console.log("widgetFamily: " + (family || "null"));

  var cached = loadCache(ctx);
  if (cached) {
    console.log("Using cached prices");
    return render(cached, family);
  }

  try {
    var resp = await ctx.http.get(API_URL);
    var prices = await resp.json();
    saveCache(ctx, prices);
    return render(prices, family);
  } catch (e) {
    console.log("API request failed: " + e.message);
    var staleCache = ctx.storage.getJSON(CACHE_KEY);
    if (staleCache) {
      console.log("Using stale cache as fallback");
      return render(staleCache.prices, family);
    }
    return errorWidget();
  }
}
