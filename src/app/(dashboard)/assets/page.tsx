"use client";

import { useEffect, useState } from "react";
import { Monitor, Plus, Search, Package, CheckCircle, Wrench, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  currentValue: number | null;
  status: string;
  location: string | null;
  assignments: { employee: { firstName: string; lastName: string } }[];
}

const categoryIcons: Record<string, string> = {
  ELECTRONICS: "💻",
  FURNITURE: "🪑",
  VEHICLE: "🚗",
  EQUIPMENT: "🔧",
  OTHER: "📦",
};

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-50 text-green-700 border-green-200",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
  MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
  RETIRED: "bg-gray-50 text-gray-700 border-gray-200",
  LOST: "bg-red-50 text-red-700 border-red-200",
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<Asset | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<Asset | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    assetCode: "",
    name: "",
    category: "ELECTRONICS",
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    purchasePrice: "",
    currentValue: "",
    location: "",
    notes: "",
  });

  const [assignData, setAssignData] = useState({ employeeId: "", notes: "" });
  const [returnData, setReturnData] = useState({ condition: "Good", notes: "" });
  const [employees, setEmployees] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
  }, [categoryFilter, statusFilter]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/assets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          currentValue: formData.currentValue ? parseFloat(formData.currentValue) : null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ assetCode: "", name: "", category: "ELECTRONICS", brand: "", model: "", serialNumber: "", purchaseDate: "", purchasePrice: "", currentValue: "", location: "", notes: "" });
        fetchAssets();
      }
    } catch (err) {
      console.error("Error creating asset:", err);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;

    try {
      const res = await fetch("/api/assets/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: showAssignModal.id, ...assignData }),
      });

      if (res.ok) {
        setShowAssignModal(null);
        setAssignData({ employeeId: "", notes: "" });
        fetchAssets();
      }
    } catch (err) {
      console.error("Error assigning asset:", err);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReturnModal) return;

    try {
      const res = await fetch("/api/assets/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: showReturnModal.id, ...returnData }),
      });

      if (res.ok) {
        setShowReturnModal(null);
        setReturnData({ condition: "Good", notes: "" });
        fetchAssets();
      }
    } catch (err) {
      console.error("Error returning asset:", err);
    }
  };

  const stats = {
    total: assets.length,
    available: assets.filter((a) => a.status === "AVAILABLE").length,
    assigned: assets.filter((a) => a.status === "ASSIGNED").length,
    maintenance: assets.filter((a) => a.status === "MAINTENANCE").length,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Monitor className="h-6 w-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Asset Management</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">Kelola aset perusahaan dan penugasan karyawan.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 shadow-md"
        >
          <Plus className="h-4 w-4" /> Tambah Aset
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><Package className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Aset</p>
            <p className="text-xl font-extrabold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckCircle className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Tersedia</p>
            <p className="text-xl font-extrabold text-gray-900">{stats.available}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ArrowRightLeft className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Ditugaskan</p>
            <p className="text-xl font-extrabold text-gray-900">{stats.assigned}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Wrench className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Maintenance</p>
            <p className="text-xl font-extrabold text-gray-900">{stats.maintenance}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAssets()}
              placeholder="Cari aset..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2.5">
            <option value="">Semua Kategori</option>
            <option value="ELECTRONICS">Electronics</option>
            <option value="FURNITURE">Furniture</option>
            <option value="VEHICLE">Vehicle</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="OTHER">Other</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2.5">
            <option value="">Semua Status</option>
            <option value="AVAILABLE">Tersedia</option>
            <option value="ASSIGNED">Ditugaskan</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Kode</th>
                <th className="py-3.5 px-4">Nama</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Brand/Model</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Ditugaskan Ke</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Loading...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Tidak ada aset ditemukan</td></tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-gray-600">{asset.assetCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{categoryIcons[asset.category] || "📦"}</span>
                        <span className="font-semibold text-gray-900">{asset.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{asset.category}</td>
                    <td className="py-3.5 px-4 text-gray-600">{asset.brand} {asset.model}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-1 text-[10px] font-semibold rounded-full border ${statusColors[asset.status] || ""}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {asset.assignments.length > 0
                        ? `${asset.assignments[0].employee.firstName} ${asset.assignments[0].employee.lastName}`
                        : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {asset.status === "AVAILABLE" && (
                        <button
                          onClick={() => setShowAssignModal(asset)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-[11px]"
                        >
                          Tugaskan
                        </button>
                      )}
                      {asset.status === "ASSIGNED" && (
                        <button
                          onClick={() => setShowReturnModal(asset)}
                          className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold rounded-lg text-[11px]"
                        >
                          Kembalikan
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tambah Aset Baru</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kode Aset *</label>
                  <input type="text" required value={formData.assetCode} onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nama *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kategori *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none">
                    <option value="ELECTRONICS">Electronics</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lokasi</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                  <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
                  <input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Serial Number</label>
                <input type="text" value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Beli</label>
                  <input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Harga Beli</label>
                  <input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Tugaskan Aset</h2>
            <p className="text-sm text-gray-500 mb-4">{showAssignModal.name} ({showAssignModal.assetCode})</p>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Karyawan *</label>
                <AutocompleteSelect
                  options={employees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.firstName} ${emp.lastName}`,
                    sublabel: "Karyawan Aktif",
                  }))}
                  value={assignData.employeeId}
                  onChange={(val) => setAssignData({ ...assignData, employeeId: val })}
                  placeholder="-- Cari Karyawan Penerima --"
                  searchPlaceholder="Ketik nama karyawan..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Catatan</label>
                <textarea value={assignData.notes} onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs h-20" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAssignModal(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700">Tugaskan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReturnModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Kembalikan Aset</h2>
            <p className="text-sm text-gray-500 mb-4">{showReturnModal.name} ({showReturnModal.assetCode})</p>
            <form onSubmit={handleReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kondisi *</label>
                <select required value={returnData.condition} onChange={(e) => setReturnData({ ...returnData, condition: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs">
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Catatan</label>
                <textarea value={returnData.notes} onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs h-20" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowReturnModal(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700">Kembalikan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
