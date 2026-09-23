import { initializeDeepLinks } from './services/deepLinkService';
initializeDeepLinks().catch((error) => console.error('Deep-link initialization error:', error));
