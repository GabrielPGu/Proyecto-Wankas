import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { sessionStore } from '@/lib/redis';

export async function GET() {
  const cacheKey = 'admin:dashboard';

  try {
    const cached = await sessionStore.get(cacheKey);
    if (cached) {
      console.log('Serving admin dashboard from Redis cache');
      return NextResponse.json(JSON.parse(cached));
    }
  } catch (e) {
    console.error('Redis get error (dashboard):', e);
  }

  const supabase = createAdminClient();

  const [
    { count: totalOrders },
    { data: revenueData },
    { count: activeProducts },
    { count: activeLocations },
    { data: ordersData },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total_price').eq('status', 'completed'),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('locations').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('*, profiles(name), locations(name_es)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = revenueData?.reduce((sum, o) => sum + o.total_price, 0) ?? 0;

  const payload = {
    stats: {
      totalOrders: totalOrders ?? 0,
      totalRevenue,
      activeProducts: activeProducts ?? 0,
      activeLocations: activeLocations ?? 0,
    },
    recentOrders: ordersData ?? [],
  };

  try {
    // TTL: 5 minutes
    await sessionStore.set(cacheKey, JSON.stringify(payload), 'EX', 300);
    console.log('Saved admin dashboard to Redis cache');
  } catch (e) {
    console.error('Redis set error (dashboard):', e);
  }

  return NextResponse.json(payload);
}

// Call this after mutations to invalidate cache
export async function DELETE() {
  try {
    await sessionStore.del('admin:dashboard');
  } catch (e) {
    console.error('Redis del error (dashboard):', e);
  }
  return NextResponse.json({ ok: true });
}
