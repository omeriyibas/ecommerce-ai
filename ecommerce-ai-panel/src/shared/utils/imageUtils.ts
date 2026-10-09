import { config } from '../config/env';

/**
 * Backend'den gelen relative image URL'ini tam URL'ye çevirir
 * @param imageUrl - Backend'den gelen relative URL (örn: /uploads/categories/image.jpg)
 * @returns Tam URL (örn: http://localhost:8000/uploads/categories/image.jpg)
 */
export const getFullImageUrl = (imageUrl?: string): string | null => {
  if (!imageUrl) {
    return null;
  }

  // Eğer zaten tam URL ise (http/https ile başlıyorsa) olduğu gibi döndür
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Backend base URL'ini al
  const backendBaseUrl = config.api.baseURL.replace('/api', ''); // /api kısmını çıkar
  
  // Relative URL'i tam URL'ye çevir
  return `${backendBaseUrl}${imageUrl}`;
};
