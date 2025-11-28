
import React from 'react';
import { Facebook, Instagram, Youtube, Linkedin, Globe, Mail } from 'lucide-react';
import { useSettings } from '../hooks/use-settings';
import { SocialLink } from '../types';

// Helper to map platform string to Icon
// X (Twitter) Icon Component
const XIcon = ({ size, className }: { size?: number | string, className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const getSocialIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'facebook': return Facebook;
    case 'instagram': return Instagram;
    case 'x': return XIcon;
    case 'twitter': return XIcon; // Fallback
    case 'youtube': return Youtube;
    case 'linkedin': return Linkedin;
    case 'email': return Mail;
    case 'tiktok': return ({size, className}: any) => (
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={size} height={size}>
         <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
       </svg>
    );
    default: return Globe;
  }
};

const getSocialColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'facebook': return 'hover:bg-[#1877F2]';
    case 'instagram': return 'hover:bg-[#E4405F]';
    case 'x': return 'hover:bg-neutral-100 hover:text-black';
    case 'twitter': return 'hover:bg-neutral-100 hover:text-black';
    case 'youtube': return 'hover:bg-[#FF0000]';
    case 'tiktok': return 'hover:bg-[#000000] hover:border-white/20';
    case 'linkedin': return 'hover:bg-[#0A66C2]';
    case 'email': return 'hover:bg-neutral-600';
    default: return 'hover:bg-gold-500';
  }
};

export const SocialSidebar: React.FC = () => {
  const { settings, t } = useSettings();

  if (!settings.social_links || settings.social_links.length === 0) return null;

  const getTooltip = (platform: string) => {
    if (platform === 'email') return t('common.email');
    if (platform === 'other') return t('common.other');
    if (platform === 'x') return 'X';
    // Capitalize first letter
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-2 p-2">
      {settings.social_links.map((link: SocialLink, index) => {
        const Icon = getSocialIcon(link.platform);
        const hoverColor = getSocialColor(link.platform);
        
        let href = link.url;
        if (link.platform === 'email' && !href.startsWith('mailto:')) {
            href = `mailto:${href}`;
        }
        
        return (
          <a
            key={`${link.platform}-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-10 h-10 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm border border-dark-700 text-neutral-400 rounded-lg transition-all duration-300 ${hoverColor} hover:text-white hover:scale-110 shadow-lg`}
            title={getTooltip(link.platform)}
          >
            <Icon size={20} />
          </a>
        );
      })}
    </div>
  );
};
