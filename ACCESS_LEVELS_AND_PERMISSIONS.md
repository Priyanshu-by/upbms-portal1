# UPBMS — User Access Levels & Permissions Documentation

> **Uttar Pradesh Bank Mitra Sangh (UPBMS) Portal**  
> Role-Based Access Control (RBAC) & Permission Architecture Guide.

---

## 1. Executive Summary & Level Hierarchy

The system defines 4 distinct access levels with strict boundaries to ensure data privacy, administrative control, and self-service member registration:

```
┌─────────────────────────────────────────────────────────────┐
│                       LEVEL 1 (Super Admin)                 │
│      • Exactly 1 Account in System                          │
│      • All Website + All Admin Tabs + User Management       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                       LEVEL 2 (Sub-Admin)                   │
│      • All Website + Members Directory                      │
│      • Admin Panel (All edit tabs EXCEPT User Management)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                       LEVEL 3 (Verified Member)             │
│      • All Public Website                                   │
│      • Members Directory + Digital ID & Appointment Letter  │
│      • No Admin Panel                                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                       LEVEL 4 (Guest / Visitor)             │
│      • Public Website Only                                  │
│      • Members Directory: LOCKED (Prompt to Join)           │
│      • Admin Panel: LOCKED                                  │
│      • Can click "Join Us" to register and become Level 3   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Comprehensive Permissions & Visibility Matrix

| Feature / Page | Level 1 (Super Admin) | Level 2 (Sub-Admin) | Level 3 (Member) | Level 4 (Guest / Visitor) |
| :--- | :---: | :---: | :---: | :---: |
| **Public Website** (Home, About, Circulars, Documents, Portals, Grievance, Donate) | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Members Directory** (`/members`) | ✅ Full Access | ✅ Full Access | ✅ Full Access | ❌ **Hidden & Blocked** *(Shows prompt to Join/Login)* |
| **Digital ID Card & Appointment Letter** | ✅ Unlocked (Signed) | ✅ Unlocked (Signed) | ✅ Unlocked (Signed) | ⚠️ Unsigned Visitor Mode Only |
| **Join Membership Page (`/join`)** | ❌ **Hidden & Removed** | ❌ **Hidden & Removed** *(Already Member)* | ❌ **Hidden & Removed** *(Already Member)* | ✅ **Active** *(Can register to become Level 3)* |
| **Header Join Button (`✍️`)** | ❌ **Hidden** | ❌ **Hidden** | ❌ **Hidden** | ✅ **Visible** |
| **Floating Join Button (`✍️ सदस्य बनें`)** | ❌ **Hidden** | ❌ **Hidden** | ❌ **Hidden** | ✅ **Visible** |
| **Admin Panel** (`/admin`) | ✅ Full Access | ✅ Full Access | ❌ **Hidden & Blocked** | ❌ **Hidden & Blocked** |
| **Admin Tabs (13 Tabs)**: Dashboard, Signs, Menus, About, Backgrounds, Hero, Members, Circulars, Documents, Portals, Payments, Grievances, Branding | ✅ Edit Everything | ✅ Edit Everything | ❌ No Access | ❌ No Access |
| **User Management Tab** (`/users` in Admin) | ✅ **Full Control** | ❌ **Hidden & 403 Blocked** | ❌ No Access | ❌ No Access |
| **Upgrade / Change User Levels** | ✅ Yes (Levels 2, 3, 4) | ❌ Restricted | ❌ Restricted | ❌ Restricted |
| **Single Account Rule** | 🔒 **1 Account Only** | Multiple Accounts | Multiple Accounts | Unauthenticated / Multiple |

---

## 3. Detailed Level Breakdown

### 👑 Level 1 — Super Admin
* **Account Constraint:** **Exactly one account** can exist in the system at any time. The database and API strictly reject creating or promoting a second account to Level 1.
* **Capabilities:**
  * Full administrative rights across all 14 admin tabs.
  * Access to the exclusive **User Management** page (`👥 User Management`).
  * Ability to view all users, filter by level, and upgrade/downgrade user access levels (Level 2, Level 3, Level 4).
  * Ability to update the single Level 1 account credentials (username, name, mobile, and password).
  * Direct password reset for any member.

### ⭐ Level 2 — Sub-Admin / Editor
* **Target Users:** State Core Committee members, district administrators, and operational coordinators.
* **Capabilities:**
  * Full access to the public website and the **Members Directory**.
  * Full access to the **Admin Panel** to edit site settings, signatures, seals, menus, about content, templates, hero slider, member details, circulars, association documents, external portals, fee receipts, grievances, and branding.
* **Restrictions:**
  * **Cannot access User Management.** The tab is hidden in the admin sidebar.
  * Direct API requests to `/api/users` endpoints are blocked with `403 Forbidden`.

### 🎖️ Level 3 — Verified Member
* **Target Users:** Active Bank Mitras / CSP operators across Uttar Pradesh.
* **Capabilities:**
  * Full access to all public sections.
  * Access to the **Members Directory** (`/members`) to search fellow Bank Mitras by district, bank, or KO code.
  * Access to verified **Digital ID Cards** (front/back with QR) and **Official Appointment Letters** bearing official signatures and union seal.
* **Restrictions:**
  * No access to the Admin Panel. Admin launch buttons are hidden.

### 👤 Level 4 — Guest / Visitor / Unregistered
* **Target Users:** Non-logged-in public visitors and unverified guest accounts.
* **Default Fallback on Logout:** Whenever any user (Level 1, 2, or 3) logs out, the session is cleared, all signed assets are revoked, and the client **instantly reverts to Level 4 mode** on the Home page (`/home`).
* **Capabilities:**
  * Access to informational pages: Home, About Us, Circulars & PDFs, Association Documents, Important Portals, Grievance Lodging & Tracking, and Welfare Donations.
  * Unauthenticated visitor mode for ID verification (plain information without official signatures/seals).
* **Restrictions:**
  * **Members Directory (`/members`) is hidden from main navigation.** If accessed directly via URL, a dedicated security screen informs the visitor that the directory is restricted to Level 3+ members, providing direct CTA buttons to **Join Us (Become Level 3)** or **Log In**.
  * **Admin Panel is hidden and blocked.**
* **Upgrade Path:**
  * Any Level 4 user can click **"सदस्यता पंजीकरण" (Join Us)**. Submitting the registration form assigns **Level 3**, unlocking the Members Directory and digital credentials upon activation.

---

## 4. Pre-Configured Demo Accounts for Testing

| Access Level | Login Method | Username / Identifier | Password / PIN | Expected Access & Test Checkpoints |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1**<br>*(Super Admin)* | Admin Panel or Member Login | `admin`<br>*(or PIN `1234`)* | `admin123` | • Sees **User Management** tab in Admin.<br>• Can upgrade any user to Level 2, 3, or 4.<br>• Can edit Level 1 credentials.<br>• Cannot promote a 2nd user to Level 1. |
| **Level 2**<br>*(Sub-Admin)* | Admin Panel or Member Login | `UPBMS-CORE-002` | `123456` | • Sees Admin Panel with 13 editing tabs.<br>• **User Management tab is hidden & 403 blocked**.<br>• Can view Members Directory (`/members`). |
| **Level 3**<br>*(Active Member)* | Member Login Modal | `UPBMS-CORE-001`<br>*(or general member)* | `123456` | • Can view Members Directory (`/members`).<br>• ID card and appointment letter show signatures.<br>• Admin Panel buttons are hidden. |
| **Level 4**<br>*(Guest / Visitor)* | None (default state) | *Unauthenticated* | *None* | • Can browse public website.<br>• **Members Directory shows restricted access screen**.<br>• Admin Panel is completely inaccessible.<br>• Clicking "Join" registers as Level 3. |

---

## 5. Admin Panel: User Management Guide

The **User Management** tab (`👥 User Management`) is accessible exclusively to Level 1:

1. **4-Level Live Counter Deck:**  
   Displays live counts of users in Level 1 (always 1), Level 2, Level 3, and Level 4 with detailed descriptions of their privileges.

2. **Single Level 1 Super Admin Card:**  
   Displays the current Level 1 username, display name, mobile, and active status.  
   Clicking **"✏️ क्रेडेंशियल व पासवर्ड बदलें" (Change Credentials & Password)** opens an inline form to update the Level 1 username, name, mobile, and password.

3. **User Directory & Level Upgrade Table:**  
   * **Search:** Filter by name, username, member code, mobile, or district in real time.
   * **Level Filter Tabs:** Quick filter by `All`, `Level 1`, `Level 2`, `Level 3`, or `Level 4`.
   * **Level Upgrade Selector:** Each user row includes a quick dropdown selector:
     * `⭐ Level 2 (Admin)`
     * `🎖️ Level 3 (Member)`
     * `👤 Level 4 (Guest)`
   * Selecting a new level immediately calls the backend API, updates the database, updates user privileges, and displays a success notification.
   * The Level 1 Super Admin row is locked as `🔒 स्थायी सुपर एडमिन (1 खाता केवल)` to prevent accidental downgrades.
   * **Password Reset Button:** Quick action button `🔑 पासवर्ड` to reset any member's password directly.

---

## 6. Technical Implementation & Security Architecture

### Backend Enforcement (`backend/src/`)

* **Session & Auth Resolver (`backend/src/index.js` -> `resolveRequestAuth`):**
  * Reads `X-Admin-Pin` header (matches `db.settings.adminPin || "1234"` -> Level 1).
  * Reads `X-Member-Id` and `X-Member-Pass` headers. Matches member by `id`, `memberCode`, or `username` and verifies password.
  * Resolves `req.auth = { isAdmin: level <= 2, isMember: true, level, member }`.
  * Unauthenticated requests default to `level: 4`, `isAdmin: false`, `isMember: false`.

* **Route Guards (Middleware):**
  * `requireAdmin`: Validates `req.auth.isAdmin` (Level 1 or Level 2).
  * `requireSuperAdmin`: Validates `req.auth.level === 1`. Rejects Level 2, 3, and 4 with `403 Forbidden`.

* **API Endpoints:**
  * `POST /api/admin/login`: Supports both PIN login (`1234`) and credential login (username/password for Level 1 and Level 2).
  * `POST /api/member/login`: Supports username/code/mobile + password for all levels.
  * `GET /api/users`: Restricted to Level 1 via `requireSuperAdmin`. Returns list of users with their levels.
  * `PUT /api/users/:id/level`: Restricted to Level 1. Enforces that exactly one Level 1 account exists.
  * `PUT /api/users/level1-credentials`: Restricted to Level 1. Updates Level 1 credentials.
  * `POST /api/members`: Self-service registration automatically assigns `level: 3`.

* **Database Level Migration (`backend/src/db.js` -> `loadDb`):**
  * Automatically ensures that exactly one Level 1 Super Admin account (`mem-superadmin-1` / `admin`) exists on startup.
  * Automatically sets default levels (`level: 2` for core members, `level: 3` for general members) if records were created before levels were introduced.

### Frontend Enforcement (`frontend/src/`)

* **Portal Context (`frontend/src/context.jsx`):**
  * Computes reactive permissions:
    ```js
    const userLevel = session?.level || (session?.isAdmin ? 1 : (session?.member?.level || (session?.member ? 3 : 4)));
    const isAdmin = userLevel === 1 || userLevel === 2;
    const isSuperAdmin = userLevel === 1;
    const canAccessMembers = userLevel <= 3;
    const canAccessAdmin = userLevel <= 2;
    const canAccessUserManagement = userLevel === 1;
    ```
* **Layout & Navigation (`frontend/src/components/Layout.jsx`):**
  * Admin Panel launch button is visible only if `canAccessAdmin` is true.
  * Navigation items filter out `"members"` for Level 4 users.
  * Displays a visual Level pill badge in the top utility bar (`👑 Level 1`, `⭐ Level 2`, `🎖️ Level 3`, `👤 Level 4`).
* **Members Page Guard (`frontend/src/pages/Public.jsx`):**
  * Checks `canAccessMembers`. If false (Level 4), renders the restricted access banner with clear CTA buttons to Join or Login.
* **Admin Page Guard (`frontend/src/pages/Admin.jsx`):**
  * Filters out the `users` tab for Level 2 admins.
  * Provides dual login modes: **Admin PIN** and **Account Username/Password**.
