import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { sessionStore } from '@/lib/redis';

const CACHE_KEY = 'admin:usuarios';

export async function GET() {
  try {
    const cached = await sessionStore.get(CACHE_KEY);
    if (cached) {
      console.log('Serving admin usuarios from Redis cache');
      return NextResponse.json(JSON.parse(cached));
    }
  } catch (e) {
    console.error('Redis get error (usuarios):', e);
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name', { ascending: true });

  if (error) console.error('Error fetching users:', error);

  const payload = data ?? [];

  try {
    await sessionStore.set(CACHE_KEY, JSON.stringify(payload), 'EX', 300);
    console.log('Saved admin usuarios to Redis cache');
  } catch (e) {
    console.error('Redis set error (usuarios):', e);
  }

  return NextResponse.json(payload);
}

export async function DELETE() {
  try {
    await sessionStore.del(CACHE_KEY);
  } catch (e) {
    console.error('Redis del error (usuarios):', e);
  }
  return NextResponse.json({ ok: true });
}
