"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Droplets,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Building2,
  Home,
  Factory,
  Wrench,
  Sparkles,
  Check,
  Send,
  Star,
  Award,
  Menu,
  X,
  PhoneCall,
  HardHat,
  Flame,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  user?: {
    email?: string | null;
  } | null;
}

export function LandingPage({ user }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "electrical" | "plumbing" | "commercial">("all");

  // Contact Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "Electrical & Plumbing Combined",
    message: "",
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

  const services = [
    {
      category: "electrical",
      icon: Zap,
      title: "Residential Electrical",
      tagline: "WIRING & LIGHTING",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
      description:
        "Full internal concealed wiring, circuit breaker distribution panels, decorative LED lighting, fan & geyser points, and safety earthing.",
      highlights: ["Concealed conduit wiring", "MCB / ELCB shock protection", "Inverter & UPS integration"],
    },
    {
      category: "commercial",
      icon: Building2,
      title: "Commercial & Industrial Fit-outs",
      tagline: "3-PHASE & HT PANELS",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
      description:
        "Engineered 3-phase load balancing, heavy-duty switchgear, motor control panels (MCC), transformer setups, and office cable management.",
      highlights: ["Main distribution switchgear", "Capacitor banks (APFC)", "Structured cabling & server power"],
    },
    {
      category: "plumbing",
      icon: Droplets,
      title: "Sanitary & Plumbing Solutions",
      tagline: "PIPING & DRAINAGE",
      image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
      description:
        "CPVC/UPVC water line installation, high-pressure booster pumps, underground sewer piping, luxury sanitary fixtures, and leak detection.",
      highlights: ["Concealed hot/cold water piping", "Pressure pump installation", "Acoustic drainage & waste traps"],
    },
    {
      category: "electrical",
      icon: ShieldCheck,
      title: "Panel Upgrades & Safety Audits",
      tagline: "TESTING & CODE COMPLIANCE",
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
      description:
        "Insulation resistance (Megger) checks, thermal scans for hotspots, earth pit resistance testing, and safety compliance certifications.",
      highlights: ["Megger insulation tests", "Earth resistance certification", "Thermal scan overload checks"],
    },
    {
      category: "plumbing",
      icon: Wrench,
      title: "Overhead Tank & Hydro Systems",
      tagline: "PUMPS & VALVES",
      image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80",
      description:
        "Automated water level controllers, multi-story overhead tank plumbing, backflow preventers, inline filtration, and water meter setups.",
      highlights: ["Auto pump level controllers", "Multi-stage booster pumps", "RO & softener line hookups"],
    },
    {
      category: "commercial",
      icon: Flame,
      title: "24/7 Emergency Breakdown Dispatch",
      tagline: "RAPID RESPONSE",
      image: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80",
      description:
        "Immediate emergency dispatch for short circuits, power outages, burnt main lines, bursting pipes, severe clogs, and water overflows.",
      highlights: ["Technician on site in 45 min", "Precision fault isolation", "Zero surprise pricing"],
    },
  ];

  const recentWorks = [
    {
      id: 1,
      title: "Grand Residency Luxury Villa",
      category: "electrical",
      categoryLabel: "Residential Electrical & Plumbing",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      scope: "Complete concealed wiring + 4-bathroom sanitary hydro-piping network",
      specs: ["4,200 sq.ft Villa", "Smart Modular Switches", "Booster Pump Hydro System"],
      location: "Palm Meadows",
      status: "Completed • Handed Over",
    },
    {
      id: 2,
      title: "TechZone Corporate Tech Park (Floor 4-6)",
      category: "commercial",
      categoryLabel: "Commercial 3-Phase Infrastructure",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      scope: "250 kVA 3-phase power distribution, 80 server rack UPS feeds & LED retrofitting",
      specs: ["18,500 sq.ft Office", "Siemens Switchgear", "Redundant Busbar Trunking"],
      location: "Cyber Gateway Sector",
      status: "Completed • Certified",
    },
    {
      id: 3,
      title: "Surya Heights 48-Unit Apartment Complex",
      category: "plumbing",
      categoryLabel: "Sanitary & Central Pumping",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
      scope: "High-pressure central water booster, overhead storage network, and rainwater drainage",
      specs: ["48 Residential Units", "Dual-line CPVC/UPVC", "Acoustic Soil & Waste Stacks"],
      location: "Greenview Enclave",
      status: "Completed • Tested",
    },
    {
      id: 4,
      title: "Apex Manufacturing Plant Substation",
      category: "commercial",
      categoryLabel: "Industrial Switchgear & Motors",
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
      scope: "Motor Control Center (MCC) panels, star-delta starters & 250A APFC capacitor bank",
      specs: ["Heavy Machinery Units", "Schneider Breakers", "Class-A Earth Pits"],
      location: "Phase II Industrial Hub",
      status: "Completed • Safety Approved",
    },
    {
      id: 5,
      title: "Prestige Mall Gourmet Hub",
      category: "plumbing",
      categoryLabel: "Commercial Kitchen Plumbing & Electrical",
      image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
      scope: "Commercial grease traps, industrial kitchen exhaust wiring, high-temp water heaters",
      specs: ["6 Commercial Kitchens", "Stainless Steel Traps", "Isolated Safety Circuits"],
      location: "Downtown Avenue",
      status: "Completed • Inspected",
    },
    {
      id: 6,
      title: "Hilltop Estate Smart Living Overhaul",
      category: "electrical",
      categoryLabel: "Smart Automation & Solar Inverter",
      image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
      scope: "Whole-home Wi-Fi automation, hybrid solar inverter integration & architectural facade lighting",
      specs: ["10 kW Hybrid Solar", "Scene-controlled Lighting", "SPD Surge Protection"],
      location: "Sunrise Hills",
      status: "Completed • Under Warranty",
    },
  ];

  const filteredWorks =
    activeFilter === "all"
      ? recentWorks
      : recentWorks.filter((item) => item.category === activeFilter);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-[#f59e0b]/30 selection:text-[#f59e0b] font-sans antialiased">
      {/* MAIN NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#09090b]/90 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b] group-hover:scale-105 transition-transform shadow-sm shadow-[#f59e0b]/10">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
                <span>PANDALI</span>
                <span className="text-[#f59e0b]">SOLUTIONS</span>
              </div>
              <div className="text-[10px] text-zinc-400 tracking-wider uppercase font-semibold">
                Electrical & Plumbing Solutions
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-semibold text-zinc-400">
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
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="#contact"
              className="h-10 px-5 inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-zinc-950 shadow-md shadow-[#f59e0b]/20 transition-all hover:scale-[1.02]"
            >
              Request a Quote
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-800 bg-[#09090b]/98 px-6 py-5 space-y-4 text-xs font-bold uppercase tracking-wider">
            <a
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#f59e0b]"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#f59e0b]"
            >
              About
            </a>
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#f59e0b]"
            >
              Services
            </a>
            <a
              href="#works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#f59e0b]"
            >
              Recent Works
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-zinc-300 hover:text-[#f59e0b]"
            >
              Contact
            </a>

            <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-10 inline-flex items-center justify-center rounded-xl bg-[#f59e0b] text-zinc-950 font-bold text-xs"
              >
                Request a Quote
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION (WITH REAL ELECTRICIAN IMAGERY MATCHING REFERENCE) */}
      <section id="hero" className="relative pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-zinc-800/80">
        {/* Ambient Warm Backlights */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#f59e0b]/10 blur-[150px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-10 w-[400px] h-[250px] bg-sky-500/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b]">
                <HardHat className="w-3.5 h-3.5" />
                <span>Certified Electrical & Plumbing Specialists</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.08]">
                Professional <br />
                <span className="text-white">Electrical & Plumbing</span> <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#fde047]">
                  Solutions.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-xl">
                The trusted team you rely on for delivering end-to-end residential wiring, hydro plumbing, power distribution,
                heavy panel upgrades, and instant 24/7 emergency repair.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <a
                  href="#contact"
                  className="h-12 px-7 rounded-xl font-bold uppercase tracking-wider text-xs bg-[#f59e0b] hover:bg-[#fbbf24] text-zinc-950 inline-flex items-center justify-center gap-2 shadow-lg shadow-[#f59e0b]/25 transition-all hover:scale-[1.02]"
                >
                  <span>Request a Quotation</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="tel:+919845011223"
                  className="h-12 px-7 rounded-xl font-bold uppercase tracking-wider text-xs border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-white inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-[#f59e0b]" />
                  <span>Call Now</span>
                </a>
              </div>

              {/* Client Rating Strip */}
              <div className="flex items-center gap-3 pt-4">
                <div className="flex text-[#f59e0b]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#f59e0b] stroke-[#f59e0b]" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-zinc-300">
                  Trusted by 1,200+ property owners & contractors
                </span>
              </div>
            </div>

            {/* Right Hero Image Card (Cinematic Electrician & Plumbing Showcase) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border border-zinc-700/80 shadow-2xl group bg-zinc-900">
                {/* Hero Real Image */}
                <div className="relative h-[420px] sm:h-[460px] w-full">
                  <img
                    src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80"
                    alt="Master Electrician Working on Power Fixtures"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                    loading="eager"
                  />
                  {/* Subtle Dark Vignette & Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/60 via-transparent to-transparent" />

                  {/* Top Floating Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-zinc-950/85 backdrop-blur-md border border-zinc-700/80 text-emerald-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>24/7 Available</span>
                  </div>

                  {/* Bottom Image Overlay Card */}
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-zinc-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b]">
                          <Zap className="w-4 h-4 fill-current" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white uppercase tracking-wider">
                            Pandali Solutions
                          </div>
                          <div className="text-[10px] text-zinc-400">Class-A Govt. License ME-894102-TX</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-[#f59e0b]">45 Min</div>
                        <div className="text-[10px] text-zinc-400">Avg. Dispatch</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Strip (Yellow numbers style matching reference image) */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-zinc-800/80">
            {[
              { val: "20+", label: "Licensed Specialists" },
              { val: "1,200+", label: "Projects Completed" },
              { val: "24/7", label: "Emergency Response" },
              { val: "99%", label: "Client Satisfaction" },
            ].map((stat, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
                <div className="text-3xl sm:text-4xl font-black text-[#f59e0b] tracking-tight">{stat.val}</div>
                <div className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. ABOUT SECTION (WITH CERTIFIED SPECIALIST IMAGERY) */}
      <section id="about" className="py-20 md:py-28 border-b border-zinc-800/80 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Real Photographic Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border border-zinc-700/80 shadow-2xl bg-zinc-900 group">
                <div className="relative h-[400px] sm:h-[460px] w-full">
                  <img
                    src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=80"
                    alt="Certified Master Contractor"
                    className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />

                  {/* Overlay text card at the bottom */}
                  <div className="absolute bottom-5 left-5 right-5 p-5 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-zinc-700/80">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b]">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Certified Master Technicians
                        </h3>
                        <p className="text-[11px] text-[#f59e0b] font-semibold">15+ Years Commercial Experience</p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Every installation is handled by government-certified electricians and seasoned master plumbers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Pillars of Expertise */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#f59e0b]">
                  WHY CHOOSE US
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
                  Expert Electrical & Plumbing Work. Without the Risk.
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 mt-3 leading-relaxed">
                  Electrical wiring and high-pressure plumbing form the invisible backbone of any structure.
                  We eliminate guesswork with certified materials, licensed technicians, and thorough safety testing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Licensed Technicians",
                    desc: "Every technician on your premises is verified, experienced, and safety-certified.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Fixed Upfront Estimates",
                    desc: "Transparent bills of materials and labor with zero unannounced markups.",
                  },
                  {
                    icon: Sparkles,
                    title: "Original Grade Materials",
                    desc: "Only BIS/ISI certified copper conductors, branded switchgear, and lead-free CPVC pipes.",
                  },
                  {
                    icon: Wrench,
                    title: "Post-Service Warranty",
                    desc: "Comprehensive workmanship warranty covering testing, commissioning, and adjustments.",
                  },
                ].map((pillar, pIdx) => {
                  const PIcon = pillar.icon;
                  return (
                    <div
                      key={pIdx}
                      className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-[#f59e0b]/40 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center mb-3">
                        <PIcon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{pillar.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{pillar.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <a
                  href="#contact"
                  className="h-11 px-6 rounded-xl font-bold uppercase tracking-wider text-xs bg-[#f59e0b] hover:bg-[#fbbf24] text-zinc-950 inline-flex items-center gap-2 transition-colors"
                >
                  <span>Consult with Our Master Engineers</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SERVICES SECTION (WITH MATCHING REAL IMAGERY) */}
      <section id="services" className="py-20 md:py-28 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-widest text-[#f59e0b]">
              WHAT WE DO
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
              Complete Electrical & Plumbing Services, Under One Roof.
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Precision engineering solutions tailored for homeowners, commercial properties, and industrial infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc, sIdx) => {
              const SIcon = svc.icon;
              return (
                <div
                  key={sIdx}
                  className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden flex flex-col justify-between hover:border-[#f59e0b]/50 hover:shadow-2xl transition-all group"
                >
                  <div>
                    {/* Real Service Image Header */}
                    <div className="relative h-48 w-full overflow-hidden border-b border-zinc-800">
                      <img
                        src={svc.image}
                        alt={svc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                      <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-700/80 text-[#f59e0b] flex items-center justify-center">
                        <SIcon className="w-5 h-5" />
                      </div>
                      <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-zinc-950/85 backdrop-blur-md text-[#f59e0b] border border-[#f59e0b]/30">
                        {svc.tagline}
                      </span>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#f59e0b] transition-colors">
                        {svc.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
                        {svc.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-zinc-800/80 mt-auto space-y-2">
                    {svc.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-2 text-xs text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. RECENT WORKS (PORTFOLIO SHOWCASE WITH REAL PROJECT IMAGERY) */}
      <section id="works" className="py-20 md:py-28 border-b border-zinc-800/80 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#f59e0b]">
                PORTFOLIO SHOWCASE
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
                Recent Works & Completed Projects.
              </h2>
              <p className="text-sm text-zinc-400 mt-2">
                A selection of recently delivered installations across electrical systems, industrial panels, and sanitary piping.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "All Projects" },
                { id: "electrical", label: "Electrical" },
                { id: "plumbing", label: "Plumbing" },
                { id: "commercial", label: "Commercial" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    activeFilter === tab.id
                      ? "bg-[#f59e0b] text-zinc-950 shadow-sm"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorks.map((work) => (
              <div
                key={work.id}
                className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-[#f59e0b]/50 transition-all flex flex-col justify-between group shadow-xl"
              >
                {/* Project Image Banner */}
                <div className="relative h-52 w-full overflow-hidden border-b border-zinc-800">
                  <img
                    src={work.image}
                    alt={work.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-950/85 backdrop-blur-md border border-[#f59e0b]/30 text-[#f59e0b]">
                    {work.categoryLabel}
                  </div>
                  <div className="absolute bottom-3 right-3 text-[11px] text-zinc-300 flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-md">
                    <MapPin className="w-3 h-3 text-[#f59e0b]" />
                    {work.location}
                  </div>
                </div>

                {/* Specs & Deliverables */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#f59e0b] transition-colors mb-2">
                      {work.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      {work.scope}
                    </p>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Key Deliverables
                      </span>
                      {work.specs.map((spec, sI) => (
                        <div key={sI} className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-3.5 h-3.5 text-[#f59e0b]" />
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs mt-4">
                    <span className="text-emerald-400 font-semibold">{work.status}</span>
                    <a
                      href="#contact"
                      className="text-[#f59e0b] hover:underline font-bold text-[11px] flex items-center gap-1"
                    >
                      <span>Inquire Similar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CONTACT SECTION */}
      <section id="contact" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Direct Contact Info */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#f59e0b]">
                  GET IN TOUCH
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
                  Ready to Start Your Project?
                </h2>
                <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
                  Call our direct dispatch hotline or drop your requirements.
                  We provide free site consultations and itemized estimations.
                </p>
              </div>

              {/* Contact Info Cards */}
              <div className="space-y-3 pt-2">
                <a
                  href="tel:+919845011223"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#f59e0b]/40 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      24/7 Telephone Hotline
                    </div>
                    <div className="text-sm font-bold text-white">+91 98450 11223</div>
                  </div>
                </a>

                <a
                  href="mailto:contact@pandalielectricals.com"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#f59e0b]/40 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Official Email
                    </div>
                    <div className="text-sm font-bold text-white">contact@pandalielectricals.com</div>
                  </div>
                </a>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="w-11 h-11 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Office & Workshop
                    </div>
                    <div className="text-sm font-bold text-white">
                      Plot 42, Industrial Development Area, City Central
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="w-11 h-11 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Operational Hours
                    </div>
                    <div className="text-sm font-bold text-white">
                      Mon - Sat: 8:00 AM - 8:00 PM <span className="text-[#f59e0b] block text-xs">(24/7 for Emergencies)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact & Quote Form */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-10 shadow-2xl">
                <h3 className="text-xl font-black text-white mb-1">
                  Request a Free Site Visit or Quote
                </h3>
                <p className="text-xs text-zinc-400 mb-6">
                  Fill in your requirements below and our electrical supervisor will reach out within 1 hour.
                </p>

                {formSubmitted ? (
                  <div className="p-8 text-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-emerald-400">Inquiry Received Successfully!</h4>
                    <p className="text-xs text-zinc-300 max-w-md mx-auto">
                      Thank you, <span className="font-bold text-white">{formData.name}</span>. Our lead
                      engineer has received your request and will contact you on{" "}
                      <span className="font-bold text-[#f59e0b]">{formData.phone}</span> shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFormSubmitted(false);
                        setFormData({
                          name: "",
                          phone: "",
                          email: "",
                          service: "Electrical & Plumbing Combined",
                          message: "",
                        });
                      }}
                      className="mt-4 text-xs font-bold text-[#f59e0b] hover:underline uppercase tracking-wider cursor-pointer"
                    >
                      Send Another Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Anand Sharma"
                          className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="e.g. +91 98450 00000"
                          className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="e.g. client@example.com"
                          className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Required Service *
                        </label>
                        <select
                          value={formData.service}
                          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                          className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-hidden focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b]"
                        >
                          <option value="Residential Electrical">Residential Electrical & Wiring</option>
                          <option value="Sanitary & Plumbing">Sanitary & Hydro Plumbing</option>
                          <option value="Electrical & Plumbing Combined">Electrical + Plumbing Combined</option>
                          <option value="Commercial 3-Phase">Commercial 3-Phase & HT Panels</option>
                          <option value="Panel Upgrades">Panel Upgrade & Safety Audit</option>
                          <option value="Emergency Repair">24/7 Emergency Breakdown Repair</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                        Project Details / Specific Issue
                      </label>
                      <textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us about the property type, number of rooms/points, or specific issue..."
                        className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 rounded-xl font-bold uppercase tracking-wider bg-[#f59e0b] hover:bg-[#fbbf24] text-zinc-950 text-xs shadow-md shadow-[#f59e0b]/20 gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      {submitting ? (
                        <span>Submitting Request...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Project Request</span>
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. MINIMAL CONTRACTOR FOOTER */}
      <footer className="py-12 border-t border-zinc-800 bg-[#09090b] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b]">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="font-black text-white text-sm uppercase tracking-wider">
                  Pandali Electrical and Plumbing Solutions
                </span>
                <span className="text-zinc-400 text-xs block">
                  Complete Electrical & Plumbing Contracting
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-wider font-semibold text-zinc-400">
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
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-400 text-[11px]">
            <div>
              © {new Date().getFullYear()} Pandali Electrical and Plumbing Solutions. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Govt. Reg: ME-894102-TX</span>
              <span>•</span>
              <span>National Safety Code Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
