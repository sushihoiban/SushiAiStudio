
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, User, Bookmark, Heart, Bell, Globe, Settings, Info, MapPin, Phone, Clock, MessageCircle, LayoutDashboard, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { useSettings } from '../hooks/use-settings';

// Shared Zalo Icon
const ZaloIcon = ({ className, size = "1em" }: { className?: string; size?: number | string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <path d="M10 10C10 6.68629 12.6863 4 16 4H32C35.3137 4 38 6.68629 38 10V32C38 35.3137 35.3137 38 32 38H16C12.6863 38 10 35.3137 10 32V10Z" fill="currentColor" fillOpacity="0.2"/>
    <path d="M28.5 16H19V19.5H25.5L19 28.5V32H29V28.5H22.5L29 19.5V16H28.5Z" fill="currentColor"/>
  </svg>
);

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ isOpen, onClose }) => {
  const { user, profile, isGuest, signOut } = useAuth();
  const { settings, getLocalizedText, t, currentLanguage } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate('/auth');
  };

  const handleSignIn = () => {
    onClose();
    navigate('/auth');
  };

  if (!isOpen) return null;

  const getUserName = () => {
    if (profile?.first_name) return `${profile.first_name} ${profile.last_name || ''}`.trim();
    return user?.email || t('auth.guest_user') || "Guest User";
  };

  const userName = user ? getUserName() : (isGuest ? (t('auth.guest_user') || "Guest User") : t('auth.welcome_back'));
  const userPhone = profile?.phone || "";
  const userEmail = profile?.email || user?.email || t('auth.please_sign_in') || "Please sign in to manage bookings";
  
  // Check for any admin-level role
  const isStaff = ['admin', 'manager', 'super_admin'].includes(profile?.role || '');

  // Define menu items
  const menuItems = [
    ...(isStaff ? [{ icon: LayoutDashboard, label: t('navigation.admin_dashboard'), sub: t('navigation.sub_manage_bookings'), path: "/admin" }] : []),
    { icon: Bookmark, label: t('navigation.my_reservations'), sub: t('navigation.sub_view_history'), path: "/reservations" },
    { icon: Heart, label: t('navigation.favorite_dishes'), sub: t('navigation.sub_save_favorites'), path: "/menu" },
    { icon: Bell, label: t('navigation.notifications'), sub: t('navigation.sub_manage_alerts'), path: "#" },
    { icon: Globe, label: "Language", sub: currentLanguage.code.toUpperCase(), path: "#" },
    { icon: Settings, label: t('navigation.settings'), sub: t('navigation.sub_app_prefs'), path: "#" },
    { icon: Info, label: t('navigation.about'), sub: t('navigation.sub_app_info'), path: "#" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Sidebar Panel */}
      <div className="relative h-full w-full max-w-md bg-dark-900 shadow-2xl border-l border-dark-700 transform transition-transform duration-300 flex flex-col animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-800">
          <h2 className="text-xl font-serif font-bold text-neutral-200">{t('navigation.profile')} & {t('navigation.settings')}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* User Card */}
          <div className="bg-dark-800/50 rounded-2xl p-5 border border-dark-700 mb-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="h-14 w-14 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 border border-gold-500/20 shrink-0">
                <User size={28} />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-lg text-neutral-100 truncate">{userName}</div>
                <div className="text-xs text-neutral-500 truncate mb-1">{userEmail}</div>
                {userPhone && <div className="text-xs text-gold-500 truncate">{userPhone}</div>}
              </div>
            </div>

            {(user || isGuest) ? (
              <button 
                onClick={handleSignOut}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  user ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-dark-700 hover:bg-dark-600 text-neutral-300'
                }`}
              >
                {user ? (
                  <>
                    <LogOut size={18} />
                    {t('navigation.log_out')}
                  </>
                ) : (
                  <>
                    <LogOut size={18} />
                    {t('navigation.exit_guest')}
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-gold-500 hover:bg-gold-400 text-dark-900 transition-colors"
              >
                <LogIn size={18} />
                {t('auth.sign_in_button')} / {t('auth.sign_up_button')}
              </button>
            )}
          </div>

          {/* Menu Items */}
          <div className="space-y-1 border-t border-dark-800 pt-2">
            {menuItems.map((item, idx) => (
              <Link 
                key={idx}
                to={item.path}
                onClick={onClose}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-dark-800 transition-colors group text-left"
              >
                <item.icon className="text-neutral-500 group-hover:text-gold-500 transition-colors" size={22} />
                <div className="flex-1">
                  <div className="text-neutral-200 font-medium">{item.label}</div>
                  {item.sub && <div className="text-xs text-neutral-500">{item.sub}</div>}
                </div>
              </Link>
            ))}
          </div>

        </div>

        {/* Footer / Contact Info */}
        <div className="p-6 bg-dark-800/30 border-t border-dark-800">
          <div className="bg-dark-900/50 rounded-2xl p-5 border border-dark-700 space-y-4">
            
            <div className="flex items-start gap-3 text-neutral-400 text-sm">
              <MapPin size={16} className="mt-0.5 text-gold-500 shrink-0" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <Phone size={16} className="text-gold-500 shrink-0" />
              <span>{settings.phone}</span>
            </div>
            <div className="flex items-start gap-3 text-neutral-400 text-sm">
              <Clock size={16} className="mt-0.5 text-gold-500 shrink-0" />
              <div className="flex flex-col">
                {settings.opening_hours.map((slot, idx) => {
                   const translatedName = getLocalizedText(slot.name, slot.name_translations);
                   const translatedTime = getLocalizedText(slot.time, slot.time_translations);
                   return (
                      <span key={slot.id || idx} className="block">
                          {translatedName ? `${translatedName}: ` : ''}{translatedTime}
                      </span>
                   );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-dark-900 py-2.5 rounded-lg text-sm font-bold transition-colors">
                <MessageCircle size={18} />
                WhatsApp
              </button>
              <button className="flex items-center justify-center gap-2 bg-[#0068FF] hover:bg-[#005be0] text-white py-2.5 rounded-lg text-sm font-bold transition-colors">
                <ZaloIcon size={20} />
                Zalo
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
