"use client";

import dynamic from 'next/dynamic';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenuSkeleton } from '@/components/ui/sidebar';

const AppSidebar = dynamic(() => import('@/components/app-sidebar').then(mod => mod.AppSidebar), { 
    ssr: false,
    loading: () => (
        <Sidebar variant="inset">
            <SidebarHeader />
            <SidebarContent>
                <div className="p-2 flex flex-col gap-2">
                    <SidebarMenuSkeleton showIcon={true} />
                    <SidebarMenuSkeleton showIcon={true} />
                    <SidebarMenuSkeleton showIcon={true} />
                    <SidebarMenuSkeleton showIcon={true} />
                </div>
            </SidebarContent>
        </Sidebar>
    )
});

export function ClientSidebar() {
  return <AppSidebar />;
}
