"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ExternalLink,
  Settings,
  Globe,
  Upload,
  Calendar,
  Tags,
  Folder,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Edit,
  Save,
  RefreshCw
} from "lucide-react"
import { BlogGeneration } from "@/lib/claude"
import { useWordPressStore } from "@/lib/wordpress-store"
import { PublishOptions } from "@/lib/wordpress"

interface WordPressExportProps {
  blogGeneration: BlogGeneration | null;
}

export default function WordPressExport({ blogGeneration }: WordPressExportProps) {
  const {
    defaultSite,
    customSite,
    useCustomSite,
    publishStatus,
    publishError,
    publishResult,
    publishOptions,
    showSiteSettings,
    setDefaultSite,
    setCustomSite,
    setUseCustomSite,
    setPublishStatus,
    setPublishError,
    setPublishResult,
    setPublishOptions,
    setShowSiteSettings,
    getCurrentSite,
    canPublish
  } = useWordPressStore()

  const [customCredentials, setCustomCredentials] = useState({
    url: '',
    username: '',
    password: ''
  })

  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [customCategories, setCustomCategories] = useState('')
  const [customTags, setCustomTags] = useState('')

  // Load default site info on mount
  useEffect(() => {
    loadDefaultSite()
  }, [])

  const loadDefaultSite = async () => {
    try {
      const response = await fetch('/api/wordpress/sites')
      const data = await response.json()
      
      if (data.hasDefaultSite && data.siteInfo) {
        console.log('Loading default site:', data.siteInfo)
        setDefaultSite(data.siteInfo)
      } else {
        console.log('No default site found:', data)
      }
    } catch (error) {
      console.error('Failed to load default site:', error)
    }
  }

  const testCustomSite = async () => {
    if (!customCredentials.url || !customCredentials.username || !customCredentials.password) {
      return
    }

    setPublishStatus('testing')
    setPublishError(null)

    try {
      const response = await fetch('/api/wordpress/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: customCredentials })
      })

      const data = await response.json()

      if (data.success && data.siteInfo) {
        setCustomSite(data.siteInfo)
        setPublishStatus('idle')
      } else {
        setPublishError(data.error?.message || 'Site connection failed')
        setPublishStatus('error')
      }
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Connection test failed')
      setPublishStatus('error')
    }
  }

  const publishToWordPress = async () => {
    if (!blogGeneration || !canPublish()) return

    setPublishStatus('publishing')
    setPublishError(null)
    setPublishResult(null)

    try {
      // Prepare categories and tags
      const categories = customCategories
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0)
        .concat(publishOptions.categories || [])

      const tags = customTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .concat(publishOptions.tags || [])
        .concat(blogGeneration.tags || [])

      // Prepare publish options
      const finalPublishOptions: PublishOptions = {
        ...publishOptions,
        categories: [...new Set(categories)], // Remove duplicates
        tags: [...new Set(tags)], // Remove duplicates
        featuredImageUrl: featuredImageUrl || undefined,
        scheduledDate: publishOptions.status === 'future' ? scheduledDate : undefined
      }

      // Prepare request body
      const requestBody = {
        blogGeneration,
        publishOptions: finalPublishOptions,
        siteCredentials: useCustomSite ? customCredentials : undefined
      }

      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse publish response:', jsonError)
        throw new Error('Server returned invalid response. Please try again.')
      }

      if (data.success) {
        console.log('WordPress publish successful:', data)
        setPublishResult({
          postId: data.post?.id,
          url: data.url,
          warnings: data.warnings
        })
        setPublishStatus('success')
      } else {
        setPublishError(data.error?.message || 'Publishing failed')
        setPublishStatus('error')
      }
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Publishing failed')
      setPublishStatus('error')
    }
  }

  const currentSite = getCurrentSite()

  if (!blogGeneration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExternalLink className="h-5 w-5 mr-2 text-gray-400" />
            WordPress Export
          </CardTitle>
          <CardDescription>
            Generate a blog post to enable WordPress publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <Globe className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No blog post ready for export</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <ExternalLink className="h-5 w-5 mr-2 text-blue-500" />
              WordPress Export
            </CardTitle>
            <CardDescription>
              Publish your blog post to WordPress with complete metadata
            </CardDescription>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSiteSettings(!showSiteSettings)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Site Settings
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Site Settings Panel */}
        {showSiteSettings && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">WordPress Site Configuration</Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="use-custom" className="text-sm">Custom Site</Label>
                <Switch
                  id="use-custom"
                  checked={useCustomSite}
                  onCheckedChange={setUseCustomSite}
                />
              </div>
            </div>

            {useCustomSite ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label>Site URL</Label>
                    <Input
                      placeholder="https://your-site.com"
                      value={customCredentials.url}
                      onChange={(e) => setCustomCredentials(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Username</Label>
                      <Input
                        placeholder="username"
                        value={customCredentials.username}
                        onChange={(e) => setCustomCredentials(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>App Password</Label>
                      <Input
                        type="password"
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={customCredentials.password}
                        onChange={(e) => setCustomCredentials(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={testCustomSite}
                  disabled={publishStatus === 'testing'}
                  size="sm"
                  variant="outline"
                >
                  {publishStatus === 'testing' ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Test Connection
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-white border rounded">
                {defaultSite ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{defaultSite.name}</p>
                      <p className="text-sm text-gray-600">{defaultSite.url}</p>
                    </div>
                    <Badge variant={defaultSite.connected ? "default" : "destructive"}>
                      {defaultSite.connected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-gray-500">No default site configured</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Current Site Status */}
        {currentSite && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Globe className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">{currentSite.name}</p>
              <p className="text-sm text-blue-700">{currentSite.url}</p>
            </div>
            <Badge variant={currentSite.connected ? "default" : "destructive"}>
              {currentSite.connected ? 'Ready' : 'Error'}
            </Badge>
          </div>
        )}

        {/* Publishing Options */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>
          
          {/* Basic Settings */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label>Publish Status</Label>
                <Select
                  value={publishOptions.status}
                  onValueChange={(value) => setPublishOptions({ status: value as PublishOptions['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="publish">Publish Immediately</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="future">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {publishOptions.status === 'future' && (
                <div>
                  <Label>Scheduled Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categories</Label>
                  <Input
                    placeholder="Technology, AI, WordPress"
                    value={customCategories}
                    onChange={(e) => setCustomCategories(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
                </div>
                <div>
                  <Label>Additional Tags</Label>
                  <Input
                    placeholder="wordpress, api, automation"
                    value={customTags}
                    onChange={(e) => setCustomTags(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={publishOptions.allowComments}
                  onCheckedChange={(checked) => setPublishOptions({ allowComments: checked })}
                />
                <Label>Allow Comments</Label>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Featured Image URL</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Image will be downloaded and uploaded to WordPress
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded border">
                <h4 className="font-medium mb-2">Post Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Title:</span>
                    <span className="text-gray-600">{blogGeneration.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Word Count:</span>
                    <span className="text-gray-600">{blogGeneration.content.split(' ').length} words</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SEO Score:</span>
                    <Badge variant={blogGeneration.seoScore >= 80 ? "default" : "secondary"}>
                      {blogGeneration.seoScore}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Generated Tags:</span>
                    <span className="text-gray-600">{blogGeneration.tags?.length || 0} tags</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>SEO Title Override</Label>
                <Input
                  placeholder={blogGeneration.title}
                  value={publishOptions.seoTitle || ''}
                  onChange={(e) => setPublishOptions({ seoTitle: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to use generated title</p>
              </div>

              <div>
                <Label>Meta Description Override</Label>
                <Textarea
                  placeholder={blogGeneration.metaDescription}
                  value={publishOptions.seoDescription || ''}
                  onChange={(e) => setPublishOptions({ seoDescription: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(publishOptions.seoDescription || blogGeneration.metaDescription).length}/160 characters
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium text-blue-900 mb-2">SEO Preview</h4>
                <div className="space-y-1">
                  <p className="text-blue-800 font-medium text-sm">
                    {publishOptions.seoTitle || blogGeneration.title}
                  </p>
                  <p className="text-green-700 text-xs">{currentSite?.url}</p>
                  <p className="text-gray-600 text-sm">
                    {publishOptions.seoDescription || blogGeneration.metaDescription}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {publishError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Publishing Error</p>
                <p className="text-sm text-red-700">{publishError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {publishStatus === 'success' && publishResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900">Published Successfully!</p>
                <p className="text-sm text-green-700 mb-2">
                  Your blog post has been published to WordPress.
                </p>
                {publishResult.url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(publishResult.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Post
                  </Button>
                )}
                {publishResult.warnings && publishResult.warnings.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-yellow-700 font-medium">Warnings:</p>
                    <ul className="text-xs text-yellow-600">
                      {publishResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Publish Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {currentSite ? (
              <span>Ready to publish to <strong>{currentSite.name}</strong></span>
            ) : (
              <span>Configure WordPress site to continue</span>
            )}
          </div>
          
          <Button
            onClick={publishToWordPress}
            disabled={!canPublish() || publishStatus === 'publishing'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {publishStatus === 'publishing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Publish to WordPress
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}