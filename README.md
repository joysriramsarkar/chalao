# Chalao (চালাও • चलाओ) 🚖
> **“যারা চালায়, যারা চড়ে, তারাই মালিক।”**  
> *“जो चलाते हैं, जो बैठते हैं, वही मालिक हैं।”*  
> *“Those who drive, those who ride, are the owners.”*

**Chalao** is a next-generation **Democratic Cooperative Ride-Sharing Platform** designed for India and South Asia, based on the Multi-State Co-operative Societies Act, 2002 and MoRTH Aggregator Guidelines.

---

## 📱 Complete 6 Native Mobile Applications Suite

The project includes **3 standalone dedicated applications**, each with native **Android (APK/Gradle)** and **Apple iOS (Xcode/CocoaPods)** projects:

| Application | Android App (APK) | Apple iOS Project | App ID |
|---|---|---|---|
| **🚗 ১. গ্রাহক / যাত্রী অ্যাপ (Rider App)** | [Chalao-Rider-v1.0.0-debug.apk](./Chalao-Rider-v1.0.0-debug.apk) ([`apps/rider/android`](./apps/rider/android)) | [`apps/rider/ios`](./apps/rider/ios) | `coop.chalao.rider` |
| **🚖 ২. চালক / পার্টনার অ্যাপ (Driver App)** | [Chalao-Driver-v1.0.0-debug.apk](./Chalao-Driver-v1.0.0-debug.apk) ([`apps/driver/android`](./apps/driver/android)) | [`apps/driver/ios`](./apps/driver/ios) | `coop.chalao.driver` |
| **🏛️ ৩. অ্যাডমিন ও অপারেশন ডেস্ক (Admin App)** | [Chalao-Admin-v1.0.0-debug.apk](./Chalao-Admin-v1.0.0-debug.apk) ([`apps/admin/android`](./apps/admin/android)) | [`apps/admin/ios`](./apps/admin/ios) | `coop.chalao.admin` |

---

## 🌟 App Specific Features

### 🚗 ১. Chalao Rider App (যাত্রী অ্যাপ):
- **Phone OTP Login / Signup** with profile and emergency contact setup.
- **City & Dropoff search** across Kolkata, Delhi NCR, Mumbai, Bengaluru, and Dhaka.
- **Vehicle Tiers with 8-10% Co-op Transparent Fares**: Bike, Auto, Sedan, Pink (Women-Safe), Green EV, and Share.
- **UPI (GPay / PhonePe / Paytm / BHIM)**, Cash, and Wallet payments.
- **Live GPS Tracking & 4-Digit OTP PIN verification**.
- **National Emergency 112 Hub & Live Trip Sharing**.
- **Co-op Shareholder Center**: Share certificates and patronage rebates.

### 🚖 ২. Chalao Driver Partner App (চালক ককপিট অ্যাপ):
- **Driver KYC Onboarding**: Aadhaar, PAN, Commercial DL, and Vehicle RC verification.
- **Go Online / Offline toggle** with audio chimes.
- **15s Audio Incoming Ride Offer Alert** guaranteeing **90-92% net earnings**.
- **Turn-by-Turn GPS Navigation HUD**.
- **Passenger 4-Digit OTP PIN verification** & Cash/UPI collection confirmation.
- **Earnings & Instant UPI Payouts**: Direct bank withdraw to driver's UPI ID.
- **Driver Fatigue Monitor**: Rest alerts after 4+ hours of driving.

### 🏛️ ৩. Chalao Admin & Dispatch Desk (অ্যাডমিন অ্যাপ):
- **Live Fleet Map & Dispatch Radar**.
- **Driver KYC Verification Queue** (Approve / Reject DL & Aadhaar).
- **8-10% Commission Cap Engine** & Dynamic Pricing Rules.
- **National Emergency 112 SOS Incident Dispatch Desk**.
- **Cooperative Financial Transparency Ledger & MSCS Act Ballot Management**.

---

## 🛠️ Developer Commands

### 1. Run Web Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for Web Hub, `/rider` for Rider App, `/driver` for Driver App, and `/admin` for Admin Desk.

### 2. Build All 3 Apps
```bash
npm run build:all
```

### 3. Open in Android Studio or Xcode
```bash
# Open Rider App
npm run rider:android
npm run rider:ios

# Open Driver App
npm run driver:android
npm run driver:ios

# Open Admin App
npm run admin:android
npm run admin:ios
```

---

## 📄 License & Governance
Operated under Cooperative Principles & Multi-State Co-operative Societies Act, 2002.  
© 2026 Chalao Cooperative Society Ltd. All rights reserved.
