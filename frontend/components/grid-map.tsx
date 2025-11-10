"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Grid3X3 } from "lucide-react"

type Vehicle = {
  id: string
  location: { lat: number; lng: number }
  status: "normal" | "delayed" | "error"
  speed: number
  cargo: number
}

type GridMapProps = {
  vehicles: Vehicle[]
  onVehicleSelect?: (vehicle: Vehicle) => void
}

export function GridMap({ vehicles, onVehicleSelect }: GridMapProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [gridSize, setGridSize] = useState(20)
  const [viewMode, setViewMode] = useState("density")

  // 将经纬度转换为网格坐标
  const latLngToGrid = (lat: number, lng: number) => {
    const baseLatLng = { lat: 39.9042, lng: 116.4074 }
    const range = 0.1

    const gridX = Math.floor(((lng - (baseLatLng.lng - range / 2)) / range) * gridSize)
    const gridY = Math.floor(((baseLatLng.lat + range / 2 - lat) / range) * gridSize)

    return {
      x: Math.max(0, Math.min(gridSize - 1, gridX)),
      y: Math.max(0, Math.min(gridSize - 1, gridY)),
    }
  }

  // 计算网格密度
  const calculateGridDensity = () => {
    const density: { [key: string]: { count: number; vehicles: Vehicle[] } } = {}

    vehicles.forEach((vehicle) => {
      const { x, y } = latLngToGrid(vehicle.location.lat, vehicle.location.lng)
      const key = `${x}-${y}`

      if (!density[key]) {
        density[key] = { count: 0, vehicles: [] }
      }

      density[key].count++
      density[key].vehicles.push(vehicle)
    })

    return density
  }

  const gridDensity = calculateGridDensity()

  // 获取网格颜色
  const getGridColor = (x: number, y: number) => {
    const key = `${x}-${y}`
    const cell = gridDensity[key]

    if (!cell) return "bg-gray-100"

    if (viewMode === "density") {
      if (cell.count >= 3) return "bg-red-200"
      if (cell.count >= 2) return "bg-yellow-200"
      if (cell.count >= 1) return "bg-green-200"
    } else {
      // 状态模式
      const hasError = cell.vehicles.some((v) => v.status === "error")
      const hasDelayed = cell.vehicles.some((v) => v.status === "delayed")

      if (hasError) return "bg-red-200"
      if (hasDelayed) return "bg-yellow-200"
      return "bg-green-200"
    }

    return "bg-gray-100"
  }

  // 获取网格内容
  const getGridContent = (x: number, y: number) => {
    const key = `${x}-${y}`
    const cell = gridDensity[key]

    if (!cell) return null

    return (
      <div className="text-xs text-center">
        <div className="font-bold">{cell.count}</div>
        {cell.vehicles.length === 1 && <div className="text-xs">{cell.vehicles[0].id}</div>}
      </div>
    )
  }

  const handleGridClick = (x: number, y: number) => {
    const key = `${x}-${y}`
    const cell = gridDensity[key]

    if (cell && cell.vehicles.length === 1) {
      setSelectedVehicle(cell.vehicles[0])
      onVehicleSelect?.(cell.vehicles[0])
    } else if (cell && cell.vehicles.length > 1) {
      // 显示多个车辆的选择
      setSelectedVehicle(cell.vehicles[0]) // 暂时选择第一个
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5" />
              网格地图视图
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">视图模式:</span>
                <Select value={viewMode} onValueChange={setViewMode}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="density">密度视图</SelectItem>
                    <SelectItem value="status">状态视图</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">网格大小:</span>
                <Select value={gridSize.toString()} onValueChange={(value) => setGridSize(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10x10</SelectItem>
                    <SelectItem value="15">15x15</SelectItem>
                    <SelectItem value="20">20x20</SelectItem>
                    <SelectItem value="25">25x25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 图例 */}
            <div className="flex items-center gap-6 text-sm">
              {viewMode === "density" ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-200 border"></div>
                    <span>1辆车</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-200 border"></div>
                    <span>2辆车</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-200 border"></div>
                    <span>3+辆车</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-200 border"></div>
                    <span>正常</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-200 border"></div>
                    <span>延迟</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-200 border"></div>
                    <span>异常</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border"></div>
                <span>无车辆</span>
              </div>
            </div>

            {/* 网格地图 */}
            <div
              className="grid gap-1 border-2 border-gray-300 p-2 bg-white rounded-lg"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                aspectRatio: "1",
              }}
            >
              {Array.from({ length: gridSize * gridSize }, (_, index) => {
                const x = index % gridSize
                const y = Math.floor(index / gridSize)

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`
                      ${getGridColor(x, y)}
                      border border-gray-300
                      cursor-pointer
                      hover:border-blue-500
                      transition-colors
                      flex items-center justify-center
                      min-h-[20px]
                    `}
                    onClick={() => handleGridClick(x, y)}
                    title={`网格 (${x}, ${y})`}
                  >
                    {getGridContent(x, y)}
                  </div>
                )
              })}
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{vehicles.length}</div>
                <div className="text-sm text-blue-600">总车辆数</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{Object.keys(gridDensity).length}</div>
                <div className="text-sm text-green-600">活跃网格</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.max(...Object.values(gridDensity).map((cell) => cell.count), 0)}
                </div>
                <div className="text-sm text-yellow-600">最大密度</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {((Object.keys(gridDensity).length / (gridSize * gridSize)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-purple-600">覆盖率</div>
              </div>
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
                <p className="text-sm text-gray-600">网格位置</p>
                <p className="font-semibold text-xs">
                  {(() => {
                    const { x, y } = latLngToGrid(selectedVehicle.location.lat, selectedVehicle.location.lng)
                    return `(${x}, ${y})`
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
