export type Customer = {
  id: number;
  email: string | null;
  phone: string | null;
  full_name: string;
};

export type CustomerRegisterRequest = {
  email?: string;
  phone?: string;
  password: string;
  full_name: string;
};

export type CustomerLoginRequest = {
  login: string;
  password: string;
};

export type CustomerTokenResponse = {
  access_token: string;
  token_type: string;
  customer: Customer;
};
