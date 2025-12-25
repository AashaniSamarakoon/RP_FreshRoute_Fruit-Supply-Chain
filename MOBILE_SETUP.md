# 📱 Expo Mobile Setup Guide - FreshRoute

## ✅ Your Network is Ready!

**Backend IP**: `192.168.1.55:4000`
**Status**: ✅ Accessible from mobile

---

## 🚀 Mobile Setup Steps

### Step 1: Update config.js (ALREADY DONE ✅)
```javascript
// config.js
export const BACKEND_URL = "http://192.168.1.55:4000";
```

### Step 2: Make Sure Backend is Running
```bash
cd RP_FreshRoute_Backend
npm start

# Should show: "FreshRoute backend running on port 4000"
```

### Step 3: Restart Frontend with Hot Reload

**Option A: Hot Reload (Fastest)**
```bash
# In Expo app on your phone:
# Press: r (refresh)
# Or shake phone and select "Reload"
```

**Option B: Full Restart**
```bash
# Terminal 1: Stop current npm start (Ctrl+C)
npm start
# Then choose: w (web) or i (iOS) or a (Android)
```

### Step 4: Test on Mobile

1. **Open Expo app** on your phone
2. **Scan QR code** shown in terminal
3. **Wait for app to load** (may take 30 seconds)
4. **Try signup/login**
5. **View live prices** - should show Mango, Banana, Pineapple with prices!

---

## 🔍 Network Requirements

✅ **Same WiFi Network**: Mobile phone must be on SAME WiFi as your PC
✅ **Backend Running**: `npm start` in RP_FreshRoute_Backend
✅ **Correct IP**: 192.168.1.55:4000
✅ **Firewall**: Port 4000 should be accessible

### Check Network Connection:

**On Your Mobile Phone:**
1. Settings → WiFi
2. Should show: "Connected to [YOUR_WIFI_NETWORK]"
3. Note the network name

**On Your PC:**
1. Settings → Network
2. Should show same WiFi network
3. IP should be 192.168.1.55

---

## 📍 Finding Your IP (If Different)

If your IP is different than `192.168.1.55`:

```bash
# Windows
ipconfig | findstr "IPv4"

# Mac
ifconfig | grep "inet "

# Linux
hostname -I
```

Then update `config.js` with your actual IP:
```javascript
export const BACKEND_URL = "http://[YOUR_IP]:4000";
```

---

## ✅ Troubleshooting

### "Cannot reach backend" on mobile
```
1. Check PC IP is correct (run ipconfig)
2. Check backend is running (npm start)
3. Check phone is on same WiFi
4. Check port 4000 is open (try: telnet 192.168.1.55 4000)
5. Try: npm start → w (web) to test on desktop first
```

### "Network request failed" error
```
1. Reload app: r (in Expo terminal)
2. Check config.js has correct IP
3. Try killing Expo: Ctrl+C → npm start again
4. Restart phone app completely
```

### "No prices showing"
```
1. Check database has prices (Supabase)
2. Run: node scripts/insert-prices.js
3. Check /api/farmer/live-market returns data
4. Clear app cache: Kill Expo app completely → restart
```

### Firewall Blocking Port 4000
```
Windows Defender Firewall:
1. Go to: Settings → Firewall → Advanced settings
2. Click: Inbound Rules
3. Add rule for port 4000
4. Or disable firewall temporarily for testing
```

---

## 🧪 Quick Tests

### Test Backend from Phone Browser
Open on your phone:
```
http://192.168.1.55:4000/api/auth/me
```

Should show:
```json
{
  "message": "Invalid token",
  "error": "..."
}
```

If you see connection error, check network!

### Test with Network Diagnostic
```bash
node RP_FreshRoute_Backend/scripts/test-network-mobile.js
```

Should show all ✅ (green checkmarks)

---

## 📱 Features to Test

After setting up:

1. **Signup Screen**
   - Enter name, email, password
   - Select "Farmer"
   - Click signup
   - Should get token & redirect to dashboard

2. **Live Market Screen**
   - Should show 3 fruits: Mango, Banana, Pineapple
   - Should show real prices from database
   - Should show fruit images
   - Should show last updated time

3. **Daily Prices Screen**
   - Should show same 3 fruits
   - Should show prices with images
   - Should show trend indicators

4. **Other Screens**
   - Dashboard: Stats and pickups
   - Forecast: 7-day data
   - Accuracy: Metrics
   - Notifications: Alerts
   - All should load data from backend

---

## 🔄 Workflow for Development

```
DEVELOPMENT CYCLE:

1. Update code in editor
2. Refresh Expo app: r (on phone or in terminal)
3. App reloads instantly
4. Test new feature
5. Repeat

IMPORTANT:
- Don't kill backend (npm start in RP_FreshRoute_Backend stays running)
- Only reload frontend: r in Expo terminal or shake phone
- If stuck, do full restart: Ctrl+C → npm start
```

---

## 📊 Current Setup Status

| Component | Status | Details |
|-----------|--------|---------|
| **Backend** | ✅ Running | Port 4000 |
| **Frontend** | ✅ Ready | Expo configured |
| **IP Address** | ✅ Set | 192.168.1.55 |
| **Network** | ✅ Connected | Same WiFi |
| **Database** | ✅ Ready | Supabase |
| **Prices** | ✅ Inserted | 3 fruits |
| **Images** | ✅ Loaded | Unsplash URLs |

---

## 🚀 Next Steps

1. **Reload Expo**: r (in terminal or shake phone)
2. **Try Signup**: Create farmer account
3. **Check Prices**: View live market data
4. **Test All Screens**: Navigate through app
5. **Report Issues**: If screens still show no data

---

## 💡 Pro Tips

- **Fast Reload**: Press `r` in Expo terminal instead of restarting app
- **View Logs**: Terminal shows all console.log from app
- **Network Logs**: Check browser DevTools on web version
- **Test on Web First**: `npm start → w` to test on desktop
- **Keep Terminal Open**: Never close backend terminal while developing

---

## 📞 Quick Support

**If still not working:**

1. ✅ Run network test: `node scripts/test-network-mobile.js`
2. ✅ Check config.js has IP: `192.168.1.55`
3. ✅ Check backend running: Shows "port 4000"
4. ✅ Check phone WiFi: Same network as PC
5. ✅ Reload Expo: Press `r` in terminal

**If network test shows ✅ but app still fails:**
- Try web version first: `npm start → w`
- Check browser DevTools Network tab
- Look for exact error message
- Check backend logs in terminal

---

## 🎉 You're All Set!

Your mobile app is now configured for network access.

**Just reload the app**: `r`

Data from backend should appear immediately! 📱✨
