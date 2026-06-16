import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { sessionStore } from '@/lib/redis';

const CACHE_KEY = 'admin:catalogo';

export async function GET() {
  try {
    const cached = await sessionStore.get(CACHE_KEY);
    if (cached) {
      console.log('Serving admin catalogo from Redis cache');
      return NextResponse.json(JSON.parse(cached));
    }
  } catch (e) {
    console.error('Redis get error (catalogo):', e);
  }

  const supabase = createAdminClient();

  const [
    { data: productsData, error: productsError },
    { data: categoriesData, error: categoriesError },
  ] = await Promise.all([
    supabase.from('products').select('*, categories (*)').order('name_es', { ascending: true }),
    supabase.from('categories').select('*'),
  ]);

  if (productsError) console.error('Error fetching products:', productsError);
  if (categoriesError) console.error('Error fetching categories:', categoriesError);

  const payload = {
    products: productsData ?? [],
    categories: categoriesData ?? [],
  };

  try {
    // TTL: 5 minutes
    await sessionStore.set(CACHE_KEY, JSON.stringify(payload), 'EX', 300);
    console.log('Saved admin catalogo to Redis cache');
  } catch (e) {
    console.error('Redis set error (catalogo):', e);
  }

  return NextResponse.json(payload);
}

export async function DELETE() {
  try {
    await sessionStore.del(CACHE_KEY);
  } catch (e) {
    console.error('Redis del error (catalogo):', e);
  }
  return NextResponse.json({ ok: true });
}
