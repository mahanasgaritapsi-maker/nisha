export type ProductImage = {
  id: number;
  image_url: string;
  sort_order: number;
};

export type Product = {
  id: number;
  store_id: number;
  title: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  is_active: boolean;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
};

export type ProductCreate = {
  title: string;
  description?: string | null;
  price: number | string;
  stock_quantity?: number;
  is_active?: boolean;
  image_urls?: string[] | null;
};

export type ProductUpdate = {
  title?: string;
  description?: string | null;
  price?: number | string;
  stock_quantity?: number;
  is_active?: boolean;
  image_urls?: string[] | null;
};
