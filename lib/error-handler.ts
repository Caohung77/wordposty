export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public service: string = 'unknown'
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class RateLimitError extends APIError {
  constructor(service: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${service}${retryAfter ? `. Retry after ${retryAfter}s` : ''}`, 429, service);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, field?: string) {
    super(`Validation error: ${message}${field ? ` (field: ${field})` : ''}`, 400, 'validation');
    this.name = 'ValidationError';
  }
}

export function handleAPIError(error: unknown, service: string): APIError {
  if (error instanceof APIError) {
    return error;
  }

  // Handle axios errors
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    
    if (status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      return new RateLimitError(service, retryAfter ? parseInt(retryAfter) : undefined);
    }
    
    return new APIError(`${service} API error: ${message}`, status, service);
  }

  // Handle network errors
  if (error.request) {
    return new APIError(`Network error connecting to ${service}`, 503, service);
  }

  // Handle other errors
  return new APIError(`Unexpected error in ${service}: ${error.message}`, 500, service);
}

export function logError(error: APIError, context?: Record<string, unknown>) {
  console.error(`[${error.service.toUpperCase()}] ${error.name}: ${error.message}`, {
    statusCode: error.statusCode,
    service: error.service,
    context,
    timestamp: new Date().toISOString()
  });
}

export interface ErrorResponse {
  error: {
    message: string;
    service: string;
    statusCode: number;
    timestamp: string;
  };
}

export function createErrorResponse(error: APIError): ErrorResponse {
  return {
    error: {
      message: error.message,
      service: error.service,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    }
  };
}