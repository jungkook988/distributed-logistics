"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { BarChart3, Download, Search, Filter, Calendar, TrendingUp, MapPin } from "lucide-react"
import { useAnalysisData } from "@/hooks/use-analysis-data"
import { usePagination } from "@/hooks/use-pagination"

type AnalyticsData = {
  timeRange: string
  metrics: {
    totalOrders: number
    completedOrders: number
    delayedOrders: number
    averageDeliveryTime: number
    onTimeRate: number
  }
  trends: {
    date: string
    orders: number
    delays: number
    efficiency: number
  }[]
  regions: {
    name: string
    orders: number
    efficiency: number
  }[]
  detailedReports: {
    id: string
    date: string
    region: string
    orders: number
    completed: number
    delayed: number
    efficiency: number
    revenue: number
  }[]
}

// 生成模拟详细报表数据
const generateDetailedReports = () => {
  const regions = ["北京", "上海", "广州", "深圳", "杭州", "南京", "武汉", "成都", "西安", "重庆"]
  const reports = []

  for (let i = 0; i < 150; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const region = regions[Math.floor(Math.random() * regions.length)]
    const orders = 100 + Math.floor(Math.random() * 500)
    const completed = Math.floor(orders * (0.85 + Math.random() * 0.1))
    const delayed = orders - completed
    const efficiency = (completed / orders) * 100

    reports.push({
      id: `RPT-${String(i + 1).padStart(4, "0")}`,
      date: date.toISOString().split("T")[0],
      region,
      orders,
      completed,
      delayed,
      efficiency: Number(efficiency.toFixed(1)),
      revenue: Math.floor(orders * (50 + Math.random() * 100)),
    })
  }

  return reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// 模拟分析数据
const generateAnalyticsData = (): AnalyticsData => ({
  timeRange: "最近30天",
  metrics: {
    totalOrders: 45230,
    completedOrders: 42180,
    delayedOrders: 3050,
    averageDeliveryTime: 4.2,
    onTimeRate: 93.3,
  },
  trends: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
    orders: 1200 + Math.floor(Math.random() * 800),
    delays: 50 + Math.floor(Math.random() * 100),
    efficiency: 88 + Math.random() * 10,
  })),
  regions: [
    { name: "北京", orders: 8200, efficiency: 96.2 },
    { name: "上海", orders: 7800, efficiency: 94.8 },
    { name: "广州", orders: 6100, efficiency: 93.5 },
    { name: "深圳", orders: 5900, efficiency: 95.1 },
    { name: "杭州", orders: 4200, efficiency: 92.8 },
    { name: "南京", orders: 3800, efficiency: 91.5 },
    { name: "武汉", orders: 3200, efficiency: 90.2 },
    { name: "成都", orders: 2900, efficiency: 89.8 },
  ],
  detailedReports: generateDetailedReports(),
})

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d")
  const [searchTerm, setSearchTerm] = useState("")
  const [regionFilter, setRegionFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [itemsPerPage, setItemsPerPage] = useState(15)

  const analyticsData = useMemo(() => generateAnalyticsData(), [timeRange])
  const { exportData } = useAnalysisData()

  // 过滤和排序详细报表数据
  const filteredReports = useMemo(() => {
    let filtered = analyticsData.detailedReports

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.region.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // 区域过滤
    if (regionFilter !== "all") {
      filtered = filtered.filter((report) => report.region === regionFilter)
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a]
      let bValue: any = b[sortBy as keyof typeof b]

      if (sortBy === "date") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [analyticsData.detailedReports, searchTerm, regionFilter, sortBy, sortOrder])

  // 趋势数据分页
  const trendsPagination = usePagination({
    data: analyticsData.trends,
    itemsPerPage: 10,
  })

  // 区域数据分页
  const regionsPagination = usePagination({
    data: analyticsData.regions,
    itemsPerPage: 5,
  })

  // 详细报表分页
  const reportsPagination = usePagination({
    data: filteredReports,
    itemsPerPage,
  })

  const exportAnalyticsData = async (format: "csv" | "json") => {
    try {
      await exportData(format, "analytics")
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const renderPaginationItems = (pagination: any) => {
    const { currentPage, totalPages, goToPage } = pagination
    const items = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              数据分析与报表
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">最近7天</SelectItem>
                  <SelectItem value="30d">最近30天</SelectItem>
                  <SelectItem value="90d">最近90天</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => exportAnalyticsData("csv")}>
                <Download className="w-4 h-4 mr-2" />
                导出CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportAnalyticsData("json")}>
                <Download className="w-4 h-4 mr-2" />
                导出JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">总览</TabsTrigger>
              <TabsTrigger value="trends">趋势分析</TabsTrigger>
              <TabsTrigger value="regions">区域分析</TabsTrigger>
              <TabsTrigger value="reports">详细报表</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">订单完成率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {((analyticsData.metrics.completedOrders / analyticsData.metrics.totalOrders) * 100).toFixed(1)}%
                    </div>
                    <Progress
                      value={(analyticsData.metrics.completedOrders / analyticsData.metrics.totalOrders) * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">平均配送时间</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.metrics.averageDeliveryTime}小时</div>
                    <p className="text-xs text-green-600 mt-1">较上周减少0.3小时</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">准时配送率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{analyticsData.metrics.onTimeRate}%</div>
                    <Progress value={analyticsData.metrics.onTimeRate} className="mt-2" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      趋势分析 ({analyticsData.timeRange})
                    </CardTitle>
                    <div className="text-sm text-gray-600">
                      显示 {trendsPagination.startIndex} - {trendsPagination.endIndex} 条，共{" "}
                      {trendsPagination.totalItems} 条
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trendsPagination.currentData.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium w-20">{trend.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">订单:</span>
                            <Badge variant="outline">{trend.orders}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">延迟:</span>
                            <Badge variant={trend.delays > 100 ? "destructive" : "secondary"}>{trend.delays}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">效率:</span>
                          <span className="font-medium">{trend.efficiency.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {trendsPagination.totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={trendsPagination.previousPage}
                              className={!trendsPagination.canGoPrevious ? "opacity-50" : ""}
                            />
                          </PaginationItem>
                          {renderPaginationItems(trendsPagination)}
                          <PaginationItem>
                            <PaginationNext
                              onClick={trendsPagination.nextPage}
                              className={!trendsPagination.canGoNext ? "opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="regions" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      区域配送分析
                    </CardTitle>
                    <div className="text-sm text-gray-600">
                      显示 {regionsPagination.startIndex} - {regionsPagination.endIndex} 条，共{" "}
                      {regionsPagination.totalItems} 条
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {regionsPagination.currentData.map((region, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-4">
                          <span className="font-medium w-16">{region.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">订单量:</span>
                            <span className="font-medium">{region.orders.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">效率:</span>
                            <span className="font-medium">{region.efficiency}%</span>
                          </div>
                          <Progress value={region.efficiency} className="w-20" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {regionsPagination.totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={regionsPagination.previousPage}
                              className={!regionsPagination.canGoPrevious ? "opacity-50" : ""}
                            />
                          </PaginationItem>
                          {renderPaginationItems(regionsPagination)}
                          <PaginationItem>
                            <PaginationNext
                              onClick={regionsPagination.nextPage}
                              className={!regionsPagination.canGoNext ? "opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">详细报表</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 搜索和过滤控件 */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="搜索报表..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={regionFilter} onValueChange={setRegionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="区域筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部区域</SelectItem>
                        {Array.from(new Set(analyticsData.detailedReports.map((r) => r.region))).map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="排序字段" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">日期</SelectItem>
                        <SelectItem value="orders">订单数</SelectItem>
                        <SelectItem value="efficiency">效率</SelectItem>
                        <SelectItem value="revenue">收入</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="排序方式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">降序</SelectItem>
                        <SelectItem value="asc">升序</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="每页显示" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10条/页</SelectItem>
                        <SelectItem value="15">15条/页</SelectItem>
                        <SelectItem value="25">25条/页</SelectItem>
                        <SelectItem value="50">50条/页</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 分页信息 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      显示 {reportsPagination.totalItems > 0 ? reportsPagination.startIndex : 0} -{" "}
                      {reportsPagination.endIndex} 条，共 {reportsPagination.totalItems} 条报表
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {filteredReports.length !== analyticsData.detailedReports.length &&
                          `已过滤 ${filteredReports.length} 条`}
                      </span>
                    </div>
                  </div>

                  {/* 报表表格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">报表ID</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">日期</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">区域</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">订单数</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">完成数</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">延迟数</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">效率</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">收入</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportsPagination.currentData.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2 font-mono text-sm">{report.id}</td>
                            <td className="border border-gray-200 px-4 py-2">{report.date}</td>
                            <td className="border border-gray-200 px-4 py-2">{report.region}</td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              {report.orders.toLocaleString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              {report.completed.toLocaleString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              <span className={report.delayed > 50 ? "text-red-600" : ""}>{report.delayed}</span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              <span
                                className={
                                  report.efficiency >= 95
                                    ? "text-green-600"
                                    : report.efficiency >= 90
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }
                              >
                                {report.efficiency}%
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              ¥{report.revenue.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 分页控件 */}
                  {reportsPagination.totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={reportsPagination.previousPage}
                              className={!reportsPagination.canGoPrevious ? "opacity-50" : ""}
                            />
                          </PaginationItem>
                          {renderPaginationItems(reportsPagination)}
                          <PaginationItem>
                            <PaginationNext
                              onClick={reportsPagination.nextPage}
                              className={!reportsPagination.canGoNext ? "opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
