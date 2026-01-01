import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { BackgroundRippleEffect } from "../components/ui/background-ripple-effect";
import { ShowcaseTablet } from "../components/ui/showcase-tablet";
import { FaDiscord, FaInstagram, FaXTwitter } from "react-icons/fa6";
import {
  FaChevronDown,
  FaBoxOpen,
  FaCalendarCheck,
  FaBullhorn,
  FaBell,
  FaRobot,
  FaComments,
  FaBookOpen,
  FaHandshake,
} from "react-icons/fa";
import dashboardImage from "../assets/dashboard-img.png";
import lostAndFoundImage from "../assets/lostandfound.png";
import eventsImage from "../assets/events.png";
import emergencyImage from "../assets/emergency.png";
import discussionsImage from "../assets/discussions.png";
import notesImage from "../assets/notes.png";

const showcaseSlides = [
  { src: dashboardImage, alt: "Dashboard overview" },
  { src: lostAndFoundImage, alt: "Lost and found submissions" },
  { src: eventsImage, alt: "Upcoming events listings" },
  { src: emergencyImage, alt: "Emergency alerts" },
  { src: discussionsImage, alt: "Live discussions" },
  { src: notesImage, alt: "Notes sharing" },
];

const howItWorks = [
  {
    step: "Step 1",
    title: "Sign Up & Get Verified",
    description:
      "Students sign up using their college details and get verified through college email, ID card, or admin approval so only real students can join.",
  },
  {
    step: "Step 2",
    title: "Connect with Your College",
    description:
      "After verification, students join their own college community where they can see notices, events, notes, groups, chats, and daily campus updates.",
  },
  {
    step: "Step 3",
    title: "Learn, Share & Grow Together",
    description:
      "Students can share notes, find lost items, exchange skills, get mentorship, connect with other colleges, and use everything related to campus life in one app.",
  },
];

const features = [
  {
    title: "Lost and Found",
    description: "Report missing items and browse campus submissions in seconds.",
    icon: FaBoxOpen,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Events",
    description: "Discover upcoming campus happenings with RSVP tracking and reminders.",
    icon: FaCalendarCheck,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    title: "Announcements",
    description: "Stay aligned with verified updates from administrators and clubs.",
    icon: FaBullhorn,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-500",
  },
  {
    title: "Emergency Alerts",
    description: "Receive urgent safety notifications and broadcast quick status updates.",
    icon: FaBell,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
  },
  {
    title: "AI",
    description: "Chat with the Groq-powered assistant for instant campus guidance.",
    icon: FaRobot,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
  },
  {
    title: "Discussion",
    description: "Join live rooms to collaborate, brainstorm, and keep conversations flowing.",
    icon: FaComments,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  {
    title: "Notes Sharing",
    description: "Exchange lecture notes and study guides securely with classmates.",
    icon: FaBookOpen,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-500",
  },
  {
    title: "Skill Exchange",
    description: "Offer mentorship or request new skills within a trusted campus network.",
    icon: FaHandshake,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
  },
];

const faqs = [
  {
    question: "What is Campus Connect?",
    answer:
      "A platform for students to find campus events, form study groups, and connect with classmates in a trusted, university-only environment.",
  },
  {
    question: "Who can use Campus Connect?",
    answer:
      "It's primarily for students with a valid university email address (.edu). Verified student organizations and faculty may also have access.",
  },
  {
    question: "Is Campus Connect free to use?",
    answer: "Yes. The core platform is, and will always be, free for individual students.",
  },
  {
    question: "Can I customize my profile?",
    answer:
      "Yes. You can add your major, courses, and interests to help others connect with you. You control what information is visible.",
  },
  {
    question: "What data do you collect about me?",
    answer:
      "We only collect the minimum data needed: your student email for verification and information you voluntarily add to your profile.",
  },
  {
    question: "Will you sell our data?",
    answer:
      "Absolutely not. Our mission is to serve students, and that includes protecting your privacy. We never sell student data.",
  },
  {
    question: "How is content moderated?",
    answer:
      "Through a combination of community reporting tools and review by our team to ensure a safe and respectful environment.",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeFaq, setActiveFaq] = useState(0);
  const [showSnowfall, setShowSnowfall] = useState(false);
  const SnowfallRef = useRef(null);
  const loadingSnowfallRef = useRef(false);

  const toggleFeature = (index) => {
    setActiveFeature((current) => (current === index ? -1 : index));
  };

  const toggleFaq = (index) => {
    setActiveFaq((current) => (current === index ? -1 : index));
  };
  // Inject font links asynchronously to avoid blocking initial render
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = '';
    document.head.appendChild(preconnect2);

    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = "https://fonts.googleapis.com/css2?family=Edu+AU+VIC+WA+NT+Pre:wght@400;500;600;700&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&family=Red+Hat+Display:wght@300;700&display=swap";
    document.head.appendChild(sheet);

    // add small style block for classes
    const style = document.createElement('style');
    style.textContent = `.edu-hand{font-family: 'Edu AU VIC WA NT Pre', cursive;} .ubuntu-text{font-family: 'Ubuntu', sans-serif;} .redhat-bold{font-family: 'Red Hat Display', sans-serif; font-weight: 700; font-style: normal;}`;
    document.head.appendChild(style);

    return () => {
      try { document.head.removeChild(preconnect1); } catch {};
      try { document.head.removeChild(preconnect2); } catch {};
      try { document.head.removeChild(sheet); } catch {};
      try { document.head.removeChild(style); } catch {};
    };
  }, []);
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-white">
      <BackgroundRippleEffect className="-z-10" />
      {/* Snowfall effect (lazy-loaded to improve initial load) */}
      {showSnowfall && SnowfallRef.current
        ? React.createElement(SnowfallRef.current, { style: { position: 'fixed', width: '100vw', height: '100vh', zIndex: 50, pointerEvents: 'none' }, snowflakeCount: 60 })
        : null}
      {/* Snowflake button (moved to top-left, smaller) */}
      <button
        aria-label="Let it snow!"
        className="fixed z-50 left-3 top-3 sm:left-6 sm:top-6 bg-white bg-opacity-80 rounded-full shadow-lg border border-blue-100 hover:bg-blue-50 transition p-2 flex items-center justify-center"
        style={{ width: 40, height: 40 }}
        onClick={async () => {
          // Lazy-load react-snowfall only when user requests it to reduce bundle size and CPU usage
          if (!SnowfallRef.current && !loadingSnowfallRef.current) {
            loadingSnowfallRef.current = true;
            try {
              const mod = await import('react-snowfall');
              SnowfallRef.current = mod.default || mod;
            } catch (err) {
              // fail silently so app logic isn't affected
              // eslint-disable-next-line no-console
              console.error('Failed to load snowfall:', err);
            } finally {
              loadingSnowfallRef.current = false;
              setShowSnowfall(true);
            }
          } else {
            setShowSnowfall((s) => !s);
          }
        }}
        title={showSnowfall ? 'Stop Snowfall' : 'Start Snowfall'}
      >
        <span role="img" aria-label="snowflake" style={{ fontSize: 20, color: showSnowfall ? '#60a5fa' : '#64748b', transition: 'color 0.2s' }}>❄️</span>
      </button>
      {/* Header intentionally removed per request */}

      <div className="absolute right-4 top-8 z-40 hidden items-center gap-3 sm:flex sm:right-8 sm:top-12">
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
      <main className="flex flex-col items-center justify-center flex-1 px-4 pt-28 pb-12 text-center sm:px-6 sm:pt-36 sm:pb-16">
        <BrandLogo className="mb-5 h-32 sm:h-40" />
        <h1 className="text-3xl font-bold leading-snug text-gray-900 sm:text-5xl md:text-6xl md:leading-tight">
          <span className="ubuntu-text">Connecting Campus Life</span>
        </h1>
        {/* inject font links on mount (non-blocking) */}
        
        <h2 className="mt-2 text-3xl font-semibold leading-snug text-orange-500 sm:mt-3 sm:text-5xl md:text-6xl md:leading-tight">
          <span className="edu-hand">Effortlessly with A.I</span>
        </h2>
        <p className="mt-5 max-w-xl text-base text-gray-600 sm:max-w-2xl sm:text-lg">
          <span className="redhat-bold">From lost &amp; found to event discovery—your campus, connected.</span>
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
            Find Your Campus
          </a>
        </div>
        <div className="mt-8 flex items-center gap-3 sm:hidden">
          <button
            type="button"
            aria-label="Discord"
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-orange-100 bg-white text-slate-500 shadow-sm transition hover:border-orange-400 hover:bg-orange-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          >
            <span className="sr-only">Discord</span>
            <FaDiscord className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Instagram"
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-orange-100 bg-white text-slate-500 shadow-sm transition hover:border-orange-400 hover:bg-orange-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          >
            <span className="sr-only">Instagram</span>
            <FaInstagram className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="X"
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-orange-100 bg-white text-slate-500 shadow-sm transition hover:border-orange-400 hover:bg-orange-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          >
            <span className="sr-only">X</span>
            <FaXTwitter className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
          </button>
        </div>
      </main>
      <ShowcaseTablet slides={showcaseSlides} className="mt-6" />

      <section className="relative z-10 mx-auto mt-16 w-full max-w-[88rem] px-6 sm:px-16">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full border border-orange-500/30 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-bold text-black sm:text-4xl">
            Start in <span className="text-orange-500">Three Simple</span> Steps
          </h2>
          <p className="mt-3 max-w-3xl text-base text-black/70 sm:text-lg">
            Verify once. Connect instantly. Experience campus life fully..
          </p>
        </div>

        <div className="relative mt-12 w-full">
          <div className="flex flex-col gap-12 sm:flex-row sm:items-start sm:justify-evenly sm:gap-24">
            {howItWorks.map((item, index) => (
              <div
                key={item.step}
                className="relative flex w-full flex-col items-start text-left sm:max-w-[28%]"
              >
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">{item.step}</span>
                <h3 className="mt-3 text-xl font-semibold text-black sm:text-2xl">{item.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-black/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-16 w-full max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
            Features
          </span>
          <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Everything Your <span className="text-orange-500">Campus</span> Needs
          </h2>
          <p className="mt-3 max-w-2xl text-base text-gray-600 sm:text-lg">
            Explore the connected toolkit built to keep students, mentors, and admins in sync.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => {
            const isActive = index === activeFeature;
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`flex w-full flex-col rounded-2xl border border-orange-100 bg-white/90 shadow-sm backdrop-blur transition-all duration-300 ${
                  isActive ? "shadow-lg ring-1 ring-orange-200" : "hover:shadow-md"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFeature(index)}
                  aria-expanded={isActive}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-4">
                    {Icon ? (
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner ${
                          feature.iconBg ?? "bg-gray-100"
                        } ${feature.iconColor ?? "text-gray-600"}`}
                        aria-hidden="true"
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                    ) : null}
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

      <section className="relative z-10 mx-auto mt-16 w-full max-w-5xl px-4 pb-24 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            FAQs
          </span>
          <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Answers <span className="text-orange-500">Students</span> Ask Most
          </h2>
          <p className="mt-3 max-w-2xl text-base text-gray-600 sm:text-lg">
            Transparency matters. Here’s what to know about how Campus Connect works.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {faqs.map((faq, index) => {
            const isActive = index === activeFaq;
            return (
              <div
                key={faq.question}
                className={`w-full rounded-2xl border border-orange-100 bg-white/90 shadow-sm transition-all duration-300 ${
                  isActive ? "shadow-lg ring-1 ring-orange-200" : "hover:shadow-md"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isActive}
                  className="flex items-center gap-4 px-6 py-4 text-left transition hover:bg-orange-50/40"
                >
                  <p className="text-lg font-semibold text-gray-900">{faq.question}</p>
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
                  <div className="px-6 pb-5 text-base text-gray-600">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 mt-28 overflow-hidden bg-gradient-to-b from-black via-black to-zinc-900 text-orange-200">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(255, 138, 36, 0.25), transparent 55%), radial-gradient(circle at 80% 75%, rgba(255, 93, 0, 0.18), transparent 60%)",
          }}
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-24">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr_1.1fr]">
            <div className="space-y-5 lg:pl-20">
              <div className="flex items-center gap-3">
                <BrandLogo className="h-12" />
                <span className="text-2xl font-semibold tracking-tight text-orange-100">Campus Connect</span>
              </div>
              <p className="text-sm leading-relaxed text-orange-200/80">
                The trusted, student-first hub for everything happening on campus. Stay informed, engaged, and connected with your community.
              </p>
              <div className="mt-6 flex items-center gap-3 text-orange-100">
                <button
                  type="button"
                  aria-label="Discord community"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/10 text-lg transition hover:border-orange-400 hover:bg-orange-500/20"
                >
                  <FaDiscord />
                </button>
                <button
                  type="button"
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/10 text-lg transition hover:border-orange-400 hover:bg-orange-500/20"
                >
                  <FaInstagram />
                </button>
                <button
                  type="button"
                  aria-label="X"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/10 text-lg transition hover:border-orange-400 hover:bg-orange-500/20"
                >
                  <FaXTwitter />
                </button>
              </div>
            </div>

            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-medium uppercase tracking-[0.3em] text-orange-400">Platform</h3>
                <ul className="mt-4 space-y-3 text-sm text-orange-200/90">
                  <li>Overview</li>
                  <li>Features</li>
                  <li>Pricing</li>
                  <li>Campus Stories</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-[0.3em] text-orange-400">Resources</h3>
                <ul className="mt-4 space-y-3 text-sm text-orange-200/90">
                  <li>Help Center</li>
                  <li>Student Guides</li>
                  <li>Security</li>
                  <li>Status</li>
                </ul>
              </div>
              <div className="sm:col-span-2">
                <h3 className="text-xs font-medium uppercase tracking-[0.3em] text-orange-400">Company</h3>
                <ul className="mt-4 space-y-3 text-sm text-orange-200/90">
                  <li>About</li>
                  <li>Careers</li>
                  <li>Partners</li>
                  <li>Contact</li>
                </ul>
              </div>
            </div>

            <div className="space-y-5 lg:pr-20">
              <h3 className="text-xs font-medium uppercase tracking-[0.3em] text-orange-400">Stay in the Loop</h3>
              <p className="text-sm text-orange-200/80">
                Subscribe for campus insights, product updates, and field-tested playbooks for student leaders.
              </p>
              <form className="flex flex-col gap-3">
                <label className="sr-only" htmlFor="footer-email">
                  University email
                </label>
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Enter your university email"
                  className="w-full rounded-full border border-orange-500/50 bg-black/40 px-5 py-3 text-sm text-orange-100 placeholder:text-orange-300 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-orange-500/20 transition hover:shadow-xl hover:from-orange-400 hover:to-orange-300"
                >
                  Join Updates
                </button>
              </form>
              <p className="text-xs text-orange-300/80">
                We respect your inbox. Unsubscribe anytime.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 border-t border-orange-500/20 pt-8 text-xs text-orange-300/80 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Campus Connect. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <span>Terms</span>
              <span>Privacy</span>
              <span>Accessibility</span>
              <span>Community Guidelines</span>
              <span>Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
