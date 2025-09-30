// Run this during Vercel build to see what env vars are available
console.log('=== Environment Variables Debug ===');
console.log('All env vars starting with VITE_:');

Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .forEach(key => {
    const value = process.env[key];
    console.log(`${key}: ${value ? value.substring(0, 20) + '...' : 'UNDEFINED'}`);
  });

console.log('\nSpecific checks:');
console.log('VITE_OPENAI_API_KEY:', process.env.VITE_OPENAI_API_KEY ? '✅ SET' : '❌ MISSING');
console.log('VITE_AIRTABLE_API_KEY:', process.env.VITE_AIRTABLE_API_KEY ? '✅ SET' : '❌ MISSING');
console.log('VITE_AIRTABLE_BASE_ID:', process.env.VITE_AIRTABLE_BASE_ID ? '✅ SET' : '❌ MISSING');
