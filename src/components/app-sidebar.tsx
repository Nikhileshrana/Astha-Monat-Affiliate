"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth/auth-client"
import { ROUTES_CONFIG, ADMIN_EMAIL } from "@/lib/routes"
import { getUserAllowedRoutes } from "@/lib/access-control"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()
  const [allowedRoutes, setAllowedRoutes] = React.useState<string[]>([])
  const router = useRouter()
  
  React.useEffect(() => {
    if (session?.user?.email) {
      if (session.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        // Native Server Action securely loads boundaries mapping directly towards DB!
        getUserAllowedRoutes()
          .then((routes) => {
            if (routes) setAllowedRoutes(routes);
          })
          .catch(console.error);
      }
    }
  }, [session?.user?.email]);

  // Use the session user if available, fallback to the dummy data
  const loggedInUser = session?.user || {
    name: "Loading...",
    email: "Loading...",
    image: "",
  }
  
  // Filter navMain based on user access
  const isAdmin = loggedInUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  const filteredNavMain = ROUTES_CONFIG.map((group) => {
    const visibleItems = group.items.filter((item) => {
      if (isAdmin) return true;
      if (!item.requiresAccess) return true;
      return allowedRoutes.includes(item.url);
    });

    return {
      ...group,
      items: visibleItems
    };
  }).filter(group => group.items.length > 0);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="pl-[7px]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => {
                router.push("/protected");
              }}
              className="data-[state=open]:text-sidebar-accent-foreground bg-sidebar-white rounded-md group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center [&_svg]:size-8! [&_svg]:shrink-0"
            >
              <div className="flex shrink-0 items-center justify-center overflow-hidden bg-white rounded-md -translate-x-0.5 group-data-[collapsible=icon]:translate-x-0">
                <Image src="/logo.png" alt="ASTHA × MONAT" width={27} height={27} />
              </div>
              <div className="grid min-w-0 flex-1 gap-0.5 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="font-semibold truncate tracking-tight text-sm sm:text-base">
                  ASTHA × MONAT
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain as any} />
      </SidebarContent>
      <SidebarFooter className="pl-[7px]">
        <NavUser user={{
          name: loggedInUser.name,
          email: loggedInUser.email,
          avatar: loggedInUser.image || "",
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
