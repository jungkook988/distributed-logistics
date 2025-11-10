"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Truck } from "lucide-react"

// 模拟地图数据
type Vehicle = {
  id: string
  location: { lat: number; lng: number }
  status: "normal" | "delayed" | "error"
  speed: number
  cargo: number
  route?: { lat: number; lng: number }[]
}

type MapVisualizationProps = {
  vehicles: Vehicle[]
  onVehicleSelect?: (vehicle: Vehicle) => void
}

export function MapVisualization({ vehicles, onVehicleSelect }: MapVisualizationProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 39.9042, lng: 116.4074 })
  const [zoom, setZoom] = useState(10)

  // 模拟地图渲染
  const renderVehicleOnMap = (vehicle: Vehicle) => {
    const statusColors = {
      normal: "#10b981",
      delayed: "#f59e0b",
      error: "#ef4444",
    }

    return (
      <div
        key={vehicle.id}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        style={{
          left: `${((vehicle.location.lng - mapCenter.lng + 0.05) / 0.1) * 100}%`,
          top: `${((mapCenter.lat - vehicle.location.lat + 0.05) / 0.1) * 100}%`,
        }}
        onClick={() => {
          setSelectedVehicle(vehicle)
          onVehicleSelect?.(vehicle)
        }}
      >
        <div className="relative">
          <Truck className="w-6 h-6" style={{ color: statusColors[vehicle.status] }} />
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
            {vehicle.id}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              实时车辆地图
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(zoom + 1, 15))}>
                放大
              </Button>
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(zoom - 1, 5))}>
                缩小
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* 模拟地图背景 */}
            <div
              ref={mapRef}
              className="w-full h-96 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg relative overflow-hidden border-2 border-gray-200"
              style={{
                backgroundImage: `
                  linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            >
              {/* 城市标记 */}
              <div className="absolute top-4 left-4 bg-white px-2 py-1 rounded shadow text-sm font-medium">
                北京市区
              </div>

              {/* 渲染车辆 */}
              {vehicles.map(renderVehicleOnMap)}

              {/* 路线示例 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <pattern id="dashed" patternUnits="userSpaceOnUse" width="8" height="8">
                    <path d="M0,4 L8,4" stroke="#6b7280" strokeWidth="1" strokeDasharray="2,2" />
                  </pattern>
                </defs>
                {vehicles.slice(0, 3).map((vehicle, index) => (
                  <path
                    key={`route-${vehicle.id}`}
                    d={`M ${((vehicle.location.lng - mapCenter.lng + 0.05) / 0.1) * 100}% ${((mapCenter.lat - vehicle.location.lat + 0.05) / 0.1) * 100}% 
                        L ${((vehicle.location.lng - mapCenter.lng + 0.03) / 0.1) * 100}% ${((mapCenter.lat - vehicle.location.lat + 0.03) / 0.1) * 100}%`}
                    stroke="url(#dashed)"
                    strokeWidth="2"
                    fill="none"
                  />
                ))}
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 车辆详情面板 */}
      {selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>车辆详情 - {selectedVehicle.id}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVehicle(null)}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">状态</p>
                <Badge
                  className={
                    selectedVehicle.status === "normal"
                      ? "bg-green-100 text-green-800"
                      : selectedVehicle.status === "delayed"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {selectedVehicle.status === "normal"
                    ? "正常"
                    : selectedVehicle.status === "delayed"
                      ? "延迟"
                      : "异常"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">当前速度</p>
                <p className="font-semibold">{selectedVehicle.speed} km/h</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">载重率</p>
                <p className="font-semibold">{selectedVehicle.cargo}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">位置</p>
                <p className="font-semibold text-xs">
                  {selectedVehicle.location.lat.toFixed(4)}, {selectedVehicle.location.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
