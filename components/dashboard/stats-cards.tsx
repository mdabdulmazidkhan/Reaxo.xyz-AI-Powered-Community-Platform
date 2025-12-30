"use client"

import { Users, MessageSquare, Eye, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Forum } from "@/lib/types"

interface StatsCardsProps {
  forums: Forum[]
}

export function StatsCards({ forums }: StatsCardsProps) {
  const totalMembers = forums.reduce((acc, f) => acc + (f.memberCount || 0), 0)
  const totalThreads = forums.reduce((acc, f) => acc + (f.threadCount || 0), 0)

  const stats = [
    {
      title: "Total Forums",
      value: forums.length,
      icon: MessageSquare,
      change: "+2 this month",
    },
    {
      title: "Total Members",
      value: totalMembers.toLocaleString(),
      icon: Users,
      change: "+12% from last month",
    },
    {
      title: "Total Threads",
      value: totalThreads.toLocaleString(),
      icon: Eye,
      change: "+8% from last month",
    },
    {
      title: "Engagement Rate",
      value: "24.5%",
      icon: TrendingUp,
      change: "+4.3% from last month",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
