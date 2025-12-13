import React from "react";

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-white flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full rounded-3xl border border-orange-100 bg-white/90 p-12 text-center shadow-xl backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-400">Stay Tuned</p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-gray-900">
          Coming <span className="text-orange-500">Soon</span>
        </h1>
        <p className="mt-6 text-base text-gray-600">
          We are crafting something special for this section. Check back shortly to explore the complete list of campus resources and opportunities.
        </p>
      </div>
    </div>
  );
}
