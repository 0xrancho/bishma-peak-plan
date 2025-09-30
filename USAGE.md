# Bishma OS - Test 1 Usage Guide

## 🚀 Quick Start

Your system is now live at: **http://localhost:8080**

## ✅ API Status

- **OpenAI API**: ✅ Connected
- **Airtable API**: ✅ Connected
- **Base ID**: appmKImLRjuoy08lD
- **Tasks Table**: tblgA4jVOsYj0h76k

## 💬 How to Test RICE Extraction

### Example Conversation Flow

Start by describing tasks naturally in the chat interface:

**You**: "I need to prep for the board meeting and fix the API bug"

**Bishma**: Will track both tasks and start extracting parameters...

**You**: "The board meeting is Thursday with 12 attendees"

**Bishma**: Updates reach parameter for board meeting (12)

**You**: "The API bug is affecting 500 users - it's the payment processing"

**Bishma**: Updates reach (500) and impact (high) for API bug

**You**: "Should take about 2 hours to fix"

**Bishma**: Updates effort parameter (2 hours)

**You**: "I'm 80% confident in that estimate"

**Bishma**: Completes API bug task with all 4 RICE parameters and writes to Airtable!

## 📊 RICE Parameters

The system extracts these parameters through conversation:

- **Reach**: How many people/users affected (number)
- **Impact**: Scale of effect (1-10)
- **Confidence**: How sure you are (0.1-1.0)
- **Effort**: Time required in hours

## 🔄 Task States

Watch the progress indicators update as you provide information:
- Gray chips = missing parameters
- Green chips = captured parameters
- Progress bar shows completion %
- "Ready for Airtable" appears when all 4 parameters collected

## 🧪 Test Scenarios to Try

1. **Multiple Tasks**: Mention several tasks in one message
2. **Context Switching**: Jump between tasks mid-conversation
3. **Parameter Updates**: Correct estimates ("actually, make that 4 hours")
4. **Natural Language**: Use casual descriptions, not numbers
5. **Partial Information**: Provide parameters across multiple messages

## 🗄️ Airtable Verification

Check your Airtable base to see completed tasks appear:
1. Go to https://airtable.com/appmKImLRjuoy08lD/tblgA4jVOsYj0h76k
2. You'll see tasks with all RICE parameters and calculated scores
3. Tasks only appear once all 4 parameters are captured

## 🐛 Troubleshooting

If the conversation isn't working:

1. Check the browser console for errors (F12)
2. Verify API keys are loaded (check Network tab for 401 errors)
3. Try refreshing the page
4. Check Airtable permissions for your PAT

## 📝 Session Management

- Tasks persist in browser localStorage
- Session ID tracks your conversation
- Refresh page to start fresh
- Clear localStorage to reset completely

## 🎯 Success Criteria Met

✅ Agent maintains state across conversation turns
✅ Tracks parameter completeness per task
✅ Only writes to Airtable when all 4 parameters present
✅ Handles context switching between tasks
✅ Progressive UI shows extraction progress
✅ Conversation feels natural, not form-like

---

**Test 1 Complete!** Ready for Test 2: Daily Plan Generation