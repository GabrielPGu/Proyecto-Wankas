import type { LucideIcon } from 'lucide-react';
import type { en } from '../locales/en';

export type NavTranslationKey = keyof typeof en.nav;


export interface NavItem {
  titleKey: NavTranslationKey;
  href: string;
  icon?: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  authRequired?: boolean;
  hideWhenAuthed?: boolean;
}

export interface Product {
  id: string; 
  name: string; 
  description: string; 
  price: number; 
  imageUrl: string; 
  category: string; 
  stock: number; 
}

export interface CartItem extends Product {
  quantity: number;
}

export interface StoreLocation {
  id: string; 
  name: string; 
  address: string; 
  operatingHours: string; 
  latitude?: number | null; 
  longitude?: number | null; 
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface User {
  id: string; 
  email?: string | null; 
  name?: string | null; 
  phone_number?: string | null; 
}

export interface IdentifiedItem {
  name: string;
  aiOriginalName: string;
  dbProduct?: Product;
  quantityToAddToCart?: number;
}


export interface Recipe {
  recipeName: string;
  servings: number;
  ingredients: string[];
  preparationSteps: string[];
}

export interface IngredientActionItem {
  aiName: string;
  dbProduct?: Product;
  quantityToAddToCart: number;
}


export interface Order {
  id: string; 
  user_id: string; 
  location_id: string; 
  order_date?: string; 
  pickup_date: string; 
  status?: string; 
  total_price: number; 
  notes?: string | null; 
  created_at?: string; 
  updated_at?: string; 
}

export interface OrderItem {
  order_id: string; 
  product_id: string; 
  quantity: number; 
  price_at_purchase: number; 
}

export interface EnrichedOrderItem extends OrderItem {
  productName?: string; 
  productImageUrl?: string; 
}

export interface EnrichedOrder extends Order {
  items: EnrichedOrderItem[];
  location_name?: string; 
  location_address?: string;
}
