import { Capacitor } from '@capacitor/core';
import { HealthFitness } from '@capacitor/health-fitness';
import { createNativeHealthBridge } from './health-data.mjs';

globalThis.ForgeNativeHealth = createNativeHealthBridge({
  healthFitness: HealthFitness,
  isSupported: () => Capacitor.isNativePlatform() && ['android', 'ios'].includes(Capacitor.getPlatform())
});
