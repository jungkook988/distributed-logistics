"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient, type OrderOverview, type VehicleStatus, type Alert, type HealthStatus } from "@/lib/api-client"

export function useApiData() {
  const [overview, setOverview] = useState<OrderOverview | null>(null)
  const [vehicles, setVehicles] = useState<VehicleStatus[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // 获取订单概览
  const fetchOverview = useCallback(async () => {
    try {
      const data = await apiClient.getOrderOverview("2025-06-01", "2025-06-30")
      setOverview(data)
    } catch (err) {
      console.error("Failed to fetch overview:", err)
      setError("获取订单概览失败")
    }
  }, [])

  // 获取车辆状态
  const fetchVehicles = useCallback(async () => {
    try {
      const data = await apiClient.getVehicleStatus()
      setVehicles(data)
    } catch (err) {
      console.error("Failed to fetch vehicles:", err)
      setError("获取车辆状态失败")
    }
  }, [])

  // 获取告警列表
  const fetchAlerts = useCallback(async () => {
    try {
      const data = await apiClient.getAlerts()
      setAlerts(data)
    } catch (err) {
      console.error("Failed to fetch alerts:", err)
      setError("获取告警列表失败")
    }
  }, [])

  // 获取健康状态
  const fetchHealthStatus = useCallback(async () => {
    try {
      const data = await apiClient.getHealthStatus()
      setHealthStatus(data)
    } catch (err) {
      console.error("Failed to fetch health status:", err)
      setError("获取健康状态失败")
    }
  }, [])

  // 获取所有数据
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([fetchOverview(), fetchVehicles(), fetchAlerts(), fetchHealthStatus()])
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }, [fetchOverview, fetchVehicles, fetchAlerts, fetchHealthStatus])

  // 初始化数据获取
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // 定时刷新数据
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData()
    }, 30000) // 30秒刷新一次

    return () => clearInterval(interval)
  }, [fetchAllData])

  return {
    overview,
    vehicles,
    alerts,
    healthStatus,
    loading,
    error,
    lastUpdated,
    refetch: fetchAllData,
  }
}
