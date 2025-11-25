'use client'

import Link from 'next/link'
import Navbar from '../_components/Navbar'
import SearchBar from '../_components/SearchBar'
import { useEffect, useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

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
  const [searchTerm, setSearchTerm] = useState('')
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
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 lg:max-w-7xl lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold text-center tracking-tight text-white">Products</h2>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            <div className="text-center text-white">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 lg:max-w-7xl lg:px-8">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <h1 className="text-2xl md:text-3xl font-bold text-center tracking-tight text-white">Products</h1>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 xl:gap-x-8">
          {products
            .filter((product) => product.stock > 0)
            .filter(
              (product) =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((product) => {
              const productImage =
                product.images && Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : null
              const variantImage =
                !productImage &&
                product.variants &&
                product.variants.length > 0 &&
                product.variants[0].images &&
                product.variants[0].images.length > 0
                  ? product.variants[0].images[0]
                  : null
              const image = productImage || variantImage

              return (
                <div
                  key={product.id}
                  className="rounded-lg shadow-md p-3 md:p-4 h-full cursor-pointer"
                >
                  <Link href={`/shop/${product.id}`}>
                    <div>
                      {image && (
                        <div className="w-full h-50 md:h-50 lg:h-50 mb-3 md:mb-4 rounded-lg overflow-hidden">
                          <img
                            alt={image.alt || product.name}
                            src={image.src}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <h3 className="text-sm md:text-base lg:text-lg font-semibold mb-2 text-white">
                        {product.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 mb-2">
                        {product.description.length > 100
                          ? `${product.description.substring(0, 100)}...`
                          : product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg md:text-xl font-bold text-white">
                          ₹{Math.round(parseFloat(product.price) * (1 + product.taxRate / 100))}
                        </span>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm md:text-base px-3 py-1 rounded">
                          View
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
        </div>
      </div>
    </main>
  )
}
