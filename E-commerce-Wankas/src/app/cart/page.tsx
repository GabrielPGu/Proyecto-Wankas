'use client';

import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { CartItemCard } from '@/components/cart-item-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useLocale } from '@/context/locale-context';

export default function CartPage() {
  const { cartItems, getCartTotal, getItemCount, clearCart } = useCart();
  const { translations } = useLocale();
  const total = getCartTotal();
  const itemCount = getItemCount();
  const itemText = itemCount === 1 ? translations.common.item : translations.common.items;

  if (itemCount === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
        <h1 className="font-headline text-3xl font-bold text-primary mb-2">{translations.cartPage.emptyTitle}</h1>
        <p className="text-lg text-muted-foreground mb-6">{translations.cartPage.emptyTagline}</p>
        <Button asChild size="lg">
          <Link href="/products">{translations.buttons.startShopping}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      <div className="md:col-span-2 space-y-6">
        <h1 className="font-headline text-3xl font-bold text-primary">
          {translations.cartPage.yourCart.replace('{itemCount}', `${itemCount} ${itemText}`)}
        </h1>
        {cartItems.map(item => (
          <CartItemCard key={item.id} item={item} />
        ))}
         <Button variant="outline" onClick={clearCart} className="text-destructive border-destructive hover:bg-destructive/10">
          {translations.buttons.clearCart}
        </Button>
      </div>

      <Card className="sticky top-24 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{translations.cartPage.orderSummary}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{translations.common.subtotal} ({itemCount} {itemText})</span>
            <span>{translations.common.currencySymbol}{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{translations.cartPage.shipping}</span>
            <span className="text-green-600">{translations.cartPage.shippingPickup}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>{translations.common.total}</span>
            <span>{translations.common.currencySymbol}{total.toFixed(2)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild size="lg" className="w-full">
            <Link href="/checkout">
              {translations.buttons.proceedToCheckout} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
