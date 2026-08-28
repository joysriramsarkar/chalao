import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'coop.chalao.app',
  appName: 'Chalao',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020617',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      backgroundColor: '#020617',
      style: 'DARK',
      overlaysWebView: false,
    },
    Geolocation: {
      enableHighAccuracy: true,
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: 'always',
    scheme: 'Chalao',
  },
};

export default config;
