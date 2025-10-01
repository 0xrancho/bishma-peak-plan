#!/usr/bin/env node
// Test Airtable record creation
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

console.log('🧪 Testing Airtable Record Creation...\n');

// First, let's see what fields exist in the table
async function getTableSchema() {
  console.log('1️⃣  Checking table schema...');
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tasksTableId}?maxRecords=1`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Table accessible');
      if (data.records.length > 0) {
        console.log('   📋 Existing fields:', Object.keys(data.records[0].fields));
      } else {
        console.log('   📋 No existing records to check field structure');
      }
      return data;
    } else {
      const error = await response.text();
      console.log('   ❌ Table access failed:', response.status, error);
      return null;
    }
  } catch (error) {
    console.log('   ❌ Connection failed:', error.message);
    return null;
  }
}

// Test creating a record
async function testRecordCreation() {
  console.log('\n2️⃣  Testing record creation...');

  const testRecord = {
    fields: {
      description: 'Test ceiling repair',
      reach: 20,
      impact: 6,
      confidence: 0.8,
      effort: 120,
      rice_score: 72,  // (20 * 6 * 0.8) / 120 * 100
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      session_id: 'test_session_123'
    }
  };

  console.log('   📤 Sending payload:', JSON.stringify(testRecord, null, 2));

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
    console.log('   📥 Response status:', response.status);
    console.log('   📥 Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('   ✅ Record created with ID:', data.id);
      return data.id;
    } else {
      console.log('   ❌ Creation failed');
      return null;
    }
  } catch (error) {
    console.log('   ❌ Request failed:', error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  await getTableSchema();
  const recordId = await testRecordCreation();

  console.log('\n' + '='.repeat(50));
  if (recordId) {
    console.log('✅ Airtable integration working!');
    console.log(`🔗 Check your table: https://airtable.com/${baseId}/${tasksTableId}`);
  } else {
    console.log('⚠️  Airtable integration needs debugging');
  }
  console.log('='.repeat(50));
}

runTests();