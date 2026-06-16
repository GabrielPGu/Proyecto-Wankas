import { NextResponse } from 'next/server';
import { getProducts } from '@/services/productService';
import { sessionStore } from '@/lib/redis';

const CACHE_KEY = 'cache:store:products';
const CACHE_TTL = 300; // 5 minutos

export async function GET() {
  try {
    // Intentar leer de Redis
    try {
      const cachedProducts = await sessionStore.get(CACHE_KEY);
      if (cachedProducts) {
        console.log('Serving products from Redis cache');
        return NextResponse.json(JSON.parse(cachedProducts));
      }
    } catch (e) {
      console.error('Redis get error (products):', e);
    }

    // Si no hay caché o hubo error, obtener de Supabase
    console.log('Fetching products from database');
    const products = await getProducts();

    // Guardar en Redis (Fire and forget, no usamos await si no es estrictamente necesario, aunque aquí sí para asegurar)
    try {
      if (products && products.length > 0) {
        await sessionStore.set(CACHE_KEY, JSON.stringify(products), 'EX', CACHE_TTL);
        console.log('Saved products to Redis cache');
      }
    } catch (e) {
      console.error('Redis set error (products):', e);
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('API /products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
