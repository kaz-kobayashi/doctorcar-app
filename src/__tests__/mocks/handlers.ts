import { rest } from 'msw';

export const handlers = [
  // Firebase Authentication モック
  rest.post(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', 
    (req, res, ctx) => {
      const { email, password } = req.body as any;
      
      if (email === 'doctor@test.com' && password === 'testpass123') {
        return res(
          ctx.json({
            kind: 'identitytoolkit#VerifyPasswordResponse',
            localId: 'doctor-001',
            email: 'doctor@test.com',
            displayName: '山田 太郎',
            idToken: 'mock-id-token-doctor-001',
            registered: true,
            refreshToken: 'mock-refresh-token-doctor-001',
            expiresIn: '3600'
          })
        );
      }
      
      return res(
        ctx.status(400),
        ctx.json({
          error: {
            code: 400,
            message: 'INVALID_PASSWORD'
          }
        })
      );
    }
  ),
  
  // Geolocation API モック
  rest.get('/api/geolocation', (req, res, ctx) => {
    return res(
      ctx.json({
        coords: {
          latitude: 35.658584,
          longitude: 139.701442,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      })
    );
  })
];