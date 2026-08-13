"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ENDPOINTS } from "@/lib/api";
import {
  clearAdminToken,
  getAdminToken,
} from "@/lib/adminSession";

interface DashboardOrderItem {
  product_name: string;
  quantity: number;
  price: string;
}

interface DashboardOrder {
  id: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  total: string;
  created_at: string;
  items: DashboardOrderItem[];
}

interface DashboardData {
  today: string;
  selected_date: string;

  daily?: {
    order_count: number;
    total_sales: string;
  };

  monthly?: {
    order_count: number;
    total_sales: string;
  };
    orders: DashboardOrder[];
}

export default function AdminDashboardPage() {

  const router = useRouter();

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [selectedDate, setSelectedDate] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // -----------------------------------------
  // Load dashboard
  // -----------------------------------------

  const loadDashboard = useCallback(
    async (date?: string, isInitial = false) => {

      const token = getAdminToken();

      if (!token) {
        router.push("/admin/login");
        return;
      }

      setLoading(true);
      setError("");

      try {

        let url = ENDPOINTS.adminDashboard;

        if (date) {
          url += `?date=${date}`;
        }

        const response = await fetch(
          url,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // ---------------------------------------
        // Unauthorized
        // ---------------------------------------

        if (response.status === 401) {

          clearAdminToken();

          router.push("/admin/login");

          return;
        }

        // ---------------------------------------
        // Other errors
        // ---------------------------------------

        if (!response.ok) {
          throw new Error(
            "Failed to load dashboard"
          );
        }

        const data: DashboardData =
          await response.json();

        // ---------------------------------------
        // Save dashboard data
        // ---------------------------------------

        setDashboard(data);

        // ---------------------------------------
        // Default selected date (first load only)
        // ---------------------------------------

        if (isInitial) {
          setSelectedDate(
            data.selected_date
          );
        }

      } catch (error) {

        console.error(error);

        setError(
          "Could not load dashboard."
        );

      } finally {

        setLoading(false);
      }
    },
    [router]
  );

  // -----------------------------------------
  // First page load
  // -----------------------------------------

  useEffect(() => {

    loadDashboard(undefined, true);

  }, [loadDashboard]);

  // -----------------------------------------
  // Date changed
  // -----------------------------------------

  function handleDateChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    const date =
      event.target.value;

    setSelectedDate(date);

    if (date) {
      loadDashboard(date);
    }
  }

  // -----------------------------------------
  // Logout
  // -----------------------------------------

  function handleLogout() {

    clearAdminToken();

    router.push("/admin/login");
  }

  // -----------------------------------------
  // Format date
  // -----------------------------------------

  function formatDate(
    dateString: string
  ) {

    if (!dateString) {
      return "";
    }

    const date =
      new Date(
        `${dateString}T00:00:00`
      );

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }


  if (loading && !dashboard) {

    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "#EDEEE6",
        }}
      >

        <p
          className="text-sm"
          style={{
            color: "#6B7268",
          }}
        >
          Loading dashboard...
        </p>

      </main>
    );
  }

  // -----------------------------------------
  // Error
  // -----------------------------------------

  if (error && !dashboard) {

    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "#EDEEE6",
        }}
      >

        <div
          className="rounded-2xl bg-white p-8 text-center shadow-sm"
        >

          <p
            className="text-sm"
            style={{
              color: "#C0463B",
            }}
          >
            {error}
          </p>

          <button
            onClick={() => loadDashboard()}
            className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{
              backgroundColor: "#1F2B22",
            }}
          >
            Try again
          </button>

        </div>

      </main>
    );
  }

  // -----------------------------------------
  // Main dashboard
  // -----------------------------------------

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "#EDEEE6",
      }}
    >

      <div
        className="mx-auto max-w-5xl px-6 py-10 sm:px-10"
      >

        {/* ---------------------------------- */}
        {/* HEADER */}
        {/* ---------------------------------- */}

        <header
          className="mb-8 flex items-end justify-between border-b pb-6"
          style={{
            borderColor: "#D8D9CC",
          }}
        >

          <div>

            <p
              className="mb-2 text-xs uppercase tracking-widest"
              style={{
                color: "#3F6C51",
              }}
            >
              Owner dashboard
            </p>

            <h1
              className="text-3xl font-bold"
              style={{
                color: "#1F2B22",
              }}
            >
              Sales Dashboard
            </h1>

          </div>

          <div className="flex items-center gap-4">

            <button
              onClick={() =>
                router.push("/admin/orders")
              }
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{
                backgroundColor: "#1F2B22",
              }}
            >
              Orders
            </button>
            {/* SETTINGS */}

            <button
              onClick={() =>
                router.push("/admin/settings")
              }
              className="rounded-xl px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: "#1F2B22",
                color: "#FFFFFF",
                border: "1px solid #D8D9CC",
              }}
            >
              Settings
            </button>
             
               {/* LOG OUT */}
            <button
              onClick={handleLogout}
              className="text-sm"
              style={{
                color: "#C0463B",
              }}
            >
              Log out
            </button>

          </div>

        </header>


        {/* ---------------------------------- */}
        {/* DATE SELECTOR */}
        {/* ---------------------------------- */}

        <section
          className="mb-6 rounded-2xl bg-white p-6 shadow-sm"
        >

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p
                className="text-xs uppercase tracking-widest"
                style={{
                  color: "#3F6C51",
                }}
              >
                Select date
              </p>

              <p
                className="mt-1 text-sm"
                style={{
                  color: "#6B7268",
                }}
              >
                View orders and sales for a specific day.
              </p>

            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="rounded-xl border px-4 py-3 text-sm outline-none"
              style={{
                borderColor: "#D8D9CC",
                color: "#1F2B22",
              }}
            />

          </div>

        </section>


        {/* ---------------------------------- */}
        {/* SELECTED DATE */}
        {/* ---------------------------------- */}

        {dashboard && (

          <p
            className="mb-4 text-sm font-medium"
            style={{
              color: "#6B7268",
            }}
          >
            Showing:
            {" "}
            {formatDate(
              dashboard.selected_date
            )}
          </p>

        )}


        {/* ---------------------------------- */}
        {/* DAILY STATISTICS */}
        {/* ---------------------------------- */}

        <section className="mb-8">

          <h2
            className="mb-4 text-xl font-bold"
            style={{
              color: "#1F2B22",
            }}
          >
            Daily sales
          </h2>


          {dashboard &&
          dashboard?.daily?.order_count === 0 ? (

            <div
              className="rounded-2xl bg-white p-8 text-center shadow-sm"
            >

              <p
                className="text-lg font-bold"
                style={{
                  color: "#1F2B22",
                }}
              >
                No orders or items sold
              </p>

              <p
                className="mt-2 text-sm"
                style={{
                  color: "#6B7268",
                }}
              >
                There were no orders on{" "}
                {formatDate(
                  dashboard.selected_date
                )}
                .
              </p>

            </div>

          ) : (

            <div className="grid gap-4 sm:grid-cols-2">

              {/* Orders */}

              <div
                className="rounded-2xl bg-white p-6 shadow-sm"
              >

                <p
                  className="text-xs uppercase tracking-widest"
                  style={{
                    color: "#6B7268",
                  }}
                >
                  Orders
                </p>

                <p
                  className="mt-3 text-4xl font-bold"
                  style={{
                    color: "#1F2B22",
                  }}
                >
                  {dashboard?.daily?.order_count}
                </p>

              </div>


              {/* Sales */}

              <div
                className="rounded-2xl bg-white p-6 shadow-sm"
              >

                <p
                  className="text-xs uppercase tracking-widest"
                  style={{
                    color: "#6B7268",
                  }}
                >
                  Total sales
                </p>

                <p
                  className="mt-3 text-4xl font-bold"
                  style={{
                    color: "#3F6C51",
                  }}
                >
                  ₹
                  {Number(
                    dashboard?.daily?.total_sales
                  ).toFixed(2)}
                </p>

              </div>

            </div>

          )}

        </section>


        {/* ---------------------------------- */}
        {/* MONTHLY STATISTICS */}
        {/* ---------------------------------- */}

        <section>

          <h2
            className="mb-4 text-xl font-bold"
            style={{
              color: "#1F2B22",
            }}
          >
            Monthly sales
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">

            {/* Monthly Orders */}

            <div
              className="rounded-2xl bg-white p-6 shadow-sm"
            >

              <p
                className="text-xs uppercase tracking-widest"
                style={{
                  color: "#6B7268",
                }}
              >
                Orders this month
              </p>

              <p
                className="mt-3 text-4xl font-bold"
                style={{
                  color: "#1F2B22",
                }}
              >
                {dashboard?.monthly?.order_count}
              </p>

            </div>


            {/* Monthly Sales */}

            <div
              className="rounded-2xl bg-white p-6 shadow-sm"
            >

              <p
                className="text-xs uppercase tracking-widest"
                style={{
                  color: "#6B7268",
                }}
              >
                Sales this month
              </p>

              <p
                className="mt-3 text-4xl font-bold"
                style={{
                  color: "#3F6C51",
                }}
              >
                ₹
                {Number(
                  dashboard?.monthly?.total_sales
                ).toFixed(2)}
              </p>

            </div>

          </div>

        </section>
          {/* ---------------------------------- */}
    {/* ORDERS FOR SELECTED DATE */}
    {/* ---------------------------------- */}

    <section className="mt-8">

      <h2
        className="mb-4 text-xl font-bold"
        style={{
          color: "#1F2B22",
        }}
      >
        Orders for {formatDate(dashboard?.selected_date || "")}
      </h2>

      {dashboard?.orders?.length === 0 ? (

        <div
          className="rounded-2xl bg-white p-8 text-center shadow-sm"
        >
          <p
            className="text-lg font-bold"
            style={{
              color: "#1F2B22",
            }}
          >
            No orders on this date
          </p>

          <p
            className="mt-2 text-sm"
            style={{
              color: "#6B7268",
            }}
          >
            No orders or items were sold on this date.
          </p>
        </div>

      ) : (

        <div className="flex flex-col gap-4">

          {dashboard?.orders?.map((order) => (

            <div
              key={order.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >

              {/* CUSTOMER */}

              <div className="flex items-start justify-between">

                <div>

                  <p
                    className="text-lg font-bold"
                    style={{
                      color: "#1F2B22",
                    }}
                  >
                    {order.customer_name}
                  </p>

                  <p
                    className="text-xs"
                    style={{
                      color: "#6B7268",
                    }}
                  >
                    {order.customer_phone}
                    {" · "}
                    Order #{order.id}
                  </p>

                  {/* ORDER DATE AND TIME */}

                  <p
                    className="mt-1 text-xs"
                    style={{
                      color: "#3F6C51",
                    }}
                  >
                    Ordered:{" "}
                    {new Date(
                      order.created_at
                    ).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>

                </div>

                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    backgroundColor: "#3F6C511A",
                    color: "#3F6C51",
                  }}
                >
                  {order.status}
                </span>

              </div>


              {/* ITEMS */}

              <div
                className="mt-4 border-t pt-3"
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


              {/* TOTAL */}

              <div
                className="mt-3 flex justify-between border-t pt-3"
                style={{
                  borderColor: "#D8D9CC",
                }}
              >

                <span
                  className="font-bold"
                  style={{
                    color: "#1F2B22",
                  }}
                >
                  Total
                </span>

                <span
                  className="font-bold"
                  style={{
                    color: "#3F6C51",
                  }}
                >
                  ₹{Number(order.total).toFixed(2)}
                </span>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>

        {/* ---------------------------------- */}
        {/* REFRESH MESSAGE */}
        {/* ---------------------------------- */}

        {loading && dashboard && (

          <p
            className="mt-6 text-center text-xs"
            style={{
              color: "#6B7268",
            }}
          >
            Updating dashboard...
          </p>

        )}

      </div>

    </main>
  );
}