"use client"

import { useWorkflowStore } from "@/lib/workflow-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, Search, PenTool, Sparkles } from "lucide-react"

export default function WorkflowStatus() {
  const { status, currentStep, progress, analysisError, generationError } = useWorkflowStore()

  const getStepIcon = (step: string, isActive: boolean, isCompleted: boolean) => {
    const iconClass = `w-4 h-4 ${
      isCompleted ? 'text-green-600' : 
      isActive ? 'text-blue-600' : 
      'text-gray-400'
    }`

    switch (step) {
      case 'sources':
        return <Search className={iconClass} />
      case 'analysis':
        return <Sparkles className={iconClass} />
      case 'generation':
        return <PenTool className={iconClass} />
      case 'completed':
        return <CheckCircle className={iconClass} />
      default:
        return <Clock className={iconClass} />
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'idle':
        return <Badge variant="secondary">Ready</Badge>
      case 'analyzing':
        return <Badge variant="default">Analyzing Sources</Badge>
      case 'generating':
        return <Badge variant="default">Writing Blog Post</Badge>
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const steps = [
    { key: 'sources', label: 'Source Input', description: 'Add content sources' },
    { key: 'analysis', label: 'Perplexity Analysis', description: 'AI research & fact-checking' },
    { key: 'generation', label: 'Claude Generation', description: 'Human-like writing' },
    { key: 'completed', label: 'Ready to Publish', description: 'Export to WordPress' },
  ]

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep)
  }

  const currentStepIndex = getCurrentStepIndex()

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI Blog Agent Status</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = step.key === currentStep
            const isCompleted = index < currentStepIndex || status === 'completed'
            
            return (
              <div 
                key={step.key}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-50 border border-blue-200' :
                  isCompleted ? 'bg-green-50 border border-green-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                {getStepIcon(step.key, isActive, isCompleted)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      isActive ? 'text-blue-900' :
                      isCompleted ? 'text-green-900' :
                      'text-gray-600'
                    }`}>
                      {step.label}
                    </span>
                    {isActive && status !== 'idle' && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                        <span className="text-xs text-blue-600">Processing...</span>
                      </div>
                    )}
                  </div>
                  <p className={`text-sm ${
                    isActive ? 'text-blue-700' :
                    isCompleted ? 'text-green-700' :
                    'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Error Messages */}
        {(analysisError || generationError) && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-red-900 mb-1">Error occurred:</p>
              <p className="text-red-700">
                {analysisError || generationError}
              </p>
            </div>
          </div>
        )}

        {/* Agent Information */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs font-medium text-purple-900">Perplexity AI</p>
            <p className="text-xs text-purple-700">Source Analysis</p>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <PenTool className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <p className="text-xs font-medium text-orange-900">Claude AI</p>
            <p className="text-xs text-orange-700">Content Writing</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}