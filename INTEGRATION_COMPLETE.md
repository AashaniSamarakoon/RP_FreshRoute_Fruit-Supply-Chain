# FreshRoute Complete Integration Checklist ✅

## 📋 Prerequisites Complete

- [x] **Frontend Created**: React Native + Expo with farmer routes
- [x] **Backend Created**: Node.js + Express.js on port 4000
- [x] **Database Schema**: Supabase PostgreSQL with all tables
- [x] **i18n Setup**: English + Sinhala translations
- [x] **Authentication**: JWT tokens with role-based access control
- [x] **API Endpoints**: All 12+ farmer endpoints implemented
- [x] **Fruit Images**: 3 fruits with high-quality Unsplash images
- [x] **Database Migrations**: Ready for production deployment

---

## 🔧 Integration Setup (Required)

### Phase 1: Configure Backend URL

**File to Update**: [config.js](config.js)

```javascript
// ✏️ Change this line based on your setup:
export const BACKEND_URL = "http://localhost:4000";
```

**Choose one:**
- Local (same machine): `http://localhost:4000`
- Network (different machines): `http://192.168.1.XX:4000` (use your IP)
- Production: `https://api.yourdomain.com`

**Find your IP**:
```bash
# Windows: ipconfig
# Mac/Linux: ifconfig
# Look for IPv4 Address (usually 192.168.x.x or 10.0.x.x)
```

### Phase 2: Start Backend Server

```bash
cd RP_FreshRoute_Backend
npm start
```

✅ Should show:
```
FreshRoute backend running on port 4000
✓ SMS scheduler started: runs daily at 6:00 Asia/Colombo
[Dambulla Scheduler] Started - runs daily at 6:00 AM (Asia/Colombo)
✓ All schedulers started
```

### Phase 3: Apply Database Migrations

**In Supabase SQL Editor**, run:

```sql
-- Copy and paste from:
-- migrations/001_add_economic_center_tables.sql
```

This creates:
- ✅ `fruits` table (with image_url)
- ✅ `markets` table
- ✅ `economic_center_prices` table
- ✅ `scraping_jobs` table
- ✅ Auto-inserts Mango, Banana, Pineapple with images

### Phase 4: Insert Fruit Prices

```bash
cd RP_FreshRoute_Backend
node scripts/insert-prices.js
```

Output should show:
```
✅ Fruit Mango with image ready
✅ Fruit Banana with image ready
✅ Fruit Pineapple with image ready
✅ Successfully inserted 3 prices!
```

### Phase 5: Test Integration

```bash
node scripts/test-integration.js
```

Expected output:
```
✅ POST /auth/signup
✅ GET /farmer/dashboard
✅ GET /farmer/live-market
✅ GET /farmer/prices/daily-v2
✅ GET /farmer/forecast/7day?fruit=Mango
✅ GET /farmer/accuracy
... (all endpoints should show ✅)
```

---

## 📱 Frontend App Testing

### Start Frontend

```bash
npm start
# Expo will show options: i (iOS), a (Android), w (web)
```

### Test User Flow

1. **Signup Screen** (`app/signup.tsx`)
   - Enter: Name, Email, Password
   - Select: "Farmer" role
   - Should call: `POST /api/auth/signup`
   - ✅ Token saved to AsyncStorage

2. **Login Screen** (`app/login.tsx`)
   - Enter: Email, Password
   - Should call: `POST /api/auth/login`
   - ✅ Redirects to Farmer Dashboard

3. **Farmer Dashboard** (`app/farmer/index.tsx`)
   - Should call: `GET /api/farmer/dashboard`
   - Shows: Upcoming pickups, stats

4. **Live Market Screen** (`app/farmer/live-market.tsx`)
   - Should call: `GET /api/farmer/live-market`
   - Shows: 3 fruits with images from Dambulla prices
   - Displays: Price, status (High/Medium/Low)

5. **Daily Prices Screen** (`app/farmer/daily-prices.tsx`)
   - Should call: `GET /api/farmer/prices/daily-v2`
   - Shows: All fruits with real images from DB

6. **7-Day Forecast** (`app/farmer/forecast.tsx`)
   - Should call: `GET /api/farmer/forecast/7day?fruit=Mango`
   - Shows: 7 days of forecast data

7. **Accuracy Insights** (`app/farmer/accuracy-insights.tsx`)
   - Should call: `GET /api/farmer/accuracy`
   - Shows: Overall accuracy percentage

---

## ✨ Frontend Screens Status

| Screen | File | Backend Call | Images | Status |
|--------|------|--------------|--------|--------|
| Dashboard | `farmer/index.tsx` | `/api/farmer/dashboard` | N/A | ✅ |
| Live Market | `farmer/live-market.tsx` | `/api/farmer/live-market` | ✅ Dynamic | ✅ |
| Daily Prices | `farmer/daily-prices.tsx` | `/api/farmer/prices/daily-v2` | ✅ Dynamic | ✅ |
| 7-Day Forecast | `farmer/forecast.tsx` | `/api/farmer/forecast/7day` | N/A | ✅ |
| Accuracy Insights | `farmer/accuracy-insights.tsx` | `/api/farmer/accuracy` | N/A | ✅ |
| Fruit Forecast | `farmer/fruit-forecast.tsx` | `/api/farmer/forecast/fruit` | N/A | ✅ |
| Notifications | `farmer/notifications.tsx` | `/api/farmer/notifications` | N/A | ✅ |
| Feedback | `farmer/feedback.tsx` | `/api/farmer/feedback` | N/A | ✅ |
| Profile | `farmer/profile.tsx` | Existing | N/A | ✅ |

---

## 🎯 Data Integration Summary

### Fruit Data Flow

```
Backend Database (Supabase)
    ↓
fruits table (id, name, variety, unit, image_url)
    ↓
POST /api/farmer/prices/daily-v2
    ↓
Frontend Response:
{
  "fruits": [
    {
      "name": "Mango",
      "image": "https://images.unsplash.com/...",
      "price": "Rs. 180.00",
      "status": "High Demand"
    }
  ]
}
    ↓
Frontend Displays Images & Prices
```

### Price Data Flow

```
Dambulla Website (https://dambulladec.com)
    ↓
Backend Scraper (cheerio) OR Manual Insert
    ↓
economic_center_prices table
    ↓
GET /api/farmer/live-market
    ↓
Frontend Renders Live Prices
```

---

## 🔒 Security Features

- [x] JWT token authentication
- [x] Password hashing with bcryptjs
- [x] Role-based access control (farmer/transporter/admin)
- [x] Token storage in AsyncStorage (secure in native apps)
- [x] CORS enabled on backend
- [x] Request validation on all endpoints

---

## 🚀 Deployment Checklist

### Before Going Live

- [ ] Change `config.js` BACKEND_URL to production domain
- [ ] Update `.env` in backend with production credentials
- [ ] Set up SSL/HTTPS certificate
- [ ] Enable rate limiting on API
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Test all endpoints in production
- [ ] Set up error logging/monitoring
- [ ] Configure email notifications
- [ ] Test on actual iOS/Android devices
- [ ] Submit to App Store/Play Store

### Production Config Template

```javascript
// config.js
export const BACKEND_URL = "https://api.freshroute.com";
```

```bash
# .env (Backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET=your-super-secret-key
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
NODE_ENV=production
```

---

## 🐛 Troubleshooting

### Issue: "Cannot reach backend"
```bash
# 1. Check backend is running
# Should see "running on port 4000"

# 2. Check correct URL in config.js
# Use localhost OR your machine IP

# 3. Check firewall
# Port 4000 should be accessible

# 4. Check CORS
# Header should be: Authorization: Bearer <token>
```

### Issue: "Unauthorized (401)"
```bash
# 1. Verify token saved to AsyncStorage
# Check browser DevTools > Storage > AsyncStorage

# 2. Verify header format
# Should be: "Bearer <token>" not just "<token>"

# 3. Verify user role
# Database users table should have role='farmer'
```

### Issue: "No data displaying"
```bash
# 1. Check migrations ran
# Supabase > SQL Editor > Run migrations/001_add_economic_center_tables.sql

# 2. Check prices inserted
# Run: node scripts/insert-prices.js

# 3. Check database query
# Supabase > Browser > economic_center_prices table
# Should have 3 rows for Mango, Banana, Pineapple

# 4. Check API response
# Browser DevTools > Network tab
# Should see status 200 with data
```

---

## 📞 Support Resources

- **Frontend Issues**: Check [app](app/) folder structure
- **Backend Issues**: Check [RP_FreshRoute_Backend/SETUP.md](RP_FreshRoute_Backend/SETUP.md)
- **Integration Guide**: [BACKEND_FRONTEND_INTEGRATION.md](BACKEND_FRONTEND_INTEGRATION.md)
- **API Documentation**: [RP_FreshRoute_Backend/SETUP.md](RP_FreshRoute_Backend/SETUP.md)
- **Database Schema**: [RP_FreshRoute_Backend/migrations/001_add_economic_center_tables.sql](RP_FreshRoute_Backend/migrations/001_add_economic_center_tables.sql)

---

## ✅ Final Verification

Run this checklist after integration:

- [ ] Backend starts without errors: `npm start` in RP_FreshRoute_Backend
- [ ] Frontend starts: `npm start` in root
- [ ] Can signup a new farmer account
- [ ] Can login with created account
- [ ] Dashboard loads with no errors
- [ ] Live Market shows 3 fruits with images
- [ ] Daily Prices shows real prices from DB
- [ ] Forecast data displays correctly
- [ ] Accuracy metrics show reasonable numbers
- [ ] All screens have proper translations (en/si)
- [ ] No console errors in browser DevTools
- [ ] No errors in backend terminal logs

---

## 🎉 You're Ready!

Once all checkboxes are complete, your FreshRoute application is **fully integrated and ready for use**!

Next steps:
1. Test on real devices
2. Gather user feedback
3. Deploy to production
4. Monitor application performance

**Happy coding! 🚀**
