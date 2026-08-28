# Chalao (চালাও • चलाओ) 🚖
> **“যারা চালায়, যারা চড়ে, তারাই মালিক।”**  
> *“जो चलाते हैं, जो बैठते हैं, वही मालिक हैं।”*  
> *“Those who drive, those who ride, are the owners.”*

**Chalao** is a next-generation **Democratic Cooperative Ride-Sharing Platform** designed for India and South Asia, based on the Multi-State Co-operative Societies Act, 2002 and MoRTH Aggregator Guidelines.

---

## 📱 Complete Multi-App Architecture

The platform consists of **3 dedicated applications** across Android and iOS:

| Application | Technology | Android Project | Apple iOS Project | Package ID |
|---|---|---|---|---|
| **🚗 ১. গ্রাহক / যাত্রী অ্যাপ (Rider App)** | **Flutter (Dart)** | `flutter_apps/rider/android` | `flutter_apps/rider/ios` | `coop.chalao.rider` |
| **🚖 ২. চালক / পার্টনার অ্যাপ (Driver App)** | **Flutter (Dart)** | `flutter_apps/driver/android` | `flutter_apps/driver/ios` | `coop.chalao.driver` |
| **🏛️ ৩. অ্যাডমিন ও অপারেশন ডেস্ক (Admin App)** | **Capacitor + Next.js** | `apps/admin/android` | `apps/admin/ios` | `coop.chalao.admin` |

---

## 🗄️ Backend & Database Architecture

- **Database**: **Neon Serverless PostgreSQL** (AWS ap-southeast-1 region)
- **API Engine**: Next.js 14 App Router API Routes (`/api/*`)
- **Authentication**: Phone Number + 6-Digit OTP (`/api/auth/send-otp`, `/api/auth/verify-otp`) with Edge-compatible JWT (via `jose`)
- **Real-time Driver GPS**: `/api/driver/location`
- **Ride Dispatch Engine**: `/api/rides`, `/api/rides/[id]` with 4-Digit Pickup PIN verification
- **Driver Earnings & Instant UPI Payouts**: `/api/driver/earnings` with 8-10% transparent cooperative commission cap

### Database Schema Tables:
1. `users` — Riders, Drivers, Admins
2. `otp_logs` — SMS OTP verification audit logs
3. `driver_profiles` — KYC verification (Aadhaar, PAN, DL, RC), vehicle specs & rating
4. `driver_locations` — Real-time latitude/longitude/heading coordinates
5. `rides` — Ride bookings, statuses, fare calculations, OTP PINs, reviews
6. `earnings` — Driver gross/commission/net breakdown with instant UPI payout status
7. `saved_addresses` — Home/work/favorite locations

---

## 🌟 App Specific Features

### 🚗 ১. Chalao Rider App (`flutter_apps/rider`):
- **Phone OTP Login / Signup** with profile and emergency contact setup.
- **Interactive OpenStreetMap** with live GPS positioning.
- **6 Vehicle Categories**: Bike, Auto, Sedan, SUV, Green EV, and Pink (Women-Safe).
- **Transparent Co-op Fares**: 9% platform fee with no predatory surge.
- **Live Ride Tracking**: 5s driver polling, 4-digit pickup PIN display.
- **Safety**: Instant 112 SOS emergency trigger.
- **Post-Trip Flow**: Driver star rating + review + trip history.

### 🚖 ২. Chalao Driver Partner App (`flutter_apps/driver`):
- **Driver Cockpit**: Dark theme HUD designed for day & night driving.
- **4-Step KYC Onboarding**: Aadhaar, PAN, DL, RC, Vehicle Specs, and UPI ID.
- **Online/Offline Switch** with automatic 15s GPS tracking.
- **15s Incoming Ride Alert** with countdown timer and audio chime.
- **4-Digit Passenger PIN Verification** before trip starts.
- **Earnings Dashboard**: Today/Week/Month metrics with instant UPI payout requests.

### 🏛️ ৩. Chalao Admin & Dispatch Desk (`apps/admin`):
- **Fleet Command Center**: Live interactive radar of active drivers and ongoing rides.
- **KYC Verification Queue**: Approve/reject driver documents.
- **Commission Cap Engine**: Real-time enforcement of 8-10% cooperative margins.
- **Transparency Ledger**: Public audit of co-op revenue, expenses, and dividend distribution.

---

## 🛠️ Developer Commands

### 1. Run Web & Backend Server
```bash
npm run dev
```

### 2. Run Database Migrations (Neon PostgreSQL)
```bash
node scripts/migrate-neon.mjs
```

### 3. Build Flutter Mobile Apps
```bash
# Build Rider APK
cd flutter_apps/rider
flutter pub get
flutter build apk --debug

# Build Driver APK
cd flutter_apps/driver
flutter pub get
flutter build apk --debug
```

### 4. Build Admin App (Capacitor)
```bash
npm run admin:sync
npm run admin:android
```

---

## 🚀 CI/CD Automated Builds (GitHub Actions)

The repository includes automated CI/CD pipelines in `.github/workflows/`:
1. `ci.yml` — Compiles and validates the Next.js web application and API endpoints.
2. `android-build.yml` — Automatically builds and uploads all Android APK artifacts:
   - `Chalao-Rider-v1.0.0-Flutter-APK`
   - `Chalao-Driver-v1.0.0-Flutter-APK`
   - `Chalao-Admin-v1.0.0-Capacitor-APK`

---

## 📄 License & Governance
Operated under Cooperative Principles & Multi-State Co-operative Societies Act, 2002.  
© 2026 Chalao Cooperative Society Ltd. All rights reserved.
