import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/fetchResource";

const roles = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
];

export default function SignupPage() {
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
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
    setFieldErrors({});
    setLoading(true);
    try {
      const endpoint = role === "admin" ? "/api/auth/admin/signup" : "/api/auth/user/signup";
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      let data = {};
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = {};
      }
      if (!res.ok) {
        setError(data.message || "Signup failed");
        if (data.errors) {
          // Map errors to fields
          const fe = {};
          data.errors.forEach((err) => {
            fe[err.path] = err.message;
          });
          setFieldErrors(fe);
        }
        return;
      }
      // After signup, automatically log the user in
      const loginEndpoint = role === "admin" ? "/api/auth/admin/signin" : "/api/auth/user/signin";
      const loginRes = await apiFetch(loginEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        setError(loginData.message || "Login after signup failed");
        setLoading(false);
        return;
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
              {r.label} Signup
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="First name"
              />
              {fieldErrors.firstName && <div className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</div>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Last name"
              />
              {fieldErrors.lastName && <div className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</div>}
            </div>
          </div>
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
            {fieldErrors.email && <div className="text-red-500 text-xs mt-1">{fieldErrors.email}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-gray-400">(6-80 characters)</span></label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              maxLength={80}
              className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Create a password"
            />
            {fieldErrors.password && <div className="text-red-500 text-xs mt-1">{fieldErrors.password}</div>}
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-orange-500 text-white rounded-lg py-2 font-semibold mt-2 hover:bg-orange-400 transition"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Signup"}
          </button>
        </form>
        <div className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <a href="/login" className="text-orange-500 font-semibold hover:underline">Login</a>
        </div>
      </div>
    </div>
  );
}
