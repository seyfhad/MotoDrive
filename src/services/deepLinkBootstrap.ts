import { initializeDeepLinks } from './deepLinkService';

void initializeDeepLinks().catch((error) => {
  console.error('Deep-link initialization error:', error);
});
