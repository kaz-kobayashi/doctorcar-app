export const CASE_STATUS = {
  DISPATCHED: 'dispatched',      // 出動中
  ON_SCENE: 'on_scene',         // 現場活動中
  TRANSPORTING: 'transporting', // 搬送中
  COMPLETED: 'completed'        // 完了
} as const;

export const USER_ROLES = {
  DOCTOR_CAR: 'doctor_car',
  HOSPITAL: 'hospital'
} as const;

export const VITAL_RANGES = {
  HR: { min: 40, max: 200 },
  BP_S: { min: 70, max: 250 },
  BP_D: { min: 40, max: 150 },
  SPO2: { min: 70, max: 100 }
} as const;

export const LOCATION_UPDATE_INTERVAL = parseInt(
  import.meta.env.VITE_LOCATION_UPDATE_INTERVAL || '10000'
);

export const MESSAGE_PAGINATION_SIZE = 50;

export const PRESET_MESSAGES = {
  DOCTOR_CAR: [
    '現場到着しました',
    '患者搬送準備完了',
    '病院へ向かいます',
    '到着予定時刻をお知らせします',
    '追加の医療資源が必要です'
  ],
  HOSPITAL: [
    '受け入れ準備完了',
    'CT室準備済み',
    '手術室待機中',
    '血液検査準備済み',
    '専門医に連絡済み'
  ]
};