import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1' });
let accessToken = localStorage.getItem('mizallah_access_token');
export const setAccessToken = (token: string | null) => { accessToken = token; token ? localStorage.setItem('mizallah_access_token', token) : localStorage.removeItem('mizallah_access_token'); };
api.interceptors.request.use((config) => { if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`; return config; });
let refreshing: Promise<string | null> | null = null;
api.interceptors.response.use((r) => r, async (error) => {
  const original = error.config;
  if (error.response?.status === 401 && !original?._retry && localStorage.getItem('mizallah_refresh_token')) {
    original._retry = true;
    refreshing ??= api.post('/auth/refresh', { refreshToken: localStorage.getItem('mizallah_refresh_token') }).then(({ data }) => { setAccessToken(data.accessToken); localStorage.setItem('mizallah_refresh_token', data.refreshToken); return data.accessToken; }).catch(() => null).finally(() => { refreshing = null; });
    const token = await refreshing;
    if (token) { original.headers.Authorization = `Bearer ${token}`; return api(original); }
    setAccessToken(null); localStorage.removeItem('mizallah_refresh_token'); window.location.href = '/login';
  }
  return Promise.reject(error);
});
export const messageOf = (error: unknown) => { if (axios.isAxiosError(error)) return error.response?.data?.error?.message || error.message; return 'Something went wrong'; };
export type User = { id:string; lpuId:string; name:string; email:string; phone?:string; role:'ADMIN'|'STAFF'|'STUDENT'; status:'ACTIVE'|'SUSPENDED'|'INACTIVE'; assignedStationId?:string; createdAt:string };
export type Station = { id:string; code:string; name:string; description?:string; latitude:number; longitude:number; capacity:number; status:'ACTIVE'|'INACTIVE'|'MAINTENANCE'; openingTime:string; closingTime:string; inventory?:Record<string,number> };
export type Umbrella = { id:string; publicCode:string; qrIdentifier:string; status:string; condition:string; currentStationId?:string; currentStation?:Station; createdAt:string };
export type Plan = { id:string; name:string; durationMinutes:number; pricePaise:number; active:boolean; createdAt:string };
export type Rental = { id:string; status:string; priceAtRentalPaise:number; startedAt?:string; dueAt?:string; completedAt?:string; createdAt:string; student?:User; umbrella?:Umbrella; originStation?:Station; payment?:Payment };
export type Payment = { id:string; rentalId:string; provider:string; providerOrderId?:string; providerPaymentId?:string; amountPaise:number; status:string; failureReason?:string; createdAt:string };
export type Analytics = { rentalsByStatus:Record<string,number>; umbrellasByStatus:Record<string,number>; totalRevenuePaise:number; verifiedPaymentsCount:number; currentlyActiveRentals:number };
export const admin = { list: (resource:string, page=1) => api.get(`/admin/${resource}`, { params:{ page, limit:20 } }).then(r=>r.data), create: (resource:string, body:unknown) => api.post(`/admin/${resource}`, body).then(r=>r.data), update: (resource:string,id:string,body:unknown) => api.patch(`/admin/${resource}/${id}`,body).then(r=>r.data), analytics: () => api.get('/admin/analytics').then(r=>r.data as Promise<Analytics>) };
