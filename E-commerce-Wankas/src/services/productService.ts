import type { Product } from '@/types';
import { products as localProducts } from '@/data/products';
import { supabase } from '@/lib/supabaseClient';

function cleanSupabaseUrl(url: string | undefined | null): string | undefined | null {
  if (!url) {
    return url;
  }
  try {
    const urlObject = new URL(url);
    urlObject.pathname = urlObject.pathname.replace(/\/{2,}/g, '/');
    return urlObject.toString();
  } catch (e) {
    console.warn("Could not parse URL for cleaning, returning original:", url, e);
    return url;
  }
}

export async function getProducts(): Promise<Product[]> {
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!supabase) {
    console.warn("Cliente Supabase no disponible. Usando datos locales.");
    return localProducts;
  }

  const productsTableName = 'products';
  const categoriesTableName = 'categories';

  try {
    console.log(`Consultando productos desde Supabase, tabla: ${productsTableName} uniéndose con ${categoriesTableName}.`);

    const { data, error } = await supabase
      .from(productsTableName)
      .select(`
        id,
        name_es,
        description_es,
        price,
        stock,
        image_urls,
        thumbnail_url,
        ${categoriesTableName}(name_es)
      `)
      .order('name_es', { ascending: true });

    if (error) {
      console.error("Error al obtener productos de Supabase:", error);
      console.warn("Recurriendo a datos locales debido a error de Supabase.");
      return localProducts;
    }

    if (!data) {
        console.warn("No se recibieron datos de Supabase. Usando datos locales.");
        return localProducts;
    }

    console.log("Productos obtenidos de Supabase:", data.length);

    const productList: Product[] = data.map((item: any) => {
      let rawImageUrl: string | undefined | null = null;

      if (item.thumbnail_url) {
        rawImageUrl = item.thumbnail_url;
      } else if (item.image_urls && Array.isArray(item.image_urls) && item.image_urls.length > 0 && item.image_urls[0]) {
        rawImageUrl = item.image_urls[0];
      }

      const cleanedImageUrl = cleanSupabaseUrl(rawImageUrl);
      const imageUrl = cleanedImageUrl || 'https://placehold.co/600x400.png';

      const categoryName = item[categoriesTableName] && item[categoriesTableName].name_es
        ? item[categoriesTableName].name_es
        : 'Sin categoría';

      return {
        id: item.id,
        name: item.name_es || 'Producto sin nombre',
        description: item.description_es || '',
        price: item.price || 0,
        imageUrl: imageUrl,
        category: categoryName,
        stock: item.stock || 0,
      };
    });
    return productList;

  } catch (e) {
    console.error("Excepción al obtener productos de Supabase:", e);
    console.warn("Recurriendo a datos locales debido a excepción.");
    return localProducts;
  }
}
