'use client';

import type { CartItem, Product } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocale } from './locale-context'; 


interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const { toast } = useToast();
  const { translations } = useLocale();


  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('wankas-cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
      localStorage.removeItem('wankas-cart');
    } finally {
      setIsCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem('wankas-cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isCartLoaded]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevItems, { ...product, quantity }];
    });
    toast({ 
      title: translations.myPantryPage.addedToCartTitle, 
      description: translations.myPantryPage.addedToCartDesc.replace('{productName}', product.name) 
    });
  };

  const removeFromCart = (productId: string) => {
    const removedItem = cartItems.find(item => item.id === productId);
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    if (removedItem) {
      toast({ 
        title: translations.myPantryPage.removedFromCartTitle, 
        description: translations.myPantryPage.removedFromCartDesc
      });
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    toast({ 
      title: translations.myPantryPage.cartClearedTitle, 
      description: translations.myPantryPage.cartClearedDesc
    });
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getItemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
