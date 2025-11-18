# Quick Deploy: 3 Steps to Go Live for Free

## Step 1: Go to Render.com
Visit **https://render.com** and sign up with your GitHub account

## Step 2: Create Web Service
1. Click **New +** → **Web Service**
2. Select your `utkarshc612-cmd/fsd4` repository
3. Set these values:
   ```
   Name: tms-app
   Environment: Node
   Build Command: cd backend && npm install
   Start Command: node backend/index.js
   Plan: Free
   ```

## Step 3: Deploy
Click **Create Web Service** and wait 2-3 minutes.

Your app will be live at: **https://tms-app-xxxxx.onrender.com**

---

## Login Credentials
- Username: `admin`
- Password: `admin123`

---

## Keep App Awake (Free)
Render free tier sleeps after 15 minutes.

**Free solution:** Use UptimeRobot
1. Go to https://uptimerobot.com
2. Add monitor with your app URL
3. Set interval to 5 minutes
4. App stays awake forever!

---

## Done! ✅
Your Teacher Management System is now online and shareable!

Share the URL with anyone. They can access all features:
- Classes & Students
- Teacher Requests  
- Phase 2: Smart Classroom
- Phase 3: Security Features

**Questions?** See `DEPLOYMENT_GUIDE.md` for detailed instructions.
