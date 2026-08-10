"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { getInitials } from "@/lib/utils";
import {
  Bell,
  Search,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Command,
  User,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";

export function Header() {
  const { data: session } = useSession();
  const { role } = usePermissions();
  const pathname = usePathname();
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleLabel = (r: string) => {
    switch (r) {
      case "ADMIN":
        return "Administrator";
      case "HR":
        return "Human Resource";
      case "MANAGER":
        return "Manager / Supervisor";
      case "FINANCE":
        return "Finance & Payroll";
      default:
        return "Karyawan (Staff)";
    }
  };

  // Format active breadcrumb path
  const pathSegments = pathname.split("/").filter(Boolean);
  const formattedBreadcrumb = pathSegments.length > 0
    ? pathSegments.map((s) => s.replace("-", " ")).join(" / ")
    : "Dashboard Utama";

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 h-[64px] border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 flex items-center justify-between px-6 transition-colors"
    >
      {/* Left: Breadcrumbs & Page Context */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">
          <span className="text-teal-600 dark:text-teal-400">
            SmartHRIS
          </span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold">{formattedBreadcrumb}</span>
        </div>
      </div>

      {/* Right: Search, Notifications, Help & User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <div className="relative hidden md:block">
          <div className="flex items-center">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari fitur, karyawan, atau modul..."
                className="pl-9 pr-10 py-2 text-xs bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-64 text-slate-900 dark:text-white transition-all shadow-xs"
              />
              <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotif(!showNotif);
              setShowUserMenu(false);
            }}
            className="relative p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-teal-600" /> Notifikasi Sistem
                  </h3>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950 dark:text-teal-300 px-2 py-0.5 rounded-full">
                    3 Baru
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {[
                    { title: "Permohonan Tukar Shift", desc: "Ahmad Fauzi mengajukan tukar shift dengan Budi", time: "2m lalu" },
                    { title: "Perjalanan Dinas Disetujui", desc: "Perjalanan dinas Surabaya disetujui HR", time: "15m lalu" },
                    { title: "Sertifikat LMS Terbit", desc: "Diana Aise lulus modul Cybersecurity 101", time: "1j lalu" },
                  ].map((notif, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{notif.desc}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 text-center">
                  <button className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400">
                    Tandai Semua Dibaca
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotif(false);
            }}
            className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
          >
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xs font-extrabold shadow-md shadow-teal-500/20 ring-2 ring-teal-500/20">
                {session?.user?.name
                  ? getInitials(
                      session.user.name.split(" ")[0] || "",
                      session.user.name.split(" ")[1] || ""
                    )
                  : "HR"}
              </div>
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
            </div>

            <div className="hidden lg:block text-left text-xs">
              <div className="font-bold text-slate-900 dark:text-white leading-tight">
                {session?.user?.name || "Pengguna HRIS"}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {getRoleLabel(role)}
              </div>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50 p-1.5"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{session?.user?.name || "Pengguna HRIS"}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{session?.user?.email || "user@smarthris.com"}</p>
                  <span className="inline-block mt-1 rounded bg-teal-50 px-2 py-0.5 text-[9px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    {getRoleLabel(role)}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Keluar Sistem (Sign Out)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
