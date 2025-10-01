/**
 * Environment variable validation for production deployment
 * Checks that all required env vars are present and logs status
 */

export interface EnvCheckResult {
  isValid: boolean;
  missing: string[];
  present: string[];
}

export function checkEnvironmentVariables(): EnvCheckResult {
  const requiredVars = [
    'VITE_OPENAI_API_KEY',
    'VITE_AIRTABLE_API_KEY',
    'VITE_AIRTABLE_BASE_ID',
    'VITE_CLERK_PUBLISHABLE_KEY'
  ];

  const missing: string[] = [];
  const present: string[] = [];

  requiredVars.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value) {
      missing.push(varName);
      console.error(`❌ Missing required environment variable: ${varName}`);
    } else {
      present.push(varName);
      console.log(`✅ Environment variable loaded: ${varName} (${value.substring(0, 10)}...)`);
    }
  });

  const isValid = missing.length === 0;

  if (!isValid) {
    console.error('❌ Environment validation failed!');
    console.error('Missing variables:', missing);
    console.error('Make sure these are set in Vercel Environment Variables');
  } else {
    console.log('✅ All environment variables loaded successfully');
  }

  return {
    isValid,
    missing,
    present
  };
}

/**
 * Verify API keys are not accidentally exposed in client code
 * This will warn if keys are hardcoded anywhere
 */
export function verifyNoHardcodedKeys(): void {
  const currentCode = document.documentElement.innerHTML;

  // Check for common patterns that might indicate exposed keys
  const suspiciousPatterns = [
    /sk-proj-[A-Za-z0-9_-]{100,}/,  // OpenAI project key
    /sk-[A-Za-z0-9]{48}/,             // OpenAI legacy key
    /pat[A-Za-z0-9]{30,}/,            // Airtable PAT
    /app[A-Za-z0-9]{14}/              // Airtable Base ID
  ];

  suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(currentCode)) {
      console.warn(`⚠️ Potential API key pattern detected in client code (pattern ${index + 1})`);
      console.warn('This could be a security issue. Verify keys are loaded from env vars only.');
    }
  });
}
