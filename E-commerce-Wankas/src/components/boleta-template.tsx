import type { EnrichedOrder } from '@/services/orderService';
import type { Translations } from '@/locales/en';
import type { User } from '@/types';
import React from 'react';
import { format } from 'date-fns';
import { es as esLocaleDate, enUS as enLocaleDate } from 'date-fns/locale';

interface BoletaTemplateProps {
  order: EnrichedOrder;
  currentUser: User | null;
  translations: Translations;
  localeUsed: 'es' | 'en';
}

const formatDate = (dateString?: string, locale: 'es' | 'en' = 'es', pattern: string = 'dd/MM/yyyy') => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const dtfLocale = locale === 'es' ? esLocaleDate : enLocaleDate;
    return format(date, pattern, { locale: dtfLocale });
  } catch (e) {
    return dateString;
  }
};

export const BoletaTemplate: React.FC<BoletaTemplateProps> = ({ order, currentUser, translations, localeUsed }) => {
  const logoUrl = "https://rujqfdpeyoekhzesiorf.supabase.co/storage/v1/object/public/product-images/logo.jpeg";
  const orderIdShort = order.id.split('-').pop()?.toUpperCase();
  
  const primaryColor = '#D4AC0D';
  const textColor = '#333333';
  const lightTextColor = '#555555';
  const borderColor = '#e0e0e0';
  const lightBgColor = '#f9f9f9';

  const storeInfo = {
    tel: translations.profilePage.boletaStorePhone,
    email: translations.profilePage.boletaStoreEmail,
    ruc: translations.profilePage.boletaStoreRUC,
    onlineTag: translations.profilePage.boletaOnlineTagline,
    pickupTag: translations.profilePage.boletaPickupTag,
  };

  const styles: { [key: string]: React.CSSProperties } = {
    boletaContainer: {
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      width: '780px',
      margin: '0 auto',
      padding: '40px',
      border: `1px solid ${borderColor}`,
      boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
      fontSize: '12px',
      lineHeight: '1.6',
      color: textColor,
      backgroundColor: '#ffffff',
      position: 'relative',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '25px',
      paddingBottom: '20px',
      borderBottom: `1px solid ${borderColor}`,
    },
    headerLeft: {
      textAlign: 'left',
    },
    logo: {
      width: '180px',
      marginBottom: '10px',
    },
    storeTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: primaryColor,
      margin: '0 0 5px 0',
      fontFamily: "Georgia, Times, 'Times New Roman', serif",
    },
    storeTagHighlight: {
      backgroundColor: 'rgba(212, 172, 13, 0.1)',
      color: primaryColor,
      padding: '4px 10px',
      borderRadius: '5px',
      fontWeight: 'bold',
      fontSize: '11px',
      display: 'inline-block',
      margin: '5px 0',
      border: `1px solid ${primaryColor}`,
    },
    contactInfo: {
      fontSize: '10px',
      color: lightTextColor,
      lineHeight: '1.4',
      marginTop: '8px',
    },
    headerRight: {
      textAlign: 'right',
      border: `1px solid ${borderColor}`,
      padding: '12px 18px',
      borderRadius: '6px',
      backgroundColor: lightBgColor,
    },
    orderReceiptTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      color: textColor,
      marginBottom: '4px',
    },
    orderId: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: primaryColor,
      marginBottom: '8px',
    },
    statusBadge: {
      backgroundColor: '#FFF3CD',
      color: '#856404',
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold',
      display: 'inline-block',
    },
    dateSection: {
      fontSize: '11px',
      marginTop: '10px',
      color: lightTextColor,
    },
    section: {
      marginBottom: '25px',
    },
    sectionTitle: {
      fontSize: '15px',
      fontWeight: 'bold',
      color: textColor,
      borderBottom: `1.5px solid ${primaryColor}`,
      paddingBottom: '6px',
      marginBottom: '12px',
      textTransform: 'uppercase',
    },
    detailGrid: {
      display: 'grid',
      gridTemplateColumns: '130px 1fr',
      gap: '6px 10px',
      fontSize: '12px',
    },
    detailLabel: {
      fontWeight: 'bold',
      color: '#444',
    },
    detailValue: {
      color: textColor,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '8px',
      fontSize: '11px',
    },
    th: {
      borderBottom: `2px solid ${textColor}`,
      padding: '10px 6px',
      textAlign: 'left',
      fontWeight: 'bold',
      color: textColor,
      backgroundColor: lightBgColor,
      textTransform: 'uppercase',
    },
    td: {
      padding: '10px 6px',
      borderBottom: `1px solid ${borderColor}`,
      textAlign: 'left',
    },
    textRight: { textAlign: 'right' },
    textCenter: { textAlign: 'center' },
    totalsSection: {
      marginTop: '20px',
      paddingTop: '15px',
      borderTop: `1px dashed ${borderColor}`,
      width: '45%',
      marginLeft: 'auto',
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '12px',
      fontWeight: 'normal',
      marginBottom: '6px',
    },
    grandTotalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '16px',
      fontWeight: 'bold',
      color: primaryColor,
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: `1.5px solid ${textColor}`,
    },
    notPaidStamp: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(-30deg)',
      fontSize: '80px',
      fontWeight: 'bold',
      color: 'rgba(255, 0, 0, 0.1)',
      border: '10px solid rgba(255, 0, 0, 0.1)',
      padding: '15px 25px',
      borderRadius: '10px',
      zIndex: 1,
      pointerEvents: 'none',
      textTransform: 'uppercase',
      letterSpacing: '3px',
      textAlign: 'center',
      lineHeight: '1',
    },
    footer: {
      marginTop: '30px',
      textAlign: 'center',
      fontSize: '10px',
      color: lightTextColor,
      borderTop: `1px solid ${borderColor}`,
      paddingTop: '15px',
    },
  };

  return (
    <div style={styles.boletaContainer}>
      <div style={styles.notPaidStamp}>{translations.profilePage.boletaStatusNotPaid}</div>

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={logoUrl} alt={translations.SITE_TITLE} style={styles.logo} crossOrigin="anonymous" />
          <div style={styles.storeTitle}>{translations.profilePage.boletaStoreName.toUpperCase()}</div>
          <div style={styles.storeTagHighlight}>{storeInfo.onlineTag}</div>
          <div style={styles.storeTagHighlight} dangerouslySetInnerHTML={{ __html: storeInfo.pickupTag.replace(" - ", "<br/>") }}></div>
          <div style={styles.contactInfo}>
            RUC: {storeInfo.ruc}<br />
            Tel: {storeInfo.tel}<br />
            Email: {storeInfo.email}
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.orderReceiptTitle}>{translations.profilePage.boletaOrderTitle}</div>
          <div style={styles.orderId}>{translations.profilePage.boletaOrderNumLabel} WK-WEB-{orderIdShort}</div>
          <div style={styles.statusBadge}>{translations.profilePage.boletaStatusPendingPay}</div>
          <div style={styles.dateSection}>
            <div>{translations.profilePage.boletaDateLabel}: {formatDate(order.order_date, localeUsed)}</div>
            <div>{translations.profilePage.boletaTimeLabel}: {formatDate(order.order_date, localeUsed, 'HH:mm')}</div>
          </div>
        </div>
      </div>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{translations.profilePage.boletaClientDetailsTitle}</h3>
        <div style={styles.detailGrid}>
          <span style={styles.detailLabel}>{translations.profilePage.boletaClientNameLabel}:</span>
          <span style={styles.detailValue}>{currentUser?.name || translations.profilePage.boletaClientNamePlaceholder}</span>
          
          <span style={styles.detailLabel}>{translations.profilePage.boletaClientEmailLabel}:</span>
          <span style={styles.detailValue}>{currentUser?.email || translations.profilePage.boletaClientEmailPlaceholder}</span>
          
          <span style={styles.detailLabel}>{translations.profilePage.boletaClientPhoneLabel}:</span>
          <span style={styles.detailValue}>{currentUser?.phone_number || translations.profilePage.boletaClientPhonePlaceholder}</span>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{translations.profilePage.boletaPickupLocationTitle}</h3>
        <div style={styles.detailGrid}>
            <span style={styles.detailLabel}>{translations.profilePage.boletaStoreLabel}:</span>
            <span style={styles.detailValue}>{order.location_name || translations.profilePage.locationNotAvailable}</span>
            <span style={styles.detailLabel}>{translations.profilePage.boletaAddressLabel}:</span>
            <span style={styles.detailValue}>{order.location_address || translations.profilePage.boletaPickupAddressPlaceholder}</span>
            <span style={styles.detailLabel}>{translations.profilePage.boletaPickupDateShortLabel}:</span>
            <span style={styles.detailValue}>{formatDate(order.pickup_date, localeUsed, 'dd/MM/yyyy HH:mm')}</span>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{translations.profilePage.orderItemsTitle}</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.th, ...styles.textCenter, width: '10%'}}>{translations.profilePage.boletaQtyHeader}</th>
              <th style={{...styles.th, width: '50%'}}>{translations.profilePage.boletaDescHeader}</th>
              <th style={{...styles.th, ...styles.textRight, width: '20%'}}>{translations.profilePage.boletaUnitPrice}</th>
              <th style={{...styles.th, ...styles.textRight, width: '20%'}}>{translations.common.total}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={`${item.product_id}-${index}`}>
                <td style={{...styles.td, ...styles.textCenter}}>{item.quantity}</td>
                <td style={styles.td}>{item.productName || 'N/A'}</td>
                <td style={{...styles.td, ...styles.textRight}}>{translations.common.currencySymbol}{(item.price_at_purchase ?? 0).toFixed(2)}</td>
                <td style={{...styles.td, ...styles.textRight, fontWeight: 'bold'}}>{translations.common.currencySymbol}{((item.quantity ?? 0) * (item.price_at_purchase ?? 0)).toFixed(2)}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 3 - order.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`}><td colSpan={4} style={{...styles.td, height: '30px', borderBottom: `1px solid ${borderColor}` }}>&nbsp;</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.totalsSection}>
        <div style={styles.totalRow}>
            <span>{translations.common.subtotal}:</span>
            <span>{translations.common.currencySymbol}{(order.total_price ?? 0).toFixed(2)}</span>
        </div>
        <div style={styles.grandTotalRow}>
            <span>{translations.profilePage.boletaTotalToPayLabel}:</span>
            <span>{translations.common.currencySymbol}{(order.total_price ?? 0).toFixed(2)}</span>
        </div>
      </div>
      
      <div style={styles.footer}>
        <p>{translations.profilePage.boletaFooterThanks}</p>
        <p>{translations.profilePage.boletaFooterDisclaimer}</p>
      </div>
    </div>
  );
};
