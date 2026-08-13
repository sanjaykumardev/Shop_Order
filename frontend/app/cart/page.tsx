"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CartItem, cartTotal, getCart, removeFromCart, updateQuantity } from "@/lib/session";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
    const onUpdate = () => setCart(getCart());
    window.addEventListener("cart-updated", onUpdate);
    return () => window.removeEventListener("cart-updated", onUpdate);
  }, []);

  const total = cartTotal(cart);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@600&display=swap');
        .op-root { font-family: 'Inter', sans-serif; }
        .op-display { font-family: 'Space Grotesk', sans-serif; }
        .op-tag { font-family: 'IBM Plex Mono', monospace; }
        .op-btn { transition: background-color 0.15s ease, transform 0.1s ease; }
        .op-btn:hover { background-color: #2F5233; }
        .op-btn:active { transform: scale(0.98); }
        .op-qtybtn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid #D8D9CC; background: #fff; }
        .op-qtybtn:hover { border-color: #3F6C51; }
      `}</style>

      <main className="op-root min-h-screen" style={{ backgroundColor: "#EDEEE6" }}>
        <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
          <button
            onClick={() => router.push("/products")}
            className="op-tag mb-6 text-sm"
            style={{ color: "#3F6C51" }}
          >
            ← Back to shop
          </button>

          <h1 className="op-display mb-6 text-3xl font-bold" style={{ color: "#1F2B22" }}>
            Your cart
          </h1>

          {cart.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="op-display text-lg font-bold" style={{ color: "#1F2B22" }}>
                Your cart is empty
              </p>
              <p className="mt-1 text-sm" style={{ color: "#6B7268" }}>
                Add a few items from the shop to get started.
              </p>
              <button
                onClick={() => router.push("/products")}
                className="op-btn op-display mt-5 rounded-xl px-5 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: "#1F2B22" }}
              >
                Browse products
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex-1">
                      <p className="op-display font-bold" style={{ color: "#1F2B22" }}>
                        {item.name}
                      </p>
                      <p className="op-tag text-sm" style={{ color: "#6B7268" }}>
                        ₹{item.price} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="op-qtybtn"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="op-tag w-6 text-center text-sm" style={{ color: "#1F2B22" }}>
                        {item.quantity}
                      </span>
                      <button
                        className="op-qtybtn"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <p className="op-tag w-20 text-right font-semibold" style={{ color: "#1F2B22" }}>
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </p>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-sm"
                      style={{ color: "#C0463B" }}
                      aria-label={`Remove ${item.name}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
                <span className="op-display text-lg font-bold" style={{ color: "#1F2B22" }}>
                  Total
                </span>
                <span className="op-tag text-xl font-bold" style={{ color: "#1F2B22" }}>
                  ₹{total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="op-btn op-display mt-5 w-full rounded-xl px-4 py-4 text-sm font-semibold text-white"
                style={{ backgroundColor: "#1F2B22" }}
              >
                Proceed to payment
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
