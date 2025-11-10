"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient, type MapPath, type HeatmapPoint } from "@/lib/api-client"

export function useMapData() {
  const [paths, setPaths] = useState<MapPath[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMapData = useCallback(async (from?: number, to?: number) => {
    setLoading(true)
    setError(null)

    try {
      const [pathsData, heatmapData] = await Promise.all([
        apiClient.getMapPaths(from, to),
        apiClient.getHeatmap(from, to),
      ])

      setPaths(pathsData)
      setHeatmap(heatmapData)
    } catch (err) {
      console.error("Failed to fetch map data:", err)
      setError("获取地图数据失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMapData()
  }, [fetchMapData])

  return {
    paths,
    heatmap,
    loading,
    error,
    refetch: fetchMapData,
  }
}
