// 出動範囲内（基地病院から6km以内）の事案発生場所
export interface SceneLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  locationType: 'residential' | 'commercial' | 'industrial' | 'public' | 'transport';
  landmarks: string[];
  accessNotes?: string;
  distance?: number; // 基地病院からの距離（km）
}

// 基地病院の座標
export const BASE_HOSPITAL = {
  latitude: 35.701835,
  longitude: 139.763417,
  name: "基地病院"
};

export const sceneLocations: SceneLocation[] = [
  {
    id: "scene-001",
    name: "東京大学本郷キャンパス",
    latitude: 35.7122,
    longitude: 139.7629,
    address: "東京都文京区本郷7-3-1",
    locationType: "public",
    landmarks: ["安田講堂", "赤門", "正門"],
    accessNotes: "正門から入構可能"
  },
  {
    id: "scene-002", 
    name: "上野公園",
    latitude: 35.7156,
    longitude: 139.7745,
    address: "東京都台東区上野公園",
    locationType: "public",
    landmarks: ["上野動物園", "国立博物館", "西郷隆盛像"],
    accessNotes: "複数の入口あり、噴水広場が目印"
  },
  {
    id: "scene-003",
    name: "秋葉原駅周辺",
    latitude: 35.6984,
    longitude: 139.7732,
    address: "東京都千代田区外神田1丁目",
    locationType: "commercial",
    landmarks: ["秋葉原駅", "ヨドバシカメラ", "電気街"],
    accessNotes: "駅前ロータリー利用可能"
  },
  {
    id: "scene-004",
    name: "皇居東御苑",
    latitude: 35.6862,
    longitude: 139.7571,
    address: "東京都千代田区千代田1-1",
    locationType: "public",
    landmarks: ["大手門", "三の丸尚蔵館", "本丸跡"],
    accessNotes: "大手門から入場、警備員に要連絡"
  },
  {
    id: "scene-005",
    name: "銀座中央通り",
    latitude: 35.6706,
    longitude: 139.7641,
    address: "東京都中央区銀座4丁目",
    locationType: "commercial",
    landmarks: ["銀座四丁目交差点", "三越", "和光"],
    accessNotes: "歩行者天国時間に注意"
  },
  {
    id: "scene-006",
    name: "東京スカイツリー周辺",
    latitude: 35.7101,
    longitude: 139.8107,
    address: "東京都墨田区押上1丁目",
    locationType: "commercial",
    landmarks: ["東京スカイツリー", "ソラマチ", "押上駅"],
    accessNotes: "観光バス駐車場利用可能"
  },
  {
    id: "scene-007",
    name: "日本橋地区",
    latitude: 35.6833,
    longitude: 139.7731,
    address: "東京都中央区日本橋1丁目",
    locationType: "commercial",
    landmarks: ["日本橋", "三越本店", "コレド日本橋"],
    accessNotes: "首都高下、道路状況に注意"
  },
  {
    id: "scene-008",
    name: "浅草寺境内",
    latitude: 35.7148,
    longitude: 139.7967,
    address: "東京都台東区浅草2-3-1",
    locationType: "public",
    landmarks: ["雷門", "五重塔", "本堂"],
    accessNotes: "仲見世通りは車両進入不可"
  },
  {
    id: "scene-009",
    name: "神田駅周辺",
    latitude: 35.6918,
    longitude: 139.7708,
    address: "東京都千代田区内神田3丁目",
    locationType: "commercial",
    landmarks: ["神田駅", "神田明神", "万世橋"],
    accessNotes: "駅前タクシー乗り場利用可能"
  },
  {
    id: "scene-010",
    name: "後楽園・東京ドーム",
    latitude: 35.7056,
    longitude: 139.7523,
    address: "東京都文京区後楽1丁目",
    locationType: "public",
    landmarks: ["東京ドーム", "後楽園遊園地", "ラクーア"],
    accessNotes: "イベント開催時は交通規制あり"
  },
  {
    id: "scene-011",
    name: "新宿区役所周辺",
    latitude: 35.6938,
    longitude: 139.7035,
    address: "東京都新宿区歌舞伎町1丁目",
    locationType: "public",
    landmarks: ["新宿区役所", "新宿中央公園", "都庁"],
    accessNotes: "区役所駐車場利用可能"
  },
  {
    id: "scene-012",
    name: "築地場外市場",
    latitude: 35.6654,
    longitude: 139.7707,
    address: "東京都中央区築地4丁目",
    locationType: "commercial",
    landmarks: ["築地本願寺", "場外市場", "築地川公園"],
    accessNotes: "早朝は市場関係車両に注意"
  },
  {
    id: "scene-013",
    name: "錦糸町駅前",
    latitude: 35.6967,
    longitude: 139.8147,
    address: "東京都墨田区江東橋3丁目",
    locationType: "transport",
    landmarks: ["錦糸町駅", "アルカキット", "オリナス"],
    accessNotes: "南口ロータリー利用推奨"
  },
  {
    id: "scene-014",
    name: "品川区役所周辺",
    latitude: 35.6092,
    longitude: 139.7301,
    address: "東京都品川区広町2丁目",
    locationType: "public",
    landmarks: ["品川区役所", "しながわ中央公園"],
    accessNotes: "区役所正面駐車場利用可能"
  },
  {
    id: "scene-015",
    name: "亀戸天神社",
    latitude: 35.6970,
    longitude: 139.8256,
    address: "東京都江東区亀戸3-6-1",
    locationType: "public",
    landmarks: ["亀戸天神社", "スカイツリー展望", "藤の花"],
    accessNotes: "参拝者駐車場あり（祭事時除く）"
  }
];

// 基地病院からの距離を計算する関数
export const calculateDistanceFromBase = (lat: number, lon: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat - BASE_HOSPITAL.latitude) * Math.PI / 180;
  const dLon = (lon - BASE_HOSPITAL.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(BASE_HOSPITAL.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 6km以内の事案場所のみを取得
export const getSceneLocationsWithinRange = (maxDistance: number = 6): SceneLocation[] => {
  return sceneLocations
    .map(location => ({
      ...location,
      distance: calculateDistanceFromBase(location.latitude, location.longitude)
    }))
    .filter(location => location.distance! <= maxDistance)
    .sort((a, b) => a.distance! - b.distance!);
};

// 事案タイプ別の場所を取得
export const getSceneLocationsByType = (type: string): SceneLocation[] => {
  return sceneLocations.filter(location => location.locationType === type);
};

// ランダムな事案場所を取得（6km以内）
export const getRandomSceneLocation = (): SceneLocation => {
  const validLocations = getSceneLocationsWithinRange(6);
  const randomIndex = Math.floor(Math.random() * validLocations.length);
  return validLocations[randomIndex];
};