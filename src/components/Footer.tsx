
import React from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';
import { useSettings } from '../hooks/use-settings';

const Footer: React.FC = () => {
  const { settings, getLocalizedText, t } = useSettings();

  return (
    <footer className="bg-dark-900 border-t border-dark-800 pt-16 pb-8 mt-auto transition-colors duration-500">
      {/* Dynamic Width */}
      <div className="w-[90%] md:w-[var(--content-width)] mx-auto">
        
        {/* Main "Visit Our Restaurant" Card */}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 md:p-12 shadow-2xl shadow-black/20 relative overflow-hidden mb-12 transition-colors duration-500">
            {/* Decorative ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent opacity-50"></div>
            
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-center text-neutral-100 mb-10">
              {t('navigation.visit_us')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative z-10">
              
              {/* Location */}
              <div className="flex flex-col items-center text-center space-y-3 group">
                <div className="h-12 w-12 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 group-hover:scale-110 transition-transform duration-300">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-100 mb-1">{t('navigation.location')}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed px-4">
                    {settings.address}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="flex flex-col items-center text-center space-y-3 group">
                <div className="h-12 w-12 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 group-hover:scale-110 transition-transform duration-300">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-100 mb-1">{t('navigation.call_us')}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    <a href={`tel:${settings.phone}`} className="hover:text-gold-500 transition-colors">
                      {settings.phone}
                    </a>
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex flex-col items-center text-center space-y-3 group">
                <div className="h-12 w-12 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 group-hover:scale-110 transition-transform duration-300">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-100 mb-1">{t('navigation.hours')}</h3>
                  <div className="text-neutral-400 text-sm leading-relaxed px-4">
                    {settings.opening_hours.map((slot, idx) => {
                       const translatedName = getLocalizedText(slot.name, slot.name_translations);
                       const translatedTime = getLocalizedText(slot.time, slot.time_translations);
                       return (
                          <div key={slot.id || idx}>
                            {translatedName && <span className="font-medium text-neutral-300">{translatedName}: </span>}
                            <span>{translatedTime}</span>
                          </div>
                       );
                    })}
                  </div>
                </div>
              </div>

            </div>
        </div>

        {/* Copyright / Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500 border-t border-dark-800 pt-8">
          <p>&copy; {new Date().getFullYear()} {settings.restaurant_name}. {t('navigation.rights_reserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
