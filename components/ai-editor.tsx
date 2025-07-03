"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Zap, 
  Sparkles, 
  ImageIcon, 
  Eye, 
  Save, 
  Send, 
  Wand2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Settings,
  PenTool
} from "lucide-react"
import { useWorkflowStore } from "@/lib/workflow-store"
import { useWordPressStore } from "@/lib/wordpress-store"
import { SourceInput } from "@/lib/source-manager"
import BlogPreview from "@/components/blog-preview"

interface AIEditorProps {
  aiOptions: {
    generateSEO: boolean
    generateHeaders: boolean
    generateMeta: boolean
    generateImages: boolean
    generateLinks: boolean
  }
  setAiOptions: (options: AIEditorProps['aiOptions']) => void
}

export default function AIEditor({ aiOptions, setAiOptions }: AIEditorProps) {
  const {
    status,
    currentStep,
    progress,
    sources,
    topic,
    wordCount,
    tone,
    targetAudience,
    customPrompt,
    sourceAnalysis,
    blogGeneration,
    analysisError,
    generationError,
    setStatus,
    setCurrentStep,
    setProgress,
    setSourceAnalysis,
    setBlogGeneration,
    setAnalysisError,
    setGenerationError,
    setInputs,
  } = useWorkflowStore()

  // WordPress store
  const {
    publishStatus,
    canPublish,
    getCurrentSite,
    setPublishStatus,
    setPublishError,
    setPublishResult,
    setDefaultSite
  } = useWordPressStore()

  const [isCustomPrompt, setIsCustomPrompt] = useState(false)
  const [localCustomPrompt, setLocalCustomPrompt] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Update custom prompt in store when changed
  useEffect(() => {
    if (isCustomPrompt && localCustomPrompt !== customPrompt) {
      setInputs({ customPrompt: localCustomPrompt })
    }
  }, [isCustomPrompt, localCustomPrompt, customPrompt, setInputs])

  // Load default WordPress site on mount
  useEffect(() => {
    const loadDefaultSite = async () => {
      try {
        const response = await fetch('/api/wordpress/sites')
        const data = await response.json()
        
        if (data.hasDefaultSite && data.siteInfo) {
          console.log('Loading default WordPress site:', data.siteInfo)
          setDefaultSite(data.siteInfo)
        }
      } catch (error) {
        console.error('Failed to load default WordPress site:', error)
      }
    }
    
    loadDefaultSite()
  }, [setDefaultSite])

  // Check if we can start analysis
  const canAnalyze = sources.length > 0 && topic.trim().length > 0 && status === 'idle'

  // Check if we can generate blog post
  const canGenerate = sourceAnalysis && !analysisError && status === 'idle'

  // Step 1: Analyze sources with Perplexity
  const handleAnalyzeSources = useCallback(async () => {
    if (!canAnalyze) return

    setIsAnalyzing(true)
    setStatus('analyzing')
    setCurrentStep('analysis')
    setAnalysisError(null)

    try {
      // Prepare source inputs for API
      const sourceInputs: SourceInput[] = sources.map((source, index) => ({
        id: `source-${index}`,
        type: 'text', // For now, treating all as text since they're already processed
        content: source
      }))

      const requestBody = {
        sources: sourceInputs,
        topic,
        targetAudience
      }

      console.log('Starting Perplexity analysis...', requestBody)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        const text = await response.text()
        console.error('Raw response:', text)
        throw new Error('Server returned invalid response. Please try again.')
      }

      if (!response.ok) {
        throw new Error(result.error?.message || 'Analysis failed')
      }

      console.log('Perplexity analysis completed:', result)

      // Store the analysis results
      setSourceAnalysis(result.analysis.perplexityAnalysis)
      setCurrentStep('generation')
      setProgress(50)
      setStatus('idle') // Reset status to enable Generate Blog button

    } catch (error) {
      console.error('Analysis error:', error)
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed')
      setStatus('error')
    } finally {
      setIsAnalyzing(false)
    }
  }, [canAnalyze, sources, topic, targetAudience, setStatus, setCurrentStep, setAnalysisError, setSourceAnalysis, setProgress])

  // Step 2: Generate blog post with Claude
  const handleGenerateBlog = useCallback(async () => {
    if (!canGenerate || !sourceAnalysis) return

    setIsGenerating(true)
    setStatus('generating')
    setGenerationError(null)

    try {
      const requestBody = {
        sourceAnalysis,
        topic,
        wordCount,
        tone,
        targetAudience,
        customPrompt: isCustomPrompt ? localCustomPrompt : undefined
      }

      console.log('Starting Claude generation...', requestBody)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Blog generation failed')
      }

      console.log('Claude generation completed:', result)

      // Store the generation results
      setBlogGeneration(result.blog)
      setCurrentStep('completed')
      setProgress(100)
      setStatus('completed')

    } catch (error) {
      console.error('Generation error:', error)
      setGenerationError(error instanceof Error ? error.message : 'Blog generation failed')
      setStatus('error')
    } finally {
      setIsGenerating(false)
    }
  }, [canGenerate, sourceAnalysis, topic, wordCount, tone, targetAudience, isCustomPrompt, localCustomPrompt, setStatus, setBlogGeneration, setGenerationError, setCurrentStep, setProgress])

  // WordPress publish handler
  const handleWordPressExport = async () => {
    if (!blogGeneration) {
      alert('No blog content to export. Please generate a blog post first.')
      return
    }

    if (!canPublish()) {
      alert('WordPress publishing is not available. Please check your WordPress connection.')
      return
    }

    setPublishStatus('publishing')
    setPublishError(null)
    setPublishResult(null)

    try {
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogGeneration,
          publishOptions: {
            status: 'draft',
            allowComments: true,
            categories: [],
            tags: []
          }
        })
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
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
        alert(`Successfully published to WordPress! Post ID: ${data.post?.id}`)
      } else {
        throw new Error(data.error?.message || 'Publishing failed')
      }
    } catch (error) {
      console.error('WordPress export error:', error)
      setPublishError(error instanceof Error ? error.message : 'Publishing failed')
      setPublishStatus('error')
      alert(`Publishing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Copy content to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'analyzing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'generating':
        return <PenTool className="h-4 w-4 animate-pulse text-orange-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Sparkles className="h-4 w-4 text-purple-500" />
    }
  }

  return (
    <div className="space-y-4 h-full">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon()}
              <span className="ml-2 text-lg font-semibold">AI Blog Generator</span>
              <Badge variant="secondary" className="ml-3">
                Perplexity + Claude
              </Badge>
            </div>
            
            {blogGeneration && (
              <Button
                variant={showPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {showPreview ? "Show Controls" : "Preview Blog"}
              </Button>
            )}
          </div>
          <CardDescription>
            Two-step AI process: Perplexity analyzes sources, Claude writes the blog
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {showPreview && blogGeneration ? (
            <BlogPreview
              blogGeneration={blogGeneration}
              onEdit={(field, value) => {
                // Handle editing blog content
                console.log('Edit request:', field, value)
              }}
              onSave={() => {
                console.log('Save draft requested')
              }}
              onExport={handleWordPressExport}
            />
          ) : (
            <>
            {/* AI Generation Controls */}
          {/* Step 1: Source Analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Step 1: Source Analysis</Label>
                <p className="text-sm text-gray-600">Perplexity AI will analyze your sources and research trends</p>
              </div>
              <Button 
                onClick={handleAnalyzeSources}
                disabled={!canAnalyze || isAnalyzing}
                variant={sourceAnalysis ? "outline" : "default"}
                className={sourceAnalysis ? "" : "bg-purple-600 hover:bg-purple-700"}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : sourceAnalysis ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Re-analyze
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>

            {!canAnalyze && status === 'idle' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Ready to analyze?</strong> Make sure you have:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li className={sources.length > 0 ? "text-green-700" : ""}>
                    ✓ Added sources (URLs, PDFs, or text) - {sources.length > 0 ? `${sources.length} sources added` : 'None yet'}
                  </li>
                  <li className={topic.trim().length > 0 ? "text-green-700" : ""}>
                    ✓ Set blog topic/title - {topic.trim().length > 0 ? 'Ready' : 'Please fill in the topic field below'}
                  </li>
                </ul>
                {sources.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-2">
                    → Go to the left panel and add some sources first
                  </p>
                )}
                {sources.length > 0 && topic.trim().length === 0 && (
                  <p className="text-xs text-yellow-600 mt-2">
                    → Fill in the &quot;Blog Topic/Title&quot; field below
                  </p>
                )}
              </div>
            )}

            {analysisError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{analysisError}</p>
              </div>
            )}

            {sourceAnalysis && (
              <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">Analysis Complete</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Key Insights:</p>
                    <p className="text-gray-600">{sourceAnalysis.keyInsights?.length || 0} insights found</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">SEO Keywords:</p>
                    <p className="text-gray-600">{sourceAnalysis.seoKeywords?.length || 0} keywords identified</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Trends:</p>
                    <p className="text-gray-600">{sourceAnalysis.currentTrends?.length || 0} trends discovered</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Citations:</p>
                    <p className="text-gray-600">{sourceAnalysis.citations?.length || 0} sources verified</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Step 2: Blog Generation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Step 2: Blog Generation</Label>
                <p className="text-sm text-gray-600">Claude AI will write your human-like blog post</p>
              </div>
              <Button 
                onClick={handleGenerateBlog}
                disabled={!canGenerate || isGenerating}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isGenerating ? (
                  <>
                    <PenTool className="h-4 w-4 mr-2 animate-pulse" />
                    Writing...
                  </>
                ) : blogGeneration ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Regenerate
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Blog
                  </>
                )}
              </Button>
            </div>

            {!canGenerate && !analysisError && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  Complete source analysis first to enable blog generation
                </p>
              </div>
            )}

            {generationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{generationError}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Custom Prompt Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Writing Style</Label>
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-gray-400" />
                <Label htmlFor="custom-prompt" className="text-sm">Custom Prompt</Label>
                <Switch
                  id="custom-prompt"
                  checked={isCustomPrompt}
                  onCheckedChange={setIsCustomPrompt}
                />
              </div>
            </div>

            {isCustomPrompt ? (
              <div className="space-y-2">
                <Label htmlFor="prompt-editor">Custom Prompt Template</Label>
                <Textarea
                  id="prompt-editor"
                  value={localCustomPrompt}
                  onChange={(e) => setLocalCustomPrompt(e.target.value)}
                  placeholder="Enter your custom prompt template here. Use [topic], [sources], [audience] as placeholders..."
                  className="min-h-[100px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Variables: [topic], [sources], [audience], [wordCount], [tone]
                </p>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Using default conversational prompt: Professional blogger writing style with casual, engaging tone
                </p>
              </div>
            )}
          </div>

          {/* Generated Content */}
          {blogGeneration && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Generated Blog Post</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      SEO Score: {blogGeneration.seoScore}/100
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(blogGeneration.content)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={blogGeneration.title}
                    readOnly
                    className="font-medium bg-gray-50"
                  />
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={blogGeneration.metaDescription}
                    readOnly
                    className="bg-gray-50"
                    rows={2}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {blogGeneration.tags?.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={blogGeneration.content}
                    readOnly
                    className="min-h-[300px] font-mono text-sm bg-gray-50"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {blogGeneration.content.split(" ").length} words • {blogGeneration.content.length} characters
                    </span>
                    <span>Generated with Claude AI</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled={!blogGeneration}>
                <Save className="h-4 w-4 mr-1" />
                Save Draft
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!blogGeneration}
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </div>
          </div>
          </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}