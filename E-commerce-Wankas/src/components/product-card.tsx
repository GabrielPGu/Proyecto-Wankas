'use client';

import Image from 'next/image';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/context/cart-context';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';
import { useLocale } from '@/context/locale-context';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { translations } = useLocale();
  const [quantity, setQuantity] = useState('1');

  const handleAddToCart = () => {
    if (isAddToCartDisabled) return;
    const numQuantity = Math.floor(parseFloat(quantity));
    addToCart(product, numQuantity);
    setQuantity('1');
  };
  
  const handleQuantityChange = (value: string) => {
    setQuantity(value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const num = Math.floor(parseFloat(e.target.value));
    if (isNaN(num) || num < 1) {
      setQuantity('1');
    } else if (num > product.stock) {
      setQuantity(String(product.stock));
    } else {
        setQuantity(String(num));
    }
  };
  
  const numForValidation = parseFloat(quantity);
  const isInvalidQuantity = isNaN(numForValidation) || numForValidation < 1 || !Number.isInteger(numForValidation) || numForValidation > product.stock;
  const isAddToCartDisabled = product.stock <= 0 || isInvalidQuantity;


  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out h-full">
      <CardHeader className="p-0">
        <div className="aspect-video relative w-full overflow-hidden">
          <Image
            src={product.imageUrl || 'https://placehold.co/600x400.png'}
            alt={product.name}
            data-ai-hint="product item merchandise"
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-500 ease-in-out hover:scale-105"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <CardTitle className="font-headline text-xl mb-1 truncate" title={product.name}>{product.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 h-10 overflow-hidden text-ellipsis line-clamp-2">
          {product.description}
        </CardDescription>
        <div className="mt-auto">
            <p className="text-lg font-semibold text-primary">
            {translations.common.currencySymbol}{product.price.toFixed(2)}
            </p>
            {product.stock <= 0 && <p className="text-sm text-destructive mt-1">{translations.productPage.outOfStock}</p>}
            {product.stock > 0 && product.stock < 10 && <p className="text-sm text-yellow-600 mt-1">{translations.productPage.onlyLeft.replace('{stock}', product.stock.toString())}</p>}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t bg-card">
        <div className="flex items-center gap-2 w-full">
          <Input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onBlur={handleBlur}
            min="1"
            max={product.stock > 0 ? product.stock : 1}
            className="w-20 h-9 text-center border-input focus:ring-primary focus:border-primary"
            disabled={product.stock <= 0}
            aria-label={translations.common.quantityFor.replace('{itemName}', product.name)}
          />
          <Button
            onClick={handleAddToCart}
            className="flex-grow min-w-0 transition-transform transform hover:scale-105"
            disabled={isAddToCartDisabled}
            aria-label={translations.productPage.ariaLabelAddToCart.replace('{productName}', product.name)}
          >
            <PlusCircle className="mr-2 h-5 w-5" /> {translations.buttons.addToCart}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
