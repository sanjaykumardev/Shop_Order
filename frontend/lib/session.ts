// Lightweight client-side session state — no auth library needed for the
// customer side. The owner side uses a real token from the Django admin
// login endpoint (see lib/adminSession.ts).

export interface Customer {
  id: number;
  name: string;
  phone: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: string;
  quantity: number;
}

const CUSTOMER_KEY = "shop_customer";
const CART_KEY = "shop_cart";

export function getCustomer(): Customer | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CUSTOMER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setCustomer(customer: Customer) {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
}

export function clearCustomer() {
  localStorage.removeItem(CUSTOMER_KEY);
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((c) => c.productId === item.productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
  }
  saveCart(cart);
}

export function updateQuantity(productId: number, quantity: number) {
  const cart = getCart().map((c) => (c.productId === productId ? { ...c, quantity } : c));
  saveCart(cart.filter((c) => c.quantity > 0));
}

export function removeFromCart(productId: number) {
  saveCart(getCart().filter((c) => c.productId !== productId));
}

export function clearCart() {
  saveCart([]);
}

export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
