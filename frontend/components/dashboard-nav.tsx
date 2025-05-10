"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, LinkIcon, FileText, MessageSquare, Settings } from "lucide-react"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"

const items = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "URL Management",
    href: "/dashboard/urls",
    icon: LinkIcon,
  },
  {
    title: "PDF Management",
    href: "/dashboard/pdfs",
    icon: FileText,
  },
  {
    title: "Chat Preview",
    href: "/dashboard/chat",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
