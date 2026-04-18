# Quick Setup Guide for AI Features

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

This installs the Google Generative AI package.

## Step 2: Get Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AI...`)

## Step 3: Configure Environment

Open `backend/.env` and replace the placeholder:

```env
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

## Step 4: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Step 5: Test the Features

1. Navigate to http://localhost:3000
2. Log in or register
3. Go to "Create Capsule"
4. Click "✨ Get AI Memory Prompts" - You should see 5 personalized suggestions
5. Fill in title and theme, then click "🤖 Enhance with AI" - You should see enhancement insights

## Troubleshooting

### Issue: "Failed to generate prompts"
**Solution:** 
- Check if your Gemini API key is correct
- Verify you have API access enabled
- Check backend console for error details

### Issue: AI buttons don't work
**Solution:**
- Make sure backend server is running on port 10000
- Check browser console for errors
- Verify you're logged in (AI features require authentication)

### Issue: Slow responses
**Solution:**
- This is normal - OpenAI API takes 2-5 seconds
- Loading states are shown during processing

## Cost Information

- Gemini 2.0 Flash is **FREE** for up to 1,500 requests per day
- No credit card required for API access
- Perfect for development and small-scale production

## What's Next?

Once everything works:
1. Explore different prompts by clicking "🔄 Generate New Ideas"
2. Try enhancing different types of content
3. Check the sentiment detection feature
4. Use the suggested tags and unlock dates

For detailed documentation, see `AI_FEATURES.md`
