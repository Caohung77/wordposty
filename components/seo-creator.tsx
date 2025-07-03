"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  Search, 
  Hash, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Download,
  ArrowRight,
  BarChart3,
  Zap
} from "lucide-react"

interface HeadingTermFrequency {
  term: string
  frequency: number
  headingLevels: string[]
  examples: string[]
  relevanceScore: number
  variations: string[]
}

interface HeadingPatterns {
  commonStructures: string[]
  avgHeadingsPerPage: number
  h1Patterns: string[]
  h2Patterns: string[]
  h3Patterns: string[]
  totalHeadingsAnalyzed: number
}

interface ContentTermFrequency {
  term: string
  frequency: number
  relevanceScore: number
  context: string
  variations: string[]
}

interface SEOAnalysisResult {
  keyword: string
  headingTermsFrequency: HeadingTermFrequency[]
  contentTermsFrequency: ContentTermFrequency[]
  topSingleWords: {
    word: string
    frequency: number
    headingLevels: string[]
  }[]
  headingPatterns: HeadingPatterns
  strategicInsights: {
    topOpportunities: string[]
    competitorGaps: string[]
    recommendedStructure: string[]
  }
  metadata: {
    analyzedUrls: string[]
    analysisDate: string
    totalResults: number
    totalHeadingsFound: number
    totalContentWordsAnalyzed: number
  }
}

export default function SEOCreator() {
  const router = useRouter()
  const [keyword, setKeyword] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<SEOAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleAnalyze = async () => {
    if (!keyword.trim()) return

    setIsAnalyzing(true)
    setError(null)
    setProgress(0)
    setAnalysisResult(null)

    try {
      // Simulate progress updates
      setProgress(20)
      
      const response = await fetch('/api/seo-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keyword.trim() })
      })

      setProgress(60)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'SEO analysis failed')
      }

      setProgress(100)
      setAnalysisResult(data.analysis)
      
    } catch (error) {
      console.error('SEO analysis error:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportResults = () => {
    if (!analysisResult) return
    
    const exportData = {
      keyword: analysisResult.keyword,
      headingTermsFrequency: analysisResult.headingTermsFrequency,
      contentTermsFrequency: analysisResult.contentTermsFrequency,
      topSingleWords: analysisResult.topSingleWords,
      headingPatterns: analysisResult.headingPatterns,
      strategicInsights: analysisResult.strategicInsights,
      metadata: analysisResult.metadata,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-frequency-analysis-${analysisResult.keyword.replace(/\s+/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleUseInCreate = (result: SEOAnalysisResult) => {
    // Store SEO analysis data in localStorage for the Create tab to use
    const seoData = {
      keyword: result.keyword,
      headingTermsFrequency: result.headingTermsFrequency.slice(0, 10),
      topSingleWords: result.topSingleWords.slice(0, 15),
      strategicInsights: result.strategicInsights,
      suggestedTitle: generateSuggestedTitle(result),
      suggestedOutline: generateSuggestedOutline(result),
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('seo-analysis-data', JSON.stringify(seoData))
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('seo-data-ready', { detail: seoData }))
    
    // Trigger tab change to Create tab
    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'editor' }))
    
    // Show success message
    setTimeout(() => {
      alert(`SEO insights for "${result.keyword}" are now loaded in the Create tab!`)
    }, 500)
  }

  const generateSuggestedTitle = (result: SEOAnalysisResult): string => {
    // Look for the highest frequency term that includes H1
    const h1Term = result.headingTermsFrequency.find(term => 
      term.headingLevels.includes('h1') && term.frequency > 1
    )
    
    if (h1Term && h1Term.examples.length > 0) {
      return h1Term.examples[0]
    }
    
    // Use the most frequent term as fallback
    const topTerm = result.headingTermsFrequency[0]
    if (topTerm) {
      return `Complete Guide to ${topTerm.term}`
    }
    
    return `Complete Guide to ${result.keyword}`
  }

  const generateSuggestedOutline = (result: SEOAnalysisResult): string[] => {
    const outline: string[] = []
    
    // Use strategic insights first
    if (result.strategicInsights.recommendedStructure.length > 0) {
      outline.push(...result.strategicInsights.recommendedStructure.slice(0, 3))
    }
    
    // Add top heading terms as sections
    result.headingTermsFrequency.slice(0, 6).forEach(term => {
      if (term.relevanceScore > 0.6) {
        outline.push(term.term)
      }
    })
    
    // Add opportunities from strategic insights
    if (result.strategicInsights.topOpportunities.length > 0) {
      outline.push(...result.strategicInsights.topOpportunities.slice(0, 2))
    }
    
    return outline.slice(0, 8) // Limit to 8 sections
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
            Create by SEO
          </h1>
          <p className="text-gray-600 mt-1">
            Analyze top Google results to extract heading terms and content insights for your keyword
          </p>
        </div>
        
        {analysisResult && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Analysis Complete
          </Badge>
        )}
      </div>

      {/* Keyword Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2 text-purple-500" />
            Keyword Analysis
          </CardTitle>
          <CardDescription>
            Enter a keyword to analyze the top 10 Google search results and extract SEO insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="keyword">Target Keyword</Label>
              <Input
                id="keyword"
                placeholder="e.g., 'AI content creation', 'digital marketing strategy'"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAnalyzing && handleAnalyze()}
                disabled={isAnalyzing}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAnalyze}
                disabled={!keyword.trim() || isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Analyzing Google results...</span>
                <span className="text-gray-600">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Analysis Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {analysisResult && (
        <>
          {/* Results Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Analysis Results
                  </CardTitle>
                  <CardDescription>
                    Insights extracted from {analysisResult.metadata.totalResults} top-ranking pages for "{analysisResult.keyword}"
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={exportResults}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUseInCreate(analysisResult)}
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Use in Create
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Hash className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                  <p className="font-medium text-blue-900">Heading Terms</p>
                  <p className="text-sm text-blue-700">
                    {analysisResult.headingTermsFrequency.length} phrases found
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <FileText className="h-6 w-6 mx-auto text-orange-600 mb-1" />
                  <p className="font-medium text-orange-900">Content Terms</p>
                  <p className="text-sm text-orange-700">
                    {analysisResult.contentTermsFrequency?.length || 0} phrases found
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <BarChart3 className="h-6 w-6 mx-auto text-green-600 mb-1" />
                  <p className="font-medium text-green-900">Single Words</p>
                  <p className="text-sm text-green-700">{analysisResult.topSingleWords.length} words</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                  <p className="font-medium text-purple-900">Sources</p>
                  <p className="text-sm text-purple-700">{analysisResult.metadata.analyzedUrls.length} URLs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid grid-cols-2 gap-6">
            {/* Heading Terms Frequency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hash className="h-5 w-5 mr-2 text-blue-500" />
                  Heading Terms Frequency
                </CardTitle>
                <CardDescription>
                  Terms and phrases with frequency counts from competitor headings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analysisResult.headingTermsFrequency.map((term, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium text-blue-900">
                            {term.term} ({term.frequency})
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(term.term)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Heading Levels */}
                      <div className="flex items-center space-x-2 mb-2">
                        {term.headingLevels.map((level, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {level.toUpperCase()}
                          </Badge>
                        ))}
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(term.relevanceScore * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Examples */}
                      {term.examples.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Example: </span>
                          {term.examples[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Terms Frequency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-500" />
                  Content Terms Frequency
                </CardTitle>
                <CardDescription>
                  Terms and phrases with frequency counts from competitor content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analysisResult.contentTermsFrequency && analysisResult.contentTermsFrequency.length > 0 ? (
                    analysisResult.contentTermsFrequency.map((term, index) => (
                      <div key={index} className="p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <span className="font-medium text-orange-900">
                              {term.term} ({term.frequency})
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(term.term)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Relevance Score */}
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Score: {Math.round(term.relevanceScore * 100)}%
                          </Badge>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-orange-500 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(term.relevanceScore * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Context */}
                        {term.context && (
                          <div className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Context: </span>
                            {term.context}
                          </div>
                        )}
                        
                        {/* Variations */}
                        {term.variations && term.variations.length > 0 && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Variations: </span>
                            {term.variations.slice(0, 2).join(', ')}
                            {term.variations.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No content terms found</p>
                      <p className="text-xs">Content analysis will appear here after keyword analysis</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Single Words */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
                Top Single Words
              </CardTitle>
              <CardDescription>
                Most frequently used individual words in headings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analysisResult.topSingleWords.slice(0, Math.ceil(analysisResult.topSingleWords.length / 2)).map((word, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                      <div className="flex items-center space-x-3 flex-1">
                        <Badge variant="secondary" className="w-8 text-xs">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{word.word}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {word.frequency}x
                        </Badge>
                        <div className="flex space-x-1">
                          {word.headingLevels.map((level, idx) => (
                            <div key={idx} className="w-2 h-2 bg-green-500 rounded-full" title={level}></div>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(word.word)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analysisResult.topSingleWords.slice(Math.ceil(analysisResult.topSingleWords.length / 2)).map((word, index) => (
                    <div key={index + Math.ceil(analysisResult.topSingleWords.length / 2)} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                      <div className="flex items-center space-x-3 flex-1">
                        <Badge variant="secondary" className="w-8 text-xs">
                          {index + Math.ceil(analysisResult.topSingleWords.length / 2) + 1}
                        </Badge>
                        <span className="font-medium">{word.word}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {word.frequency}x
                        </Badge>
                        <div className="flex space-x-1">
                          {word.headingLevels.map((level, idx) => (
                            <div key={idx} className="w-2 h-2 bg-green-500 rounded-full" title={level}></div>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(word.word)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Insights */}
          {analysisResult.strategicInsights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                  Strategic Insights
                </CardTitle>
                <CardDescription>
                  Competitive intelligence and optimization opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Top Opportunities */}
                {analysisResult.strategicInsights.topOpportunities.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Top Opportunities
                    </Label>
                    <div className="space-y-2">
                      {analysisResult.strategicInsights.topOpportunities.map((opportunity, index) => (
                        <div key={index} className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                          💡 {opportunity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitor Gaps */}
                {analysisResult.strategicInsights.competitorGaps.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Competitor Gaps
                    </Label>
                    <div className="space-y-2">
                      {analysisResult.strategicInsights.competitorGaps.map((gap, index) => (
                        <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          🔍 {gap}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Structure */}
                {analysisResult.strategicInsights.recommendedStructure.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Recommended Structure
                    </Label>
                    <div className="space-y-2">
                      {analysisResult.strategicInsights.recommendedStructure.map((structure, index) => (
                        <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          📋 {structure}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analyzed URLs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Analyzed Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysisResult.metadata.analyzedUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="flex-1 truncate text-blue-600">{url}</span>
                    <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!analysisResult && !isAnalyzing && !error && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Ready for SEO Analysis</h3>
              <p className="text-gray-600 mb-4">
                Enter a keyword above to analyze top Google results and extract heading terms and content insights
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Hash className="h-4 w-4 mr-1" />
                  Heading Analysis
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Content Terms
                </div>
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Competitor Insights
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}