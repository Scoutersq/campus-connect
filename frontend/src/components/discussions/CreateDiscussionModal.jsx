import { useState, useEffect } from "react";

export function CreateDiscussionModal({ open, onClose, onSubmit, busy }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicTag, setTopicTag] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setTopicTag("");
    }
  }, [open]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (typeof onSubmit === "function") {
      onSubmit({ title, description, topicTag });
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 text-sm font-semibold text-slate-400 transition hover:text-slate-600"
        >
          X
        </button>
        <h2 className="text-2xl font-semibold text-slate-900">Start a new discussion</h2>
        <p className="mt-2 text-sm text-slate-500">
          Set the stage with a concise overview and let your peers jump in.
        </p>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Discussion title
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={120}
              placeholder="Best study spots on campus?"
              className="w-full rounded-2xl border border-orange-100 px-4 py-3 text-sm font-medium text-slate-800 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Topic tag (optional)
            </label>
            <input
              type="text"
              value={topicTag}
              onChange={(event) => setTopicTag(event.target.value)}
              maxLength={50}
              placeholder="Campus Life"
              className="w-full rounded-2xl border border-orange-100 px-4 py-3 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              minLength={10}
              maxLength={500}
              rows={4}
              placeholder="Share the context and invite others to weigh in."
              className="w-full rounded-2xl border border-orange-100 px-4 py-3 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:from-orange-600 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create discussion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
