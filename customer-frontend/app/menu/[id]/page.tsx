import { menuApi, reviewApi } from "@/lib/api";
import ItemDetailClient from "./ItemDetailClient";
import { MenuItem, Review } from "@/lib/types";

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const itemId = params.id;
  const token = searchParams.token || "";

  let item: MenuItem | null = null;
  let relatedItems: MenuItem[] = [];
  let initialReviews: Review[] = [];
  let averageRating = 0;
  let totalReviews = 0;

  if (token && itemId) {
    try {
      // 1. Fetch the main item
      const itemData = await menuApi.getMenuItem(itemId, token);
      if (itemData) {
        item = itemData;

        // 2. Fetch related data in parallel
        const [reviewsData, ratingData, menuData] = await Promise.allSettled([
          reviewApi.getItemReviews(itemId, item.restaurantId, { limit: 5 }),
          reviewApi.getAverageRating(itemId, item.restaurantId),
          menuApi.getMenu(token, { categoryId: item.categoryId, limit: 10 }) // Fetch items in same category
        ]);

        if (reviewsData.status === "fulfilled") {
          const res = reviewsData.value as any;
          initialReviews = res.reviews || [];
        }

        if (ratingData.status === "fulfilled") {
          const res = ratingData.value as any;
          averageRating = res.averageRating || 0;
          totalReviews = res.totalReviews || 0;
        }

        if (menuData.status === "fulfilled") {
          const res = menuData.value as any;
          // The getMenu response now has a flat structure: { items: MenuItem[], categories: MenuCategory[] }
          if (res.success && res.menu && res.menu.items) {
            relatedItems = res.menu.items
              .filter((i: any) => i.id !== itemId)
              .slice(0, 6);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching item detail on server:", err);
    }
  }

  return (
    <ItemDetailClient
      itemId={itemId}
      initialItem={item}
      initialRelatedItems={relatedItems}
      initialReviews={initialReviews}
      initialAverageRating={averageRating}
      initialTotalReviews={totalReviews}
      initialToken={token}
    />
  );
}
