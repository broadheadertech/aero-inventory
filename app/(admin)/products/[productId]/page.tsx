import { ProductDetailClient } from "@/components/products/product-detail-client";
import type { Id } from "@/convex/_generated/dataModel";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { productId } = await params;
  return <ProductDetailClient productId={productId as Id<"products">} />;
}
