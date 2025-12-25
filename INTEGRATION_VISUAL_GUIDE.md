# 🎯 Backend-Frontend Connection: Quick Visual Guide

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (React Native + Expo)                 │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Signup   │  │  Login   │  │ Dashboard│  │ Live Market  │   │
│  │ Screen   │→ │  Screen  │→ │  Screen  │→ │    Screen    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│       ↓              ↓             ↓              ↓             │
│     POST        POST/GET         GET             GET            │
│  /auth/signup  /auth/login  /farmer/home  /farmer/live-market  │
└──────────┬──────────┬──────────────┬──────────────┬──────────┘
           │          │              │              │
           ↓          ↓              ↓              ↓
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                     │
│                    Running on port 4000                           │
│                                                                  │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────┐   │
│  │ Auth Module │    │ Farmer Controller │    │  Database   │   │
│  │ JWT tokens  │→→→ │ 12+ endpoints    │→→→ │ (Supabase)  │   │
│  │ Validation  │    │ Data processing  │    │ PostgreSQL  │   │
│  └─────────────┘    └──────────────────┘    └─────────────┘   │
│                                                    ↑↓            │
│                                         ┌──────────────────┐   │
│                                         │  Tables:         │   │
│                                         │  • fruits        │   │
│                                         │  • prices        │   │
│                                         │  • users         │   │
│                                         │  • notifications │   │
│                                         └──────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
           ↑                                         ↑
           └─────────────────────────────────────────┘
                   Response with Data
```

---

## 📱 Screen → API Mapping

```
FRONTEND SCREENS              API ENDPOINTS              DATABASE
═════════════════════════════════════════════════════════════════

Signup/Login Screen          /api/auth/signup          users table
    ↓                        /api/auth/login              ↓
    └────────────→ [JWT Token Stored in AsyncStorage]

Farmer Dashboard             /api/farmer/dashboard      forecast_daily
    ↓                        /api/farmer/home           notifications

Live Market Prices           /api/farmer/live-market    economic_center_prices
    ↓                                                    fruits (with images)
    └─→ Shows: 🥭 Mango, 🍌 Banana, 🍍 Pineapple

Daily Prices                 /api/farmer/prices/daily-v2  fruits + prices

7-Day Forecast              /api/farmer/forecast/7day   forecast_daily

Accuracy Insights           /api/farmer/accuracy        forecast_daily
    ↓                                                   (historical data)

Notifications               /api/farmer/notifications   notifications

Feedback                    /api/farmer/feedback        feedback

Profile/Settings            /api/farmer/sms/preferences users table
```

---

## 🔑 Authentication Flow

```
USER ACTION                  FRONTEND                    BACKEND
═════════════════════════════════════════════════════════════════

1. Enter Email/Password      ┌─────────────────────────┐
   on Signup Screen          │ POST /api/auth/signup   │
   ↓                         │ {name, email, password} │
                             └────────────┬────────────┘
                                          ↓
                              ┌─────────────────────────┐
                              │ Hash password           │
                              │ Create user in DB       │
                              │ Generate JWT token      │
                              └────────────┬────────────┘
                                          ↓
                    ┌─────────────────────────────────────┐
                    │ RESPONSE: {token, user}             │
                    └────────┬──────────────────────────┘
                             ↓
                   ┌─────────────────────┐
                   │ AsyncStorage.save   │
                   │ token               │
                   └────────┬────────────┘
                            ↓
                   ┌─────────────────────┐
                   │ Navigate to         │
                   │ Farmer Dashboard    │
                   └─────────────────────┘

2. Next Request             ┌──────────────────────────┐
   (Any API call)           │ All requests include:    │
   ↓                        │ Header:                  │
                            │ Authorization:          │
                            │ Bearer <token>          │
                            └──────────────┬───────────┘
                                           ↓
                             ┌──────────────────────────┐
                             │ Backend validates token  │
                             │ Verifies user role       │
                             │ (farmer/admin/etc)      │
                             └──────────────┬───────────┘
                                            ↓
                              ┌──────────────────────────┐
                              │ ✅ If valid: Return data │
                              │ ❌ If invalid: 401 error │
                              └──────────────────────────┘
```

---

## 🍎 Fruit Image Data Flow

```
┌─────────────────────────────────────┐
│ Database (Supabase)                 │
│                                     │
│ fruits table:                       │
│ ┌───────────────────────────────┐  │
│ │ id: uuid                      │  │
│ │ name: "Mango"                 │  │
│ │ variety: "TJC"                │  │
│ │ image_url: "https://unsplash..│  │ ← HIGH-QUALITY IMAGES
│ │ created_at: timestamp         │  │
│ └───────────────────────────────┘  │
│                                     │
│ economic_center_prices table:       │
│ ┌───────────────────────────────┐  │
│ │ id: uuid                      │  │
│ │ fruit_id: references fruits.id│  │ ← LINKS TO FRUIT
│ │ fruit_name: "Mango"           │  │
│ │ price_per_unit: 180           │  │
│ │ captured_at: 2025-12-24       │  │
│ └───────────────────────────────┘  │
└───────────────────┬─────────────────┘
                    ↓
         GET /api/farmer/live-market
                    ↓
┌───────────────────────────────────────────┐
│ Backend Response:                         │
│ {                                         │
│   "location": "Dambulla...",             │
│   "lastUpdated": "2025-12-24T10:30:00Z", │
│   "fruits": [                             │
│     {                                     │
│       "name": "Mango",                   │
│       "emoji": "🥭",                     │
│       "image": "https://images.unsplash..│ ← REAL IMAGE URL
│       "price": "Rs. 180.00",             │
│       "unit": "/ kg",                    │
│       "status": "High"                   │
│     }                                     │
│   ]                                       │
│ }                                         │
└───────────────────┬───────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ Frontend Displays:    │
         │                      │
         │ 🥭 Mango             │
         │ [Real Image]         │
         │ Rs. 180.00 / kg      │
         │ Status: High 🔴      │
         └──────────────────────┘
```

---

## ⚙️ Setup & Configuration

```
STEP 1: Update Backend URL
────────────────────────────
File: config.js

export const BACKEND_URL = "http://localhost:4000";
                            └─ Change based on setup:
                               • localhost (same machine)
                               • 192.168.1.XX (network)
                               • https://domain.com (production)


STEP 2: Start Backend Server
─────────────────────────────
Terminal 1:
$ cd RP_FreshRoute_Backend
$ npm start
Output:
  ✓ Twilio SMS service initialized
  ✓ FreshRoute backend running on port 4000
  ✓ SMS scheduler started
  ✓ Dambulla Scheduler Started


STEP 3: Apply Database Migration
────────────────────────────────
Supabase SQL Editor:
Run: migrations/001_add_economic_center_tables.sql
Creates:
  ✓ fruits table (with image_url)
  ✓ economic_center_prices table
  ✓ scraping_jobs table
  ✓ Auto-inserts Mango, Banana, Pineapple


STEP 4: Insert Fruit Prices
───────────────────────────
Terminal 2:
$ node scripts/insert-prices.js
Output:
  ✅ Mango updated with image
  ✅ Banana updated with image
  ✅ Pineapple updated with image
  ✅ Successfully inserted 3 prices!


STEP 5: Start Frontend
─────────────────────
Terminal 3:
$ npm start
Choose: i (iOS), a (Android), w (web)
App starts and connects to backend!
```

---

## 🧪 Test Endpoints

```
CURL EXAMPLES (Test in Terminal)
═════════════════════════════════════════════════════════════════

1. Signup
─────────
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Farmer",
    "email": "farmer@test.com",
    "password": "Pass123!",
    "role": "farmer"
  }'

Response: {token, user}


2. Get Live Market Prices (Use token from signup)
──────────────────────────────────────────────────
curl -X GET http://localhost:4000/api/farmer/live-market \
  -H "Authorization: Bearer <token_from_above>"

Response: {location, lastUpdated, fruits: [...]}


3. Get Daily Prices
────────────────────
curl -X GET http://localhost:4000/api/farmer/prices/daily-v2 \
  -H "Authorization: Bearer <token>"

Response: {date, fruits: [with images]}


4. Get 7-Day Forecast
──────────────────────
curl -X GET "http://localhost:4000/api/farmer/forecast/7day?fruit=Mango" \
  -H "Authorization: Bearer <token>"

Response: {days: [{day, trend, value, unit}, ...]}
```

---

## 📊 Common Response Formats

```javascript
// Live Market Response
{
  "location": "Dambulla Dedicated Economic Centre",
  "lastUpdated": "2025-12-24T10:30:00Z",
  "fruits": [
    {
      "name": "Mango",
      "emoji": "🥭",
      "image": "https://images.unsplash.com/photo-1553279768...",
      "price": "Rs. 180.00",
      "unit": "/ kg",
      "status": "High",
      "statusColor": "#e8f4f0"
    }
  ]
}

// Daily Prices Response
{
  "date": "2025-12-24",
  "fruits": [
    {
      "name": "Mango",
      "variety": "TJC",
      "price": "Rs. 180.00",
      "unit": "/ kg",
      "status": "High Demand",
      "delta": "+3.2%",
      "deltaColor": "#16a34a",
      "image": "https://images.unsplash.com/photo-1553279768..."
    }
  ]
}

// 7-Day Forecast Response
{
  "fruit": "Mango",
  "days": [
    {
      "day": "Monday",
      "trend": "up",
      "value": 180,
      "unit": "LKR/kg"
    }
  ]
}
```

---

## ✅ Integration Verification Checklist

```
BEFORE GOING LIVE:

Frontend Configuration
□ config.js has correct BACKEND_URL
□ Can signup new farmer
□ Can login with farmer credentials
□ Token saves to AsyncStorage
□ Authorization header works

Backend Status  
□ npm start runs without errors
□ All 12+ endpoints accessible
□ Response format matches frontend expectations
□ Error handling works (401, 500, etc)

Database
□ Migrations applied
□ Fruits table has 3 fruits
□ Fruits have images (URLs not null)
□ Prices inserted for today
□ economic_center_prices has 3 rows

Frontend Screens
□ Dashboard loads (calls /api/farmer/dashboard)
□ Live Market shows 3 fruits with images
□ Daily Prices displays real prices from DB
□ 7-Day Forecast shows data
□ Accuracy Insights renders
□ All screens have Sinhala translations
□ No console errors
□ No network errors in DevTools

API Testing
□ run: node scripts/test-integration.js
□ All endpoints show ✅
□ No ❌ errors

Ready for Production!
```

---

**Integration Complete!** 🎉
Your FreshRoute backend and frontend are now connected and ready for use.
