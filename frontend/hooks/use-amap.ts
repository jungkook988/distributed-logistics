"use client"

import { useEffect, useState, useRef } from "react"
import { AMAP_CONFIG } from "@/lib/amap-config"

declare global {
  interface Window {
    AMap: any
    _AMapSecurityConfig: any
  }
}

export function useAMap() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined" || loadingRef.current) return

    // 检查是否已经加载
    if (window.AMap) {
      setIsLoaded(true)
      return
    }

    loadingRef.current = true

    // 设置安全密钥（如果需要）
    window._AMapSecurityConfig = {
      securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE || "",
    }

    // 动态加载高德地图API
    const script = document.createElement("script")
    script.type = "text/javascript"
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=${AMAP_CONFIG.version}&key=${AMAP_CONFIG.key}&plugin=${AMAP_CONFIG.plugins.join(",")}`

    script.onload = () => {
      if (window.AMap) {
        setIsLoaded(true)
        setError(null)
      } else {
        setError("高德地图API加载失败")
      }
      loadingRef.current = false
    }

    script.onerror = () => {
      setError("无法加载高德地图API，请检查网络连接和API密钥")
      loadingRef.current = false
    }

    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return { isLoaded, error }
}
