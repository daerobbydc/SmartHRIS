import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { getArticles, searchArticles, getPopularArticles, getKBCategories } from "@/lib/knowledge-base";

// GET - Get knowledge base articles
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const popular = searchParams.get("popular") === "true";

  try {
    if (popular) {
      const articles = await getPopularArticles(5);
      return NextResponse.json({ articles });
    }

    if (search) {
      const articles = await searchArticles(search);
      return NextResponse.json({ articles });
    }

    const [articles, categories] = await Promise.all([
      getArticles(category || undefined),
      getKBCategories(),
    ]);

    return NextResponse.json({ articles, categories });
  } catch (error) {
    console.error("KB error:", error);
    return NextResponse.json({ error: "Gagal mengambil data knowledge base" }, { status: 500 });
  }
}
