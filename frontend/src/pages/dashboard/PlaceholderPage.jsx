import React from "react";

export default function PlaceholderPage({ title }) {
  return (
    <div className="rounded-xl border border-orange-100 bg-white p-10 shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
      <p className="mt-2 text-gray-500">
        This section is under construction. Explore the other modules from the sidebar in the meantime.
      </p>
    </div>
  );
}
