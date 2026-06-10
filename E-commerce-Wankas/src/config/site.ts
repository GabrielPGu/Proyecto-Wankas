import type { NavItem } from '@/types';
import { Package, Home, ShoppingCart, User, UploadCloud } from 'lucide-react';

export const FALLBACK_SITE_TITLE = "Wanka's Compras Inteligentes"; 

export const mainNav: NavItem[] = [
  {
    titleKey: 'home',
    href: '/',
    icon: Home,
  },
  {
    titleKey: 'products',
    href: '/products',
    icon: Package,
  },
  {
    titleKey: 'myPantry',
    href: '/my-pantry',
    icon: UploadCloud,
    authRequired: true,
  },
];

export const userNav: NavItem[] = [
  {
    titleKey: 'cart',
    href: '/cart',
    icon: ShoppingCart,
  },
  {
    titleKey: 'profile',
    href: '/profile',
    icon: User,
    authRequired: true,
  },
  {
    titleKey: 'login',
    href: '/login',
    hideWhenAuthed: true,
  },
  {
    titleKey: 'register',
    href: '/register',
    hideWhenAuthed: true,
  },
];
