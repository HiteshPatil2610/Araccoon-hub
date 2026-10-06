import type { ProductImportProvider } from '../../contracts';

/** Activation boundary only: implement and live-test the official client first. */
export function createAmazonApiProvider(): ProductImportProvider {
  return {
    id: 'amazon-api',
    async preview() {
      throw new Error('Amazon API adapter is not configured or implemented yet.');
    },
  };
}
