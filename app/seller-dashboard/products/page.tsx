'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/app/_components/App-sidebar'
import Header from '@/app/_components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Edit, Trash2, Plus, Search, Inbox, ExternalLink } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { isAdmin } from "@/app/extras/isAdmis"
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation"
import Navbar from '@/app/_components/Navbar'
import Link from 'next/link'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  price: string
  taxRate: number
  description: string
  isLive: boolean
  category: { id: string; name: string }
  variants: { name?: string; images: { src: string; alt: string }[] }[]
}

export default function ProductsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?all=true')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete product')
      }
      setProducts(products.filter(product => product.id !== productId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleEdit = (productId: string) => {
    router.push(`/seller-dashboard/edit-product/${productId}`)
  }

  const handleToggleLive = async (productId: string, newIsLive: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isLive: newIsLive }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error === 'Cannot set product to live when stock is 0') {
          const product = products.find(p => p.id === productId)
          if (product) {
            toast.error(`Due to zero stock, the product "${product.name}" cannot be set to live.`)
          }
        } else {
          throw new Error(errorData.error || 'Failed to update product live status')
        }
        return
      }

      const updatedProduct = await response.json()
      setProducts(products.map(product =>
        product.id === productId ? updatedProduct : product
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isLoaded || !isSignedIn) {
    return (
        <main className="w-full">
          <Navbar/>
          <div className="p-6 mt-30">
            <div className="text-center">Please sign in with the admin account to access the Seller Dashboard.</div>
          </div>
        </main>
    )
  }

  if (!isAdmin(user)) {
    notFound()
  }

  if (loading && isAdmin(user)) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <Header />
          <div className="p-6">
            <div className="text-center">Loading products...</div>
          </div>
        </main>
      </SidebarProvider>
    )
  }

  if (isLoaded && isAdmin(user))
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <Header />
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="flex justify-between items-center mb-12">
            <div className="flex gap-5 items-center">
              <Inbox/>
              <h1 className="text-3xl font-bold">Products</h1>
            </div>
            <Button asChild>
              <Link href="/seller-dashboard/add-product">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">No products found.</p>
                  <Button onClick={() => router.push('/seller-dashboard/add-product')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total Price</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Live</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const price = parseFloat(product.price);
                      const taxAmount = price * (product.taxRate / 100);
                      const totalPrice = price + taxAmount;

                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name.length > 10 ? `${product.name.substring(0, 10)}....` : product.name}</TableCell>
                          <TableCell className="text-green-600 font-bold">₹{Math.round(price)}</TableCell>
                          <TableCell className="text-green-600 font-bold">₹{Math.round(totalPrice)}</TableCell>
                          <TableCell className="text-sm text-gray-600">{product.description.length > 10 ? `${product.description.substring(0, 10)}....` : product.description}</TableCell>
                          <TableCell className="text-sm text-gray-600">{product.category.name}</TableCell>
                          <TableCell>
                            <Switch
                              checked={product.isLive}
                              onCheckedChange={(checked) => handleToggleLive(product.id, checked)}
                              aria-label={`Toggle ${product.name} live status`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/shop/${product.id}`}>
                                  <ExternalLink />
                                  View
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(product.id)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the product "{product.name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-red-600 hover:bg-red-700">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden grid grid-cols-1 gap-4">
              {filteredProducts.map((product) => {
                const price = parseFloat(product.price);
                const taxAmount = price * (product.taxRate / 100);
                const totalPrice = price + taxAmount;

                // Get the first image from variants or product images
                const productImage = product.variants && product.variants.length > 0 && product.variants[0].images && product.variants[0].images.length > 0
                  ? product.variants[0].images[0]
                  : null;

                return (
                  <Card key={product.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="p-0">
                      {productImage && (
                        <div className="w-full aspect-square overflow-hidden rounded-t-lg p-6">
                          <img
                            src={productImage.src}
                            alt={productImage.alt || product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 rounded-md"
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</CardTitle>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{product.description}</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Price:</span>
                          <span className="text-green-600 font-bold">₹{price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Total:</span>
                          <span className="text-green-600 font-bold">₹{totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.category.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Live:</span>
                          <Switch
                            checked={product.isLive}
                            onCheckedChange={(checked) => handleToggleLive(product.id, checked)}
                            aria-label={`Toggle ${product.name} live status`}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs text-gray-500">Live:</span>
                          <Switch
                            checked={product.isLive}
                            onCheckedChange={(checked) => handleToggleLive(product.id, checked)}
                            aria-label={`Toggle ${product.name} live status`}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product.id)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 flex-1">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the product "{product.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-red-600 hover:bg-red-700">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            </>
          )}
        </div>
      </main>
    </SidebarProvider>
  )
}
