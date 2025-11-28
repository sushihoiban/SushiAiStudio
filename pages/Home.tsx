
import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../hooks/use-settings';
import { useBooking } from '../hooks/use-booking';
import { useAuth } from '../hooks/use-auth';
import { Calendar } from 'lucide-react';

const Home: React.FC = () => {
  const { settings, getLocalizedText, t } = useSettings();
  const { openBooking } = useBooking();
  const { user, isGuest, loginAsGuest } = useAuth();

  // Hero Branding Logic
  const style = settings.hero_branding_style || 'text';
  const showLogo = settings.logo_url && (style === 'logo' || style === 'both');
  const showText = style === 'text' || style === 'both';
  
  const effectiveShowLogo = showLogo;
  const effectiveShowText = showText || (!settings.logo_url && style === 'logo');
  const logoHeight = settings.logo_height_hero || 120;

  const description = getLocalizedText(settings.description, settings.description_translations);

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute inset-0 bg-gradient-to-b from-dark-900/80 via-dark-900/90 to-dark-900 z-10"></div>
         <img 
           src={settings.hero_image_url} 
           alt="Restaurant Background" 
           className="h-full w-full object-cover opacity-30"
         />
      </div>

      <div className="w-[90%] md:w-[var(--content-width)] mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center relative z-20 py-16">
        
        <div className="mb-2 flex flex-col items-center gap-3">
          {effectiveShowLogo && (
            <img 
              src={settings.logo_url} 
              alt="Restaurant Logo" 
              style={{ height: `${logoHeight}px`, maxHeight: '40vh' }}
              className="w-auto object-contain animate-in zoom-in duration-500 drop-shadow-2xl"
            />
          )}

          {effectiveShowText && (
            <h1 className="font-serif text-5xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 md:text-7xl drop-shadow-lg p-2">
              {settings.restaurant_name}
            </h1>
          )}
        </div>

        <p className="mb-10 max-w-2xl text-lg text-neutral-300 md:text-xl font-light leading-relaxed">
          {description}
        </p>
        
        <div className="relative">
          {/* Decorative Arrow */}
          <div className="absolute -right-52 -top-28 hidden md:block w-52 h-52 pointer-events-none select-none animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
             <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-neutral-500/50 drop-shadow-sm">
                <text x="145" y="45" textAnchor="middle" className="font-serif text-2xl fill-gold-500 font-bold tracking-wide" transform="rotate(-10 145 45)">{t('home.book_here')}</text>
                {/* Simple Arc from text to button */}
                <path d="M 145 60 C 145 100, 105 145, 25 145" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Arrow Head pointing left */}
                <path d="M 45 135 L 25 145 L 45 155" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
          </div>

          <button 
              onClick={openBooking} 
              className="group relative w-80 p-8 rounded-2xl flex flex-col items-center justify-center gap-6 text-center transition-all duration-500 
                bg-dark-800 border border-dark-700 hover:border-gold-500/30 
                shadow-2xl hover:shadow-[0_20px_40px_-12px_rgba(245,158,11,0.15)]
                hover:-translate-y-1"
          >
              <div className="w-20 h-20 rounded-full bg-[#463f2f] flex items-center justify-center text-gold-500 group-hover:scale-105 transition-transform duration-500">
                  <Calendar size={36} strokeWidth={1.5} />
              </div>

              <div className="space-y-1.5">
                  <h3 className="text-xl font-serif font-bold text-neutral-100 group-hover:text-gold-500 transition-colors duration-300">{t('home.table_booking')}</h3>
                  <p className="text-sm text-neutral-500 font-medium group-hover:text-neutral-400 transition-colors">{t('home.reserve_spot')}</p>
              </div>
          </button>
        </div>

        {!user && !isGuest && (
          <div className="mt-6 text-sm text-neutral-400 animate-in fade-in slide-in-from-bottom-2">
            {t('auth.no_account')}{' '}
            <Link to="/auth" className="text-gold-500 hover:text-gold-400 font-semibold transition-colors hover:underline">
              {t('auth.sign_up_button')}
            </Link>
            {' '}{t('home.or')}{' '}
            <button onClick={loginAsGuest} className="text-gold-500 hover:text-gold-400 font-semibold transition-colors hover:underline">
              {t('auth.continue_guest')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Home;
