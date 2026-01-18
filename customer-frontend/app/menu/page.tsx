import { Suspense } from "react";
import { menuApi } from "@/lib/api";
import MenuClient from "./MenuClient";

// This is a Server Component by default
export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const token = (resolvedParams.token as string) || null;
  const q = (resolvedParams.q as string) || undefined;
  const categoryId = (resolvedParams.categoryId as string) || undefined;
  const sort = (resolvedParams.sort as string) || "name";
  const chef = resolvedParams.chef === "true";

  let initialData = null;

  if (token) {
    try {
      // Fetch initial data on the server for faster LCP
      initialData = await menuApi.getMenu(token, {
        q,
        categoryId,
        sort,
        chefRecommended: chef || undefined,
        page: 1,
        limit: 10,
      });
    } catch (error) {
      console.error("Error fetching menu on server:", error);
    }
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin" />
        </div>
      }
    >
      <MenuClient initialData={initialData} initialToken={token} />
    </Suspense>
  );
}
