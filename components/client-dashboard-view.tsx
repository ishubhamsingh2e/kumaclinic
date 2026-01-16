"use client";

import dynamic from 'next/dynamic';
import { DashboardViewProps } from './dashboard-view';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardView = dynamic(() => import('@/components/dashboard-view'), { 
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full flex-col">
            <header className="bg-background flex h-16 shrink-0 items-center gap-2 border-b px-6">
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            </header>
            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                  <Skeleton className="aspect-video rounded-xl" />
                  <Skeleton className="aspect-video rounded-xl" />
                  <Skeleton className="aspect-video rounded-xl" />
                </div>
                <Skeleton className="min-h-screen flex-1 rounded-xl md:min-h-min" />
            </div>
        </div>
    )
});

export function ClientDashboardView(props: DashboardViewProps) {
  return <DashboardView {...props} />;
}
