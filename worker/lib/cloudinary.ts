import { sha1Hex } from './crypto';

// Direct-to-Cloudinary signed uploads. The browser asks the API for a short-
// lived signature, uploads the file straight to Cloudinary (the signed upload
// preset enforces formats and the 8 MB limit, and Cloudinary re-encodes on
// delivery), then saves the returned public_id/secure_url on the product.
// The API only accepts images from this cloud and folder.

export const IMAGE_FOLDER = 'araccoon-hub/products';

export interface ImageStore {
  readonly configured: boolean;
  signUpload(): Promise<{ cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string; uploadPreset: string }>;
  isOwnImage(url: string, publicId: string | null): boolean;
  deliveryUrl(publicId: string): string;
  destroy(publicId: string): Promise<boolean>;
}

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string; uploadPreset: string };

async function signParams(params: Record<string, string | number>, apiSecret: string): Promise<string> {
  const toSign = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return sha1Hex(`${toSign}${apiSecret}`);
}

export function cloudinaryStore(cfg: CloudinaryConfig | null, fetcher: typeof fetch = fetch): ImageStore {
  return {
    configured: cfg !== null,
    async signUpload() {
      if (!cfg) throw new Error('Image uploads are not configured (CLOUDINARY_* settings).');
      const timestamp = Math.floor(Date.now() / 1000);
      const params = { folder: IMAGE_FOLDER, timestamp, upload_preset: cfg.uploadPreset };
      return {
        cloudName: cfg.cloudName,
        apiKey: cfg.apiKey,
        timestamp,
        folder: IMAGE_FOLDER,
        uploadPreset: cfg.uploadPreset,
        signature: await signParams(params, cfg.apiSecret),
      };
    },
    isOwnImage(url, publicId) {
      if (!cfg || !publicId || !publicId.startsWith(`${IMAGE_FOLDER}/`)) return false;
      try {
        const u = new URL(url);
        return u.protocol === 'https:' && u.hostname === 'res.cloudinary.com'
          && u.pathname.startsWith(`/${cfg.cloudName}/image/upload/`) && u.pathname.includes(`/${publicId}`);
      } catch {
        return false;
      }
    },
    deliveryUrl(publicId) {
      // f_auto/q_auto: Cloudinary re-encodes to an optimal safe format; c_limit caps size.
      return `https://res.cloudinary.com/${cfg?.cloudName}/image/upload/f_auto,q_auto,c_limit,w_1200/${publicId}`;
    },
    async destroy(publicId) {
      if (!cfg || !publicId.startsWith(`${IMAGE_FOLDER}/`)) return false;
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await signParams({ public_id: publicId, timestamp }, cfg.apiSecret);
      const body = new FormData();
      body.set('public_id', publicId);
      body.set('timestamp', String(timestamp));
      body.set('api_key', cfg.apiKey);
      body.set('signature', signature);
      const res = await fetcher(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`, { method: 'POST', body, signal: AbortSignal.timeout(5000) });
      return res.ok;
    },
  };
}
