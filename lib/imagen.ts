import { SourceAnalysis } from './perplexity';
import { BlogGeneration } from './claude';

export interface ImageGenerationRequest {
  blogGeneration: BlogGeneration;
  sourceAnalysis?: SourceAnalysis;
  customPrompt?: string;
  useSmartPrompt?: boolean;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  prompt: string;
  timestamp: string;
}

class ImagenService {
  private apiKey: string;
  private modelId = 'models/imagen-4.0-generate-preview-06-06';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is required for image generation');
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const prompt = this.buildImagePrompt(request);
      
      // Use the exact REST API format from your bash script
      const requestBody = {
        instances: [
          {
            prompt: prompt
          }
        ],
        parameters: {
          outputMimeType: "image/jpeg",
          sampleCount: 1,
          personGeneration: "ALLOW_ADULT",
          aspectRatio: "16:9"
        }
      };

      const endpoint = `${this.baseUrl}/${this.modelId}:predict?key=${this.apiKey}`;
      
      console.log('Making request to:', endpoint.replace(this.apiKey, 'HIDDEN_KEY'));
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text (first 500 chars):', responseText.substring(0, 500));

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }
        
        if (response.status === 403) {
          throw new Error('API key does not have access to image generation. Please check your Google AI Studio permissions.');
        }
        
        if (response.status === 400) {
          throw new Error('Invalid request format. Please check the prompt and try again.');
        }
        
        if (response.status === 404) {
          throw new Error('Imagen model not found. Please check if the Imagen 4.0 model is available.');
        }
        
        throw new Error(`Google Imagen API error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid JSON response from Imagen API');
      }
      
      console.log('Parsed response structure:', JSON.stringify(data, null, 2));
      
      // Use the exact response format from the bash script
      if (!data.predictions || !data.predictions[0]) {
        console.error('Invalid Imagen response structure:', data);
        throw new Error('No predictions in response. Response structure: ' + JSON.stringify(data));
      }

      const prediction = data.predictions[0];
      
      if (!prediction.bytesBase64Encoded) {
        console.error('No bytesBase64Encoded in prediction:', prediction);
        throw new Error('No image data received from API. Prediction structure: ' + JSON.stringify(prediction));
      }
      
      return {
        imageUrl: `data:image/jpeg;base64,${prediction.bytesBase64Encoded}`,
        prompt,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Imagen generation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate image');
    }
  }

  private buildImagePrompt(request: ImageGenerationRequest): string {
    if (request.customPrompt && !request.useSmartPrompt) {
      return this.enhanceCustomPrompt(request.customPrompt);
    }

    // Build smart prompt from analysis and blog data
    const { blogGeneration, sourceAnalysis } = request;
    
    let prompt = `Professional blog header image for: "${blogGeneration.title}"`;
    
    // Add keywords from analysis if available
    if (sourceAnalysis?.seoKeywords && sourceAnalysis.seoKeywords.length > 0) {
      const topKeywords = sourceAnalysis.seoKeywords.slice(0, 3).join(', ');
      prompt += `. Visual elements related to: ${topKeywords}`;
    }

    // Add themes if available
    if (sourceAnalysis?.mainThemes && sourceAnalysis.mainThemes.length > 0) {
      const topThemes = sourceAnalysis.mainThemes.slice(0, 2).join(', ');
      prompt += `. Themed around: ${topThemes}`;
    }

    // Add style and quality modifiers
    prompt += '. Modern, clean, professional design. High-quality, visually appealing. 16:9 aspect ratio. Suitable for web blog header. No text overlay needed.';

    // Add current trends context if available
    if (sourceAnalysis?.currentTrends && sourceAnalysis.currentTrends.length > 0) {
      const trend = sourceAnalysis.currentTrends[0];
      prompt += ` Contemporary style reflecting: ${trend}`;
    }

    return prompt;
  }

  private enhanceCustomPrompt(customPrompt: string): string {
    // Add quality and format enhancements to custom prompts
    let enhanced = customPrompt.trim();
    
    // Add quality modifiers if not present
    if (!enhanced.toLowerCase().includes('high quality') && !enhanced.toLowerCase().includes('professional')) {
      enhanced += '. High-quality, professional';
    }
    
    // Add format if not specified
    if (!enhanced.toLowerCase().includes('16:9') && !enhanced.toLowerCase().includes('aspect ratio')) {
      enhanced += '. 16:9 aspect ratio';
    }
    
    // Add web suitability
    if (!enhanced.toLowerCase().includes('web') && !enhanced.toLowerCase().includes('blog')) {
      enhanced += '. Suitable for web blog header';
    }

    return enhanced;
  }

  private generatePlaceholderImage(prompt: string): ImageGenerationResponse {
    // Generate a placeholder image using a service like placeholder.com or unsplash
    const width = 800;
    const height = 450; // 16:9 aspect ratio
    
    // Create a simple placeholder URL - you could also use Unsplash API here
    const placeholderUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
    
    return {
      imageUrl: placeholderUrl,
      prompt,
      timestamp: new Date().toISOString()
    };
  }

  buildSmartPromptPreview(request: Omit<ImageGenerationRequest, 'customPrompt'>): string {
    return this.buildImagePrompt({ ...request, useSmartPrompt: true });
  }
}

export const imagenService = new ImagenService();