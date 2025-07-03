"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, TrendingUp, Clock, CheckCircle, AlertCircle, Edit, Calendar, Target } from "lucide-react"

interface Post {
  id: number
  title: string
  status: string
  seoScore: number
  wordCount: number
  lastModified: string
  category: string
}

interface DashboardProps {
  posts: Post[]
}

export default function Dashboard({ posts }: DashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500"
      case "scheduled":
        return "bg-blue-500"
      case "draft":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="h-4 w-4" />
      case "scheduled":
        return <Clock className="h-4 w-4" />
      case "draft":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const stats = [
    {
      title: "Total Posts",
      value: posts.length,
      change: "+12%",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Published",
      value: posts.filter((p) => p.status === "published").length,
      change: "+8%",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Avg SEO Score",
      value: Math.round(posts.reduce((acc, p) => acc + p.seoScore, 0) / posts.length),
      change: "+5%",
      icon: Target,
      color: "text-purple-600",
    },
    {
      title: "Total Words",
      value: posts.reduce((acc, p) => acc + p.wordCount, 0).toLocaleString(),
      change: "+15%",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change} from last month</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
              <CardDescription>Manage your content pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(post.status)}`}></div>
                      <div>
                        <h3 className="font-medium text-gray-900">{post.title}</h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>{post.category}</span>
                          <span>•</span>
                          <span>{post.wordCount} words</span>
                          <span>•</span>
                          <span>{post.lastModified}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant="secondary"
                        className={`${
                          post.seoScore >= 80
                            ? "bg-green-100 text-green-800"
                            : post.seoScore >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        SEO: {post.seoScore}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(post.status)}
                        <span className="text-sm capitalize">{post.status}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Pipeline</CardTitle>
              <CardDescription>Track your content workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ideas</span>
                  <Badge variant="secondary">5</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">In Progress</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Review</span>
                  <Badge variant="secondary">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ready to Publish</span>
                  <Badge variant="secondary">1</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Create New Post
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Content
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
