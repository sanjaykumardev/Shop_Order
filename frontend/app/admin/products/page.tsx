"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ENDPOINTS } from "@/lib/api";
import { clearAdminToken, getAdminToken } from "@/lib/adminSession";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  image: string | null;
  created_at: string;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const token = getAdminToken();

  // Product API paths
  const PRODUCTS_LIST = ENDPOINTS.products;
  const PRODUCTS_CREATE = ENDPOINTS.adminProductsCreate;
  const PRODUCTS_DELETE = (id: number) => ENDPOINTS.adminProductsDelete(id);

  // Load products
  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setLoading(true);
    setError("");

    fetch(PRODUCTS_LIST, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.status === 401) {
          clearAdminToken();
          router.push("/admin/login");
        }
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load products");
        setLoading(false);
      });
  }, [token]);

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;

    fetch(PRODUCTS_DELETE(deleteId), {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.status === 401) {
          clearAdminToken();
          router.push("/admin/login");
          return;
        }
        if (!res.ok) {
          return res.json().then((d) => { throw new Error(d.detail || "Failed to delete"); });
        }
        setProducts(products.filter((p) => p.id !== deleteId));
        setDeleteId(null);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to delete product");
        setDeleteId(null);
      });
  };

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#EDEEE6" }}
      >
        <p className="text-sm" style={{ color: "#6B7268" }}>Loading products...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#EDEEE6" }}>
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">

        {/* HEADER */}
        <header className="mb-8 flex items-end justify-between border-b pb-6" style={{ borderColor: "#D8D9CC" }}>
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest" style={{ color: "#3F6C51" }}>Products</p>
            <h1 className="text-3xl font-bold" style={{ color: "#1F2B22" }}>Product Management</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* BACK TO DASHBOARD */}
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "#1F2B22" }}
            >
              Dashboard
            </button>
          </div>
        </header>

        {/* PRODUCTS TABLE */}
        <section className="mt-8">
          {error && (
            <div
              className="rounded-2xl bg-white p-6 shadow-sm mb-6"
              style={{ backgroundColor: "#FCE8E6", color: "#C0463B" }}
            >
              {error}
            </div>
          )}

          {products.length === 0 ? (
            <div
              className="rounded-2xl bg-white p-8 text-center shadow-sm"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <p className="text-lg font-bold" style={{ color: "#1F2B22" }}>
                No products found
              </p>
              <p className="mt-2 text-sm" style={{ color: "#6B7268" }}>
                Add your first product using the button below.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg shadow-sm bg-white">
                <thead>
                  <tr
                    style={{ backgroundColor: "#F8F9FA", borderBottom: "1px solid #E0E0E0" }}
                  >
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "#6B7268",
                        fontWeight: "600",
                        width: "150px",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "#6B7268",
                        fontWeight: "600",
                        width: "100px",
                      }}
                    >
                      Price
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "#6B7268",
                        fontWeight: "600",
                        width: "80px",
                      }}
                    >
                      Stock
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "#6B7268",
                        fontWeight: "600",
                        width: "200px",
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "#6B7268",
                        fontWeight: "600",
                        width: "120px",
                      }}
                    >
                      Image
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "#6B7268",
                        fontWeight: "600",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: "1px solid #E0E0E6",
                        transition: "background-color 0.2s",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#1F2B22",
                          fontWeight: "500",
                        }}
                      >
                        {product.name}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#3F6C51",
                          fontWeight: "500",
                        }}
                      >
                        ₹{Number(product.price).toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#6B7268",
                          fontWeight: "500",
                        }}
                      >
                        {Number(product.stock)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#1F2B22",
                        }}
                      >
                        {product.description ? product.description.substring(0, 50) + "..." : "No description"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        {product.image ? (
                          <img
                            src={`/media/${product.image}`}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                            style={{ width: "80px", height: "80px" }}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-bg"
                            style={{
                              width: "80px",
                              height: "80px",
                              backgroundColor: "#E5E7EB",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#6B7268",
                              fontSize: "0.75rem",
                            }}
                          >
                            No image
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                        }}
                      >
                        <div className="flex gap-2">
                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                            style={{ color: "#C0463B" }}
                            aria-label={`Delete product ${product.name}`}
                          >
                            Delete
                          </button>

                          {/* Edit placeholder */}
                          <button
                            className="text-sm text-blue-600 hover:text-blue-800"
                            style={{ color: "#3F6C51" }}
                            aria-label={`Edit product ${product.name}`}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ADD PRODUCT FORM (simple) */}
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm" style={{ backgroundColor: "#FFFFFF" }}>
            <h2
              className="mb-4 textxl font-bold"
              style={{ color: "#1F2B22" }}
            >
              Add New Product
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = (e.target as any).name.value;
                const price = Number((e.target as any).price.value);
                const stock = Number((e.target as any).stock.value);

                if (!name || !price || !stock) {
                  setError("Please fill in all fields");
                  return;
                }

                fetch(PRODUCTS_CREATE, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ name, price, stock, description: (e.target as any).description.value, image: (e.target as any).image.value }),
                })
                  .then((res) => {
                    if (res.status === 401) {
                      clearAdminToken();
                      router.push("/admin/login");
                      return;
                    }
                    return res.json();
                  })
                  .then((data) => {
                    setProducts([data, ...products]);
                    setError("");
                    // Reset form fields
                    (e.target as any).name.value = "";
                    (e.target as any).price.value = "";
                    (e.target as any).stock.value = "";
                  })
                  .catch((err) => {
                    console.error(err);
                    setError(err.message || "Failed to add product");
                  });
              }}
            >

              <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-4">
                <div>
                  <label
                    className="block text-sm font-medium text-[#1F2B22] mb-1"
                    style={{ color: "#1F2B22" }}
                  >
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={{ borderColor: "#D8D9CC", color: "#1F2B22" }}
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-[#1F2B22] mb-1"
                    style={{ color: "#1F2B22" }}
                  >
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    required
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={{ borderColor: "#D8D9CC", color: "#1F2B22" }}
                    placeholder="Enter price"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-[#1F2B22] mb-1"
                    style={{ color: "#1F2B22" }}
                  >
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    required
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={{ borderColor: "#D8D9CC", color: "#1F2B22" }}
                    placeholder="Enter stock quantity"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-[#1F2B22] mb-1"
                    style={{ color: "#1F2B22" }}
                  >
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={{ borderColor: "#D8D9CC", color: "#1F2B22" }}
                    placeholder="Enter product description"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  className="block text-sm font-medium text-[#1F2B22] mb-1"
                  style={{ color: "#1F2B22" }}
                >
                  Product Image URL (optional)
                </label>
                <input
                  type="text"
                  name="image"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                  style={{ borderColor: "#D8D9CC", color: "#1F2B22" }}
                  placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white"
                style={{
                  backgroundColor: "#3F6C51",
                  marginTop: "10px",
                }}
              >
                Add Product
              </button>
            </form>
          </section>

        </section>

      </div>
    </main>
  );
}