// API客户端配置
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5793"

// 类型定义
export interface OrderOverview {
  totalOrders: number
  processingOrders: number
  delayedOrders: number
  onTimeRate: string
}

export interface VehicleStatus {
  vehicleId: string
  latitude: number
  longitude: number
  speed: number
  status: "in_transit" | "idle" | "maintenance" | "delayed"
  load: string
}

export interface VehicleLocation {
  vehicleId: string
  latitude: number
  longitude: number
  speed: number
  timestamp: number
}

export interface VehicleHistory {
  timestamp: number
  latitude: number
  longitude: number
  speed: number
}

export interface MapPath {
  vehicleId: string
  path: [number, number][]
}

export interface HeatmapPoint {
  lat: number
  lng: number
  density: number
}

export interface TrendData {
  timeBucket: number
  value: number
}

export interface RegionData {
  region: string
  value: number
}

export interface Alert {
  id: string
  message: string
  severity: "low" | "medium" | "high"
  timestamp: number
  status: "active" | "acknowledged" | "resolved"
  vehicleId?: string
}

export interface HealthStatus {
  redis: "UP" | "DOWN" | "UNKNOWN"
  hbase: "UP" | "DOWN" | "UNKNOWN"
  kafka: "UP" | "DOWN" | "UNKNOWN"
  spark: "UP" | "DOWN" | "UNKNOWN"
}

// API客户端类
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${url}`, error)
      throw error
    }
  }

  // 仪表盘接口
  async getOrderOverview(from?: number, to?: number): Promise<OrderOverview> {
    const params = new URLSearchParams()
    if (from) params.append("from", from.toString())
    if (to) params.append("to", to.toString())

    return this.request<OrderOverview>(`/metrics/overview?${params}`)
  }

  async getAlertCount(since: number): Promise<{ alertCount: number }> {
    return this.request<{ alertCount: number }>(`/metrics/alerts/count?since=${since}`)
  }

  // 车辆状态接口
  async getVehicleStatus(): Promise<VehicleStatus[]> {
    return this.request<VehicleStatus[]>("/vehicles/status")
  }

  async getVehicleLocation(id: string): Promise<VehicleLocation> {
    return this.request<VehicleLocation>(`/vehicles/${id}/location`)
  }

  async getVehicleHistory(id: string, from: number, to?: number): Promise<VehicleHistory[]> {
    const params = new URLSearchParams()
    params.append("from", from.toString())
    if (to) params.append("to", to.toString())

    return this.request<VehicleHistory[]>(`/vehicles/${id}/history?${params}`)
  }

  // 地图视图接口
  async getMapPaths(from?: number, to?: number): Promise<MapPath[]> {
    const params = new URLSearchParams()
    if (from) params.append("from", from.toString())
    if (to) params.append("to", to.toString())

    return this.request<MapPath[]>(`/map/paths?${params}`)
  }

  async getHeatmap(from?: number, to?: number): Promise<HeatmapPoint[]> {
    const params = new URLSearchParams()
    if (from) params.append("from", from.toString())
    if (to) params.append("to", to.toString())

    return this.request<HeatmapPoint[]>(`/map/heatmap?${params}`)
  }

  // 报表分析接口
  async getAnalysisSummary(from?: number, to?: number): Promise<OrderOverview> {
    const params = new URLSearchParams()
    if (from) params.append("from", from.toString())
    if (to) params.append("to", to.toString())

    return this.request<OrderOverview>(`/analysis/summary?${params}`)
  }

  async getAnalysisTrends(metric: string, interval: string, from?: number, to?: number): Promise<TrendData[]> {
    const params = new URLSearchParams()
    params.append("metric", metric)
    params.append("interval", interval)
    if (from) params.append("from", from.toString())
    if (to) params.append("to", to.toString())

    return this.request<TrendData[]>(`/analysis/trends?${params}`)
  }

  async getAnalysisRegions(metric: string, from?: number, to?: number): Promise<RegionData[]> {
    const params = new URLSearchParams()
    params.append("metric", metric)
    if (from) params.append("from", from.toString())
    if (to) params.append("to", to.toString())

    return this.request<RegionData[]>(`/analysis/regions?${params}`)
  }

  async exportAnalysis(format: "csv" | "json", type: string, from?: number, to?: number): Promise<Blob> {
    const params = new URLSearchParams()
    params.append("format", format)
    params.append("type", type)
    if (from) params.append("from", from.toString())
    if (to) params.append("to", to.toString())

    const response = await fetch(`${this.baseUrl}/analysis/export?${params}`)
    return response.blob()
  }

  // 告警管理接口
  async getAlerts(from?: number, to?: number): Promise<Alert[]> {
    const params = new URLSearchParams()
    if (from) params.append("from", from.toString())
    if (to) params.append("to", to.toString())

    return this.request<Alert[]>(`/alerts?${params}`)
  }

  async createAlert(alert: Omit<Alert, "id">): Promise<Alert> {
    return this.request<Alert>("/alerts", {
      method: "POST",
      body: JSON.stringify(alert),
    })
  }

  async acknowledgeAlert(id: string): Promise<void> {
    await this.request(`/alerts/${id}/ack`, {
      method: "POST",
    })
  }

  // 模式切换接口
  async switchMode(mode: "mock" | "kafka"): Promise<void> {
    await this.request("/mode", {
      method: "POST",
      body: JSON.stringify({ mode }),
    })
  }

  // 健康检查接口
  async getHealthStatus(): Promise<HealthStatus> {
    return this.request<HealthStatus>("/health")
  }
}

// 导出单例实例
export const apiClient = new ApiClient()
