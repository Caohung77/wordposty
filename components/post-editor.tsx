"use client"

import { useState } from "react"
import ContentInput from "@/components/content-input"
import AIEditor from "@/components/ai-editor"
import WorkflowStatus from "@/components/workflow-status"

export default function PostEditor() {
  const [postData, setPostData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    tags: [],
    featuredImage: null,
    seoTitle: "",
    metaDescription: "",
    slug: "",
    publishDate: "",
    status: "draft",
  })

  const [aiOptions, setAiOptions] = useState({
    generateSEO: true,
    generateHeaders: true,
    generateMeta: true,
    generateImages: false,
    generateLinks: true,
  })

  return (
    <div className="space-y-6">
      {/* Workflow Status - Full Width */}
      <WorkflowStatus />
      
      <div className="grid grid-cols-9 gap-6 h-[calc(100vh-300px)]">
        {/* Left Panel - Content Input */}
        <div className="col-span-3">
          <ContentInput />
        </div>

        {/* Center Panel - AI Editor (Expanded) */}
        <div className="col-span-6">
          <AIEditor aiOptions={aiOptions} setAiOptions={setAiOptions} />
        </div>
      </div>
    </div>
  )
}
