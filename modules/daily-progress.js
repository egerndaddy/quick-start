// 今日进度小组件
// 以可视化方式展示今天、本月、本年的时间进度。
// 纯本地计算，无需网络请求，适合展示 Widget DSL 的布局能力。

export default async function (ctx) {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // 今日进度
  const dayProgress = (hours * 60 + minutes) / 1440;

  // 本月进度
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  // 本年进度
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress = (now - startOfYear) / (endOfYear - startOfYear);

  const progressBar = (label, value, color) => ({
    type: "stack",
    direction: "column",
    gap: 4,
    flex: 1,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          {
            type: "text",
            text: label,
            font: { size: "caption1", weight: "medium" },
            textColor: "#FFFFFFCC",
          },
          { type: "spacer" },
          {
            type: "text",
            text: `${Math.round(value * 100)}%`,
            font: { size: "caption1", weight: "bold", family: "Menlo" },
            textColor: color,
          },
        ],
      },
      // 进度条：用 flex 按比例分配填充与空白
      {
        type: "stack",
        direction: "row",
        height: 6,
        borderRadius: 3,
        backgroundColor: "#FFFFFF1A",
        children: [
          {
            type: "stack",
            flex: Math.max(0.01, value),
            height: 6,
            borderRadius: 3,
            backgroundGradient: {
              type: "linear",
              colors: [color, color + "99"],
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 1, y: 0 },
            },
            children: [],
          },
          {
            type: "stack",
            flex: 1 - value,
            children: [],
          },
        ],
      },
    ],
  });

  // 5 分钟后刷新
  const refreshTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  return {
    type: "widget",
    padding: 16,
    gap: 10,
    backgroundColor: { light: "#1C1C1E", dark: "#1C1C1E" },
    refreshAfter: refreshTime,
    children: [
      // 标题
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          {
            type: "image",
            src: "sf-symbol:chart.bar.fill",
            width: 14,
            height: 14,
            color: "#FFFFFF99",
          },
          {
            type: "text",
            text: `${now.getFullYear()} 年时间进度`,
            font: { size: "caption1", weight: "semibold" },
            textColor: "#FFFFFF99",
          },
        ],
      },

      // 三个进度条
      progressBar("今日", dayProgress, "#34D399"),
      progressBar("本月", monthProgress, "#60A5FA"),
      progressBar("本年", yearProgress, "#F472B6"),
    ],
  };
}
