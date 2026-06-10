'use client';

import Image from 'next/image';
import type { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/cart-context';
import { X } from 'lucide-react';
import { useLocale } from '@/context/locale-context';
import { useState, useEffect } from 'react';

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const { translations } = useLocale();
  const [inputValue, setInputValue] = useState(String(item.quantity));

  useEffect(() => {
    setInputValue(String(item.quantity));
  }, [item.quantity]);

  const handleBlur = () => {
    const num = parseFloat(inputValue);

    if (isNaN(num) || num < 1) {
      removeFromCart(item.id);
    } else {
      let finalQuantity = Math.floor(num);
      if (item.stock > 0 && finalQuantity > item.stock) {
        finalQuantity = item.stock;
      }
      updateQuantity(item.id, finalQuantity);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 w-full sm:w-auto sm:flex-grow">
        <div className="relative w-20 h-20 rounded-md overflow-hidden shrink-0">
          <Image 
            src={item.imageUrl || 'https://placehold.co/80x80.png'} 
            alt={translations.common.productImageAlt.replace('{itemName}', item.name)} 
            width={80}
            height={80}
            className="object-cover"
          />
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="font-headline text-lg font-semibold truncate" title={item.name}>{item.name}</h3>
          <p className="text-sm text-muted-foreground">
            {translations.common.currencySymbol}{item.price.toFixed(2)}
          </p>
          <p className="text-md font-semibold text-primary mt-1">
            {translations.common.subtotal}: {translations.common.currencySymbol}{(item.price * item.quantity).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-end">
        <div className="flex items-center">
          <Input
            type="number"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            min="1"
            max={item.stock > 0 ? item.stock : 1}
            className="w-20 h-9 text-center"
            aria-label={translations.common.quantityFor.replace('{itemName}', item.name)}
          />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => removeFromCart(item.id)} 
          className="text-destructive hover:bg-destructive/10 shrink-0" 
          aria-label={translations.common.removeLabel.replace('{itemName}', item.name)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
