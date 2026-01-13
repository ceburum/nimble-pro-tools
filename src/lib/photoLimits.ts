// Photo and storage limits configuration

export const PHOTO_LIMITS = {
  BASE_MAX_PHOTOS_PER_PROJECT: 10,
  PRO_MAX_PHOTOS_PER_PROJECT: 50,
  BASE_STORAGE_SOFT_CAP_MB: 50,
  PRO_STORAGE_SOFT_CAP_MB: 500,
} as const;

export const IMAGE_COMPRESSION = {
  MAX_DIMENSION: 1080,
  QUALITY: 0.75,
} as const;

/**
 * Get the max photos allowed per project based on Pro status
 */
export function getMaxPhotosPerProject(isProEnabled: boolean): number {
  return isProEnabled ? PHOTO_LIMITS.PRO_MAX_PHOTOS_PER_PROJECT : PHOTO_LIMITS.BASE_MAX_PHOTOS_PER_PROJECT;
}

/**
 * Get storage cap in MB based on Pro status
 */
export function getStorageCapMB(isProEnabled: boolean): number {
  return isProEnabled ? PHOTO_LIMITS.PRO_STORAGE_SOFT_CAP_MB : PHOTO_LIMITS.BASE_STORAGE_SOFT_CAP_MB;
}

/**
 * Estimate storage used by base64 data URLs in MB
 */
export function estimateStorageMB(dataUrls: string[]): number {
  const totalChars = dataUrls.reduce((sum, url) => sum + url.length, 0);
  // Base64 is ~33% larger than binary, so divide by 1.33 to get approximate bytes
  const estimatedBytes = (totalChars * 3) / 4;
  return estimatedBytes / (1024 * 1024);
}

/**
 * Check if user is approaching storage limit
 */
export function isNearStorageLimit(usedMB: number, isProEnabled: boolean): boolean {
  const cap = getStorageCapMB(isProEnabled);
  return usedMB >= cap * 0.8;
}

/**
 * Check if user has exceeded storage limit
 */
export function hasExceededStorageLimit(usedMB: number, isProEnabled: boolean): boolean {
  const cap = getStorageCapMB(isProEnabled);
  return usedMB >= cap;
}
