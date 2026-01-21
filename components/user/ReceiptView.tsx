import React, { JSX, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  Loader2,
  Download,
  Printer,
  AlertCircle,
  XCircle,
  Clock,
  Receipt as ReceiptIcon,
  ArrowLeft,
  RefreshCw,
  X,
  CheckCircle2,
  Info
} from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { API_BASE_URL } from '../../config';

interface OrderDetails {
  order: {
    id: number;
    orderReference: string;
    planType: string;
    amount: number;
    status: string;
    paymentDate: string | null;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
  };
  plan: {
    name: string;
    description: string;
    duration_days: number | null;
  };
  user: {
    name: string;
    email: string;
  };
}

const ReceiptView: React.FC = () => {
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation(['receipt', 'common']);

  const [orderId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('order_id');
  });

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!orderId) {
      setError(t('receipt:errors.orderNotFound'));
      setIsLoading(false);
      return;
    }
    fetchOrderDetails();
    // Auto verify status shortly after load in case of redirect from payment
    setTimeout(() => verifyOrderStatus(), 2000);
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/order/${orderId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        setOrderDetails(await res.json());
      } else {
        const err = await res.json();
        setError(err.error || t('receipt:errors.loadFailed'));
      }
    } catch {
      setError(t('receipt:errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOrderStatus = async () => {
    if (!orderId) return;
    setIsVerifying(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/payment/verify-order/${orderId}`,
        { method: 'POST', credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        await fetchOrderDetails();
      }
    } catch {
      console.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToBilling = () => {
    navigate('/billing');
  };

  const handlePrint = () => {
    window.print();
  };

  // Restored strict PDF generation logic from Old Version
  const handleDownloadPDF = () => {
    const element = document.getElementById('receipt-container');
    if (!element) return;

    setIsDownloading(true);
    element.classList.add('download-mode');

    const opt = {
      margin:       0.3,
      filename:     `GogoTrip_Receipt_${orderDetails?.order.orderReference || 'download'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'avoid-all' }
    };

    html2pdf().set(opt).from(element).save()
      .then(() => {
        element.classList.remove('download-mode');
        setIsDownloading(false);
        showToast(t('receipt:messages.downloadSuccess'));
      })
      .catch((err: any) => {
        console.error('PDF generation failed:', err);
        element.classList.remove('download-mode');
        setIsDownloading(false);
        showToast(t('receipt:messages.downloadFailed'), 'error');
      });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { icon: JSX.Element; text: string; bgColor: string; textColor: string }> = {
      paid: { icon: <CheckCircle className="w-5 h-5" />, text: t('receipt:status.paymentSuccessful'), bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', textColor: 'text-emerald-700 dark:text-emerald-400' },
      active: {icon: <CheckCircle className="w-5 h-5" />,text: t('receipt:status.paymentSuccessful'),bgColor: 'bg-emerald-50',textColor: 'text-emerald-700'},
      pending: { icon: <Clock className="w-5 h-5" />, text: t('receipt:status.paymentPending'), bgColor: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-700 dark:text-amber-400' },
      failed: { icon: <XCircle className="w-5 h-5" />, text: t('receipt:status.paymentFailed'), bgColor: 'bg-red-50 dark:bg-red-900/20', textColor: 'text-red-700 dark:text-red-400' },
      cancelled: { icon: <XCircle className="w-5 h-5" />, text: t('receipt:status.paymentCancelled'), bgColor: 'bg-slate-50 dark:bg-slate-900/20', textColor: 'text-slate-700 dark:text-slate-400' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor} ${config.textColor} font-medium`}>
        {config.icon}<span>{config.text}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 dark:text-white">{t('receipt:errors.error')}</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error || t('receipt:errors.orderNotFound')}</p>
          <button onClick={handleBackToBilling} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 mx-auto">
            <ArrowLeft className="w-5 h-5" /> {t('receipt:actions.backToBilling')}
          </button>
        </div>
      </div>
    );
  }

  const { order, plan, user } = orderDetails;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 relative animate-fade-in-up">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl animate-fade-in-down transition-all ${
          toast.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/80 dark:text-red-100 dark:border-red-800 backdrop-blur-md' 
            : toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/80 dark:text-emerald-100 dark:border-emerald-800 backdrop-blur-md'
            : 'bg-white text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:text-white dark:border-slate-700 backdrop-blur-md'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5 text-sky-500" />}
          <span className="font-bold text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 p-1 bg-black/5 rounded-full"><X className="w-3 h-3" /></button>
        </div>
      )}

      {isVerifying && (
        <div className="fixed top-4 right-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-lg z-50 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /><p className="text-blue-700 dark:text-blue-400 font-medium">{t('receipt:actions.verifying')}</p>
        </div>
      )}

      {/* Toolbar Buttons */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap gap-4 print:hidden">
        <button onClick={handleBackToBilling} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> {t('receipt:actions.backToBilling')}
        </button>

        {order.status === 'pending' && (
          <button onClick={verifyOrderStatus} disabled={isVerifying} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`w-5 h-5 ${isVerifying ? 'animate-spin' : ''}`} /> {t('receipt:actions.refreshStatus')}
          </button>
        )}

        <div className="flex-1"></div>
        <button onClick={handlePrint} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
          <Printer className="w-5 h-5" /> {t('receipt:actions.print')}
        </button>
        <button onClick={handleDownloadPDF} disabled={isDownloading} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70">
          {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} {t('receipt:actions.downloadPdf')}
        </button>
      </div>

      {/* Main Receipt Container */}
      <div 
        id="receipt-container"
        ref={receiptRef}
        className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-slate-400"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 header-section">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('receipt:header.title')}</h1>
              <p className="text-blue-100">{t('receipt:header.subtitle')}</p>
            </div>
          </div>
          <div className="flex justify-center"><StatusBadge status={order.status} /></div>
        </div>

        {/* Content */}
        <div className="p-8 content-section">
          {/* Order Info */}
          <div className="mb-8 info-group">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ReceiptIcon className="w-5 h-5" /> {t('receipt:sections.orderInfo')}
            </h2>
            <div className="grid md:grid-cols-2 gap-6 grid-section">
              <div><div className="text-sm text-slate-500 mb-1">{t('receipt:fields.customerName')}</div><div className="font-medium dark:text-white">{user.name}</div></div>
              <div><div className="text-sm text-slate-500 mb-1">{t('receipt:fields.email')}</div><div className="font-medium dark:text-white">{user.email}</div></div>
              <div><div className="text-sm text-slate-500 mb-1">{t('receipt:fields.orderReference')}</div><div className="font-mono text-sm font-medium dark:text-white">{order.orderReference}</div></div>
              <div><div className="text-sm text-slate-500 mb-1">{t('receipt:fields.orderDate')}</div><div className="font-medium dark:text-white">{new Date(order.createdAt).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mb-8 info-group">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('receipt:sections.subscriptionDetails')}</h2>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 sub-card">
              <div className="flex justify-between items-start mb-4">
                <div><div className="text-xl font-bold text-slate-900 dark:text-white mb-1">{plan.name}</div><div className="text-sm text-slate-600 dark:text-slate-400">{plan.description}</div></div>
                <div className="text-right"><div className="text-2xl font-bold text-slate-900 dark:text-white">RM {order.amount.toFixed(2)}</div></div>
              </div>
              {order.status === 'active' && order.startDate && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><div className="text-sm text-slate-500 mb-1">{t('receipt:fields.validFrom')}</div><div className="font-medium dark:text-white">{new Date(order.startDate).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
                    <div><div className="text-sm text-slate-500 mb-1">{t('receipt:fields.validUntil')}</div><div className="font-medium dark:text-white">{order.endDate ? new Date(order.endDate).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' }) : <span className="text-amber-600 font-bold">{t('receipt:fields.lifetime')}</span>}</div></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 info-group">
            <div className="flex justify-between items-center mb-4"><span className="text-slate-600 dark:text-slate-400">{t('receipt:pricing.subtotal')}</span><span className="font-medium dark:text-white">RM {order.amount.toFixed(2)}</span></div>
            <div className="flex justify-between items-center mb-4"><span className="text-slate-600 dark:text-slate-400">{t('receipt:pricing.tax')}</span><span className="font-medium dark:text-white">RM 0.00</span></div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center"><span className="text-xl font-bold dark:text-white">{t('receipt:pricing.total')}</span><span className="text-2xl font-bold text-blue-600">RM {order.amount.toFixed(2)}</span></div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center footer-section">
            <p className="text-sm text-slate-500 mb-2">{t('receipt:footer.thankYou')}</p>
            <p className="text-xs text-slate-400">{t('receipt:footer.support')}</p>
          </div>
        </div>
      </div>

      {/* Styles for PDF and Print */}
      <style>{`
        /* DOWNLOAD MODE */
        .download-mode .header-section { padding: 1.5rem !important; }
        .download-mode .content-section { padding: 1.5rem !important; }
        .download-mode .info-group { margin-bottom: 1rem !important; padding-top: 1rem !important; }
        .download-mode .sub-card { padding: 1rem !important; }
        .download-mode .grid-section { gap: 0.5rem !important; }
        .download-mode h1 { font-size: 1.5rem !important; margin-bottom: 0.25rem !important; }
        .download-mode h2 { font-size: 1.1rem !important; margin-bottom: 0.5rem !important; }
        .download-mode .text-3xl { font-size: 1.5rem !important; }
        .download-mode .text-2xl { font-size: 1.25rem !important; }
        .download-mode .text-xl { font-size: 1.125rem !important; }
        .download-mode .text-lg { font-size: 1rem !important; }
        .download-mode .text-base { font-size: 0.875rem !important; }
        .download-mode .footer-section { margin-top: 1.5rem !important; padding-top: 1rem !important; }

        /* PRINT MODE */
        @media print {
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            background-color: white !important; 
            height: 100vh;
            overflow: hidden;
          }
          
          body * { visibility: hidden; }
          #receipt-container, #receipt-container * { visibility: visible; }
          
          #receipt-container {
            position: absolute !important;
            left: 50% !important;
            top: 20px !important; 
            transform: translateX(-50%) scale(0.85) !important;
            transform-origin: top center !important;
            
            width: 800px !important;
            max-width: 100% !important;
            
            margin: 0 !important;
            padding: 0 !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }

          #receipt-container .header-section { padding: 1.5rem !important; }
          #receipt-container .content-section { padding: 1.5rem !important; }
          #receipt-container .info-group { margin-bottom: 0.5rem !important; padding-top: 0.5rem !important; }
          #receipt-container .sub-card { padding: 0.8rem !important; }
          #receipt-container h1 { font-size: 1.8rem !important; margin-bottom: 5px !important; }
          #receipt-container h2 { font-size: 1.2rem !important; margin-bottom: 5px !important; }
          
          @page { size: auto; margin: 0mm; } 
        }
      `}</style>
    </div>
  );
};

export default ReceiptView;