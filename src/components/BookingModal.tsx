import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { AutocompleteInput } from './ui/AutocompleteInput'; 
import { Minus, Plus, CheckCircle, ArrowRight, Phone, Clock } from 'lucide-react';
import { getAvailableTables, createBookingWithCustomer } from '../services/api';
import { findBestTableCombination } from '../hooks/use-booking';
import { COUNTRIES } from '../lib/countries';
import { useSettings } from '../hooks/use-settings';
import { useAuth } from '../hooks/use-auth';
import { generateTimeSlots, shouldIncrementDate } from '../lib/time-slots';
import { Customer } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNextDays = (days: number) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const calculateEndTime = (startTime: string, duration: number) => {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  let totalMinutes = h * 60 + m + duration; 
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
};

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const { settings, t, currentLanguage, formatDuration } = useSettings();
  const { profile, user } = useAuth();
  
  const isStaff = ['admin', 'manager', 'super_admin'].includes(profile?.role || '');
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [partySize, setPartySize] = useState(2);
  const [dates] = useState(getNextDays(14));
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  const [duration, setDuration] = useState(90); 

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+84');

  const maxDuration = settings.default_duration || 90;

  const durationOptions = useMemo(() => {
    const opts = [];
    for (let i = 30; i <= maxDuration; i += 30) {
      opts.push(i);
    }
    return opts;
  }, [maxDuration]);

  const availableSlots = useMemo(() => {
    return generateTimeSlots(
      selectedDate.toISOString().split('T')[0],
      settings.booking_schedule,
      duration
    );
  }, [selectedDate, settings.booking_schedule, duration]);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setError('');
      setLoading(false);
      setPartySize(2);
      setSelectedDate(dates[0]);
      setSelectedTime('');
      setDuration(maxDuration);

      if (profile && !isStaff) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        
        if (profile.phone) {
           const matchedCountry = COUNTRIES.find(c => profile.phone?.startsWith(c.dial_code));
           if (matchedCountry) {
             setCountryCode(matchedCountry.dial_code);
             setPhone(profile.phone.slice(matchedCountry.dial_code.length));
           } else {
             setPhone(profile.phone);
           }
        }
      } else {
         setFirstName('');
         setLastName('');
         setPhone('');
         setCountryCode('+84');
      }
    }
  }, [isOpen, dates, maxDuration, profile, isStaff]);

  const handleCustomerSelect = (customer: Customer) => {
    setFirstName(customer.first_name);
    setLastName(customer.last_name);
    
    const fullPhone = customer.phone;
    const matchedCountry = COUNTRIES.find(c => fullPhone.startsWith(c.dial_code));
    if (matchedCountry) {
       setCountryCode(matchedCountry.dial_code);
       setPhone(fullPhone.slice(matchedCountry.dial_code.length));
    } else {
       setPhone(fullPhone);
    }
  };

  const formatDateValue = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleConfirm = async () => {
    if (!selectedTime) {
      setError(t('booking.error_fill_details'));
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError(t('booking.error_fill_details'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      const daySchedule = settings.booking_schedule?.find(s => s.day === dayName);
      let dateToSubmit = new Date(selectedDate);
      
      if (daySchedule && shouldIncrementDate(selectedTime, daySchedule.openTime)) {
          dateToSubmit.setDate(dateToSubmit.getDate() + 1);
      }
      
      const dateStr = formatDateValue(dateToSubmit);
      
      const allAvailableTables = await getAvailableTables(dateStr, selectedTime, 1, duration);
      const bestTableIds = findBestTableCombination(allAvailableTables, partySize);

      if (!bestTableIds || bestTableIds.length === 0) {
        setError(t('booking.error_no_tables'));
        setLoading(false);
        return;
      }

      const cleanPhone = phone.replace(/\D/g, '').replace(/^0+/, '');
      const formattedPhone = `${countryCode}${cleanPhone}`;

      const userIdToPass = (user && !isStaff) ? user.id : undefined;

      await createBookingWithCustomer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: formattedPhone,
        partySize,
        date: dateStr,
        time: selectedTime,
        tableIds: bestTableIds, 
        createCustomer: true, 
        duration: duration,
        userId: userIdToPass
      });

      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('common.error_generic'));
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    const formattedDate = selectedDate.toLocaleDateString(currentLanguage.code, { weekday: 'long', month: 'short', day: 'numeric' });
    const successMsg = t('booking.success_detail')
       .replace('{partySize}', partySize.toString())
       .replace('{date}', formattedDate)
       .replace('{time}', selectedTime);

    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('booking.success_title')}>
        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500">
            <CheckCircle size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-serif text-neutral-100">{t('booking.success_message')}</h3>
            <p className="text-neutral-400 mt-2">
              {successMsg} ({formatDuration(duration)})
            </p>
          </div>
          <Button onClick={onClose} className="mt-4 min-w-[120px]">{t('common.close')}</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('booking.title')}>
      <div className="space-y-4">
        
        {/* Party Size */}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.party_size')}</label>
          <div className="flex items-center justify-between bg-dark-800 rounded-xl p-2 px-4">
            <button 
              onClick={() => setPartySize(Math.max(1, partySize - 1))}
              className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-neutral-300 hover:bg-dark-600 transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="text-xl font-bold text-neutral-100">{partySize}</span>
            <button 
              onClick={() => setPartySize(Math.min(20, partySize + 1))}
              className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-dark-900 hover:bg-gold-400 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.select_date')}</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {dates.map((date) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedTime('');
                  }}
                  className={`flex flex-col items-center justify-center min-w-[60px] py-2 rounded-xl border transition-all ${
                    isSelected 
                      ? 'bg-gold-500 border-gold-500 text-dark-900' 
                      : 'bg-dark-800 border-transparent text-neutral-400 hover:border-dark-600'
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase mb-0.5">
                    {date.toLocaleDateString(currentLanguage.code, { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-bold leading-none">
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration Selection */}
        <div>
           <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.duration')}</label>
           <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <select 
                value={duration}
                onChange={(e) => {
                    setDuration(parseInt(e.target.value));
                    setSelectedTime('');
                }}
                className="flex h-10 w-full rounded-md border border-dark-700 bg-dark-800 pl-10 pr-3 py-2 text-sm text-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-500 appearance-none transition-colors cursor-pointer"
              >
                 {durationOptions.map(opt => (
                   <option key={opt} value={opt} className="bg-dark-900">
                     {formatDuration(opt)}
                   </option>
                 ))}
              </select>
           </div>
        </div>

        {/* Time Selection */}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.select_time')}</label>
          
          {availableSlots.lunch.length > 0 && (
            <>
              <div className="mb-1.5 text-[10px] text-neutral-500 uppercase tracking-wide">{t('booking.lunch')}</div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {availableSlots.lunch.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedTime === time
                        ? 'bg-gold-500 text-dark-900'
                        : 'bg-dark-800 text-neutral-400 hover:bg-dark-700'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mb-1.5 text-[10px] text-neutral-500 uppercase tracking-wide">{t('booking.dinner')}</div>
          <div className="grid grid-cols-4 gap-2">
            {availableSlots.dinner.length > 0 ? availableSlots.dinner.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedTime === time
                    ? 'bg-gold-500 text-dark-900'
                    : 'bg-dark-800 text-neutral-400 hover:bg-dark-700'
                }`}
              >
                {time}
              </button>
            )) : <span className="text-xs text-neutral-600 col-span-4 italic pl-1">{t('booking.no_slots')}</span>}
          </div>
        </div>

        {/* Selected Time Summary */}
        {selectedTime && (
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-3 flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-xs text-neutral-400 mb-2">{t('booking.selected_booking')} ({formatDuration(duration)})</span>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-[10px] text-neutral-500 mb-0.5">{t('booking.starts')}</div>
                <div className="text-xl font-bold text-gold-500">{selectedTime}</div>
              </div>
              <ArrowRight className="text-neutral-600 mt-4" size={16} />
              <div className="text-center">
                <div className="text-[10px] text-neutral-500 mb-0.5">{t('booking.ends')}</div>
                <div className="text-xl font-bold text-gold-500">{calculateEndTime(selectedTime, duration)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-3 pt-1">
          <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">{t('booking.guest_details')}</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {isStaff ? (
              <AutocompleteInput 
                placeholder={t('auth.ph_first_name')}
                value={firstName}
                onChange={setFirstName}
                onSelect={handleCustomerSelect}
                className="bg-dark-800 border-dark-700 text-neutral-100 placeholder-neutral-600 focus:border-gold-500 h-9 text-sm"
              />
            ) : (
              <Input 
                placeholder={t('auth.ph_first_name')} 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-dark-800 border-dark-700 text-neutral-100 placeholder-neutral-600 focus:border-gold-500 h-9 text-sm"
              />
            )}
            <Input 
              placeholder={t('auth.ph_last_name')} 
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-dark-800 border-dark-700 text-neutral-100 placeholder-neutral-600 focus:border-gold-500 h-9 text-sm"
            />
          </div>
          
          <div className="flex gap-2">
             <div className="w-28 shrink-0">
               <div className="relative">
                  <select 
                    className="appearance-none flex h-9 w-full rounded-md border border-dark-700 bg-dark-800 px-3 py-2 text-xs text-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-500 transition-all"
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
              {isStaff ? (
                <AutocompleteInput 
                  type="tel"
                  placeholder={t('auth.ph_phone')} 
                  value={phone} 
                  onChange={setPhone}
                  onSelect={handleCustomerSelect}
                  className="bg-dark-800 border-dark-700 text-neutral-100 placeholder-neutral-600 focus:border-gold-500 h-9 text-sm"
                  startIcon={<Phone size={14} />}
                />
              ) : (
                <Input 
                  type="tel" 
                  placeholder={t('auth.ph_phone')} 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="bg-dark-800 border-dark-700 text-neutral-100 placeholder-neutral-600 focus:border-gold-500 h-9 text-sm"
                  startIcon={<Phone size={14} />}
                />
              )}
             </div>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-xs text-center bg-red-500/10 p-2 rounded">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 border-dark-700 text-neutral-400 hover:bg-dark-800 hover:text-white h-10"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="flex-1 font-semibold h-10"
            disabled={loading}
          >
            {loading ? t('booking.confirming') : t('booking.confirm_button')}
          </Button>
        </div>

      </div>
    </Modal>
  );
};