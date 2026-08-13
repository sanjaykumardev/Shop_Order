"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ENDPOINTS } from "@/lib/api";
import {
  clearAdminToken,
  getAdminToken,
} from "@/lib/adminSession";

export default function AdminSettingsPage() {

  const router = useRouter();

  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleChangeCredentials(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (!username && !newPassword) {
      setError("Please enter a new username or new password.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const token = getAdminToken();

      if (!token) {
        setError("Admin session expired. Please login again.");
        router.push("/admin/login");
        return;
      }

      const response = await fetch(
        ENDPOINTS.adminChangeCredentials,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            username,
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        clearAdminToken();
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        setError(
          data.detail ||
          "Unable to change admin credentials."
        );
        return;
      }

      setMessage(
        "Admin credentials updated successfully."
      );

    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
   }
  }

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "#EDEEE6",
      }}
    >
      <div className="mx-auto max-w-2xl px-6 py-10">

        {/* HEADER */}

        <div className="mb-8">
          <p
            className="mb-2 text-xs uppercase tracking-widest"
            style={{
              color: "#3F6C51",
            }}
          >
            Admin Account
          </p>

          <h1
            className="text-3xl font-bold"
            style={{
              color: "#1F2B22",
            }}
          >
            Account Settings
          </h1>

          <p
            className="mt-2 text-sm"
            style={{
              color: "#6B7268",
            }}
          >
            Change the username or password used
            to access the admin dashboard.
          </p>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleChangeCredentials}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >

          {/* NEW USERNAME */}

          <div className="mb-5">
            <label
              className="mb-2 block text-sm font-medium"
              style={{
                color: "#1F2B22",
              }}
            >
              New Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter new username"
              className="
                w-full
                rounded-xl
                border
                px-4
                py-3
                text-sm
                outline-none
              "
              style={{
                borderColor: "#D8D9CC",
              }}
            />
          </div>

          {/* CURRENT PASSWORD */}

          <div className="mb-5">
            <label
              className="mb-2 block text-sm font-medium"
              style={{
                color: "#1F2B22",
              }}
            >
              Current Password
            </label>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              placeholder="Enter current password"
              className="
                w-full
                rounded-xl
                border
                px-4
                py-3
                text-sm
                outline-none
              "
              style={{
                borderColor: "#D8D9CC",
              }}
            />
          </div>

          {/* NEW PASSWORD */}

          <div className="mb-5">
            <label
              className="mb-2 block text-sm font-medium"
              style={{
                color: "#1F2B22",
              }}
            >
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              placeholder="Enter new password"
              className="
                w-full
                rounded-xl
                border
                px-4
                py-3
                text-sm
                outline-none
              "
              style={{
                borderColor: "#D8D9CC",
              }}
            />
          </div>

          {/* CONFIRM PASSWORD */}

          <div className="mb-6">
            <label
              className="mb-2 block text-sm font-medium"
              style={{
                color: "#1F2B22",
              }}
            >
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm new password"
              className="
                w-full
                rounded-xl
                border
                px-4
                py-3
                text-sm
                outline-none
              "
              style={{
                borderColor: "#D8D9CC",
              }}
            />
          </div>

          {/* ERROR */}

          {error && (
            <div
              className="mb-5 rounded-xl p-3 text-sm"
              style={{
                backgroundColor: "#FCE8E6",
                color: "#C0463B",
              }}
            >
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {message && (
            <div
              className="mb-5 rounded-xl p-3 text-sm"
              style={{
                backgroundColor: "#E5F0E7",
                color: "#3F6C51",
              }}
            >
              {message}
            </div>
          )}

          {/* BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              rounded-xl
              px-4
              py-3
              text-sm
              font-semibold
              text-white
            "
            style={{
              backgroundColor: "#1F2B22",
              opacity: loading ? 0.6 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Updating..."
              : "Update Admin Credentials"}
          </button>

        </form>

        {/* BACK BUTTON */}

        <button
          type="button"
          onClick={() =>
            router.push("/admin/dashboard")
          }
          className="mt-5 text-sm font-medium"
          style={{
            color: "#3F6C51",
          }}
        >
          ← Back to Dashboard
        </button>

      </div>
    </main>
  );
}