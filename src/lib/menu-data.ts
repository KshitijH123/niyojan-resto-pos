export type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export type MenuItem = {
  id: string;
  nameMr: string;
  nameEn?: string;
  category: string;
  categoryId?: string;
  half?: number;
  full: number;
  createdAt?: string;
};
