import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_MENU, type MenuItem } from "./menu-data";

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
  date: string; // ISO
  customer?: string;
  items: BillItem[];
  subtotal: number;
  gst: number;
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
  addMenuItem: (i: Omit<MenuItem, "id">) => void;
  updateMenuItem: (id: string, patch: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  saveBill: (b: Omit<Bill, "id" | "billNo" | "date">) => Bill;
  updateSettings: (s: Partial<Settings>) => void;
};

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      menu: DEFAULT_MENU,
      bills: [],
      nextBillNo: 1001,
      settings: {
        restaurantName: "Niyojan Resto",
        address: "Main Road, Maharashtra",
        phone: "+91 00000 00000",
        gstNumber: "",
        footer: "धन्यवाद! पुन्हा भेट द्या — Thank You, Visit Again",
      },
      addMenuItem: (i) =>
        set((s) => ({ menu: [...s.menu, { ...i, id: `m${Date.now()}` }] })),
      updateMenuItem: (id, patch) =>
        set((s) => ({
          menu: s.menu.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      deleteMenuItem: (id) =>
        set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),
      saveBill: (b) => {
        const billNo = get().nextBillNo;
        const bill: Bill = {
          ...b,
          id: `b${Date.now()}`,
          billNo,
          date: new Date().toISOString(),
        };
        set((s) => ({ bills: [bill, ...s.bills], nextBillNo: billNo + 1 }));
        return bill;
      },
      updateSettings: (s) =>
        set((st) => ({ settings: { ...st.settings, ...s } })),
    }),
    { name: "niyojan-data" },
  ),
);
