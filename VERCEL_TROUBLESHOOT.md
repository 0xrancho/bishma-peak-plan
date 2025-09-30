# Vercel Environment Variable Troubleshooting

## Issue: VITE_AIRTABLE_API_KEY not loading in production

### Check #1: Verify Variable Name in Vercel

Go to Vercel → Settings → Environment Variables

The variable name must be **EXACTLY**:
```
VITE_AIRTABLE_API_KEY
```

**Common mistakes:**
- ❌ `VITE_AIRTABLE_KEY` (missing `_API`)
- ❌ `AIRTABLE_API_KEY` (missing `VITE_` prefix)
- ❌ Extra spaces before/after the name
- ❌ Wrong case (must be all caps)

### Check #2: Verify It's Set for Production

Click the **Edit** button next to `VITE_AIRTABLE_API_KEY` and verify:
- ✅ Production checkbox is CHECKED
- ✅ Value is correct (starts with `pat`)

### Check #3: Delete and Re-add the Variable

Sometimes Vercel has caching issues:

1. **Delete** the `VITE_AIRTABLE_API_KEY` variable
2. Wait 10 seconds
3. **Add it again** with exact name: `VITE_AIRTABLE_API_KEY`
4. Value: `[Your Airtable PAT - starts with 'pat']`
5. Check **Production**, **Preview**, **Development**
6. Click **Save**
7. Redeploy (don't use cache)

### Check #4: View Build Logs

After deploying with the `check-env.js` script:

1. Go to Vercel → Deployments → Your latest deployment
2. Click **View Build Logs**
3. Look for the section that says `=== Environment Variables Debug ===`
4. It will show exactly which variables are available during build

You should see:
```
VITE_OPENAI_API_KEY: sk-proj-... ✅ SET
VITE_AIRTABLE_API_KEY: pat... ✅ SET
VITE_AIRTABLE_BASE_ID: app... ✅ SET
```

If `VITE_AIRTABLE_API_KEY` shows `❌ MISSING`, the variable is not configured correctly in Vercel.

### Workaround: Use API Key Config in UI

If the environment variable continues to fail:

1. Open your deployed site
2. Look for the settings/config icon (should be in the UI)
3. Manually enter the Airtable API key there
4. It will be saved to localStorage and work

### Still Not Working?

Send me a screenshot of:
1. Vercel Environment Variables page showing all 3 variables
2. The build logs showing the env check output
