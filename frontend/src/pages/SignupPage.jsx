import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../utils/fetchResource";
import { setPortalRole } from "../utils/portalRole";
import logoAsset from "../assets/cc-2-logo.webp";

export default function SignupPage() {
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    adminCode: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    const shouldUppercase = name === "studentId" || name === "adminCode";
    setForm((prev) => ({
      ...prev,
      [name]: shouldUppercase ? value.toUpperCase() : value,
    }));
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

    if (role === "admin" && !form.adminCode.trim()) {
      setFieldErrors({ adminCode: "Admin code is required." });
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
              adminCode: form.adminCode.trim().toUpperCase(),
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
          ? {
              email: form.email,
              password: form.password,
              adminCode: form.adminCode.trim().toUpperCase(),
            }
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

      setPortalRole(role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fef9f6] via-[#fff5eb] to-[#fef9f6] flex flex-col items-center justify-center px-4 py-8">
      {/* Logo and Title */}
      <div className="flex flex-col items-center gap-0 mb-6">
        <img
          src={logoAsset}
          alt="Campus Connect"
          className="h-36 w-36 object-contain rounded-2xl"
        />
        <h1 className="text-2xl font-bold text-gray-800">Campus Connect</h1>
        <p className="text-sm text-gray-500">Connect with your campus community</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 px-8 py-8">
        {/* Role Toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              type="button"
              onClick={() => { setRole("user"); setError(""); setFieldErrors({}); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                role === "user"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              User
            </button>
            <button
              type="button"
              onClick={() => { setRole("admin"); setError(""); setFieldErrors({}); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                role === "admin"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin
            </button>
          </div>
        </div>

        {/* Login/Signup Tabs */}
        <div className="flex rounded-full overflow-hidden mb-6">
          <Link
            to="/login"
            className="flex-1 text-center py-2.5 bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Login
          </Link>
          <span className="flex-1 text-center py-2.5 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold text-sm">
            Sign Up
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 text-sm"
                />
              </div>
              {fieldErrors.firstName && <span className="text-xs text-red-500 mt-1">{fieldErrors.firstName}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 text-sm"
                />
              </div>
              {fieldErrors.lastName && <span className="text-xs text-red-500 mt-1">{fieldErrors.lastName}</span>}
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                name="email"
                placeholder="student@campus.edu"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 text-sm"
              />
            </div>
            {fieldErrors.email && <span className="text-xs text-red-500 mt-1">{fieldErrors.email}</span>}
          </div>

          {/* Student ID Field (User) */}
          {role === "user" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Student ID</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="studentId"
                  placeholder="ST123"
                  value={form.studentId}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 text-sm"
                />
              </div>
              {fieldErrors.studentId && <span className="text-xs text-red-500 mt-1">{fieldErrors.studentId}</span>}
            </div>
          )}

          {/* Admin Code Field (Admin) */}
          {role === "admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Code</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="adminCode"
                  placeholder="ADM123"
                  value={form.adminCode}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 text-sm"
                />
              </div>
              {fieldErrors.adminCode && <span className="text-xs text-red-500 mt-1">{fieldErrors.adminCode}</span>}
            </div>
          )}

          {/* Password Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  maxLength={80}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <span className="text-xs text-red-500 mt-1">{fieldErrors.password}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && <span className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</span>}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center text-sm text-red-500 bg-red-50 rounded-lg py-2">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 py-3 text-white font-semibold hover:from-orange-600 hover:to-orange-500 transition-all disabled:opacity-70 shadow-md shadow-orange-200"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          {/* Back to Home */}
          <Link 
            to="/" 
            className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors mt-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-400">
        By continuing, you agree to our{" "}
        <span className="text-orange-500 hover:underline cursor-pointer">Terms of Service</span>
        {" "}and{" "}
        <span className="text-orange-500 hover:underline cursor-pointer">Privacy Policy</span>
      </p>
    </div>
  );
}
