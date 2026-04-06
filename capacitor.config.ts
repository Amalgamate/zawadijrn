import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ke.co.zawadijunioracademy.sms',
  appName: 'Zawadi SMS',
  webDir: 'build',
  // server block removed — production APK loads from built files and calls Cloud Run directly
};

export default config;
