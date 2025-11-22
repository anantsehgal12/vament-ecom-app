'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/_components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: string;
    mrp?: string;
    taxRate: number;
    category: { name: string };
    variants: {
      id: number;
      name: string | null;
      images: { src: string; alt: string }[];
    }[];
  };
  variant?: {
    id: number;
    name: string | null;
    images: { src: string; alt: string }[];
  };
        
}

interface Cart {
  id: string;
  items: CartItem[];
}

export default function CartPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    if (user) {
      fetchCart();
    }
  }, [user, isLoaded, router]);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const cartData = await response.json();
        setCart(cartData);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart
      }
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const calculateTotal = () => {
    if (!cart?.items) return 0;

    return cart.items.reduce((total: number, item: CartItem) => {
      const price = parseFloat(item.product.price.replace(/[^\\d.]/g, ''));
      const taxAmount = price * (item.product.taxRate / 100);
      const finalPrice = price + taxAmount;
      return total + (finalPrice * item.quantity);
    }, 0);
  };

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;

    return cart.items.reduce((total: number, item: CartItem) => {
      const price = parseFloat(item.product.price.replace(/[^\\d.]/g, ''));
      return total + (price * item.quantity);
    }, 0);
  };

  const calculateTaxTotal = () => {
    if (!cart?.items) return 0;

    return cart.items.reduce((total: number, item: CartItem) => {
      const price = parseFloat(item.product.price.replace(/[^\\d.]/g, ''));
      const taxAmount = price * (item.product.taxRate / 100);
      return total + (taxAmount * item.quantity);
    }, 0);
  };

  const getItemImage = (item: CartItem) => {
    if (item.variant?.images?.[0]) {
      return item.variant.images[0];
    }
    if (item.product.variants?.[0]?.images?.[0]) {
      return item.product.variants[0].images[0];
    }
    return null;
  };

  if (!isLoaded || loading) {
    return (
        <div>
          <Navbar />
          <div className="min-h-screen flex items-center justify-center text-white">
            <div>Loading...</div>
          </div>
        </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
      <div>
        <Navbar />
        <div className="min-h-screen py-6 md:py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Shopping Cart</h1>

            {!cart?.items || cart.items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-200 text-base md:text-lg mb-4">Your cart is empty</div>
                <Button onClick={() => router.push('/shop')} className="rounded-3xl p-6 md:p-8 text-sm md:text-md">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left side - Cart Items */}
                <div className="lg:col-span-2">
                  <motion.div className="space-y-4" initial="hidden" animate="visible" variants={{hidden:{opacity:0}, visible:{opacity:1, transition:{staggerChildren:0.1}}}}>
                    {cart.items.map((item: CartItem, index: number) => {
                      const image = getItemImage(item);
                      const isUpdating = updatingItems.has(item.id);

                      return (
                        <motion.div key={item.id} variants={{hidden:{opacity:0, y:20}, visible:{opacity:1, y:0}}}>\
                        <Card className="overflow-hidden bg-gray-800 border-gray-700">
                          <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
                              {/* Product Image */}
                              <div className="w-full md:w-20 h-48 md:h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                {image ? (
                                  <img
                                    src={image.src}
                                    alt={image.alt || item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No image
                                  </div>
                                )}
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0 w-full md:w-auto">
                                <h3 className="text-base md:text-lg font-medium text-white truncate">
                                  {item.product.name}
                                </h3>
                                <p className="text-sm text-gray-300">
                                  {item.product.category.name}
                                </p>
                                {item.variant?.name && (
                                  <p className="text-sm text-gray-400">
                                    Variant: {item.variant.name}
                                  </p>
                                )}
                                <div className="mt-1">
                                  <p className="text-base md:text-lg font-semibold text-white">
                                    ₹{Math.round(
                                      parseFloat(item.product.price.replace(/[^\\d.]/g, '')) + (parseFloat(item.product.price.replace(/[^\\d.]/g, '')) * item.product.taxRate / 100)
                                    ).toString()}
                                  </p>
                                  {item.product.mrp && (
                                    <p className="text-sm text-gray-400 line-through">
                                      MRP: ₹{Math.round(parseFloat(item.product.mrp)).toString()}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-2 w-full md:w-auto justify-center md:justify-start">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={isUpdating || item.quantity <= 1}
                                  className="border-gray-600 text-white hover:bg-gray-700"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={String(item.quantity)}
                                  onChange={(e) => {
                                    const qty = parseInt(e.target.value);
                                    if (qty >= 1) {
                                      updateQuantity(item.id, qty);
                                    }
                                  }}
                                  className="w-16 text-center bg-gray-700 border-gray-600 text-white"
                                  disabled={isUpdating}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={isUpdating}
                                  className="border-gray-600 text-white hover:bg-gray-700"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Subtotal and Remove Button */}
                              <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto md:items-end space-x-4 md:space-x-0 md:space-y-2">
                                <p className="text-base md:text-lg font-semibold text-white">
                                  ₹{Math.round(
                                    (parseFloat(item.product.price.replace(/[^\\d.]/g, '')) + (parseFloat(item.product.price.replace(/[^\\d.]/g, '')) * item.product.taxRate / 100)) * item.quantity
                                  )}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                  disabled={isUpdating}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Right side - Cart Summary */}
                <div className="lg:col-span-1">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Cart Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between text-base md:text-lg text-white">
                          <span>Total Items:</span>
                          <span>{cart?.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)}</span>
                        </div>
                        <div className="flex justify-between text-base md:text-lg text-white">
                          <span>Subtotal:</span>
                          <span>₹{calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base md:text-lg text-white">
                          <span>Tax:</span>
                          <span>₹{calculateTaxTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg md:text-xl font-bold text-white border-t pt-2">
                          <span>Total:</span>
                          <span>₹{Math.round(calculateTotal())}</span>
                        </div>
                        <div className="flex-col space-y-4 space-x-4 pt-4">
                          <Button
                            variant="outline"
                            className="w-full border-gray-600 text-white hover:bg-gray-700"
                            asChild
                          >
                            <Link href="/shop">
                              Continue Shopping
                            </Link>
                          </Button>
                          <Button
                            className="w-full rounded-xl p-4 text-sm md:text-md"
                            asChild
                          >
                            <Link href="/checkout">
                              Proceed to Checkout
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}