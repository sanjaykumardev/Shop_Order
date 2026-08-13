/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_BASE, ENDPOINTS } from "@/lib/api";

import {
  addToCart,
  getCart,
  getCustomer,
  cartCount,
} from "@/lib/session";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image: string | null;
}

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartQty, setCartQty] = useState(0);
  const [addedId, setAddedId] = useState<number | null>(null);

  // ==================================================
  // LOAD PRODUCTS
  // ==================================================

  useEffect(() => {
    const customer = getCustomer();

    if (!customer) {
      router.push("/register");
      return;
    }

    fetch(ENDPOINTS.products)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        return response.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Product loading error:", error);
        setLoading(false);
      });

    // ==================================================
    // CART COUNT
    // ==================================================

    setCartQty(cartCount(getCart()));

    // ==================================================
    // CART UPDATE LISTENER
    // ==================================================

    const onCartUpdate = () => {
      setCartQty(cartCount(getCart()));
    };

    window.addEventListener(
      "cart-updated",
      onCartUpdate
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        onCartUpdate
      );
    };
  }, [router]);

  // ==================================================
  // ADD TO CART
  // ==================================================

  function handleAddToCart(product: Product) {
    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
      },
      1
    );

    setAddedId(product.id);

    setTimeout(() => {
      setAddedId(null);
    }, 1200);
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "#EDEEE6",
      }}
    >
      <div
        className="
          mx-auto
          max-w-6xl
          px-6
          py-10
          sm:px-10
        "
      >

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <header
          className="
            mb-10
            flex
            items-end
            justify-between
            border-b
            pb-6
          "
          style={{
            borderColor: "#D8D9CC",
          }}
        >
          <div>
            <p
              className="
                mb-2
                text-xs
                uppercase
                tracking-widest
              "
              style={{
                color: "#3F6C51",
              }}
            >
              Today&apos;s stock
            </p>

            <h1
              className="
                text-4xl
                font-bold
                tracking-tight
              "
              style={{
                color: "#1F2B22",
              }}
            >
              Order List
            </h1>
          </div>

          {/* CART BUTTON */}

          <button
            onClick={() => router.push("/cart")}
            className="
              rounded-xl
              px-4
              py-2
              text-sm
              font-medium
              text-white
            "
            style={{
              backgroundColor: "#1F2B22",
            }}
          >
            View cart ({cartQty})
          </button>
        </header>

        {/* ================================================== */}
        {/* LOADING */}
        {/* ================================================== */}

        {loading ? (
          <div
            className="
              grid
              gap-6
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="
                    rounded-2xl
                    bg-white
                    p-5
                    shadow-sm
                  "
                >
                  <div
                    className="
                      mb-4
                      h-48
                      w-full
                      rounded-xl
                    "
                    style={{
                      backgroundColor: "#E2E4D9",
                    }}
                  />

                  <div
                    className="
                      mb-2
                      h-5
                      w-2/3
                      rounded
                    "
                    style={{
                      backgroundColor: "#E2E4D9",
                    }}
                  />

                  <div
                    className="
                      h-4
                      w-full
                      rounded
                    "
                    style={{
                      backgroundColor: "#E2E4D9",
                    }}
                  />
                </div>
              )
            )}
          </div>

        ) : products.length === 0 ? (

          /* ================================================== */
          /* NO PRODUCTS */
          /* ================================================== */

          <div
            className="
              rounded-2xl
              bg-white
              p-10
              text-center
              shadow-sm
            "
          >
            <p
              className="
                text-lg
                font-bold
              "
              style={{
                color: "#1F2B22",
              }}
            >
              No products available
            </p>

            <p
              className="
                mt-2
                text-sm
              "
              style={{
                color: "#6B7268",
              }}
            >
              There are currently no products
              available.
            </p>
          </div>

        ) : (

          /* ================================================== */
          /* PRODUCT GRID */
          /* ================================================== */

          <div
            className="
              grid
              gap-6
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >

            {products.map((product) => {

              // ==================================================
              // STOCK
              // ==================================================

              const stockLevel =
                product.stock === 0
                  ? "out"
                  : product.stock <= 5
                    ? "low"
                    : "ok";

              const stockColor =
                stockLevel === "out"
                  ? "#C0463B"
                  : stockLevel === "low"
                    ? "#C77D2E"
                    : "#3F6C51";

              const stockLabel =
                stockLevel === "out"
                  ? "Out of stock"
                  : `${product.stock} in stock`;

              // ==================================================
              // PRODUCT CARD
              // ==================================================

              return (
                <div
                  key={product.id}
                  className="
                    overflow-hidden
                    rounded-2xl
                    bg-white
                    shadow-sm
                  "
                >

                  {/* ================================================== */}
                  {/* PRODUCT IMAGE */}
                  {/* ================================================== */}

                  <div
                    className="
                      relative
                      h-48
                      w-full
                    "
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="
                          h-48
                          w-full
                          object-cover
                        "
                        onError={(event) => {
                          console.error(
                            "IMAGE FAILED:",
                            event.currentTarget.src
                          );
                        }}
                      />
                    ) : (
                      <div
                        className="
                          flex
                          h-48
                          w-full
                          items-center
                          justify-center
                          bg-gray-100
                          text-gray-400
                        "
                      >
                        No Image
                      </div>
                    )}

                    {/* ================================================== */}
                    {/* PRICE */}
                    {/* ================================================== */}

                    <div
                      className="
                        absolute
                        right-4
                        top-2
                        rounded
                        px-3
                        py-1.5
                        text-sm
                        font-semibold
                        text-white
                      "
                      style={{
                        backgroundColor:
                          "#C77D2E",
                      }}
                    >
                      ₹{product.price}
                    </div>
                  </div>

                  {/* ================================================== */}
                  {/* PRODUCT DETAILS */}
                  {/* ================================================== */}

                  <div className="p-5">

                    {/* PRODUCT NAME */}

                    <h2
                      className="
                        text-lg
                        font-bold
                      "
                      style={{
                        color: "#1F2B22",
                      }}
                    >
                      {product.name}
                    </h2>

                    {/* DESCRIPTION */}

                    <p
                      className="
                        mt-2
                        line-clamp-2
                        text-sm
                        leading-relaxed
                      "
                      style={{
                        color: "#6B7268",
                      }}
                    >
                      {product.description}
                    </p>

                    {/* ================================================== */}
                    {/* STOCK */}
                    {/* ================================================== */}

                    <div
                      className="
                        mt-4
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <span
                        className="
                          h-2.5
                          w-2.5
                          rounded-full
                        "
                        style={{
                          backgroundColor:
                            stockColor,
                        }}
                      />

                      <span
                        className="
                          text-xs
                          font-medium
                        "
                        style={{
                          color: stockColor,
                        }}
                      >
                        {stockLabel}
                      </span>
                    </div>

                    {/* ================================================== */}
                    {/* ADD TO CART */}
                    {/* ================================================== */}

                    <button
                      disabled={
                        product.stock === 0
                      }
                      onClick={() =>
                        handleAddToCart(product)
                      }
                      className="
                        mt-5
                        w-full
                        rounded-xl
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-white
                      "
                      style={{
                        backgroundColor:
                          addedId === product.id
                            ? "#3F6C51"
                            : "#1F2B22",

                        opacity:
                          product.stock === 0
                            ? 0.4
                            : 1,

                        cursor:
                          product.stock === 0
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {product.stock === 0
                        ? "Unavailable"
                        : addedId === product.id
                          ? "Added ✓"
                          : "Add to cart"}
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}