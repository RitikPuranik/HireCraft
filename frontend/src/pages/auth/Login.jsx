import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { authAPI } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { Spinner } from '../../components/ui';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
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
      const res = await authAPI.login(data);
      const { token, user } = res.data.data;
      login(user, token);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-sage-500 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-white">ResumeAI</span>
        </div>
        <div>
          <blockquote className="font-display text-3xl font-semibold text-white leading-snug mb-4 italic">
            "The right feedback at the right time changes everything."
          </blockquote>
          <p className="text-sage-200 text-sm">AI-powered career intelligence</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { val: '94%', label: 'Interview success rate' },
            { val: '2.5×', label: 'More callbacks' },
            { val: '12k+', label: 'Users helped' },
            { val: '4.9★', label: 'User rating' },
          ].map(({ val, label }) => (
            <div key={label} className="bg-white/10 rounded-2xl p-4">
              <p className="font-display text-2xl font-bold text-white">{val}</p>
              <p className="text-xs text-sage-200 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-sage-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-charcoal-800">ResumeAI</span>
          </div>

          <h2 className="font-display text-4xl font-semibold text-charcoal-800 mb-2">Welcome back</h2>
          <p className="text-sage-400 mb-8 text-sm">Sign in to continue your career journey</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                  placeholder="••••••••"
                  className="input-field pr-11"
                  autoComplete="current-password"
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
              {loading ? <Spinner size={18} className="text-white" /> : <>Sign in <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-sage-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-sage-600 font-medium hover:text-sage-700">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
