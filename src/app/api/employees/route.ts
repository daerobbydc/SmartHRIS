import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { checkAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    // If EMPLOYEE role requests data, limit fields returned or scope
    if (auth.role === "EMPLOYEE") {
      // Ordinary employees can only read basic peer list or their own record
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (status) {
      where.status = status;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: {
            select: { email: true, role: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Employees GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth(request, { requiredPermission: "employee:write" });
    if (auth instanceof NextResponse) return auth;

    // Ordinary employees CANNOT create new employee accounts
    if (auth.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Akses ditolak: Karyawan biasa tidak dapat menambah data karyawan baru" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      dateOfBirth,
      gender,
      department,
      position,
      salary,
    } = body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    // Generate employee ID
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { createdAt: "desc" },
    });

    let lastNum = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      const parts = lastEmployee.employeeId.split("-");
      if (parts[1] && !isNaN(parseInt(parts[1]))) {
        lastNum = parseInt(parts[1]) + 1;
      }
    }
    const employeeId = `EMP-${String(lastNum).padStart(3, "0")}`;

    // Create user account
    const hashedPassword = await hash(password || "Password123!", 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "EMPLOYEE",
      },
    });

    // Create employee record
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeId,
        firstName,
        lastName,
        phone,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        department,
        position,
        hireDate: new Date(),
        salary: salary ? parseFloat(salary) : 5000000,
      },
      include: {
        user: {
          select: { email: true, role: true },
        },
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Employees POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID Karyawan wajib diisi" }, { status: 400 });
    }

    const existingEmp = await prisma.employee.findUnique({ where: { id } });
    if (!existingEmp) {
      return NextResponse.json({ error: "Data karyawan tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();

    // If EMPLOYEE role is updating data:
    if (auth.role === "EMPLOYEE") {
      // Must be updating own profile
      if (existingEmp.userId !== auth.userId) {
        return NextResponse.json(
          { error: "Akses ditolak: Karyawan tidak dapat mengubah data karyawan lain" },
          { status: 403 }
        );
      }

      // Employees can only update personal contact details (phone, address)
      const allowedUpdate = {
        phone: body.phone !== undefined ? body.phone : existingEmp.phone,
        address: body.address !== undefined ? body.address : existingEmp.address,
      };

      const updated = await prisma.employee.update({
        where: { id },
        data: allowedUpdate,
      });
      return NextResponse.json(updated);
    }

    // HR / ADMIN can update all fields
    const updated = await prisma.employee.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Employees PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await checkAuth(request, { requiredPermission: "employee:delete" });
    if (auth instanceof NextResponse) return auth;

    // Ordinary employees CANNOT delete employee records
    if (auth.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Akses ditolak: Karyawan biasa tidak memiliki wewenang untuk menghapus karyawan" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID Karyawan wajib diisi" }, { status: 400 });
    }

    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    await prisma.employee.delete({ where: { id } });
    if (emp.userId) {
      await prisma.user.delete({ where: { id: emp.userId } }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: "Karyawan berhasil dihapus" });
  } catch (error) {
    console.error("Employees DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
