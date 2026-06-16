import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { sessionStore } from '@/lib/redis';

const CACHE_KEY = 'admin:pedidos';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const locationId = searchParams.get('location_id');

  // Only cache for admin (full dataset); workers get a filtered view
  const shouldCache = role === 'admin';

  if (shouldCache) {
    try {
      const cached = await sessionStore.get(CACHE_KEY);
      if (cached) {
        console.log('Serving admin pedidos from Redis cache');
        return NextResponse.json(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Redis get error (pedidos):', e);
    }
  }

  const supabase = createAdminClient();

  let query = supabase
    .from('orders')
    .select('*, profiles(name), locations(name_es), order_items(product_id, quantity)');

  if (role === 'worker' && locationId) {
    query = query.eq('location_id', locationId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) console.error('Error fetching orders:', error);

  const payload = data ?? [];

  if (shouldCache) {
    try {
      // TTL: 2 minutes — orders change more often
      await sessionStore.set(CACHE_KEY, JSON.stringify(payload), 'EX', 120);
      console.log('Saved admin pedidos to Redis cache');
    } catch (e) {
      console.error('Redis set error (pedidos):', e);
    }
  }

  return NextResponse.json(payload);
}

export async function DELETE() {
  try {
    await sessionStore.del(CACHE_KEY);
  } catch (e) {
    console.error('Redis del error (pedidos):', e);
  }
  return NextResponse.json({ ok: true });
}
