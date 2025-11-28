
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/use-auth';
import { useSettings } from '../hooks/use-settings';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, AlertCircle, CheckCircle2, Phone } from 'lucide-react';
import { COUNTRIES } from '../lib/countries';

interface AuthMessage {
  type: 'success' | 'error';
  text: string;
}

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+84'); 

  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  
  const navigate = useNavigate();
  const { user, profile, loginAsGuest, isGuest, loading: authLoading } = useAuth();
  const { settings, getLocalizedText, t, currentLanguage } = useSettings();

  useEffect(() => {
    if (!isSubmitting && !authLoading) {
      const isStaff = ['admin', 'manager', 'super_admin'].includes(profile?.role || '');
      
      if (isStaff) {
        navigate('/admin/dashboard', { replace: true });
      } else if (user || isGuest) {
        navigate('/', { replace: true });
      }
    }
  }, [user, profile, isGuest, navigate, isSubmitting, authLoading]);

  const mapAuthError = (msg: string) => {
    if (msg.includes('Invalid login credentials')) return t('auth.error_invalid_credentials');
    if (msg.includes('User already registered')) return t('auth.error_user_already_registered');
    if (msg.includes('Password should be at least')) return t('auth.error_password_too_short');
    if (msg.includes('Email not confirmed')) return t('auth.msg_email_not_confirmed');
    return msg;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setNeedsVerification(false);

    try {
      if (isSignUp) {
        if (!firstName.trim()) throw new Error(t('common.error_fill_all'));
        if (!lastName.trim()) throw new Error(t('common.error_fill_all'));
        if (!phone.trim()) throw new Error(t('common.error_fill_all'));

        const cleanPhone = phone.replace(/\D/g, '').replace(/^0+/, '');
        const formattedPhone = `${countryCode}${cleanPhone}`;

        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              phone: formattedPhone
            }
          } 
        });
        if (error) throw error;
        setMessage({ type: 'success', text: t('auth.msg_account_created') });
        setNeedsVerification(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setNeedsVerification(true);
            throw new Error(t('auth.msg_email_not_confirmed'));
          }
          throw error;
        }
      }
    } catch (err: any) {
      const errorText = mapAuthError(err.message || t('common.error_generic'));
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      setMessage({ type: 'success', text: t('auth.msg_verification_resent') });
    } catch (err: any) {
      setMessage({ type: 'error', text: mapAuthError(err.message) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: t('auth.msg_enter_email_first') });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/auth/reset-password',
      });
      if (error) throw error;
      setMessage({ type: 'success', text: t('auth.msg_reset_link_sent') });
    } catch (err: any) {
      setMessage({ type: 'error', text: mapAuthError(err.message) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestAccess = () => {
    loginAsGuest();
  };

  const style = settings.hero_branding_style || 'text';
  const showLogo = settings.logo_url && (style === 'logo' || style === 'both');
  const showText = style === 'text' || style === 'both';
  const effectiveShowLogo = showLogo;
  const effectiveShowText = showText || (!settings.logo_url && style === 'logo');
  const logoHeight = settings.logo_height_hero || 120;

  const description = getLocalizedText(settings.description, settings.description_translations);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-dark-900 text-neutral-100 overflow-hidden p-4">
      {/* Background */}
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-dark-900/90 via-dark-900/95 to-dark-900 z-10"></div>
         <img 
           src={settings.hero_image_url} 
           alt={t('common.alt_background')} 
           className="h-full w-full object-cover opacity-20"
         />
      </div>

      <div className="relative z-20 w-full max-w-md flex flex-col items-center">
        <div className="mb-8 text-center flex flex-col items-center gap-4">
          {effectiveShowLogo && (
            <img 
              src={settings.logo_url} 
              alt={t('common.alt_logo')} 
              style={{ height: `${logoHeight * 0.8}px`, maxHeight: '200px' }}
              className="w-auto object-contain drop-shadow-2xl"
            />
          )}

          {effectiveShowText && (
            <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 drop-shadow-lg uppercase tracking-wider">
              {settings.restaurant_name}
            </h1>
          )}

          <p className="text-neutral-400 text-sm md:text-base font-light max-w-xs italic">
            {description}
          </p>
        </div>

        <div className="w-full rounded-2xl border border-dark-700 bg-dark-800/40 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl text-neutral-200">
              {isSignUp ? t('auth.create_account') : t('auth.welcome_back')}
            </h2>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div className="flex gap-2">
                  <Input 
                    type="text" 
                    placeholder={t('auth.ph_first_name')} 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required={isSignUp}
                    className="bg-dark-900/60 border-dark-600 focus:border-gold-500 h-12"
                  />
                  <Input 
                    type="text" 
                    placeholder={t('auth.ph_last_name')} 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    required={isSignUp}
                    className="bg-dark-900/60 border-dark-600 focus:border-gold-500 h-12"
                  />
                </div>
                
                <div className="flex gap-2">
                   <div className="w-28 shrink-0">
                     <div className="relative">
                        <select 
                          className="appearance-none flex h-12 w-full rounded-md border border-dark-600 bg-dark-900/60 px-3 py-2 text-sm text-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-500 transition-all"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.dial_code} className="bg-dark-900 text-neutral-200">
                               {c.code} ({c.dial_code})
                            </option>
                          ))}
                        </select>
                     </div>
                   </div>
                   <div className="flex-1">
                    <Input 
                      type="tel" 
                      placeholder={t('auth.ph_phone')} 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      required={isSignUp}
                      className="bg-dark-900/60 border-dark-600 focus:border-gold-500 h-12"
                    />
                   </div>
                </div>
              </>
            )}

            <Input 
              type="email" 
              placeholder={t('auth.ph_email')} 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              startIcon={<Mail size={18} />}
              className="bg-dark-900/60 border-dark-600 focus:border-gold-500 h-12"
            />
            <div>
              <Input 
                type="password" 
                placeholder={t('auth.ph_password')} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                startIcon={<Lock size={18} />}
                className="bg-dark-900/60 border-dark-600 focus:border-gold-500 h-12"
              />
              {!isSignUp && (
                <div className="flex justify-end mt-2">
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-xs text-neutral-400 hover:text-gold-500 transition-colors"
                  >
                    {t('auth.forgot_password')}
                  </button>
                </div>
              )}
            </div>
            
            {message && (
              <div className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                <span>{message.text}</span>
              </div>
            )}

            {needsVerification && (
               <Button 
                 type="button" 
                 variant="outline" 
                 className="w-full border-dashed border-gold-500/50 text-gold-500 hover:bg-gold-500/10"
                 onClick={handleResendVerification}
                 disabled={isSubmitting}
               >
                 {t('auth.resend_verification')}
               </Button>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg shadow-gold-500/10" disabled={isSubmitting}>
              {isSubmitting ? t('common.processing') : (isSignUp ? t('auth.create_account') : t('auth.sign_in_button'))}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-500">
            {isSignUp ? t('auth.have_account') : t('auth.no_account')}{' '}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
                setNeedsVerification(false);
              }} 
              className="text-gold-500 hover:text-gold-400 font-medium transition-colors"
            >
              {isSignUp ? t('auth.sign_in_button') : t('auth.sign_up_button')}
            </button>
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-dark-700"></div>
            <span className="text-xs text-neutral-600 font-medium">or</span>
            <div className="h-px flex-1 bg-dark-700"></div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 border-dark-600 text-neutral-400 hover:text-white hover:bg-dark-700 hover:border-dark-500"
            onClick={handleGuestAccess}
          >
            {t('auth.continue_guest')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
