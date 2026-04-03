import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentAPI } from '../../api/payment';
import { useAuthStore } from '../../store/authStore';
import { PageLoader, Spinner } from '../../components/ui';

const defaultPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: '₹',
    period: 'forever',
    icon: Sparkles,
    description: 'Perfect for getting started',
    features: ['2 resume uploads', '1 interview session', 'Basic ATS score', 'PDF download'],
    cta: 'Current Plan',
    disabled: true,
    color: 'border-cream-300',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,  // Your backend charges ₹999
    currency: '₹',
    period: 'month',
    icon: Zap,
    description: 'Best for active job seekers',
    features: ['Unlimited resume uploads', '10 interview sessions/mo', 'Full AI analysis', 'Keyword optimization', 'Priority support', 'Interview report PDF'],
    cta: 'Upgrade to Pro',
    popular: true,
    color: 'border-sage-400',
  },
];

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const user = useAuthStore((s) => s.user);

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => paymentAPI.getPlans().then((r) => r.data),
    retry: 1,
  });

  const plans = plansData?.plans || defaultPlans;

  const handlePurchase = async (plan) => {
    if (!plan.price || plan.disabled) return;
    setLoadingPlan(plan.id);
    
    try {
      // Create order - no planId needed
      const res = await paymentAPI.createOrder();
      const orderData = res.data?.data || res.data;
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderData?.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'HireCraft',
        description: `${plan.name} Plan - Pro Upgrade`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#4a7d55' },
        handler: async (response) => {
          try {
            await paymentAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success(`🎉 ${plan.name} plan activated!`);
            // Refresh user data
            setTimeout(() => window.location.reload(), 1500);
          } catch (err) {
            console.error('Verification error:', err);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
      };

      if (!window.Razorpay) {
        toast.error('Razorpay not loaded. Please refresh and try again.');
        return;
      }
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Order creation error:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-semibold text-charcoal-800 mb-3">Simple, honest pricing</h1>
        <p className="text-sage-400 max-w-md mx-auto">
          Invest in your career. Cancel anytime, no hidden fees.
        </p>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon || Sparkles;
            const isLoading = loadingPlan === plan.id;
            const isCurrent = user?.plan === plan.id;

            return (
              <div
                key={plan.id}
                className={`card p-6 relative flex flex-col border-2 ${plan.color} ${plan.popular ? 'shadow-lg scale-[1.02]' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-sage-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${plan.popular ? 'bg-sage-100' : plan.id === 'premium' ? 'bg-warm-50' : 'bg-cream-200'}`}>
                  <Icon size={20} className={plan.popular ? 'text-sage-500' : plan.id === 'premium' ? 'text-warm-500' : 'text-charcoal-800'} />
                </div>

                <h3 className="font-display text-xl font-semibold text-charcoal-800">{plan.name}</h3>
                <p className="text-xs text-sage-400 mt-0.5 mb-4">{plan.description}</p>

                <div className="mb-5">
                  <span className="font-display text-4xl font-bold text-charcoal-800">
                    {plan.currency}{plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-sage-400 ml-1">/{plan.period}</span>
                  )}
                  {plan.price === 0 && <span className="text-sm text-sage-400 ml-1">free</span>}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={10} className="text-sage-600" />
                      </div>
                      <span className="text-sm text-sage-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={isLoading || isCurrent || plan.disabled}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2
                    ${isCurrent ? 'bg-cream-200 text-sage-500 cursor-default' :
                      plan.popular ? 'btn-primary' :
                      plan.id === 'premium' ? 'btn-warm' :
                      'btn-secondary'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isLoading ? <Spinner size={16} className={plan.popular ? 'text-white' : ''} /> : isCurrent ? '✓ Current Plan' : plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-sage-400 mt-10">
        Payments secured by Razorpay. All prices in INR. GST as applicable.
      </p>
    </div>
  );
}
