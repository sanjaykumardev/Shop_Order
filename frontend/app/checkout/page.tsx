"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ENDPOINTS, apiFetch } from "@/lib/api";
import { CartItem, cartTotal, clearCart, getCart, getCustomer } from "@/lib/session";

type Status = "idle" | "placing" | "paying" | "done" | "error";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [method, setMethod] = useState<"upi" | "cod">("upi");

  useEffect(() => {
    const customer = getCustomer();
    if (!customer) {
      router.push("/register");
      return;
    }
    const currentCart = getCart();
    if (currentCart.length === 0) {
      router.push("/products");
      return;
    }
    setCart(currentCart);
  }, [router]);

  const total = cartTotal(cart);

  async function handlePay() {
    const customer = getCustomer();
    if (!customer) return;

    setError("");
    setStatus("placing");
    try {
      const order = await apiFetch(ENDPOINTS.createOrder, {
        method: "POST",
        body: JSON.stringify({
          customer_id: customer.id,
          items: cart.map((c) => ({ product_id: c.productId, quantity: c.quantity })),
        }),
      });

      setStatus("paying");
      await apiFetch(ENDPOINTS.payOrder(order.id), {
        method: "POST",
        body: JSON.stringify({
          method: method === "cod" ? "cash_on_delivery" : "upi",
        }),
      });

      clearCart();
      setStatus("done");
    } catch (err) {
      console.error(err);
      setError("Payment could not be completed. Check the server and try again.");
      setStatus("error");
    }
  }

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
        .op-radio {
          border: 1px solid #D8D9CC; border-radius: 12px; padding: 14px 16px;
          display: flex; align-items: center; gap: 10px; cursor: pointer;
        }
        .op-radio.active { border-color: #3F6C51; background: #F3F5EF; }
      `}</style>

      <main className="op-root min-h-screen" style={{ backgroundColor: "#EDEEE6" }}>
        <div className="mx-auto max-w-md px-6 py-10 sm:px-10">
          <h1 className="op-display mb-6 text-3xl font-bold" style={{ color: "#1F2B22" }}>
            Payment
          </h1>

          {status === "done" ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="op-display text-xl font-bold" style={{ color: "#3F6C51" }}>
                Order placed
              </p>
              <p className="mt-2 text-sm" style={{ color: "#6B7268" }}>
                We&apos;ve received your order and payment.
              </p>
              <button
                onClick={() => router.push("/products")}
                className="op-btn op-display mt-6 rounded-xl px-5 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: "#1F2B22" }}
              >
                Back to shop
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between py-1.5 text-sm">
                    <span style={{ color: "#1F2B22" }}>
                      {item.name} × {item.quantity}
                    </span>
                    <span className="op-tag" style={{ color: "#6B7268" }}>
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div
                  className="mt-3 flex justify-between border-t pt-3"
                  style={{ borderColor: "#D8D9CC" }}
                >
                  <span className="op-display font-bold" style={{ color: "#1F2B22" }}>
                    Total
                  </span>
                  <span className="op-tag font-bold" style={{ color: "#1F2B22" }}>
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="mb-2 text-sm font-medium" style={{ color: "#1F2B22" }}>
                Pay with
              </p>
              <div className="mb-6 flex flex-col gap-3">
                <label className={`op-radio ${method === "upi" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="method"
                    checked={method === "upi"}
                    onChange={() => setMethod("upi")}
                  />
                  <span style={{ color: "#1F2B22" }}>UPI</span>
                </label>
                <label className={`op-radio ${method === "cod" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="method"
                    checked={method === "cod"}
                    onChange={() => setMethod("cod")}
                  />
                  <span style={{ color: "#1F2B22" }}>Cash on delivery</span>
                </label>
              </div>

              {error && (
                <p className="mb-4 text-sm" style={{ color: "#C0463B" }}>
                  {error}
                </p>
              )}

              <button
                onClick={handlePay}
                disabled={status === "placing" || status === "paying"}
                className="op-btn op-display w-full rounded-xl px-4 py-4 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: "#1F2B22" }}
              >
                {status === "placing"
                  ? "Placing order…"
                  : status === "paying"
                  ? "Processing payment…"
                  : `Pay ₹${total.toFixed(2)}`}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
