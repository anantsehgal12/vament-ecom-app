'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/_components/App-sidebar';
import Header from '@/app/_components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isAdmin } from "@/app/extras/isAdmis";
import { notFound } from "next/navigation";
import { Upload, FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';

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
  userId: string;
  totalAmount: number;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  fullName: string;
  contactNo: string;
  address: string;
  city: string;
  pincode: string;
  country: string;
  email: string;
  invoiceUrl?: string;
  items: OrderItem[];
  createdAt: string;
}

export default function SellerOrderDetailsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
        router.push('/seller-dashboard/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      router.push('/seller-dashboard/orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrder({ ...order, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleInvoiceUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order) return;

    const formData = new FormData(event.currentTarget);
    const file = formData.get('invoice') as File;

    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('invoice', file);

      const response = await fetch(`/api/orders/${order.id}/invoice`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setOrder({ ...order, invoiceUrl: data.invoiceUrl });
        toast.success('Invoice uploaded successfully!');
      } else {
        toast.error('Failed to upload invoice');
      }
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Error uploading invoice');
    } finally {
      setUploading(false);
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

  if (!isLoaded || !isSignedIn) {
    return (
      <main className="w-full">
        <div className="p-6 mt-30">
          <div className="text-center">Please sign in with the admin account to access the Seller Dashboard.</div>
        </div>
      </main>
    );
  }

  if (!isAdmin(user)) {
    notFound();
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <Header />
          <div className="p-6">
            <div className="text-center">Loading order details...</div>
          </div>
        </main>
      </SidebarProvider>
    );
  }

  if (!order) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <Header />
          <div className="p-6">
            <div className="text-center">Order not found.</div>
          </div>
        </main>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <Header />
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Order Details</h1>
            <Button
              onClick={() => router.push('/seller-dashboard/orders')}
              variant="outline"
            >
              Back to Orders
            </Button>
          </div>

          {/* Customer Details */}
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-lg">{order.fullName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Contact Number</Label>
                  <p className="text-lg">{order.contactNo || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-lg">{order.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-lg">{order.address || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">City</Label>
                  <p className="text-lg">{order.city || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Pincode</Label>
                  <p className="text-lg">{order.pincode || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium">Country</Label>
                  <p className="text-lg">{order.country || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <span className="text-lg sm:text-xl">Order #{order.orderId}</span>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {order.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-2">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="text-gray-600 text-sm">User ID: {order.userId}</p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-gray-600 text-sm">Total Amount</p>
                  <p className="text-xl font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</p>
                  <div className="mt-2">
                    <Select
                      value={order.status}
                      onValueChange={updateOrderStatus}
                    >
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium">Razorpay Order ID</Label>
                  <p className="text-sm font-mono break-all">{order.razorpayOrderId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment ID</Label>
                  <p className="text-sm font-mono break-all">{order.razorpayPaymentId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
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
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium">{item.product.name}</h3>
                      {item.variant?.name && (
                        <p className="text-gray-600 text-sm">Variant: {item.variant.name}</p>
                      )}
                      <p className="text-gray-600 text-sm">Category: {item.product.category.name}</p>
                    </div>
                    <div className="text-right">
                      <p>Qty: {item.quantity}</p>
                      <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Upload */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Invoice</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.invoiceUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-green-600">
                      <FileText className="w-5 h-5" />
                      <span>Invoice uploaded</span>
                    </div>
                    <Button
                      onClick={() => window.open(order.invoiceUrl, '_blank')}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Invoice</span>
                    </Button>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Update Invoice</h4>
                    <form onSubmit={handleInvoiceUpload} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="space-y-4">
                      <div>
                        <Label htmlFor="invoice">Upload New Invoice (PDF or Image)</Label>
                        <Input
                          id="invoice"
                          name="invoice"
                          type="file"
                          accept=".pdf,image/*"
                          required
                          className="mt-1"
                        />
                      </div>
                      <Button type="submit" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Update Invoice'}
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInvoiceUpload} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="space-y-4">
                  <div>
                    <Label htmlFor="invoice">Upload Invoice (PDF or Image)</Label>
                    <Input
                      id="invoice"
                      name="invoice"
                      type="file"
                      accept=".pdf,image/*"
                      required
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload Invoice'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarProvider>
  );
}
