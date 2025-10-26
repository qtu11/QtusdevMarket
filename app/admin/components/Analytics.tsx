"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Users, Package, DollarSign, Calendar, Download, Eye, Star, Clock } from 'lucide-react'
import { useState, useMemo } from "react"

interface AnalyticsProps {
  users: any[]
  products: any[]
  purchases: any[]
  deposits: any[]
  withdrawals: any[]
}

export function Analytics({ users, products, purchases, deposits, withdrawals }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState("7d")

  // Filter data by time range
  const filterByTimeRange = (data: any[], dateField: string = "createdAt") => {
    const now = new Date()
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField])
      return itemDate >= startDate
    })
  }

  // Calculate analytics data
  const analytics = useMemo(() => {
    const filteredUsers = filterByTimeRange(users)
    const filteredPurchases = filterByTimeRange(purchases, "timestamp")
    const filteredDeposits = filterByTimeRange(deposits, "timestamp")
    const filteredWithdrawals = filterByTimeRange(withdrawals, "timestamp")

    // Revenue analytics
    const totalRevenue = filteredPurchases.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalDeposits = filteredDeposits.reduce((sum, d) => sum + (d.amount || 0), 0)
    const totalWithdrawals = filteredWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)
    const netRevenue = totalRevenue + totalDeposits - totalWithdrawals

    // User analytics
    const activeUsers = users.filter(user => {
      if (!user.lastActivity) return false
      const lastActivity = new Date(user.lastActivity)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return lastActivity >= thirtyDaysAgo
    }).length

    // Product analytics
    const productSales = products.map(product => {
      const sales = filteredPurchases.filter(p => p.product_id === product.id).length
      const revenue = filteredPurchases
        .filter(p => p.product_id === product.id)
        .reduce((sum, p) => sum + (p.amount || 0), 0)
      return {
        ...product,
        sales,
        revenue
      }
    }).sort((a, b) => b.sales - a.sales)

    // Daily data for trends
    const dailyData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toDateString()
      
      const dayPurchases = purchases.filter(p => new Date(p.timestamp).toDateString() === dateStr)
      const dayUsers = users.filter(u => new Date(u.createdAt).toDateString() === dateStr)
      
      return {
        date: dateStr,
        revenue: dayPurchases.reduce((sum, p) => sum + (p.amount || 0), 0),
        users: dayUsers.length,
        transactions: dayPurchases.length
      }
    }).reverse()

    // User behavior analytics
    const userBehavior = {
      averageOrderValue: totalRevenue / (filteredPurchases.length || 1),
      conversionRate: (filteredPurchases.length / (filteredUsers.length || 1)) * 100,
      repeatCustomers: users.filter(user => {
        const userPurchases = purchases.filter(p => p.user_id === user.uid)
        return userPurchases.length > 1
      }).length
    }

    return {
      totalRevenue,
      totalDeposits,
      totalWithdrawals,
      netRevenue,
      activeUsers,
      productSales,
      dailyData,
      userBehavior,
      newUsers: filteredUsers.length,
      totalTransactions: filteredPurchases.length
    }
  }, [users, products, purchases, deposits, withdrawals, timeRange])

  // Export analytics data
  const exportData = () => {
    const data = {
      summary: {
        timeRange,
        totalRevenue: analytics.totalRevenue,
        totalUsers: analytics.newUsers,
        totalTransactions: analytics.totalTransactions,
        averageOrderValue: analytics.userBehavior.averageOrderValue,
        conversionRate: analytics.userBehavior.conversionRate
      },
      productSales: analytics.productSales,
      dailyData: analytics.dailyData,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Thống kê & Phân tích</h2>
          <p className="text-muted-foreground">Phân tích chi tiết về hoạt động kinh doanh</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày</SelectItem>
              <SelectItem value="30d">30 ngày</SelectItem>
              <SelectItem value="90d">90 ngày</SelectItem>
              <SelectItem value="365d">1 năm</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất dữ liệu
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu thuần</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.netRevenue.toLocaleString('vi-VN')}đ
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.netRevenue > 0 ? <TrendingUp className="inline w-3 h-3 text-green-500" /> : <TrendingDown className="inline w-3 h-3 text-red-500" />}
              {" "}Trong {timeRange === "7d" ? "7 ngày" : timeRange === "30d" ? "30 ngày" : timeRange === "90d" ? "90 ngày" : "1 năm"} qua
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng hoạt động</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.newUsers} người dùng mới
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giá trị đơn hàng TB</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.userBehavior.averageOrderValue.toLocaleString('vi-VN')}đ
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalTransactions} giao dịch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ chuyển đổi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.userBehavior.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.userBehavior.repeatCustomers} khách hàng quay lại
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Phân tích doanh thu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-800">Doanh thu từ bán hàng</p>
                  <p className="text-xs text-green-600">Từ {analytics.totalTransactions} giao dịch</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {analytics.totalRevenue.toLocaleString('vi-VN')}đ
                </p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-800">Tổng nạp tiền</p>
                  <p className="text-xs text-blue-600">Từ người dùng</p>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {analytics.totalDeposits.toLocaleString('vi-VN')}đ
                </p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-red-800">Tổng rút tiền</p>
                  <p className="text-xs text-red-600">Đã chi trả</p>
                </div>
                <p className="text-lg font-bold text-red-600">
                  -{analytics.totalWithdrawals.toLocaleString('vi-VN')}đ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.productSales.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-blue-100 text-blue-800">#{index + 1}</Badge>
                    <div>
                      <p className="text-sm font-medium">{product.title}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{product.sales} bán</p>
                    <p className="text-xs text-green-600">{product.revenue.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
              ))}
              {analytics.productSales.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Chưa có dữ liệu bán hàng</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Xu hướng 30 ngày gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.dailyData.reduce((sum, day) => sum + day.revenue, 0).toLocaleString('vi-VN')}đ
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Người dùng mới</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.dailyData.reduce((sum, day) => sum + day.users, 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Giao dịch</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.dailyData.reduce((sum, day) => sum + day.transactions, 0)}
                </p>
              </div>
            </div>

            {/* Simple trend visualization */}
            <div className="space-y-2">
              <h4 className="font-medium">Biểu đồ xu hướng (7 ngày gần nhất)</h4>
              <div className="flex items-end space-x-1 h-32 bg-gray-50 p-4 rounded">
                {analytics.dailyData.slice(-7).map((day, index) => {
                  const maxRevenue = Math.max(...analytics.dailyData.slice(-7).map(d => d.revenue))
                  const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 80 : 0
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="bg-blue-500 w-full rounded-t"
                        style={{ height: `${height}px` }}
                        title={`${day.revenue.toLocaleString('vi-VN')}đ`}
                      ></div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Phân tích người dùng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border rounded">
                <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                <p className="text-sm text-muted-foreground">Tổng người dùng</p>
              </div>
              <div className="text-center p-3 border rounded">
                <p className="text-2xl font-bold text-green-600">{analytics.activeUsers}</p>
                <p className="text-sm text-muted-foreground">Hoạt động (30 ngày)</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Khách hàng mới</span>
                <span>{analytics.newUsers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Khách hàng quay lại</span>
                <span>{analytics.userBehavior.repeatCustomers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tỷ lệ chuyển đổi</span>
                <span>{analytics.userBehavior.conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {purchases.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="flex items-center space-x-3 p-2 border rounded">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{purchase.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(purchase.timestamp).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-green-600">
                    {purchase.amount.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              ))}
              {purchases.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Chưa có hoạt động nào</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}