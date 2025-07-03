"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, Plus, X, FileText, Globe, Type, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useWorkflowStore } from "@/lib/workflow-store"
import { SourceInput } from "@/lib/source-manager"
import { jinaReader } from "@/lib/jina-reader"

interface SourceItem extends SourceInput {
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  preview?: string;
  wordCount?: number;
  extractedContent?: string; // The actual content extracted from URLs/files
}

export default function ContentInput() {
  const { 
    topic, 
    targetAudience, 
    wordCount, 
    tone,
    setInputs,
    status: workflowStatus 
  } = useWorkflowStore()

  const [sources, setSources] = useState<SourceItem[]>([])
  const [rawContent, setRawContent] = useState("")
  const [urls, setUrls] = useState([""])
  const [isDragOver, setIsDragOver] = useState(false)


  // Update workflow store whenever sources change
  useEffect(() => {
    const validSources = sources
      .filter(source => source.status === 'success')
      .map(source => {
        // For URL sources, we need to extract the actual content, not just the URL
        if (source.type === 'url') {
          // This should contain the extracted content from the URL
          return source.extractedContent || source.content
        }
        // For file sources, we should have the file content
        if (source.type === 'file') {
          return source.extractedContent || source.content
        }
        // For text sources, return the content directly
        return source.content
      })
      .filter(content => content && content.trim().length > 0)
    
    setInputs({ sources: validSources })
  }, [sources, setInputs])

  // Add text source
  const addTextSource = () => {
    if (!rawContent.trim()) return

    const newSource: SourceItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: rawContent.trim(),
      status: 'success',
      preview: rawContent.substring(0, 100) + (rawContent.length > 100 ? '...' : ''),
      wordCount: rawContent.split(/\s+/).filter(word => word.length > 0).length
    }

    setSources(prev => [...prev, newSource])
    setRawContent("")
  }

  // Add URL source using Jina AI
  const addUrlSource = async (url: string, index: number) => {
    if (!url.trim() || !jinaReader.isValidURL(url)) {
      alert('Please enter a valid URL (e.g., https://example.com)')
      return
    }

    const sourceId = `url-${Date.now()}-${index}`
    
    // Add source with processing status
    const newSource: SourceItem = {
      id: sourceId,
      type: 'url',
      content: url.trim(),
      status: 'processing'
    }

    setSources(prev => [...prev, newSource])

    try {
      console.log('Extracting content from URL using Jina AI:', url)
      const extracted = await jinaReader.extractFromURL(url)
      
      if (!extracted.content || extracted.content.trim().length === 0) {
        throw new Error('No content could be extracted from this URL')
      }
      
      // Update source with success
      setSources(prev => prev.map(source => 
        source.id === sourceId 
          ? {
              ...source,
              status: 'success' as const,
              preview: extracted.title ? 
                `${extracted.title}: ${extracted.description}` : 
                extracted.content.substring(0, 100) + '...',
              wordCount: extracted.wordCount,
              extractedContent: extracted.content // Store the actual extracted content
            }
          : source
      ))
      
      console.log('Successfully extracted content with Jina AI:', {
        title: extracted.title,
        wordCount: extracted.wordCount,
        contentLength: extracted.content.length
      })
      
    } catch (error) {
      console.error('Jina AI URL extraction failed:', error)
      
      // Update source with error
      setSources(prev => prev.map(source => 
        source.id === sourceId 
          ? {
              ...source,
              status: 'error' as const,
              error: error instanceof Error ? 
                error.message : 
                'Failed to extract content from URL. Please check if the URL is accessible.'
            }
          : source
      ))
    }
  }

  // Handle file upload using Jina AI
  const handleFileUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files)
    
    // Validate files
    const maxSize = 10 * 1024 * 1024 // 10MB
    const supportedTypes = ['.pdf', '.txt', '.md']
    
    for (const file of fileArray) {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`)
        return
      }
      
      const fileExtension = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
      if (!supportedTypes.includes(fileExtension)) {
        alert(`File ${file.name} is not supported. Please upload PDF, TXT, or MD files.`)
        return
      }
    }

    // Process each file
    for (const file of fileArray) {
      const sourceId = `file-${Date.now()}-${file.name}`
      
      // Add source with processing status
      const newSource: SourceItem = {
        id: sourceId,
        type: 'file',
        content: file.name,
        status: 'processing'
      }

      setSources(prev => [...prev, newSource])

      try {
        console.log('Processing file with Jina AI:', file.name)
        
        let extracted;
        
        // Handle different file types
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          // Use Jina AI for PDF extraction
          extracted = await jinaReader.extractFromPDF(file)
        } else {
          // For text files, read directly
          const content = await file.text()
          extracted = {
            title: file.name,
            description: content.substring(0, 160) + '...',
            content,
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length
          }
        }
        
        if (!extracted.content || extracted.content.trim().length === 0) {
          throw new Error('No content could be extracted from this file')
        }
        
        // Update source with success
        setSources(prev => prev.map(source => 
          source.id === sourceId 
            ? {
                ...source,
                status: 'success' as const,
                preview: extracted.content.substring(0, 100) + 
                        (extracted.content.length > 100 ? '...' : ''),
                wordCount: extracted.wordCount,
                extractedContent: extracted.content
              }
            : source
        ))
        
        console.log('Successfully processed file with Jina AI:', {
          filename: file.name,
          wordCount: extracted.wordCount,
          contentLength: extracted.content.length
        })
        
      } catch (error) {
        console.error('Jina AI file processing failed:', error)
        
        // Update source with error
        setSources(prev => prev.map(source => 
          source.id === sourceId 
            ? {
                ...source,
                status: 'error' as const,
                error: error instanceof Error ? 
                  error.message : 
                  'Failed to process file. Please try again or check file format.'
              }
            : source
        ))
      }
    }
  }, [])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  // Remove source
  const removeSource = (id: string) => {
    setSources(prev => prev.filter(source => source.id !== id))
  }

  // Add URL
  const addUrl = () => {
    setUrls([...urls, ""])
  }

  // Remove URL
  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index))
  }

  // Update URL
  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  // Get source status icon
  const getSourceStatusIcon = (status: SourceItem['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  // Get source type icon
  const getSourceTypeIcon = (type: SourceItem['type']) => {
    switch (type) {
      case 'text':
        return <Type className="h-4 w-4 text-blue-500" />
      case 'url':
        return <Globe className="h-4 w-4 text-green-500" />
      case 'file':
        return <FileText className="h-4 w-4 text-purple-500" />
    }
  }

  const totalWordCount = sources
    .filter(source => source.status === 'success')
    .reduce((sum, source) => sum + (source.wordCount || 0), 0)

  const isDisabled = workflowStatus === 'analyzing' || workflowStatus === 'generating'

  return (
    <div className="space-y-4 h-full">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Content Sources</CardTitle>
          <CardDescription>
            Add your source content, URLs, and files for AI analysis
          </CardDescription>
          {sources.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {totalWordCount > 0 && (
                <Badge variant="secondary" className="w-fit">
                  {totalWordCount} words total
                </Badge>
              )}
              {sources.filter(s => s.type === 'text' && s.status === 'success').length > 0 && (
                <Badge variant="outline" className="w-fit">
                  {sources.filter(s => s.type === 'text' && s.status === 'success').length} text sources
                </Badge>
              )}
              {sources.filter(s => s.type === 'url' && s.status === 'success').length > 0 && (
                <Badge variant="outline" className="w-fit">
                  {sources.filter(s => s.type === 'url' && s.status === 'success').length} URL sources
                </Badge>
              )}
              {sources.filter(s => s.type === 'file' && s.status === 'success').length > 0 && (
                <Badge variant="outline" className="w-fit">
                  {sources.filter(s => s.type === 'file' && s.status === 'success').length} PDF sources
                </Badge>
              )}
              {sources.filter(s => s.status === 'processing').length > 0 && (
                <Badge variant="secondary" className="w-fit">
                  {sources.filter(s => s.status === 'processing').length} processing
                </Badge>
              )}
              {sources.filter(s => s.status === 'error').length > 0 && (
                <Badge variant="secondary" className="w-fit bg-red-100 text-red-800">
                  {sources.filter(s => s.status === 'error').length} failed
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Raw Content Input */}
          <div className="space-y-2">
            <Label htmlFor="raw-content">Raw Text Content</Label>
            <Textarea
              id="raw-content"
              placeholder="Paste your raw content here..."
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isDisabled}
            />
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {rawContent.split(/\s+/).filter(word => word.length > 0).length} words
              </div>
              <Button 
                size="sm" 
                onClick={addTextSource}
                disabled={!rawContent.trim() || isDisabled}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Text
              </Button>
            </div>
          </div>

          <Separator />

          {/* Source URLs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Source URLs</Label>
              <Button size="sm" variant="outline" onClick={addUrl} disabled={isDisabled}>
                <Plus className="h-4 w-4 mr-1" />
                Add URL
              </Button>
            </div>
            {urls.map((url, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  disabled={isDisabled}
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => addUrlSource(url, index)}
                  disabled={!url.trim() || !jinaReader.isValidURL(url) || isDisabled}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {urls.length > 1 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => removeUrl(index)}
                    disabled={isDisabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* File Upload */}
          <div className="space-y-3">
            <Label>File Upload</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!isDisabled) {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.accept = '.pdf,.txt,.md'
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files) handleFileUpload(files)
                  }
                  input.click()
                }
              }}
            >
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {isDragOver ? 'Drop files here' : 'Drag & drop files here, or click to select'}
              </p>
              <p className="text-xs text-gray-500">Supports PDF, TXT, MD (max 10MB each)</p>
            </div>
          </div>

          {/* Sources List */}
          {sources.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label>Added Sources ({sources.length})</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sources.map((source) => (
                    <div 
                      key={source.id} 
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        source.status === 'error' ? 'border-red-200 bg-red-50' :
                        source.status === 'success' ? 'border-green-200 bg-green-50' :
                        'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {getSourceTypeIcon(source.type)}
                        {getSourceStatusIcon(source.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">
                            {source.type === 'file' ? source.content : 
                             source.type === 'url' ? new URL(source.content).hostname :
                             'Text Content'}
                          </span>
                          {source.wordCount && (
                            <Badge variant="secondary" className="ml-2">
                              {source.wordCount} words
                            </Badge>
                          )}
                        </div>
                        
                        {source.preview && (
                          <p className="text-xs text-gray-600 truncate">
                            {source.preview}
                          </p>
                        )}
                        
                        {source.error && (
                          <div className="mt-1">
                            <p className="text-xs text-red-600">
                              {source.error}
                            </p>
                            {source.type === 'url' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-1 h-6 text-xs"
                                onClick={() => {
                                  // Retry URL extraction - remove the failed source first
                                  setSources(prev => prev.filter(s => s.id !== source.id))
                                  // Then retry with a new attempt
                                  addUrlSource(source.content, Date.now())
                                }}
                                disabled={isDisabled}
                              >
                                Retry
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSource(source.id)}
                        className="flex-shrink-0"
                        disabled={isDisabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Post Configuration */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Blog Configuration</Label>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="topic">Blog Topic/Title</Label>
                <Input 
                  id="topic"
                  placeholder="What should the blog post be about?"
                  value={topic}
                  onChange={(e) => setInputs({ topic: e.target.value })}
                  disabled={isDisabled}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select 
                    value={targetAudience} 
                    onValueChange={(value) => setInputs({ targetAudience: value })}
                    disabled={isDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Audience</SelectItem>
                      <SelectItem value="beginner">Beginners</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced/Expert</SelectItem>
                      <SelectItem value="business">Business Professionals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Target Length</Label>
                  <Select 
                    value={wordCount.toString()} 
                    onValueChange={(value) => setInputs({ wordCount: parseInt(value) })}
                    disabled={isDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">Short (500 words)</SelectItem>
                      <SelectItem value="800">Medium (800 words)</SelectItem>
                      <SelectItem value="1200">Long (1200 words)</SelectItem>
                      <SelectItem value="1500">Very Long (1500+ words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Writing Tone</Label>
                <Select 
                  value={tone} 
                  onValueChange={(value) => setInputs({ tone: value })}
                  disabled={isDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversational">Conversational & Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual & Relaxed</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}