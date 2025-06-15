// 東京都心部の救急対応病院データ
export interface EmergencyHospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  emergencyLevel: 'primary' | 'secondary' | 'tertiary';
  specialties: string[];
  hasER: boolean;
  hasICU: boolean;
  acceptsTrauma: boolean;
  distance?: number; // 現在地からの距離（km）
}

export const emergencyHospitals: EmergencyHospital[] = [
  {
    id: "hospital-001",
    name: "東京大学医学部附属病院",
    latitude: 35.7016,
    longitude: 139.7658,
    address: "東京都文京区本郷7-3-1",
    phone: "03-3815-5411",
    emergencyLevel: "tertiary",
    specialties: ["救急科", "外科", "内科", "循環器科", "脳神経外科"],
    hasER: true,
    hasICU: true,
    acceptsTrauma: true
  },
  {
    id: "hospital-002", 
    name: "順天堂大学医学部附属順天堂医院",
    latitude: 35.7022,
    longitude: 139.7644,
    address: "東京都文京区本郷3-1-3",
    phone: "03-3813-3111",
    emergencyLevel: "tertiary",
    specialties: ["救急科", "外科", "内科", "整形外科", "脳神経外科"],
    hasER: true,
    hasICU: true,
    acceptsTrauma: true
  },
  {
    id: "hospital-003",
    name: "東京医科歯科大学医学部附属病院",
    latitude: 35.7024,
    longitude: 139.7635,
    address: "東京都文京区湯島1-5-45",
    phone: "03-3813-6111",
    emergencyLevel: "tertiary",
    specialties: ["救急科", "外科", "内科", "循環器科"],
    hasER: true,
    hasICU: true,
    acceptsTrauma: true
  },
  {
    id: "hospital-004",
    name: "日本医科大学付属病院",
    latitude: 35.7069,
    longitude: 139.7533,
    address: "東京都文京区千駄木1-1-5",
    phone: "03-3822-2131",
    emergencyLevel: "secondary",
    specialties: ["救急科", "外科", "内科", "小児科"],
    hasER: true,
    hasICU: true,
    acceptsTrauma: true
  },
  {
    id: "hospital-005",
    name: "慈恵会医科大学附属病院",
    latitude: 35.6678,
    longitude: 139.7456,
    address: "東京都港区西新橋3-25-8",
    phone: "03-3433-1111",
    emergencyLevel: "tertiary",
    specialties: ["救急科", "外科", "内科", "循環器科", "脳神経外科"],
    hasER: true,
    hasICU: true,
    acceptsTrauma: true
  },
  {
    id: "hospital-006",
    name: "聖路加国際病院",
    latitude: 35.6724,
    longitude: 139.7745,
    address: "東京都中央区明石町9-1",
    phone: "03-3541-5151",
    emergencyLevel: "secondary",
    specialties: ["救急科", "外科", "内科", "産婦人科"],
    hasER: true,
    hasICU: true,
    acceptsTrauma: true
  },
  {
    id: "hospital-007",
    name: "東京都立墨東病院",
    latitude: 35.7118,
    longitude: 139.8267,
    address: "東京都墨田区江東橋4-23-15",
    phone: "03-3633-6151",
    emergencyLevel: "tertiary",
    specialties: ["救急科", "外科", "内科", "外傷科", "熱傷科"],
    hasER: true,
    hasICU: true,
    acceptsTrauma: true
  },
  {
    id: "hospital-008",
    name: "国立国際医療研究センター病院",
    latitude: 35.7011,
    longitude: 139.7280,
    address: "東京都新宿区戸山1-21-1",
    phone: "03-3202-7181",
    emergencyLevel: "tertiary",
    specialties: ["救急科", "外科", "内科", "感染症科"],
    hasER: true,
    hasICU: true,
    acceptsTrauma: true
  },
  {
    id: "hospital-009",
    name: "東京医科大学病院",
    latitude: 35.6959,
    longitude: 139.7254,
    address: "東京都新宿区西新宿6-7-1",
    phone: "03-3342-6111",
    emergencyLevel: "secondary",
    specialties: ["救急科", "外科", "内科", "循環器科"],
    hasER: true,
    hasICU: true,
    acceptsTrauma: true
  },
  {
    id: "hospital-010",
    name: "虎の門病院",
    latitude: 35.6694,
    longitude: 139.7478,
    address: "東京都港区虎ノ門2-2-2",
    phone: "03-3588-1111",
    emergencyLevel: "secondary",
    specialties: ["救急科", "外科", "内科", "循環器科"],
    hasER: true,
    hasICU: true,
    acceptsTrauma: false
  }
];

// 現在地から近い病院を取得する関数
export const getNearbyHospitals = (
  currentLat: number, 
  currentLon: number, 
  maxDistance: number = 10 // km
): EmergencyHospital[] => {
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return emergencyHospitals
    .map(hospital => ({
      ...hospital,
      distance: calculateDistance(currentLat, currentLon, hospital.latitude, hospital.longitude)
    }))
    .filter(hospital => hospital.distance! <= maxDistance)
    .sort((a, b) => a.distance! - b.distance!);
};

// 救急レベルでフィルタリング
export const getHospitalsByEmergencyLevel = (level: 'primary' | 'secondary' | 'tertiary'): EmergencyHospital[] => {
  return emergencyHospitals.filter(hospital => hospital.emergencyLevel === level);
};

// 特定の専門科目を持つ病院を取得
export const getHospitalsBySpecialty = (specialty: string): EmergencyHospital[] => {
  return emergencyHospitals.filter(hospital => 
    hospital.specialties.some(s => s.includes(specialty))
  );
};