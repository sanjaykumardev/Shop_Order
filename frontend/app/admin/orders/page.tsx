"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ENDPOINTS } from "@/lib/api";
import {
  clearAdminToken,
  getAdminToken,
} from "@/lib/adminSession";

interface OrderItem {
  product_name: string;
  quantity: number;
  price: string;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  total: string;
  created_at: string;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doneLoading, setDoneLoading] = useState<number | null>(null);

  // --------------------------------------------------
  // FORMAT ORDER DATE AND TIME
  // --------------------------------------------------

  function formatOrderDateTime(dateString: string) {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // --------------------------------------------------
  // LOAD ORDERS
  // --------------------------------------------------

  const loadOrders = useCallback(async () => {
    const token = getAdminToken();

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        ENDPOINTS.adminOrders,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        clearAdminToken();
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Could not load orders");
      }

      const data = await response.json();

      setOrders(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // --------------------------------------------------
  // LOAD ORDERS WHEN PAGE OPENS
  // --------------------------------------------------

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // --------------------------------------------------
  // MARK ORDER AS DONE
  // --------------------------------------------------

  async function markOrderDone(orderId: number) {
    const token = getAdminToken();

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setDoneLoading(orderId);
      setError("");

      const response = await fetch(
        `${ENDPOINTS.adminOrders}${orderId}/done/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        clearAdminToken();
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to mark order as done"
        );
      }

      // Update status immediately
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: "done",
              }
            : order
        )
      );
    } catch (err) {
      console.error(err);
      setError(
        "Could not mark order as done."
      );
    } finally {
      setDoneLoading(null);
    }
  }

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  function handleLogout() {
    clearAdminToken();
    router.push("/admin/login");
  }

  // --------------------------------------------------
  // STATUS COLOR
  // --------------------------------------------------

  const statusColor = (status: string) => {
    if (status === "paid") {
      return "#3F6C51";
    }

    if (status === "pending") {
      return "#C77D2E";
    }

    if (status === "done") {
      return "#2563EB";
    }

    if (status === "cancelled") {
      return "#C0463B";
    }

    return "#6B7268";
  };

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <>
      <style jsx>{`
        .op-root {
          font-family: "Inter", sans-serif;
        }

        .op-display {
          font-family: "Space Grotesk", sans-serif;
        }

        .op-tag {
          font-family: "IBM Plex Mono", monospace;
        }

        .op-skeleton {
          background: linear-gradient(
            90deg,
            #e2e4d9 25%,
            #ede ee6 37%,
            #e2e4d9 63%
          );

          background-size: 400% 100%;

          animation: op-shimmer 1.4s ease infinite;
        }

        @keyframes op-shimmer {
          0% {
            background-position: 100% 50%;
          }

          100% {
            background-position: 0 50%;
          }
        }

        .done-button {
          transition:
            background-color 0.15s ease,
            transform 0.1s ease;
        }

        .done-button:hover {
          background-color: #2f5233 !important;
        }

        .done-button:active {
          transform: scale(0.97);
        }
      `}</style>

      <main
        className="op-root min-h-screen"
        style={{
          backgroundColor: "#EDEEE6",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">

          {/* ------------------------------------------ */}
          {/* HEADER */}
          {/* ------------------------------------------ */}

          <header
            className="mb-8 flex items-end justify-between border-b pb-6"
            style={{
              borderColor: "#D8D9CC",
            }}
          >
            <div>
              <p
                className="op-tag mb-2 text-xs uppercase tracking-widest"
                style={{
                  color: "#3F6C51",
                }}
              >
                Owner view
              </p>

              <h1
                className="op-display text-3xl font-bold"
                style={{
                  color: "#1F2B22",
                }}
              >
                Orders received
              </h1>
            </div>

            <div className="flex items-center gap-4">

              {/* DASHBOARD BUTTON */}

              <button
                onClick={() =>
                  router.push("/admin/dashboard")
                }
                className="op-tag rounded-xl px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: "#1F2B22",
                  color: "#FFFFFF",
                }}
              >
                Dashboard
              </button>

              {/* LOGOUT */}

              <button
                onClick={handleLogout}
                className="op-tag text-sm"
                style={{
                  color: "#C0463B",
                }}
              >
                Log out
              </button>

            </div>
          </header>

          {/* ------------------------------------------ */}
          {/* ERROR */}
          {/* ------------------------------------------ */}

          {error && (
            <div
              className="mb-4 rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: "#C0463B1A",
                color: "#C0463B",
              }}
            >
              {error}
            </div>
          )}

          {/* ------------------------------------------ */}
          {/* LOADING */}
          {/* ------------------------------------------ */}

          {loading ? (
            <div className="flex flex-col gap-4">

              {Array.from({ length: 4 }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="op-skeleton h-24 w-full rounded-2xl"
                  />
                )
              )}

            </div>

          ) : orders.length === 0 ? (

            /* ---------------------------------------- */
            /* NO ORDERS */
            /* ---------------------------------------- */

            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

              <p
                className="op-display text-lg font-bold"
                style={{
                  color: "#1F2B22",
                }}
              >
                No orders yet
              </p>

              <p
                className="mt-1 text-sm"
                style={{
                  color: "#6B7268",
                }}
              >
                New orders from customers will show up
                here.
              </p>

            </div>

          ) : (

            /* ---------------------------------------- */
            /* ORDERS */
            /* ---------------------------------------- */

            <div className="flex flex-col gap-4">

              {orders.map((order) => (

                <div
                  key={order.id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >

                  {/* ---------------------------------- */}
                  {/* CUSTOMER INFORMATION */}
                  {/* ---------------------------------- */}

                  <div className="mb-3 flex items-start justify-between">

                    <div>

                      {/* CUSTOMER NAME */}

                      <p
                        className="op-display font-bold"
                        style={{
                          color: "#1F2B22",
                        }}
                      >
                        {order.customer_name}
                      </p>

                      {/* PHONE + ORDER NUMBER */}

                      <p
                        className="op-tag text-xs"
                        style={{
                          color: "#6B7268",
                        }}
                      >
                        {order.customer_phone}
                        {" · "}
                        order #{order.id}
                      </p>

                      {/* -------------------------------- */}
                      {/* ORDER DATE + TIME */}
                      {/* -------------------------------- */}

                      <p
                        className="mt-1 text-xs"
                        style={{
                          color: "#6B7268",
                        }}
                      >
                        Ordered:{" "}
                        {formatOrderDateTime(
                          order.created_at
                        )}
                      </p>

                    </div>

                    {/* -------------------------------- */}
                    {/* STATUS */}
                    {/* -------------------------------- */}

                    <span
                      className="op-tag rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor:
                          `${statusColor(order.status)}1A`,
                        color:
                          statusColor(order.status),
                      }}
                    >
                      {order.status}
                    </span>

                  </div>

                  {/* ---------------------------------- */}
                  {/* ORDER ITEMS */}
                  {/* ---------------------------------- */}

                  <div
                    className="border-t pt-3"
                    style={{
                      borderColor: "#D8D9CC",
                    }}
                  >

                    {order.items.map(
                      (item, index) => (

                        <div
                          key={index}
                          className="flex justify-between py-1 text-sm"
                        >

                          <span
                            style={{
                              color: "#1F2B22",
                            }}
                          >
                            {item.product_name}
                            {" × "}
                            {item.quantity}
                          </span>

                          <span
                            className="op-tag"
                            style={{
                              color: "#6B7268",
                            }}
                          >
                            ₹
                            {(
                              Number(item.price) *
                              item.quantity
                            ).toFixed(2)}
                          </span>

                        </div>

                      )
                    )}

                  </div>

                  {/* ---------------------------------- */}
                  {/* TOTAL + DONE BUTTON */}
                  {/* ---------------------------------- */}

                  <div
                    className="mt-3 flex items-center justify-between border-t pt-3"
                    style={{
                      borderColor: "#D8D9CC",
                    }}
                  >

                    {/* TOTAL */}

                    <div>

                      <span
                        className="op-display text-sm font-bold"
                        style={{
                          color: "#1F2B22",
                        }}
                      >
                        Total
                      </span>

                      <span
                        className="op-tag ml-3 text-sm font-bold"
                        style={{
                          color: "#1F2B22",
                        }}
                      >
                        ₹{order.total}
                      </span>

                    </div>

                    {/* -------------------------------- */}
                    {/* DONE BUTTON */}
                    {/* -------------------------------- */}

                    {order.status !== "done" && (

                      <button
                        onClick={() =>
                          markOrderDone(order.id)
                        }
                        disabled={
                          doneLoading === order.id
                        }
                        className="done-button rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          backgroundColor: "#3F6C51",
                        }}
                      >
                        {doneLoading === order.id
                          ? "UPDATING..."
                          : "DONE"}
                      </button>

                    )}

                    {/* -------------------------------- */}
                    {/* COMPLETED */}
                    {/* -------------------------------- */}

                    {order.status === "done" && (

                      <span
                        className="op-tag rounded-full px-3 py-2 text-xs font-medium"
                        style={{
                          backgroundColor:
                            "#3F6C511A",
                          color: "#3F6C51",
                        }}
                      >
                        Completed ✓
                      </span>

                    )}

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>
      </main>
    </>
  );
}