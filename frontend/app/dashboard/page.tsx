"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, LinkIcon, Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDashboardStats, getRecentActivity } from "@/lib/data-service"
import type { DashboardStats, RecentActivity } from "@/lib/data-service"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUrls: 0,
    totalPdfs: 0,
    vectorDbSize: 0,
    urlsLastWeek: 0,
    pdfsLastWeek: 0,
    lastUpdated: {
      date: "N/A",
      time: "N/A",
    },
    systemStatus: [
      { name: "Vector Database", operational: false },
      { name: "Embedding API", operational: false },
      { name: "LLM API", operational: false },
      { name: "Chat Interface", operational: false },
    ],
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [statsData, activityData] = await Promise.all([getDashboardStats(), getRecentActivity()])
      setStats(statsData)
      setRecentActivity(activityData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button onClick={fetchData} disabled={isLoading} className="flex items-center gap-1">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUrls}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.urlsLastWeek > 0 ? `+${stats.urlsLastWeek} from last week` : "No change from last week"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total PDFs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPdfs}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pdfsLastWeek > 0 ? `+${stats.pdfsLastWeek} from last week` : "No change from last week"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vector Database Size</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.vectorDbSize}</div>
                <p className="text-xs text-muted-foreground">Documents indexed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.lastUpdated.date}</div>
                <p className="text-xs text-muted-foreground">{stats.lastUpdated.time}</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No recent activity</p>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 rounded-md p-2 hover:bg-muted">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            activity.type === "pdf" ? "bg-blue-100" : "bg-green-100"
                          }`}
                        >
                          {activity.type === "pdf" ? (
                            <FileText className="h-4 w-4 text-blue-700" />
                          ) : (
                            <LinkIcon className="h-4 w-4 text-green-700" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.type === "pdf" ? "PDF Added" : "URL Added"}</p>
                          <p className="text-xs text-muted-foreground">{activity.name}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">{activity.timeAgo}</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current status of the knowledge base system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.systemStatus.map((status) => (
                    <div key={status.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${status.operational ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        <span className="text-sm">{status.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {status.operational ? "Operational" : "Down"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Coming Soon</CardTitle>
              <CardDescription>
                Detailed analytics about chatbot usage and performance will be available here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Analytics dashboard under development</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
