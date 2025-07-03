"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, FileText, BarChart3, Settings, Zap, Clock, CheckCircle, AlertCircle } from "lucide-react"
import PostEditor from "@/components/post-editor"
import Dashboard from "@/components/dashboard"
import Templates from "@/components/templates"
import Analytics from "@/components/analytics"

export default function Home() {
  const [activeTab, setActiveTab] = useState("editor")
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "Getting Started with AI Content Creation",
      status: "draft",
      seoScore: 85,
      wordCount: 1200,
      lastModified: "2 hours ago",
      category: "Technology",
    },
    {
      id: 2,
      title: "The Future of Digital Marketing",
      status: "published",
      seoScore: 92,
      wordCount: 1800,
      lastModified: "1 day ago",
      category: "Marketing",
    },
    {
      id: 3,
      title: "Content Strategy Best Practices",
      status: "scheduled",
      seoScore: 78,
      wordCount: 950,
      lastModified: "3 hours ago",
      category: "Strategy",
    },
  ])

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Post Creator</h1>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Pro Plan
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">12</span> posts this month
            </div>
            <Button size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation and Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex items-center space-x-2">
                <PlusCircle className="h-4 w-4" />
                <span>Create</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Templates</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-6">
          <TabsContent value="dashboard" className="mt-0">
            <Dashboard posts={posts} />
          </TabsContent>

          <TabsContent value="editor" className="mt-0">
            <PostEditor />
          </TabsContent>

          <TabsContent value="templates" className="mt-0">
            <Templates />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <Analytics />
          </TabsContent>
        </main>
      </Tabs>

    </div>
  )
}
