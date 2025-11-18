"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Navbar from "@/app/_components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Plus, Edit, Trash2, Star } from "lucide-react";

interface Address {
  id: string;
  name: string;
  fullName: string;
  contactNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  email: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddressFormData {
  name: string;
  fullName: string;
  contactNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  email: string;
  isDefault: boolean;
}

export default function MyAddressesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    name: "",
    fullName: "",
    contactNo: "+91",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    email: "",
    isDefault: false,
  });

  useEffect(() => {
    const loadData = async () => {
      if (isLoaded && !user) {
        router.push("/sign-in");
        return;
      }

      if (user) {
        await fetchAddresses();
        setLoading(false);
      }
    };

    loadData();
  }, [user, isLoaded, router]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/addresses");
      if (response.ok) {
        const addressesData = await response.json();
        setAddresses(addressesData);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingAddress
        ? `/api/addresses/${editingAddress.id}`
        : "/api/addresses";
      const method = editingAddress ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAddresses();
        setIsDialogOpen(false);
        resetForm();
        toast.success(
          editingAddress
            ? "Address updated successfully"
            : "Address added successfully"
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAddresses();
        toast.success("Address deleted successfully");
      } else {
        toast.error("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      fullName: address.fullName,
      contactNo: address.contactNo,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      email: address.email,
      isDefault: address.isDefault,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAddress(null);
    setFormData({
      name: "",
      fullName: "",
      contactNo: "+91",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      email: "",
      isDefault: false,
    });
  };

  const handlePincodeChange = async (pincode: string) => {
    setFormData((prev) => ({ ...prev, pincode }));

    if (pincode.length === 6) {
      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${pincode}`
        );
        const data = await response.json();
        if (data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          setFormData((prev) => ({
            ...prev,
            city: postOffice.District,
            state: postOffice.State,
          }));
        }
      } catch (error) {
        console.error("Error fetching pincode data:", error);
      }
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
      <div className="min-h-screen py-6 px-4 md:py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              My Addresses
            </h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  className="rounded-3xl p-4 md:p-4 text-sm md:text-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">
                    {editingAddress ? "Edit Address" : "Add New Address"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-white text-sm font-medium"
                      >
                        Address Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="bg-gray-800 border-gray-600 text-white focus:border-gray-500 focus:ring-0"
                        placeholder="e.g., Home, Office, Work"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="fullName"
                        className="text-white text-sm font-medium"
                      >
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                        className="bg-gray-800 border-gray-600 text-white focus:border-gray-500 focus:ring-0"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="contactNo"
                        className="text-white text-sm font-medium"
                      >
                        Contact No. *
                      </Label>
                      <Input
                        id="contactNo"
                        type="tel"
                        value={formData.contactNo}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactNo: e.target.value,
                          }))
                        }
                        className="bg-gray-800 border-gray-600 text-white focus:border-gray-500 focus:ring-0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-white text-sm font-medium"
                      >
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="bg-gray-800 border-gray-600 text-white focus:border-gray-500 focus:ring-0"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="text-white text-sm font-medium"
                    >
                      Address *
                    </Label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="bg-gray-800 border-gray-600 text-white focus:border-gray-500 focus:ring-0"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="city"
                        className="text-white text-sm font-medium"
                      >
                        City *
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        className="bg-gray-800 border-gray-600 text-white focus:border-gray-500 focus:ring-0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="state"
                        className="text-white text-sm font-medium"
                      >
                        State *
                      </Label>
                      <Input
                        id="state"
                        type="text"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            state: e.target.value,
                          }))
                        }
                        className="bg-gray-800 border-gray-600 text-white focus:border-gray-500 focus:ring-0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="pincode"
                        className="text-white text-sm font-medium"
                      >
                        Pincode *
                      </Label>
                      <Input
                        id="pincode"
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white focus:border-gray-500 focus:ring-0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="country"
                        className="text-white text-sm font-medium"
                      >
                        Country *
                      </Label>
                      <Input
                        id="country"
                        type="text"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                        className="bg-gray-800 border-gray-600 text-white focus:border-gray-500 focus:ring-0"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isDefault: e.target.checked,
                        }))
                      }
                      className="rounded-3xl border-gray-600"
                    />
                    <Label htmlFor="isDefault" className="text-white text-sm">
                      Set as default address
                    </Label>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="border-gray-600 text-white hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="rounded-xl">
                      {editingAddress ? "Update Address" : "Add Address"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-200 text-base md:text-lg mb-4">
                No addresses saved yet
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="rounded-3xl p-6 md:p-8 text-sm md:text-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Address
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addresses.map((address) => (
                <Card
                  key={address.id}
                  className="bg-gray-900 border-gray-700"
                >
                  <CardHeader>
                    <CardTitle className="text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {address.name}
                        </span>
                        {address.isDefault && (
                          <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </span>
                        )}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(address)}
                          className="text-gray-400 hover:text-white p-1 h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(address.id)}
                          className="text-gray-400 hover:text-red-400 p-1 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-1">
                    <div>
                      <strong>{address.fullName}</strong>
                    </div>
                    <div>{address.address}</div>
                    <div>
                      {address.city}, {address.state} {address.pincode}
                    </div>
                    <div>{address.country}</div>
                    <div>{address.contactNo}</div>
                    <div>{address.email}</div>
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
