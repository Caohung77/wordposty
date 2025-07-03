# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev`: Start development server with Turbopack enabled
- `npm run build`: Build production version
- `npm run start`: Start production server
- `npm run lint`: Run ESLint for code quality checks

## Project Architecture

**WordPosty Dashboard** is a Next.js 15 application for AI-powered content creation and management.

### Core Structure
- **App Router**: Uses Next.js App Router (not Pages Router)
- **TypeScript**: Fully typed with strict TypeScript configuration
- **Component Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS 4 with CSS variables for theming

### Key Directories
- `/app/`: App Router pages and layouts
  - `page.tsx`: Main tabbed interface (Dashboard, Create, Templates, Analytics)
  - `layout.tsx`: Root layout with Geist fonts
  - `globals.css`: Global styles and theme variables
- `/components/`: Feature components and UI library
  - `/ui/`: Shadcn/ui components (Button, Card, Tabs, etc.)
  - Feature components: `dashboard.tsx`, `post-editor.tsx`, `ai-editor.tsx`, etc.
- `/lib/`: Utility functions

### Application Features
- **Dashboard**: Content overview with post statistics and management
- **Post Editor**: Three-panel layout for content creation with AI assistance
- **SEO Tools**: SEO scoring and optimization panel
- **Templates**: Pre-built content templates
- **Analytics**: Content performance tracking

### Component Patterns
- Client components marked with `"use client"` directive
- Props-based data flow (no global state management currently)
- Composition pattern with Shadcn/ui components
- Status-based styling with utility functions (getStatusColor, getStatusIcon)

### Styling System
- **Theme**: "new-york" style with zinc base color
- **Icons**: Lucide React icon library
- **Responsive**: Mobile-first approach
- **Variables**: CSS custom properties for theme switching

### TypeScript Configuration
- Path aliases: `@/*` maps to root directory
- Target: ES2017 with bundler module resolution
- Strict type checking enabled

---

## WordPosty AI Blog Agent - Project Roadmap

### 🎯 **Project Vision**
Transform WordPosty into a complete AI-powered blog posting agent that:
- Accepts multiple input sources (text, URLs, files)
- Uses **Perplexity AI** for source analysis and research
- Uses **Claude (Anthropic)** for human-like blog post generation
- Provides SEO optimization and WordPress integration
- One-click exports to WordPress with complete metadata

### 🤖 **Dual-AI Architecture**

#### **Agent 1: Perplexity Source Analyzer**
- **API**: `https://api.perplexity.ai/chat/completions`
- **Model**: "sonar" with web search capabilities
- **Purpose**: Real-time research, fact-checking, trend analysis
- **Features**: Live web access, citation generation, SEO keyword research

#### **Agent 2: Claude Blog Writer**
- **API**: `https://api.anthropic.com/v1/messages`
- **Model**: "claude-sonnet-4-20250514"
- **Purpose**: Human-like content creation with conversational tone
- **Features**: Natural writing, SEO integration, meta generation

### 📋 **Implementation Phases**

#### **Phase 1: API Integration Foundation (Week 1)**
**Environment Setup:**
```bash
# Add to .env.local
PERPLEXITY_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

**New Dependencies:**
```json
{
  "dependencies": {
    "axios": "^1.6.2",
    "@anthropic-ai/sdk": "^0.20.0",
    "cheerio": "^1.0.0-rc.12",
    "pdf-parse": "^1.1.1",
    "zustand": "^4.4.7"
  }
}
```

**Tasks:**
- Create API service layer (`/lib/perplexity.ts`, `/lib/claude.ts`)
- Add error handling and rate limiting
- Enhanced UI with agent status indicators
- Progress tracking for two-step process

#### **Phase 2: Perplexity Source Analyzer (Week 2)**
**Features:**
- Multi-source analysis (URLs, PDFs, text)
- Real-time trend research using `search_mode: "web"`
- Structured output generation with citations
- SEO keyword extraction and fact-checking

**API Route:** `/api/analyze`

**Perplexity Prompt Template:**
```
Analyze the following sources for blog content creation:

SOURCES: [URLs, PDF content, user text]
TOPIC: [from UI]
TARGET AUDIENCE: [from UI]

Using search_mode: "web" and reasoning_effort: "high":
1. Extract 5-7 key insights with current data
2. Identify trending topics related to the subject
3. Find supporting statistics and examples
4. Suggest primary and secondary SEO keywords
5. Fact-check any claims made
6. Provide credible citations

Output as structured JSON.
```

#### **Phase 3: Claude Blog Writer Integration (Week 3)**
**Features:**
- Enhanced conversational prompt system
- Source integration from Perplexity analysis
- Natural SEO keyword integration
- Meta description and tag generation

**API Route:** `/api/generate`

**Base Writing Prompt:**
```
Act as a professional blogger with 10+ years of experience in writing engaging and relatable content. Imagine you are having a casual conversation with a friend over coffee.

ANALYZED RESEARCH DATA:
- Key insights: [from Perplexity]
- Current trends: [from Perplexity]
- SEO keywords: [from Perplexity]
- Citations: [from Perplexity]

USER PREFERENCES:
- Topic: [from UI]
- Word count: [from UI]
- Tone: [conversational - customizable]
- Target date: [current date]

Your task is to write a blog post about [topic] that feels personal and authentic. Use a friendly, conversational tone with contractions and colloquial language. Include personal anecdotes and sensory details to make the content vivid and relatable.

Naturally incorporate the research insights as supporting evidence. Use rhetorical questions to engage readers, vary sentence structure for natural flow, and include current trends from the analysis.

Make sure to:
- Include 2-3 specific data points from research with attribution
- Use slight imperfections to mimic human writing
- Integrate SEO keywords naturally (don't force them)
- Structure with captivating intro, organized body, and engaging conclusion
- Add call-to-action that encourages reader interaction

Write as if you personally researched and experienced this topic.
```

#### **Phase 4: WordPress Integration & Polish (Week 4)**
**Features:**
- Complete WordPress API integration
- Automated meta description and tag generation
- One-click publishing with all metadata
- Performance optimization and error handling

**API Routes:**
- `/api/wordpress/publish` - WordPress export
- `/api/workflow/status` - Progress tracking

### 🛠 **Technical Architecture**

#### **API Service Structure:**
```typescript
// /lib/perplexity.ts
interface SourceAnalysis {
  keyInsights: string[];
  mainThemes: string[];
  currentTrends: string[];
  seoKeywords: string[];
  factualClaims: string[];
  citations: string[];
}

// /lib/claude.ts
interface BlogGeneration {
  title: string;
  content: string;
  metaDescription: string;
  tags: string[];
  seoScore: number;
}
```

#### **Workflow Pipeline:**
1. **Source Input** → Multiple sources (text/URL/files)
2. **Perplexity Analysis** → Research + fact-checking + SEO keywords
3. **Claude Generation** → Human-like blog post with SEO optimization
4. **WordPress Export** → Complete metadata + one-click publishing

### 📈 **Success Metrics**

#### **Phase 1-2 Success Criteria:**
- ✅ Perplexity API integration working
- ✅ Multi-source processing (text, URL, PDF)
- ✅ Structured analysis output

#### **Phase 3-4 Success Criteria:**
- ✅ Claude generates human-like blog posts
- ✅ SEO scores consistently above 80/100
- ✅ WordPress publishing works end-to-end
- ✅ Sub-10 second total generation time

### 🚀 **Key Features**

#### **Completed Features:**
- ✅ Complete UI framework with 3-panel editor
- ✅ Dashboard and analytics views
- ✅ Template system foundation
- ✅ Responsive design with Shadcn/ui

#### **To Be Implemented:**
- 🔄 **Perplexity Source Analysis** - Real-time research and fact-checking
- 🔄 **Claude Content Generation** - Human-like writing with conversational tone
- 🔄 **WordPress Integration** - One-click publishing with metadata
- 🔄 **SEO Optimization** - Automated keyword integration and scoring
- 🔄 **Multi-source Processing** - URL, PDF, and text input handling

**Estimated Timeline**: 4 weeks for complete implementation
**Architecture**: Perplexity (analysis) + Claude (writing) = Optimal content creation pipeline