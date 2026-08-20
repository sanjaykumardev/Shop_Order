"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ENDPOINTS, apiFetch } from "@/lib/api";
import { setAdminToken } from "@/lib/adminSession";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const res = await apiFetch(ENDPOINTS.adminLogin, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setAdminToken(res.token);
      router.push("/admin/orders");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message.includes("Invalid credentials") ? "Invalid username or password." : message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1F2B22] px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">

        <p className="mb-1 text-xs uppercase tracking-widest text-[#3F6C51]">
          Owner access
        </p>

        <h1 className="mb-6 text-2xl font-bold text-[#1F2B22]">
          Shop admin login
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          {/* Username */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#3F6C51]">
              Username
            </label>
            <input
              className="w-full rounded-[10px] border border-[#D8D9CC] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-[#3F6C51]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#3F6C51]">
              Password
            </label>
            <input
              className="w-full rounded-[10px] border border-[#D8D9CC] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-[#3F6C51]"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-sm text-[#C0463B]">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-[#1F2B22] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2F5233] active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}