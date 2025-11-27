import React from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../utils/fetchResource";

export default function ReportItemForm({ onClose, onSuccess }) {
  const [category, setCategory] = React.useState("lost");
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    location: "",
    contact: "",
    image: "",
    date: "",
  });
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setForm({
      title: "",
      description: "",
      location: "",
      contact: "",
      image: "",
      date: "",
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      let payload;
      let endpoint;
      if (category === "lost") {
        payload = {
          title: form.title,
          description: form.description,
          location: form.location,
          contact: form.contact,
          dateLost: form.date ? new Date(form.date).toISOString() : undefined,
        };
        if (form.image && form.image.trim() !== "") {
          payload.image = form.image;
        }
        endpoint = "/api/lost/report";
      } else {
        payload = {
          title: form.title,
          description: form.description,
          location: form.location,
          contact: form.contact,
          date: form.date ? new Date(form.date).toISOString() : undefined,
        };
        if (form.image && form.image.trim() !== "") {
          try {
            new URL(form.image);
            payload.image = form.image;
          } catch {
            setError("Image must be a valid URL.");
            setLoading(false);
            return;
          }
        }
        endpoint = "/api/found/report";
      }

      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to report item");
      }

      setSuccess("Item reported successfully.");
      toast.success("Item reported successfully.");
      setForm({ title: "", description: "", location: "", contact: "", image: "", date: "" });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to report item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-xl border border-orange-100 bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={() => onClose?.()}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-500 transition hover:bg-orange-500 hover:text-white"
        >
          ⟵ Back to Lost &amp; Found
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Report Item</h1>
        <p className="mb-6 text-sm text-gray-500">Help us reunite items with their owners</p>
        <div className="rounded-lg border border-orange-100 bg-[#fff8f3] p-6">
          <h2 className="text-lg font-semibold text-gray-800">Item Details</h2>
          <p className="mb-4 text-sm text-gray-400">Provide as much detail as possible</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Item Name</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g., Blue Backpack"
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                value={category}
                onChange={handleCategoryChange}
                required
                className="w-full rounded border px-3 py-2"
              >
                <option value="">Select category</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                placeholder="e.g., Library 2nd Floor"
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                placeholder="Provide detailed description..."
                className="min-h-[80px] w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contact Information</label>
              <input
                name="contact"
                value={form.contact}
                onChange={handleChange}
                required
                placeholder="your.email@campus.edu"
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <input name="image" value={form.image} onChange={handleChange} type="hidden" />
            {error && <div className="text-sm text-red-500">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-gradient-to-r from-orange-400 to-orange-600 py-2 font-semibold text-white transition hover:from-orange-500 hover:to-orange-700 disabled:opacity-70"
            >
              {loading ? "Reporting..." : "Submit Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
