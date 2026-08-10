import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import {
  getEmployeeLeaveBalances,
  initializeLeaveBalance,
  getLeavePolicy,
  getAllLeavePolicies,
  processYearEndCarryOver,
} from "@/lib/leave-balance";
import { prisma } from "@/lib/prisma";

const p = prisma as any;

// GET - Get leave balances
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const action = searchParams.get("action") || "balances";

  try {
    if (action === "policies") {
      const policies = await getAllLeavePolicies();
      return NextResponse.json({ policies });
    }

    if (action === "carry-over") {
      // Only HR / Admin can trigger carry-over
      if (auth.role === "EMPLOYEE") {
        return NextResponse.json(
          { error: "Akses ditolak: Karyawan tidak dapat memproses carry-over saldo cuti" },
          { status: 403 }
        );
      }
      const processed = await processYearEndCarryOver(year);
      return NextResponse.json({ processed, message: `${processed} balances processed` });
    }

    if (action === "summary") {
      // Employees can only see their own balance summary
      const employees = await p.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
      });

      const allBalances = [];
      for (const emp of employees) {
        const balances = await getEmployeeLeaveBalances(emp.id, year);
        for (const b of balances) {
          allBalances.push({
            id: `${emp.id}-${b.leaveType}-${b.year}`,
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            leaveType: b.leaveType,
            year: b.year || year,
            entitled: b.total || 0,
            used: b.used || 0,
            pending: b.pending || 0,
            carriedOver: b.carried || 0,
            remaining: b.available || 0,
          });
        }
      }

      return NextResponse.json(allBalances);
    }

    if (!employeeId) {
      const employees = await p.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
      });

      const allBalances = [];
      for (const emp of employees) {
        const balances = await getEmployeeLeaveBalances(emp.id, year);
        allBalances.push({
          employee: { id: emp.id, name: `${emp.firstName} ${emp.lastName}` },
          balances,
        });
      }

      return NextResponse.json({ data: allBalances, year });
    }

    const balances = await getEmployeeLeaveBalances(employeeId, year);
    return NextResponse.json({ balances, year });
  } catch (error) {
    console.error("Leave balance error:", error);
    return NextResponse.json({ error: "Gagal mengambil data leave balance" }, { status: 500 });
  }
}

// POST - Initialize leave balance or create policy
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Ordinary employees CANNOT initialize balances or create leave policies
  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat melakukan inisialisasi saldo atau membuat kebijakan cuti" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "initialize") {
      const { employeeId, year } = body;
      await initializeLeaveBalance(employeeId, year || new Date().getFullYear());
      return NextResponse.json({ success: true, message: "Leave balance initialized" });
    }

    if (action === "initialize-all") {
      const { year } = body;
      const employees = await p.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });

      for (const emp of employees) {
        await initializeLeaveBalance(emp.id, year || new Date().getFullYear());
      }

      return NextResponse.json({ success: true, message: `${employees.length} karyawan berhasil diinisialisasi saldo cutinya` });
    }

    if (action === "policy" || action === "create-policy") {
      const policy = await p.leavePolicy.create({
        data: {
          name: body.name,
          leaveType: body.leaveType,
          daysPerYear: body.daysPerYear,
          minTenureMonths: body.minServiceMonths || body.minTenureMonths || 0,
          carryOver: (body.maxCarryOver || 0) > 0,
          maxCarryOver: body.maxCarryOver || 0,
          isPaid: body.isPaid ?? true,
          description: body.description,
        },
      });
      return NextResponse.json(policy);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Leave balance POST error:", error);
    return NextResponse.json({ error: "Gagal memproses" }, { status: 500 });
  }
}

// PUT - Update policy (HR/Admin only)
export async function PUT(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat mengubah kebijakan cuti" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    const policy = await p.leavePolicy.update({
      where: { id },
      data,
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Update policy error:", error);
    return NextResponse.json({ error: "Gagal update kebijakan cuti" }, { status: 500 });
  }
}

// DELETE - Delete policy (HR/Admin only)
export async function DELETE(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat menghapus kebijakan cuti" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID kebijakan wajib diisi" }, { status: 400 });
    }

    await p.leavePolicy.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete policy error:", error);
    return NextResponse.json({ error: "Gagal menghapus kebijakan cuti" }, { status: 500 });
  }
}
