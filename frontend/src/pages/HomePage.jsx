import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { BackgroundRippleEffect } from "../components/ui/background-ripple-effect";
import { ShowcaseTablet } from "../components/ui/showcase-tablet";
import { FaDiscord, FaInstagram, FaXTwitter } from "react-icons/fa6";
import { FaChevronDown } from "react-icons/fa";
import dashboardImage from "../assets/dashboard-img.png";

const features = [
  {
    title: "Lost and Found",
    description: "Report missing items and browse campus submissions in seconds.",
  },
  {
    title: "Events",
    description: "Discover upcoming campus happenings with RSVP tracking and reminders.",
  },
  {
    title: "Announcements",
    description: "Stay aligned with verified updates from administrators and clubs.",
  },
  {
    title: "Emergency Alerts",
    description: "Receive urgent safety notifications and broadcast quick status updates.",
  },
  {
    title: "AI",
    description: "Chat with the Groq-powered assistant for instant campus guidance.",
  },
  {
    title: "Discussion",
    description: "Join live rooms to collaborate, brainstorm, and keep conversations flowing.",
  },
  {
    title: "Notes Sharing",
    description: "Exchange lecture notes and study guides securely with classmates.",
  },
  {
    title: "Skill Exchange",
    description: "Offer mentorship or request new skills within a trusted campus network.",
  },
];


export default function HomePage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const toggleFeature = (index) => {
    setActiveFeature((current) => (current === index ? -1 : index));
  };
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-white">
      <BackgroundRippleEffect className="-z-10" />
      {/* Header intentionally removed per request */}

      <div className="absolute right-4 top-8 z-40 flex items-center gap-3 sm:right-8 sm:top-12">
        <button
          type="button"
          aria-label="Discord"
          className="group flex h-11 w-11 items-center justify-center rounded-full border border-orange-100 bg-white text-slate-500 shadow-sm transition hover:border-orange-400 hover:bg-orange-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
        >
          <span className="sr-only">Discord</span>
          <FaDiscord className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Instagram"
          className="group flex h-11 w-11 items-center justify-center rounded-full border border-orange-100 bg-white text-slate-500 shadow-sm transition hover:border-orange-400 hover:bg-orange-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
        >
          <span className="sr-only">Instagram</span>
          <FaInstagram className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="X"
          className="group flex h-11 w-11 items-center justify-center rounded-full border border-orange-100 bg-white text-slate-500 shadow-sm transition hover:border-orange-400 hover:bg-orange-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
        >
          <span className="sr-only">X</span>
          <FaXTwitter className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
        </button>
      </div>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center flex-1 px-6 pt-36 pb-16 text-center">
        <BrandLogo className="h-40 mb-5" />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
          Connecting Campus Life
        </h1>
        <h2 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-semibold text-orange-500 leading-tight">
          Effortlessly
        </h2>
        <p className="mt-6 max-w-2xl text-gray-600 text-lg sm:text-xl">
          From lost &amp; found to event discovery—your campus, connected.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            className="min-w-[200px] rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-orange-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:from-orange-400 hover:to-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 active:translate-y-0"
            onClick={() => navigate("/signup")}
          >
            Join Community
          </button>
          <a
            href="/coming-soon.html"
            className="min-w-[200px] rounded-full border border-orange-200 bg-white px-8 py-3 text-base font-semibold text-orange-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 active:translate-y-0"
          >
            See Lists
          </a>
        </div>
      </main>
      <ShowcaseTablet src={dashboardImage} className="mt-6" />

      <section className="relative z-10 mx-auto mt-16 w-full max-w-5xl px-6 pb-24">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
            Features
          </span>
          <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Everything Your Campus Needs
          </h2>
          <p className="mt-3 max-w-2xl text-base text-gray-600 sm:text-lg">
            Explore the connected toolkit built to keep students, mentors, and admins in sync.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => {
            const isActive = index === activeFeature;
            return (
              <div
                key={feature.title}
                className={`flex flex-col rounded-2xl border border-orange-100 bg-white/90 shadow-sm backdrop-blur transition-all duration-300 ${
                  isActive ? "shadow-lg ring-1 ring-orange-200" : "hover:shadow-md"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFeature(index)}
                  aria-expanded={isActive}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{feature.title}</p>
                  </div>
                  <FaChevronDown
                    className={`h-5 w-5 text-orange-500 transition-transform ${isActive ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="px-5 pb-5 text-base text-gray-600">
                    {feature.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
