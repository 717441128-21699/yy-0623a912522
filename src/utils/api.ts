const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export const api = {
  searchCustomers: async (keyword: string, field: string) => {
    const data = await request<{ customers: any[] }>(`/customers/search?keyword=${encodeURIComponent(keyword)}&field=${field}`);
    return data.customers;
  },

  getCustomerCards: async (id: string) => {
    const data = await request<{ cards: any[] }>(`/customers/${id}/cards`);
    return data.cards;
  },

  getCardDetail: async (id: string) => {
    const data = await request<{ card: any; history: any[] }>(`/cards/${id}`);
    return data;
  },

  createException: async (id: string, data: unknown) => {
    const result = await request<{ card: any }>(`/cards/${id}/exception`, { method: 'POST', body: JSON.stringify(data) });
    return result.card;
  },

  getAppointments: async (date?: string) => {
    const data = await request<{ appointments: any[] }>(`/appointments${date ? `?date=${date}` : ''}`);
    return data.appointments;
  },

  createAppointment: async (data: unknown) => {
    const result = await request<{ appointment: any }>(`/appointments`, { method: 'POST', body: JSON.stringify(data) });
    return result.appointment;
  },

  verifyAppointment: async (id: string, data: unknown) => {
    const result = await request<{ appointment: any }>(`/appointments/${id}/verify`, { method: 'POST', body: JSON.stringify(data) });
    return result.appointment;
  },

  cancelAppointment: async (id: string, data: unknown) => {
    const result = await request<{ appointment: any }>(`/appointments/${id}/cancel`, { method: 'POST', body: JSON.stringify(data) });
    return result.appointment;
  },

  getAlerts: async (type?: string) => {
    const data = await request<{ alerts: any[] }>(`/alerts${type ? `?type=${type}` : ''}`);
    return (data.alerts || []).map((a) => ({
      ...a,
      cardId: a.id,
    }));
  },

  getStores: async () => {
    const data = await request<{ stores: any[] }>(`/stores`);
    return data.stores;
  },

  getHandover: async (date: string, store?: string) => {
    const data = await request<any>(`/handover?date=${date}${store ? `&store=${store}` : ''}`);
    return data;
  },
};
