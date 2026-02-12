# Joseph's Week in Review - Frontend

A React dashboard for visualizing your week's activities, mood, and screen time.

## Quick Start

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## What's Complete

- ✅ Time grid (7 days × 48 slots, colored by category)
- ✅ Hover tooltips showing activity, time, mood
- ✅ Screen time bar chart (total vs unproductive)
- ✅ Average mood widget (auto-calculated)
- ✅ Chat UI with input, messages, loading state
- ✅ Category legend
- ✅ Dark theme matching Figma design

---

## What YOU Need To Do

### 1. Replace Placeholder Data

In `src/App.jsx`, find and replace:

**Activity Data (~line 4-25):**
```javascript
const weekData = {
  "2025-02-04": [
    { activity: "Sleep", mood: 8, category: "Sleep" },
    // ... 48 slots per day
  ],
  // ... 7 days
}
```

**Screen Time Data (~line 45):**
```javascript
const screenTimeData = [
  { day: "T", total: 4.2, unproductive: 1.5 },
  { day: "W", total: 3.8, unproductive: 1.2 },
  // ... 7 days from Opal
]
```

### 2. Wire Up the Chatbot to Your FastAPI Backend

In `src/App.jsx`, find the `handleChatSubmit` function (~line 95).

Replace the `setTimeout` placeholder with a real API call:

```javascript
const handleChatSubmit = async (e) => {
  e.preventDefault()
  if (!chatInput.trim() || isLoading) return

  const userMessage = chatInput.trim()
  setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
  setChatInput("")
  setIsLoading(true)

  try {
    const response = await fetch('YOUR_FASTAPI_URL/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: userMessage,
        context: weekData  // Send your week data for context
      })
    })
    const data = await response.json()
    setChatMessages(prev => [...prev, { 
      role: 'assistant', 
      content: data.response 
    }])
  } catch (error) {
    setChatMessages(prev => [...prev, { 
      role: 'assistant', 
      content: 'Sorry, something went wrong.' 
    }])
  } finally {
    setIsLoading(false)
  }
}
```

### 3. Create FastAPI Chat Endpoint

In your FastAPI backend, add:

```python
from fastapi import FastAPI
from pydantic import BaseModel
from groq import Groq
import os

app = FastAPI()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class ChatRequest(BaseModel):
    message: str
    context: dict  # Your week data

@app.post("/chat")
async def chat(request: ChatRequest):
    system_prompt = f"""You are analyzing the user's week. Here's their activity data:
{request.context}

Answer questions about their activities, mood patterns, and habits. Be concise and insightful."""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.message}
        ]
    )
    
    return {"response": response.choices[0].message.content}
```

Add to your `.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

Install Groq:
```bash
pip install groq
```

### 4. Handle CORS (if frontend and backend are on different ports)

In your FastAPI backend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 5. Export Your Data from PostgreSQL

Run this script to get your data as JSON:

```python
import psycopg2
import json
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def get_slot_index(timestamp_str):
    """Convert timestamp to slot index (0-47)"""
    dt = datetime.fromisoformat(timestamp_str)
    total_minutes = dt.hour * 60 + dt.minute
    slot = round(total_minutes / 30)
    return min(slot, 47)

def export_week_data():
    connection = psycopg2.connect(os.getenv("DATABASE_PUBLIC_URL"))
    cursor = connection.cursor()
    cursor.execute("""
        SELECT activity_id, activity, mood, timestamp, category 
        FROM activities 
        ORDER BY timestamp
    """)
    rows = cursor.fetchall()
    connection.close()
    
    # Group by date
    days_data = {}
    for row in rows:
        activity_id, activity, mood, timestamp, category = row
        date = timestamp[:10]  # Get YYYY-MM-DD
        if date not in days_data:
            days_data[date] = []
        days_data[date].append((timestamp, activity, mood, category or "Other"))
    
    # Build 48-slot arrays for each day
    week_data = {}
    for date, entries in days_data.items():
        slots = [None] * 48
        entries = sorted(entries, key=lambda x: x[0])
        
        for i, (timestamp, activity, mood, category) in enumerate(entries):
            start_slot = get_slot_index(timestamp)
            if i + 1 < len(entries):
                end_slot = get_slot_index(entries[i + 1][0])
            else:
                end_slot = 48
            
            for s in range(start_slot, end_slot):
                if s < 48:
                    slots[s] = {
                        "activity": activity,
                        "mood": mood,
                        "category": category
                    }
        
        week_data[date] = slots
    
    print(json.dumps(week_data, indent=2))

if __name__ == "__main__":
    export_week_data()
```

Copy the output and paste it into `src/App.jsx` as your `weekData`.

---

## PDF Export

Option A: Just use browser print (Cmd/Ctrl + P → Save as PDF)

Option B: Add a button that triggers `window.print()`

---

## Project Structure

```
time-tracker-frontend/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx      ← Main component (edit data here)
│   └── App.css      ← Styles
└── README.md
```

---

## Category Colors

Edit in `src/App.jsx` if you want different colors:

```javascript
const categoryColors = {
  "Sleep": "#6366f1",
  "Self-care": "#8b5cf6", 
  "Meals": "#f59e0b",
  "Work": "#10b981",
  "Exercise": "#ef4444",
  "Leisure": "#3b82f6",
  "Social": "#ec4899",
  "Other": "#6b7280"
}
```
