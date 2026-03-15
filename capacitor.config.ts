import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pt.questeduca.app',
  appName: 'QuestEduca',
  webDir: 'dist',
  server: {
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
