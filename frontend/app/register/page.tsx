"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ENDPOINTS, apiFetch } from "@/lib/api";
import { setCustomer } from "@/lib/session";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!name.trim() || !phone.trim()) {
      setError("Enter your name and phone number.");
      return;
    }

    const cleanPhone = phone.replace(/\s+/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Enter a valid 10-digit mobile number (starts with 6-9).");
      return;
    }

    setSubmitting(true);

    try {
      const customer = await apiFetch(ENDPOINTS.registerCustomer, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
        }),
      });

      setCustomer(customer);

      router.push("/products");
    } catch (err) {
      console.error(err);
      setError(
        "Could not register. Check the server is running and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#EDEEE6] px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">

        <p className="mb-1 text-xs uppercase tracking-widest text-[#3F6C51]">
          Welcome
        </p>

        <h1 className="mb-6 text-2xl font-bold text-[#1F2B22]">
          Tell us who&apos;s ordering
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1F2B22]">
              Name
            </label>

            <input
              className="w-full rounded-[10px] border border-[#D8D9CC] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-[#3F6C51]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              type="text"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1F2B22]">
              Phone number
            </label>

            <input
              className="w-full rounded-[10px] border border-[#D8D9CC] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-[#3F6C51]"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              type="tel"
              autoComplete="tel"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-[#C0463B]">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-[#1F2B22] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2F5233] active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Continuing..." : "Continue to shop"}
          </button>

        </form>
      </div>
    </main>
  );
}