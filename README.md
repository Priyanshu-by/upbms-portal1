# UPBMS — उत्तर प्रदेश बैंक मित्र संघ (Portal)

Full-stack MERN application for the Bank Mitras / CSP operators of Uttar Pradesh.

## 📖 Documentation
- **[User Access Levels & Permissions Guide](file:///c:/Users/ankit/OneDrive/Desktop/Chacha%20upms/ACCESS_LEVELS_AND_PERMISSIONS.md)**: Full guide to Level 1 (Super Admin), Level 2 (Sub-Admin), Level 3 (Member), and Level 4 (Guest/Visitor) roles, permissions, demo accounts, and User Management in the Admin Panel.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Development Server
```bash
npm run dev
```
- **Backend API**: `http://127.0.0.1:5000`
- **Frontend Web**: `http://localhost:5174`

---

## 🔑 Super Admin Credentials

| Role | Login Credentials | Key Permissions |
| :--- | :--- | :--- |
| **Super Admin** | `admin` / `admin@123`<br>*(or PIN `1234`)* | All website features + All Admin tabs **including User Management & Gateway Control**. Only 1 Super Admin account is permitted. |

> ℹ️ **Production Note:** All demo Level 2 and Level 3 member accounts have been removed for production deployment. Create verified accounts directly via the **Join Us** registration form or via the Admin Panel.

---

## 🌐 Production Deployment Guide (Render + Vercel)

### Step 1: Deploy Backend on Render
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), click **New + → Web Service**.
3. Select your GitHub repository.
4. Set the following build and start configurations:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. In the **Environment Variables** tab, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random string.
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://your-app.vercel.app`).
   - `GMAIL_USER` / `GMAIL_APP_PASSWORD`: For email verification OTPs.
   - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`: Razorpay gateway credentials.
   - `PNB_MERCHANT_ID` / `PNB_SECRET_KEY`: PNB Dynamic QR credentials.
6. Click **Deploy**. Note your backend URL (e.g., `https://upbms-backend.onrender.com`).

### Step 2: Deploy Frontend on Vercel
1. In [Vercel Dashboard](https://vercel.com/), click **Add New → Project**.
2. Select your GitHub repository.
3. In Project Settings:
   - **Root Directory:** Edit to select `frontend`.
   - **Framework Preset:** Vite.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://upbms-backend.onrender.com`).
5. Click **Deploy**. Your portal is now live with full production integration!
