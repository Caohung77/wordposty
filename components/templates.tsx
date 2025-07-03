"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Search, Star, Clock, Zap, BookOpen, Newspaper, MessageSquare } from "lucide-react"

export default function Templates() {
  const templates = [
    {
      id: 1,
      name: "Blog Post",
      description: "Standard blog post with introduction, body, and conclusion",
      category: "Content",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      estimatedTime: "15-30 min",
      popularity: 95,
      tags: ["SEO", "General"],
    },
    {
      id: 2,
      name: "Tutorial Guide",
      description: "Step-by-step tutorial with code examples and screenshots",
      category: "Educational",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-100",
      estimatedTime: "30-45 min",
      popularity: 88,
      tags: ["Tutorial", "Technical"],
    },
    {
      id: 3,
      name: "Product Review",
      description: "Comprehensive product review with pros, cons, and rating",
      category: "Review",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      estimatedTime: "20-35 min",
      popularity: 82,
      tags: ["Review", "Product"],
    },
    {
      id: 4,
      name: "News Article",
      description: "Breaking news format with headline, lead, and body",
      category: "News",
      icon: Newspaper,
      color: "text-red-600",
      bgColor: "bg-red-100",
      estimatedTime: "10-20 min",
      popularity: 76,
      tags: ["News", "Current Events"],
    },
    {
      id: 5,
      name: "How-to Guide",
      description: "Problem-solving guide with clear instructions",
      category: "Educational",
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      estimatedTime: "25-40 min",
      popularity: 91,
      tags: ["Guide", "Problem Solving"],
    },
    {
      id: 6,
      name: "Interview Article",
      description: "Q&A format interview with introduction and highlights",
      category: "Interview",
      icon: MessageSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      estimatedTime: "20-30 min",
      popularity: 73,
      tags: ["Interview", "Q&A"],
    },
  ]

  const categories = ["All", "Content", "Educational", "Review", "News", "Interview"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Templates</h2>
          <p className="text-gray-600">Choose from pre-built templates to speed up your content creation</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Create Custom Template
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search templates..." className="pl-10" />
        </div>
        <div className="flex items-center space-x-2">
          {categories.map((category) => (
            <Button key={category} variant={category === "All" ? "default" : "outline"} size="sm">
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${template.bgColor}`}>
                  <template.icon className={`h-6 w-6 ${template.color}`} />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {template.popularity}% popular
                </Badge>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{template.estimatedTime}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <Button className="flex-1">Use Template</Button>
                  <Button variant="outline" size="sm">
                    Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popular Templates Section */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Most Popular This Week</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.slice(0, 4).map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${template.bgColor}`}>
                  <template.icon className={`h-5 w-5 ${template.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {template.popularity}%
                  </Badge>
                  <Button size="sm">Use</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
