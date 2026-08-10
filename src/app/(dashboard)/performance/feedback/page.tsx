"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Star, MessageSquare, BarChart3, TrendingUp, Layers } from "lucide-react";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";
import { cn } from "@/lib/utils";
import {
  SectionHeader,
  StatCard,
  ModernButton,
  EmptyState,
  LoadingSpinner,
  Modal,
  AnimatedCard,
  AnimatedBadge,
} from "@/components/ui";

interface Feedback {
  id: string;
  assessorName: string;
  assessorRole: string;
  category: string;
  score: number;
  comments: string | null;
  isAnonymous: boolean;
  period: string;
  year: number;
}

export default function FeedbackPage() {
  const { data: session } = useSession();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [period, setPeriod] = useState("ANNUAL");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const [formData, setFormData] = useState({
    employeeId: "", assessorId: "", assessorName: "", assessorRole: "", category: "", score: "", comments: "", period: "ANNUAL", year: new Date().getFullYear().toString(), isAnonymous: false,
  });

  useEffect(() => { fetchFeedbacks(); }, [period, year]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    const res = await fetch(`/api/performance/feedback?period=${period}&year=${year}`);
    if (res.ok) { setFeedbacks(await res.json()); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/performance/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, employeeId: session?.user?.id || "" }) });
    setShowModal(false);
    fetchFeedbacks();
  };

  const getScoreStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={cn("h-4 w-4", i < score ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
    ));
  };

  const categories = [...new Set(feedbacks.map((f) => f.category))];
  const avgScore = feedbacks.length > 0 ? feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="360 Feedback"
        description="Penilaian dari rekan kerja, atasan, dan bawahan"
        action={
          <ModernButton icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
            Beri Feedback
          </ModernButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Feedback" value={feedbacks.length} icon={<BarChart3 className="h-6 w-6" />} color="blue" delay={0.1} />
        <StatCard title="Rata-rata Skor" value={`${avgScore.toFixed(1)} / 5`} icon={<TrendingUp className="h-6 w-6" />} color="green" delay={0.2} />
        <StatCard title="Kategori" value={categories.length} icon={<Layers className="h-6 w-6" />} color="purple" delay={0.3} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex gap-4">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="MONTHLY">Bulanan</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ANNUAL">Tahunan</option>
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-24" />
      ) : feedbacks.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-10 w-10" />}
          title="Belum ada feedback"
          description="Mulai berikan feedback kepada rekan kerja Anda"
          action={
            <ModernButton icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
              Beri Feedback
            </ModernButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feedbacks.map((f, i) => (
            <AnimatedCard key={f.id} delay={i * 0.06} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{f.isAnonymous ? "Anonim" : f.assessorName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <AnimatedBadge variant="info">{f.assessorRole}</AnimatedBadge>
                    <span className="text-xs text-gray-400">{f.category}</span>
                  </div>
                </div>
                <div className="flex">{getScoreStars(f.score)}</div>
              </div>
              {f.comments && (
                <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-600 italic">"{f.comments}"</p>
                </div>
              )}
            </AnimatedCard>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Berikan Feedback">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Anda</label>
            <input type="text" value={formData.assessorName} onChange={(e) => setFormData({ ...formData, assessorName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Peran</label>
            <AutocompleteSelect
              options={[
                { value: "Atasan", label: "Atasan Direct Manager", sublabel: "Penilaian dari supervisor" },
                { value: "Rekan Kerja", label: "Rekan Kerja (Peer)", sublabel: "Penilaian antar teman tim" },
                { value: "Bawahan", label: "Bawahan Direct Report", sublabel: "Penilaian kepemimpinan" },
                { value: "Klien", label: "Klien / Stakeholder", sublabel: "Penilaian eksternal" },
              ]}
              value={formData.assessorRole}
              onChange={(val) => setFormData({ ...formData, assessorRole: val })}
              placeholder="-- Pilih Peran Penilai --"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
            <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., Komunikasi, Kerja Tim" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Skor (1-5)</label>
            <input type="number" value={formData.score} onChange={(e) => setFormData({ ...formData, score: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" min="1" max="5" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Komentar</label>
            <textarea value={formData.comments} onChange={(e) => setFormData({ ...formData, comments: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="anonymous" checked={formData.isAnonymous} onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })} className="h-4 w-4 text-teal-600 rounded" />
            <label htmlFor="anonymous" className="text-sm text-gray-700">Sembunyikan Identitas</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <ModernButton type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </ModernButton>
            <ModernButton type="submit">
              Kirim
            </ModernButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
