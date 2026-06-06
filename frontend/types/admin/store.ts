export type AdminStoreListItem = {
  id: number;
  name: string;
  slug: string;
  owner_email: string;
  is_active: boolean;
  product_count: number;
  order_count: number;
  created_at: string;
};

export type AdminStoreActionResponse = {
  message: string;
  store: AdminStoreListItem;
};
