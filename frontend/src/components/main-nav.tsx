"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  BarChart2,
  Bell,
  FileText,
  Languages,
  LayoutGrid,
  LogOut,
  Mic,
  ScanText,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { useEffect, useState } from "react";


const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/contracts", icon: FileText, label: "Contracts" },
  { href: "/analysis", icon: ScanText, label: "Clause Analysis" },
  { href: "/translation", icon: Languages, label: "Translation" },
  { href: "/voice", icon: Mic, label: "Voice Interpretation" },
  { href: "/risk", icon: Shield, label: "Risk Scoring" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/users", icon: Users, label: "User Management" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export function MainNav() {
  const pathname = usePathname();
  const [isCompany, setIsCompany] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user?.account_type === "company") {
          setIsCompany(true);
        }
      } catch (error) {
        console.error("Failed to fetch user for navigation:", error);
      }
    };

    checkUser();
  }, []);


  const filteredNavItems = navItems.filter((item) => {
    if (item.href === "/users" && !isCompany) {
      return false;
    }
    return true;
  });


  return (
    <SidebarMenu>
      {filteredNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      <SidebarMenuItem className="mt-auto">
        <Link href="/login">
            <SidebarMenuButton>
                <LogOut />
                <span>Logout</span>
            </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
