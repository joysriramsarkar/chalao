import { Driver, Rider, VehicleOption, CoOpMotion, IncidentReport, PricingRule, TripHistoryItem } from '../types';

export const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'bike',
    nameBn: 'চালাও বাইক',
    nameHi: 'चलाओ बाइक',
    nameEn: 'Chalao Bike',
    descBn: 'সবচেয়ে দ্রুত ও সাশ্রয়ী (১ জন যাত্রী)',
    descHi: 'सबसे तेज़ और किफायती (१ सवारी)',
    descEn: 'Fastest & most economical (1 rider)',
    icon: 'Bike',
    baseFare: 25,
    perKm: 9,
    perMin: 0.5,
    capacity: 1,
    commissionRate: 0.08, // 8% co-op fee
    etaMin: 3
  },
  {
    id: 'auto',
    nameBn: 'চালাও অটো (CNG/EV)',
    nameHi: 'चलाओ ऑटो (CNG/EV)',
    nameEn: 'Chalao Auto (CNG/EV)',
    descBn: 'শহুরে চলাচলের প্রিয় বাহন (৩ জন)',
    descHi: 'शहरी आवागमन का पसंदीदा साधन (३ सवारी)',
    descEn: 'City favorite for quick transit (3 riders)',
    icon: 'CarFront',
    baseFare: 35,
    perKm: 12,
    perMin: 0.8,
    capacity: 3,
    commissionRate: 0.09, // 9% co-op fee
    etaMin: 4
  },
  {
    id: 'car',
    nameBn: 'চালাও প্রাইম সেডান',
    nameHi: 'चलाओ प्राइम सेडान',
    nameEn: 'Chalao Prime Sedan',
    descBn: 'এয়ার-কন্ডিশন্ড আরামদায়ক ট্যাক্সি',
    descHi: 'वातानुकूलित आरामदायक कार',
    descEn: 'Air-conditioned comfort taxi (4 riders)',
    icon: 'Car',
    baseFare: 70,
    perKm: 18,
    perMin: 1.5,
    capacity: 4,
    commissionRate: 0.10, // 10% co-op fee
    etaMin: 5
  },
  {
    id: 'pink',
    nameBn: 'চালাও পিংক (নারী-সুরক্ষিত)',
    nameHi: 'चलाओ पिंक (महिला सुरक्षा)',
    nameEn: 'Chalao Pink (Women-Safe)',
    descBn: 'নারী চালক ও নারী যাত্রীদের জন্য বিশেষ সুরক্ষিত',
    descHi: 'महिला चालकों द्वारा केवल महिलाओं के लिए सुरक्षित',
    descEn: 'Dedicated women drivers for female riders',
    icon: 'HeartHandshake',
    baseFare: 30,
    perKm: 11,
    perMin: 0.6,
    capacity: 2,
    commissionRate: 0.05, // 5% subsidized fee
    etaMin: 4
  },
  {
    id: 'share',
    nameBn: 'চালাও শেয়ার (রুট কারপুল)',
    nameHi: 'चलाओ शेयर (कारपूल)',
    nameEn: 'Chalao Share (Carpool)',
    descBn: 'রুট ভাগাভাগি করে ৫০% কম খরচে যাতায়াত',
    descHi: 'मार्ग साझा करके ५०% कम किराए में सफर',
    descEn: 'Shared route for 50% fare savings',
    icon: 'Users',
    baseFare: 20,
    perKm: 7,
    perMin: 0.4,
    capacity: 4,
    commissionRate: 0.08,
    etaMin: 6
  },
  {
    id: 'green',
    nameBn: 'চালাও গ্রিন (ই-ভেহিকেল)',
    nameHi: 'चलाओ ग्रीन (इलेक्ट्रिक)',
    nameEn: 'Chalao Green (Electric EV)',
    descBn: '১০০% পরিবেশবান্ধব ও শব্দহীন ই-বাইক/ই-কার',
    descHi: '१००% पर्यावरण अनुकूल एवं शांत इलेक्ट्रिक सवारी',
    descEn: 'Zero emission green electric ride',
    icon: 'Leaf',
    baseFare: 30,
    perKm: 10,
    perMin: 0.5,
    capacity: 2,
    commissionRate: 0.06,
    etaMin: 5
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'd-kol-01',
    name: 'শুভাশিস রায় (Subhashish Roy)',
    phone: '+91 98301-23456',
    cityId: 'kolkata',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 4.94,
    totalTrips: 1840,
    vehicleType: 'bike',
    vehicleModel: 'Hero Splendor Plus (Black)',
    plateNumber: 'WB 02 AB 4589',
    isOnline: true,
    isBusy: false,
    isMember: true,
    memberId: 'CH-IN-0412',
    lat: 22.5525,
    lng: 88.3530,
    verificationStatus: 'verified',
    todayEarnings: 1450,
    todayTrips: 9,
    patronageAccrued: 380,
    sharesOwned: 10,
    licenseNumber: 'WB02-20180019241',
    aadhaarNumber: 'XXXX-XXXX-8912',
    panNumber: 'ABCDE1234F',
    rcNumber: 'WB-RC-2022-9901',
    upiId: 'subhashish@oksbi',
    walletBalance: 3200
  },
  {
    id: 'd-kol-02',
    name: 'মৌসুমি ব্যানার্জি (Mousumi Banerjee)',
    phone: '+91 98311-87654',
    cityId: 'kolkata',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    rating: 4.98,
    totalTrips: 920,
    vehicleType: 'pink',
    vehicleModel: 'TVS Jupiter 125 (Pink)',
    plateNumber: 'WB 06 EF 1122',
    isOnline: true,
    isBusy: false,
    isMember: true,
    memberId: 'CH-IN-0891',
    lat: 22.5790,
    lng: 88.4350,
    verificationStatus: 'verified',
    todayEarnings: 1680,
    todayTrips: 7,
    patronageAccrued: 440,
    sharesOwned: 15,
    licenseNumber: 'WB06-20200084512',
    aadhaarNumber: 'XXXX-XXXX-4512',
    panNumber: 'BNMPR4512K',
    rcNumber: 'WB-RC-2023-1142',
    upiId: 'mousumi@okaxis',
    walletBalance: 4150
  },
  {
    id: 'd-kol-03',
    name: 'মহম্মদ সেলিম (Md. Salim)',
    phone: '+91 98322-33445',
    cityId: 'kolkata',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 4.88,
    totalTrips: 3410,
    vehicleType: 'auto',
    vehicleModel: 'Bajaj Compact Green LPG Auto',
    plateNumber: 'WB 04 G 7890',
    isOnline: true,
    isBusy: false,
    isMember: true,
    memberId: 'CH-IN-0105',
    lat: 22.5840,
    lng: 88.3440,
    verificationStatus: 'verified',
    todayEarnings: 2150,
    todayTrips: 12,
    patronageAccrued: 580,
    sharesOwned: 20,
    licenseNumber: 'WB04-20160098412',
    aadhaarNumber: 'XXXX-XXXX-9901',
    panNumber: 'SLMPK9901M',
    rcNumber: 'WB-RC-2021-3419',
    upiId: 'salim.auto@paytm',
    walletBalance: 5800
  }
];

export const INITIAL_RIDER: Rider = {
  id: 'r-kol-101',
  name: 'অনির্বাণ মুখার্জি (Anirban Mukherjee)',
  phone: '+91 98300-99887',
  cityId: 'kolkata',
  photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  rating: 4.96,
  isMember: true,
  memberId: 'CH-IN-M109',
  sharesOwned: 5,
  patronagePoints: 420,
  walletBalance: 750,
  emergencyContact: {
    name: 'শ্রেয়সী মুখার্জি (স্ত্রী)',
    phone: '+91 98305-11223',
    relation: 'পরিবার'
  },
  savedPlaces: [
    { id: 'sp-1', label: 'বাড়ি (Home)', address: 'পার্ক স্ট্রিট, কলকাতা', lat: 22.5519, lng: 88.3524 },
    { id: 'sp-2', label: 'অফিস (Office)', address: 'সল্টলেক সেক্টর ৫ (আইটি হাব)', lat: 22.5804, lng: 88.4378 },
    { id: 'sp-3', label: 'বিমানবন্দর (Airport)', address: 'নেতাজি সুভাষচন্দ্র বসু আন্তর্জাতিক বিমানবন্দর (CCU)', lat: 22.6547, lng: 88.4467 }
  ]
};

export const INITIAL_TRIP_HISTORY: TripHistoryItem[] = [
  {
    id: 'CH-TRIP-8821',
    date: '2026-08-28 14:20',
    pickupName: 'পার্ক স্ট্রিট (অ্যালেন পার্ক)',
    dropoffName: 'সল্টলেক সেক্টর ৫ (আইটি হাব)',
    vehicleType: 'bike',
    fare: 145,
    paymentMethod: 'UPI (GPay)',
    status: 'completed',
    driverName: 'শুভাশিস রায় (Subhashish Roy)'
  },
  {
    id: 'CH-TRIP-8790',
    date: '2026-08-27 18:45',
    pickupName: 'হাওড়া রেলওয়ে স্টেশন',
    dropoffName: 'গড়িয়াহাট মোড়',
    vehicleType: 'car',
    fare: 290,
    paymentMethod: 'Cash',
    status: 'completed',
    driverName: 'বিক্রমজিৎ সিং'
  }
];

export const INITIAL_MOTIONS: CoOpMotion[] = [
  {
    id: 'mot-in-01',
    titleBn: '২০২৬ অর্থবছর প্ল্যাটফর্ম কমিশন সর্বোচ্চ ৮%-এ সীমিতকরণ (MSCS Act)',
    titleHi: '२०२६ वित्तीय वर्ष मंच कमीशन अधिकतम ८% तक सीमित करना',
    titleEn: 'Cap Platform Commission to Maximum 8% for FY2026 under MSCS Act',
    descriptionBn: 'চালক ও ডেলিভারি পার্টনারদের আয় সর্বোচ্চ করতে এবং বহুজাতিক কর্পোরেট আধিপত্য রুখতে সমবায়ের কমিশন ৮%-এ নির্ধারণের প্রস্তাব।',
    descriptionHi: 'चालक साथियों की शुद्ध आय बढ़ाने एवं पारदर्शिता सुनिश्चित करने हेतु कमीशन अधिकतम ८% निर्धारित करने का प्रस्ताव।',
    descriptionEn: 'Proposal to cap platform fees at 8% ensuring drivers keep 92% of earnings in accordance with cooperative principles.',
    category: 'commission',
    yesVotes: 3410,
    noVotes: 215,
    abstainVotes: 45,
    totalEligible: 4500,
    deadline: '2026-09-30',
    status: 'active'
  },
  {
    id: 'mot-in-02',
    titleBn: 'সদস্য চালক ও পরিবারের জন্য ₹৫ লাখের ক্যাশলেস স্বাস্থ্য ও দুর্ঘটনা বীমা',
    titleHi: 'सदस्य चालकों एवं परिवारों के लिए ₹५ लाख का कैशलेस स्वास्थ्य एवं दुर्घटना बीमा',
    titleEn: '₹5 Lakh Comprehensive Cashless Health & Accident Welfare Cover for Drivers',
    descriptionBn: 'উদ্বৃত্ত সমবায় তহবিলের ১০% সরাসরি চালক কল্যাণ পুলে জমা হবে যা যেকোনো অনাকাঙ্ক্ষিত চিকিৎসায় তাৎক্ষণিক কভারেজ দেবে।',
    descriptionHi: 'सहकारी अधिशेष से १०% सीधे चालक कल्याण कोष में जाएगा जो ₹५,००,००० तक का तत्काल कैशलेस कवर प्रदान करेगा।',
    descriptionEn: 'Allocate 10% of co-op surplus directly into driver emergency medical and accident fund with ₹5,00,000 cashless hospital cover.',
    category: 'welfare',
    yesVotes: 4120,
    noVotes: 60,
    abstainVotes: 22,
    totalEligible: 4500,
    deadline: '2026-09-25',
    status: 'active'
  },
  {
    id: 'mot-in-03',
    titleBn: 'ইলেকট্রিক ভেহিকেল (EV) রূপান্তরে সমবায় সুদ-মুক্ত চার্জিং সহায়তা ফান্ড',
    titleHi: 'इलेक्ट्रिक वाहन (EV) अपनाने हेतु सहकारी ब्याज-मुक्त चार्जिंग सहायता फंड',
    titleEn: 'Zero-Interest EV Conversion & Solar Charging Subsidies for Driver Members',
    descriptionBn: 'পরিবেশ সুরক্ষায় যেসব চালক সিএনজি বা পেট্রোল থেকে ই-বাইক বা ই-অটোতে শিফট করবেন তাদের সমবায় থেকে বিশেষ ইনসেনটিভ।',
    descriptionHi: 'हरित गतिशीलता को बढ़ावा देने हेतु इलेक्ट्रिक वाहन अपनाने वाले चालकों को विशेष सहकारी प्रोत्साहन।',
    descriptionEn: 'Special co-op incentives and solar battery swapping network discounts for member drivers transitioning to electric vehicles.',
    category: 'technology',
    yesVotes: 3890,
    noVotes: 110,
    abstainVotes: 35,
    totalEligible: 4500,
    deadline: '2026-08-31',
    status: 'passed'
  }
];

export const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    id: 'inc-in-01',
    rideId: 'CH-TRIP-IN-8891',
    reporterRole: 'rider',
    reporterName: 'অঙ্কিতা সেনগুপ্ত (Ankita Sengupta)',
    type: 'route_deviation',
    description: 'মা উড়ালপুলে ট্রাফিক জ্যাম থাকায় চালক বাইপাস রুট ব্যবহার করেছেন। পূর্ব অবহিত করেননি।',
    status: 'resolved',
    timestamp: '2026-08-28 16:30',
    severity: 'low'
  }
];

export const INITIAL_PRICING_RULES: PricingRule[] = [
  { vehicleType: 'bike', baseFare: 25, perKm: 9, perMin: 0.5, minFare: 30, platformCommissionPercent: 8, surgeMultiplier: 1.0 },
  { vehicleType: 'auto', baseFare: 35, perKm: 12, perMin: 0.8, minFare: 45, platformCommissionPercent: 9, surgeMultiplier: 1.0 },
  { vehicleType: 'car', baseFare: 70, perKm: 18, perMin: 1.5, minFare: 90, platformCommissionPercent: 10, surgeMultiplier: 1.0 },
  { vehicleType: 'pink', baseFare: 30, perKm: 11, perMin: 0.6, minFare: 35, platformCommissionPercent: 5, surgeMultiplier: 1.0 },
  { vehicleType: 'share', baseFare: 20, perKm: 7, perMin: 0.4, minFare: 25, platformCommissionPercent: 8, surgeMultiplier: 1.0 },
  { vehicleType: 'green', baseFare: 30, perKm: 10, perMin: 0.5, minFare: 35, platformCommissionPercent: 6, surgeMultiplier: 1.0 },
];
