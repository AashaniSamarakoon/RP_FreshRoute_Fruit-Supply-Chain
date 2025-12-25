## 🆘 Fix: "Invalid or expired token" Error on Mobile

You're seeing this error because your stored token is from the old localhost connection. Here's the fix:

---

## ✅ **SOLUTION - Do This Now:**

### **Step 1: Logout from Profile Screen**
1. In your Expo app on mobile, tap the **Profile tab** (bottom right)
2. Scroll down and tap **Logout** button
3. You'll be sent back to Login screen

### **Step 2: Fresh Login**  
1. Tap **Sign up** (if first time) or use existing email/password
2. Enter credentials and submit
3. **New token will be generated** ✅
4. Should navigate to dashboard with data

### **Step 3: Verify Connection**
1. You should see: **"Good morning, [Name]"**
2. Should see some UI sections loading
3. Try clicking **Live Market Prices** tab
4. Should show 3 fruits with data ✅

---

## 🔧 If Logout Button Doesn't Work:

### **Force Clear Cache Method:**

**On Your PC (Terminal):**
```bash
# In the root directory where "npm start" is running:
# Press: Ctrl+C  (stops Expo)

# Clear Expo cache:
npm start --reset-cache

# Scan QR code again in Expo app
```

**On Your Mobile Phone:**
```
1. Shake phone or Menu → Reload
2. Wait for app to reload fresh
3. Should show Login screen
4. Login with your credentials
5. Should work now! ✅
```

---

## 🔍 What's Happening Behind The Scenes:

1. **Old Token**: When you were on `localhost:4000`, you got a token that worked
2. **Config Updated**: IP changed to `192.168.1.55:4000`
3. **Same Old Token**: Your phone still has the OLD token
4. **Backend Rejects**: Old tokens don't match new sessions
5. **Error**: "Invalid or expired token"

**Fix**: New login = new token = works with new IP ✅

---

## ✅ Verification Checklist:

After logging in fresh:
- [ ] You see dashboard with greeting
- [ ] No error popups
- [ ] Can see tabs at bottom (Home, Forecast, Market, Profile)
- [ ] Can tap Live Market Prices
- [ ] Can see 3 fruits loading
- [ ] Can tap Daily Prices
- [ ] Can tap Profile without error
- [ ] Logout button visible in Profile

If all ✅ → **Everything is working!** 🎉

---

## 📊 Backend Status (Already Confirmed):

✅ Backend listening on 192.168.1.55:4000  
✅ 0.0.0.0 binding enabled (listens on all interfaces)  
✅ Authentication working  
✅ Dashboard endpoint returning data  
✅ All farmer routes accessible  
✅ Token validation working  

**Backend is 100% Ready!** Only need fresh login on mobile.

---

## 💡 If Still Having Issues:

1. **Check WiFi**: Both PC and phone on **same network**?
2. **Check IP**: What does `ipconfig` show on PC?
3. **Backend Running**: Terminal should show "FreshRoute backend running on 0.0.0.0:4000"?
4. **Check config.js**: Should be `"http://192.168.1.55:4000"` not localhost
5. **Mobile Network**: Try `http://192.168.1.55:4000/api/auth/me` in phone browser

---

**TL;DR**: Click Logout on Profile tab, then login again. 🚀
