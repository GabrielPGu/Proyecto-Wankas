'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreSelector } from '@/components/store-selector';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';
import { ClipboardCheck, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/context/locale-context';
import { timeSlots } from '@/data/stores'; 
import { placeOrderWithStockUpdate } from '@/services/orderService';
import type { Order } from '@/types';

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart, getItemCount } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { translations } = useLocale();

  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string | undefined>(undefined);
  const [pickupDate, setPickupDate] = useState<Date | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const total = getCartTotal();
  const itemCount = getItemCount();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push(`/login?redirect=/checkout`);
      return;
    }

    if (itemCount === 0 && !isProcessing) {
      router.push('/products');
    }
  }, [user, authLoading, itemCount, isProcessing, router]);

  if (authLoading || (!user && !authLoading) || (itemCount === 0 && !isProcessing)) {
    let loadingText = translations.checkoutPage.loadingUser;
    if (!authLoading && !user) {
      loadingText = translations.checkoutPage.redirectToLogin;
    } else if (!authLoading && user && itemCount === 0) {
      loadingText = translations.checkoutPage.cartEmptyRedirect;
    }
    return <Loader text={loadingText} className="min-h-[50vh]" />;
  }
  
  if (!user) return null;

  const handleSelectionChange = (selection: { timeSlotId: string; pickupDate: Date } | null) => {
    if (selection) {
      setSelectedTimeSlotId(selection.timeSlotId);
      setPickupDate(selection.pickupDate);
    } else {
      setSelectedTimeSlotId(undefined);
      setPickupDate(undefined);
    }
  };

  const convertTimeSlotToPickupDate = (timeSlotId: string, baseDate: Date): string | null => {
    const selectedSlot = timeSlots.find(slot => slot.id === timeSlotId);
    if (!selectedSlot) return null;

    const dateForPickup = new Date(baseDate);
    const timeString = selectedSlot.time.split(' - ')[0];
    
    const [time, modifier] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0; 

    dateForPickup.setHours(hours, minutes, 0, 0);
    return dateForPickup.toISOString(); 
  };


  const handlePlaceOrder = async () => {
    if (!selectedStoreId || !selectedTimeSlotId || !pickupDate) {
      toast({
        title: translations.checkoutPage.missingInfoTitle,
        description: translations.checkoutPage.missingInfoDesc,
        variant: 'destructive',
      });
      return;
    }
    if (!user || !user.id) { 
        toast({ title: translations.common.error, description: translations.checkoutPage.userNotAuthenticated, variant: "destructive" });
        return;
    }

    const finalPickupDateISO = convertTimeSlotToPickupDate(selectedTimeSlotId, pickupDate);
    if (!finalPickupDateISO) {
      toast({
        title: translations.common.error,
        description: translations.checkoutPage.invalidTimeSlot,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_date' | 'status' | 'notes'> = {
          user_id: user.id,
          location_id: selectedStoreId,
          pickup_date: finalPickupDateISO,
          total_price: total,
      };

      await placeOrderWithStockUpdate(orderData, cartItems);

      clearCart();
      toast({
        title: translations.checkoutPage.orderPlacedTitle,
        description: translations.checkoutPage.orderPlacedDesc,
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push('/profile')}>
            {translations.buttons.viewOrders}
          </Button>
        ),
      });
      router.push('/profile?orderSuccess=true');

    } catch (error: any) {
        console.error('Failed to place order:', error);
        toast({
            title: translations.checkoutPage.orderErrorTitle,
            description: error.message || translations.checkoutPage.orderErrorFallback,
            variant: 'destructive',
        });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold text-primary">{translations.checkoutPage.title}</h1>
        <p className="text-lg text-muted-foreground">{translations.checkoutPage.tagline}</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
          <StoreSelector
            selectedStoreId={selectedStoreId}
            onStoreSelect={(id) => {
              setSelectedStoreId(id);
              handleSelectionChange(null);
            }}
            selectedTimeSlotId={selectedTimeSlotId}
            onSelectionChange={handleSelectionChange}
          />
          
          <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center">
                    <ClipboardCheck className="mr-2 h-6 w-6 text-primary" />
                    {translations.checkoutPage.paymentInfoTitle} 
                </CardTitle>
                <CardDescription>{translations.checkoutPage.paymentInfoDesc}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700 flex items-start">
                    <Info className="h-5 w-5 mr-3 mt-0.5 shrink-0 text-blue-600" />
                    <span>{translations.checkoutPage.pickupAndPayInfo}</span>
                </div>
            </CardContent>
          </Card>
        </div>

        <Card className="sticky top-24 shadow-lg md:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline text-xl">{translations.cartPage.orderSummary}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="truncate max-w-[150px]" title={item.name}>{item.name} (x{item.quantity})</span>
                <span>{translations.common.currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>{translations.common.subtotal}</span>
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
            <Button 
              size="lg" 
              className="w-full" 
              onClick={handlePlaceOrder} 
              disabled={isProcessing || !selectedStoreId || !selectedTimeSlotId || !pickupDate || !user}
            >
              {isProcessing ? (
                <Loader size={20} className="mr-2" />
              ) : (
                <CheckCircle className="mr-2 h-5 w-5" />
              )}
              {isProcessing ? translations.checkoutPage.processing : translations.buttons.placeOrder}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
