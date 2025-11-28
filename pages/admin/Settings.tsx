
import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../../hooks/use-settings';
import { useAuth } from '../../hooks/use-auth';
import { updateSettings, getProfiles, updateProfileRole } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, RotateCcw, Image as ImageIcon, Palette, Globe, Phone, MapPin, Share2, Plus, Trash2, Upload, Maximize, Link as LinkIcon, Timer, UserCog, Search, CalendarClock, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { SocialLink, RestaurantSettings, Profile, DaySchedule } from '../../types';
import { LANGUAGES } from '../../lib/constants';

const PLATFORMS = ['facebook', 'instagram', 'x', 'tiktok', 'youtube', 'linkedin', 'email', 'other'];

const PRESETS = [
  { id: 'preset_gold', name: 'Classic Gold', primary: '#f59e0b' },
  { id: 'preset_blue', name: 'Ocean Blue', primary: '#0ea5e9' },
  { id: 'preset_green', name: 'Forest Green', primary: '#22c55e' },
  { id: 'preset_purple', name: 'Royal Purple', primary: '#a855f7' },
  { id: 'preset_red', name: 'Crimson Red', primary: '#ef4444' },
];

const TIME_OPTIONS = Array.from({ length: 24 * 2 }).map((_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

const processImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        } else {
          if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            resolve(canvas.toDataURL(mimeType, 0.7));
        } else { reject(new Error("Could not get canvas context")); }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const AdminSettings: React.FC = () => {
  const { settings, savedSettings, refreshSettings, updatePreview, persistLocalSettings, resetToSaved, t } = useSettings();
  const { canManageSettings, isSuperAdmin, isManager, user } = useAuth(); 
  const [formData, setFormData] = useState<RestaurantSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [message, setMessage] = useState<{type: 'success'|'error', text: string, section: string} | null>(null);
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [modifiedRoles, setModifiedRoles] = useState<Record<string, string>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');
  
  const [transLang, setTransLang] = useState('en');
  const [ohLang, setOhLang] = useState('en');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
      if (!isSaving) {
          setFormData(settings); 
      }
  }, [settings, isSaving]);

  useEffect(() => { return () => { resetToSaved(); }; }, [resetToSaved]);
  useEffect(() => { if (canManageSettings) loadProfiles(); }, [canManageSettings]);

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const data = await getProfiles();
      setProfiles(data);
    } catch (error) { console.error(error); } finally { setLoadingProfiles(false); }
  };

  const handleRoleChange = (profileId: string, newRole: string) => {
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
    setModifiedRoles(prev => ({ ...prev, [profileId]: newRole }));
  };

  const handleChange = (field: keyof RestaurantSettings, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    updatePreview(updated);
  };

  const toggleLanguage = (code: string) => {
    const current = formData.active_languages || [];
    let updated;
    if (current.includes(code)) {
        updated = current.filter(c => c !== code);
        if (updated.length === 0) updated = ['en'];
    } else {
        updated = [...current, code];
    }
    handleChange('active_languages', updated);
  };

  const handleSocialChange = (index: number, field: keyof SocialLink, value: string) => {
    const updatedLinks = [...(formData.social_links || [])];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    handleChange('social_links', updatedLinks);
  };

  const addSocialLink = () => {
    handleChange('social_links', [...(formData.social_links || []), { platform: 'facebook', url: '' }]);
  };

  const removeSocialLink = (index: number) => {
    const updatedLinks = [...(formData.social_links || [])];
    updatedLinks.splice(index, 1);
    handleChange('social_links', updatedLinks);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'hero_image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
        const maxDim = field === 'logo_url' ? 160 : 1000;
        const compressedBase64 = await processImage(file, maxDim, maxDim);
        handleChange(field, compressedBase64);
        setMessage({ type: 'success', text: t('admin_settings.image_processed'), section: 'assets' });
    } catch (err) {
        setMessage({ type: 'error', text: t('admin_settings.image_failed'), section: 'assets' });
    } finally { setIsUploading(false); if (e.target) e.target.value = ''; }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const updated = { ...formData, primary_color: preset.primary };
    setFormData(updated);
    updatePreview(updated);
  };

  const generateRandomTheme = () => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    handleChange('primary_color', randomColor);
  };

  const handleSave = async (sectionId: string = 'global') => {
    setIsSaving(true);
    setMessage(null);
    try {
      const changes: Partial<RestaurantSettings> = {};
      if (JSON.stringify(formData.booking_schedule) !== JSON.stringify(savedSettings.booking_schedule)) {
        changes.booking_schedule = formData.booking_schedule;
      }
      if (JSON.stringify(formData.opening_hours) !== JSON.stringify(savedSettings.opening_hours)) {
        changes.opening_hours = formData.opening_hours;
      }
      if (JSON.stringify(formData.description_translations) !== JSON.stringify(savedSettings.description_translations)) {
        changes.description_translations = formData.description_translations;
      }

      (Object.keys(formData) as Array<keyof RestaurantSettings>).forEach(key => {
        if (key === 'booking_schedule' || key === 'opening_hours' || key === 'description_translations') return;
        if (typeof formData[key] === 'object' && formData[key] !== null) {
           if (JSON.stringify(formData[key]) !== JSON.stringify(savedSettings[key])) {
             // @ts-ignore
             changes[key] = formData[key];
           }
        } else if (formData[key] !== savedSettings[key]) {
          // @ts-ignore
          changes[key] = formData[key];
        }
      });
      
      let updatedSettingsFromDB: RestaurantSettings | null = null;

      if (Object.keys(changes).length > 0) {
        if (savedSettings.id) changes.id = savedSettings.id;
        updatedSettingsFromDB = await updateSettings(changes);
      }

      const rolePromises = Object.entries(modifiedRoles).map(([id, role]) => 
        updateProfileRole(id, String(role))
      );
      if (rolePromises.length > 0) {
        await Promise.all(rolePromises);
      }

      if (Object.keys(changes).length === 0 && rolePromises.length === 0) {
        setMessage({ type: 'success', text: t('admin_settings.no_changes'), section: sectionId });
        setIsSaving(false);
        return;
      }

      const newBaseline: RestaurantSettings = {
          ...formData,
          ...(updatedSettingsFromDB || {}),
          description_translations: updatedSettingsFromDB?.description_translations || formData.description_translations || {},
          booking_schedule: updatedSettingsFromDB?.booking_schedule || formData.booking_schedule || [],
          opening_hours: updatedSettingsFromDB?.opening_hours || formData.opening_hours || []
      };

      persistLocalSettings(newBaseline);
      setFormData(newBaseline);
      
      if (canManageSettings) loadProfiles();
      setModifiedRoles({});
      
      setMessage({ type: 'success', text: t('common.success_saved'), section: sectionId });

      setTimeout(() => {
          refreshSettings().catch(e => console.warn("Background refresh failed", e));
      }, 2500);

      setTimeout(() => {
          setMessage(prev => (prev?.section === sectionId ? null : prev));
      }, 3000);

    } catch (error: any) {
      if (error.code === '23514' || error.message?.includes('violates check constraint')) {
        setMessage({ type: 'error', text: t('common.db_restriction'), section: sectionId });
      } else {
        setMessage({ type: 'error', text: `${t('common.error_generic')}: ${error.message}`, section: sectionId });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    resetToSaved();
    if (canManageSettings) loadProfiles();
    setModifiedRoles({});
    setMessage({ type: 'success', text: t('admin_settings.changes_discarded'), section: 'global' });
  };

  const handleScheduleChange = (index: number, field: keyof DaySchedule, value: any) => {
    const updated = [...(formData.booking_schedule || [])];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('booking_schedule', updated);
  };

  const handleTranslationChange = (lang: string, text: string) => {
    const updated = { ...(formData.description_translations || {}) };
    if (!text) delete updated[lang];
    else updated[lang] = text;
    handleChange('description_translations', updated);
  };

  const handleOpeningHoursChange = (index: number, field: 'name' | 'time', value: string) => {
    const updated = [...formData.opening_hours];
    const slot = { ...updated[index] };
    
    if (ohLang === 'en') {
        slot[field] = value;
    } else {
        const transKey = field === 'name' ? 'name_translations' : 'time_translations';
        const translations = { ...(slot[transKey] || {}) };
        if (value) {
            translations[ohLang] = value;
        } else {
            delete translations[ohLang];
        }
        slot[transKey] = translations;
    }
    updated[index] = slot;
    handleChange('opening_hours', updated);
  };

  const addOpeningHour = () => {
    handleChange('opening_hours', [...formData.opening_hours, { id: Date.now().toString(), name: '', time: '' }]);
  };

  const removeOpeningHour = (index: number) => {
    const updated = [...formData.opening_hours];
    updated.splice(index, 1);
    handleChange('opening_hours', updated);
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'Facebook';
      case 'instagram': return 'Instagram';
      case 'x': return 'X (Twitter)';
      case 'tiktok': return 'TikTok';
      case 'youtube': return 'YouTube';
      case 'linkedin': return 'LinkedIn';
      case 'email': return t('common.email');
      case 'other': return t('common.other');
      default: return platform;
    }
  };

  const SectionSaveArea = ({ sectionId }: { sectionId: string }) => (
    <div className="mt-6 pt-4 border-t border-dark-700 flex flex-col items-end gap-2">
        <Button 
            onClick={() => handleSave(sectionId)} 
            disabled={isSaving || isUploading} 
            className="shadow-lg shadow-gold-500/10 w-40"
        >
            {isSaving ? t('common.processing') : t('common.save')}
            {!isSaving && <Save className="ml-2 h-4 w-4" />}
        </Button>
        {message && message.section === sectionId && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded animate-in fade-in slide-in-from-top-1 ${
                message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
                {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {message.text}
            </div>
        )}
    </div>
  );

  if (!canManageSettings) return <div className="p-10 text-center text-neutral-500">Access Restricted</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-bold text-neutral-100 font-serif mb-1">{t('admin_settings.title')}</h1>
        <p className="text-neutral-400">{t('admin_settings.subtitle')}</p>
      </div>

      {message && message.section === 'global' && (
        <div className={`p-4 rounded-lg border flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6 flex flex-col">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-2 text-gold-500 border-b border-dark-700 pb-4 mb-2">
                <Globe size={20} />
                <h2 className="text-lg font-semibold">{t('admin_settings.brand_identity')}</h2>
            </div>

            <div>
                <label className="mb-3 block text-xs font-medium text-neutral-400 uppercase tracking-wider">{t('admin_settings.active_languages')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {LANGUAGES.map(lang => {
                    const isActive = (formData.active_languages || []).includes(lang.code);
                    return (
                    <button
                        key={lang.code}
                        onClick={() => toggleLanguage(lang.code)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-all ${
                        isActive 
                        ? 'bg-gold-500/10 border-gold-500 text-gold-500' 
                        : 'bg-dark-900 border-dark-700 text-neutral-400 hover:border-neutral-500'
                        }`}
                    >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isActive ? 'border-gold-500' : 'border-neutral-500'
                        }`}>
                            {isActive && <div className="w-2 h-2 rounded-full bg-gold-500" />}
                        </div>
                        <span>{lang.label.split(' ')[0]}</span>
                    </button>
                    )
                })}
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-dark-700/50">
                <Input 
                label={t('admin_settings.restaurant_name')}
                value={formData.restaurant_name}
                onChange={e => handleChange('restaurant_name', e.target.value)}
                className="bg-dark-900"
                />
                
                <div className="w-full">
                <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-neutral-400">{t('admin_settings.description')}</label>
                    <select 
                    className="bg-dark-900 border border-dark-700 rounded px-2 py-0.5 text-xs text-neutral-300"
                    value={transLang}
                    onChange={(e) => setTransLang(e.target.value)}
                    >
                    <option value="en">English (Default)</option>
                    {(formData.active_languages || []).filter(l => l !== 'en').map(code => (
                        <option key={code} value={code}>{LANGUAGES.find(l => l.code === code)?.label}</option>
                    ))}
                    </select>
                </div>
                <textarea
                    className="flex w-full rounded-md border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-500 min-h-[80px]"
                    value={transLang === 'en' ? formData.description : (formData.description_translations?.[transLang] || '')}
                    onChange={e => {
                    if (transLang === 'en') handleChange('description', e.target.value);
                    else handleTranslationChange(transLang, e.target.value);
                    }}
                    placeholder={`${t('admin_settings.enter_desc')} ${transLang.toUpperCase()}...`}
                />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="mb-2 block text-xs font-medium text-neutral-400">{t('admin_settings.navbar_branding')}</label>
                    <select
                    value={formData.branding_style}
                    onChange={(e) => handleChange('branding_style', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded px-2 py-2 text-sm outline-none focus:border-gold-500 text-neutral-100"
                    >
                    <option value="both">{t('admin_settings.style_both')}</option>
                    <option value="logo">{t('admin_settings.style_logo')}</option>
                    <option value="text">{t('admin_settings.style_text')}</option>
                    </select>
                </div>
                
                <div>
                    <label className="mb-2 block text-xs font-medium text-neutral-400">{t('admin_settings.hero_branding')}</label>
                    <select
                    value={formData.hero_branding_style || 'text'}
                    onChange={(e) => handleChange('hero_branding_style', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded px-2 py-2 text-sm outline-none focus:border-gold-500 text-neutral-100"
                    >
                    <option value="text">{t('admin_settings.style_text_h1')}</option>
                    <option value="logo">{t('admin_settings.style_logo')}</option>
                    <option value="both">{t('admin_settings.style_both')}</option>
                    </select>
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="mb-2 block text-xs font-medium text-neutral-400">
                    {t('admin_settings.logo_height_nav')}: {formData.logo_height_navbar}px
                    </label>
                    <input 
                    type="range" 
                    min="20" 
                    max="80" 
                    value={formData.logo_height_navbar || 40}
                    onChange={(e) => handleChange('logo_height_navbar', parseInt(e.target.value))}
                    className="w-full accent-gold-500"
                    />
                </div>
                <div>
                    <label className="mb-2 block text-xs font-medium text-neutral-400">
                    {t('admin_settings.logo_height_hero')}: {formData.logo_height_hero}px
                    </label>
                    <input 
                    type="range" 
                    min="50" 
                    max="300" 
                    value={formData.logo_height_hero || 120}
                    onChange={(e) => handleChange('logo_height_hero', parseInt(e.target.value))}
                    className="w-full accent-gold-500"
                    />
                </div>
                </div>
            </div>
          </div>
          <SectionSaveArea sectionId="brand" />
        </div>

        <div className="lg:col-span-2 bg-dark-800/50 border border-dark-700 rounded-xl p-6 flex flex-col">
           <div className="flex-1 space-y-6">
                <div className="flex items-center gap-2 text-gold-500 border-b border-dark-700 pb-4 mb-2">
                    <CalendarClock size={20} />
                    <h2 className="text-lg font-semibold">{t('admin_settings.booking_schedule')}</h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                        <tr className="text-neutral-500 border-b border-dark-700">
                        <th className="p-2 font-medium">{t('admin_settings.day')}</th>
                        <th className="p-2 font-medium text-center">{t('common.status')}</th>
                        <th className="p-2 font-medium">{t('admin_settings.open')}</th>
                        <th className="p-2 font-medium">{t('admin_settings.close')}</th>
                        <th className="p-2 font-medium text-center">{t('admin_settings.break')}</th>
                        <th className="p-2 font-medium">{t('admin_settings.break_start')}</th>
                        <th className="p-2 font-medium">{t('admin_settings.break_end')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                        {formData.booking_schedule?.map((day, idx) => (
                        <tr key={day.day} className={day.isOpen ? 'bg-transparent' : 'bg-dark-900/30 opacity-60'}>
                            <td className="p-2 font-medium text-neutral-300">{t('common.' + day.day.toLowerCase())}</td>
                            <td className="p-2 text-center">
                            <input type="checkbox" checked={day.isOpen} onChange={(e) => handleScheduleChange(idx, 'isOpen', e.target.checked)} className="accent-gold-500" />
                            </td>
                            <td className="p-2">
                            <select 
                                disabled={!day.isOpen} 
                                value={day.openTime} 
                                onChange={(e) => handleScheduleChange(idx, 'openTime', e.target.value)} 
                                className="bg-dark-900 border border-dark-700 rounded px-2 py-1 w-24 disabled:opacity-50 appearance-none text-neutral-100"
                            >
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            </td>
                            <td className="p-2">
                            <select 
                                disabled={!day.isOpen} 
                                value={day.closeTime} 
                                onChange={(e) => handleScheduleChange(idx, 'closeTime', e.target.value)} 
                                className="bg-dark-900 border border-dark-700 rounded px-2 py-1 w-24 disabled:opacity-50 appearance-none text-neutral-100"
                            >
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            </td>
                            <td className="p-2 text-center">
                                <input type="checkbox" disabled={!day.isOpen} checked={day.hasBreak} onChange={(e) => handleScheduleChange(idx, 'hasBreak', e.target.checked)} className="accent-gold-500 disabled:opacity-50" />
                            </td>
                            <td className="p-2">
                            <select 
                                disabled={!day.isOpen || !day.hasBreak} 
                                value={day.breakStart} 
                                onChange={(e) => handleScheduleChange(idx, 'breakStart', e.target.value)} 
                                className="bg-dark-900 border border-dark-700 rounded px-2 py-1 w-24 disabled:opacity-50 appearance-none text-neutral-100"
                            >
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            </td>
                            <td className="p-2">
                            <select 
                                disabled={!day.isOpen || !day.hasBreak} 
                                value={day.breakEnd} 
                                onChange={(e) => handleScheduleChange(idx, 'breakEnd', e.target.value)} 
                                className="bg-dark-900 border border-dark-700 rounded px-2 py-1 w-24 disabled:opacity-50 appearance-none text-neutral-100"
                            >
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
           </div>
           <SectionSaveArea sectionId="schedule" />
        </div>

        <div className="lg:col-span-2 bg-dark-800/50 border border-dark-700 rounded-xl p-6 flex flex-col">
           <div className="flex-1 space-y-6">
                <div className="flex items-center gap-2 text-gold-500 border-b border-dark-700 pb-4 mb-2">
                    <MapPin size={20} />
                    <h2 className="text-lg font-semibold">{t('admin_settings.contact_default')}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label={t('admin_settings.address')} value={formData.address} onChange={e => handleChange('address', e.target.value)} startIcon={<MapPin size={16}/>} />
                    <Input label={t('auth.ph_phone')} value={formData.phone} onChange={e => handleChange('phone', e.target.value)} startIcon={<Phone size={16}/>} />
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-neutral-400">{t('admin_settings.default_duration')}</label>
                        <Input type="number" value={formData.default_duration || 90} onChange={e => handleChange('default_duration', parseInt(e.target.value))} startIcon={<Timer size={16}/>} className="bg-dark-900" min={30} step={30} />
                    </div>
                </div>

                <div className="pt-4 border-t border-dark-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-neutral-400">
                        <Clock size={16} className="text-gold-500" />
                        <label className="block text-xs font-medium uppercase tracking-wider">{t('admin_settings.display_hours_footer')}</label>
                        </div>
                        <select 
                        className="bg-dark-900 border border-dark-700 rounded px-2 py-0.5 text-xs text-neutral-300 ml-auto mr-2"
                        value={ohLang}
                        onChange={(e) => setOhLang(e.target.value)}
                        >
                        <option value="en">English (Default)</option>
                        {(formData.active_languages || []).filter(l => l !== 'en').map(code => (
                            <option key={code} value={code}>{LANGUAGES.find(l => l.code === code)?.label}</option>
                        ))}
                        </select>

                        <Button size="sm" onClick={addOpeningHour} className="h-7 text-xs bg-dark-700 hover:bg-dark-600 border border-dark-600"><Plus size={12} className="mr-1"/> {t('admin_settings.add_row')}</Button>
                    </div>
                    
                    <div className="flex gap-2 mb-2 px-1">
                        <div className="w-1/3">
                            <span className="text-xs font-medium text-neutral-500">{t('admin_settings.day')}</span>
                        </div>
                        <div className="flex-1">
                            <span className="text-xs font-medium text-neutral-500">{t('navigation.hours')}</span>
                        </div>
                        <div className="w-9"></div>
                    </div>

                    <div className="space-y-2">
                        {formData.opening_hours.map((slot, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <div className="w-1/3">
                                <Input 
                                placeholder={ohLang === 'en' ? "e.g. Mon-Fri" : `(${ohLang}) Days`} 
                                value={ohLang === 'en' ? slot.name : (slot.name_translations?.[ohLang] || '')} 
                                onChange={(e) => handleOpeningHoursChange(idx, 'name', e.target.value)} 
                                className="h-9 bg-dark-900 text-xs"
                                />
                            </div>
                            <div className="flex-1">
                                <Input 
                                placeholder={ohLang === 'en' ? "e.g. 10:00 - 21:00" : `(${ohLang}) Hours`} 
                                value={ohLang === 'en' ? slot.time : (slot.time_translations?.[ohLang] || '')} 
                                onChange={(e) => handleOpeningHoursChange(idx, 'time', e.target.value)} 
                                className="h-9 bg-dark-900 text-xs"
                                />
                            </div>
                            <button 
                                onClick={() => removeOpeningHour(idx)} 
                                className="h-9 w-9 flex items-center justify-center rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        ))}
                    </div>
                </div>
           </div>
           <SectionSaveArea sectionId="contact" />
        </div>

        {(isSuperAdmin || isManager) && (
          <div className="lg:col-span-2 bg-dark-800/50 border border-dark-700 rounded-xl p-6 flex flex-col">
            <div className="flex-1 space-y-6">
                <div className="flex items-center gap-2 text-gold-500 border-b border-dark-700 pb-4 mb-2">
                <UserCog size={20} />
                <h2 className="text-lg font-semibold">{t('admin_settings.team_management')}</h2>
                </div>
                <div className="space-y-4">
                <div className="flex items-center gap-2 bg-dark-900/50 border border-dark-700 rounded-lg px-3 py-2">
                    <Search size={16} className="text-neutral-500" />
                    <input placeholder={t('admin_settings.search_users')} value={profileSearch} onChange={(e) => setProfileSearch(e.target.value)} className="bg-transparent border-none outline-none text-sm text-neutral-200 w-full placeholder-neutral-600" />
                </div>
                <div className="overflow-hidden rounded-lg border border-dark-700">
                    <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-dark-800 text-neutral-400"><tr><th className="p-3 font-medium">{t('admin_settings.user')}</th><th className="p-3 font-medium">{t('admin_settings.role')}</th><th className="p-3 font-medium text-right">{t('dashboard.col_actions')}</th></tr></thead>
                    <tbody className="divide-y divide-dark-700 bg-dark-900/30">
                        {loadingProfiles ? (
                            <tr><td colSpan={3} className="p-4 text-center text-neutral-500">{t('common.loading')}</td></tr>
                        ) : profiles
                            .filter(p => (`${p.first_name} ${p.last_name}`.toLowerCase().includes(profileSearch.toLowerCase()) || p.email?.toLowerCase().includes(profileSearch.toLowerCase())))
                            .filter(p => isSuperAdmin ? true : p.role !== 'super_admin')
                            .map(p => (
                        <tr key={p.id} className="hover:bg-dark-800/30">
                            <td className="p-3">
                                <div className="font-medium text-neutral-200">{p.first_name} {p.last_name}</div>
                                <div className="text-xs text-neutral-500">{p.email}</div>
                            </td>
                            <td className="p-3">
                                <span className="uppercase text-[10px] border px-2 py-0.5 rounded border-dark-600 text-neutral-400">{p.role || 'user'}</span>
                                {modifiedRoles[p.id] && <span className="ml-2 text-[10px] text-gold-500 italic">(Modified)</span>}
                            </td>
                            <td className="p-3 text-right">
                                <select 
                                    disabled={p.id === user?.id && !isSuperAdmin} 
                                    value={p.role || 'user'} 
                                    onChange={(e) => handleRoleChange(p.id, e.target.value)} 
                                    className="bg-dark-800 border border-dark-700 rounded px-2 py-1 text-xs text-neutral-200 focus:border-gold-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="user">{t('common.role_user')}</option>
                                    <option value="admin">{t('common.role_admin')}</option>
                                    {isSuperAdmin && <><option value="manager">{t('common.role_manager')}</option><option value="super_admin">{t('common.role_super_admin')}</option></>}
                                </select>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
            </div>
            <SectionSaveArea sectionId="team" />
          </div>
        )}

        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6 flex flex-col">
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between text-gold-500 border-b border-dark-700 pb-4 mb-2"><div className="flex items-center gap-2"><Palette size={20} /><h2 className="text-lg font-semibold">{t('admin_settings.look_feel')}</h2></div><Button size="sm" variant="outline" onClick={generateRandomTheme} className="h-8 text-xs">{t('admin_settings.surprise_me')}</Button></div>
            <div><label className="mb-2 block text-xs font-medium text-neutral-400">{t('admin_settings.color_presets')}</label><div className="flex flex-wrap gap-2">{PRESETS.map(p => (<button key={p.name} onClick={() => applyPreset(p)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-900 border border-dark-700 hover:border-neutral-300 transition-colors text-xs text-neutral-200"><div className="w-3 h-3 rounded-full" style={{ background: p.primary }}></div><span>{t('admin_settings.' + p.id)}</span></button>))}</div></div>
            <div className="grid grid-cols-1 gap-6 pt-2 border-t border-dark-700/50"><div><label className="mb-2 block text-xs font-medium text-neutral-400">{t('admin_settings.primary_color')}</label><div className="flex items-center gap-3"><input type="color" value={formData.primary_color} onChange={e => handleChange('primary_color', e.target.value)} className="h-10 w-full cursor-pointer rounded bg-transparent" /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="mb-2 block text-xs font-medium text-neutral-400">{t('admin_settings.bg_color_dark')}</label><div className="flex items-center gap-2"><input type="color" value={formData.color_background || '#0a0a0a'} onChange={e => handleChange('color_background', e.target.value)} className="h-10 w-full cursor-pointer rounded bg-transparent" /></div></div><div><label className="mb-2 block text-xs font-medium text-neutral-400">{t('admin_settings.bg_color_light')}</label><div className="flex items-center gap-2"><input type="color" value={formData.color_background_light || '#d4d4d4'} onChange={e => handleChange('color_background_light', e.target.value)} className="h-10 w-full cursor-pointer rounded bg-transparent" /></div></div></div><div><label className="mb-2 block text-xs font-medium text-neutral-400">{t('admin_settings.default_mode')}</label><div className="flex bg-dark-900 rounded-lg p-1 border border-dark-700 h-10 items-center"><button onClick={() => handleChange('theme_mode', 'light')} className={`flex-1 py-1.5 h-full text-xs font-medium rounded transition-colors ${formData.theme_mode === 'light' ? 'bg-neutral-200 text-dark-900' : 'text-neutral-400 hover:text-neutral-100'}`}>{t('admin_settings.light_mode')}</button><button onClick={() => handleChange('theme_mode', 'dark')} className={`flex-1 py-1.5 h-full text-xs font-medium rounded transition-colors ${formData.theme_mode === 'dark' ? 'bg-dark-700 text-white' : 'text-neutral-400 hover:text-neutral-100'}`}>{t('admin_settings.dark_mode')}</button></div></div></div>
            <div><label className="mb-2 block text-xs font-medium text-neutral-400">{t('admin_settings.content_width')}: {formData.content_width || 80}%</label><div className="flex items-center gap-3"><Maximize size={16} className="text-neutral-500"/><input type="range" min="50" max="100" value={formData.content_width || 80} onChange={(e) => handleChange('content_width', parseInt(e.target.value))} className="w-full accent-gold-500" /></div></div>
          </div>
          <SectionSaveArea sectionId="theme" />
        </div>

        <div className="lg:col-span-2 bg-dark-800/50 border border-dark-700 rounded-xl p-6 flex flex-col">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-2 text-gold-500 border-b border-dark-700 pb-4 mb-2"><ImageIcon size={20} /><h2 className="text-lg font-semibold">{t('admin_settings.assets')}</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3"><div className="flex justify-between items-center"><label className="block text-xs font-medium text-neutral-400">{t('admin_settings.logo_max')}</label></div><div className="flex gap-2"><Input placeholder={t('admin_settings.paste_url')} value={formData.logo_url || ''} onChange={(e) => handleChange('logo_url', e.target.value)} startIcon={<LinkIcon size={14}/>} className="bg-dark-900"/></div><div className="flex items-center gap-4"><div className="h-px bg-dark-700 flex-1"></div><span className="text-[10px] text-neutral-500 uppercase">{t('admin_settings.or_upload')}</span><div className="h-px bg-dark-700 flex-1"></div></div><input type="file" ref={logoInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileUpload(e, 'logo_url')}/><Button size="sm" variant="secondary" onClick={() => logoInputRef.current?.click()} className="w-full" disabled={isUploading}><Upload size={14} className="mr-2"/> {isUploading ? t('common.processing') : t('admin_settings.upload_file')}</Button><div className="h-32 w-full rounded-lg border border-dashed border-dark-600 bg-dark-900/50 flex items-center justify-center relative overflow-hidden group">{formData.logo_url ? (<img src={formData.logo_url} alt={t('common.alt_preview')} className="h-full w-auto object-contain p-2" />) : (<span className="text-xs text-neutral-500">{t('admin_settings.no_logo')}</span>)}</div></div>
                <div className="space-y-3"><div className="flex justify-between items-center"><label className="block text-xs font-medium text-neutral-400">{t('admin_settings.hero_max')}</label></div><div className="flex gap-2"><Input placeholder={t('admin_settings.paste_url')} value={formData.hero_image_url || ''} onChange={(e) => handleChange('hero_image_url', e.target.value)} startIcon={<LinkIcon size={14}/>} className="bg-dark-900"/></div><div className="flex items-center gap-4"><div className="h-px bg-dark-700 flex-1"></div><span className="text-[10px] text-neutral-500 uppercase">{t('admin_settings.or_upload')}</span><div className="h-px bg-dark-700 flex-1"></div></div><input type="file" ref={heroInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileUpload(e, 'hero_image_url')}/><Button size="sm" variant="secondary" onClick={() => heroInputRef.current?.click()} className="w-full" disabled={isUploading}><Upload size={14} className="mr-2"/> {isUploading ? t('common.processing') : t('admin_settings.upload_file')}</Button><div className="h-48 w-full rounded-lg border border-dashed border-dark-600 bg-dark-900/50 flex items-center justify-center relative overflow-hidden group">{formData.hero_image_url ? (<img src={formData.hero_image_url} alt={t('common.alt_preview')} className="w-full h-full object-cover" />) : (<span className="text-xs text-neutral-500">{t('admin_settings.no_hero')}</span>)}</div></div>
            </div>
          </div>
          <SectionSaveArea sectionId="assets" />
        </div>

        <div className="lg:col-span-2 bg-dark-800/50 border border-dark-700 rounded-xl p-6 flex flex-col">
           <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between text-gold-500 border-b border-dark-700 pb-4 mb-2"><div className="flex items-center gap-2"><Share2 size={20} /><h2 className="text-lg font-semibold">{t('admin_settings.social_media')}</h2></div><Button size="sm" onClick={addSocialLink} className="h-8 px-3 bg-gold-500 text-dark-900 hover:bg-gold-400 border-none font-medium"><Plus size={14} className="mr-1" /> {t('admin_settings.add_link')}</Button></div>
                <div className="space-y-3">{formData.social_links?.map((link, index) => (<div key={index} className="flex gap-3 items-start"><div className="w-1/3 md:w-1/4"><select value={link.platform} onChange={(e) => handleSocialChange(index, 'platform', e.target.value as any)} className="w-full h-10 rounded-md border border-dark-700 bg-dark-900 px-3 text-sm text-neutral-100 focus:border-gold-500 outline-none">{PLATFORMS.map(p => <option key={p} value={p}>{getPlatformLabel(p)}</option>)}</select></div><div className="flex-1"><Input value={link.url} onChange={(e) => handleSocialChange(index, 'url', e.target.value)} className="h-10 bg-dark-900" /></div><button onClick={() => removeSocialLink(index)} className="h-10 w-10 flex items-center justify-center rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20"><Trash2 size={16} /></button></div>))}</div>
           </div>
           <SectionSaveArea sectionId="social" />
        </div>

      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-dark-700 sticky bottom-0 bg-dark-900 p-4 -mx-4 lg:mx-0 z-30 shadow-2xl">
         <Button onClick={() => handleSave('global')} disabled={isSaving || isUploading} className="w-40 shadow-xl shadow-gold-500/10">
           {isSaving ? t('common.processing') : t('common.save')}
           {!isSaving && <Save className="ml-2 h-4 w-4" />}
         </Button>
         <Button variant="ghost" onClick={handleDiscard} disabled={isSaving || isUploading} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
           <RotateCcw className="mr-2 h-4 w-4" />
           {t('admin_settings.discard')}
         </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
