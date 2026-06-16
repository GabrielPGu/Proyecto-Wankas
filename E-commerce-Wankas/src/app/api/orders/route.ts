import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/redis';

const CACHE_TTL = 60; // 1 minuto para pedidos, que suelen cambiar más frecuentemente

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const CACHE_KEY = `cache:store:orders:${userId}`;

    // Intentar leer de Redis
    try {
      const cachedOrders = await sessionStore.get(CACHE_KEY);
      if (cachedOrders) {
        console.log(`Serving orders for user ${userId} from Redis cache`);
        return NextResponse.json(JSON.parse(cachedOrders));
      }
    } catch (e) {
      console.error('Redis get error (orders):', e);
    }

    // Cache miss
    return NextResponse.json({ error: 'CACHE_MISS' }, { status: 404 });
  } catch (error) {
    console.error('API /orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orders } = await request.json();

    if (!userId || !orders) {
      return NextResponse.json({ error: 'userId and orders are required' }, { status: 400 });
    }

    const CACHE_KEY = `cache:store:orders:${userId}`;

    try {
      await sessionStore.set(CACHE_KEY, JSON.stringify(orders), 'EX', CACHE_TTL);
      console.log(`Saved orders for user ${userId} to Redis cache`);
    } catch (e) {
      console.error('Redis set error (orders):', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const CACHE_KEY = `cache:store:orders:${userId}`;

    try {
      await sessionStore.del(CACHE_KEY);
      console.log(`Invalidated orders cache for user ${userId}`);
    } catch (e) {
      console.error('Redis del error (orders):', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /orders invalidate error:', error);
    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 });
  }
}
