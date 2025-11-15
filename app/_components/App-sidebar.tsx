import {
  Calendar,
  CirclePlus,
  Home,
  Inbox,
  Search,
  Settings,
  Tag,
  ShoppingCart,
  Package,
  Percent,
  Bell,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";


const logo = "https://i.ibb.co/KzpsqQD9/ve.png";


import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/seller-dashboard",
    icon: Home,
  },
  {
    title: "Products",
    url: "/seller-dashboard/products",
    icon: Inbox,
  },
  {
    title: "Inventory",
    url: "/seller-dashboard/inventory",
    icon: Package,
  },
  {
    title: "Add Product",
    url: "/seller-dashboard/add-product",
    icon: CirclePlus,
  },
  {
    title: "Categories",
    url: "/seller-dashboard/categories",
    icon: Tag,
  },
  {
    title: "Coupons",
    url: "/seller-dashboard/coupons",
    icon: Percent,
  },
  {
    title: "Orders",
    url: "/seller-dashboard/orders",
    icon: ShoppingCart,
  },
  {
    title: "Notifications",
    url: "/seller-dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Search",
    url: "/seller-dashboard/search",
    icon: Search,
  },
  {
    title: "Settings",
    url: "/seller-dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/">
          <main className="flex justify-center items-center gap-5 pt-1">
            <Image
              src={logo}
              alt="Logo"
              width={60}
              height={60}
              className="w-16 h-16 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
            />
            <h1 className="group-data-[collapsible=icon]:hidden text-center font-bold text-xl">
              VAM
              <br /> Enterprises
            </h1>
          </main>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
