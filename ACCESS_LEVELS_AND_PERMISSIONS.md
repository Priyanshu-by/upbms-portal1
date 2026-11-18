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
| **Payment Gateway Options Tab** (`/gatewaysettings` in Admin) | ✅ **Full Control** (Toggle PNB QR, Razorpay, Manual UPI) | ❌ **Hidden & 403 Blocked** | ❌ No Access | ❌ No Access |
| **Login Settings Tab** (`/loginsettings` in Admin) | ✅ **Full Control** | ❌ **Hidden & 403 Blocked** | ❌ No Access | ❌ No Access |
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
  * `POST /api/member/login`: Supports login with Member ID, Email, Username, or Mobile + Password for all access levels.
  * `POST /api/auth/forgot-password/send-otp`: Sends 6-digit OTP code to registered member's email for password reset.
  * `POST /api/auth/forgot-password/reset`: Verifies OTP and sets new password, automatically logging the member in.
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

---

## 5. Join Us Registration & Verification Workflow (Level 4 → Level 3)

The public registration flow enforces a rigorous 3-step verification process to ensure that only legitimate bank mitras with verified email addresses and verified fee payments can create an account and obtain Level 3 access.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STEP 1: DETAILS & EMAIL OTP                     │
│  • Fill personal & bank details (Name, Mobile, Bank, KO Code, Photo)   │
│  • Enter Email ID and click "Send OTP (कोड भेजें)"                      │
│  • Official bilingual OTP dispatched from upbmsofficial@gmail.com      │
│  • Enter 6-digit OTP and click "Verify (सत्यापित करें)"                │
│  • Backend issues cryptographic emailVerificationToken (30 min expiry) │
│  • Email field locks with green "✓ Email Verified" badge               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        STEP 2: UPI PAYMENT & UTR                       │
│  • Dynamic QR Code displayed with ₹251 annual membership fee           │
│  • UPI ID: upbmsofficial@okaxis / UPBMS Official Bank Account Details │
│  • Select payment mode (UPI, PhonePe, Google Pay, Paytm, Net Banking)  │
│  • Enter mandatory 12-digit UTR / Transaction Reference Number         │
│  • Optional: Upload screenshot of payment receipt proof                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                 STEP 3: TERMS & LEVEL 3 ACCOUNT CREATION               │
│  • Review & accept UPBMS Association Terms & Conditions                │
│  • Click "Complete Verified Level 3 Registration"                      │
│  • Backend strictly validates:                                         │
│      1. emailVerificationToken matches verified email                  │
│      2. No duplicate mobile or duplicate email                         │
│      3. Valid 12-digit UTR number provided                             │
│  • Generates official Member Code (e.g. UPBMS-2026-1045)               │
│  • Generates official Receipt No (e.g. UPBMS-RCP-2026-1045)            │
│  • Assigns Level 3 (Active Member) & verified payment status           │
│  • Auto-logs in member session & redirects directly to /idcard         │
│  • Digital ID Card, Appointment Letter, & Receipt available instantly! │
└────────────────────────────────────────────────────────────────────────┘
```

### Verification Endpoints:
* `POST /api/auth/send-registration-otp`:
  * Validates email format and ensures email is not already registered.
  * Sends an official 6-digit OTP using Gmail SMTP (`upbmsofficial@gmail.com`).
  * Features dev mode fallback to prevent blocking during development/sandbox environments.
* `POST /api/auth/verify-registration-otp`:
  * Validates the 6-digit OTP (10 min expiry, max 5 attempts).
  * Returns a one-time cryptographic `emailVerificationToken`.
* `POST /api/members`:
  * Validates that `emailVerificationToken` is valid and authentic for the specified email.
  * Rejects registration with `400 Bad Request` if email was not verified or if UTR is missing/invalid.
  * Automatically creates the member at **Level 3** with active status and generates their payment receipt.

---

## 6. Calendar-Year Membership Pricing Logic & Razorpay Payment Integration

### A. Calendar-Year Pricing Formula

The portal implements a calendar-year membership system with a fixed rate of **₹50 per remaining month** of the current calendar year.

* **Formula:** `price = (13 - currentMonth) * 50`
* **Server-Side Dynamic Calculation:** The price is calculated strictly on the backend using the server's current date and month. The client amount is **never trusted**.
* **Validity:** All memberships expire on **December 31st of the current year** (`YYYY-12-31`).

| Purchase Month | Month Index | Remaining Months | Membership Fee | Validity Period |
| :--- | :---: | :---: | :---: | :---: |
| **January** | 1 | 12 | **₹600** | Jan 1 – Dec 31 |
| **February** | 2 | 11 | **₹550** | Feb 1 – Dec 31 |
| **March** | 3 | 10 | **₹500** | Mar 1 – Dec 31 |
| **April** | 4 | 9 | **₹450** | Apr 1 – Dec 31 |
| **May** | 5 | 8 | **₹400** | May 1 – Dec 31 |
| **June** | 6 | 7 | **₹350** | Jun 1 – Dec 31 |
| **July** | 7 | 6 | **₹300** | Jul 1 – Dec 31 |
| **August** | 8 | 5 | **₹250** | Aug 1 – Dec 31 |
| **September** | 9 | 4 | **₹200** | Sep 1 – Dec 31 |
| **October** | 10 | 3 | **₹150** | Oct 1 – Dec 31 |
| **November** | 11 | 2 | **₹100** | Nov 1 – Dec 31 |
| **December** | 12 | 1 | **₹50** | Dec 1 – Dec 31 |

### B. Razorpay Integration Architecture

1. **Environment Variables:**
   * `RAZORPAY_KEY_ID`: Public key passed to the frontend checkout modal.
   * `RAZORPAY_KEY_SECRET`: Private secret kept strictly on the backend server for HMAC SHA-256 signature verification.
   * `RAZORPAY_WEBHOOK_SECRET`: Secret used to authenticate webhook notifications.
2. **Endpoints:**
   * `GET /api/payment/membership-pricing`: Returns dynamic fee, month name, remaining months, validity, and public key ID.
   * `POST /api/payment/create-order`: Calculates fee dynamically on server and creates secure order with Razorpay REST API (`https://api.razorpay.com/v1/orders`).
   * `POST /api/payment/verify`:
     * Verifies cryptographic signature using `crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(order_id + "|" + payment_id).digest("hex")`.
     * Validates payment status with Razorpay (`fetchRazorpayPayment`) before activating membership.
     * Prevents duplicate payments by checking existing database records.
     * Creates / upgrades member to Level 3 Active status with validity set to `YYYY-12-31`.
     * Records payment details into `db.payments` with receipt number and audit log entry.
   * `POST /api/payment/record-failed`: Captures cancelled or failed attempts in database logs for auditing.
   * `POST /api/payment/webhook`: Processes `payment.captured`, `payment.failed`, and `order.paid` webhooks securely via raw-body HMAC SHA-256 verification.

---

## 7. Punjab National Bank (PNB) Dynamic UPI QR Integration

### A. Core Architecture & Specifications
* **Official Merchant UPI Gateway:** Built for Punjab National Bank merchant acquire APIs conforming to NPCI Dynamic UPI specifications.
* **Locked Dynamic Amount:** Each dynamic QR contains the exact calendar-year fee calculated on the server (`price = (13 - currentMonth) * 50`).
* **Unique Order Reference (`tr`):** Formatted as `PNB-2026-XXXXXX-XXXX` for unique, non-repudiable transaction tracking.
* **10-Minute Expiry Window:** Enforces a 600-second countdown; expired QR codes are automatically flagged as `EXPIRED` and cannot be paid, with an instant single-click retry button.
* **Scannable by All Major UPI Apps:** Google Pay, PhonePe, Paytm, BHIM, PNB One, and all NPCI-compliant PSP apps.
* **Server-Side Status Polling & Callback:** Real-time checking every 3 seconds against `/api/payment/pnb/check-status/:orderId`.
* **Instant Activation & Auto-Login:** Upon payment verification (`SUCCESS`), Level 3 membership is instantly activated, verified receipt issued, and user automatically logged into their member profile.
* **Zero Trust:** Never trusts frontend payment status or screenshots; activation requires bank status confirmation.

### B. Security & Credentials
* `PNB_MERCHANT_ID`: Official PNB merchant identifier.
* `PNB_TERMINAL_ID`: Terminal ID for acquired transactions.
* `PNB_MERCHANT_VPA`: Merchant Virtual Payment Address (e.g. `upbms@pnb`).
* `PNB_MERCHANT_NAME`: Payee business name (e.g. `Uttar Pradesh Bank Mitra Sangh`).
* `PNB_API_KEY`: API authentication key.
* `PNB_SECRET_KEY`: HMAC-SHA256 signature secret for server-to-server inquiry and callback verification.
* `PNB_BASE_URL`: PNB merchant API gateway base URL.

---

## 8. Level 1 Super Admin Payment Gateway Management

In the Admin Panel, **Level 1 Super Admin** has exclusive access to the **"💳 Gateway & Payment Options" (`gatewaysettings`)** tab:

1. **Option Toggles:**
   * **PNB Dynamic QR:** Toggle PNB Dynamic QR checkout on/off.
   * **Razorpay Checkout:** Toggle Razorpay card/netbanking/UPI gateway on/off.
   * **Manual UPI & UTR:** Toggle manual UPI QR code and 12-digit UTR entry on/off.
2. **Default Gateway Selection:**
   * Choose which gateway is pre-selected by default when a visitor opens the "Join Us" page.
3. **Manual Banking Credentials:**
   * Directly configure payee UPI ID, Payee Name, Bank Account Number, and IFSC.
4. **Access Control:**
   * Level 2 Sub-Admins cannot access this tab; unauthorized attempts are blocked with a `403 Access Restricted` screen.


