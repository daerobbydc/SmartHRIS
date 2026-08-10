import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { processChatMessage, getChatSuggestions, getQuickActions } from "@/lib/chatbot";

export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const suggestions = await getChatSuggestions(auth.userId);
    const quickActions = await getQuickActions(auth.role);

    return NextResponse.json({ suggestions, quickActions });
  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json({ error: "Gagal mengambil data chatbot" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { message } = body;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const response = await processChatMessage(message, auth.userId);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json({ error: "Gagal memproses pesan" }, { status: 500 });
  }
}
