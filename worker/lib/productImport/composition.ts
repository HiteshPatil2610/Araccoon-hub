import { createAmazonPageProvider } from './providers/amazonPage/provider';

// Deliberate code selection. Credentials never select a provider or enable fallback.
export const createSelectedProductImportProvider = createAmazonPageProvider;
