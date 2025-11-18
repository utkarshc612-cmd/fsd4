# Deploying Teacher Management System (TMS) Online for Free

This guide shows how to deploy your fullstack TMS application online using **Render.com** (completely free).

## Option 1: Deploy on Render (Recommended - Easiest)

### Step 1: Sign Up on Render
1. Go to **https://render.com**
2. Click **Sign Up** and choose **GitHub** authentication
3. Authorize Render to access your GitHub repositories

### Step 2: Connect Your Repository
1. Click **New +** → **Web Service**
2. Select your `fsd4` repository
3. Configure:
   - **Name:** `tms-app` (or any name)
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `node backend/index.js`
   - **Plan:** Free (select this)

### Step 3: Environment Variables
Add in the "Environment" section:
- `PORT` = `3000`
- `NODE_ENV` = `production`

### Step 4: Deploy
1. Click **Create Web Service**
2. Render will automatically deploy your app
3. Your live URL will appear as: `https://tms-app-xxxxx.onrender.com`

**Note:** Free tier sleeps after 15 minutes of inactivity. To keep it always on, upgrade to paid plan or visit your app regularly.

---

## Option 2: Deploy on Railway (Also Free)

### Step 1: Sign Up
1. Go to **https://railway.app**
2. Click **Start Project** → **Deploy from GitHub**
3. Select the `fsd4` repository

### Step 2: Configure
Railway auto-detects your Node.js app:
- Set **Start Command:** `node backend/index.js`
- Create **PORT** environment variable: `3000`

### Step 3: Deploy
Click **Deploy** and your app will be live at a Railway URL.

---

## Option 3: Deploy on Heroku (Free tier ended, but still available)

Heroku now requires paid plans. Use **Render** or **Railway** instead for free deployment.

---

## Option 4: Self-Host on Replit

1. Go to **https://replit.com**
2. Click **Create** → **Import from GitHub**
3. Paste: `https://github.com/utkarshc612-cmd/fsd4`
4. Click **Import**
5. In `.replit` file, set:
   ```
   run = "cd backend && npm install && node index.js"
   ```
6. Click **Run** - your app is now live on Replit URL

---

## After Deployment: Update API URLs

Since your frontend and backend are deployed together, the **auto-detection in `frontend/app.js` handles this automatically**.

The code detects:
- **Production:** Uses `/api` (same server)
- **Local:** Uses `localhost:3000/api` (for development)

✅ **No manual URL changes needed!**

---

## Testing Your Deployed App

1. Open your live URL in browser
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Try all features:
   - View classes
   - View students
   - Submit teacher requests
   - Access Phase 2 (Smart Classroom)
   - Access Phase 3 (Security)

---

## Important Notes

### Free Tier Limitations:
- **Render**: Sleeps after 15 min inactivity (restart when accessed)
- **Railway**: Similar idle timeout
- **Replit**: Requires periodic pings to stay awake

### Solutions:
1. **Use a free monitoring service** like UptimeRobot to ping your app every 5 minutes
2. **Upgrade to paid plan** for always-on service
3. **Set up GitHub Actions** for continuous deployment

### UptimeRobot Setup (Keeps App Awake):
1. Go to **https://uptimerobot.com**
2. Create free account
3. Add new monitor:
   - **URL:** Your live app URL
   - **Interval:** 5 minutes
4. Monitor will ping your app to keep it alive

---

## Your App is Now Live! 🎉

Once deployed, share your live URL:
- https://tms-app-xxxxx.onrender.com (Render example)
- https://yourapp.railway.app (Railway example)
- https://yourapp.replit.dev (Replit example)

Anyone can access it from anywhere!

---

## Troubleshooting

**App not starting?**
- Check **Logs** in deployment dashboard
- Ensure `node backend/index.js` command is correct
- Verify all dependencies in `package.json` are correct

**API not working?**
- Check browser console for errors (F12)
- Verify API_BASE in `frontend/app.js` matches deployed URL
- Check CORS settings in `backend/index.js`

**Database issues?**
- Free tier data is temporary
- Use permanent database (MongoDB, PostgreSQL) for production
- Or use Render PostgreSQL add-on (free tier available)

---

**Happy deploying! 🚀**
