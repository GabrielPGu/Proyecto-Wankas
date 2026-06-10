"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/');
      return;
    }

    if (user.role === 'worker' && !user.location_id && pathname !== '/seleccionar-sede') {
      router.push('/seleccionar-sede');
    }

  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-md p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (user.role === 'worker' && !user.location_id) {
    return <>{children}</>;
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardNav />
      </Sidebar>
      <SidebarInset>
        <main className="p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
