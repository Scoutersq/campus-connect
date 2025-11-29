import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../utils/fetchResource";

export default function SignupPage() {
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
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
    setFieldErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    if (role === "user" && !form.studentId.trim()) {
      setFieldErrors({ studentId: "Student ID is required." });
      return;
    }

    setLoading(true);
    try {
      const endpoint = role === "admin" ? "/api/auth/admin/signup" : "/api/auth/user/signup";
      const payload =
        role === "admin"
          ? {
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email,
              password: form.password,
            }
          : {
              firstName: form.firstName,
              lastName: form.lastName,
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

      let data = {};
      const raw = await response.text();
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch (parseError) {
          data = {};
        }
      }

      if (!response.ok) {
        setError(data.message || "Signup failed.");
        if (Array.isArray(data.errors)) {
          const nextFieldErrors = {};
          data.errors.forEach((issue) => {
            nextFieldErrors[issue.path] = issue.message;
          });
          setFieldErrors(nextFieldErrors);
        }
        return;
      }

      const signinEndpoint = role === "admin" ? "/api/auth/admin/signin" : "/api/auth/user/signin";
      const signinPayload =
        role === "admin"
          ? { email: form.email, password: form.password }
          : {
              email: form.email,
              password: form.password,
              studentId: form.studentId.trim().toUpperCase(),
            };

      const signinResponse = await fetch(buildApiUrl(signinEndpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signinPayload),
        credentials: "include",
      });

      const signinData = await signinResponse.json();
      if (!signinResponse.ok) {
        setError(signinData.message || "Login after signup failed.");
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
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5eb] to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center gap-3 mb-8 text-center">
        <div className="flex items-center gap-2 text-3xl font-semibold text-orange-500">
          <span role="img" aria-label="graduation cap">🎓</span>
          <span>Campus Connect</span>
        </div>
        <p className="text-sm text-gray-500">Connect with your campus community</p>
      </div>

      <div className="w-full max-w-2xl bg-white border border-orange-100 rounded-3xl shadow-sm px-8 py-10">
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
          <Link
            to="/login"
            className="flex-1 text-center py-2 bg-orange-50 text-orange-500 hover:bg-orange-100"
          >
            Login
          </Link>
          <span className="flex-1 text-center py-2 bg-orange-500 text-white">Sign Up</span>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              placeholder="John"
              value={form.firstName}
              onChange={handleChange}
              required
              className="rounded-xl border border-orange-100 px-4 py-2.5 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            {fieldErrors.firstName && <span className="text-xs text-red-500 mt-1">{fieldErrors.firstName}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              placeholder="Doe"
              value={form.lastName}
              onChange={handleChange}
              required
              className="rounded-xl border border-orange-100 px-4 py-2.5 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            {fieldErrors.lastName && <span className="text-xs text-red-500 mt-1">{fieldErrors.lastName}</span>}
          </div>

          <div className="md:col-span-2 flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="student@campus.edu"
              value={form.email}
              onChange={handleChange}
              required
              className="rounded-xl border border-orange-100 px-4 py-2.5 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            {fieldErrors.email && <span className="text-xs text-red-500 mt-1">{fieldErrors.email}</span>}
          </div>

          {role === "user" && (
            <div className="md:col-span-2 flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Student ID</label>
              <input
                type="text"
                name="studentId"
                placeholder="ST10"
                value={form.studentId}
                onChange={handleChange}
                required
                className="rounded-xl border border-orange-100 px-4 py-2.5 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              {fieldErrors.studentId && <span className="text-xs text-red-500 mt-1">{fieldErrors.studentId}</span>}
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              maxLength={80}
              className="rounded-xl border border-orange-100 px-4 py-2.5 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            {fieldErrors.password && <span className="text-xs text-red-500 mt-1">{fieldErrors.password}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="rounded-xl border border-orange-100 px-4 py-2.5 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            {fieldErrors.confirmPassword && <span className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</span>}
          </div>

          {error && (
            <div className="md:col-span-2 text-center text-sm text-red-500">{error}</div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 py-2.5 text-white font-semibold hover:from-orange-400 hover:to-orange-300 transition disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>

      <Link to="/" className="mt-8 text-sm text-gray-500 hover:text-orange-500">
        Back to Home
      </Link>
    </div>
  );
}
