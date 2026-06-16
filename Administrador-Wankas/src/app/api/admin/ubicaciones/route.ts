import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { sessionStore } from '@/lib/redis';

const CACHE_KEY = 'admin:ubicaciones';

export async function GET() {
  try {
    const cached = await sessionStore.get(CACHE_KEY);
    if (cached) {
      console.log('Serving admin ubicaciones from Redis cache');
      return NextResponse.json(JSON.parse(cached));
    }
  } catch (e) {
    console.error('Redis get error (ubicaciones):', e);
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name_es', { ascending: true });

  if (error) console.error('Error fetching locations:', error);

  const payload = data ?? [];

  try {
    await sessionStore.set(CACHE_KEY, JSON.stringify(payload), 'EX', 300);
    console.log('Saved admin ubicaciones to Redis cache');
  } catch (e) {
    console.error('Redis set error (ubicaciones):', e);
  }

  return NextResponse.json(payload);
}

export async function DELETE() {
  try {
    await sessionStore.del(CACHE_KEY);
  } catch (e) {
    console.error('Redis del error (ubicaciones):', e);
  }
  return NextResponse.json({ ok: true });
}
