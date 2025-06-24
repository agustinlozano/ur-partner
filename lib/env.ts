export const enviroment = process.env.NODE_ENV;

// Lambda upload configuration
export const LAMBDA_UPLOAD_ENDPOINT =
  process.env.NEXT_PUBLIC_LAMBDA_UPLOAD_ENDPOINT;
export const USE_LAMBDA_UPLOAD = false; // Now we use API route as proxy

// Rate limiting configuration
export const RATE_LIMIT_ENDPOINT = process.env.LAMBDA_RATE_LIMIT_ENDPOINT;
