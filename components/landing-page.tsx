"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Zap,
  Droplet,
  ShieldCheck,
  Check,
  Clock,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Lightbulb,
  Plug,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";

interface LandingPageProps {
  user?: {
    email?: string | null;
  } | null;
}

// Custom Clean Faucet / Tap Icon matching screenshot
function FaucetIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 8h8a3 3 0 0 1 3 3v2" />
      <path d="M3 6h4v4H3z" />
      <path d="M14 13h4v3h-4z" />
      <path d="M9 4v4" />
      <path d="M7 4h4" />
      <path d="M16 18c0 1.1-.9 2-2 2s-2-.9-2-2c0-1.2 2-3 2-3s2 1.8 2 3z" fill="currentColor" />
    </svg>
  );
}

// Custom Clean Pipe Elbow Icon matching screenshot
function PipeElbowIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5h5v5a6 6 0 0 0 6 6h5v5h-5A11 11 0 0 1 4 10V5z" fill="currentColor" fillOpacity="0.15" />
      <path d="M4 5h5v5a6 6 0 0 0 6 6h5v5h-5A11 11 0 0 1 4 10V5z" />
      <path d="M3 3h7v3H3z" />
      <path d="M18 19h3v4h-3z" />
    </svg>
  );
}

export function LandingPage({ user }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Free Visit Request Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "Electrical",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setFormSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased selection:bg-[#f57c00]/20 selection:text-[#f57c00]">
      {/* ======================================================== */}
      {/* 1. TOP NAVBAR                                            */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="Voltera Logo"
                width={44}
                height={44}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-[#0f4376] leading-none">
                VOLTERA
              </div>
              <div className="text-[9px] font-bold text-[#f57c00] tracking-wider uppercase mt-0.5">
                ELECTRICALS &amp; PLUMBING SOLUTIONS
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <Link
              href="/"
              className="text-[#0f4376] font-bold relative py-1 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#f57c00] after:rounded-full"
            >
              Home
            </Link>
            <a href="#about" className="hover:text-[#0f4376] transition-colors py-1">
              About
            </a>
            <a href="#services" className="hover:text-[#0f4376] transition-colors py-1">
              Services
            </a>
            <a href="#works" className="hover:text-[#0f4376] transition-colors py-1">
              Recent Works
            </a>
            <a href="#contact" className="hover:text-[#0f4376] transition-colors py-1">
              Contact
            </a>
          </nav>

          {/* Desktop Call Now Button */}
          <div className="hidden sm:flex items-center">
            <a
              href="tel:+919995103204"
              className="h-10 px-6 rounded-full font-bold text-xs sm:text-sm bg-[#f57c00] hover:bg-[#e65100] text-white shadow-sm hover:shadow-md transition-all active:scale-95 inline-flex items-center justify-center"
            >
              Call Now
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <a
              href="tel:+919995103204"
              className="h-9 px-4 rounded-full font-bold text-xs bg-[#f57c00] text-white shadow-xs inline-flex items-center"
            >
              Call Now
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-6 py-5 space-y-4 text-sm font-semibold shadow-lg">
            <a
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-[#f57c00] font-bold"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-700 hover:text-[#0f4376]"
            >
              About
            </a>
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-700 hover:text-[#0f4376]"
            >
              Services
            </a>
            <a
              href="#works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-700 hover:text-[#0f4376]"
            >
              Recent Works
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-slate-700 hover:text-[#0f4376]"
            >
              Contact
            </a>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 text-[#0f4376] font-bold text-xs"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-10 inline-flex items-center justify-center rounded-full border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ======================================================== */}
      {/* 2. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section
        id="hero"
        className="relative bg-gradient-to-b from-[#eaf3fc] via-[#f1f6fd] to-[#ffffff] pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Top Tag Pill */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#dbeafc] text-[#15569c] border border-[#c4dcfa] shadow-2xs">
                TRUSTED HOME SERVICE
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0c2a4a] tracking-tight leading-[1.18]">
                Safe Electrical &amp; Plumbing Solutions for Your Home
              </h1>

              {/* Subheading */}
              <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Wiring, lights, pipes, taps and repairs, done neatly and on time by trained people
                you can trust.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="tel:+919995103204"
                  className="w-full sm:w-auto h-12 px-7 rounded-full font-bold text-sm bg-[#f57c00] hover:bg-[#e65100] text-white shadow-md hover:shadow-lg transition-all active:scale-95 inline-flex items-center justify-center gap-2"
                >
                  <span>Call Now: +91 99951 03204</span>
                </a>
                <a
                  href="#services"
                  className="w-full sm:w-auto h-12 px-8 rounded-full font-bold text-sm border-2 border-[#1565c0] text-[#1565c0] hover:bg-[#1565c0]/5 transition-all inline-flex items-center justify-center"
                >
                  Our Services
                </a>
              </div>
            </div>

            {/* Right Column: Circular Badge Visual with Voltera Logo */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 flex items-center justify-center">
                {/* Large White Halo Circle */}
                <div className="w-full h-full rounded-full bg-white shadow-2xl shadow-blue-900/10 border-8 border-white flex items-center justify-center p-8 relative">
                  <Image
                    src="/logo.png"
                    alt="Voltera Emblem"
                    width={280}
                    height={280}
                    className="w-48 sm:w-64 h-auto object-contain drop-shadow-sm select-none"
                    priority
                  />

                  {/* Floating Badge Top-Left: Lightning Bolt */}
                  <div className="absolute top-2 left-3 sm:top-4 sm:left-4 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#f57c00] text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transform -rotate-6 hover:scale-105 transition-transform">
                    <Zap className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white" />
                  </div>

                  {/* Floating Badge Bottom-Right: Water Droplet */}
                  <div className="absolute bottom-2 right-3 sm:bottom-4 sm:right-4 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0d47a1] text-white flex items-center justify-center shadow-lg shadow-blue-700/30 transform rotate-6 hover:scale-105 transition-transform">
                    <Droplet className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. TRUST BADGES STRIP                                    */}
      {/* ======================================================== */}
      <section className="bg-white border-y border-slate-100 py-6 sm:py-8 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Badge 1: Safe & Trained */}
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#f57c00] text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/20">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#0c2a4a] leading-snug">
                  Safe &amp; Trained
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Experienced, vetted technicians
                </p>
              </div>
            </div>

            {/* Badge 2: On Time, Every Time */}
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1565c0] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20">
                <Clock className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#0c2a4a] leading-snug">
                  On Time, Every Time
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  We arrive when we promise
                </p>
              </div>
            </div>

            {/* Badge 3: Fair, Clear Prices */}
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#f57c00] text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/20 font-black text-xs tracking-tight">
                RS
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#0c2a4a] leading-snug">
                  Fair, Clear Prices
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  You know the cost before we start
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. ABOUT US SECTION                                      */}
      {/* ======================================================== */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left: About Copy & Checkmarks */}
            <div className="lg:col-span-7 space-y-5">
              <div className="text-[#f57c00] text-xs font-black uppercase tracking-wider">
                ABOUT US
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0c2a4a] tracking-tight">
                A Friendly Local Team
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Voltera Electricals &amp; Plumbing Solutions takes care of the wiring and water
                systems in your home. We explain every job in simple words and keep your home clean
                while we work.
              </p>

              {/* Key Highlights Checklist */}
              <div className="space-y-3 pt-2">
                {[
                  "Trained and experienced technicians",
                  "Clear price before work starts",
                  "Quick help for emergencies",
                  "Neat work with proper guarantee",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#0d47a1] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Stat Cards Grid */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                {/* 15+ Years */}
                <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm text-center space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-[#1565c0]">15+</div>
                  <div className="text-xs font-semibold text-slate-500">Years of Experience</div>
                </div>

                {/* 2,500+ Homes */}
                <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm text-center space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-[#f57c00]">2,500+</div>
                  <div className="text-xs font-semibold text-slate-500">Happy Homes Served</div>
                </div>

                {/* 24/7 Emergency */}
                <div className="col-span-2 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm text-center space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-[#1565c0]">24/7</div>
                  <div className="text-xs font-semibold text-slate-500">Emergency Help</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. OUR SERVICES SECTION                                  */}
      {/* ======================================================== */}
      <section id="services" className="py-16 md:py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0c2a4a] tracking-tight">
              Our Services
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Everything for your home, in one place
            </p>

            {/* Category Indicator Legend */}
            <div className="flex items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f57c00]"></span>
                <span>Electrical</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1565c0]"></span>
                <span>Plumbing</span>
              </div>
            </div>
          </div>

          {/* 6 Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Wiring & Rewiring (Electrical) */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200/80 border-t-4 border-t-[#f57c00] shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#f57c00] text-white flex items-center justify-center shadow-xs">
                <Plug className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0c2a4a] mb-1.5">Wiring &amp; Rewiring</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                  New wiring and safe rewiring for homes and shops.
                </p>
              </div>
            </div>

            {/* 2. Lights, Fans & Switches (Electrical) */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200/80 border-t-4 border-t-[#f57c00] shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#f57c00] text-white flex items-center justify-center shadow-xs">
                <Lightbulb className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0c2a4a] mb-1.5">
                  Lights, Fans &amp; Switches
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                  Fitting and repair of lights, fans, switches and sockets.
                </p>
              </div>
            </div>

            {/* 3. Power Safety Check (Electrical) */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200/80 border-t-4 border-t-[#f57c00] shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#f57c00] text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0c2a4a] mb-1.5">Power Safety Check</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                  Fuse, MCB and earthing checks to keep your family safe.
                </p>
              </div>
            </div>

            {/* 4. Pipe Fitting & Repair (Plumbing) */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200/80 border-t-4 border-t-[#1565c0] shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#1565c0] text-white flex items-center justify-center shadow-xs">
                <PipeElbowIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0c2a4a] mb-1.5">
                  Pipe Fitting &amp; Repair
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                  Fixing leaking, broken or blocked pipes quickly.
                </p>
              </div>
            </div>

            {/* 5. Taps & Bathroom Fittings (Plumbing) */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200/80 border-t-4 border-t-[#1565c0] shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#1565c0] text-white flex items-center justify-center shadow-xs">
                <FaucetIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0c2a4a] mb-1.5">
                  Taps &amp; Bathroom Fittings
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                  Fitting and repair of taps, showers, basins and toilets.
                </p>
              </div>
            </div>

            {/* 6. Water Tank & Motor (Plumbing) */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200/80 border-t-4 border-t-[#1565c0] shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#1565c0] text-white flex items-center justify-center shadow-xs">
                <Droplet className="w-7 h-7 fill-white stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0c2a4a] mb-1.5">Water Tank &amp; Motor</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                  Water tank, motor and pump fitting and repair.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. RECENT WORKS SECTION                                  */}
      {/* ======================================================== */}
      <section id="works" className="py-16 md:py-24 bg-[#f4f7fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0c2a4a] tracking-tight">
              Recent Works
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              A few of our latest completed jobs
            </p>
          </div>

          {/* 3 Work Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Full House Rewiring */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              {/* Thumbnail Placeholder */}
              <div className="bg-[#fff3e6] h-44 rounded-xl flex flex-col items-center justify-center p-4">
                <div className="w-14 h-14 rounded-full bg-[#f57c00] text-white flex items-center justify-center shadow-xs">
                  <Plug className="w-7 h-7" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium mt-3">
                  Photo of completed work
                </span>
              </div>

              {/* Content */}
              <div className="pt-4 space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#f57c00] text-white">
                  ELECTRICAL
                </span>
                <h3 className="text-base font-extrabold text-[#0c2a4a] pt-1">
                  Full House Rewiring
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  3 bedroom home, finished in 4 days
                </p>
              </div>
            </div>

            {/* Card 2: Bathroom Pipe Fitting */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              {/* Thumbnail Placeholder */}
              <div className="bg-[#edf5fd] h-44 rounded-xl flex flex-col items-center justify-center p-4">
                <div className="w-14 h-14 rounded-full bg-[#1565c0] text-white flex items-center justify-center shadow-xs">
                  <FaucetIcon className="w-7 h-7" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium mt-3">
                  Photo of completed work
                </span>
              </div>

              {/* Content */}
              <div className="pt-4 space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#1565c0] text-white">
                  PLUMBING
                </span>
                <h3 className="text-base font-extrabold text-[#0c2a4a] pt-1">
                  Bathroom Pipe Fitting
                </h3>
                <p className="text-xs text-slate-500 font-medium">New pipes, taps and shower</p>
              </div>
            </div>

            {/* Card 3: Lights & MCB Panel */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              {/* Thumbnail Placeholder */}
              <div className="bg-[#fff3e6] h-44 rounded-xl flex flex-col items-center justify-center p-4">
                <div className="w-14 h-14 rounded-full bg-[#f57c00] text-white flex items-center justify-center shadow-xs">
                  <Lightbulb className="w-7 h-7" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium mt-3">
                  Photo of completed work
                </span>
              </div>

              {/* Content */}
              <div className="pt-4 space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#f57c00] text-white">
                  ELECTRICAL
                </span>
                <h3 className="text-base font-extrabold text-[#0c2a4a] pt-1">Lights &amp; MCB Panel</h3>
                <p className="text-xs text-slate-500 font-medium">Shop lighting and safe new panel</p>
              </div>
            </div>
          </div>

          {/* See All Works Action */}
          <div className="text-center mt-10">
            <a
              href="#contact"
              className="inline-flex items-center justify-center h-11 px-8 rounded-full border-2 border-[#1565c0] text-[#1565c0] hover:bg-[#1565c0] hover:text-white font-bold text-xs sm:text-sm transition-all"
            >
              See All Works
            </a>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. CONTACT US SECTION                                    */}
      {/* ======================================================== */}
      <section id="contact" className="py-16 md:py-24 bg-[#0f4e8e] text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Contact Us
            </h2>
            <div className="w-12 h-1 bg-[#f57c00] mx-auto rounded-full my-2"></div>
            <p className="text-blue-100 text-sm sm:text-base">
              Call us or send a request. We reply quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Column: Direct Contact Info */}
            <div className="lg:col-span-6 space-y-6">
              {/* Phone */}
              <a
                href="tel:+919995103204"
                className="flex items-center gap-4 group p-2 rounded-2xl transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-[#f57c00] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5 fill-white text-white" />
                </div>
                <div>
                  <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider">
                    Call Us
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white group-hover:text-[#ffb74d] transition-colors">
                    +91 99951 03204
                  </div>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:volteraelectricals68@gmail.com"
                className="flex items-center gap-4 group p-2 rounded-2xl transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-[#f57c00] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5 fill-white text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider">
                    Email
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white truncate group-hover:text-[#ffb74d] transition-colors">
                    volteraelectricals68@gmail.com
                  </div>
                </div>
              </a>

              {/* Visit Us */}
              <div className="flex items-center gap-4 p-2">
                <div className="w-12 h-12 rounded-full bg-[#f57c00] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5 fill-white text-white" />
                </div>
                <div>
                  <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider">
                    Visit Us
                  </div>
                  <div className="text-base font-bold text-white">Adimali, Kerala</div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-center gap-4 p-2">
                <div className="w-12 h-12 rounded-full bg-[#f57c00] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Clock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider">
                    Working Hours
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white">
                    Mon-Sat 8 AM to 8 PM &nbsp;|&nbsp; Emergency 24/7
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Request a Free Visit Form Card */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl text-slate-800">
                <h3 className="text-xl sm:text-2xl font-black text-[#0c2a4a] mb-6">
                  Request a Free Visit
                </h3>

                {formSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in fade-in">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-base text-emerald-900">Request Sent!</h4>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Thank you! Our technician will call you back on{" "}
                      <span className="font-bold">{formData.phone}</span> shortly to confirm your
                      visit.
                    </p>
                    <button
                      onClick={() => setFormSubmitted(false)}
                      className="text-xs font-bold text-[#f57c00] underline mt-2"
                    >
                      Send another request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your Name"
                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#f57c00] focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Phone Number"
                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#f57c00] focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <select
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:border-[#f57c00] focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="Electrical">Service Needed: Electrical</option>
                        <option value="Plumbing">Service Needed: Plumbing</option>
                        <option value="Both Electrical & Plumbing">
                          Service Needed: Electrical &amp; Plumbing Combined
                        </option>
                        <option value="Emergency Repair">Service Needed: Emergency Repair</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#f57c00] hover:bg-[#e65100] text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {submitting ? "Sending..." : "Send Request"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. FOOTER                                                */}
      {/* ======================================================== */}
      <footer className="bg-[#07192c] text-white py-10 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/60">
            {/* Logo & Brand Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                <Image
                  src="/logo.png"
                  alt="Voltera"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="font-black text-white text-base tracking-wide leading-none">
                  VOLTERA
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Electricals &amp; Plumbing Solutions
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-400">
              <a href="#hero" className="hover:text-white transition-colors">
                Home
              </a>
              <a href="#about" className="hover:text-white transition-colors">
                About
              </a>
              <a href="#services" className="hover:text-white transition-colors">
                Services
              </a>
              <a href="#works" className="hover:text-white transition-colors">
                Recent Works
              </a>
              <a href="#contact" className="hover:text-white transition-colors">
                Contact
              </a>
              {user ? (
                <Link href="/dashboard" className="text-[#f57c00] hover:underline font-bold">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="hover:text-white transition-colors">
                  Admin Portal
                </Link>
              )}
            </div>
          </div>

          {/* Copyright Bottom */}
          <div className="pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Voltera. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
