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

## 🔑 Demo Accounts

| Level | Role | Login Credentials | Key Permissions |
| :--- | :--- | :--- | :--- |
| **Level 1** | **Super Admin** | `admin` / `admin123`<br>*(or PIN `1234`)* | All website + All 14 Admin tabs **including User Management** (Upgrade user levels). Only 1 account allowed. |
| **Level 2** | **Sub-Admin** | `UPBMS-CORE-002` / `123456` | All website + Members Directory + Admin Panel (All 13 edit tabs **except User Management**). |
| **Level 3** | **Active Member** | `UPBMS-CORE-001` / `123456` | All website + Members Directory + Digital ID Card & Appointment Letter. No Admin Panel. |
| **Level 4** | **Guest / Visitor** | *Default (Not logged in)* | Public website only. **Members Directory & Admin Panel are hidden/blocked**. Can click "Join Us" to register and become Level 3. |
