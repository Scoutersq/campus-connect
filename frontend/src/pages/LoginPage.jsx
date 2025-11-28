import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const roles = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
];

export default function LoginPage() {
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRole = (r) => {
    setRole(r);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = role === "admin" ? "/api/auth/admin/signin" : "/api/auth/user/signin";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      // Store role and redirect to dashboard
      localStorage.setItem("cc_role", role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white via-[#fff5eb] to-white">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8 border border-orange-100">
        <div className="flex justify-center mb-6 gap-2">
          {roles.map((r) => (
            <button
              key={r.value}
              className={`px-4 py-2 rounded-lg font-semibold border transition text-sm ${role === r.value ? "bg-orange-500 text-white border-orange-500" : "bg-white text-orange-500 border-orange-200 hover:bg-orange-50"}`}
              onClick={() => handleRole(r.value)}
              type="button"
            >
              {r.label} Login
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Enter your password"
            />
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-orange-500 text-white rounded-lg py-2 font-semibold mt-2 hover:bg-orange-400 transition"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account? <a href="/signup" className="text-orange-500 font-semibold hover:underline">Sign up</a>
        </div>
      </div>
    </div>
  );
}
