import { config } from './environment';

let app: any = null;
let auth: any = null;
let db: any = null;

try {
  // デモモード時はFirebaseを初期化しない
  if (config.demoMode) {
    console.log('Demo mode: Using mock Firebase objects');
    // デモモード用のモックオブジェクト
    app = { options: { projectId: 'demo-doctorcar' } };
    auth = {
      currentUser: null,
      app: app,
      onAuthStateChanged: () => () => {},
      signInWithEmailAndPassword: () => Promise.reject(new Error('Demo mode')),
      signOut: () => Promise.resolve()
    };
    db = {
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve()
        }),
        get: () => Promise.resolve({ docs: [] })
      })
    };
  } else {
  // 通常モードでのFirebase初期化は遅延ロード
  Promise.resolve().then(async () => {
    try {
      const { initializeApp } = await import('firebase/app');
      const { getAuth, connectAuthEmulator } = await import('firebase/auth');
      const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');
      
      app = initializeApp(config.firebase);
      auth = getAuth(app);
      db = getFirestore(app);

      // エミュレーター接続（開発環境のみ）
      if (config.enableEmulator) {
        try {
          connectAuthEmulator(auth, 'http://localhost:9099');
          connectFirestoreEmulator(db, 'localhost', 8080);
        } catch (error) {
          console.warn('Firebase emulator connection failed:', error);
        }
      }
    } catch (error) {
      console.error('Firebase initialization failed:', error);
    }
  });
  }
} catch (error) {
  console.error('Firebase configuration error:', error);
  // フォールバック用のモックオブジェクト
  app = { options: { projectId: 'fallback-doctorcar' } };
  auth = {
    currentUser: null,
    app: app,
    onAuthStateChanged: () => () => {},
    signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase error')),
    signOut: () => Promise.resolve()
  };
  db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.resolve({ exists: false }),
        set: () => Promise.resolve(),
        update: () => Promise.resolve()
      }),
      get: () => Promise.resolve({ docs: [] })
    })
  };
}

export { auth, db };
export default app;