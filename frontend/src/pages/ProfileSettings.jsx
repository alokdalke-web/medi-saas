import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../services/api';

export default function ProfileSettings() {
  const { user, reloadUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    profile_picture: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        profile_picture: user.profile_picture || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be less than 2MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profile_picture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password && formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    
    const payload = {
      name: formData.name,
      phone: formData.phone,
      profile_picture: formData.profile_picture
    };
    
    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      await fetchApi('/users/me', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      setSuccess(true);
      
      // Clear password fields on success
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      
      // Reload user in context
      await reloadUser();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">My Profile</h1>
        <p className="text-on-surface-variant text-sm mt-1">Manage your personal information and security settings.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 shadow-sm">
        
        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-xl mb-6 text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Profile updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex flex-col sm:flex-row gap-8 items-start mb-8 pb-8 border-b border-outline-variant/20">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32 rounded-full border-4 border-surface-container-high overflow-hidden bg-surface-container flex items-center justify-center shrink-0 shadow-inner group">
                {formData.profile_picture ? (
                  <img src={formData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50">person</span>
                )}
                
                <div 
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={triggerFileInput}
                >
                  <span className="material-symbols-outlined text-white">photo_camera</span>
                </div>
              </div>
              
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              
              <button 
                type="button" 
                onClick={triggerFileInput}
                className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Change Photo
              </button>
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Role</label>
                <div className="px-4 py-2 bg-surface-container rounded-lg text-sm font-medium text-on-surface-variant inline-block">
                  {user.role.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Email Address (Read-only)</label>
                <input 
                  type="email" 
                  value={user.email} 
                  disabled 
                  className="w-full px-4 py-2.5 bg-surface-container/50 border border-outline-variant/20 rounded-xl text-sm text-on-surface-variant cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-outline-variant/20">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Full Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Phone Number</label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-1">Change Password</h3>
              <p className="text-xs text-on-surface-variant">Leave blank if you don't want to change your password.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">New Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-on-primary px-8 py-2.5 rounded-full font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
