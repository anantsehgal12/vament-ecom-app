'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/_components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    price: string;
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

interface Order {
  id: string;
  orderId: string;
  totalAmount: number;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  invoiceUrl?: string;
  items: OrderItem[];
  createdAt: string;
}

export default function OrdersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, isLoaded, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-600';
      case 'confirmed':
        return 'bg-blue-600';
      case 'shipped':
        return 'bg-purple-600';
      case 'delivered':
        return 'bg-green-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
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
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">My Orders</h1>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-200 text-lg mb-4">You haven't placed any orders yet</div>
              <Button onClick={() => router.push('/shop')} className="rounded-3xl p-8 text-md">
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white flex items-center space-x-4">
                          <span>Order #{order.orderId}</span>
                          <Badge className={`${getStatusColor(order.status)} text-white`}>
                            {order.status}
                          </Badge>
                        </CardTitle>
                        <p className="text-gray-300 text-sm mt-2">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-300 text-sm">Total Amount</p>
                        <p className="text-white text-xl font-bold">₹{order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
                          <div className="flex-shrink-0">
                            {item.variant?.images?.[0] ? (
                              <img
                                src={item.variant.images[0].src}
                                alt={item.variant.images[0].alt}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : item.product.variants?.[0]?.images?.[0] ? (
                              <img
                                src={item.product.variants[0].images[0].src}
                                alt={item.product.variants[0].images[0].alt}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-600 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-grow">
                            <h3 className="text-white font-medium">{item.product.name}</h3>
                            {item.variant?.name && (
                              <p className="text-gray-300 text-sm">Variant: {item.variant.name}</p>
                            )}
                            <p className="text-gray-300 text-sm">Category: {item.product.category.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white">Qty: {item.quantity}</p>
                            <p className="text-white font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="flex justify-between items-center">
                        <Button
                          onClick={() => router.push(`/order-complete/${order.id}`)}
                          variant="outline"
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          View Order Details
                        </Button>
                        {order.invoiceUrl && (
                          <Button
                            onClick={() => window.open(order.invoiceUrl, '_blank')}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-white hover:bg-gray-700"
                          >
                            View Invoice
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
