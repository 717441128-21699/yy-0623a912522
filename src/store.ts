import { create } from 'zustand';

interface AlertItem {
  id: string;
  cardId: string;
  customerName: string;
  projectName: string;
  alertType: 'expiring' | 'low_sessions';
  daysLeft: number;
  createdAt: string;
}

interface AppState {
  currentStaff: { id: string; name: string; role: string; storeId: string };
  alerts: AlertItem[];
  unreadAlertCount: number;
  searchKeyword: string;
  searchField: 'phone' | 'name' | 'medicalRecordNo';
  setSearchKeyword: (keyword: string) => void;
  setSearchField: (field: 'phone' | 'name' | 'medicalRecordNo') => void;
  fetchAlerts: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  currentStaff: {
    id: 'staff-001',
    name: '王店长',
    role: 'manager',
    storeId: 'store-001',
  },
  alerts: [],
  unreadAlertCount: 0,
  searchKeyword: '',
  searchField: 'phone',
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setSearchField: (field) => set({ searchField: field }),
  fetchAlerts: async () => {
    try {
      const res = await fetch('/api/alerts');
      const json = await res.json();
      if (json.success) {
        const raw = json.data?.alerts || [];
        const alertsList = raw.map((a: Record<string, unknown>, i: number) => ({
          id: `${a.id}-${a.alertType}-${i}`,
          cardId: String(a.id),
          customerName: String(a.customer_name || a.customerName || ''),
          projectName: String(a.project_name || a.projectName || ''),
          alertType: a.alertType as 'expiring' | 'low_sessions',
          daysLeft: Number(a.daysLeft ?? 0),
          createdAt: String(a.created_at || a.createdAt || ''),
        }));
        set({
          alerts: alertsList,
          unreadAlertCount: alertsList.length,
        });
      }
    } catch {
      set({ alerts: [], unreadAlertCount: 0 });
    }
  },
  refreshAll: async () => {
    const { fetchAlerts } = useAppStore.getState();
    await fetchAlerts();
  },
}));
