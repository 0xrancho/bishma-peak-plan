// Quick test script to verify API keys are working
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
const envPath = join(__dirname, '.env');
const envFile = readFileSync(envPath, 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

console.log('🔧 Testing Bishma OS API Configuration...\n');

// Test OpenAI API
async function testOpenAI() {
  console.log('1️⃣  Testing OpenAI API...');
  const apiKey = envVars.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.log('   ❌ OpenAI API key not found');
    return false;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      console.log('   ✅ OpenAI API key is valid');
      return true;
    } else {
      console.log('   ❌ OpenAI API key is invalid:', response.status);
      return false;
    }
  } catch (error) {
    console.log('   ❌ OpenAI API connection failed:', error.message);
    return false;
  }
}

// Test Airtable API
async function testAirtable() {
  console.log('\n2️⃣  Testing Airtable API...');
  const apiKey = envVars.VITE_AIRTABLE_API_KEY;
  const baseId = envVars.VITE_AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    console.log('   ❌ Airtable API key or Base ID not found');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/tblgA4jVOsYj0h76k?maxRecords=1`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (response.ok) {
      console.log('   ✅ Airtable API key and Base ID are valid');
      console.log('   ✅ Tasks table (tblgA4jVOsYj0h76k) is accessible');
      return true;
    } else {
      console.log('   ❌ Airtable API error:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Airtable API connection failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const openaiOk = await testOpenAI();
  const airtableOk = await testAirtable();

  console.log('\n' + '='.repeat(50));
  if (openaiOk && airtableOk) {
    console.log('✅ All APIs configured correctly!');
    console.log('🚀 You can now use Bishma OS at http://localhost:8080');
  } else {
    console.log('⚠️  Some APIs need configuration');
    console.log('Please check your .env file');
  }
  console.log('='.repeat(50));
}

runTests();