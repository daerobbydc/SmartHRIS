import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const emailInput = String(credentials.email).trim().toLowerCase();
        const passInput = String(credentials.password);

        try {
          let user = await prisma.user.findUnique({
            where: { email: emailInput },
            include: { employee: true },
          });

          // Auto-provision demo accounts on production Vercel DB if user doesn't exist
          if (!user) {
            if (emailInput === "admin@smarthris.com" && passInput === "admin123") {
              const hashedPassword = await hash("admin123", 10);
              user = await prisma.user.upsert({
                where: { email: "admin@smarthris.com" },
                update: {},
                create: {
                  email: "admin@smarthris.com",
                  password: hashedPassword,
                  role: "ADMIN",
                  employee: {
                    create: {
                      employeeId: "EMP-001",
                      firstName: "System",
                      lastName: "Admin",
                      department: "Human Resources",
                      position: "HR Manager",
                      hireDate: new Date("2020-01-01"),
                      salary: 15000000,
                    },
                  },
                },
                include: { employee: true },
              });
            } else if (emailInput === "hr@smarthris.com" && passInput === "hr123") {
              const hashedPassword = await hash("hr123", 10);
              user = await prisma.user.upsert({
                where: { email: "hr@smarthris.com" },
                update: {},
                create: {
                  email: "hr@smarthris.com",
                  password: hashedPassword,
                  role: "HR",
                  employee: {
                    create: {
                      employeeId: "EMP-002",
                      firstName: "Jane",
                      lastName: "Smith",
                      department: "Human Resources",
                      position: "HR Staff",
                      hireDate: new Date("2021-06-15"),
                      salary: 10000000,
                    },
                  },
                },
                include: { employee: true },
              });
            } else if (emailInput === "employee@smarthris.com" && passInput === "employee123") {
              const hashedPassword = await hash("employee123", 10);
              user = await prisma.user.upsert({
                where: { email: "employee@smarthris.com" },
                update: {},
                create: {
                  email: "employee@smarthris.com",
                  password: hashedPassword,
                  role: "EMPLOYEE",
                  employee: {
                    create: {
                      employeeId: "EMP-003",
                      firstName: "John",
                      lastName: "Doe",
                      department: "Engineering",
                      position: "Software Developer",
                      hireDate: new Date("2022-03-01"),
                      salary: 12000000,
                    },
                  },
                },
                include: { employee: true },
              });
            }
          }

          if (!user) {
            return null;
          }

          const isPasswordValid = await compare(passInput, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.employee
              ? `${user.employee.firstName} ${user.employee.lastName}`
              : user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? "EMPLOYEE";
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url }) {
      if (url.startsWith("/")) return url;
      try {
        const parsed = new URL(url);
        return parsed.pathname;
      } catch {
        return "/dashboard";
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "smarthris-super-secret-key-change-in-production-2024",
  trustHost: true,
});
