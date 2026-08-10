"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, ShieldOff } from "lucide-react";
import { SectionHeader, ModernButton, TableContainer, EmptyState, LoadingSpinner } from "@/components/ui";

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isBlacklisted: boolean;
  blacklistedReason: string | null;
  vacancy: { title: string };
}

export default function BlacklistPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchApplicants(); }, []);

  const fetchApplicants = async () => {
    const res = await fetch("/api/rekrutmen/applicants");
    if (res.ok) { setApplicants(await res.json()); }
    setLoading(false);
  };

  const handleBlacklist = async (id: string, reason: string) => {
    await fetch(`/api/rekrutmen/applicants?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlacklisted: true, blacklistedReason: reason }),
    });
    fetchApplicants();
  };

  const handleUnblacklist = async (id: string) => {
    await fetch(`/api/rekrutmen/applicants?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlacklisted: false, blacklistedReason: null }),
    });
    fetchApplicants();
  };

  const blacklisted = applicants.filter((a) => a.isBlacklisted);
  const filtered = search
    ? blacklisted.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()))
    : blacklisted;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Blacklist Pelamar"
        description="Daftar pelamar yang diblokir dari sistem rekrutmen"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-0 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>
      </motion.div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Tidak ada pelamar dalam blacklist"
          description="Pelamar yang diblokir akan muncul di sini"
        />
      ) : (
        <TableContainer>
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Lowongan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Alasan
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {filtered.map((a, index) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{a.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{a.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{a.vacancy.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-red-600 font-medium">
                        {a.blacklistedReason || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ModernButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnblacklist(a.id)}
                        icon={<ShieldOff className="h-4 w-4" />}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Hapus dari Blacklist
                      </ModernButton>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </TableContainer>
      )}
    </div>
  );
}
