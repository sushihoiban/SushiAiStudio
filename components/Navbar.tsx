
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed, User, Globe, ChevronDown, Home, Calendar, Bookmark, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { useSettings } from '../hooks/use-settings';
import { useBooking } from '../hooks/use-booking';
import { Button } from './ui/Button';
import { ProfileSidebar } from './ProfileSidebar';
import { LANGUAGES } from '../lib/constants';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, profile, isGuest } = useAuth();
  const { settings, currentLanguage, setLanguage, t } = useSettings();
  const { openBooking } = useBooking();
  
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const isActive = (path: string) => location.pathname === path;
  
  const isStaff = ['admin', 'manager', 'super_admin'].includes(profile?.role || '');

  const getDisplayName = () => {
    if (isGuest) return t('auth.guest_user') || "Guest User";
    if (profile?.first_name) return `${profile.first_name} ${profile.last_name || ''}`.trim();
    return user?.email || "User";
  };

  const getRoleLabel = () => {
    if (profile?.role === 'super_admin') return 'Super Admin';
    if (profile?.role === 'manager') return 'Manager';
    if (profile?.role === 'admin') return 'Administrator';
    if (isGuest) return 'Guest';
    return 'Member';
  };

  const style = settings.branding_style || 'both';
  const showLogo = settings.logo_url && (style === 'logo' || style === 'both');
  const showText = style === 'text' || style === 'both';
  const effectiveShowText = showText || (!settings.logo_url && style === 'logo');
  const effectiveShowLogo = showLogo;
  const logoHeight = settings.logo_height_navbar || 40;

  const activeLangs = settings.active_languages || ['en'];
  const visibleLanguages = LANGUAGES.filter(l => activeLangs.includes(l.code));

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-dark-900/80 backdrop-blur-md transition-colors duration-500">
        <div className="w-[90%] md:w-[var(--content-width)] mx-auto flex h-16 items-center justify-between">
          
          <Link to="/" className="flex items-center gap-2 font-serif text-xl font-bold text-gold-500">
            {effectiveShowLogo ? (
              <img 
                src={settings.logo_url} 
                alt={t('common.alt_logo')} 
                style={{ height: `${logoHeight}px` }}
                className="w-auto object-contain pt-2" 
              />
            ) : (
              !effectiveShowLogo && <UtensilsCrossed className="h-6 w-6" />
            )}
            {effectiveShowText && (
              <span>{settings.restaurant_name}</span>
            )}
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-gold-500' : 'text-neutral-400 hover:text-neutral-100'}`}>
              {t('navigation.home')}
            </Link>
            <Link to="/menu" className={`text-sm font-medium transition-colors ${isActive('/menu') ? 'text-gold-500' : 'text-neutral-400 hover:text-neutral-100'}`}>
              {t('navigation.menu')}
            </Link>
            <Link to="/reservations" className={`text-sm font-medium transition-colors ${isActive('/reservations') ? 'text-gold-500' : 'text-neutral-400 hover:text-neutral-100'}`}>
              {t('navigation.reservations')}
            </Link>
            {isStaff && (
              <Link to="/admin" className={`text-sm font-medium transition-colors ${location.pathname.startsWith('/admin') ? 'text-gold-500' : 'text-neutral-400 hover:text-neutral-100'}`}>
                {t('navigation.admin_dashboard')}
              </Link>
            )}
            <Button onClick={openBooking} variant="primary" size="sm" className="font-semibold shadow-md shadow-gold-500/20 ml-2">
              {t('navigation.book_table')}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={langMenuRef}>
              <button 
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 rounded-full border border-dark-700 bg-dark-800/50 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-dark-700 hover:text-white transition-all"
              >
                <Globe size={14} />
                <span className="uppercase">{currentLanguage.code}</span>
                <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-lg border border-dark-700 bg-dark-900 shadow-xl overflow-hidden max-h-64 overflow-y-auto z-50">
                  {visibleLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-dark-800 transition-colors ${
                        currentLanguage.code === lang.code ? 'text-gold-500 bg-dark-800/50' : 'text-neutral-400'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={(user || isGuest) ? "hidden lg:block" : "block"}>
              {(user || isGuest) ? (
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setProfileOpen(true)}>
                  <div className="text-right">
                    <div className="text-xs font-medium text-neutral-200">{getDisplayName()}</div>
                    <div className="text-[10px] text-gold-500 uppercase tracking-wider">
                      {getRoleLabel()}
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gold-500/20 border border-gold-500/50 flex items-center justify-center text-gold-500">
                    <User size={16} />
                  </div>
                </div>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('navigation.sign_in')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className={`grid ${isStaff ? 'grid-cols-3' : 'grid-cols-4'} h-16`}>
          <Link to="/" className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive('/') ? 'text-gold-500' : 'text-neutral-400 hover:text-neutral-200'}`}>
            <Home size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{t('navigation.home')}</span>
          </Link>
          
          {isStaff ? (
            <Link to="/admin/dashboard" className={`flex flex-col items-center justify-center gap-1 transition-colors ${location.pathname.startsWith('/admin') ? 'text-gold-500' : 'text-neutral-400 hover:text-neutral-200'}`}>
              <LayoutDashboard size={22} strokeWidth={location.pathname.startsWith('/admin') ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{t('navigation.admin_dashboard')}</span>
            </Link>
          ) : (
            <>
              <Link to="/reservations" className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive('/reservations') ? 'text-gold-500' : 'text-neutral-400 hover:text-neutral-200'}`}>
                <Bookmark size={22} strokeWidth={isActive('/reservations') ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{t('navigation.reservations')}</span>
              </Link>
              <button onClick={openBooking} className="flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-neutral-200 transition-colors group">
                <div className="relative group-active:scale-95 transition-transform">
                   <Calendar size={22} strokeWidth={2} />
                   <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gold-500 rounded-full shadow-sm"></div>
                </div>
                <span className="text-[10px] font-medium">{t('navigation.book_table')}</span>
              </button>
            </>
          )}
          <button onClick={() => setProfileOpen(true)} className={`flex flex-col items-center justify-center gap-1 transition-colors ${profileOpen ? 'text-gold-500' : 'text-neutral-400 hover:text-neutral-200'}`}>
            <User size={22} strokeWidth={profileOpen ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{t('navigation.profile')}</span>
          </button>
        </div>
      </div>

      <ProfileSidebar isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
};

export default Navbar;
