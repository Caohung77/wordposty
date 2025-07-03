"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Eye, 
  Edit, 
  Copy, 
  Share2, 
  Download,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ImageIcon,
  Sparkles,
  Wand2
} from "lucide-react"
import { BlogGeneration } from "@/lib/claude"
import { SourceAnalysis } from "@/lib/perplexity"
import WordPressExport from "@/components/wordpress-export"
import FeaturedImage from "@/components/featured-image"

interface BlogPreviewProps {
  blogGeneration: BlogGeneration | null;
  sourceAnalysis?: SourceAnalysis | null;
  onEdit?: (field: keyof BlogGeneration, value: string) => void;
  onSave?: () => void;
  onExport?: () => void;
}

export default function BlogPreview({ 
  blogGeneration, 
  sourceAnalysis,
  onEdit, 
  onSave, 
  onExport 
}: BlogPreviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [editableContent, setEditableContent] = useState(blogGeneration || {
    title: '',
    content: '',
    metaDescription: '',
    tags: [],
    seoScore: 0,
    excerpt: ''
  })

  if (!blogGeneration) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Eye className="h-5 w-5 mr-2 text-gray-400" />
            Blog Preview
          </CardTitle>
          <CardDescription>
            Generate a blog post to see the preview
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Globe className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No blog post generated yet</p>
            <p className="text-sm text-gray-400">Complete the AI generation to see your blog preview</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleEdit = (field: keyof BlogGeneration, value: string | string[]) => {
    setEditableContent(prev => ({ ...prev, [field]: value }))
    if (onEdit) {
      onEdit(field, Array.isArray(value) ? value.join(',') : value)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile':
        return 'max-w-sm'
      case 'tablet':
        return 'max-w-2xl'
      default:
        return 'max-w-4xl'
    }
  }

  const renderContent = (content: string) => {
    // Simple HTML rendering - in production, you'd use a proper HTML sanitizer
    return (
      <div 
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Eye className="h-5 w-5 mr-2 text-blue-500" />
              Blog Preview
            </CardTitle>
            <CardDescription>
              Preview and edit your generated blog post
            </CardDescription>
          </div>
          
          {/* Preview Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button
                size="sm"
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                onClick={() => setPreviewMode('desktop')}
                className="px-2"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                onClick={() => setPreviewMode('tablet')}
                className="px-2"
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                onClick={() => setPreviewMode('mobile')}
                className="px-2"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              size="sm"
              variant={isEditing ? "default" : "outline"}
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4 mr-1" />
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="featured-image">Featured Image</TabsTrigger>
            <TabsTrigger value="wordpress">Export to WordPress</TabsTrigger>
          </TabsList>
          
          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="flex justify-center">
              <div className={`w-full ${getPreviewWidth()} transition-all duration-300`}>
                <div className="bg-white border rounded-lg shadow-sm p-6 space-y-6">
                  {/* Blog Title */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={editableContent.title}
                        onChange={(e) => handleEdit('title', e.target.value)}
                        className="text-xl font-bold"
                      />
                    </div>
                  ) : (
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                      {editableContent.title}
                    </h1>
                  )}

                  {/* Blog Meta */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600 border-b pb-4">
                    <span>Published on {new Date().toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{editableContent.content.split(' ').length} words</span>
                    <span>•</span>
                    <span>{Math.ceil(editableContent.content.split(' ').length / 200)} min read</span>
                  </div>

                  {/* Blog Tags */}
                  <div className="flex flex-wrap gap-2">
                    {editableContent.tags?.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Blog Content */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea
                        value={editableContent.content}
                        onChange={(e) => handleEdit('content', e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {renderContent(editableContent.content)}
                    </div>
                  )}

                  {/* Call to Action */}
                  <div className="border-t pt-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Found this article helpful? Share it with your network!
                      </p>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="space-y-4">
            <div className="grid gap-4">
              {/* SEO Score */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-medium">SEO Score</Label>
                  <Badge 
                    variant={editableContent.seoScore >= 80 ? "default" : editableContent.seoScore >= 60 ? "secondary" : "destructive"}
                  >
                    {editableContent.seoScore}/100
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      editableContent.seoScore >= 80 ? 'bg-green-500' :
                      editableContent.seoScore >= 60 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${editableContent.seoScore}%` }}
                  />
                </div>
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <Label>Meta Description</Label>
                {isEditing ? (
                  <Textarea
                    value={editableContent.metaDescription}
                    onChange={(e) => handleEdit('metaDescription', e.target.value)}
                    rows={3}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded border text-sm">
                    {editableContent.metaDescription}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {editableContent.metaDescription.length}/160 characters
                </p>
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label>Excerpt</Label>
                {isEditing ? (
                  <Textarea
                    value={editableContent.excerpt}
                    onChange={(e) => handleEdit('excerpt', e.target.value)}
                    rows={3}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded border text-sm">
                    {editableContent.excerpt}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                {isEditing ? (
                  <Input
                    value={editableContent.tags?.join(', ') || ''}
                    onChange={(e) => handleEdit('tags', e.target.value.split(',').map(tag => tag.trim()))}
                    placeholder="tag1, tag2, tag3"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {editableContent.tags?.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Featured Image Tab */}
          <TabsContent value="featured-image" className="space-y-4">
            <FeaturedImage 
              blogGeneration={blogGeneration} 
              sourceAnalysis={sourceAnalysis || undefined}
            />
          </TabsContent>

          {/* Export to WordPress Tab */}
          <TabsContent value="wordpress" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Ready to Export</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Your blog post is ready to be exported to WordPress with all metadata and formatting.
                </p>
                
                <div className="flex space-x-2 mb-4">
                  <Button variant="outline" onClick={onSave}>
                    <Download className="h-4 w-4 mr-1" />
                    Save Draft
                  </Button>
                  <Button variant="outline" onClick={() => copyToClipboard(editableContent.content)}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Content
                  </Button>
                </div>

                {/* Export Summary */}
                <div className="space-y-3">
                  <Label className="font-medium">Export Summary</Label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-white rounded border">
                      <p className="font-medium text-gray-700">Content</p>
                      <p className="text-gray-600">{editableContent.content.split(' ').length} words</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <p className="font-medium text-gray-700">SEO Score</p>
                      <p className="text-gray-600">{editableContent.seoScore}/100</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <p className="font-medium text-gray-700">Tags</p>
                      <p className="text-gray-600">{editableContent.tags?.length || 0} tags</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <p className="font-medium text-gray-700">Meta Description</p>
                      <p className="text-gray-600">{editableContent.metaDescription.length} chars</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* WordPress Export Component */}
              <WordPressExport blogGeneration={blogGeneration} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}