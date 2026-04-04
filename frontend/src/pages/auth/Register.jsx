import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Sparkles, ArrowRight, Check } from 'lucide-react';
import { authAPI } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { Spinner } from '../../components/ui';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Register() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.register(data);
      const { token, user } = res.data.data;
      login(user, token);
      toast.success(`Welcome, ${user.name}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-charcoal-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sage-500 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-white">ResumeAI</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-semibold text-white leading-tight mb-6">
            Your career upgrade<br />
            <span className="text-sage-300 italic">starts here.</span>
          </h2>
          <div className="space-y-3">
            {[
              'AI-powered resume scoring & analysis',
              'Mock interview with real-time feedback',
              'Personalized improvement suggestions',
              'Track your progress over time',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" />
                </div>
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500">Free to start. No credit card required.</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-sage-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-charcoal-800">ResumeAI</span>
          </div>

          <h2 className="font-display text-4xl font-semibold text-charcoal-800 mb-2">Create account</h2>
          <p className="text-sage-400 mb-8 text-sm">Start your career intelligence journey today</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Full name</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Arjun Sharma"
                className="input-field"
                autoComplete="name"
              />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  className="input-field pr-11"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-300 hover:text-sage-500"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? <Spinner size={18} className="text-white" /> : <>Create account <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-sage-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-sage-600 font-medium hover:text-sage-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
