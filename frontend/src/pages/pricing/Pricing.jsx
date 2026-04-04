import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Sparkles, Zap, Tag, X, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentAPI, couponAPI } from '../../api/payment';
import { useAuthStore } from '../../store/authStore';
import { PageLoader, Spinner } from '../../components/ui';

const PLAN_UI = {
  free: {
    icon: Sparkles,
    description: 'Perfect for getting started',
    color: 'border-cream-300',
    iconBg: 'bg-cream-100',
    iconColor: 'text-charcoal-600',
  },
  pro: {
    icon: Zap,
    description: 'Best for active job seekers',
    color: 'border-sage-400',
    iconBg: 'bg-sage-100',
    iconColor: 'text-sage-600',
    popular: true,
  },
};

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [couponCode,  setCouponCode]  = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountPercent, description }
  const user = useAuthStore((s) => s.user);

  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => paymentAPI.getSubscription().then((r) => r.data?.data || r.data),
    retry: 1,
  });

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => paymentAPI.getPlans().then((r) => r.data?.data || []),
    retry: 1,
  });

  const currentPlan = subData?.plan || 'free';

  /* ── Coupon validation ── */
  const handleValidateCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return toast.error('Enter a coupon code first');
    setCouponLoading(true);
    try {
      const res = await couponAPI.validate(code);
      const data = res.data?.data || res.data;
      setAppliedCoupon(data);
      toast.success(`🎉 Coupon applied — ${data.discountPercent}% off!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  /* ── Compute discounted price ── */
  const getDiscountedPrice = (basePrice) => {
    if (!appliedCoupon || basePrice === 0) return basePrice;
    return Math.round(basePrice * (1 - appliedCoupon.discountPercent / 100));
  };

  /* ── Upgrade / payment ── */
  const handleUpgrade = async (planKey) => {
    if (planKey === 'free' || planKey === currentPlan) return;
    setLoadingPlan(planKey);
    try {
      const res = await paymentAPI.createOrder({
        couponCode: appliedCoupon?.code || undefined,
      });
      const order = res.data?.data || res.data;

      if (!window.Razorpay) {
        toast.error('Razorpay not loaded. Please refresh and try again.');
        return;
      }

      const options = {
        key:         order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    order.currency || 'INR',
        name:        'HireCraft',
        description: `Pro Plan — 30 days${appliedCoupon ? ` (${appliedCoupon.discountPercent}% off)` : ''}`,
        order_id:    order.orderId,
        prefill:     { name: user?.name, email: user?.email },
        theme:       { color: '#4a7d55' },
        handler: async (response) => {
          try {
            await paymentAPI.verifyPayment({
              razorpayOrderId:    response.razorpay_order_id,
              razorpayPaymentId:  response.razorpay_payment_id,
              razorpaySignature:  response.razorpay_signature,
              couponCode:         appliedCoupon?.code || undefined,
            });
            toast.success('🎉 Pro plan activated!');
            setTimeout(() => window.location.reload(), 1500);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoadingPlan(null);
    }
  };

  const formatLimit = (val) =>
    val === -1 ? 'Unlimited' : val === 0 ? 'Not included' : val;

  return (
    <div className="max-w-5xl mx-auto animate-fade-up pb-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-semibold text-charcoal-800 mb-3">
          Simple, honest pricing
        </h1>
        <p className="text-sage-400 max-w-md mx-auto text-sm">
          Cancel anytime. No hidden fees. Secured by Razorpay.
        </p>
      </div>

      {/* ── Coupon box ── */}
      <div className="max-w-md mx-auto mb-10">
        {!appliedCoupon ? (
          <div className="bg-white border border-cream-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-charcoal-700 mb-3 flex items-center gap-1.5">
              <Tag size={13} className="text-sage-500" /> Have a coupon code?
            </p>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                placeholder="e.g. WELCOME20"
                className="flex-1 px-3 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-charcoal-800 placeholder-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 text-sm font-mono tracking-wider uppercase"
              />
              <button
                onClick={handleValidateCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 py-2.5 bg-sage-500 text-white rounded-xl text-sm font-semibold hover:bg-sage-600 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-sage-50 border border-sage-300 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-sage-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={18} className="text-sage-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-sage-800">
                  {appliedCoupon.discountPercent}% off applied!
                </p>
                <p className="text-xs text-sage-500 font-mono">{appliedCoupon.code}</p>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-sage-400 hover:text-sage-700 transition-colors p-1"
              title="Remove coupon"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Plans ── */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {(plansData || []).map((plan) => {
            const ui = PLAN_UI[plan.key] || PLAN_UI.free;
            const Icon = ui.icon;
            const isCurrent = currentPlan === plan.key;
            const isPending = loadingPlan === plan.key;
            const discountedPrice = getDiscountedPrice(plan.price);
            const hasDiscount = appliedCoupon && plan.price > 0 && discountedPrice !== plan.price;

            return (
              <div
                key={plan.key}
                className={`card p-6 relative flex flex-col border-2 ${ui.color} ${
                  ui.popular ? 'shadow-lg' : ''
                } transition-all`}
              >
                {ui.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-sage-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${ui.iconBg}`}>
                  <Icon size={20} className={ui.iconColor} />
                </div>

                <h3 className="font-display text-xl font-semibold text-charcoal-800">{plan.name}</h3>
                <p className="text-xs text-sage-400 mt-0.5 mb-4">{ui.description}</p>

                <div className="mb-5">
                  {plan.price === 0 ? (
                    <span className="font-display text-4xl font-bold text-charcoal-800">Free</span>
                  ) : (
                    <div className="flex items-end gap-2">
                      <span className="font-display text-4xl font-bold text-charcoal-800">
                        ₹{discountedPrice}
                      </span>
                      {hasDiscount && (
                        <span className="text-lg text-sage-400 line-through mb-1">₹{plan.price}</span>
                      )}
                      <span className="text-sm text-sage-400 mb-1">/30 days</span>
                    </div>
                  )}
                  {hasDiscount && (
                    <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {appliedCoupon.discountPercent}% off with {appliedCoupon.code}
                    </span>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {(plan.features || []).map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={10} className="text-sage-600" />
                      </div>
                      <span className="text-sm text-sage-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={isCurrent || isPending || plan.price === 0}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2
                    ${isCurrent
                      ? 'bg-cream-200 text-sage-500 cursor-default'
                      : ui.popular
                      ? 'btn-primary'
                      : 'btn-secondary'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isPending ? (
                    <Spinner size={16} className={ui.popular ? 'text-white' : ''} />
                  ) : isCurrent ? (
                    '✓ Current Plan'
                  ) : plan.price === 0 ? (
                    'Free Forever'
                  ) : (
                    `Upgrade to Pro${hasDiscount ? ` — ₹${discountedPrice}` : ''}`
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {subData?.plan === 'pro' && subData?.currentPeriodEnd && (
        <div className="text-center mt-8">
          <p className="text-sm text-sage-400">
            Your Pro plan is active until{' '}
            <strong>
              {new Date(subData.currentPeriodEnd).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </strong>
          </p>
        </div>
      )}

      <p className="text-center text-xs text-sage-400 mt-10">
        Payments secured by Razorpay · All prices in INR · GST as applicable
      </p>
    </div>
  );
}
