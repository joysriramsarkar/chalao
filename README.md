# Chalao (চালাও • चलाओ) 🚖
> **“যারা চালায়, যারা চড়ে, তারাই মালিক।”**  
> *“जो चलाते हैं, जो बैठते हैं, वही मालिक हैं।”*  
> *“Those who drive, those who ride, are the owners.”*

**Chalao** is a next-generation **Democratic Cooperative Ride-Sharing Platform** designed for India and South Asia, based on the Multi-State Co-operative Societies Act, 2002 and MoRTH Aggregator Guidelines.

---

## 🌟 Key Features

- **🏛️ Democratic Member Governance**: “One Member, One Vote” democratic e-voting system, digital share certificates, and transparent patronage surplus dividend distribution.
- **💰 8-10% Transparent Commission**: Drivers retain **90-92%** of their gross earnings, breaking corporate aggregator monopolies.
- **🇮🇳 Indian Urban Context**: Hotspots and live routing across **Kolkata, Delhi NCR, Mumbai, Bengaluru**, and global hubs like **Dhaka**.
- **💳 Multi-Mode Payments**: Instant **UPI (GPay / PhonePe / Paytm / BHIM)**, Cash on Trip, Co-op Chalao Wallet, and RuPay Card.
- **🛡️ National Emergency 112 Hub**: 1-click Emergency 112, 1091 Women Safety Helpline, Fake Call Simulator, and Live GPS Trip Sharing.
- **🌐 Trilingual Support**: Native **বাংলা (Bengali)**, **हिंदी (Hindi)**, and **English (EN)**.
- **📱 5 Unified Portals**:
  1. Rider Web & Mobile App (যাত্রী)
  2. Driver Cockpit & Navigation HUD (চালক)
  3. Co-op Member Governance & Shareholder Center (সমবায় গভর্নেন্স)
  4. Admin Dispatch & KYC Desk (অ্যাডমিন)
  5. Side-by-Side Dual Simulator (ডুয়াল সিমুলেটর)

---

## 📱 Mobile Applications

- **Android Native Project**: Located in [`android/`](./android) with ready-to-install debug APK [`Chalao-v1.0.0-debug.apk`](./Chalao-v1.0.0-debug.apk).
- **Apple iOS Project**: Located in [`ios/App/`](./ios/App) for Xcode & TestFlight deployment.
- **Progressive Web App (PWA)**: Standalone mobile app installation from any browser via [`public/manifest.json`](./public/manifest.json) & [`public/sw.js`](./public/sw.js).

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Web Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

### 3. Build & Static Export
```bash
npm run build
```

### 4. Sync & Run Mobile Apps
```bash
# Sync web bundle with Android & iOS
npm run cap:sync

# Open in Android Studio
npx cap open android

# Open in Xcode (macOS)
npx cap open ios
```

---

## 📄 License & Governance
Operated under Cooperative Principles & Multi-State Co-operative Societies Bylaws.  
© 2026 Chalao Cooperative Society Ltd. All rights reserved.
