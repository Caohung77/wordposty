"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  ImageIcon, 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  Download, 
  Copy,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Upload
} from "lucide-react"
import { BlogGeneration } from "@/lib/claude"
import { SourceAnalysis } from "@/lib/perplexity"

interface FeaturedImageProps {
  blogGeneration: BlogGeneration;
  sourceAnalysis?: SourceAnalysis;
}

export default function FeaturedImage({ blogGeneration, sourceAnalysis }: FeaturedImageProps) {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useSmartPrompt, setUseSmartPrompt] = useState(true)
  const [customPrompt, setCustomPrompt] = useState("")
  const [smartPromptPreview, setSmartPromptPreview] = useState("")
  const [lastUsedPrompt, setLastUsedPrompt] = useState("")

  // Generate smart prompt preview
  const generateSmartPromptPreview = () => {
    if (!blogGeneration) return ""
    
    let prompt = `Professional blog header image for: "${blogGeneration.title}"`
    
    if (sourceAnalysis?.seoKeywords && sourceAnalysis.seoKeywords.length > 0) {
      const topKeywords = sourceAnalysis.seoKeywords.slice(0, 3).join(', ')
      prompt += `. Visual elements related to: ${topKeywords}`
    }

    if (sourceAnalysis?.mainThemes && sourceAnalysis.mainThemes.length > 0) {
      const topThemes = sourceAnalysis.mainThemes.slice(0, 2).join(', ')
      prompt += `. Themed around: ${topThemes}`
    }

    prompt += '. Modern, clean, professional design. High-quality, 16:9 aspect ratio.'
    
    return prompt
  }

  const handleGenerateImage = async () => {
    if (!blogGeneration) return

    setIsGenerating(true)
    setError(null)

    try {
      const requestBody = {
        blogGeneration,
        sourceAnalysis,
        useSmartPrompt,
        customPrompt: useSmartPrompt ? undefined : customPrompt
      }

      const response = await fetch('/api/imagen/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate image')
      }

      if (data.success && data.image) {
        console.log('Generated image URL:', data.image.imageUrl.substring(0, 100) + '...')
        console.log('Image URL starts with:', data.image.imageUrl.substring(0, 30))
        setGeneratedImage(data.image.imageUrl)
        setLastUsedPrompt(data.image.prompt)
      } else {
        throw new Error('Invalid response from image generation API')
      }

    } catch (error) {
      console.error('Image generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadImage = () => {
    if (!generatedImage) return
    
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `${blogGeneration.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_featured_image.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Update smart prompt preview when dependencies change
  useState(() => {
    setSmartPromptPreview(generateSmartPromptPreview())
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="font-medium text-gray-900 mb-2">AI-Generated Featured Image</h3>
        <p className="text-sm text-gray-600">
          Create a professional featured image for your blog post using Google Imagen AI
        </p>
      </div>

      {/* Image Display Area */}
      <Card>
        <CardContent className="p-6">
          {generatedImage ? (
            <div className="space-y-4">
              <div className="relative group">
                <img
                  src={generatedImage}
                  alt="Generated featured image"
                  className="w-full rounded-lg shadow-md block"
                  style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                  onLoad={() => console.log('Image loaded successfully')}
                  onError={(e) => console.error('Image failed to load:', e)}
                />
                {/* Action buttons positioned outside the image */}
                <div className="mt-2 flex justify-center space-x-2">
                  <Button size="sm" variant="outline" onClick={downloadImage}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setGeneratedImage(null)}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Replace
                  </Button>
                </div>
              </div>
              
              {lastUsedPrompt && (
                <div className="p-3 bg-gray-50 rounded border">
                  <Label className="text-xs font-medium text-gray-700">Generated with prompt:</Label>
                  <p className="text-xs text-gray-600 mt-1">{lastUsedPrompt}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  {isGenerating ? (
                    <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {isGenerating ? 'Generating image...' : 'No image generated yet'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {isGenerating ? 'This may take a few seconds' : 'Click "Generate Image" to create a featured image'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prompt Configuration */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Prompt Settings</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="smart-prompt" className="text-sm">Smart Prompt</Label>
              <Switch
                id="smart-prompt"
                checked={useSmartPrompt}
                onCheckedChange={setUseSmartPrompt}
              />
            </div>
          </div>

          {useSmartPrompt ? (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Wand2 className="h-4 w-4 text-purple-600 mt-0.5" />
                  <Label className="text-sm font-medium text-purple-900">Smart Prompt Preview</Label>
                </div>
                <p className="text-sm text-purple-700">{generateSmartPromptPreview()}</p>
              </div>
              
              {sourceAnalysis && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="font-medium text-gray-700">Keywords Used:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sourceAnalysis.seoKeywords?.slice(0, 3).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="font-medium text-gray-700">Themes Used:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sourceAnalysis.mainThemes?.slice(0, 2).map((theme, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="custom-prompt">Custom Prompt</Label>
              <Textarea
                id="custom-prompt"
                placeholder="Describe the image you want to generate for your blog post..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Tip: Include style, mood, colors, and composition details for better results
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Generation Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {generatedImage ? (
            <span>Image ready for use in your blog post</span>
          ) : (
            <span>Configure prompt settings and generate your image</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          {generatedImage && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setGeneratedImage(null)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Generate New
            </Button>
          )}
          
          <Button
            onClick={handleGenerateImage}
            disabled={isGenerating || (!useSmartPrompt && !customPrompt.trim())}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {generatedImage ? 'Regenerate Image' : 'Generate Image'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}