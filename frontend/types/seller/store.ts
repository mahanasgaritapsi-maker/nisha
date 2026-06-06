export type Store = {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  support_contact: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StoreUpdate = {
  name?: string;
  slug?: string;
  description?: string | null;
  logo_url?: string | null;
  phone?: string | null;
  support_contact?: string | null;
  is_active?: boolean;
};
