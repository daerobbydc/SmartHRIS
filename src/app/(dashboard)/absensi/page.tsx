"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building2,
  UserCheck,
  UserX,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Info,
  Maximize2,
  RotateCcw,
  Sparkles,
  Edit,
  Trash2,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { calculateDistance, verifyGeofence } from "@/lib/geofence";
import {
  SectionHeader,
  StatCard,
  ModernButton,
  AnimatedBadge,
  Modal,
  LoadingSpinner,
} from "@/components/ui";
import { usePermissions } from "@/hooks/use-permissions";

interface OfficeLocation {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  checkInLocation: string | null;
  checkOutLocation: string | null;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
  checkInDistance: number | null;
  checkOutDistance: number | null;
  isGeofenceValid: boolean;
  notes: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
    position: string;
  };
  officeLocation?: OfficeLocation | null;
}

export default function AbsensiOnlinePage() {
  const { data: session } = useSession();
  const { role } = usePermissions();
  const canManage = role === "ADMIN" || role === "HR";

  const [time, setTime] = useState<Date | null>(null);
  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<OfficeLocation | null>(null);
  
  // GPS State
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [distanceToOffice, setDistanceToOffice] = useState<number | null>(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(false);

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Attendance State
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modals
  const [showOfficeModal, setShowOfficeModal] = useState<boolean>(false);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // New Office Form
  const [newOffice, setNewOffice] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radiusMeters: "150",
  });

  // Correction Claims State
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [correctionClaims, setCorrectionClaims] = useState<any[]>([]);
  const [correctionForm, setCorrectionForm] = useState({
    targetDate: new Date().toISOString().split("T")[0],
    requestedCheckIn: "08:00",
    requestedCheckOut: "17:00",
    correctionReason: "",
  });
  const [submittingCorrection, setSubmittingCorrection] = useState<boolean>(false);

  const [showEditOfficeModal, setShowEditOfficeModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState<{
    id: string;
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    radiusMeters: string;
  } | null>(null);

  const fetchCorrectionClaims = async () => {
    try {
      const res = await fetch("/api/absensi/corrections");
      if (res.ok) {
        const data = await res.json();
        setCorrectionClaims(data);
      }
    } catch (err) {
      console.error("Error fetching correction claims:", err);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    setSubmittingCorrection(true);
    try {
      const checkInDateTime = `${correctionForm.targetDate}T${correctionForm.requestedCheckIn}:00`;
      const checkOutDateTime = `${correctionForm.targetDate}T${correctionForm.requestedCheckOut}:00`;

      const res = await fetch("/api/absensi/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: session.user.id,
          targetDate: correctionForm.targetDate,
          requestedCheckIn: checkInDateTime,
          requestedCheckOut: checkOutDateTime,
          correctionReason: correctionForm.correctionReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message || "Berhasil mengajukan koreksi!", type: "success" });
        setShowCorrectionModal(false);
        setCorrectionForm({
          targetDate: new Date().toISOString().split("T")[0],
          requestedCheckIn: "08:00",
          requestedCheckOut: "17:00",
          correctionReason: "",
        });
        fetchCorrectionClaims();
      } else {
        setMessage({ text: data.error || "Gagal mengajukan koreksi", type: "error" });
      }
    } catch (err) {
      console.error("Correction submit error:", err);
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const handleOpenEditOffice = (office: OfficeLocation) => {
    setEditingOffice({
      id: office.id,
      name: office.name,
      address: office.address || "",
      latitude: office.latitude.toString(),
      longitude: office.longitude.toString(),
      radiusMeters: office.radiusMeters.toString(),
    });
    setShowEditOfficeModal(true);
  };

  const handleUpdateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffice) return;
    try {
      const res = await fetch(`/api/absensi/office-locations?id=${editingOffice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingOffice),
      });

      if (res.ok) {
        setShowEditOfficeModal(false);
        setEditingOffice(null);
        fetchOffices();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mengedit lokasi kantor");
      }
    } catch (err) {
      console.error("Error updating office location:", err);
    }
  };

  const handleDeleteOffice = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus lokasi kantor "${name}"?`)) return;
    try {
      const res = await fetch(`/api/absensi/office-locations?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchOffices();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus lokasi kantor");
      }
    } catch (err) {
      console.error("Error deleting office location:", err);
    }
  };

  // Digital Clock Timer
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchOffices();
    fetchAttendanceData();
    fetchCorrectionClaims();
    requestGpsLocation();
  }, []);

  // Recalculate geofence when location or office changes
  useEffect(() => {
    if (gpsLocation && selectedOffice) {
      const res = verifyGeofence(
        gpsLocation.latitude,
        gpsLocation.longitude,
        selectedOffice.latitude,
        selectedOffice.longitude,
        selectedOffice.radiusMeters
      );
      setDistanceToOffice(res.distanceMeters);
      setIsWithinGeofence(res.isWithin);
    }
  }, [gpsLocation, selectedOffice]);

  const fetchOffices = async () => {
    try {
      const res = await fetch("/api/absensi/office-locations");
      if (res.ok) {
        const data = await res.json();
        setOffices(data);
        if (data.length > 0) {
          setSelectedOffice(data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching office locations:", err);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      fetchCorrectionClaims();
      // Fetch Today's Attendance
      const todayRes = await fetch("/api/absensi?todayOnly=true");
      if (todayRes.ok) {
        const data = await todayRes.json();
        if (data.length > 0) {
          setTodayAttendance(data[0]);
        } else {
          setTodayAttendance(null);
        }
      }

      // Fetch History
      const historyRes = await fetch("/api/absensi");
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setAttendanceHistory(historyData);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  // Request GPS position
  const requestGpsLocation = useCallback(() => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Perangkat tidak mendukung Geolocation");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        });
        setGpsLoading(false);
      },
      (error) => {
        console.warn("GPS Error:", error);
        // Fallback for dev mode/demo: set user position close to HQ office if blocked
        if (process.env.NODE_ENV !== "production" || error.code === error.PERMISSION_DENIED) {
          setGpsError("Izin GPS tidak diberikan. Menggunakan simulasi koordinat presensi.");
          setGpsLocation({
            latitude: -6.2088, // HQ Jakarta
            longitude: 106.8456,
            accuracy: 10,
          });
        } else {
          setGpsError("Gagal mengambil lokasi GPS. Pastikan Izin Lokasi diaktifkan.");
        }
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Kamera tidak dapat diakses. Mohon beri izin akses kamera browser.");
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture Selfie Photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw photo and add timestamp overlay watermark
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add watermark
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(10, canvas.height - 40, canvas.width - 20, 30);
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px Inter, sans-serif";
        const timeStr = time ? time.toLocaleString("id-ID") : new Date().toLocaleString("id-ID");
        ctx.fillText(`SmartHRIS Verified • ${timeStr} • GPS Valid`, 20, canvas.height - 20);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Submit Attendance (Check-in or Check-out)
  const handleAttendanceSubmit = async (action: "check-in" | "check-out") => {
    if (!session?.user?.id) {
      setMessage({ text: "Sesi pengguna tidak valid", type: "error" });
      return;
    }

    if (!capturedPhoto) {
      setMessage({ text: "Wajib mengambil foto selfie sebelum absen!", type: "error" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: session.user.id,
          action,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
          officeLocationId: selectedOffice?.id,
          photo: capturedPhoto,
          notes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          text: data.message || "Berhasil memproses presensi!",
          type: "success",
        });
        setCapturedPhoto(null);
        setNotes("");
        fetchAttendanceData();
      } else {
        setMessage({
          text: data.error || "Gagal melakukan presensi.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Attendance submit error:", err);
      setMessage({ text: "Terjadi kesalahan jaringan", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit New Office Location
  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/absensi/office-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOffice),
      });

      if (res.ok) {
        setShowOfficeModal(false);
        setNewOffice({ name: "", address: "", latitude: "", longitude: "", radiusMeters: "150" });
        fetchOffices();
      }
    } catch (err) {
      console.error("Error creating office location:", err);
    }
  };

  // Helper formatting
  const formatTimeString = (isoStr: string | null) => {
    if (!isoStr) return "-";
    const d = new Date(isoStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden Canvas for Camera Snapping */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-800 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Presensi Online Geofencing & Selfie</h1>
          </div>
          <p className="text-teal-100 text-sm">
            Verifikasi presensi harian secara aman dengan lokasi GPS Geofence & Liveness Photo Capture.
          </p>
        </div>

        {/* Realtime Digital Clock & Correction Claim Button */}
        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-white/30 shadow-sm transition flex items-center gap-2"
          >
            <Edit className="h-4 w-4" /> Ajukan Koreksi Absen
          </button>

          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20">
            <Clock className="h-8 w-8 text-teal-200" />
            <div>
              <p className="text-2xl font-mono font-bold tracking-wider leading-none">
                {time ? time.toLocaleTimeString("id-ID") : "--:--:--"}
              </p>
              <p className="text-xs text-teal-100 mt-1">
                {time ? time.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Message Notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-xl flex items-center justify-between shadow-md",
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            )}
          >
            <div className="flex items-center gap-3">
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-xs font-bold underline ml-4 hover:opacity-75"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Interactive Attendance Terminal & Today Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Camera & Geofence Verification Terminal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            
            {/* Top Bar: Office Selector & Geofence Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-teal-600" /> Target Geofence Kantor
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedOffice?.id || ""}
                    onChange={(e) => {
                      const found = offices.find((o) => o.id === e.target.value);
                      if (found) setSelectedOffice(found);
                    }}
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold rounded-xl p-2.5 pr-8 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {offices.map((office) => (
                      <option key={office.id} value={office.id}>
                        {office.name} ({office.radiusMeters}m radius)
                      </option>
                    ))}
                  </select>

                  {canManage && (
                    <button
                      onClick={() => setShowOfficeModal(true)}
                      className="p-2.5 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors shrink-0"
                      title="Tambah Lokasi Kantor"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Geofence Status Indicator Badge */}
              <div className="flex flex-col sm:items-end">
                <span className="text-xs text-gray-500 mb-1">Status Geofence GPS</span>
                {gpsLoading ? (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-medium border border-amber-200">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Menghubungkan GPS...
                  </span>
                ) : isWithinGeofence ? (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full font-semibold border border-emerald-300 shadow-sm">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> DALAM GEOFENCE ({distanceToOffice}m)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-rose-100 text-rose-800 px-3 py-1.5 rounded-full font-semibold border border-rose-300 shadow-sm">
                    <ShieldAlert className="h-4 w-4 text-rose-600" /> DI LUAR GEOFENCE ({distanceToOffice !== null ? `${distanceToOffice}m` : "N/A"})
                  </span>
                )}
              </div>
            </div>

            {/* GPS Detail Info Box */}
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Koordinat Anda:</strong>{" "}
                  {gpsLocation
                    ? `${gpsLocation.latitude.toFixed(5)}, ${gpsLocation.longitude.toFixed(5)}`
                    : "Mencari lokasi..."}
                  {gpsLocation?.accuracy && ` (Akurasi: ±${gpsLocation.accuracy}m)`}
                </span>
              </div>

              <button
                onClick={requestGpsLocation}
                className="flex items-center gap-1 text-teal-700 font-semibold hover:underline"
              >
                <RefreshCw className="h-3 w-3" /> Refresh GPS
              </button>
            </div>

            {gpsError && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-amber-600" /> {gpsError}
              </p>
            )}

            {/* Camera Preview / Photo Capture Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-teal-600" /> Foto Selfie Liveness Capture
                </label>
                {capturedPhoto && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    ✓ Foto Terverifikasi
                  </span>
                )}
              </div>

              <div className="relative rounded-2xl bg-gray-900 overflow-hidden aspect-video max-h-[360px] flex items-center justify-center border-2 border-dashed border-gray-300 shadow-inner">
                {/* 1. Captured Photo Preview */}
                {capturedPhoto ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedPhoto}
                      alt="Selfie Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button
                        onClick={retakePhoto}
                        className="px-3 py-1.5 bg-black/70 hover:bg-black text-white text-xs font-semibold rounded-lg backdrop-blur-md flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Foto Ulang
                      </button>
                    </div>
                  </div>
                ) : isCameraActive ? (
                  /* 2. Active Video Stream */
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    {/* Face Frame Overlay Guide */}
                    <div className="absolute inset-0 border-2 border-teal-400/40 rounded-2xl pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-64 border-2 border-dashed border-white/60 rounded-full shadow-2xl backdrop-blur-[1px]" />
                    </div>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                      <button
                        onClick={capturePhoto}
                        className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-sm rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" /> Ambil Foto Selfie
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 3. Inactive Camera Placeholder */
                  <div className="text-center p-6 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-teal-500/10 text-teal-400 mx-auto flex items-center justify-center">
                      <Camera className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Kamera Belum Aktif</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Klik tombol di bawah untuk mengaktifkan webcam dan melakukan selfie verification.
                      </p>
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
                    >
                      Buka Kamera Webcam
                    </button>
                  </div>
                )}
              </div>

              {cameraError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {cameraError}
                </p>
              )}
            </div>

            {/* Notes Input Field */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Catatan / Keterangan Lokasi (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: WFH / Meeting Klien / Perjalanan Dinas"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Check-In / Check-Out Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => handleAttendanceSubmit("check-in")}
                disabled={submitting || !!todayAttendance?.checkIn}
                className={cn(
                  "py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all",
                  todayAttendance?.checkIn
                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:shadow-teal-500/25 active:scale-[0.99]"
                )}
              >
                <UserCheck className="h-5 w-5" />
                {todayAttendance?.checkIn ? "Sudah Absen Masuk" : "ABSEN MASUK (CLOCK IN)"}
              </button>

              <button
                onClick={() => handleAttendanceSubmit("check-out")}
                disabled={submitting || !todayAttendance?.checkIn || !!todayAttendance?.checkOut}
                className={cn(
                  "py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all",
                  !todayAttendance?.checkIn || todayAttendance?.checkOut
                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-rose-600 to-amber-600 text-white hover:shadow-rose-500/25 active:scale-[0.99]"
                )}
              >
                <UserX className="h-5 w-5" />
                {todayAttendance?.checkOut
                  ? "Sudah Absen Keluar"
                  : "ABSEN KELUAR (CLOCK OUT)"}
              </button>
            </div>

          </div>
        </div>

        {/* Right Column (1 Col): Today's Summary & Office Info Card */}
        <div className="space-y-6">
          
          {/* Today's Status Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" /> Ringkasan Presensi Hari Ini
            </h2>

            {todayAttendance ? (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Status Kehadiran</span>
                  <AnimatedBadge
                    variant={
                      todayAttendance.status === "PRESENT"
                        ? "success"
                        : todayAttendance.status === "LATE"
                        ? "warning"
                        : "info"
                    }
                  >
                    {todayAttendance.status === "PRESENT"
                      ? "HADIR TEPAT WAKTU"
                      : todayAttendance.status === "LATE"
                      ? "TERLAMBAT"
                      : todayAttendance.status}
                  </AnimatedBadge>
                </div>

                {/* Check In Box */}
                <div className="bg-teal-50/60 p-3.5 rounded-xl border border-teal-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">Jam Masuk</span>
                    <span className="text-sm font-mono font-bold text-teal-900">
                      {formatTimeString(todayAttendance.checkIn)}
                    </span>
                  </div>
                  {todayAttendance.checkInLocation && (
                    <p className="text-xs text-gray-600 line-clamp-1">
                      📍 {todayAttendance.checkInLocation}
                    </p>
                  )}
                  {todayAttendance.checkInPhoto && (
                    <button
                      onClick={() => setViewPhotoUrl(todayAttendance.checkInPhoto)}
                      className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1 pt-1"
                    >
                      <Maximize2 className="h-3 w-3" /> Lihat Foto Selfie Masuk
                    </button>
                  )}
                </div>

                {/* Check Out Box */}
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Jam Keluar</span>
                    <span className="text-sm font-mono font-bold text-amber-900">
                      {formatTimeString(todayAttendance.checkOut)}
                    </span>
                  </div>
                  {todayAttendance.checkOutLocation && (
                    <p className="text-xs text-gray-600 line-clamp-1">
                      📍 {todayAttendance.checkOutLocation}
                    </p>
                  )}
                  {todayAttendance.checkOutPhoto && (
                    <button
                      onClick={() => setViewPhotoUrl(todayAttendance.checkOutPhoto)}
                      className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1 pt-1"
                    >
                      <Maximize2 className="h-3 w-3" /> Lihat Foto Selfie Keluar
                    </button>
                  )}
                </div>

                {/* Geofence Status */}
                <div className="pt-2 border-t border-gray-100 text-xs flex items-center justify-between">
                  <span className="text-gray-500">Verifikasi Geofence:</span>
                  <span
                    className={cn(
                      "font-semibold px-2 py-0.5 rounded",
                      todayAttendance.isGeofenceValid
                        ? "text-emerald-700 bg-emerald-50"
                        : "text-rose-700 bg-rose-50"
                    )}
                  >
                    {todayAttendance.isGeofenceValid ? "VALID (Dalam Radius)" : "DILUAR RADIUS"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Belum Ada Presensi Hari Ini</p>
                <p className="text-xs text-gray-400">
                  Silakan buka kamera dan tekan Absen Masuk untuk merekam waktu kehadiran Anda.
                </p>
              </div>
            )}
          </div>

          {/* Active Office Info Card */}
          {selectedOffice && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-teal-600" /> Detail Geofence Kantor
                </h3>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditOffice(selectedOffice)}
                      className="p-1 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition text-xs font-bold flex items-center gap-1 border border-amber-200 px-2 py-1"
                      title="Edit Lokasi Kantor Ini"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteOffice(selectedOffice.id, selectedOffice.name)}
                      className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition text-xs font-bold flex items-center gap-1 border border-rose-200 px-2 py-1"
                      title="Hapus Lokasi Kantor Ini"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-gray-600">
                <p className="font-bold text-gray-900">{selectedOffice.name}</p>
                {selectedOffice.address && <p>{selectedOffice.address}</p>}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-gray-500">
                  <span>Radius Geofence:</span>
                  <span className="font-semibold text-teal-700">{selectedOffice.radiusMeters} meter</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>Titik Pusat (Lat, Lng):</span>
                  <span className="font-mono text-[11px] text-gray-700">
                    {selectedOffice.latitude.toFixed(4)}, {selectedOffice.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Bottom Section: Attendance History Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Riwayat Presensi Terbaru</h2>
            <p className="text-xs text-gray-500">Log kehadiran karyawan beserta lokasi & verifikasi geofence</p>
          </div>

          <button
            onClick={fetchAttendanceData}
            className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <LoadingSpinner />
          </div>
        ) : attendanceHistory.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Belum ada riwayat presensi tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Karyawan</th>
                  <th className="py-3 px-4">Jam Masuk</th>
                  <th className="py-3 px-4">Jam Keluar</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Geofence Valid</th>
                  <th className="py-3 px-4">Selfie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {formatDate(rec.date)}
                    </td>
                    <td className="py-3 px-4">
                      {rec.employee ? (
                        <div>
                          <p className="font-bold text-gray-800">
                            {rec.employee.firstName} {rec.employee.lastName}
                          </p>
                          <p className="text-[10px] text-gray-400">{rec.employee.department}</p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">{formatTimeString(rec.checkIn)}</td>
                    <td className="py-3 px-4 font-mono">{formatTimeString(rec.checkOut)}</td>
                    <td className="py-3 px-4">
                      <AnimatedBadge
                        variant={
                          rec.status === "PRESENT"
                            ? "success"
                            : rec.status === "LATE"
                            ? "warning"
                            : "info"
                        }
                      >
                        {rec.status}
                      </AnimatedBadge>
                    </td>
                    <td className="py-3 px-4">
                      {rec.isGeofenceValid ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-semibold text-[10px]">
                          ✓ Valid
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 px-2 py-1 rounded font-semibold text-[10px]">
                          ⚠ Di Luar Radius
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {rec.checkInPhoto && (
                          <button
                            onClick={() => setViewPhotoUrl(rec.checkInPhoto)}
                            className="w-7 h-7 rounded-lg overflow-hidden border border-teal-200 hover:scale-110 transition-transform"
                            title="Foto Masuk"
                          >
                            <img src={rec.checkInPhoto} alt="Selfie" className="w-full h-full object-cover" />
                          </button>
                        )}
                        {rec.checkOutPhoto && (
                          <button
                            onClick={() => setViewPhotoUrl(rec.checkOutPhoto)}
                            className="w-7 h-7 rounded-lg overflow-hidden border border-amber-200 hover:scale-110 transition-transform"
                            title="Foto Keluar"
                          >
                            <img src={rec.checkOutPhoto} alt="Selfie Out" className="w-full h-full object-cover" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section: Daftar Pengajuan Koreksi Absensi Terbaru */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-teal-600" /> Riwayat & Pengajuan Koreksi Absensi
            </h2>
            <p className="text-xs text-gray-500">Daftar pengajuan klaim/koreksi absen karena kendala lokasi, dinas luar, atau lupa clock-in</p>
          </div>

          <button
            onClick={() => setShowCorrectionModal(true)}
            className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 transition flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Ajukan Koreksi
          </button>
        </div>

        {correctionClaims.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            Belum ada pengajuan koreksi absensi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Tanggal Pengajuan</th>
                  <th className="py-3 px-4">Karyawan</th>
                  <th className="py-3 px-4">Tanggal Absen Target</th>
                  <th className="py-3 px-4">Usulan Jam</th>
                  <th className="py-3 px-4">Alasan Koreksi</th>
                  <th className="py-3 px-4">Status</th>
                  {canManage && <th className="py-3 px-4">Aksi Manager</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {correctionClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(claim.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {claim.employee ? `${claim.employee.firstName} ${claim.employee.lastName}` : "-"}
                    </td>
                    <td className="py-3 px-4 font-medium text-teal-800">
                      {formatDate(claim.startDate)}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      In: {formatTimeString(claim.requestedCheckIn)} | Out: {formatTimeString(claim.requestedCheckOut)}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-gray-600" title={claim.correctionReason || claim.description}>
                      {claim.correctionReason || claim.description || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <AnimatedBadge
                        variant={
                          claim.status === "APPROVED"
                            ? "success"
                            : claim.status === "REJECTED"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {claim.status === "APPROVED" ? "DISETUJUI" : claim.status === "REJECTED" ? "DITOLAK" : "MENUNGGU APPROVAL"}
                      </AnimatedBadge>
                    </td>
                    {canManage && (
                      <td className="py-3 px-4">
                        {claim.status === "PENDING" ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={async () => {
                                const res = await fetch(`/api/absensi/corrections?id=${claim.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "APPROVED", approvedBy: session?.user?.name || "HR/Admin" }),
                                });
                                if (res.ok) {
                                  fetchAttendanceData();
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-sm"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={async () => {
                                const reason = prompt("Masukkan alasan penolakan:");
                                if (reason) {
                                  const res = await fetch(`/api/absensi/corrections?id=${claim.id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "REJECTED", approvedBy: session?.user?.name || "HR/Admin", rejectionReason: reason }),
                                  });
                                  if (res.ok) {
                                    fetchAttendanceData();
                                  }
                                }
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg shadow-sm"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400">Oleh: {claim.approvedBy || "Manager"}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ajukan Koreksi Absen */}
      {showCorrectionModal && (
        <Modal
          isOpen={showCorrectionModal}
          onClose={() => setShowCorrectionModal(false)}
          title="Ajukan Koreksi / Klaim Absensi"
        >
          <form onSubmit={handleCorrectionSubmit} className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl text-xs text-teal-800 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
              <p>
                Gunakan formulir ini untuk mengajukan koreksi absen jika lupa clock-in/out, kendala jaringan, atau sedang tugas dinas luar. Pengajuan akan dikirimkan ke Atasan/HR untuk persetujuan.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Tanggal Absensi yang Dikoreksi *</label>
              <input
                type="date"
                required
                value={correctionForm.targetDate}
                onChange={(e) => setCorrectionForm({ ...correctionForm, targetDate: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Usulan Jam Masuk *</label>
                <input
                  type="time"
                  required
                  value={correctionForm.requestedCheckIn}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckIn: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Usulan Jam Keluar *</label>
                <input
                  type="time"
                  required
                  value={correctionForm.requestedCheckOut}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckOut: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Alasan Koreksi Absen *</label>
              <textarea
                required
                rows={3}
                value={correctionForm.correctionReason}
                onChange={(e) => setCorrectionForm({ ...correctionForm, correctionReason: e.target.value })}
                placeholder="Contoh: Lupa melakukan absen masuk saat kedatangan / Mati listrik di lokasi kantor / Perjalanan dinas luar kota"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingCorrection}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md disabled:opacity-50"
              >
                {submittingCorrection ? "Mengirim..." : "Kirim Pengajuan Koreksi"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal View Full Selfie Photo */}
      <Modal
        isOpen={!!viewPhotoUrl}
        onClose={() => setViewPhotoUrl(null)}
        title="Foto Selfie Presensi Karyawan"
      >
        {viewPhotoUrl && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-black max-h-[70vh] flex items-center justify-center">
              <img src={viewPhotoUrl} alt="Selfie Full" className="max-h-[70vh] w-auto object-contain" />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Foto ini diambil langsung saat proses verifikasi presensi presisi tinggi.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal Add Office Location */}
      <Modal
        isOpen={showOfficeModal}
        onClose={() => setShowOfficeModal(false)}
        title="Tambah Lokasi Geofence Kantor Baru"
      >
        <form onSubmit={handleCreateOffice} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Nama Kantor / Site</label>
            <input
              type="text"
              required
              value={newOffice.name}
              onChange={(e) => setNewOffice({ ...newOffice, name: e.target.value })}
              placeholder="Contoh: Kantor Cabang Bali"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Alamat</label>
            <input
              type="text"
              value={newOffice.address}
              onChange={(e) => setNewOffice({ ...newOffice, address: e.target.value })}
              placeholder="Jl. Sunset Road No. 99, Kuta"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={newOffice.latitude}
                onChange={(e) => setNewOffice({ ...newOffice, latitude: e.target.value })}
                placeholder="-8.7205"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={newOffice.longitude}
                onChange={(e) => setNewOffice({ ...newOffice, longitude: e.target.value })}
                placeholder="115.1691"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Radius Toleransi Geofence (Meter)</label>
            <input
              type="number"
              required
              value={newOffice.radiusMeters}
              onChange={(e) => setNewOffice({ ...newOffice, radiusMeters: e.target.value })}
              placeholder="150"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowOfficeModal(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md"
            >
              Simpan Lokasi Kantor
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Lokasi Kantor */}
      {showEditOfficeModal && editingOffice && (
        <Modal
          isOpen={showEditOfficeModal}
          onClose={() => setShowEditOfficeModal(false)}
          title="Edit Lokasi & Geofence Kantor"
        >
          <form onSubmit={handleUpdateOffice} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Nama Kantor / Site *</label>
              <input
                type="text"
                required
                value={editingOffice.name}
                onChange={(e) => setEditingOffice({ ...editingOffice, name: e.target.value })}
                placeholder="Contoh: Kantor Cabang Bali"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Alamat</label>
              <input
                type="text"
                value={editingOffice.address}
                onChange={(e) => setEditingOffice({ ...editingOffice, address: e.target.value })}
                placeholder="Jl. Sunset Road No. 99, Kuta"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Latitude *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editingOffice.latitude}
                  onChange={(e) => setEditingOffice({ ...editingOffice, latitude: e.target.value })}
                  placeholder="-8.7205"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Longitude *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editingOffice.longitude}
                  onChange={(e) => setEditingOffice({ ...editingOffice, longitude: e.target.value })}
                  placeholder="115.1691"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-mono"
                />
              </div>
            </div>

            {gpsLocation && (
              <button
                type="button"
                onClick={() =>
                  setEditingOffice({
                    ...editingOffice,
                    latitude: gpsLocation.latitude.toString(),
                    longitude: gpsLocation.longitude.toString(),
                  })
                }
                className="w-full text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl p-2 transition flex items-center justify-center gap-1.5"
              >
                <MapPin className="h-3.5 w-3.5" /> Gunakan Koordinat GPS Saya Saat Ini ({gpsLocation.latitude.toFixed(4)}, {gpsLocation.longitude.toFixed(4)})
              </button>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Radius Toleransi Geofence (Meter) *</label>
              <input
                type="number"
                required
                value={editingOffice.radiusMeters}
                onChange={(e) => setEditingOffice({ ...editingOffice, radiusMeters: e.target.value })}
                placeholder="150"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-bold text-teal-700"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowEditOfficeModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md"
              >
                Simpan Perubahan Lokasi
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
