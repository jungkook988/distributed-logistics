"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react"
import type { HealthStatus } from "@/lib/api-client"

interface HealthMonitorProps {
  healthStatus: HealthStatus | null
}

export function HealthMonitor({ healthStatus }: HealthMonitorProps) {
  if (!healthStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>系统健康监控</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>正在获取系统健康状态...</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "UP":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "DOWN":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <HelpCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UP":
        return "bg-green-100 text-green-800"
      case "DOWN":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getHealthScore = () => {
    const services = Object.values(healthStatus)
    const upCount = services.filter((status) => status === "UP").length
    return (upCount / services.length) * 100
  }

  const healthScore = getHealthScore()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>系统健康概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">整体健康度</span>
              <span className="text-2xl font-bold">{healthScore.toFixed(1)}%</span>
            </div>
            <Progress value={healthScore} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(healthStatus).filter((s) => s === "UP").length}
                </div>
                <div className="text-sm text-gray-600">正常服务</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(healthStatus).filter((s) => s === "DOWN").length}
                </div>
                <div className="text-sm text-gray-600">异常服务</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.values(healthStatus).filter((s) => s === "UNKNOWN").length}
                </div>
                <div className="text-sm text-gray-600">未知状态</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{Object.keys(healthStatus).length}</div>
                <div className="text-sm text-gray-600">总服务数</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>服务状态详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(healthStatus).map(([service, status]) => (
              <Card key={service}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <CardTitle className="text-base capitalize">{service}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(status)}>{status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>服务状态:</span>
                      <span
                        className={
                          status === "UP" ? "text-green-600" : status === "DOWN" ? "text-red-600" : "text-yellow-600"
                        }
                      >
                        {status === "UP" ? "运行正常" : status === "DOWN" ? "服务异常" : "状态未知"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {service === "redis" && "缓存服务"}
                      {service === "hbase" && "分布式数据库"}
                      {service === "kafka" && "消息队列"}
                      {service === "spark" && "分布式计算引擎"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 健康状态告警 */}
      {healthScore < 100 && (
        <Alert className={healthScore < 50 ? "bg-red-50" : "bg-yellow-50"}>
          <AlertTriangle className={`h-4 w-4 ${healthScore < 50 ? "text-red-500" : "text-yellow-500"}`} />
          <AlertDescription className={healthScore < 50 ? "text-red-700" : "text-yellow-700"}>
            {healthScore < 50 ? "系统健康状态严重异常，请立即检查服务状态！" : "部分服务状态异常，建议检查相关组件。"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
