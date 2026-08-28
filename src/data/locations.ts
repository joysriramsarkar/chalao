import { LocationPoint, CityConfig, CityId } from '../types';

export const INDIAN_CITIES: CityConfig[] = [
  {
    id: 'kolkata',
    nameBn: 'কলকাতা',
    nameHi: 'कोलकाता',
    nameEn: 'Kolkata',
    stateEn: 'West Bengal',
    country: 'India',
    center: [22.5726, 88.3639],
    currency: 'INR',
    currencySymbol: '₹',
    emergencyNumber: '112'
  },
  {
    id: 'delhi',
    nameBn: 'দিল্লি এনসিআর',
    nameHi: 'दिल्ली एनसीआर',
    nameEn: 'Delhi NCR',
    stateEn: 'Delhi / Haryana / UP',
    country: 'India',
    center: [28.6139, 77.2090],
    currency: 'INR',
    currencySymbol: '₹',
    emergencyNumber: '112'
  },
  {
    id: 'mumbai',
    nameBn: 'মুম্বই',
    nameHi: 'मुंबई',
    nameEn: 'Mumbai',
    stateEn: 'Maharashtra',
    country: 'India',
    center: [19.0760, 72.8777],
    currency: 'INR',
    currencySymbol: '₹',
    emergencyNumber: '112'
  },
  {
    id: 'bengaluru',
    nameBn: 'বেঙ্গালুরু',
    nameHi: 'बेंगलुरु',
    nameEn: 'Bengaluru',
    stateEn: 'Karnataka',
    country: 'India',
    center: [12.9716, 77.5946],
    currency: 'INR',
    currencySymbol: '₹',
    emergencyNumber: '112'
  },
  {
    id: 'dhaka',
    nameBn: 'ঢাকা (গ্লোবাল পাইলট)',
    nameHi: 'ढाका (ग्लोबल)',
    nameEn: 'Dhaka (Global)',
    stateEn: 'Dhaka Division',
    country: 'Bangladesh',
    center: [23.7937, 90.4137],
    currency: 'BDT',
    currencySymbol: '৳',
    emergencyNumber: '999'
  }
];

export const CITY_LOCATIONS: LocationPoint[] = [
  // Kolkata Hubs
  {
    id: 'kol_parkst',
    cityId: 'kolkata',
    nameBn: 'পার্ক স্ট্রিট (অ্যালেন পার্ক)',
    nameHi: 'पार्क स्ट्रीट (एलन पार्क)',
    nameEn: 'Park Street',
    areaBn: 'মধ্য কলকাতা',
    areaHi: 'मध्य कोलकाता',
    areaEn: 'Central Kolkata',
    lat: 22.5519,
    lng: 88.3524
  },
  {
    id: 'kol_sector5',
    cityId: 'kolkata',
    nameBn: 'সল্টলেক সেক্টর ৫ (আইটি হাব)',
    nameHi: 'साल्ट लेक सेक्टर ५ (आईटी हब)',
    nameEn: 'Salt Lake Sector V',
    areaBn: 'বিধাননগর, কলকাতা',
    areaHi: 'बिधाननगर, कोलकाता',
    areaEn: 'Bidhannagar, Kolkata',
    lat: 22.5804,
    lng: 88.4378
  },
  {
    id: 'kol_howrah',
    cityId: 'kolkata',
    nameBn: 'হাওড়া রেলওয়ে স্টেশন',
    nameHi: 'हावड़ा रेलवे स्टेशन',
    nameEn: 'Howrah Railway Station',
    areaBn: 'হাওড়া ব্রিজ সংলগ্ন',
    areaHi: 'हावड़ा ब्रिज के पास',
    areaEn: 'Howrah Bridge Terminus',
    lat: 22.5850,
    lng: 88.3426
  },
  {
    id: 'kol_airport',
    cityId: 'kolkata',
    nameBn: 'নেতাজি সুভাষচন্দ্র বসু আন্তর্জাতিক বিমানবন্দর (CCU)',
    nameHi: 'नेताजी सुभाष चंद्र बोस हवाई अड्डा (CCU)',
    nameEn: 'Netaji Subhash Chandra Bose Airport (CCU)',
    areaBn: 'দমদম, কলকাতা',
    areaHi: 'दमदम, कोलकाता',
    areaEn: 'Dum Dum, Kolkata',
    lat: 22.6547,
    lng: 88.4467
  },
  {
    id: 'kol_newtown',
    cityId: 'kolkata',
    nameBn: 'নিউ টাউন ইকো স্পেস',
    nameHi: 'न्यू टाउन इको स्पेस',
    nameEn: 'New Town Eco Space',
    areaBn: 'রাজারহাট, কলকাতা',
    areaHi: 'राजारहाट, कोलकाता',
    areaEn: 'Rajarhat, Kolkata',
    lat: 22.5867,
    lng: 88.4754
  },
  {
    id: 'kol_esplanade',
    cityId: 'kolkata',
    nameBn: 'এসপ্ল্যানেড মেট্রো ও বাস টার্মিনাস',
    nameHi: 'एस्प्लेनेड मेट्रो स्टेशन',
    nameEn: 'Esplanade Metro & Hub',
    areaBn: 'ধর্মতলা, কলকাতা',
    areaHi: 'धर्मतल्ला, कोलकाता',
    areaEn: 'Dharmatala, Kolkata',
    lat: 22.5645,
    lng: 88.3518
  },
  {
    id: 'kol_gariahat',
    cityId: 'kolkata',
    nameBn: 'গড়িয়াহাট মোড়',
    nameHi: 'गरियाहाट क्रॉसिंग',
    nameEn: 'Gariahat Crossing',
    areaBn: 'দক্ষিণ কলকাতা',
    areaHi: 'दक्षिण कोलकाता',
    areaEn: 'South Kolkata',
    lat: 22.5186,
    lng: 88.3653
  },

  // Delhi NCR Hubs
  {
    id: 'del_cp',
    cityId: 'delhi',
    nameBn: 'কনট প্লেস (ইনার সার্কেল)',
    nameHi: 'कनॉट प्लेस (इनर सर्कल)',
    nameEn: 'Connaught Place',
    areaBn: 'সেন্ট্রাল দিল্লি',
    areaHi: 'सेंट्रल दिल्ली',
    areaEn: 'Central Delhi',
    lat: 28.6315,
    lng: 77.2167
  },
  {
    id: 'del_gurgaon',
    cityId: 'delhi',
    nameBn: 'সাইবার হাব, গুরুগ্রাম',
    nameHi: 'साइबर हब, गुरुग्राम',
    nameEn: 'Cyber Hub Gurgaon',
    areaBn: 'ডিএলএফ ফেজ ২',
    areaHi: 'डीएलएफ फेज २',
    areaEn: 'DLF Phase 2, Gurugram',
    lat: 28.4950,
    lng: 77.0895
  },
  {
    id: 'del_noida',
    cityId: 'delhi',
    nameBn: 'সেক্টর ১৮ মেট্রো, নয়ডা',
    nameHi: 'सेक्टर १८ मेट्रो, नोएडा',
    nameEn: 'Sector 18 Noida',
    areaBn: 'গৌতম বুদ্ধ নগর',
    areaHi: 'गौतम बुद्ध नगर',
    areaEn: 'Noida, UP',
    lat: 28.5708,
    lng: 77.3260
  },
  {
    id: 'del_airport',
    cityId: 'delhi',
    nameBn: 'ইন্দিরা গান্ধী আন্তর্জাতিক বিমানবন্দর (T3)',
    nameHi: 'इंदिरा गांधी अंतर्राष्ट्रीय हवाई अड्डा (T3)',
    nameEn: 'IGI Airport Terminal 3',
    areaBn: 'নতুন দিল্লি',
    areaHi: 'नई दिल्ली',
    areaEn: 'New Delhi',
    lat: 28.5562,
    lng: 77.1000
  },

  // Mumbai Hubs
  {
    id: 'mum_bkc',
    cityId: 'mumbai',
    nameBn: 'বান্দ্রা কুরলা কমপ্লেক্স (BKC)',
    nameHi: 'बांद्रा कुर्ला कॉम्प्लेक्स (BKC)',
    nameEn: 'Bandra Kurla Complex (BKC)',
    areaBn: 'বান্দ্রা ইস্ট, মুম্বই',
    areaHi: 'बांद्रा ईस्ट, मुंबई',
    areaEn: 'Bandra East, Mumbai',
    lat: 19.0657,
    lng: 72.8687
  },
  {
    id: 'mum_csmt',
    cityId: 'mumbai',
    nameBn: 'ছত্রপতি শিবাজী মহারাজ টার্মিনাস (CSMT)',
    nameHi: 'छत्रपति शिवाजी महाराज टर्मिनस (CSMT)',
    nameEn: 'CSMT Railway Station',
    areaBn: 'ফোর্ট, দক্ষিণ মুম্বই',
    areaHi: 'फोर्ट, दक्षिण मुंबई',
    areaEn: 'Fort, South Mumbai',
    lat: 18.9401,
    lng: 72.8353
  },
  {
    id: 'mum_andheri',
    cityId: 'mumbai',
    nameBn: 'আন্ধেরি ইস্ট মেট্রো স্টেশন',
    nameHi: 'अंधेरी ईस्ट मेट्रो स्टेशन',
    nameEn: 'Andheri East Metro',
    areaBn: 'ওয়েস্টার্ন এক্সপ্রেস হাইওয়ে',
    areaHi: 'वेस्टर्न एक्सप्रेस हाईवे',
    areaEn: 'Western Express Highway',
    lat: 19.1197,
    lng: 72.8468
  },

  // Bengaluru Hubs
  {
    id: 'blr_koramangala',
    cityId: 'bengaluru',
    nameBn: 'কোরামাঙ্গলা ৫ম ব্লক',
    nameHi: 'कोरमंगला ५वां ब्लॉक',
    nameEn: 'Koramangala 5th Block',
    areaBn: 'দক্ষিণ বেঙ্গালুরু',
    areaHi: 'दक्षिण बेंगलुरु',
    areaEn: 'South Bengaluru',
    lat: 12.9352,
    lng: 77.6245
  },
  {
    id: 'blr_indiranagar',
    cityId: 'bengaluru',
    nameBn: 'ইন্দিরানগর ১০০ ফুট রোড',
    nameHi: 'इंदिरानगर १०० फीट रोड',
    nameEn: 'Indiranagar 100ft Road',
    areaBn: 'পূর্ব বেঙ্গালুরু',
    areaHi: 'पूर्व बेंगलुरु',
    areaEn: 'East Bengaluru',
    lat: 12.9784,
    lng: 77.6408
  },
  {
    id: 'blr_ecity',
    cityId: 'bengaluru',
    nameBn: 'ইলেকট্রনিক সিটি ফেজ ১',
    nameHi: 'इलेक्ट्रॉनिक सिटी फेज १',
    nameEn: 'Electronic City Phase 1',
    areaBn: 'আইটি করিডোর',
    areaHi: 'आईटी कॉरिडोर',
    areaEn: 'IT Corridor, Bengaluru',
    lat: 12.8399,
    lng: 77.6770
  },

  // Dhaka Hubs
  {
    id: 'dhk_gulshan',
    cityId: 'dhaka',
    nameBn: 'গুলশান ২ সার্কেল',
    nameHi: 'गुलशन २ सर्कल',
    nameEn: 'Gulshan 2 Circle',
    areaBn: 'গুলশান, ঢাকা',
    areaHi: 'गुलशन, ढाका',
    areaEn: 'Gulshan, Dhaka',
    lat: 23.7937,
    lng: 90.4137
  },
  {
    id: 'dhk_dhanmondi',
    cityId: 'dhaka',
    nameBn: 'ধানমন্ডি ২৭',
    nameHi: 'धानमंडी २७',
    nameEn: 'Dhanmondi 27',
    areaBn: 'ধানমন্ডি, ঢাকা',
    areaHi: 'धानमंडी, ढाका',
    areaEn: 'Dhanmondi, Dhaka',
    lat: 23.7542,
    lng: 90.3753
  }
];
