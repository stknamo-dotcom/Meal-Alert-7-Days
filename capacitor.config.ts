import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mealalert.app',
  appName: 'Remix: Meal Alert 7 Days',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
