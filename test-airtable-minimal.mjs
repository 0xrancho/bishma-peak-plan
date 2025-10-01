#!/usr/bin/env node
// Test minimal Airtable record creation
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

// Test with minimal fields that exist
async function testMinimalRecord() {
  console.log('🧪 Testing minimal record creation...');

  const testRecord = {
    fields: {
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: 'home'
    }
  };

  console.log('📤 Sending minimal payload:', JSON.stringify(testRecord, null, 2));

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
      console.log('✅ Minimal record created with ID:', data.id);
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

testMinimalRecord();