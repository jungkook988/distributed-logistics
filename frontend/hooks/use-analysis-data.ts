"use client"

import { useState, useCallback } from "react"
import { apiClient, type TrendData, type RegionData } from "@/lib/api-client"

export function useAnalysisData() {
  const [trends, setTrends] = useState<TrendData[]>([])
  const [regions, setRegions] = useState<RegionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrends = useCallback(async (metric: string, interval: string, from?: number, to?: number) => {
    setLoading(true)
    setError(null)

    try {
      const data = await apiClient.getAnalysisTrends(metric, interval, from, to)
      setTrends(data)
    } catch (err) {
      console.error("Failed to fetch trends:", err)
      setError("获取趋势数据失败")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRegions = useCallback(async (metric: string, from?: number, to?: number) => {
    setLoading(true)
    setError(null)

    try {
      const data = await apiClient.getAnalysisRegions(metric, from, to)
      setRegions(data)
    } catch (err) {
      console.error("Failed to fetch regions:", err)
      setError("获取区域数据失败")
    } finally {
      setLoading(false)
    }
  }, [])

  const exportData = useCallback(async (format: "csv" | "json", type: string, from?: number, to?: number) => {
    try {
      const blob = await apiClient.exportAnalysis(format, type, from, to)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `logistics-export-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to export data:", err)
      throw new Error("导出数据失败")
    }
  }, [])

  return {
    trends,
    regions,
    loading,
    error,
    fetchTrends,
    fetchRegions,
    exportData,
  }
}
