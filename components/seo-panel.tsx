"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Target, CheckCircle, AlertTriangle, Eye, Send, Clock } from "lucide-react"

export default function SEOPanel() {
  const [seoScore, setSeoScore] = useState(78)
  const [metaDescription, setMetaDescription] = useState(
    "Learn how to build comprehensive AI-powered content creation systems with our complete guide covering implementation, best practices, and optimization strategies.",
  )
  const [slug, setSlug] = useState("ai-powered-content-creation-guide")
  const [publishDate, setPublishDate] = useState("")
  const [socialSharing, setSocialSharing] = useState({
    twitter: true,
    linkedin: true,
    facebook: false,
  })

  const seoChecks = [
    { item: "Title length (60 chars)", status: "good", score: 10 },
    { item: "Meta description (155 chars)", status: "good", score: 10 },
    { item: "URL structure", status: "good", score: 8 },
    { item: "Header structure (H1-H6)", status: "warning", score: 6 },
    { item: "Internal links", status: "good", score: 8 },
    { item: "Image alt text", status: "warning", score: 4 },
    { item: "Keyword density", status: "good", score: 9 },
    { item: "Readability score", status: "good", score: 8 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "error":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-4 h-full">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-500" />
            SEO & Publishing
          </CardTitle>
          <CardDescription>Optimize and publish your content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SEO Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">SEO Score</Label>
              <Badge
                variant="secondary"
                className={`${
                  seoScore >= 80
                    ? "bg-green-100 text-green-800"
                    : seoScore >= 60
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {seoScore}/100
              </Badge>
            </div>
            <Progress value={seoScore} className="h-2" />
            <p className="text-sm text-gray-600">
              {seoScore >= 80
                ? "Excellent SEO optimization!"
                : seoScore >= 60
                  ? "Good, but can be improved"
                  : "Needs significant improvement"}
            </p>
          </div>

          <Separator />

          {/* SEO Checklist */}
          <div className="space-y-3">
            <Label className="text-base font-medium">SEO Checklist</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {seoChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(check.status)}
                    <span className="text-sm">{check.item}</span>
                  </div>
                  <span className="text-xs text-gray-500">{check.score}/10</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Meta Information */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Meta Information</Label>

            <div className="space-y-2">
              <Label htmlFor="meta-description">Meta Description</Label>
              <Textarea
                id="meta-description"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={155}
              />
              <div className="text-xs text-gray-500">{metaDescription.length}/155 characters</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-friendly-slug" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="tutorial">Tutorial</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Readability Analysis */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Readability Analysis</Label>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Reading Level</span>
                  <span className="font-medium">Grade 8</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg. Sentence Length</span>
                  <span className="font-medium">18 words</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Reading Time</span>
                  <span className="font-medium">6 min</span>
                </div>
                <div className="flex justify-between">
                  <span>Flesch Score</span>
                  <span className="font-medium">72/100</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* SEO Preview */}
          <div className="space-y-3">
            <Label className="text-base font-medium">SEO Preview</Label>
            <div className="p-3 border rounded-lg bg-gray-50">
              <div className="text-blue-600 text-sm font-medium hover:underline cursor-pointer">
                How to Build AI-Powered Content Creation Systems: A Complete Guide
              </div>
              <div className="text-green-700 text-xs mt-1">https://yoursite.com/blog/{slug}</div>
              <div className="text-gray-600 text-sm mt-1">{metaDescription}</div>
            </div>
          </div>

          <Separator />

          {/* Publishing Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Publishing Options</Label>

            <div className="space-y-2">
              <Label htmlFor="publish-date">Publish Date</Label>
              <Input
                id="publish-date"
                type="datetime-local"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>Social Media Sharing</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={socialSharing.twitter}
                    onCheckedChange={(checked) => setSocialSharing({ ...socialSharing, twitter: checked })}
                  />
                  <Label className="text-sm">Auto-share to Twitter</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={socialSharing.linkedin}
                    onCheckedChange={(checked) => setSocialSharing({ ...socialSharing, linkedin: checked })}
                  />
                  <Label className="text-sm">Auto-share to LinkedIn</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={socialSharing.facebook}
                    onCheckedChange={(checked) => setSocialSharing({ ...socialSharing, facebook: checked })}
                  />
                  <Label className="text-sm">Auto-share to Facebook</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 pt-4">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              Publish Now
            </Button>
            <Button variant="outline" className="w-full bg-transparent">
              <Clock className="h-4 w-4 mr-2" />
              Schedule for Later
            </Button>
            <Button variant="outline" className="w-full bg-transparent">
              <Eye className="h-4 w-4 mr-2" />
              Preview Post
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
