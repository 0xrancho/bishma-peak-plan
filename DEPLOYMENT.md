# Bishma OS - Vercel Deployment Guide

## 🚀 Quick Deploy

### Prerequisites
- GitHub repository pushed
- Vercel account created
- API keys ready (OpenAI, Airtable)

---

## Step 1: Configure Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables

Add these **3 required variables**:

```
VITE_OPENAI_API_KEY=sk-proj-...
VITE_AIRTABLE_API_KEY=patNCEp...
VITE_AIRTABLE_BASE_ID=appmKIm...
```

**Important:**
- Make sure each is set for **Production**, **Preview**, and **Development** environments
- Click "Save" after each variable
- Never commit these to git (already in .gitignore)

---

## Step 2: Deploy via Vercel Dashboard

### Option A: Import from GitHub (Recommended)

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository: `rancho/Bishma`
4. Framework Preset: **Vite** (auto-detected)
5. Build Command: `npm run build` (auto-detected)
6. Output Directory: `dist` (auto-detected)
7. Click **Deploy**

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

---

## Step 3: Verify Deployment

### Check Console Logs on Load

Open your deployed site and check browser console for:

```
🚀 Bishma OS starting...
Environment: production
✅ Environment variable loaded: VITE_OPENAI_API_KEY (sk-proj-L0...)
✅ Environment variable loaded: VITE_AIRTABLE_API_KEY (patNCEpRvb...)
✅ Environment variable loaded: VITE_AIRTABLE_BASE_ID (appmKImLRj...)
✅ All environment variables loaded successfully
```

**If you see missing variables:**
- Go back to Vercel Environment Variables
- Make sure they're set for **Production**
- Redeploy the site

### Test Core Functionality

- [ ] Dashboard loads with your Airtable data
- [ ] Refresh button works
- [ ] Chat responds to messages
- [ ] Tasks write to Airtable
- [ ] No CORS errors in console

---

## Troubleshooting

### Issue: Blank page on load

**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Verify environment variables are set
4. Check Network tab for failed API calls

### Issue: "Airtable credentials not configured"

**Solution:**
1. Verify `VITE_AIRTABLE_API_KEY` is set in Vercel
2. Verify `VITE_AIRTABLE_BASE_ID` is set in Vercel
3. Redeploy after adding variables
4. Hard refresh browser (Ctrl+Shift+R)

### Issue: OpenAI not responding

**Solution:**
1. Check `VITE_OPENAI_API_KEY` is set
2. Verify API key is valid in OpenAI dashboard
3. Check Vercel function logs for errors

### Issue: 404 on page refresh

**Solution:**
- Already handled by `vercel.json` rewrites
- If still occurring, check `vercel.json` is deployed

---

## Error Monitoring

### Check Vercel Logs

```bash
# Real-time logs
vercel logs

# Specific deployment
vercel logs [deployment-url]
```

### Browser Console Logs

All errors are logged with detailed information:
- ❌ Error type and message
- 📋 Stack trace
- ⏰ Timestamp
- 🔍 Context (user input, API calls, etc.)

---

## Security Checklist

✅ Environment variables never exposed in client code
✅ API keys stored in Vercel secrets only
✅ `.env` file in `.gitignore`
✅ Security headers configured in `vercel.json`
✅ Startup validation checks env vars are loaded

---

## Performance & Monitoring

### Vercel Analytics (Built-in)
- Available in Vercel Dashboard → Analytics
- Shows page views, load times, errors

### Custom Logging
All critical operations log to console:
- 🚀 App startup
- 🔑 Credential checks
- 📡 API calls
- ✅/❌ Success/failure states

---

## Post-Deployment

### Update API Keys (Security Best Practice)

After successful deployment, consider rotating your API keys:

1. **OpenAI**: Generate new key at https://platform.openai.com/api-keys
2. **Airtable**: Generate new PAT at https://airtable.com/create/tokens
3. Update in Vercel Environment Variables
4. Redeploy

### Custom Domain (Optional)

1. Go to Vercel Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL automatically provisioned

---

## Deployment Status

Current deployment: **Ready for production**

Files configured:
- ✅ `vercel.json` - Rewrites, headers, caching
- ✅ `src/utils/envCheck.ts` - Environment validation
- ✅ Error logging in all services
- ✅ Security headers configured
- ✅ CORS handled (APIs called client-side)

---

## Support

If deployment issues persist:
1. Check Vercel deployment logs
2. Verify all 3 env vars are set
3. Test build locally: `npm run build && npm run preview`
4. Review browser console for specific errors
