📱 **MOBILE APP - TOKEN ERROR FIX GUIDE**

## ❌ Problem: "Invalid or expired token"

This error appears when:
1. ✅ App IS connecting to backend (good!)
2. ❌ But the token from previous session is invalid/expired

## ✅ Solution (Try These Steps in Order):

### **Option 1: Force Clear & Logout (EASIEST)**
```
1. Open Expo app on phone
2. Shake phone or press: Menu → "Reload"
3. Should see login screen again
4. Clear AsyncStorage in frontend code:
   - In app/farmer/index.tsx, run logout function
   - OR click logout button
```

### **Option 2: Clear Expo Cache**
```
On PC terminal:
1. Stop Expo: Ctrl+C
2. Clear cache: npx expo-cli start --clear
3. Scan QR code again
4. Should get fresh install
```

### **Option 3: Clear App Data on Mobile**
```
On Phone:
1. Go to: Settings → Apps → Expo (or your app)
2. Storage → Clear Cache
3. Return to app & reload
4. Should prompt for login
```

## 🔄 Fresh Login Flow:

After clearing cache, your mobile app should:
1. Show Login screen
2. You signup/login with email & password
3. Receive fresh JWT token
4. Token stored in AsyncStorage
5. Dashboard loads with data ✅

---

## 🧪 Backend Verification

✅ Token generation: WORKING
✅ Token validation: WORKING  
✅ Protected endpoints: WORKING
✅ Dashboard data return: WORKING
✅ Authentication middleware: WORKING

**Backend is 100% Ready!**

---

## 📍 Why This Happened:

1. You had old token from `localhost:4000` (doesn't exist on mobile)
2. When you changed config to `192.168.1.55:4000`, app tried old token
3. Backend now validates tokens properly
4. Old token fails validation → "Invalid or expired token"

**Solution:** New login = new token = works with new IP ✅

---

## ✨ What Works Now:

✅ Backend listening on 0.0.0.0:4000 (all interfaces)
✅ Mobile can reach 192.168.1.55:4000
✅ Authentication working perfectly
✅ Dashboard endpoint returning data
✅ All farmer endpoints accessible

Just need fresh login on mobile! 🚀
