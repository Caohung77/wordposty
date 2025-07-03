interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  service: string;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Default rate limit configurations
    this.configs.set('perplexity', {
      maxRequests: 20, // 20 requests per minute
      windowMs: 60 * 1000,
      service: 'perplexity'
    });

    this.configs.set('claude', {
      maxRequests: 50, // 50 requests per minute
      windowMs: 60 * 1000,
      service: 'claude'
    });

    this.configs.set('default', {
      maxRequests: 100,
      windowMs: 60 * 1000,
      service: 'default'
    });
  }

  setConfig(service: string, config: Partial<RateLimitConfig>) {
    const existing = this.configs.get(service) || this.configs.get('default')!;
    this.configs.set(service, { ...existing, ...config, service });
  }

  async checkLimit(service: string, identifier: string = 'default'): Promise<boolean> {
    const config = this.configs.get(service) || this.configs.get('default')!;
    const key = `${service}:${identifier}`;
    const now = Date.now();

    // Get or create request history for this key
    let requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    requests = requests.filter(req => now - req.timestamp < config.windowMs);

    // Check if we're at the limit
    if (requests.length >= config.maxRequests) {
      // Update the stored requests
      this.requests.set(key, requests);
      return false; // Rate limit exceeded
    }

    // Add current request
    requests.push({ timestamp: now, count: 1 });
    this.requests.set(key, requests);

    return true; // Request allowed
  }

  async waitForLimit(service: string, identifier: string = 'default'): Promise<void> {
    const config = this.configs.get(service) || this.configs.get('default')!;
    const key = `${service}:${identifier}`;
    
    while (!(await this.checkLimit(service, identifier))) {
      const requests = this.requests.get(key) || [];
      if (requests.length > 0) {
        const oldestRequest = requests[0];
        const waitTime = config.windowMs - (Date.now() - oldestRequest.timestamp);
        
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 1000)));
        }
      } else {
        // Fallback wait
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  getRemainingRequests(service: string, identifier: string = 'default'): number {
    const config = this.configs.get(service) || this.configs.get('default')!;
    const key = `${service}:${identifier}`;
    const now = Date.now();

    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(req => now - req.timestamp < config.windowMs);
    
    return Math.max(0, config.maxRequests - validRequests.length);
  }

  getResetTime(service: string, identifier: string = 'default'): number | null {
    const config = this.configs.get(service) || this.configs.get('default')!;
    const key = `${service}:${identifier}`;
    const requests = this.requests.get(key) || [];

    if (requests.length === 0) {
      return null;
    }

    const oldestRequest = requests[0];
    return oldestRequest.timestamp + config.windowMs;
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    
    for (const [key, requests] of this.requests.entries()) {
      const service = key.split(':')[0];
      const config = this.configs.get(service) || this.configs.get('default')!;
      
      const validRequests = requests.filter(req => now - req.timestamp < config.windowMs);
      
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Clean up every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

// Helper function for API routes
export async function withRateLimit<T>(
  service: string,
  identifier: string,
  operation: () => Promise<T>
): Promise<T> {
  const allowed = await rateLimiter.checkLimit(service, identifier);
  
  if (!allowed) {
    const resetTime = rateLimiter.getResetTime(service, identifier);
    const waitTime = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;
    
    throw new Error(`Rate limit exceeded for ${service}. Try again in ${waitTime} seconds.`);
  }

  return await operation();
}