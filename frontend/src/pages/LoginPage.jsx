import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../utils/fetchResource";

export default function LoginPage() {
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ email: "", password: "", studentId: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "studentId" ? value.toUpperCase() : value,
    }));
  };

  const toggleRole = () => {
    setRole((prev) => (prev === "user" ? "admin" : "user"));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (role === "user" && !form.studentId.trim()) {
      setError("Student ID is required.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = role === "admin" ? "/api/auth/admin/signin" : "/api/auth/user/signin";
      const payload =
        role === "admin"
          ? { email: form.email, password: form.password }
          : {
              email: form.email,
              password: form.password,
              studentId: form.studentId.trim().toUpperCase(),
            };

      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      localStorage.setItem("cc_role", role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5eb] to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center gap-3 mb-8 text-center">
        <div className="flex items-center gap-2 text-3xl font-semibold text-orange-500">
          <span role="img" aria-label="graduation cap">🎓</span>
          <span>Campus Connect</span>
        </div>
        <p className="text-sm text-gray-500">Connect with your campus community</p>
      </div>

      <div className="w-full max-w-xl bg-white border border-orange-100 rounded-3xl shadow-sm px-8 py-10">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3 rounded-full border border-orange-100 bg-[#fff5eb] px-6 py-2 shadow-sm">
            <span className={`text-sm font-semibold transition-colors ${role === "user" ? "text-orange-600" : "text-gray-400"}`}>
              User
            </span>
            <button
              type="button"
              onClick={toggleRole}
              className="relative h-6 w-12 rounded-full bg-white border border-orange-200 transition"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-transform shadow ${role === "admin" ? "translate-x-[1.75rem]" : "translate-x-0"}`}
              />
            </button>
            <span className={`text-sm font-semibold transition-colors ${role === "admin" ? "text-orange-600" : "text-gray-400"}`}>
              Admin
            </span>
          </div>
        </div>

        <div className="flex rounded-full border border-orange-100 overflow-hidden text-sm font-semibold mb-8">
          <span className="flex-1 text-center py-2 bg-orange-500 text-white">Login</span>
          <Link
            to="/signup"
            className="flex-1 text-center py-2 bg-orange-50 text-orange-500 hover:bg-orange-100"
          >
            Sign Up
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="student@campus.edu"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-orange-100 px-4 py-2.5 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>

          {role === "user" && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Student ID</label>
              <input
                type="text"
                name="studentId"
                placeholder="ST5"
                value={form.studentId}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-orange-100 px-4 py-2.5 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-orange-100 px-4 py-2.5 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>

          {error && <div className="text-center text-sm text-red-500">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 py-2.5 text-white font-semibold hover:from-orange-400 hover:to-orange-300 transition disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>

      <Link to="/" className="mt-8 text-sm text-gray-500 hover:text-orange-500">
        Back to Home
      </Link>
    </div>
  );
}
