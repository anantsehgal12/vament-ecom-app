'use client'

import { useState, useEffect } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/app/_components/App-sidebar'
import Header from '@/app/_components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Minus, Search, Package } from 'lucide-react'
import { isAdmin } from "@/app/extras/isAdmis"
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation"
import Navbar from '@/app/_components/Navbar'

interface Product {
  id: string
  name: string
  price: string
  taxRate: number
  description: string
  stock: number
  category: { id: string; name: string }
  variants: { name?: string; images: { src: string; alt: string }[] }[]
}

export default function InventoryPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newStock, setNewStock] = useState('')
  const [stockInOpen, setStockInOpen] = useState(false)
  const [stockOutOpen, setStockOutOpen] = useState(false)
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

  const handleUpdateStock = async (productId: string, stock: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock }),
      })
      if (!response.ok) {
        throw new Error('Failed to update stock')
      }
      setProducts(products.map(product =>
        product.id === productId ? { ...product, stock } : product
      ))
      setEditingProduct(null)
      setNewStock('')
      setStockInOpen(false)
      setStockOutOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const openStockInDialog = (product: Product) => {
    setEditingProduct(product)
    setNewStock('')
    setStockInOpen(true)
  }

  const openStockOutDialog = (product: Product) => {
    setEditingProduct(product)
    setNewStock('')
    setStockOutOpen(true)
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
            <div className="text-center">Loading inventory...</div>
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
          <div className="flex gap-5 items-center mb-12">
            <Package/>
            <h1 className="text-3xl font-bold">Inventory</h1>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search inventory by name, description, or category..."
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
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const price = parseFloat(product.price);
                      const isOutOfStock = product.stock === 0;
                      const isLowStock = product.stock > 0 && product.stock < 10;

                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-green-600 font-bold">₹{price.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-gray-600">{product.category.name}</TableCell>
                          <TableCell className={`font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'}`}>
                            {product.stock}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isOutOfStock ? 'bg-red-100 text-red-800' :
                              isLowStock ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog open={stockInOpen} onOpenChange={setStockInOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openStockInDialog(product)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Stock In
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Stock In for {editingProduct?.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="stock" className="text-right">
                                        Add Stock
                                      </Label>
                                      <Input
                                        id="stock"
                                        type="number"
                                        value={newStock}
                                        onChange={(e) => setNewStock(e.target.value)}
                                        className="col-span-3"
                                        min="0"
                                        placeholder="Enter quantity to add"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingProduct(null)
                                        setStockInOpen(false)
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => handleUpdateStock(editingProduct!.id, editingProduct!.stock + (parseInt(newStock) || 0))}
                                    >
                                      Add Stock
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Dialog open={stockOutOpen} onOpenChange={setStockOutOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openStockOutDialog(product)}
                                  >
                                    <Minus className="h-4 w-4 mr-1" />
                                    Stock Out
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Stock Out for {editingProduct?.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="stock" className="text-right">
                                        Remove Stock
                                      </Label>
                                      <Input
                                        id="stock"
                                        type="number"
                                        value={newStock}
                                        onChange={(e) => setNewStock(e.target.value)}
                                        className="col-span-3"
                                        min="0"
                                        max={editingProduct?.stock || 0}
                                        placeholder="Enter quantity to remove"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingProduct(null)
                                        setStockOutOpen(false)
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => handleUpdateStock(editingProduct!.id, editingProduct!.stock - (parseInt(newStock) || 0))}
                                    >
                                      Remove Stock
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
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
                  const isOutOfStock = product.stock === 0;
                  const isLowStock = product.stock > 0 && product.stock < 10;

                  // Get the first image from variants or product images
                  const productImage = product.variants && product.variants.length > 0 && product.variants[0].images && product.variants[0].images.length > 0
                    ? product.variants[0].images[0]
                    : null;

                  return (
                    <Card key={product.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="p-0">
                        {productImage && (
                          <div className="w-full aspect-square overflow-hidden rounded-t-lg p-4">
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
                            <span className="text-sm text-gray-500">Stock:</span>
                            <span className={`font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'}`}>
                              {product.stock}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isOutOfStock ? 'bg-red-100 text-red-800' :
                              isLowStock ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {product.category.name}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={stockInOpen} onOpenChange={setStockInOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openStockInDialog(product)}
                                className="flex-1"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Stock In
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Stock In for {editingProduct?.name}</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="stock" className="text-right">
                                    Add Stock
                                  </Label>
                                  <Input
                                    id="stock"
                                    type="number"
                                    value={newStock}
                                    onChange={(e) => setNewStock(e.target.value)}
                                    className="col-span-3"
                                    min="0"
                                    placeholder="Enter quantity to add"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingProduct(null)
                                    setStockInOpen(false)
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleUpdateStock(editingProduct!.id, editingProduct!.stock + (parseInt(newStock) || 0))}
                                >
                                  Add Stock
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={stockOutOpen} onOpenChange={setStockOutOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openStockOutDialog(product)}
                                className="flex-1"
                              >
                                <Minus className="h-4 w-4 mr-1" />
                                Stock Out
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Stock Out for {editingProduct?.name}</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="stock" className="text-right">
                                    Remove Stock
                                  </Label>
                                  <Input
                                    id="stock"
                                    type="number"
                                    value={newStock}
                                    onChange={(e) => setNewStock(e.target.value)}
                                    className="col-span-3"
                                    min="0"
                                    max={editingProduct?.stock || 0}
                                    placeholder="Enter quantity to remove"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingProduct(null)
                                    setStockOutOpen(false)
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleUpdateStock(editingProduct!.id, editingProduct!.stock - (parseInt(newStock) || 0))}
                                >
                                  Remove Stock
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
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
