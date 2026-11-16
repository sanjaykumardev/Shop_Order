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
  const [editId, setEditId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const token = getAdminToken();

  // Product API paths
  const PRODUCTS_LIST = ENDPOINTS.products;
  const PRODUCTS_CREATE = ENDPOINTS.adminProductsCreate;
  const PRODUCTS_DELETE = (id: number) => ENDPOINTS.adminProductsDelete(id);
  const PRODUCTS_UPDATE = (id: number) => `/api/admin/products/update/${id}/`;

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

  const confirmEdit = () => {
    if (!editId || !editProduct) return;

    const formData = new FormData();
    formData.append("name", editProduct.name);
    formData.append("price", String(editProduct.price));
    formData.append("stock", String(editProduct.stock));
    formData.append("description", editProduct.description || "");
    if (editProduct.imageFile) {
      formData.append("image", editProduct.imageFile);
    }
    if (editProduct.existingImage) {
      formData.append("existingImage", editProduct.existingImage);
    }

    fetch(PRODUCTS_UPDATE(editId), {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    })
      .then((res) => {
        if (res.status === 401) {
          clearAdminToken();
          router.push("/admin/login");
          return;
        }
        if (!res.ok) {
          return res.json().then((d) => { throw new Error(d.detail || "Failed to update"); });
        }
        setProducts(products.map((p) => p.id === editId ? res.data : p));
        setEditId(null);
        setEditProduct(null);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to update product");
        setEditId(null);
        setEditProduct(null);
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
        <h1>Products Page</h1>
        <p>Products will load here...</h1>
      </main>
    </main>
  );
}