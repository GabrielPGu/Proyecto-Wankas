'use server';

import { supabase } from '@/lib/supabaseClient';
import type { Order, OrderItem, User, CartItem } from '@/types';

export interface EnrichedOrderItem extends OrderItem {
  productName?: string;
  productImageUrl?: string;
}

export interface EnrichedOrder extends Order {
  items: EnrichedOrderItem[];
  location_name?: string;
  location_address?: string;
}

export async function placeOrderWithStockUpdate(
  orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_date' | 'status' | 'notes'>,
  items: CartItem[]
): Promise<Order> {
  if (!supabase) {
    throw new Error("El servicio de base de datos no está disponible.");
  }

  const productIds = items.map(item => item.id);
  const { data: productsInStock, error: stockError } = await supabase
    .from('products')
    .select('id, stock, name_es')
    .in('id', productIds);
  
  if (stockError) {
    console.error("Error fetching stock:", stockError);
    throw new Error("No se pudo verificar el stock de los productos.");
  }

  const stockMap = new Map(productsInStock.map(p => [p.id, { stock: p.stock, name: p.name_es }]));

  for (const item of items) {
    const productInfo = stockMap.get(item.id);
    if (!productInfo || productInfo.stock < item.quantity) {
      throw new Error(`No hay suficiente stock para '${productInfo?.name || item.name}'. Solo quedan ${productInfo?.stock || 0}.`);
    }
  }

  const stockUpdatePromises = items.map(item => {
    const productInfo = stockMap.get(item.id)!;
    const newStock = productInfo.stock - item.quantity;
    return supabase.from('products').update({ stock: newStock }).eq('id', item.id);
  });
  
  const stockUpdateResults = await Promise.all(stockUpdatePromises);
  const failedStockUpdate = stockUpdateResults.find(res => res.error);

  if (failedStockUpdate) {
    console.error('Failed to update stock, order not placed. Error:', failedStockUpdate.error);
    throw new Error("No se pudo actualizar el stock de un producto. La orden no fue creada. Intente de nuevo.");
  }
  
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError || !newOrder) {
    console.error('Order creation failed after stock update. Error:', orderError);
    console.log('Attempting to revert stock updates...');
    const stockRevertPromises = items.map(item => {
        const productInfo = stockMap.get(item.id)!;
        return supabase.from('products').update({ stock: productInfo.stock }).eq('id', item.id);
    });
    await Promise.all(stockRevertPromises);
    throw new Error('No se pudo crear la orden. Se ha intentado revertir el stock. Por favor, verifique el carrito y reintente.');
  }

  const orderItemsToInsert = items.map(item => ({
    order_id: newOrder.id,
    product_id: item.id,
    quantity: item.quantity,
    price_at_purchase: item.price,
  }));

  const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsToInsert);

  if (orderItemsError) {
    console.error(`Order items creation failed for order ${newOrder.id}. Error:`, orderItemsError);
    console.log('Attempting to revert stock updates and delete order...');
    const stockRevertPromises = items.map(item => {
        const productInfo = stockMap.get(item.id)!;
        return supabase.from('products').update({ stock: productInfo.stock }).eq('id', item.id);
    });
    await Promise.all(stockRevertPromises);
    await supabase.from('orders').delete().eq('id', newOrder.id);
    throw new Error('No se pudieron guardar los detalles de la orden. La orden ha sido cancelada. Por favor, reintente.');
  }
  
  return newOrder;
}


export async function getUserOrders(userId: string): Promise<EnrichedOrder[]> {
  if (!supabase) {
    console.error("Supabase client not available.");
    return [];
  }
  await new Promise(resolve => setTimeout(resolve, 300));

  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id, user_id, location_id, order_date, pickup_date, status, total_price, notes, created_at, updated_at,
      locations (name_es, address) 
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return [];
  }
  if (!ordersData) return [];

  const enrichedOrders: EnrichedOrder[] = [];

  for (const order of ordersData) {
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`*, products (name_es, thumbnail_url, image_urls)`)
      .eq('order_id', order.id);

    if (orderItemsError) {
      console.error(`Error fetching items for order ${order.id}:`, orderItemsError);
    }
    
    const items: EnrichedOrderItem[] = orderItemsData?.map(item => {
      const product = item.products as any; 
      let imageUrl = 'https://placehold.co/80x80.png';
      if (product?.thumbnail_url) imageUrl = product.thumbnail_url;
      else if (product?.image_urls?.[0]) imageUrl = product.image_urls[0];

      return {
        ...item,
        productName: product?.name_es || 'Nombre no disponible',
        productImageUrl: imageUrl,
      };
    }) || [];

    const locationDetails = order.locations as any;
    enrichedOrders.push({
      ...order,
      location_name: locationDetails?.name_es || 'Ubicación desconocida',
      location_address: locationDetails?.address || 'Dirección no disponible',
      items,
    });
  }
  return enrichedOrders;
}

export async function cancelOrder(orderId: string, userId: string): Promise<boolean> {
  if (!supabase) {
    throw new Error("El servicio de base de datos no está disponible.");
  }
  
  const { data: orderToCancel, error: orderFetchError } = await supabase
    .from('orders')
    .select(`*, order_items(*)`)
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();
    
  if (orderFetchError) throw new Error("No se pudo encontrar la orden para cancelar.");
  if (!orderToCancel) throw new Error("La orden no existe o no tienes permiso para cancelarla.");
  if (orderToCancel.status !== 'pending') throw new Error("Solo se pueden cancelar pedidos que están en estado 'pendiente'.");

  const itemsToRestore = orderToCancel.order_items;
  if (itemsToRestore?.length > 0) {
    for (const item of itemsToRestore) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        console.error(`No se pudo obtener el producto ${item.product_id} para restaurar stock.`);
        continue;
      }
      
      const newStock = product.stock + item.quantity;
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id);
        
      if (updateError) {
        console.error(`Fallo al restaurar stock para el producto ${item.product_id}. Error: ${updateError.message}`);
      }
    }
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (updateError) {
    throw new Error("Se restauró el stock pero no se pudo actualizar el estado de la orden. Contacta a soporte.");
  }

  return true;
}
