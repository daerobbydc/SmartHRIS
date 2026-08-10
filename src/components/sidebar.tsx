"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  FileText,
  Target,
  Briefcase,
  LogOut,
  Menu,
  X,
  GraduationCap,
  CalendarDays,
  AlertTriangle,
  Gift,
  PieChart,
  Star,
  MessageSquare,
  CheckSquare,
  ChevronDown,
  Camera,
  ShieldCheck,
  Network,
  Monitor,
  FileSignature,
  Building2,
  Plug,
  BookOpen,
  Bell,
  Megaphone,
  Heart,
  Globe,
  UserPlus,
  UserMinus,
  Plane,
  ArrowRightLeft,
  Grid,
  Search,
  DollarSign,
  Smartphone,
  Download,
  Fingerprint,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { hasPermission, type Permission } from "@/lib/permissions";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: Permission;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    label: "",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "PERSONALIA & SDM",
    items: [
      { name: "Karyawan", href: "/employees", icon: Users, permission: "employee:read" },
      { name: "Departemen", href: "/departments", icon: Building2, permission: "employee:write" },
      { name: "Kontrak Kerja", href: "/contracts", icon: FileSignature, permission: "employee:write" },
      { name: "Dokumen Personalia", href: "/personalia/documents", icon: FileText, permission: "employee:write" },
      { name: "Onboarding Karyawan", href: "/onboarding", icon: UserPlus, permission: "employee:write" },
      { name: "Offboarding & Paklaring", href: "/offboarding", icon: UserMinus, permission: "employee:write" },
    ],
  },
  {
    label: "PRESENSI & ROSTER",
    items: [
      { name: "Presensi & Absen Online", href: "/absensi", icon: Camera, permission: "attendance:write" },
      { name: "Jadwal Kerja", href: "/absensi/schedule", icon: CalendarDays, permission: "attendance:read" },
      { name: "Tukar Shift", href: "/absensi/shift-swap", icon: ArrowRightLeft, permission: "attendance:read" },
      { name: "Kerja Lembur", href: "/absensi/overtime", icon: Clock, permission: "attendance:read" },
      { name: "Sanksi Presensi", href: "/absensi/sanctions", icon: AlertTriangle, permission: "attendance:approve" },
    ],
  },
  {
    label: "PENGGAJIAN & BENIFIT",
    items: [
      { name: "Penggajian Bulanan", href: "/payroll", icon: DollarSign, permission: "payroll:read" },
      { name: "Gaji & Komponen", href: "/payroll/components", icon: PieChart, permission: "payroll:write" },
      { name: "THR Digital", href: "/payroll/thr", icon: Gift, permission: "payroll:read" },
      { name: "Manfaat & Asuransi", href: "/benefits", icon: Heart, permission: "payroll:read" },
      { name: "Perjalanan Dinas", href: "/business-trip", icon: Plane, permission: "attendance:approve" },
    ],
  },
  {
    label: "REKRUTMEN",
    items: [
      { name: "Lowongan Kerja", href: "/rekrutmen", icon: Briefcase, permission: "recruitment:read" },
      { name: "Pelamar AI Match", href: "/rekrutmen/applicants", icon: Users, permission: "recruitment:read" },
      { name: "Blacklist Pelamar", href: "/rekrutmen/blacklist", icon: Users, permission: "recruitment:read" },
    ],
  },
  {
    label: "KINERJA, LMS & SUKSESI",
    items: [
      { name: "Tugas & OKR", href: "/performance", icon: Target, permission: "performance:read" },
      { name: "Feedback 360", href: "/performance/feedback", icon: Star, permission: "performance:read" },
      { name: "LMS Pelatihan", href: "/lms", icon: GraduationCap, permission: "performance:read" },
      { name: "9-Box Grid Matrix", href: "/talent-matrix", icon: Grid, permission: "performance:write" },
      { name: "Flight Risk AI", href: "/analytics/flight-risk", icon: PieChart, permission: "performance:write" },
    ],
  },
  {
    label: "SELF SERVICE (ESS)",
    items: [
      { name: "Pengajuan Cuti / Izin", href: "/leave/history", icon: Calendar, permission: "leave:read" },
      { name: "Saldo Cuti", href: "/leave/balance", icon: CalendarDays, permission: "leave:read" },
      { name: "Portal ESS", href: "/ess", icon: MessageSquare, permission: "leave:write" },
      { name: "Approval Manager", href: "/ess/approval", icon: CheckSquare, permission: "leave:approve" },
      { name: "Pengumuman", href: "/announcements", icon: Megaphone, permission: "leave:read" },
    ],
  },
  {
    label: "PERUSAHAAN & ASET",
    items: [
      { name: "Identitas Perusahaan", href: "/company-profile", icon: Building2, permission: "settings:manage" },
      { name: "Asset Management", href: "/assets", icon: Monitor, permission: "employee:write" },
      { name: "Kantor Cabang", href: "/branch-offices", icon: Building2, permission: "settings:manage" },
      { name: "Hari Libur Nasional", href: "/holidays", icon: Globe, permission: "leave:read" },
    ],
  },
  {
    label: "INTEGRASI & BOT",
    items: [
      { name: "Mesin Fingerprint", href: "/integrations/fingerprint", icon: Fingerprint, permission: "settings:manage" },
      { name: "WhatsApp Bot", href: "/notifications/whatsapp", icon: MessageSquare, permission: "settings:manage" },
      { name: "Integrations", href: "/integrations", icon: Plug, permission: "settings:manage" },
      { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen, permission: "leave:read" },
    ],
  },
  {
    label: "KEAMANAN & AUDIT",
    items: [
      { name: "Audit Log System", href: "/audit-logs", icon: ShieldCheck, permission: "audit_log:read" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const { data: session } = useSession();
  const { role } = usePermissions();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(navigation.map((s) => [s.label, true]))
  );

  // Filter navigation based on RBAC permissions and menu search filter
  const filteredNavigation = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // RBAC Check
        if (item.permission && !hasPermission(role, item.permission)) {
          return false;
        }
        // Menu Search Filter Check
        if (menuSearch.trim()) {
          return item.name.toLowerCase().includes(menuSearch.toLowerCase());
        }
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0 || !section.label);

  const allHrefs = filteredNavigation.flatMap((s) => s.items.map((i) => i.href));
  const isActive = (href: string) => {
    if (pathname === href) return true;
    const exactMatch = allHrefs.includes(pathname);
    if (exactMatch) return false;
    return pathname.startsWith(href + "/");
  };

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const getInitials = () => {
    if (session?.user?.name) {
      const parts = session.user.name.split(" ");
      return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
    }
    return "HR";
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200 border-r border-slate-800">
      {/* Brand Logo Header */}
      <div className="flex h-[64px] items-center gap-3 px-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/25">
            <span className="text-white font-extrabold text-base">S</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight leading-none">SmartHRIS</h1>
            <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Enterprise Suite</span>
          </div>
        </Link>
      </div>

      {/* Menu Search Bar */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari menu & fitur..."
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all"
          />
        </div>
      </div>

      {/* Main Navigation Scroll Area */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {filteredNavigation.map((section) => (
          <div key={section.label || "main"} className="space-y-0.5">
            {section.label ? (
              <button
                onClick={() => toggleSection(section.label)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
              >
                {section.label}
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-200 text-slate-500",
                    expandedSections[section.label] ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>
            ) : null}

            <AnimatePresence initial={false}>
              {expandedSections[section.label] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pt-0.5">
                    {section.items.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "group relative flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200",
                            active
                              ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-600/30 font-bold"
                              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                          )}
                        >
                          {active && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-teal-300"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                            />
                          )}
                          <Icon
                            className={cn(
                              "h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110",
                              active ? "text-white" : "text-slate-400 group-hover:text-teal-400"
                            )}
                          />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer with PWA Info */}
      <div className="border-t border-slate-800 p-3 bg-slate-950/60">
        {/* PWA Mobile Install Info Box */}
        <div className="rounded-xl bg-teal-950/40 border border-teal-800/50 p-2.5 text-[11px] text-teal-300">
          <div className="flex items-center gap-2 font-bold mb-1 text-teal-200">
            <Smartphone className="h-4 w-4 text-teal-400 shrink-0" /> App Mobile PWA
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Buka di HP & klik <strong>"Tambah ke Layar Utama"</strong> untuk instalasi.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[240px] lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Menu Toggle Button */}
      <div className="fixed top-3 left-4 z-50 lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg border border-slate-800"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
