import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Chatbot } from "@/components/chatbot";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-[240px] border-l border-gray-200/60">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
        <Chatbot />
      </div>
    </SessionProvider>
  );
}
