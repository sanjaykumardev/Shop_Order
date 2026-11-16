
"use client";

import { useState, useEffect, type FormEvent } from "react";
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
  const [editId, setEditId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const token = getAdminToken();

  // API endpoints
  const PRODUCTS_LIST = ENDPOINTS.products;
  const PRODUCTS_CREATE = ENDPOINTS.adminProductsCreate;

  const PRODUCTS_DELETE = (id: number) =>
    ENDPOINTS.adminProductsDelete(id);

  const PRODUCTS_UPDATE = (id: number) =>
    `/api/admin/products/update/${id}/`;

  // Logout
  const handleLogout = async () => {
    clearAdminToken();
    router.push("/admin/login");
  };

  // Common API response handler
  const getResponseData = async (res: Response) => {
    const text = await res.text();

    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const getErrorMessage = (data: any, fallback: string) => {
    if (typeof data === "string") return data;

    return (
      data?.detail ||
      data?.message ||
      data?.error ||
      fallback
    );
  };

  // Load products
  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(PRODUCTS_LIST, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 401) {
          clearAdminToken();
          router.push("/admin/login");
          return;
        }

        const data = await getResponseData(res);

        if (!res.ok) {
          throw new Error(
            getErrorMessage(data, "Failed to load products")
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid product data received from server");
        }

        if (!cancelled) {
          setProducts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load products"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [token, router, PRODUCTS_LIST]);

  // Open delete confirmation
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setError("");
  };

  // Delete product
  const confirmDelete = async () => {
    if (deleteId === null) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(PRODUCTS_DELETE(deleteId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        clearAdminToken();
        router.push("/admin/login");
        return;
      }

      const data = await getResponseData(res);

      if (!res.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to delete product")
        );
      }

      setProducts((prev) =>
        prev.filter((product) => product.id !== deleteId)
      );

      setDeleteId(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete product"
      );
    } finally {
      setDeleting(false);
    }
  };

  // Open edit form
  const handleEdit = (product: Product) => {
    setEditId(product.id);
    setEditProduct({ ...product });
    setDeleteId(null);
    setError("");
  };

  // Close edit form
  const cancelEdit = () => {
    setEditId(null);
    setEditProduct(null);
    setError("");
  };

  // Update product
  const confirmEdit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (editId === null || !editProduct) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const description = String(
      formData.get("description") || ""
    );

    const imageFile = formData.get("image");

    if (
      !name ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("Please enter valid product details.");
      return;
    }

    const updateData = new FormData();

    updateData.append("name", name);
    updateData.append("price", String(price));
    updateData.append("stock", String(stock));
    updateData.append("description", description);

    if (imageFile instanceof File && imageFile.size > 0) {
      updateData.append("image", imageFile);
    }

    // Preserve the existing image if no new image is selected.
    if (editProduct.image) {
      updateData.append("existingImage", editProduct.image);
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(PRODUCTS_UPDATE(editId), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: updateData,
      });

      if (res.status === 401) {
        clearAdminToken();
        router.push("/admin/login");
        return;
      }

      const data = await getResponseData(res);

      if (!res.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to update product")
        );
      }

      const updatedProduct: Product =
        data && typeof data === "object" && data.id
          ? data
          : {
              ...editProduct,
              name,
              price,
              stock,
              description,
            };

      setProducts((prev) =>
        prev.map((product) =>
          product.id === editId ? updatedProduct : product
        )
      );

      setEditId(null);
      setEditProduct(null);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  };

  // Add new product
  const handleAddProduct = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));

    if (
      !name ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("Please enter valid product details.");
      return;
    }

    setAdding(true);
    setError("");

    try {
      const res = await fetch(PRODUCTS_CREATE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        clearAdminToken();
        router.push("/admin/login");
        return;
      }

      const data = await getResponseData(res);

      if (!res.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to add product")
        );
      }

      if (!data || !data.id) {
        throw new Error("Product was created but the server response was invalid.");
      }

      setProducts((prev) => [data, ...prev]);

      form.reset();
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add product"
      );
    } finally {
      setAdding(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#EDEEE6" }}
      >
        <p className="text-sm" style={{ color: "#6B7268" }}>
          Loading products...
        </p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#EDEEE6" }}
    >
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">

        {/* HEADER */}
        <header
          className="mb-8 flex items-end justify-between border-b pb-6"
          style={{ borderColor: "#D8D9CC" }}
        >
          <div>
            <p
              className="mb-2 text-xs uppercase tracking-widest"
              style={{ color: "#3F6C51" }}
            >
              Products
            </p>

            <h1
              className="text-3xl font-bold"
              style={{ color: "#1F2B22" }}
            >
              Product Management
            </h1>
          </div>

          <div className="flex items-end gap-2">
            {/* Dashboard button */}
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "#1F2B22" }}
            >
              Dashboard
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "#E74C3C" }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* PRODUCTS SECTION */}
        <section className="mt-8">

          {/* ERROR MESSAGE */}
          {error && (
            <div
              className="mb-6 rounded-2xl p-6 shadow-sm"
              style={{
                backgroundColor: "#FCE8E6",
                color: "#C0463B",
              }}
            >
              {error}
            </div>
          )}

          {/* PRODUCTS TABLE */}
          {products.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center shadow-sm"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <p
                className="text-lg font-bold"
                style={{ color: "#1F2B22" }}
              >
                No products found
              </p>

              <p
                className="mt-2 text-sm"
                style={{ color: "#6B7268" }}
              >
                Add your first product using the form below.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg bg-white shadow-sm">
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#F8F9FA",
                      borderBottom: "1px solid #E0E0E0",
                    }}
                  >
                    {[
                      ["Name", "150px"],
                      ["Price", "100px"],
                      ["Stock", "80px"],
                      ["Description", "200px"],
                      ["Image", "120px"],
                      ["Actions", "auto"],
                    ].map(([heading, width]) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          color: "#6B7268",
                          fontWeight: "600",
                          width,
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: "1px solid #E0E0E6",
                      }}
                    >
                      {/* NAME */}
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#1F2B22",
                          fontWeight: "500",
                        }}
                      >
                        {product.name}
                      </td>

                      {/* PRICE */}
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#3F6C51",
                          fontWeight: "500",
                        }}
                      >
                        ₹{Number(product.price).toFixed(2)}
                      </td>

                      {/* STOCK */}
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#6B7268",
                          fontWeight: "500",
                        }}
                      >
                        {Number(product.stock)}
                      </td>

                      {/* DESCRIPTION */}
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#1F2B22",
                        }}
                      >
                        {product.description
                          ? product.description.length > 50
                            ? product.description.substring(0, 50) + "..."
                            : product.description
                          : "No description"}
                      </td>

                      {/* IMAGE */}
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        {product.image ? (
                          <img
                            src= {product.image}
                            alt={product.name}
                            className="rounded object-cover"
                            style={{
                              width: "80px",
                              height: "80px",
                            }}
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

                      {/* ACTIONS */}
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                        }}
                      >
                        <div className="flex flex-wrap gap-3">

                          {deleteId === product.id ? (
                            <>
                              <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="text-sm font-medium text-red-600"
                              >
                                {deleting ? "Deleting..." : "Confirm"}
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteId(null)}
                                disabled={deleting}
                                className="text-sm"
                                style={{ 
                                  color: "#6B7268", 
                                  backgroundColor: "#1F2B22",
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              className=" op-tag rounded-xl px-4 py-2 text-sm font-medium"
                              style={{ color: "#ffffff" ,
                                 backgroundColor: "#000000",
                              }}
                            >
                              Delete
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              editId === product.id
                                ? cancelEdit()
                                : handleEdit(product)
                            }
                            className="op-tag rounded-xl px-4 center py-2 text-sm font-medium"
                            style={{ color: "#ffffff",
                               backgroundColor: "#000000",
                             }}
                          >
                            {editId === product.id ? "Cancel" : "Edit"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* EDIT PRODUCT FORM */}
          {editId !== null && editProduct && (
            <section
              className="mt-8 rounded-2xl p-6 shadow-sm"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <h2
                className="mb-4 text-xl font-bold"
                style={{ color: "#1F2B22" }}
              >
                Edit Product
              </h2>

              <form onSubmit={confirmEdit}>

                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">

                  {/* NAME */}
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      style={{ color: "#1F2B22" }}
                    >
                      Product Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      defaultValue={editProduct.name}
                      required
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                      style={{
                        borderColor: "#D8D9CC",
                        color: "#1F2B22",
                      }}
                    />
                  </div>

                  {/* PRICE */}
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      style={{ color: "#1F2B22" }}
                    >
                      Price (₹)
                    </label>

                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      defaultValue={editProduct.price}
                      required
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                      style={{
                        borderColor: "#D8D9CC",
                        color: "#1F2B22",
                      }}
                    />
                  </div>

                  {/* STOCK */}
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      style={{ color: "#1F2B22" }}
                    >
                      Stock
                    </label>

                    <input
                      type="number"
                      name="stock"
                      min="0"
                      step="1"
                      defaultValue={editProduct.stock}
                      required
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                      style={{
                        borderColor: "#D8D9CC",
                        color: "#1F2B22",
                      }}
                    />
                  </div>

                  {/* DESCRIPTION */}
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      style={{ color: "#1F2B22" }}
                    >
                      Description
                    </label>

                    <input
                      type="text"
                      name="description"
                      defaultValue={editProduct.description || ""}
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                      style={{
                        borderColor: "#D8D9CC",
                        color: "#1F2B22",
                      }}
                    />
                  </div>
                </div>

                {/* IMAGE */}
                <div className="mt-4">
                  <label
                    className="mb-1 block text-sm font-medium"
                    style={{ color: "#1F2B22" }}
                  >
                    Product Image
                  </label>

                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={{
                      borderColor: "#D8D9CC",
                      color: "#1F2B22",
                    }}
                  />

                  {editProduct.image && (
                    <p className="mt-2 text-xs text-gray-500">
                      Current image is available. Select a new image only if you want to replace it.
                    </p>
                  )}
                </div>

                {/* BUTTONS */}
                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: "#3F6C51" }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white"
                    style={{ backgroundColor: "#6B7268" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ADD NEW PRODUCT FORM */}
          <section
            className="mt-8 rounded-2xl p-6 shadow-sm"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <h2
              className="mb-4 text-xl font-bold"
              style={{ color: "#1F2B22" }}
            >
              Add New Product
            </h2>

            <form onSubmit={handleAddProduct}>

              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">

                {/* NAME */}
                <div>
                  <label
                    className="mb-1 block text-sm font-medium"
                    style={{ color: "#1F2B22" }}
                  >
                    Product Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={{
                      borderColor: "#D8D9CC",
                      color: "#1F2B22",
                    }}
                    placeholder="Enter product name"
                  />
                </div>

                {/* PRICE */}
                <div>
                  <label
                    className="mb-1 block text-sm font-medium"
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
                    style={{
                      borderColor: "#D8D9CC",
                      color: "#1F2B22",
                    }}
                    placeholder="Enter price"
                  />
                </div>

                {/* STOCK */}
                <div>
                  <label
                    className="mb-1 block text-sm font-medium"
                    style={{ color: "#1F2B22" }}
                  >
                    Stock
                  </label>

                  <input
                    type="number"
                    name="stock"
                    min="0"
                    step="1"
                    required
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={{
                      borderColor: "#D8D9CC",
                      color: "#1F2B22",
                    }}
                    placeholder="Enter stock quantity"
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label
                    className="mb-1 block text-sm font-medium"
                    style={{ color: "#1F2B22" }}
                  >
                    Description
                  </label>

                  <input
                    type="text"
                    name="description"
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={{
                      borderColor: "#D8D9CC",
                      color: "#1F2B22",
                    }}
                    placeholder="Enter product description"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD */}
              <div className="mt-4">
                <label
                  className="mb-1 block text-sm font-medium"
                  style={{ color: "#1F2B22" }}
                >
                  Product Image
                </label>

                <input
                  type="file"
                  name="image"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                  style={{
                    borderColor: "#D8D9CC",
                    color: "#1F2B22",
                  }}
                />

                <p className="mt-2 text-xs text-gray-500">
                  Supported: JPG, PNG, GIF, WEBP. Maximum size: 5MB.
                </p>
              </div>

              {/* ADD BUTTON */}
              <button
                type="submit"
                disabled={adding}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                style={{
                  backgroundColor: "#3F6C51",
                  marginTop: "10px",
                }}
              >
                {adding ? "Adding Product..." : "Add Product"}
              </button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
