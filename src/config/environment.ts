// 環境別設定
const environments = {
  development: {
    firebase: {
      // 開発環境用Firebase設定
      apiKey: "demo-api-key",
      authDomain: "demo-doctorcar.firebaseapp.com",
      projectId: "demo-doctorcar",
      storageBucket: "demo-doctorcar.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:demo"
    },
    enableEmulator: true,
    enableLogging: true
  },
  production: {
    firebase: {
      // 本番環境用Firebase設定（実際のプロジェクトに置き換え）
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-doctorcar.firebaseapp.com",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-doctorcar",
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-doctorcar.appspot.com",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:demo"
    },
    enableEmulator: false,
    enableLogging: false
  },
  demo: {
    firebase: {
      // デモ環境用設定
      apiKey: "demo-api-key",
      authDomain: "demo-doctorcar.firebaseapp.com",
      projectId: "demo-doctorcar",
      storageBucket: "demo-doctorcar.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:demo"
    },
    enableEmulator: false,
    enableLogging: true,
    demoMode: true
  }
};

const currentEnv = import.meta.env.MODE as keyof typeof environments;
const isDemoMode = import.meta.env.VITE_MODE === 'demo' || currentEnv === 'demo';

console.log('Environment check:', {
  MODE: import.meta.env.MODE,
  VITE_MODE: import.meta.env.VITE_MODE,
  currentEnv,
  isDemoMode,
  allEnvVars: import.meta.env
});

export const config = {
  ...(environments[currentEnv] || environments.production),
  demoMode: isDemoMode
};