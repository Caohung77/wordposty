import { SourceAnalysis } from './perplexity';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'style' | 'industry' | 'format' | 'custom';
}

export interface PromptVariables {
  topic: string;
  sources: string;
  audience: string;
  wordCount: number;
  tone: string;
  keyInsights: string;
  seoKeywords: string;
  currentTrends: string;
  citations: string;
  currentDate: string;
}

// Predefined prompt templates
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'conversational',
    name: 'Conversational & Friendly',
    description: 'Professional blogger with casual, engaging tone',
    category: 'style',
    variables: ['topic', 'sources', 'audience', 'wordCount', 'tone', 'keyInsights', 'seoKeywords', 'currentTrends', 'currentDate'],
    template: `Act as a professional blogger with 10+ years of experience in writing engaging and relatable content. Imagine you are having a casual conversation with a friend over coffee.

ANALYZED RESEARCH DATA:
- Key insights: {keyInsights}
- Current trends: {currentTrends}
- SEO keywords: {seoKeywords}
- Citations available: {citations}

USER PREFERENCES:
- Topic: {topic}
- Word count: approximately {wordCount} words
- Tone: {tone}
- Target audience: {audience}
- Current date: {currentDate}

Your task is to write a blog post about "{topic}" that feels personal and authentic. Use a friendly, conversational tone with contractions and colloquial language. Include personal anecdotes and sensory details to make the content vivid and relatable.

Naturally incorporate the research insights as supporting evidence. Use rhetorical questions to engage readers, vary sentence structure for natural flow, and include current trends from the analysis.

Make sure to:
- Include 2-3 specific data points from research with attribution
- Use slight imperfections to mimic human writing
- Integrate SEO keywords naturally (don't force them)
- Structure with captivating intro, organized body, and engaging conclusion
- Add call-to-action that encourages reader interaction
- Write as if you personally researched and experienced this topic`
  },
  {
    id: 'professional',
    name: 'Professional & Authoritative',
    description: 'Expert authority in the field with professional tone',
    category: 'style',
    variables: ['topic', 'sources', 'audience', 'wordCount', 'keyInsights', 'seoKeywords', 'currentTrends', 'currentDate'],
    template: `Act as a recognized industry expert and thought leader with extensive experience in {topic}.

RESEARCH FOUNDATION:
- Key insights: {keyInsights}
- Industry trends: {currentTrends}
- SEO focus: {seoKeywords}
- Supporting data: {citations}

ARTICLE SPECIFICATIONS:
- Topic: {topic}
- Target length: {wordCount} words
- Audience: {audience}
- Publication date: {currentDate}

Write an authoritative, well-researched article that establishes credibility and provides actionable insights. Use a professional tone that demonstrates expertise while remaining accessible to your target audience.

Requirements:
- Lead with compelling statistics or industry data
- Structure with clear headings and subheadings
- Include specific examples and case studies
- Reference current industry trends and developments
- Provide actionable recommendations
- Conclude with strategic takeaways for implementation
- Maintain professional credibility throughout`
  },
  {
    id: 'tutorial',
    name: 'Step-by-Step Tutorial',
    description: 'Educational guide with clear instructions',
    category: 'format',
    variables: ['topic', 'audience', 'wordCount', 'keyInsights', 'seoKeywords', 'currentDate'],
    template: `Act as an experienced educator and tutorial creator specializing in {topic}.

EDUCATIONAL CONTENT:
- Subject: {topic}
- Student level: {audience}
- Tutorial length: {wordCount} words
- Key concepts: {keyInsights}
- Search optimization: {seoKeywords}
- Current date: {currentDate}

Create a comprehensive, step-by-step tutorial that guides readers through learning {topic}. Structure the content for progressive learning with clear, actionable steps.

Tutorial structure:
1. Introduction explaining what readers will learn
2. Prerequisites and required knowledge/tools
3. Step-by-step instructions with explanations
4. Common pitfalls and troubleshooting
5. Practice exercises or next steps
6. Additional resources and further reading

Writing guidelines:
- Use clear, simple language appropriate for {audience}
- Include specific examples and code snippets where relevant
- Add visual cues like "Step 1:", "Note:", "Warning:"
- Explain the "why" behind each step, not just the "how"
- Include checkpoints to verify progress
- End with a summary of what was accomplished`
  },
  {
    id: 'listicle',
    name: 'Engaging Listicle',
    description: 'List-based article with engaging format',
    category: 'format',
    variables: ['topic', 'audience', 'wordCount', 'keyInsights', 'seoKeywords', 'currentTrends', 'currentDate'],
    template: `Act as a content creator specializing in engaging, shareable list-format articles.

CONTENT BRIEF:
- Topic: {topic}
- Format: Numbered list article
- Target audience: {audience}
- Word count: {wordCount} words
- Key points to include: {keyInsights}
- Trending elements: {currentTrends}
- SEO keywords: {seoKeywords}
- Publication date: {currentDate}

Create an engaging listicle about {topic} that combines valuable information with entertainment value. Each list item should provide genuine value while maintaining reader interest.

Structure requirements:
- Compelling headline with number (e.g., "7 Ways to...")
- Brief, engaging introduction setting up the list
- 5-10 main list items (depending on word count)
- Each item with descriptive subheading
- Supporting details, examples, or mini-stories for each point
- Smooth transitions between items
- Conclusion that ties everything together

Writing style:
- Conversational and accessible tone
- Use specific examples and anecdotes
- Include surprising or counterintuitive points
- Add personality and humor where appropriate
- Make each point actionable and practical
- Use strong, descriptive subheadings for scannability`
  },
  {
    id: 'technical',
    name: 'Technical Deep-Dive',
    description: 'In-depth technical analysis for expert audience',
    category: 'industry',
    variables: ['topic', 'wordCount', 'keyInsights', 'seoKeywords', 'citations', 'currentDate'],
    template: `Act as a senior technical expert and researcher with deep specialization in {topic}.

TECHNICAL ANALYSIS BRIEF:
- Subject: {topic}
- Analysis depth: Comprehensive technical review
- Target length: {wordCount} words
- Technical insights: {keyInsights}
- Research citations: {citations}
- SEO considerations: {seoKeywords}
- Analysis date: {currentDate}

Produce a thorough technical analysis that demonstrates deep understanding of {topic}. The content should be authoritative, well-researched, and valuable to expert practitioners.

Technical writing requirements:
- Lead with problem statement or technical challenge
- Provide comprehensive background and context
- Include detailed technical explanations with proper terminology
- Reference specific methodologies, frameworks, or standards
- Analyze pros/cons of different approaches
- Include code examples, diagrams, or technical specifications where relevant
- Cite authoritative sources and recent research
- Discuss implications and future considerations
- Conclude with expert recommendations

Maintain technical accuracy while ensuring logical flow and clear explanations. Assume readers have advanced knowledge but explain complex concepts clearly.`
  },
  {
    id: 'storytelling',
    name: 'Narrative Storytelling',
    description: 'Story-driven content with emotional connection',
    category: 'style',
    variables: ['topic', 'audience', 'wordCount', 'keyInsights', 'currentDate'],
    template: `Act as a master storyteller and narrative writer who weaves compelling stories around {topic}.

NARRATIVE ELEMENTS:
- Central theme: {topic}
- Target audience: {audience}
- Story length: {wordCount} words
- Key messages: {keyInsights}
- Publication context: {currentDate}

Craft a compelling narrative that uses storytelling techniques to engage readers emotionally while delivering valuable insights about {topic}.

Storytelling structure:
- Hook opening with relatable scenario or character
- Establish conflict, challenge, or transformation journey
- Weave in key insights through character experiences
- Use dialogue, sensory details, and emotional moments
- Build toward resolution or revelation
- Connect story lessons to practical applications
- End with meaningful takeaway or call to reflection

Narrative techniques:
- Create relatable characters or scenarios
- Use vivid, sensory descriptions
- Include internal thoughts and emotions
- Build tension and resolution
- Show rather than tell important concepts
- Use metaphors and analogies to explain complex ideas
- Maintain authenticity and genuine emotion throughout
- Balance entertainment with educational value`
  }
];

class PromptTemplateManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    // Load predefined templates
    PROMPT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  getTemplate(id: string): PromptTemplate | null {
    return this.templates.get(id) || null;
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  addCustomTemplate(template: Omit<PromptTemplate, 'id'> & { id?: string }): string {
    const id = template.id || `custom_${Date.now()}`;
    const fullTemplate: PromptTemplate = {
      ...template,
      id,
      category: 'custom'
    };
    
    this.templates.set(id, fullTemplate);
    return id;
  }

  renderTemplate(templateId: string, variables: Partial<PromptVariables>): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let rendered = template.template;

    // Replace all variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      const stringValue = Array.isArray(value) ? value.join(', ') : String(value || '');
      rendered = rendered.replace(new RegExp(placeholder, 'g'), stringValue);
    });

    return rendered;
  }

  prepareVariablesFromAnalysis(
    sourceAnalysis: SourceAnalysis,
    topic: string,
    wordCount: number,
    tone: string,
    audience: string
  ): PromptVariables {
    return {
      topic,
      sources: 'Analyzed source content',
      audience,
      wordCount,
      tone,
      keyInsights: sourceAnalysis.keyInsights?.join('; ') || '',
      seoKeywords: sourceAnalysis.seoKeywords?.join(', ') || '',
      currentTrends: sourceAnalysis.currentTrends?.join('; ') || '',
      citations: sourceAnalysis.citations?.join('; ') || '',
      currentDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  }

  validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for unclosed braces
    const openBraces = (template.match(/\{/g) || []).length;
    const closeBraces = (template.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Mismatched braces in template');
    }

    // Check for valid variables
    const variables = template.match(/\{(\w+)\}/g) || [];
    const validVariables = ['topic', 'sources', 'audience', 'wordCount', 'tone', 'keyInsights', 'seoKeywords', 'currentTrends', 'citations', 'currentDate'];
    
    variables.forEach(variable => {
      const varName = variable.replace(/[{}]/g, '');
      if (!validVariables.includes(varName)) {
        errors.push(`Unknown variable: ${variable}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const promptTemplateManager = new PromptTemplateManager();
export default PromptTemplateManager;