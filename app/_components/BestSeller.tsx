"use client";

import React, { useEffect, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import "@/app/globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  price: string;
  taxRate: number;
  description: string;
  images: { src: string; alt: string }[];
  category: { name: string };
  variants?: {
    id: number;
    name: string;
    images: { src: string; alt: string }[];
  }[];
}

function BestSeller() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          console.error("Failed to fetch products:", response.status);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="px-15 py-10 w-full">
        <div className="flex flex-col justify-center items-center">
          <h1 className="text-3xl font-bold">Our BestSellers</h1>
          <div className="mt-8">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-15 py-6 md:py-10 w-full">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Our BestSellers</h1>
        <div className="w-full max-w-6xl mt-6 md:mt-8">
          <Carousel
            opts={{
              align: "start",
            }}
            className="w-full"
          >
            <CarouselContent>
              {products.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <div className="p-1">
                    <div className=" rounded-lg shadow-md p-3 md:p-4 h-full">
                      {(product.images.length > 0 ||
                        (product.variants &&
                          product.variants.length > 0 &&
                          product.variants[0].images.length > 0)) && (
                        <div className="w-full h-32 md:h-40 lg:h-48 mb-3 md:mb-4">
                          <img
                            src={
                              product.images.length > 0
                                ? product.images[0].src
                                : product.variants![0].images[0].src
                            }
                            alt={
                              product.images.length > 0
                                ? product.images[0].alt
                                : product.variants![0].images[0].alt
                            }
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <h3 className="text-sm md:text-base lg:text-lg font-semibold mb-2">
                        {product.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 mb-2">
                        {product.description.length > 100
                          ? `${product.description.substring(0, 100)}...`
                          : product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg md:text-xl font-bold">
                          ₹{Math.round(parseFloat(product.price) * (1 + product.taxRate / 100))}
                        </span>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm md:text-base">
                          <Link
                            href={`/shop/${product.id}`}
                          >
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <div className="text-center flex items-center justify-center w-full gap-2 mt-6 md:mt-10">
          <span className="text-sm md:text-lg font-bold">and View More <Link href="/shop" className="underline">Here</Link></span>
        </div>
      </div>
    </div>
  );
}

export default BestSeller;
