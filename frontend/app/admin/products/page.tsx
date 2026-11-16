"use client";

import { useState, useEffect, type FormEvent, type CSSProperties, type ReactNode } from "react";
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

// NOTE: ideally move this into ENDPOINTS in "@/lib/api" like the others,
// so it points at the Django server instead of the Next.js server.
const PRODUCTS_UPDATE = (id: number) => `/api/admin/products/update/${id}/`;

const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none";
const inputStyle: CSSProperties = { borderColor: "#D8D9CC", color: "#1F2B22" };
const thStyle: CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  color: "#6B7268",
  fontWeight: 600,
};
const tdStyle: CSSProperties = { padding: "12px 16px" };
const columns: [string, string | undefined][] = [
  ["Name", "150px"],
  ["Price", "100px"],
  ["Stock", "80px"],
  ["Description", "200px"],
  ["Image", "120px"],
  ["Actions", undefined],
];

// Send the form as-is, but drop the image field when no file was chosen.
function buildFormData(form: HTMLFormElement) {
  const fd = new FormData(form);
  const img = fd.get("image");
  if (!(img instanceof File) || img.size === 0) fd.delete("image");
  return fd;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: "#1F2B22" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// Shared fields for the add and edit forms.
function ProductFields({ product }: { product?: Product }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-4">
        <Field label="Product Name">
          <input
            type="text"
            name="name"
            defaultValue={product?.name ?? ""}
            required
            className={inputClass}
            style={inputStyle}
            placeholder="Enter product name"
          />
        </Field>
        <Field label="Price (₹)">
          <input
            type="number"
            name="price"
            min="0"
            step="0.01"
            defaultValue={product?.price?.toString() ?? ""}
            required
            className={inputClass}
            style={inputStyle}
            placeholder="Enter price"
          />
        </Field>
        <Field label="Stock">
          <input
            type="number"
            name="stock"
            min="0"
            step="1"
            defaultValue={product?.stock?.toString() ?? ""}
            required
            className={inputClass}
            style={inputStyle}
            placeholder="Enter stock quantity"
          />
        </Field>
        <Field label="Description">
          <input
            type="text"
            name="description"
            defaultValue={product?.description ?? ""}
            className={inputClass}
            style={inputStyle}
            placeholder="Enter product description"
          />
        </Field>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1" style={{ color: "#1F2B22" }}>
          Product Image
        </label>
        <input type="file" name="image" accept="image/*" className={inputClass} style={inputStyle} />
        <p className="mt-2 text-xs text-gray-500">
          {product?.image
            ? "The current image is kept unless you choose a new one."
            : "Supported: jpg, png, gif. Max 5MB."}
        </p>
      </div>
    </>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const token = getAdminToken();

  // One place for auth header, 401 handling and error messages.
  async function api(url: string, init: RequestInit = {}) {
    const res = await fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...init.headers },
    });
    if (res.status === 401) {
      clearAdminToken();
      router.push("/admin/login");
      throw new Error("Your session expired. Please log in again.");
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || "Something went wrong. Please try again.");
    }
    return res;
  }

  const messageOf = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

  // Load products
  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      return;
    }
    api(ENDPOINTS.products)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : data.results ?? []))
      .catch((err) => setError(messageOf(err, "Failed to load products")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const confirmDelete = async () => {
    if (deleteId === null) return;
    const id = deleteId;
    try {
      await api(ENDPOINTS.adminProductsDelete(id), { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setError("");
    } catch (err) {
      setError(messageOf(err, "Failed to delete product"));
    }
    setDeleteId(null);
  };

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      const res = await api(ENDPOINTS.adminProductsCreate, {
        method: "POST",
        body: buildFormData(form),
      });
      const created: Product = await res.json();
      setProducts((prev) => [created, ...prev]);
      setError("");
      form.reset();
    } catch (err) {
      setError(messageOf(err, "Failed to add product"));
    }
  };

  const handleEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editProduct) return;
    const form = e.currentTarget;
    try {
      const res = await api(PRODUCTS_UPDATE(editProduct.id), {
        method: "PUT",
        body: buildFormData(form),
      });
      const updated: Product = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditProduct(null);
      setError("");
    } catch (err) {
      setError(messageOf(err, "Failed to update product"));
    }
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
        <header
          className="mb-8 flex items-end justify-between border-b pb-6"
          style={{ borderColor: "#D8D9CC" }}
        >
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest" style={{ color: "#3F6C51" }}>Products</p>
            <h1 className="text-3xl font-bold" style={{ color: "#1F2B22" }}>Product Management</h1>
          </div>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "#1F2B22" }}
          >
            Dashboard
          </button>
        </header>

        <section className="mt-8">
          {error && (
            <div
              className="rounded-2xl p-6 shadow-sm mb-6"
              style={{ backgroundColor: "#FCE8E6", color: "#C0463B" }}
            >
              {error}
            </div>
          )}

          {/* PRODUCTS TABLE */}
          {products.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-bold" style={{ color: "#1F2B22" }}>No products found</p>
              <p className="mt-2 text-sm" style={{ color: "#6B7268" }}>
                Add your first product using the form below.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg shadow-sm bg-white">
                <thead>
                  <tr style={{ backgroundColor: "#F8F9FA", borderBottom: "1px solid #E0E0E0" }}>
                    {columns.map(([label, width]) => (
                      <th key={label} style={{ ...thStyle, width }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} style={{ borderBottom: "1px solid #E0E0E6" }}>
                      <td style={{ ...tdStyle, color: "#1F2B22", fontWeight: 500 }}>{product.name}</td>
                      <td style={{ ...tdStyle, color: "#3F6C51", fontWeight: 500 }}>
                        ₹{Number(product.price).toFixed(2)}
                      </td>
                      <td style={{ ...tdStyle, color: "#6B7268", fontWeight: 500 }}>
                        {Number(product.stock)}
                      </td>
                      <td style={{ ...tdStyle, color: "#1F2B22" }}>
                        {product.description
                          ? product.description.length > 50
                            ? product.description.substring(0, 50) + "..."
                            : product.description
                          : "No description"}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            className="object-cover rounded"
                            style={{ width: "80px", height: "80px" }}
                          />
                        ) : (
                          <div
                            className="rounded"
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
                      <td style={tdStyle}>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setDeleteId(product.id)}
                            className="text-sm"
                            style={{ color: "#C0463B" }}
                            aria-label={`Delete product ${product.name}`}
                          >
                            Delete
                          </button>
                          {editProduct?.id === product.id ? (
                            <button
                              type="button"
                              onClick={() => setEditProduct(null)}
                              className="text-sm"
                              style={{ color: "#6B7268" }}
                              aria-label={`Cancel editing product ${product.name}`}
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditProduct(product)}
                              className="text-sm"
                              style={{ color: "#3F6C51" }}
                              aria-label={`Edit product ${product.name}`}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* EDIT PRODUCT FORM */}
          {editProduct && (
            <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold" style={{ color: "#1F2B22" }}>Edit Product</h2>
              {/* key resets the fields when a different product is picked */}
              <form key={editProduct.id} onSubmit={handleEdit}>
                <ProductFields product={editProduct} />
                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: "#3F6C51" }}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditProduct(null)}
                    className="flex-1 rounded-xl px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: "#6B7268", color: "white" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ADD PRODUCT FORM */}
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold" style={{ color: "#1F2B22" }}>Add New Product</h2>
            <form onSubmit={handleAdd}>
              <ProductFields />
              <button
                type="submit"
                className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white"
                style={{ backgroundColor: "#3F6C51", marginTop: "10px" }}
              >
                Add Product
              </button>
            </form>
          </section>
        </section>
      </div>

      {/* DELETE CONFIRMATION */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold" style={{ color: "#1F2B22" }}>Delete this product?</h3>
            <p className="mt-2 text-sm" style={{ color: "#6B7268" }}>
              This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: "#C0463B" }}
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "#E5E7EB", color: "#1F2B22" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
