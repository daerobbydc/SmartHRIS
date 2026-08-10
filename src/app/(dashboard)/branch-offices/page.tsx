"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, MapPin, Phone, Mail, Edit, DollarSign } from "lucide-react";

interface BranchOffice {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  npwp: string | null;
  isActive: boolean;
}

interface CostCenter {
  id: string;
  code: string;
  name: string;
  department: string;
  budget: number | null;
  spent: number;
  year: number;
}

export default function BranchOfficesPage() {
  const [offices, setOffices] = useState<BranchOffice[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"offices" | "costcenters">("offices");
  const [showForm, setShowForm] = useState(false);
  const [editingOffice, setEditingOffice] = useState<BranchOffice | null>(null);
  const [showCostCenterForm, setShowCostCenterForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    province: "",
    phone: "",
    email: "",
    npwp: "",
  });

  const [ccFormData, setCcFormData] = useState({
    code: "",
    name: "",
    department: "",
    budget: "",
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchOffices();
    fetchCostCenters();
  }, []);

  const fetchOffices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/branch-offices");
      if (res.ok) {
        const data = await res.json();
        setOffices(data.offices || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCostCenters = async () => {
    try {
      const res = await fetch("/api/cost-centers");
      if (res.ok) {
        const data = await res.json();
        setCostCenters(data.costCenters || []);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingOffice ? "/api/branch-offices" : "/api/branch-offices";
      const method = editingOffice ? "PUT" : "POST";
      const body = editingOffice ? { id: editingOffice.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingOffice(null);
        setFormData({ name: "", code: "", address: "", city: "", province: "", phone: "", email: "", npwp: "" });
        fetchOffices();
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleCreateCostCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cost-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ccFormData, budget: ccFormData.budget ? parseFloat(ccFormData.budget) : null }),
      });

      if (res.ok) {
        setShowCostCenterForm(false);
        setCcFormData({ code: "", name: "", department: "", budget: "", year: new Date().getFullYear() });
        fetchCostCenters();
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleEditOffice = (office: BranchOffice) => {
    setEditingOffice(office);
    setFormData({
      name: office.name,
      code: office.code,
      address: office.address || "",
      city: office.city || "",
      province: office.province || "",
      phone: office.phone || "",
      email: office.email || "",
      npwp: office.npwp || "",
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Multi-Company</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">Kelola kantor cabang dan cost center.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("offices")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "offices" ? "bg-white text-teal-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Kantor Cabang
        </button>
        <button
          onClick={() => setActiveTab("costcenters")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "costcenters" ? "bg-white text-teal-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Cost Center
        </button>
      </div>

      {/* Branch Offices Tab */}
      {activeTab === "offices" && (
        <>
          <div className="flex justify-end">
            <button onClick={() => { setEditingOffice(null); setFormData({ name: "", code: "", address: "", city: "", province: "", phone: "", email: "", npwp: "" }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 shadow-md">
              <Plus className="h-4 w-4" /> Kantor Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-3 py-12 text-center text-gray-400">Loading...</div>
            ) : offices.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-gray-400">Belum ada kantor cabang</div>
            ) : (
              offices.map((office) => (
                <div key={office.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{office.name}</h3>
                      <p className="text-xs text-teal-600 font-mono">{office.code}</p>
                    </div>
                    <button onClick={() => handleEditOffice(office)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs text-gray-600">
                    {office.address && (
                      <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-400" />{office.address}</div>
                    )}
                    {office.city && <p className="pl-5">{office.city}{office.province ? `, ${office.province}` : ""}</p>}
                    {office.phone && (
                      <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" />{office.phone}</div>
                    )}
                    {office.email && (
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gray-400" />{office.email}</div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${office.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {office.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Cost Centers Tab */}
      {activeTab === "costcenters" && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowCostCenterForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 shadow-md">
              <Plus className="h-4 w-4" /> Cost Center Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Kode</th>
                    <th className="py-3.5 px-4">Nama</th>
                    <th className="py-3.5 px-4">Departemen</th>
                    <th className="py-3.5 px-4">Budget</th>
                    <th className="py-3.5 px-4">Terpakai</th>
                    <th className="py-3.5 px-4">Sisa</th>
                    <th className="py-3.5 px-4">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {costCenters.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-400">Belum ada cost center</td></tr>
                  ) : (
                    costCenters.map((cc) => {
                      const remaining = (cc.budget || 0) - cc.spent;
                      const percentage = cc.budget ? Math.round((cc.spent / cc.budget) * 100) : 0;
                      return (
                        <tr key={cc.id} className="hover:bg-teal-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-gray-600">{cc.code}</td>
                          <td className="py-3.5 px-4 font-semibold text-gray-900">{cc.name}</td>
                          <td className="py-3.5 px-4 text-gray-600">{cc.department}</td>
                          <td className="py-3.5 px-4 text-gray-600">Rp {(cc.budget || 0).toLocaleString("id-ID")}</td>
                          <td className="py-3.5 px-4 text-gray-600">Rp {cc.spent.toLocaleString("id-ID")}</td>
                          <td className={`py-3.5 px-4 font-semibold ${remaining < 0 ? "text-red-600" : "text-green-600"}`}>
                            Rp {remaining.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-amber-500" : "bg-teal-500"}`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-gray-500">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Office Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditingOffice(null); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editingOffice ? "Edit Kantor" : "Kantor Baru"}</h2>
            <form onSubmit={handleCreateOffice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nama *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kode *</label>
                  <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Alamat</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs h-16" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kota</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Provinsi</label>
                  <input type="text" value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Telepon</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">NPWP</label>
                <input type="text" value={formData.npwp} onChange={(e) => setFormData({ ...formData, npwp: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingOffice(null); }} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cost Center Form Modal */}
      {showCostCenterForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCostCenterForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Cost Center Baru</h2>
            <form onSubmit={handleCreateCostCenter} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kode *</label>
                  <input type="text" required value={ccFormData.code} onChange={(e) => setCcFormData({ ...ccFormData, code: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tahun *</label>
                  <input type="number" required value={ccFormData.year} onChange={(e) => setCcFormData({ ...ccFormData, year: parseInt(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama *</label>
                <input type="text" required value={ccFormData.name} onChange={(e) => setCcFormData({ ...ccFormData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Departemen *</label>
                <input type="text" required value={ccFormData.department} onChange={(e) => setCcFormData({ ...ccFormData, department: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Budget</label>
                <input type="number" value={ccFormData.budget} onChange={(e) => setCcFormData({ ...ccFormData, budget: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCostCenterForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
