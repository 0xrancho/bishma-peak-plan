#!/usr/bin/env node
// Test Airtable record creation with correct schema
import { readFileSync } from 'fs';

// Load .env file
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

const apiKey = envVars.VITE_AIRTABLE_API_KEY;
const baseId = envVars.VITE_AIRTABLE_BASE_ID;
const tasksTableId = 'tblgA4jVOsYj0h76k';

// Test with corrected payload matching your schema
async function testCorrectedRecord() {
  console.log('🧪 Testing corrected record creation...');

  // Test record matching your exact field schema
  const testRecord = {
    fields: {
      // Core RICE fields - these should work now
      description: 'Test ceiling repair from API',
      reach: 20,
      impact: 6,
      confidence: 80, // Using percentage as integer
      effort: 120,

      // Status and categorization
      status: 'pending',
      category: 'personal',

      // Additional fields
      project: 'Home improvements',
      extraction_confidence: 'explicit'
    }
  };

  console.log('📤 Sending corrected payload:', JSON.stringify(testRecord, null, 2));

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tasksTableId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRecord)
      }
    );

    const responseText = await response.text();
    console.log('📥 Response status:', response.status);
    console.log('📥 Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Record created with ID:', data.id);
      console.log('🔗 Check your record at: https://airtable.com/' + baseId + '/' + tasksTableId);
      return data.id;
    } else {
      console.log('❌ Creation failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return null;
  }
}

testCorrectedRecord();