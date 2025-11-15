'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
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

export default function OrderCompletePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    if (user && params.id) {
      fetchOrder();
    }
  }, [user, isLoaded, params.id, router]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else {
        router.push('/my-orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      router.push('/my-orders');
    } finally {
      setLoading(false);
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

  if (!user || !order) {
    return null; // Will redirect
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <div className="text-green-400 text-4xl md:text-6xl mb-4">✓</div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Order Completed Successfully!</h1>
            <p className="text-gray-300">Thank you for your purchase</p>
          </div>

          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex justify-between items-center">
                <span>Order Details</span>
                <Badge variant="secondary" className="bg-green-600 text-white">
                  {order.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-300">Order ID:</p>
                  <p className="text-xl font-bold text-green-400">{order.orderId}</p>
                </div>
                <div>
                  <p className="text-gray-300">Total Amount:</p>
                  <p className="text-xl font-bold">₹{order.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-300">Razorpay Order ID:</p>
                  <p className="text-sm font-mono">{order.razorpayOrderId}</p>
                </div>
                <div>
                  <p className="text-gray-300">Payment ID:</p>
                  <p className="text-sm font-mono">{order.razorpayPaymentId}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-300">Order Date:</p>
                <p>{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              {order.invoiceUrl && (
                <div className="mt-4">
                  <p className="text-gray-300">Invoice:</p>
                  <Button
                    onClick={() => window.open(order.invoiceUrl, '_blank')}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-gray-600 text-white hover:bg-gray-700"
                  >
                    View Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Order Items</CardTitle>
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
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4 mt-8">
            <Button
              onClick={() => router.push('/my-orders')}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              View All Orders
            </Button>
            <Button onClick={() => router.push('/shop')} className="rounded-xl">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
