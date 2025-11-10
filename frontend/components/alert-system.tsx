"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { AlertTriangle, Bell, CheckCircle, Clock, Search, Filter } from "lucide-react"
import { apiClient, type Alert as ApiAlert } from "@/lib/api-client"
import { usePagination } from "@/hooks/use-pagination"

interface AlertSystemProps {
  alerts: ApiAlert[]
}

export function AlertSystem({ alerts }: AlertSystemProps) {
  const [localAlerts, setLocalAlerts] = useState<ApiAlert[]>(alerts)
  const [filteredAlerts, setFilteredAlerts] = useState<ApiAlert[]>(alerts)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // 分页功能
  const {
    currentPage,
    totalPages,
    currentData,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({
    data: filteredAlerts,
    itemsPerPage,
  })

  useEffect(() => {
    setLocalAlerts(alerts)
    setFilteredAlerts(alerts)
  }, [alerts])

  // 过滤和搜索功能
  useEffect(() => {
    let filtered = localAlerts

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(
        (alert) =>
          alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (alert.vehicleId && alert.vehicleId.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // 状态过滤
    if (statusFilter !== "all") {
      filtered = filtered.filter((alert) => alert.status === statusFilter)
    }

    // 严重程度过滤
    if (severityFilter !== "all") {
      filtered = filtered.filter((alert) => alert.severity === severityFilter)
    }

    setFilteredAlerts(filtered)
    goToPage(1) // 重置到第一页
  }, [localAlerts, searchTerm, statusFilter, severityFilter, goToPage])

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await apiClient.acknowledgeAlert(alertId)
      setLocalAlerts((prev) =>
        prev.map((alert) => (alert.id === alertId ? { ...alert, status: "acknowledged" } : alert)),
      )
    } catch (error) {
      console.error("Failed to acknowledge alert:", error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "acknowledged":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return null
    }
  }

  const renderPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大可见页数，显示所有页数
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={`page-${i}`}>
            <PaginationLink onClick={() => goToPage(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>,
        )
      }
    } else {
      // 复杂分页逻辑
      items.push(
        <PaginationItem key="page-1">
          <PaginationLink onClick={() => goToPage(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>,
      )

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>,
        )
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={`page-${i}`}>
            <PaginationLink onClick={() => goToPage(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>,
        )
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>,
        )
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={`page-${totalPages}`}>
            <PaginationLink onClick={() => goToPage(totalPages)} isActive={currentPage === totalPages}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>,
        )
      }
    }

    return items
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            告警管理系统
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 告警统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">
                {localAlerts.filter((a) => a.status === "active").length}
              </div>
              <div className="text-sm text-red-600">活跃告警</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">
                {localAlerts.filter((a) => a.status === "acknowledged").length}
              </div>
              <div className="text-sm text-yellow-600">已确认</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {localAlerts.filter((a) => a.status === "resolved").length}
              </div>
              <div className="text-sm text-green-600">已解决</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{localAlerts.length}</div>
              <div className="text-sm text-blue-600">总告警数</div>
            </div>
          </div>

          {/* 搜索和过滤 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索告警..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="acknowledged">已确认</SelectItem>
                <SelectItem value="resolved">已解决</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="严重程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部级别</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="每页显示" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5条/页</SelectItem>
                <SelectItem value="10">10条/页</SelectItem>
                <SelectItem value="20">20条/页</SelectItem>
                <SelectItem value="50">50条/页</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 分页信息 */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              显示 {totalItems > 0 ? startIndex : 0} - {endIndex} 条，共 {totalItems} 条告警
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {filteredAlerts.length !== localAlerts.length && `已过滤 ${filteredAlerts.length} 条`}
              </span>
            </div>
          </div>

          {/* 告警列表 */}
          <div className="space-y-3 mb-6">
            {currentData.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {localAlerts.length === 0 ? "系统运行正常，暂无告警信息。" : "没有找到符合条件的告警。"}
                </AlertDescription>
              </Alert>
            ) : (
              currentData.map((alert) => (
                <Alert
                  key={alert.id}
                  className={
                    alert.status === "active"
                      ? "border-red-200 bg-red-50"
                      : alert.status === "acknowledged"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-green-200 bg-green-50"
                  }
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(alert.status)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{alert.type} #{alert.id}</span>
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          {alert.vehicleId && <Badge variant="outline">车辆: {alert.vehicleId}</Badge>}
                        </div>
                        <AlertDescription className="mb-2">{alert.message}</AlertDescription>
                        <div className="text-xs text-gray-500">{new Date(alert.ts * 1000).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                          确认
                        </Button>
                      )}
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={previousPage} className={!canGoPrevious ? "opacity-50" : ""} />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext onClick={nextPage} className={!canGoNext ? "opacity-50" : ""} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
