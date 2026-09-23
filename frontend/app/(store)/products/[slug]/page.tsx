import { notFound } from "next/navigation";
import { getProductBySlug } from "@/app/lib/api";
import ProductDetailClient from "@/app/(store)/products/[slug]/ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
