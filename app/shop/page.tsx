'use client'

import Link from 'next/link'
import Navbar from '../_components/Navbar'
import { useEffect, useState } from 'react'
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Shop All Products - VAM Enterprises",
  description: "Explore the full range of exclusive and premium gifts from VAM Enterprises. From corporate gifting to personal presents, find the perfect item for any occasion.",
  keywords: "shop, all products, VAM Enterprises, premium gifts, luxury gifts, corporate gifts, gifting solution",
};

interface Product {
  id: string
  name: string
  price: string
  taxRate: number
  description: string
  stock: number
  category: { id: string; name: string }
  variants: {
    id: number
    name: string | null
    images: { id: number; src: string; alt: string }[]
  }[]
  images: { id: number; src: string; alt: string }[]
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getProducts() {
      try {
        const res = await fetch('/api/products', {
          cache: 'no-store',
        })
        if (!res.ok) {
          setProducts([])
        } else {
          const data = await res.json()
          setProducts(data)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    getProducts()
  }, [])

  if (loading) {
    return (
        <div>
          <Navbar/>
          <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 lg:max-w-7xl lg:px-8">
            <h2 className="text-xl md:text-2xl font-bold text-center tracking-tight text-white">Products</h2>
            <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6">
              <div className="text-center text-white">Loading...</div>
            </div>
          </div>
        </div>

    )
  }

  return (
    <main>
        <Navbar/>
        <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-center tracking-tight text-white">Products</h2>

        <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6">
          {products.filter(product => product.stock > 0).map((product) => (
            <div key={product.id} className="group relative">
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 h-48 md:h-64 lg:h-80">
                {(() => {
                  const productImage = product.images && Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
                  const variantImage = !productImage && product.variants && product.variants.length > 0 && product.variants[0].images && product.variants[0].images.length > 0 ? product.variants[0].images[0] : null;
                  const image = productImage || variantImage;
                  return image ? (
                    <img
                      alt={image.alt || product.name}
                      src={image.src}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : null;
                })()}
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm md:text-base text-white">
                    <Link href={`/shop/${product.id}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-gray-500">{product.description.slice(0, 50)}...</p>
                </div>
                <p className="text-sm md:text-base font-medium text-white">₹{Math.round(parseFloat(product.price) + (parseFloat(product.price) * product.taxRate / 100)).toString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </main>
  )
}