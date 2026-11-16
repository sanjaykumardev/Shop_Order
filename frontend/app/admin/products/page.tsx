"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading products...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div>Products Page</div>
    </main>
  );
}