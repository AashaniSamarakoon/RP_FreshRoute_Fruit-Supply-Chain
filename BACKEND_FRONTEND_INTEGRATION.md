# Backend-Frontend Integration Guide

## Current Setup

### Backend
- **URL**: `http://localhost:4000` (local development)
- **Port**: 4000
- **Status**: Running with all farmer endpoints ready

### Frontend Configuration
- **File**: [`config.js`](config.js)
- **Current Backend URL**: `http://192.168.1.55:4000`

---

## 🔧 Configuration Steps

### Step 1: Update Backend URL in Frontend

Edit [`config.js`](../config.js):

```javascript
// For Local Development (same machine)
export const BACKEND_URL = "http://localhost:4000";

// For Network Development (different machines)
export const BACKEND_URL = "http://192.168.1.55:4000"; // Use your machine's IP

// For Production
export const BACKEND_URL = "https://api.freshroute.com";
```

**Find your machine IP**:
```bash
# Windows
ipconfig | findstr "IPv4"

# Mac/Linux
ifconfig | grep "inet "
```

### Step 2: Verify Backend is Running

```bash
cd RP_FreshRoute_Backend
npm start
# Should show: "FreshRoute backend running on port 4000"
```

### Step 3: Test Authentication

The frontend will automatically:
1. Sign up new farmers with email/password
2. Store JWT token in AsyncStorage
3. Send token with every API request in Authorization header

---

## 📡 API Endpoints Connected

### Authentication
- ✅ `POST /api/auth/signup` - Create farmer account
- ✅ `POST /api/auth/login` - Login farmer
- ✅ `GET /api/auth/me` - Get current user

### Farmer Routes (All Connected)
- ✅ `GET /api/farmer/dashboard` - Dashboard with stats
- ✅ `GET /api/farmer/home` - Home screen
- ✅ `GET /api/farmer/forecast` - Forecast data
- ✅ `GET /api/farmer/forecast/7day?fruit=Mango` - 7-day forecast
- ✅ `GET /api/farmer/forecast/fruit?fruit=Mango` - Fruit forecast
- ✅ `GET /api/farmer/live-market` - Live market prices (Dambulla)
- ✅ `GET /api/farmer/prices/daily-v2` - Daily prices with images
- ✅ `GET /api/farmer/accuracy` - Accuracy insights
- ✅ `GET /api/farmer/notifications` - Notifications list
- ✅ `PATCH /api/farmer/notifications/:id/read` - Mark notification read
- ✅ `GET /api/farmer/feedback` - Feedback list
- ✅ `POST /api/farmer/feedback` - Create feedback
- ✅ `GET /api/farmer/sms/preferences` - SMS settings
- ✅ `PATCH /api/farmer/sms/preferences` - Update SMS settings

---

## 🎯 Frontend Implementation

### Example: Live Market Prices Screen

```typescript
// app/farmer/live-market.tsx
import { BACKEND_URL } from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LiveMarketScreen() {
  const [prices, setPrices] = useState(null);

  useEffect(() => {
    const fetchPrices = async () => {
      const token = await AsyncStorage.getItem("token");
      
      const res = await fetch(`${BACKEND_URL}/api/farmer/live-market`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const data = await res.json();
      setPrices(data); // Has: location, lastUpdated, fruits[]
    };

    fetchPrices();
  }, []);

  // Data structure returned:
  // {
  //   "location": "Dambulla Dedicated Economic Centre",
  //   "lastUpdated": "2025-12-24T10:30:00Z",
  //   "fruits": [
  //     {
  //       "name": "Mango",
  //       "emoji": "🥭",
  //       "image": "https://images.unsplash.com/...",
  //       "price": "Rs. 180.00",
  //       "unit": "/ kg",
  //       "status": "High",
  //       "statusColor": "#e8f4f0"
  //     }
  //   ]
  // }
}
```

### Example: Daily Prices Screen

```typescript
// app/farmer/daily-prices.tsx

const res = await fetch(`${BACKEND_URL}/api/farmer/prices/daily-v2`, {
  headers: { Authorization: `Bearer ${token}` }
});

const data = await res.json();
// Returns:
// {
//   "date": "2025-12-24",
//   "fruits": [
//     {
//       "name": "Mango",
//       "variety": "TJC",
//       "price": "Rs. 180.00",
//       "unit": "/ kg",
//       "status": "High Demand",
//       "delta": "+3.2%",
//       "deltaColor": "#16a34a",
//       "image": "https://images.unsplash.com/..."
//     }
//   ]
// }
```

---

## 🔐 Authentication Flow

### First Time User (Signup)
```typescript
const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "John Farmer",
    email: "john@example.com",
    password: "SecurePass123!",
    role: "farmer"
  })
});

const { token, user } = await res.json();
await AsyncStorage.setItem("token", token);
```

### Returning User (Login)
```typescript
const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    password: "SecurePass123!"
  })
});

const { token, user } = await res.json();
await AsyncStorage.setItem("token", token);
```

---

## 📊 Data Integration Checklist

- [ ] **Step 1**: Update `config.js` with correct backend URL
- [ ] **Step 2**: Ensure backend is running on port 4000
- [ ] **Step 3**: Test signup/login from frontend
- [ ] **Step 4**: Run database migration to add fruit images
- [ ] **Step 5**: Run `node scripts/insert-prices.js` to add prices
- [ ] **Step 6**: Test `/api/farmer/live-market` endpoint
- [ ] **Step 7**: Test `/api/farmer/prices/daily-v2` endpoint
- [ ] **Step 8**: Verify fruit images display correctly
- [ ] **Step 9**: Test all other farmer endpoints

---

## ⚠️ Common Issues

### "Network request failed"
- Check backend is running: `npm start` in RP_FreshRoute_Backend
- Check firewall allows port 4000
- If on different machines, use actual IP instead of localhost

### "Unauthorized" (401)
- Token not stored properly: Check AsyncStorage
- Token expired: Implement refresh token logic
- Header format wrong: Should be `Bearer <token>`

### "No data displayed"
- Check Supabase database has fruit data
- Run migrations first
- Run `node scripts/insert-prices.js`
- Check browser console for API response

### CORS Errors
- Backend already configured with CORS enabled
- If not working, check [index.js](index.js) line 15: `app.use(cors());`

---

## 🧪 Testing Endpoints

### Test with curl:
```bash
# Signup
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Pass123!","role":"farmer"}'

# Get token from response, then test authenticated endpoint:
curl -X GET http://localhost:4000/api/farmer/live-market \
  -H "Authorization: Bearer <token_from_above>"
```

---

## 📱 Frontend Files Updated

These files already reference `BACKEND_URL`:
- `app/farmer/index.tsx` - Dashboard (line 15)
- `app/login.tsx` - Authentication
- `app/signup.tsx` - User registration
- All farmer route screens

Just ensure they fetch from correct endpoints and handle the response format properly.

---

## 🚀 Production Deployment

Update `config.js` to use production URL:
```javascript
export const BACKEND_URL = "https://api.freshroute.com";
```

Ensure:
- SSL certificate installed
- CORS configured for production domain
- Environment variables set on server
- Database backups configured
- Monitoring/logging enabled

---

## 📞 Support

If integration issues occur:
1. Check backend logs: `tail -f server.log`
2. Verify database has data: Check Supabase dashboard
3. Test endpoints with Postman/curl first
4. Check network tab in browser DevTools
5. Review error messages in response body

All endpoints are documented in [SETUP.md](./SETUP.md)
