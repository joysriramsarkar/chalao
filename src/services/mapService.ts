import { LocationPoint, Language } from '../types';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  // Account for Indian city urban road factor ~1.3
  return Math.max(1.0, parseFloat((d * 1.3).toFixed(1)));
}

export function estimateDurationMin(distanceKm: number): number {
  // Average urban speed ~22 km/h + pickup buffer
  const minutes = (distanceKm / 22) * 60 + 3;
  return Math.max(4, Math.round(minutes));
}

export function generateRoutePoints(pickup: LocationPoint, dropoff: LocationPoint, numSteps = 25): [number, number][] {
  const points: [number, number][] = [];
  const startLat = pickup.lat;
  const startLng = pickup.lng;
  const endLat = dropoff.lat;
  const endLng = dropoff.lng;

  const midPointJitterLat = (Math.random() - 0.5) * 0.003;
  const midPointJitterLng = (Math.random() - 0.5) * 0.003;

  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const curveT = Math.sin(t * Math.PI);
    const lat = (1 - t) * startLat + t * endLat + curveT * midPointJitterLat;
    const lng = (1 - t) * startLng + t * endLng + curveT * midPointJitterLng;
    points.push([parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))]);
  }

  return points;
}

export function getTurnByTurnDirections(pickup: LocationPoint, dropoff: LocationPoint, language: Language): string[] {
  if (language === 'bn') {
    return [
      `${pickup.nameBn} থেকে যাত্রা শুরু করুন`,
      'মূল সড়কে উঠে ২০০ মিটার সোজা এগিয়ে যান',
      'পরবর্তী ট্রাফিক সিগন্যালে ডানদিকে ঘুরুন',
      'ফ্লাইওভার / প্রধান এভিনিউ ধরে ১.৫ কিমি চলুন',
      'বামে মোড় নিয়ে সার্ভিস রোডে প্রবেশ করুন',
      `${dropoff.nameBn} আপনার ডানপাশে অবস্থিত`,
      'গন্তব্যে পৌঁছে গেছেন'
    ];
  } else if (language === 'hi') {
    return [
      `${pickup.nameHi} से यात्रा शुरू करें`,
      'मुख्य सड़क पर २०० मीटर सीधे आगे बढ़ें',
      'अगले ट्रैफिक सिग्नल पर दाईं ओर मुड़ें',
      'फ्लाईओवर / मुख्य मार्ग पर १.५ किमी आगे चलें',
      'बाईं ओर मुड़कर सर्विस लेन में प्रवेश करें',
      `${dropoff.nameHi} आपके दाईं ओर स्थित है`,
      'गंतव्य पर सुरक्षित पहुँच गए'
    ];
  }
  return [
    `Start trip from ${pickup.nameEn}`,
    'Head straight on main arterial road for 200m',
    'Turn right at the upcoming traffic intersection',
    'Continue on the main avenue/flyover for 1.5 km',
    'Take the left exit towards the connector link',
    `${dropoff.nameEn} will be on your right`,
    'Arrived safely at destination'
  ];
}
