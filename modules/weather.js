// 天气小组件
// 使用 Open-Meteo 公共 API 获取天气信息，无需 API Key。
//
// 环境变量：
//   CITY - 城市名称（英文），默认 "London"

export default async function (ctx) {
  const city = ctx.env.CITY || "London";

  let temp = "--";
  let feelsLike = "--";
  let description = "加载中…";
  let humidity = "--";
  let wind = "--";
  let weatherIcon = "cloud.fill";
  let displayCity = city;

  try {
    const geoResp = await ctx.http.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`,
      { timeout: 8000 },
    );
    const geoData = await geoResp.json();
    const loc = geoData.results?.[0];
    if (!loc) throw new Error("city not found");

    displayCity = loc.name || city;

    const weatherResp = await ctx.http.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`,
      { timeout: 8000 },
    );
    const weatherData = await weatherResp.json();
    const current = weatherData.current;

    temp = Math.round(current.temperature_2m);
    feelsLike = Math.round(current.apparent_temperature);
    humidity = current.relative_humidity_2m;
    wind = Math.round(current.wind_speed_10m);

    const code = current.weather_code;
    weatherIcon = getWeatherIcon(code);
    description = getWeatherDesc(code);
  } catch {
    // 使用默认值
  }

  const refreshTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const statItem = (icon, value, unit) => ({
    type: "stack",
    direction: "column",
    alignItems: "center",
    gap: 2,
    children: [
      {
        type: "image",
        src: `sf-symbol:${icon}`,
        width: 14,
        height: 14,
        color: "#FFFFFF99",
      },
      {
        type: "text",
        text: `${value}${unit}`,
        font: { size: "caption2", weight: "medium" },
        textColor: "#FFFFFFCC",
      },
    ],
  });

  return {
    type: "widget",
    padding: 14,
    gap: 8,
    backgroundGradient: {
      type: "linear",
      colors: ["#2563EB", "#1E40AF", "#1E3A5F"],
      stops: [0, 0.6, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0.3, y: 1 },
    },
    refreshAfter: refreshTime,
    children: [
      // 城市 + 描述
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          {
            type: "image",
            src: "sf-symbol:location.fill",
            width: 10,
            height: 10,
            color: "#FFFFFFBB",
          },
          {
            type: "text",
            text: displayCity,
            font: { size: "caption1", weight: "medium" },
            textColor: "#FFFFFFBB",
          },
          { type: "spacer" },
          {
            type: "image",
            src: `sf-symbol:${weatherIcon}`,
            width: 18,
            height: 18,
            color: "#FFFFFF",
          },
        ],
      },

      // 温度
      {
        type: "stack",
        direction: "row",
        alignItems: "end",
        gap: 4,
        children: [
          {
            type: "text",
            text: `${temp}°`,
            font: { size: 40, weight: "thin" },
            textColor: "#FFFFFF",
          },
          {
            type: "stack",
            direction: "column",
            alignItems: "start",
            padding: [0, 0, 8, 0],
            gap: 0,
            children: [
              {
                type: "text",
                text: description,
                font: { size: "caption1", weight: "medium" },
                textColor: "#FFFFFFDD",
              },
              {
                type: "text",
                text: `体感 ${feelsLike}°`,
                font: { size: "caption2" },
                textColor: "#FFFFFF99",
              },
            ],
          },
        ],
      },

      { type: "spacer" },

      // 底部指标
      {
        type: "stack",
        direction: "row",
        gap: 0,
        children: [
          statItem("humidity.fill", humidity, "%"),
          { type: "spacer" },
          statItem("wind", wind, "km/h"),
          { type: "spacer" },
          statItem("thermometer.medium", feelsLike, "°"),
        ],
      },
    ],
  };
}

function getWeatherDesc(code) {
  const map = {
    0: "晴",
    1: "大部晴朗",
    2: "多云",
    3: "阴",
    45: "雾",
    48: "雾凇",
    51: "小毛毛雨",
    53: "毛毛雨",
    55: "大毛毛雨",
    56: "冻毛毛雨",
    57: "强冻毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    66: "冻雨",
    67: "强冻雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    77: "霰",
    80: "小阵雨",
    81: "阵雨",
    82: "强阵雨",
    85: "小阵雪",
    86: "大阵雪",
    95: "雷暴",
    96: "雷暴冰雹",
    99: "强雷暴冰雹",
  };
  return map[code] || "未知";
}

function getWeatherIcon(code) {
  if (code === 0) return "sun.max.fill";
  if (code <= 2) return "cloud.sun.fill";
  if (code === 3) return "cloud.fill";
  if (code === 45 || code === 48) return "cloud.fog.fill";
  if (code >= 51 && code <= 57) return "cloud.drizzle.fill";
  if (code >= 61 && code <= 67) return "cloud.rain.fill";
  if (code >= 71 && code <= 77) return "cloud.snow.fill";
  if (code >= 80 && code <= 82) return "cloud.rain.fill";
  if (code >= 85 && code <= 86) return "cloud.snow.fill";
  if (code >= 95) return "cloud.bolt.rain.fill";
  return "cloud.fill";
}
