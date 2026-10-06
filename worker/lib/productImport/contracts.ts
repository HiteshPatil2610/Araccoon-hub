import type { ProductIdentity, ProductImportRequest, ProductImportPreview } from '../../../shared/productImport';

export interface ProductImportProvider {
  readonly id: ProductImportPreview['provider'];
  preview(input: ProductImportRequest, identity: ProductIdentity): Promise<Omit<ProductImportPreview, 'duplicate'>>;
}
