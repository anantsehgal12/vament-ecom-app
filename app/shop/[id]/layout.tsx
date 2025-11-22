import { Metadata } from "next";
import { Children } from "react";
import { getProductById } from "@/lib/data/products";

interface Product {
  id: string;
  name: string;
  price: string;
  mrp: number | null;
  taxRate: number;
  description: string;
  stock: number;
  category: { id:string; name: string };
  variants: {
    id: number;
    name: string | null;
    images: { id: number; src: string; alt: string }[];
  }[];
  images: { id: number; src: string; alt: string }[];
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const productId = params.id;
  const product = await getProductById(productId);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for does not exist.",
    };
  }

  return {
    title: `${product.name} - VAM Enterprises`,
    description: product.description,
    keywords: [product.name, product.category.name, "VAM Enterprises", "premium gifts", "luxury gifts"],
  };
}
export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}