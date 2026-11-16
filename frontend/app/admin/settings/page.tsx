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
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState ("");

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

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
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
            new_username: username,
            new_email: email,
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

  async function handleCreateUser() {
    setError("");
    setMessage("");

    if (!createUsername || !createEmail || !createPassword) {
      setError("username, email and password are required.");
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
        ENDPOINTS.adminCreateUser,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            username: createUsername,
            email: createEmail,
            password: createPassword,
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
          "Unable to create admin user."
        );
        return;
      }

      setMessage(
        "New admin user created successfully. OTP sent to their email."
      );

      // Reset create form fields
      setCreateUsername("");
      setCreateEmail("");
      setCreatePassword("");
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

          {/* EMAIL (used for the OTP login code) */}

          <div className="mb-5">
            <label
              className="mb-2 block text-sm font-medium"
              style={{
                color: "#1F2B22",
              }}
            >
              Email
              <span
                className="ml-2 text-xs"
                style={{
                  color: "#6B7268",
                }}
              >
                used for the 2-step login code
              </span>
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
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

          {/* CREATE NEW USER SECTION */}

          <div className="mb-5 border-t pt-4">
            <h3 className="mb-3 text-sm font-medium text-[#6B7268]">
              Create New Admin User
            </h3>
            <p className="text-xs text-[#6B7268] mb-2">
              Set up a new administrator account with username, email, and password.
              The new user will receive an OTP for 2-step verification.
            </p>

            <div className="mb-3">
              <label className="block text-sm font-medium text-[#1F2B22]">
                New Username
              </label>
              <input
                type="text"
                value={createUsername}
                onChange={(event) => setCreateUsername(event.target.value)}
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
                style={{ borderColor: "#D8D9CC" }}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-[#1F2B22]">
                New Email
              </label>
              <input
                type="email"
                value={createEmail}
                onChange={(event) => setCreateEmail(event.target.value)}
                placeholder="Enter new email"
                className="
                  w-full
                  rounded-xl
                  border
                  px-4
                  py-3
                  text-sm
                  outline-none
                "
                style={{ borderColor: "#D8D9CC" }}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-[#1F2B22]">
                New Password
              </label>
              <input
                type="password"
                value={createPassword}
                onChange={(event) => setCreatePassword(event.target.value)}
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
                style={{ borderColor: "#D8D9CC" }}
              />
            </div>

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
                disabled:opacity-60
              "
              style={{
                backgroundColor: "#1F2B22",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading
                ? "Creating..."
                : createUsername || createEmail || createPassword
                ? "Creating User..."
                : "Create New Admin User"}
            </button>
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
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Updating..."
              : "Update Admin Credentials"}
          </button>

        </form>

        {/* CREATE NEW USER BUTTON (outside form for dedicated action) */}

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