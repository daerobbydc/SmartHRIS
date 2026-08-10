"use client";

import { useEffect, useState } from "react";
import { BookOpen, Search, Eye, ChevronRight, HelpCircle, FileText } from "lucide-react";

interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await fetch(`/api/knowledge-base?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const defaultFAQs: FAQ[] = [
    { question: "Bagaimana cara mengajukan cuti?", answer: "Silakan login ke SmartHRIS, masuk ke menu Self Service > Pengajuan, pilih tipe cuti, isi tanggal dan alasan.", category: "Cuti" },
    { question: "Jam kerja berapa?", answer: "Jam kerja standar: Senin-Jumat, 08:00 - 17:00. Jam istirahat: 12:00 - 13:00.", category: "Absensi" },
    { question: "Bagaimana cara absen online?", answer: "Buka menu Absensi > Absen Online. Pastikan GPS aktif dan dalam radius kantor (100m).", category: "Absensi" },
    { question: "Kapan gaji ditransfer?", answer: "Gaji ditransfer tanggal 25 setiap bulannya. Slip gaji dikirim via email.", category: "Payroll" },
    { question: "Bagaimana cara melihat slip gaji?", answer: "Login ke SmartHRIS, masuk ke menu Layanana > Gaji. Pilih bulan yang diinginkan.", category: "Payroll" },
  ];

  const displayFAQs = faqs.length > 0 ? faqs : defaultFAQs;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Knowledge Base</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">Panduan dan FAQ untuk penggunaan SmartHRIS.</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari artikel atau FAQ..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Categories */}
        <div className="space-y-4">
          {/* Categories */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Kategori</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory("")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  !selectedCategory ? "bg-teal-50 text-teal-700" : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                Semua Kategori
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedCategory === cat.category ? "bg-teal-50 text-teal-700" : "hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <span>{cat.category}</span>
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Quick Links</h3>
            <div className="space-y-2">
              <a href="/absensi" className="flex items-center gap-2 text-xs text-gray-600 hover:text-teal-600 py-1">
                <ChevronRight className="h-3 w-3" /> Absen Online
              </a>
              <a href="/leave/history" className="flex items-center gap-2 text-xs text-gray-600 hover:text-teal-600 py-1">
                <ChevronRight className="h-3 w-3" /> Ajukan Cuti
              </a>
              <a href="/payroll/components" className="flex items-center gap-2 text-xs text-gray-600 hover:text-teal-600 py-1">
                <ChevronRight className="h-3 w-3" /> Lihat Gaji
              </a>
              <a href="/ess" className="flex items-center gap-2 text-xs text-gray-600 hover:text-teal-600 py-1">
                <ChevronRight className="h-3 w-3" /> Self Service
              </a>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Articles */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">Artikel</h3>
            {loading ? (
              <div className="py-8 text-center text-gray-400">Loading...</div>
            ) : articles.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Belum ada artikel</p>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="p-4 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{article.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.content.slice(0, 150)}...</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">{article.category}</span>
                          {article.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[10px] rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-[10px]">{article.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">FAQ (Pertanyaan Umum)</h3>
            <div className="space-y-3">
              {displayFAQs.map((faq, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                    className="w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <HelpCircle className="h-5 w-5 text-teal-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 flex-1">{faq.question}</span>
                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expandedFAQ === idx ? "rotate-90" : ""}`} />
                  </button>
                  {expandedFAQ === idx && (
                    <div className="px-4 pb-4 pl-12">
                      <p className="text-sm text-gray-600">{faq.answer}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">{faq.category}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedArticle(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedArticle.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-xs rounded-full">{selectedArticle.category}</span>
                    <span className="text-xs text-gray-400">{selectedArticle.views} views</span>
                  </div>
                </div>
                <button onClick={() => setSelectedArticle(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {selectedArticle.content}
              </div>
              {selectedArticle.tags.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
