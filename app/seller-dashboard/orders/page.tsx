"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/App-sidebar";
import Header from "@/app/_components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShoppingCart } from "lucide-react";
import { isAdmin } from "@/app/extras/isAdmis";
import { notFound } from "next/navigation";
import Navbar from "@/app/_components/Navbar";

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
  items: OrderItem[];
  createdAt: string;
}

export default function SellerOrdersPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, isLoaded, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders?seller=true");
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-600";
      case "confirmed":
        return "bg-blue-600";
      case "shipped":
        return "bg-purple-600";
      case "delivered":
        return "bg-green-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const filteredOrders = orders
    .filter(
      (order) => filterStatus === "all" || order.status.toLowerCase() === filterStatus.toLowerCase()
    )
    .filter((order) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        order.orderId.toLowerCase().includes(query) ||
        order.items.some((item) =>
          item.product.name.toLowerCase().includes(query)
        )
      );
    });

  if (!isLoaded || !isSignedIn) {
    return (
      <main className="w-full">
        <Navbar />
        <div className="p-6 mt-30">
          <div className="text-center">
            Please sign in with the admin account to access the Seller
            Dashboard.
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin(user)) {
    notFound();
  }

  if (loading && isAdmin(user)) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <Header />
          <div className="p-6">
            <div className="text-center">Loading orders...</div>
          </div>
        </main>
      </SidebarProvider>
    );
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
                <ShoppingCart/>
                <h1 className="text-3xl font-bold">All Orders</h1>
              </div>
              <div className="flex-col items-center gap-4">
                <span>Filter by status:</span>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search orders by order ID or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">
                      {filterStatus === "all"
                        ? "No orders found."
                        : `No ${filterStatus} orders found.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="hidden md:block space-y-6">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="shadow-lg">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center space-x-4">
                              <span>Order #{order.orderId}</span>
                              <Badge
                                className={`${getStatusColor(
                                  order.status
                                )} text-white`}
                              >
                                {order.status}
                              </Badge>
                            </CardTitle>
                            <p className="text-gray-600 text-sm mt-2">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                            <p className="text-gray-600 text-sm">
                              User ID: {order.userId}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-600 text-sm">Total Amount</p>
                            <p className="text-xl font-bold text-green-600">
                              ₹{order.totalAmount.toFixed(2)}
                            </p>
                            <div className="mt-2 space-y-2">
                              <Select
                                value={order.status}
                                onValueChange={(value) =>
                                  updateOrderStatus(order.id, value)
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDING">Pending</SelectItem>
                                  <SelectItem value="CONFIRMED">
                                    Confirmed
                                  </SelectItem>
                                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                                  <SelectItem value="DELIVERED">
                                    Delivered
                                  </SelectItem>
                                  <SelectItem value="CANCELLED">
                                    Cancelled
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg"
                            >
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
                                    <span className="text-gray-400 text-xs">
                                      No Image
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow">
                                <h3 className="font-medium">
                                  {item.product.name}
                                </h3>
                                {item.variant?.name && (
                                  <p className="text-gray-600 text-sm">
                                    Variant: {item.variant.name}
                                  </p>
                                )}
                                <p className="text-gray-600 text-sm">
                                  Category: {item.product.category.name}
                                </p>
                              </div>
                              <div className="text-right">
                                <p>Qty: {item.quantity}</p>
                                <p className="font-medium">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                          <div className="text-sm text-gray-600">
                            <p>Razorpay Order ID: {order.razorpayOrderId}</p>
                            <p>Payment ID: {order.razorpayPaymentId}</p>
                          </div>
                          <Button
                            onClick={() =>
                              router.push(`/seller-dashboard/orders/${order.id}`)
                            }
                            variant="outline"
                            size="sm"
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="md:hidden grid grid-cols-1 gap-4">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2 mb-1">
                              <span>Order #{order.orderId}</span>
                              <Badge
                                className={`${getStatusColor(
                                  order.status
                                )} text-white text-xs`}
                              >
                                {order.status}
                              </Badge>
                            </CardTitle>
                            <p className="text-xs text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              User: {order.userId.slice(0, 8)}...
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              ₹{order.totalAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3 mb-4">
                          {order.items.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg"
                            >
                              <div className="flex-shrink-0">
                                {item.variant?.images?.[0] ? (
                                  <img
                                    src={item.variant.images[0].src}
                                    alt={item.variant.images[0].alt}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                ) : item.product.variants?.[0]?.images?.[0] ? (
                                  <img
                                    src={item.product.variants[0].images[0].src}
                                    alt={item.product.variants[0].images[0].alt}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">
                                      No Image
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {item.product.name}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  Qty: {item.quantity} • ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-gray-500 text-center">
                              +{order.items.length - 2} more items
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) =>
                              updateOrderStatus(order.id, value)
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="CONFIRMED">
                                Confirmed
                              </SelectItem>
                              <SelectItem value="SHIPPED">Shipped</SelectItem>
                              <SelectItem value="DELIVERED">
                                Delivered
                              </SelectItem>
                              <SelectItem value="CANCELLED">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() =>
                              router.push(`/seller-dashboard/orders/${order.id}`)
                            }
                            variant="outline"
                            size="sm"
                            className="px-3"
                          >
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </SidebarProvider>
    );
}
