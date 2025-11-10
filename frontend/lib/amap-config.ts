// 高德地图配置
export const AMAP_CONFIG = {
  key: process.env.NEXT_PUBLIC_AMAP_KEY || "your-amap-key-here",
  version: "2.0",
  plugins: ["AMap.Scale", "AMap.ToolBar", "AMap.Geolocation", "AMap.Driving"],
}

// 地图样式配置
export const MAP_STYLES = {
  normal: "amap://styles/normal",
  dark: "amap://styles/dark",
  light: "amap://styles/light",
  satellite: "amap://styles/satellite",
}

// 车辆图标配置
export const VEHICLE_ICONS = {
  normal: {
    url:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
        <path d="M12 16l4-4 4 4" stroke="#ffffff" stroke-width="2" fill="none"/>
      </svg>
    `),
    size: [32, 32],
    anchor: [16, 16],
  },
  delayed: {
    url:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
        <path d="M16 8v8l4 4" stroke="#ffffff" stroke-width="2" fill="none"/>
      </svg>
    `),
    size: [32, 32],
    anchor: [16, 16],
  },
  error: {
    url:
      "data:image/svg+xml;base64+" +
      btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
        <path d="M12 12l8 8M20 12l-8 8" stroke="#ffffff" stroke-width="2"/>
      </svg>
    `),
    size: [32, 32],
    anchor: [16, 16],
  },
}

// 地图工具函数
export const mapUtils = {
  // 坐标转换：WGS84 -> GCJ02 (高德地图坐标系)
  wgs84ToGcj02: (lng: number, lat: number) => {
    // 简化的坐标转换，实际项目中建议使用专业的坐标转换库
    return [lng + 0.0065, lat + 0.006]
  },

  // 计算两点间距离
  getDistance: (point1: [number, number], point2: [number, number]) => {
    const [lng1, lat1] = point1
    const [lng2, lat2] = point2
    const radLat1 = (lat1 * Math.PI) / 180
    const radLat2 = (lat2 * Math.PI) / 180
    const a = radLat1 - radLat2
    const b = (lng1 * Math.PI) / 180 - (lng2 * Math.PI) / 180
    const s =
      2 *
      Math.asin(
        Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)),
      )
    return s * 6378.137 * 1000 // 返回米
  },

  // 生成随机北京坐标点
  generateBeijingPoint: () => {
    const baseLng = 116.4074 // 北京经度
    const baseLat = 39.9042 // 北京纬度
    const offset = 0.05 // 偏移范围
    return [baseLng + (Math.random() - 0.5) * offset, baseLat + (Math.random() - 0.5) * offset]
  },
}
