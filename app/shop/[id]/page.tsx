import { StarIcon } from '@heroicons/react/20/solid'
import { notFound } from 'next/navigation'
import { PrismaClient } from '@/lib/generated/prisma'
import Navbar from '@/app/_components/Navbar'
import AddToCartForm from '@/app/_components/AddToCartForm'

const reviews = { href: '#', average: 4 }


function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter((c): c is string => Boolean(c)).join(' ')
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params

  const product = await getProduct(productId)

  if (!product) {
    return { title: 'Product not found | VAM Enterprises' }
  }

  return {
    title: `${product.name} | VAM Enterprises`,
  }
}

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

async function getProduct(id: string): Promise<Product | null> {
  try {
    const prisma = new PrismaClient()
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        variants: {
          include: {
            images: true,
          },
        },
      },
    })

    if (!product) return null

    return product as unknown as Product
  } catch (error) {
    console.error('Error fetching product from DB:', error)
    return null
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params

  const product = await getProduct(productId)

  if (!product || product.stock === 0) {
    notFound()
  }

  // Use images from product or variants
  const images = product.images && product.images.length > 0
    ? product.images
    : product.variants && product.variants.length > 0 && product.variants[0].images
    ? product.variants[0].images
    : []

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "offers": {
      "@type": "Offer",
      "price": product.price.replace(/[^\d.]/g, ''), // Extract numeric price
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "category": product.category.name,
    "image": images.length > 0 ? images.map(img => img.src) : []
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <Navbar />
      <div className="pt-6">
        <nav aria-label="Breadcrumb">
          <ol role="list" className="mx-auto flex max-w-2xl items-center space-x-2 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <li>
              <div className="flex items-center">
                <a href="/" className="mr-2 text-sm font-medium text-white">
                  Home
                </a>
                <svg
                  fill="currentColor"
                  width={16}
                  height={20}
                  viewBox="0 0 16 20"
                  aria-hidden="true"
                  className="h-5 w-4 text-gray-300"
                >
                  <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                </svg>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <a href={`/shop?category=${product.category.id}`} className="mr-2 text-sm font-medium text-white">
                  {product.category.name}
                </a>
                <svg
                  fill="currentColor"
                  width={16}
                  height={20}
                  viewBox="0 0 16 20"
                  aria-hidden="true"
                  className="h-5 w-4 text-gray-300"
                >
                  <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                </svg>
              </div>
            </li>
            <li className="text-sm">
              <span aria-current="page" className="font-medium text-white">
                {product.name}
              </span>
            </li>
          </ol>
        </nav>

  {/* Main layout: gallery left, sticky buy panel right */}
  <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-12 lg:gap-x-20 lg:pr-[30rem]">
          {/* Left: Gallery (col-span 7) */}
          <div className="lg:col-span-7">
            <div className="w-full">
              {/* Main image */}
              <div className="aspect-w-4 aspect-h-5 w-full overflow-hidden rounded-lg bg-gray-800">
                {images[0] ? (
                  <img
                    src={images[0].src}
                    alt={images[0].alt ?? product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">No image</div>
                )}
              </div>

              {/* Thumbnails */}
              <div className="mt-4 grid grid-cols-4 gap-4">
                {images.slice(0, 8).map((img) => (
                  <button key={img.id} className="overflow-hidden rounded-md bg-gray-700 hover:ring-2 focus:outline-none">
                    <img src={img.src} alt={img.alt ?? product.name} className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Details + fixed add to cart (col-span 5) */}
          <div className="lg:top-24 lg:w-[42rem] lg:right-8 lg:max-h-[100vh] lg:overflow-auto">
            {/* Keep column space; whole right column fixed on large screens */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white md:text-3xl">{product.name}</h1>

                <p className="mt-4 text-2xl md:text-3xl tracking-tight text-gray-200">
                  ₹{(parseFloat(product.price) + (parseFloat(product.price) * product.taxRate / 100)).toFixed(2)}
                </p>

                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.stock > 10 ? 'bg-green-100 text-green-800' :
                    product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.stock > 10 ? 'In Stock' :
                     product.stock > 0 ? 'Low Stock' :
                     'Out of Stock'}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="text-base text-gray-200">{product.description}</p>
                </div>

                <AddToCartForm productId={product.id} variants={product.variants ?? []} />


              </div>
            </div>
          </div>
        </div>
      </div>

  )
}