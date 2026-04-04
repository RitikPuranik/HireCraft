import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, Lock, Save, Shield, Phone, MapPin,Crown } from 'lucide-react';
import { authAPI } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { Spinner } from '../../components/ui';

const profileSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  phone:    z.string().optional(),
  location: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Enter your current password'),
  newPassword:     z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '', location: user?.location || '' },
  });

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const onProfileSave = async (data) => {
    setProfileLoading(true);
    try {
      const res = await authAPI.updateProfile(data);
      const updated = res.data?.data?.user || res.data?.user || res.data;
      updateUser({ ...user, ...updated });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSave = async (data) => {
    setPassLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully!');
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-charcoal-800">Profile Settings</h1>
        <p className="text-sm text-sage-400 mt-1">Manage your account information</p>
      </div>

      {/* Avatar */}
     {/* Avatar Section */}
<div className="card p-5 mb-5 flex items-center gap-4">
  <div className="w-16 h-16 rounded-2xl bg-sage-100 flex items-center justify-center flex-shrink-0">
    <span className="font-display text-2xl font-semibold text-sage-600">
      {user?.name?.[0]?.toUpperCase() || 'U'}
    </span>
  </div>
  <div>
    <h2 className="font-semibold text-charcoal-800">{user?.name}</h2>
    <p className="text-sm text-sage-400">{user?.email}</p>
    
    <div className="flex items-center gap-2 mt-1">
      {/* Logic: If plan is not 'free', show Crown, else show Shield */}
      {user?.plan?.toLowerCase() !== 'free' ? (
        <>
          <Crown size={14} className="text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold text-amber-600 capitalize">
            {user?.plan} Plan
          </span>
        </>
      ) : (
        <>
          <Shield size={14} className="text-sage-500" />
          <span className="text-xs text-sage-500 capitalize">
            {user?.plan || 'Free'} Plan
          </span>
        </>
      )}
    </div>
  </div>
</div>

      {/* Profile Form */}
      <div className="card p-6 mb-5">
        <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2 text-sm">
          <User size={16} className="text-sage-500" /> Personal Information
        </h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input {...profileForm.register('name')} className="input-field" placeholder="Arjun Sharma" />
            {profileForm.formState.errors.name && <p className="error-text">{profileForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="label flex items-center gap-1"><Phone size={13} /> Phone</label>
            <input {...profileForm.register('phone')} type="tel" className="input-field" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label flex items-center gap-1"><MapPin size={13} /> Location</label>
            <input {...profileForm.register('location')} className="input-field" placeholder="Mumbai, India" />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input value={user?.email || ''} readOnly className="input-field bg-cream-50 cursor-not-allowed text-sage-400" />
            <p className="text-xs text-sage-400 mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" disabled={profileLoading} className="btn-primary text-sm py-2.5">
            {profileLoading ? <Spinner size={16} className="text-white" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Password Form */}
      <div className="card p-6">
        <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2 text-sm">
          <Lock size={16} className="text-sage-500" /> Change Password
        </h2>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSave)} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input {...passwordForm.register('currentPassword')} type="password" placeholder="••••••••" className="input-field" />
            {passwordForm.formState.errors.currentPassword && <p className="error-text">{passwordForm.formState.errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="label">New Password</label>
            <input {...passwordForm.register('newPassword')} type="password" placeholder="Min. 6 characters" className="input-field" />
            {passwordForm.formState.errors.newPassword && <p className="error-text">{passwordForm.formState.errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input {...passwordForm.register('confirmPassword')} type="password" placeholder="Repeat new password" className="input-field" />
            {passwordForm.formState.errors.confirmPassword && <p className="error-text">{passwordForm.formState.errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={passLoading} className="btn-primary text-sm py-2.5">
            {passLoading ? <Spinner size={16} className="text-white" /> : <><Lock size={16} /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}
