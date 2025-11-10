"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Settings, Key, Shield, CheckCircle, AlertTriangle } from "lucide-react"

export function MapConfigPanel() {
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_AMAP_KEY || "")
  const [securityCode, setSecurityCode] = useState(process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE || "")
  const [isConfigured, setIsConfigured] = useState(!!process.env.NEXT_PUBLIC_AMAP_KEY)

  const validateConfig = () => {
    if (!apiKey) {
      return { valid: false, message: "请输入高德地图API密钥" }
    }
    if (apiKey.length < 20) {
      return { valid: false, message: "API密钥格式不正确" }
    }
    return { valid: true, message: "配置验证通过" }
  }

  const configStatus = validateConfig()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          高德地图配置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 配置状态 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">配置状态:</span>
          {configStatus.valid ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              已配置
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              未配置
            </Badge>
          )}
        </div>

        {/* API密钥配置 */}
        <div className="space-y-2">
          <Label htmlFor="api-key" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API密钥
          </Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="请输入高德地图API密钥"
          />
        </div>

        {/* 安全密钥配置 */}
        <div className="space-y-2">
          <Label htmlFor="security-code" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            安全密钥 (可选)
          </Label>
          <Input
            id="security-code"
            type="password"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value)}
            placeholder="请输入安全密钥"
          />
        </div>

        {/* 配置说明 */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">配置步骤：</p>
              <ol className="list-decimal list-inside text-sm space-y-1">
                <li>
                  访问{" "}
                  <a
                    href="https://console.amap.com/"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                    rel="noreferrer"
                  >
                    高德开放平台
                  </a>
                </li>
                <li>创建应用并获取API密钥</li>
                <li>在应用设置中配置域名白名单</li>
                <li>将API密钥添加到环境变量 NEXT_PUBLIC_AMAP_KEY</li>
                <li>如需要，配置安全密钥到 NEXT_PUBLIC_AMAP_SECURITY_CODE</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        {/* 当前配置信息 */}
        <div className="bg-gray-50 p-3 rounded text-sm">
          <h4 className="font-medium mb-2">当前配置信息：</h4>
          <div className="space-y-1">
            <p>API密钥: {apiKey ? `${apiKey.substring(0, 8)}...` : "未配置"}</p>
            <p>安全密钥: {securityCode ? "已配置" : "未配置"}</p>
            <p>地图版本: 2.0</p>
            <p>支持插件: 缩放控件、工具栏、定位、路径规划</p>
          </div>
        </div>

        {/* 测试按钮 */}
        <Button className="w-full" disabled={!configStatus.valid} onClick={() => window.location.reload()}>
          应用配置并重新加载
        </Button>
      </CardContent>
    </Card>
  )
}
