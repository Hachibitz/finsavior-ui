import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.finsavior',
  appName: 'FinSavior',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '770396493441-m20ptqar465dckq4ur9hg597t6tq7v3o.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    AdMob: {
      androidAppId: 'ca-app-pub-8908695655155734~3818568263',
    },
  },
};

export default config;
