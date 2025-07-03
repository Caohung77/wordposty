"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Eye, Users, Share2, Heart, BarChart3, Calendar, Globe } from "lucide-react"

export default function Analytics() {
  const performanceData = [
    { metric: "Total Views", value: "24,567", change: "+12.5%", trend: "up" },
    { metric: "Unique Visitors", value: "18,432", change: "+8.3%", trend: "up" },
    { metric: "Avg. Time on Page", value: "3:42", change: "+15.2%", trend: "up" },
    { metric: "Bounce Rate", value: "32.1%", change: "-5.7%", trend: "down" },
  ]

  const topPosts = [
    {
      title: "Getting Started with AI Content Creation",
      views: 5420,
      engagement: 8.5,
      shares: 234,
      category: "Technology",
    },
    {
      title: "The Future of Digital Marketing",
      views: 4890,
      engagement: 7.2,
      shares: 189,
      category: "Marketing",
    },
    {
      title: "Content Strategy Best Practices",
      views: 3650,
      engagement: 6.8,
      shares: 156,
      category: "Strategy",
    },
    {
      title: "SEO Optimization Techniques",
      views: 3210,
      engagement: 9.1,
      shares: 201,
      category: "SEO",
    },
  ]

  const seoMetrics = [
    { keyword: "AI content creation", position: 3, volume: 2400, difficulty: 65 },
    { keyword: "content marketing", position: 7, volume: 8100, difficulty: 78 },
    { keyword: "digital strategy", position: 12, volume: 1900, difficulty: 52 },
    { keyword: "SEO optimization", position: 5, volume: 3300, difficulty: 71 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Track your content performance and engagement</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 days
          </Button>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceData.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{item.metric}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className={`h-4 w-4 mr-1 ${item.trend === "up" ? "text-green-600" : "text-red-600"}`} />
                    <span className={`text-sm ${item.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {item.change}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
                <CardDescription>Your most successful content this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPosts.map((post, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{post.title}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{post.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3" />
                            <span>{post.engagement}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Share2 className="h-3 w-3" />
                            <span>{post.shares}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Breakdown</CardTitle>
                <CardDescription>How readers interact with your content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Comments</span>
                    <span className="text-sm text-gray-600">1,234</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Shares</span>
                    <span className="text-sm text-gray-600">892</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Likes</span>
                    <span className="text-sm text-gray-600">2,156</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bookmarks</span>
                    <span className="text-sm text-gray-600">567</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Keyword Rankings */}
            <Card>
              <CardHeader>
                <CardTitle>Keyword Rankings</CardTitle>
                <CardDescription>Track your search engine positions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {seoMetrics.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{keyword.keyword}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>Volume: {keyword.volume.toLocaleString()}</span>
                          <span>Difficulty: {keyword.difficulty}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            keyword.position <= 5
                              ? "text-green-600"
                              : keyword.position <= 10
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          #{keyword.position}
                        </div>
                        <div className="text-xs text-gray-500">Position</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SEO Health Score */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Health Score</CardTitle>
                <CardDescription>Overall SEO performance across all content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">82</div>
                  <div className="text-sm text-gray-600">Overall SEO Score</div>
                  <Progress value={82} className="h-3 mt-3" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Technical SEO</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={90} className="h-2 w-20" />
                      <span className="text-sm font-medium">90%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Content Quality</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={85} className="h-2 w-20" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Experience</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={78} className="h-2 w-20" />
                      <span className="text-sm font-medium">78%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mobile Optimization</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={92} className="h-2 w-20" />
                      <span className="text-sm font-medium">92%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Social Media Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>Engagement across social platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Globe className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Twitter</div>
                      <div className="text-xs text-gray-500">1,234 shares</div>
                    </div>
                  </div>
                  <Badge variant="secondary">+12%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">LinkedIn</div>
                      <div className="text-xs text-gray-500">892 shares</div>
                    </div>
                  </div>
                  <Badge variant="secondary">+8%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Share2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Facebook</div>
                      <div className="text-xs text-gray-500">567 shares</div>
                    </div>
                  </div>
                  <Badge variant="secondary">+5%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Viral Content */}
            <Card>
              <CardHeader>
                <CardTitle>Trending Content</CardTitle>
                <CardDescription>Your most shared posts this week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm mb-1">AI Content Creation Guide</h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Share2 className="h-3 w-3" />
                    <span>456 shares</span>
                    <Heart className="h-3 w-3" />
                    <span>1.2k likes</span>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Digital Marketing Trends</h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Share2 className="h-3 w-3" />
                    <span>321 shares</span>
                    <Heart className="h-3 w-3" />
                    <span>890 likes</span>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm mb-1">SEO Best Practices</h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Share2 className="h-3 w-3" />
                    <span>287 shares</span>
                    <Heart className="h-3 w-3" />
                    <span>654 likes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Timeline</CardTitle>
                <CardDescription>Peak engagement hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>9:00 AM</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={85} className="h-2 w-16" />
                      <span className="text-xs">High</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>1:00 PM</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={92} className="h-2 w-16" />
                      <span className="text-xs">Peak</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>6:00 PM</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={78} className="h-2 w-16" />
                      <span className="text-xs">High</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>10:00 PM</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={45} className="h-2 w-16" />
                      <span className="text-xs">Low</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-600">
                    Best posting time: <span className="font-medium">1:00 PM - 2:00 PM</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
