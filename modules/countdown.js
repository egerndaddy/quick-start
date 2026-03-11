// 倒计时小组件
// 使用 date 元素实现实时倒计时，系统自动更新，无需频繁刷新 Widget。
// 可通过环境变量自定义目标日期和标题。
//
// 环境变量：
//   TITLE    - 倒计时标题，默认 "目标日"
//   DATE     - 目标日期，ISO 8601 格式，默认 "2026-12-31T00:00:00+08:00"
//   ICON     - SF Symbol 图标名，默认 "flag.checkered"
//   COLOR_1  - 渐变起始色，默认 "#6366F1"
//   COLOR_2  - 渐变结束色，默认 "#8B5CF6"

export default async function (ctx) {
  const env = ctx.env;
  const title = env.TITLE || "目标日";
  const targetDate = env.DATE || "2026-12-31T00:00:00+08:00";
  const icon = env.ICON || "flag.checkered";
  const color1 = env.COLOR_1 || "#6366F1";
  const color2 = env.COLOR_2 || "#8B5CF6";

  const now = new Date();
  const target = new Date(targetDate);
  const diffMs = target - now;
  const totalDays = Math.max(0, Math.ceil(diffMs / 86400000));

  // 计算进度（假设从 365 天前开始算）
  const totalSpan = 365;
  const progress = Math.min(1, Math.max(0, 1 - totalDays / totalSpan));
  const progressPercent = Math.round(progress * 100);

  return {
    type: "widget",
    padding: 16,
    gap: 12,
    backgroundGradient: {
      type: "linear",
      colors: [color1, color2],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 },
    },
    children: [
      // 标题行
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          {
            type: "image",
            src: `sf-symbol:${icon}`,
            width: 16,
            height: 16,
            color: "#FFFFFFCC",
          },
          {
            type: "text",
            text: title,
            font: { size: "subheadline", weight: "semibold" },
            textColor: "#FFFFFFCC",
          },
        ],
      },

      { type: "spacer" },

      // 剩余天数
      {
        type: "stack",
        direction: "row",
        alignItems: "end",
        gap: 4,
        children: [
          {
            type: "text",
            text: `${totalDays}`,
            font: { size: 42, weight: "bold" },
            textColor: "#FFFFFF",
          },
          {
            type: "stack",
            padding: [0, 0, 6, 0],
            children: [
              {
                type: "text",
                text: "天",
                font: { size: "title3", weight: "medium" },
                textColor: "#FFFFFFBB",
              },
            ],
          },
        ],
      },

      // 进度条
      {
        type: "stack",
        direction: "column",
        gap: 4,
        children: [
          {
            type: "stack",
            direction: "row",
            height: 4,
            borderRadius: 2,
            backgroundColor: "#FFFFFF33",
            children: [
              {
                type: "stack",
                flex: Math.max(0.01, progress),
                height: 4,
                borderRadius: 2,
                backgroundColor: "#FFFFFF",
                children: [],
              },
              {
                type: "stack",
                flex: 1 - progress,
                children: [],
              },
            ],
          },
          {
            type: "stack",
            direction: "row",
            children: [
              {
                type: "date",
                date: targetDate,
                format: "date",
                font: { size: "caption2" },
                textColor: "#FFFFFF99",
              },
              { type: "spacer" },
              {
                type: "text",
                text: `${progressPercent}%`,
                font: { size: "caption2", weight: "medium" },
                textColor: "#FFFFFF99",
              },
            ],
          },
        ],
      },
    ],
  };
}
