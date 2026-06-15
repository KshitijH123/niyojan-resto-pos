import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type MenuItem, type Category } from "./menu-data";

export type BillItem = {
  itemId: string;
  nameMr: string;
  nameEn?: string;
  type: "half" | "full";
  rate: number;
  qty: number;
};

export type Bill = {
  id: string;
  billNo: number;
  billNumber?: string;
  date: string; // ISO
  customer?: string;
  customerName?: string;
  items: BillItem[];
  subtotal: number;
  gst: number;
  gstApplied?: boolean;
  gstPercentage?: number;
  discount: number;
  total: number;
  paymentType: "Cash" | "UPI" | "Card";
};

type AuthState = {
  isAuthed: boolean;
  user: string | null;
  login: (u: string, p: string) => boolean;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthed: false,
      user: null,
      login: (u, p) => {
        if (u && p) {
          set({ isAuthed: true, user: u });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthed: false, user: null }),
    }),
    { name: "niyojan-auth" },
  ),
);

type Settings = {
  restaurantName: string;
  address: string;
  phone: string;
  gstNumber: string;
  footer: string;
};

type DataState = {
  menu: MenuItem[];
  bills: Bill[];
  nextBillNo: number;
  settings: Settings;
  categories: string[];
  categoryEntities: Category[];
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, patch: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  setMenuItems: (items: MenuItem[]) => void;
  setCategoryEntities: (categories: Category[]) => void;
  saveBill: (b: Omit<Bill, "id" | "billNo" | "date">) => Bill;
  setBills: (bills: Bill[]) => void;
  addBill: (bill: Bill) => void;
  updateSettings: (s: Partial<Settings>) => void;
  addCategory: (category: Category) => void;
  renameCategory: (id: string, newName: string) => void;
  deleteCategory: (id: string) => void;
};

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      menu: [],
      categories: [],
      categoryEntities: [],
      bills: [],
      nextBillNo: 1001,
      settings: {
        restaurantName: "Niyojan Resto",
        address: "Main Road, Maharashtra",
        phone: "+91 00000 00000",
        gstNumber: "",
        footer: "धन्यवाद! पुन्हा भेट द्या — Thank You, Visit Again",
      },
      addMenuItem: (item) =>
        set((s) => ({
          menu: [...s.menu, item],
          categories: s.categories.includes(item.category)
            ? s.categories
            : [...s.categories, item.category],
        })),
      updateMenuItem: (id, patch) =>
        set((s) => ({
          menu: s.menu.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      deleteMenuItem: (id) =>
        set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),
      setMenuItems: (items) =>
        set(() => ({ menu: items })),
      setCategoryEntities: (categories) =>
        set(() => ({
          categoryEntities: categories,
          categories: categories.map((category) => category.name),
        })),
      saveBill: (b) => {
        const billNo = get().nextBillNo;
        const bill: Bill = {
          ...b,
          id: `b${Date.now()}`,
          billNo,
          billNumber: `BILL-${String(billNo).padStart(4, "0")}`,
          gstApplied: b.gst > 0,
          gstPercentage: b.gst > 0 ? 5 : 0,
          date: new Date().toISOString(),
        };
        set((s) => ({ bills: [bill, ...s.bills], nextBillNo: billNo + 1 }));
        return bill;
      },
      setBills: (bills) => set(() => ({ bills })),
      addBill: (bill) => set((s) => ({ bills: [bill, ...s.bills] })),
      updateSettings: (s) =>
        set((st) => ({ settings: { ...st.settings, ...s } })),
      addCategory: (category) =>
        set((s) => {
          const exists = s.categoryEntities.some((item) => item.name === category.name);
          if (exists) return s;
          return {
            categoryEntities: [...s.categoryEntities, category],
            categories: [...s.categories, category.name],
          };
        }),
      renameCategory: (id, newName) =>
        set((s) => ({
          categoryEntities: s.categoryEntities.map((category) =>
            category.id === id ? { ...category, name: newName } : category,
          ),
          categories: s.categories.map((name) => {
            const matching = s.categoryEntities.find((category) => category.name === name && category.id === id);
            return matching ? newName : name;
          }),
          menu: s.menu.map((m) =>
            m.categoryId === id ? { ...m, category: newName, categoryId: id } : m,
          ),
        })),
      deleteCategory: (id) =>
        set((s) => ({
          categoryEntities: s.categoryEntities.filter((category) => category.id !== id),
          categories: s.categoryEntities.filter((category) => category.id !== id).map((category) => category.name),
          menu: s.menu.filter((m) => m.categoryId !== id),
        })),
    }),
    { name: "niyojan-data" },
  ),
);
