export type MainCategory = 'after-effects' | 'premiere-pro' | 'pro-essentials';

export type SubCategory =
  // After Effects
  | 'ae-presets'
  | 'ae-plugins'
  | 'ae-scripts'
  // Premiere Pro
  | 'pr-plugins'
  | 'mogrt-files'
  | 'pr-presets'
  // Pro Essentials
  | 'bgms'
  | 'sfx'
  | 'overlays'
  | 'animated-emojis'
  | 'raw-videos';

export interface CategoryMeta {
  id: MainCategory;
  name: string;
  description: string;
  subcategories: {
    id: SubCategory;
    name: string;
    description: string;
  }[];
}

export interface DownloadFile {
  id: string;
  name: string;
  size: string;
  type: string;
  filename: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  mainCategory: MainCategory;
  subcategory: SubCategory;
  categoryLabel: string;
  shortDescription: string;
  detailedDescription: string;
  price: number; // in INR (₹)
  originalPrice?: number;
  softwareCompatibility: string[];
  fileFormat: string;
  fileSize: string;
  whatsIncluded: string[];
  installationInstructions: string[];
  isAvailable: boolean;
  downloadFiles: DownloadFile[];
  artVariant: 'text' | 'overlays' | 'sfx' | 'bundle';
  artIndex: string;
  kicker: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
