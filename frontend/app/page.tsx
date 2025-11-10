"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Truck,
  MapPin,
  Database,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react"
import { useApiData } from "@/hooks/use-api-data"
import { RealMapVisualization } from "@/components/real-map-visualization"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { AlertSystem } from "@/components/alert-system"
import { HealthMonitor } from "@/components/health-monitor"
import { apiClient } from "@/lib/api-client"
import { GridMap } from "@/components/grid-map"

export default function LogisticsSystem() {
  const { overview, vehicles, alerts, healthStatus, loading, error, lastUpdated, refetch } = useApiData()
  const [currentMode, setCurrentMode] = useState<"mock" | "kafka">("mock")
  const [switchingMode, setSwitchingMode] = useState(false)

  // 转换车辆状态为地图组件需要的格式
  const mapVehicles = vehicles.map((vehicle) => ({
    id: vehicle.vehicleId,
    location: {
      lat: vehicle.latitude,
      lng: vehicle.longitude,
    },
    status: vehicle.status === "in_transit" ? "normal" : vehicle.status === "delayed" ? "delayed" : "error",
    speed: vehicle.speed,
    cargo: Number.parseInt(vehicle.load) || 0,
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_transit":
        return "bg-green-500"
      case "delayed":
        return "bg-yellow-500"
      case "maintenance":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_transit":
        return <Badge className="bg-green-100 text-green-800">运输中</Badge>
      case "delayed":
        return <Badge className="bg-yellow-100 text-yellow-800">延迟</Badge>
      case "maintenance":
        return <Badge className="bg-red-100 text-red-800">维护</Badge>
      case "idle":
        return <Badge className="bg-gray-100 text-gray-800">空闲</Badge>
      default:
        return <Badge>未知</Badge>
    }
  }

  const switchMode = async (mode: "mock" | "kafka") => {
    setSwitchingMode(true)
    try {
      await apiClient.switchMode(mode)
      setCurrentMode(mode)
      await refetch() // 刷新数据
    } catch (err) {
      console.error("Failed to switch mode:", err)
    } finally {
      setSwitchingMode(false)
    }
  }

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">正在加载系统数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">分布式物流系统监控平台</h1>
            <p className="text-gray-600 mt-2">基于 Spark + Kafka + HBase + MySQL + Redis 的分布式实时物流追踪系统</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${error ? "bg-red-500" : "bg-green-500"}`} />
              <span className="text-sm font-medium">{error ? "连接异常" : "系统正常"}</span>
            </div>
            <Button onClick={refetch} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              刷新
            </Button>
          </div>
        </div>

        {/* API连接状态 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {error ? <WifiOff className="w-5 h-5 text-red-500" /> : <Wifi className="w-5 h-5 text-green-500" />}
                API 连接状态
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => switchMode("mock")}
                  disabled={switchingMode}
                  variant={currentMode === "mock" ? "default" : "outline"}
                  size="sm"
                >
                  模拟模式
                </Button>
                <Button
                  onClick={() => switchMode("kafka")}
                  disabled={switchingMode}
                  variant={currentMode === "kafka" ? "default" : "outline"}
                  size="sm"
                >
                  实时模式
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">连接状态:</span>
                {error ? (
                  <Badge className="bg-red-100 text-red-800">连接失败</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800">已连接</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">当前模式:</span>
                <Badge className={currentMode === "kafka" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                  {currentMode === "kafka" ? "实时模式" : "模拟模式"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">最后更新:</span>
                <span className="text-sm">{lastUpdated ? lastUpdated.toLocaleTimeString() : "未更新"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">车辆数量:</span>
                <span className="font-semibold">{vehicles.length}</span>
              </div>

              {error && (
                <div className="col-span-4">
                  <Alert className="bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-700">
                      API连接错误: {error}
                      <br />
                      请检查后端服务是否正常运行在 http://localhost:5793
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Architecture Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              系统架构概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Database className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">数据采集层</h3>
                <p className="text-sm text-gray-600">Kafka 消息队列</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Zap className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">计算层</h3>
                <p className="text-sm text-gray-600">Spark Streaming</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <HardDrive className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">存储层</h3>
                <p className="text-sm text-gray-600">HBase + MySQL + Redis</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Activity className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-semibold">应用层</h3>
                <p className="text-sm text-gray-600">SpringBoot + Next.js</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">实时监控</TabsTrigger>
            <TabsTrigger value="vehicles">车辆追踪</TabsTrigger>
            <TabsTrigger value="map">地图视图</TabsTrigger>
            <TabsTrigger value="analytics">数据分析</TabsTrigger>
            <TabsTrigger value="alerts">告警系统</TabsTrigger>
            <TabsTrigger value="health">健康监控</TabsTrigger>
            <TabsTrigger value="cluster">集群状态</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总订单数</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totalOrders?.toLocaleString() || "0"}</div>
                  <p className="text-xs text-muted-foreground">实时数据</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">处理中订单</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.processingOrders?.toLocaleString() || "0"}</div>
                  <p className="text-xs text-muted-foreground">实时更新</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">延迟订单</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{overview?.delayedOrders || "0"}</div>
                  <p className="text-xs text-muted-foreground">需要关注</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">准时率</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{overview?.onTimeRate || "0"}%</div>
                  <p className="text-xs text-muted-foreground">系统计算</p>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {overview && overview.delayedOrders > 50 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  检测到 {overview.delayedOrders} 个延迟订单，建议检查运输路线和交通状况。
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  车辆实时状态
                </CardTitle>
                <CardDescription>显示所有运输车辆的实时位置和状态信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {vehicles.map((vehicle) => (
                    <Card key={vehicle.vehicleId} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{vehicle.vehicleId}</CardTitle>
                          {getStatusBadge(vehicle.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>速度: {vehicle.speed} km/h</span>
                          <span>载重: {vehicle.load}%</span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <GridMap vehicles={mapVehicles} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <AlertSystem alerts={alerts} />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <HealthMonitor healthStatus={healthStatus} />
          </TabsContent>

          <TabsContent value="cluster" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  系统健康状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthStatus && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(healthStatus).map(([service, status]) => (
                      <Card key={service}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm capitalize">{service}</CardTitle>
                            <Badge
                              className={
                                status === "UP"
                                  ? "bg-green-100 text-green-800"
                                  : status === "DOWN"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                status === "UP" ? "bg-green-500" : status === "DOWN" ? "bg-red-500" : "bg-yellow-500"
                              }`}
                            />
                            <span className="text-sm">
                              {status === "UP" ? "运行正常" : status === "DOWN" ? "服务异常" : "状态未知"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
