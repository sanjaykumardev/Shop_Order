// Central place for the Django API base + endpoint paths.
// Adjust these strings to match your real urls.py — nothing else in the
// app needs to change if the paths move.
//
// In production, set NEXT_PUBLIC_API_BASE at build time to your backend
// URL (e.g. https://api.yourdomain.com/api). Falls back to local dev.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api";

export const ENDPOINTS = {
  products: `${API_BASE}/products/`,
  registerCustomer: `${API_BASE}/customers/register/`,
  createOrder: `${API_BASE}/orders/`,
  payOrder: (orderId: number | string) => `${API_BASE}/orders/${orderId}/pay/`,
  adminLogin: `${API_BASE}/admin/login/`,
  adminOrders: `${API_BASE}/admin/orders/`,
  adminDashboard: `${API_BASE}/admin/dashboard/`,
  adminChangeCredentials:`${API_BASE}/admin/change-credentials/`, 
};

export async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}
