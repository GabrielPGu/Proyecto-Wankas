'use client';

import type { EnrichedOrder } from '@/services/orderService'; 
import type { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { format } from 'date-fns';
import { es as esLocaleDate, enUS as enLocaleDate } from 'date-fns/locale'; 
import { useLocale } from '@/context/locale-context';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, MapPin as LocationIcon, Hash, DollarSign, ListOrdered, Info, FileText, XCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react'; 
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BoletaTemplate } from './boleta-template';
import { Loader } from './ui/loader';


interface OrderHistoryCardProps {
  order: EnrichedOrder;
  currentUser: User | null;
  onOrderCancelled?: (orderId: string) => Promise<boolean>; 
}

function getStatusVariant(status?: string): "default" | "secondary" | "destructive" {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'delivered':
    case 'completado':
    case 'entregado':
      return "default"; 
    case 'pending':
    case 'processing':
    case 'pendiente':
    case 'procesando':
      return "secondary"; 
    case 'cancelled':
    case 'failed':
    case 'cancelado':
    case 'fallido':
      return "destructive";
    default:
      return "secondary";
  }
}

export function OrderHistoryCard({ order: initialOrder, currentUser, onOrderCancelled }: OrderHistoryCardProps) {
  const { translations, locale } = useLocale();
  const { toast } = useToast();
  const displayLocale = locale === 'es' ? esLocaleDate : enLocaleDate;
  
  const [order, setOrder] = useState<EnrichedOrder>(initialOrder);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const boletaRenderRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);


  const formatDate = (dateString?: string) => {
    if (!dateString) return translations.profilePage.dateNotAvailable;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string received for formatting:", dateString);
        return dateString;
      }
      return format(date, 'PPpp', { locale: displayLocale });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString; 
    }
  };
  
  const getTranslatedStatus = (status?: string): string => {
    if (!status) return translations.profilePage.statusUnknown;
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
        case 'pending': return translations.profilePage.statusPending;
        case 'completed': return translations.profilePage.statusCompleted;
        case 'delivered': return translations.profilePage.statusDelivered;
        case 'cancelled': return translations.profilePage.statusCancelled;
        case 'processing': return translations.profilePage.statusProcessing;
        case 'failed': return translations.profilePage.statusFailed;
        case translations.profilePage.statusPending.toLowerCase(): return translations.profilePage.statusPending;
        case translations.profilePage.statusCompleted.toLowerCase(): return translations.profilePage.statusCompleted;
        case translations.profilePage.statusDelivered.toLowerCase(): return translations.profilePage.statusDelivered;
        case translations.profilePage.statusCancelled.toLowerCase(): return translations.profilePage.statusCancelled;
        case translations.profilePage.statusProcessing.toLowerCase(): return translations.profilePage.statusProcessing;
        case translations.profilePage.statusFailed.toLowerCase(): return translations.profilePage.statusFailed;
        default: return status;
    }
  };

  const handleGenerateBoleta = async () => {
    if (!boletaRenderRef.current) { 
        toast({ title: translations.common.error, description: translations.profilePage.boletaGenerationError, variant: "destructive"});
        return;
    }
    setIsGeneratingPdf(true); 

    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (!boletaRenderRef.current || boletaRenderRef.current.children.length === 0) {
        console.error("Boleta template not rendered or empty.");
        toast({ title: translations.common.error, description: translations.profilePage.boletaGenerationError, variant: "destructive"});
        setIsGeneratingPdf(false);
        return;
    }
    
    const elementToCapture = boletaRenderRef.current.firstChild as HTMLElement; 
    if (!elementToCapture) {
      console.error("Boleta template's first child (the actual boleta div) not found.");
      toast({ title: translations.common.error, description: translations.profilePage.boletaGenerationError, variant: "destructive"});
      setIsGeneratingPdf(false);
      return;
    }

    try {
        const canvas = await html2canvas(elementToCapture, { 
            scale: 2, 
            useCORS: true, 
            logging: false, 
            backgroundColor: '#ffffff', 
            scrollX: 0, 
            scrollY: -window.scrollY, 
            windowWidth: elementToCapture.scrollWidth,
            windowHeight: elementToCapture.scrollHeight,
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt', 
            format: 'a4' 
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        const margin = 40;
        const availableWidth = pdfWidth - (margin * 2);
        const availableHeight = pdfHeight - (margin * 2);

        let imgFinalWidth, imgFinalHeight;

        if (canvasWidth / canvasHeight > availableWidth / availableHeight) {
            imgFinalWidth = availableWidth;
            imgFinalHeight = imgFinalWidth * (canvasHeight / canvasWidth);
        } else {
            imgFinalHeight = availableHeight;
            imgFinalWidth = imgFinalHeight * (canvasWidth / canvasHeight);
        }
        
        const x = (pdfWidth - imgFinalWidth) / 2;
        const y = margin; 

        pdf.addImage(imgData, 'PNG', x, y, imgFinalWidth, imgFinalHeight);
        pdf.save(`boleta-orden-${order.id.split('-').pop()?.toUpperCase()}.pdf`);
        toast({ title: translations.profilePage.boletaGeneratedTitle, description: translations.profilePage.boletaGeneratedDesc });

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ title: translations.common.error, description: translations.profilePage.boletaGenerationError + (error instanceof Error ? `: ${error.message}`: ''), variant: 'destructive'});
    } finally {
        setIsGeneratingPdf(false); 
    }
  };


  const handleCancelOrder = async () => {
    if (!onOrderCancelled) {
      console.warn("onOrderCancelled prop not provided to OrderHistoryCard.");
      toast({ title: translations.common.error, description: translations.profilePage.orderCancellationFailedDesc, variant: "destructive"});
      return;
    }
    
    setIsCancelling(true);
    const success = await onOrderCancelled(order.id);
    if (success) {
    }
    setIsCancelling(false);
  };


  const orderIdLastPortion = order.id?.split('-').pop()?.toUpperCase() || order.id || 'N/A';
  const translatedStatus = getTranslatedStatus(order.status);
  const isPending = order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === translations.profilePage.statusPending.toLowerCase();

  return (
    <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <CardHeader className="bg-card/80 rounded-t-lg p-4 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="font-headline text-xl md:text-2xl text-primary flex items-center">
               <Hash className="mr-2 h-5 w-5"/> {translations.profilePage.orderIdLabelNumber} {orderIdLastPortion}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              <CalendarDays className="inline mr-1 h-3 w-3" /> 
              {translations.profilePage.placedOnLabel} {formatDate(order.order_date)}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(order.status)} className="mt-2 sm:mt-0 text-sm px-3 py-1 self-start sm:self-center">
            {translations.profilePage.statusLabel} {translatedStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold flex items-center"><DollarSign className="mr-2 h-4 w-4 text-primary" />{translations.common.total}:</p>
            <p>{translations.common.currencySymbol}{(order.total_price ?? 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="font-semibold flex items-center"><LocationIcon className="mr-2 h-4 w-4 text-primary" />{translations.profilePage.pickupLocationLabel}:</p>
            <p>{order.location_name || translations.profilePage.locationNotAvailable}</p>
            {order.location_address && <p className="text-xs text-muted-foreground">{order.location_address}</p>}
          </div>
          <div>
            <p className="font-semibold flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />{translations.profilePage.pickupDateLabel}:</p>
            <p>{formatDate(order.pickup_date)}</p>
          </div>
           {order.notes && (
           <div className="md:col-span-2">
            <p className="font-semibold flex items-center"><Info className="mr-2 h-4 w-4 text-primary" />{translations.profilePage.notesLabel}:</p>
            <p className="text-sm text-muted-foreground p-2 bg-muted/10 border border-border rounded-md whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}
        </div>

        <Accordion type="single" collapsible className="w-full pt-2">
          <AccordionItem value="items">
            <AccordionTrigger className="text-md font-semibold hover:no-underline text-foreground/90">
              <div className="flex items-center">
                <ListOrdered className="mr-2 h-5 w-5 text-primary" />
                {translations.profilePage.viewOrderItemsLabel} ({(order.items ?? []).length} {(order.items ?? []).length === 1 ? translations.common.item : translations.common.items})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {(order.items && order.items.length > 0) ? (
                <ul className="space-y-3 pt-3">
                  {order.items.map((item, index) => (
                    <li key={`${item.product_id}-${index}`} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 shadow-sm">
                        <Image
                          src={item.productImageUrl || 'https://placehold.co/64x64.png'}
                          alt={item.productName || translations.productPage.noProductsFound}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold truncate" title={item.productName}>{item.productName || translations.productPage.noProductsFound}</p>
                        <p className="text-xs text-muted-foreground">
                          {translations.common.quantity}: {item.quantity} &times; {translations.common.currencySymbol}{(item.price_at_purchase ?? 0).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-primary shrink-0">
                        {translations.common.currencySymbol}{((item.quantity ?? 0) * (item.price_at_purchase ?? 0)).toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">{translations.profilePage.noItemsInOrder}</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex flex-wrap gap-2 pt-3">
            <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateBoleta}
                disabled={isGeneratingPdf}
            >
                {isGeneratingPdf ? <Loader size={16} className="mr-2" /> : <FileText className="mr-2 h-4 w-4" />}
                {isGeneratingPdf ? translations.profilePage.generatingBoletaButton : translations.profilePage.generateBoletaButton}
            </Button>
            {isPending && (
                 <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelOrder}
                    disabled={isCancelling || isGeneratingPdf} 
                >
                    {isCancelling ? <Loader size={16} className="mr-2" /> : <XCircle className="mr-2 h-4 w-4" />}
                    {isCancelling ? translations.profilePage.cancellingOrderButton : translations.profilePage.cancelOrderButton}
                </Button>
            )}
        </div>
      </CardContent>
      <div 
        ref={boletaRenderRef} 
        style={{ 
            position: 'fixed', 
            left: '-3000px', 
            top: 0, 
            zIndex: -10, 
            width: '800px', 
            padding: 0, 
            background: 'white', 
            opacity: 0, 
            pointerEvents: 'none', 
         }}
        aria-hidden="true"
        >
        {isGeneratingPdf && <BoletaTemplate order={order} currentUser={currentUser} translations={translations} localeUsed={locale}/>}
      </div>
    </Card>
  );
}
