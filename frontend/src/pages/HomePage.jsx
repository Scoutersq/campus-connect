import React from "react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    title: "Lost & Found",
    description: "Never lose track of your belongings",
    icon: "📍",
  },
  {
    title: "Events",
    description: "Discover and join campus activities",
    icon: "📅",
  },
  {
    title: "Announcements",
    description: "Stay updated with important news",
    icon: "🔔",
  },
  {
    title: "Discussions",
    description: "Connect with your peers",
    icon: "💬",
  },
  {
    title: "Emergency Alerts",
    description: "Real-time safety notifications",
    icon: "🚨",
  },
  {
    title: "Notes Sharing",
    description: "Share and access study materials",
    icon: "📚",
  },
  {
    title: "Skill Exchange",
    description: "Learn and teach skills",
    icon: "🤝",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-[#fff5eb] to-white">
      {/* Header */}
      <header className="border-b border-orange-100 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl bg-orange-100 text-orange-500 rounded-full w-9 h-9 flex items-center justify-center shadow">🎓</span>
            <span className="font-semibold text-orange-500 text-lg">Campus Connect</span>
          </div>
          <button
            className="border-2 border-orange-500 text-orange-500 bg-white rounded-lg px-4 py-1 font-medium hover:bg-orange-50 transition"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="text-center mt-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Connecting Campus Life <br />
          <span className="text-orange-500">Effortlessly</span>
        </h1>
        <p className="text-gray-600 mt-4 text-lg">
          From lost &amp; found to event discovery—your campus, connected.
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <button
            className="bg-orange-500 text-white rounded-lg px-7 py-2 font-semibold shadow hover:bg-orange-400 transition"
            onClick={() => navigate("/login")}
          >
            Login / Signup
          </button>
          <button
            className="border border-orange-500 text-orange-500 bg-white rounded-lg px-7 py-2 font-semibold hover:bg-orange-50 transition"
            onClick={() => navigate("/signup")}
          >
            Admin Access
          </button>
        </div>
      </main>

      {/* Features */}
      <section className="mt-16">
        <h2 className="text-center font-bold text-2xl text-gray-900">Everything You Need</h2>
        <p className="text-center text-gray-500 text-base mb-8">All campus essentials in one place</p>
        <div className="flex flex-wrap gap-8 justify-center max-w-4xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="flex-1 min-w-[260px] max-w-[320px] bg-white border border-orange-100 rounded-2xl p-6 shadow flex flex-col items-start gap-3">
              <span className="text-2xl bg-orange-50 text-orange-500 rounded-lg w-10 h-10 flex items-center justify-center">{f.icon}</span>
              <div>
                <div className="font-semibold text-lg text-gray-900">{f.title}</div>
                <div className="text-gray-500 text-sm mt-1">{f.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom bar */}
      <div className="fixed left-0 right-0 bottom-0 h-2 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600" />
    </div>
  );
}
