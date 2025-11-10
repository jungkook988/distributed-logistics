"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MapPin, Truck, Navigation, Layers, AlertTriangle, Loader2 } from "lucide-react"
import { useAMap } from "@/hooks/use-amap"
import { VEHICLE_ICONS, MAP_STYLES, mapUtils } from "@/lib/amap-config"

type Vehicle = {
  id: string
  location: { lat: number; lng: number }
  status: "normal" | "delayed" | "error"
  speed: number
  cargo: number
  route?: { lat: number; lng: number }[]
  destination?: { lat: number; lng: number }
}

type RealMapVisualizationProps = {
  vehicles: Vehicle[]
  onVehicleSelect?: (vehicle: Vehicle) => void
}

export function RealMapVisualization({ vehicles, onVehicleSelect }: RealMapVisualizationProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const routeLinesRef = useRef<Map<string, any>>(new Map())

  const { isLoaded, error } = useAMap()
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [mapStyle, setMapStyle] = useState("normal")
  const [showTraffic, setShowTraffic] = useState(false)
  const [showRoutes, setShowRoutes] = useState(true)
  const [isTracking, setIsTracking] = useState(false)

  // 初始化地图
  const initMap = useCallback(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

    try {
      const map = new window.AMap.Map(mapRef.current, {
        zoom: 11,
        center: [116.4074, 39.9042], // 北京中心
        mapStyle: MAP_STYLES[mapStyle as keyof typeof MAP_STYLES],
        features: ["bg", "road", "building", "point"],
        viewMode: "3D",
        pitch: 0,
      })

      // 添加控件
      map.addControl(new window.AMap.Scale())
      map.addControl(new window.AMap.ToolBar())

      // 添加交通图层
      const trafficLayer = new window.AMap.TileLayer.Traffic({
        zIndex: 10,
      })

      if (showTraffic) {
        map.add(trafficLayer)
      }

      mapInstanceRef.current = map

      // 地图点击事件
      map.on("click", () => {
        setSelectedVehicle(null)
      })
    } catch (err) {
      console.error("地图初始化失败:", err)
    }
  }, [isLoaded, mapStyle, showTraffic])

  // 更新车辆标记
  const updateVehicleMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.AMap) return

    const map = mapInstanceRef.current

    // 清除旧标记
    markersRef.current.forEach((marker) => {
      map.remove(marker)
    })
    markersRef.current.clear()

    // 添加新标记
    vehicles.forEach((vehicle) => {
      const [lng, lat] = mapUtils.wgs84ToGcj02(vehicle.location.lng, vehicle.location.lat)

      const marker = new window.AMap.Marker({
        position: [lng, lat],
        icon: new window.AMap.Icon({
          image: VEHICLE_ICONS[vehicle.status].url,
          size: new window.AMap.Size(...VEHICLE_ICONS[vehicle.status].size),
          imageSize: new window.AMap.Size(...VEHICLE_ICONS[vehicle.status].size),
        }),
        title: vehicle.id,
        extData: vehicle,
      })

      // 添加信息窗口
      const infoWindow = new window.AMap.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #333;">${vehicle.id}</h4>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>状态:</strong> 
              <span style="color: ${vehicle.status === "normal" ? "#10b981" : vehicle.status === "delayed" ? "#f59e0b" : "#ef4444"}">
                ${vehicle.status === "normal" ? "正常" : vehicle.status === "delayed" ? "延迟" : "异常"}
              </span>
            </p>
            <p style="margin: 4px 0; font-size: 12px;"><strong>速度:</strong> ${vehicle.speed} km/h</p>
            <p style="margin: 4px 0; font-size: 12px;"><strong>载重:</strong> ${vehicle.cargo}%</p>
            <p style="margin: 4px 0; font-size: 12px;"><strong>位置:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
          </div>
        `,
        offset: new window.AMap.Pixel(0, -30),
      })

      // 标记点击事件
      marker.on("click", () => {
        setSelectedVehicle(vehicle)
        onVehicleSelect?.(vehicle)
        infoWindow.open(map, marker.getPosition())
      })

      map.add(marker)
      markersRef.current.set(vehicle.id, marker)
    })
  }, [vehicles, onVehicleSelect])

  // 更新路线
  const updateRoutes = useCallback(() => {
    if (!mapInstanceRef.current || !showRoutes || !window.AMap) return

    const map = mapInstanceRef.current

    // 清除旧路线
    routeLinesRef.current.forEach((line) => {
      map.remove(line)
    })
    routeLinesRef.current.clear()

    // 为每个车辆添加模拟路线
    vehicles.slice(0, 5).forEach((vehicle, index) => {
      const [startLng, startLat] = mapUtils.wgs84ToGcj02(vehicle.location.lng, vehicle.location.lat)
      const [endLng, endLat] = mapUtils.generateBeijingPoint()

      // 创建路线规划
      const driving = new window.AMap.Driving({
        map: map,
        panel: null,
      })

      driving.search(
        new window.AMap.LngLat(startLng, startLat),
        new window.AMap.LngLat(endLng, endLat),
        (status: string, result: any) => {
          if (status === "complete") {
            const route = result.routes[0]
            if (route) {
              const polyline = new window.AMap.Polyline({
                path: route.path,
                strokeColor:
                  vehicle.status === "normal" ? "#10b981" : vehicle.status === "delayed" ? "#f59e0b" : "#ef4444",
                strokeWeight: 4,
                strokeOpacity: 0.7,
                strokeStyle: vehicle.status === "normal" ? "solid" : "dashed",
              })

              map.add(polyline)
              routeLinesRef.current.set(vehicle.id, polyline)
            }
          }
        },
      )
    })
  }, [vehicles, showRoutes])

  // 地图样式切换
  const changeMapStyle = useCallback((style: string) => {
    setMapStyle(style)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapStyle(MAP_STYLES[style as keyof typeof MAP_STYLES])
    }
  }, [])

  // 交通图层切换
  const toggleTraffic = useCallback((show: boolean) => {
    setShowTraffic(show)
    if (mapInstanceRef.current) {
      const trafficLayer = new window.AMap.TileLayer.Traffic({
        zIndex: 10,
      })
      if (show) {
        mapInstanceRef.current.add(trafficLayer)
      } else {
        mapInstanceRef.current.remove(trafficLayer)
      }
    }
  }, [])

  // 车辆追踪
  const trackVehicle = useCallback((vehicle: Vehicle) => {
    if (!mapInstanceRef.current) return

    const [lng, lat] = mapUtils.wgs84ToGcj02(vehicle.location.lng, vehicle.location.lat)
    mapInstanceRef.current.setCenter([lng, lat])
    mapInstanceRef.current.setZoom(15)
    setIsTracking(true)

    // 3秒后停止追踪
    setTimeout(() => setIsTracking(false), 3000)
  }, [])

  // 初始化地图
  useEffect(() => {
    initMap()
  }, [initMap])

  // 更新车辆标记
  useEffect(() => {
    updateVehicleMarkers()
  }, [updateVehicleMarkers])

  // 更新路线
  useEffect(() => {
    updateRoutes()
  }, [updateRoutes])

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            地图加载失败
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-sm text-gray-600">
            <p>请检查以下配置：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>高德地图API密钥是否正确配置</li>
              <li>网络连接是否正常</li>
              <li>域名是否已在高德开放平台配置白名单</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            正在加载地图...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">正在初始化高德地图组件</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              实时车辆地图 (高德地图)
            </CardTitle>
            <div className="flex items-center gap-4">
              {/* 地图样式选择 */}
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <Select value={mapStyle} onValueChange={changeMapStyle}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">标准</SelectItem>
                    <SelectItem value="satellite">卫星</SelectItem>
                    <SelectItem value="dark">暗色</SelectItem>
                    <SelectItem value="light">浅色</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 交通图层开关 */}
              <div className="flex items-center gap-2">
                <Switch id="traffic" checked={showTraffic} onCheckedChange={toggleTraffic} />
                <Label htmlFor="traffic" className="text-sm">
                  交通
                </Label>
              </div>

              {/* 路线显示开关 */}
              <div className="flex items-center gap-2">
                <Switch id="routes" checked={showRoutes} onCheckedChange={setShowRoutes} />
                <Label htmlFor="routes" className="text-sm">
                  路线
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* 地图容器 */}
            <div ref={mapRef} className="w-full h-96 rounded-lg border-2 border-gray-200" />

            {/* 车辆统计 */}
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
              <div className="text-sm font-medium">车辆统计</div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>正常: {vehicles.filter((v) => v.status === "normal").length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>延迟: {vehicles.filter((v) => v.status === "delayed").length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>异常: {vehicles.filter((v) => v.status === "error").length}</span>
                </div>
              </div>
            </div>

            {/* 追踪状态 */}
            {isTracking && (
              <div className="absolute top-4 right-4 bg-blue-500 text-white rounded-lg px-3 py-2 text-sm">
                <Navigation className="w-4 h-4 inline mr-2" />
                正在追踪车辆...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 车辆列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            车辆列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {vehicles.map((vehicle) => (
              <Card
                key={vehicle.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedVehicle?.id === vehicle.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => trackVehicle(vehicle)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{vehicle.id}</CardTitle>
                    <Badge
                      className={
                        vehicle.status === "normal"
                          ? "bg-green-100 text-green-800"
                          : vehicle.status === "delayed"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {vehicle.status === "normal" ? "正常" : vehicle.status === "delayed" ? "延迟" : "异常"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>速度: {vehicle.speed} km/h</span>
                    <span>载重: {vehicle.cargo}%</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {vehicle.location.lat.toFixed(4)}, {vehicle.location.lng.toFixed(4)}
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => trackVehicle(vehicle)}>
                    <Navigation className="w-3 h-3 mr-1" />
                    追踪
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 地图使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• 点击地图上的车辆图标查看详细信息</p>
          <p>• 点击车辆卡片可以追踪定位到该车辆</p>
          <p>• 使用右上角的控件切换地图样式和图层</p>
          <p>• 绿色图标表示正常，黄色表示延迟，红色表示异常</p>
          <p>• 路线以不同颜色和样式显示车辆状态</p>
        </CardContent>
      </Card>
    </div>
  )
}
