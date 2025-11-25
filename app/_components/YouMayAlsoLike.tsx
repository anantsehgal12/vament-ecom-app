import React from 'react';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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

interface YouMayAlsoLikeProps {
  products: any[];
}

const YouMayAlsoLike: React.FC<YouMayAlsoLikeProps> = ({ products }) => {
  return (
    <div className="px-4 md:px-8 lg:px-15 py-6 md:py-10 w-full">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-2xl md:text-3xl font-bold">You may also like</h1>
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
                  className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <div className="p-1">
                    <Link href={`/shop/${product.id}`}>
                      <div className=" rounded-lg shadow-md p-3 md:p-4 h-full cursor-pointer">
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
                            View
                          </Button>
                        </div>
                      </div>
                    </Link>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default YouMayAlsoLike;