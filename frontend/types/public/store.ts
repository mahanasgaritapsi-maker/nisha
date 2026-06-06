import type { PaymentMethodType } from "@/types/seller/payment-method";

export type PublicStoreProfile = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  support_contact: string | null;
};

export type PublicProductImage = {
  id: number;
  image_url: string;
  sort_order: number;
};

export type PublicProduct = {
  id: number;
  title: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  images: PublicProductImage[];
};

export type PublicPaymentMethod = {
  id: number;
  type: PaymentMethodType;
  display_name: string;
  card_number: string | null;
  wallet_address: string | null;
  external_url: string | null;
  owner_name: string | null;
  instructions: string | null;
};

export type PublicStorePageResponse = {
  store: PublicStoreProfile;
  products: PublicProduct[];
  payment_methods: PublicPaymentMethod[];
};
