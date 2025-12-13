import React from "react";
import { useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { BackgroundRippleEffect } from "../components/ui/background-ripple-effect";
import { ShowcaseTablet } from "../components/ui/showcase-tablet";
import dashboardImage from "../assets/dashboard-img.png";

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-white">
      <BackgroundRippleEffect className="-z-10" />
      {/* Header intentionally removed per request */}

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
          <button
            className="min-w-[200px] rounded-full border border-orange-200 bg-white px-8 py-3 text-base font-semibold text-orange-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 active:translate-y-0"
            onClick={() => navigate("/coming-soon")}
          >
            See Lists
          </button>
        </div>
      </main>
      <ShowcaseTablet src={dashboardImage} className="mt-6" />
    </div>
  );
}
