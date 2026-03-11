// 一言（Hitokoto）小组件
// 每次刷新展示一条随机名言/语录，支持多种类型筛选。
// 数据来源：hitokoto.cn 公共 API
//
// 环境变量：
//   TYPE - 句子类型，可选 a(动画) b(漫画) c(游戏) d(文学) e(原创)
//          f(来自网络) g(其他) h(影视) i(诗词) j(网易云) k(哲学)
//          默认不限

export default async function (ctx) {
  const type = ctx.env.TYPE || "";
  const url = `https://v1.hitokoto.cn/${type ? `?c=${type}` : ""}`;

  let hitokoto = "生活不止眼前的苟且，还有诗和远方。";
  let from = "未知";

  try {
    const resp = await ctx.http.get(url, { timeout: 5000 });
    const data = await resp.json();
    hitokoto = data.hitokoto;
    from = data.from_who
      ? `${data.from_who}「${data.from}」`
      : `「${data.from}」`;
  } catch {
    // 使用默认值
  }

  // 30 分钟后刷新
  const refreshTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  return {
    type: "widget",
    padding: 16,
    gap: 0,
    backgroundGradient: {
      type: "linear",
      colors: ["#FEF3C7", "#FDE68A"],
      stops: [0, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0, y: 1 },
    },
    refreshAfter: refreshTime,
    children: [
      // 顶部图标
      {
        type: "image",
        src: "sf-symbol:quote.opening",
        width: 20,
        height: 20,
        color: "#92400E66",
      },

      { type: "spacer" },

      // 引文内容
      {
        type: "text",
        text: hitokoto,
        font: { size: "callout", weight: "medium" },
        textColor: "#78350F",
        maxLines: 4,
        minScale: 0.8,
      },

      { type: "spacer" },

      // 出处
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "spacer" },
          {
            type: "text",
            text: `— ${from}`,
            font: { size: "caption1" },
            textColor: "#92400EAA",
            maxLines: 1,
            minScale: 0.7,
          },
        ],
      },
    ],
  };
}
