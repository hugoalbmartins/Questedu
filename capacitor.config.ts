import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pt.questeduca.app',
  appName: 'QuestEduca',
  webDir: 'dist',
  server: {
    url: 'https://381d72f5-897a-457e-979e-5888fd33045b.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'QuestEduca',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
