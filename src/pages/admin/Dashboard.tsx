import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminBookings, createBookingWithCustomer, getAvailableTables } from '../../services/api';
import { Users, Calendar, TrendingUp, Minus, Plus, CheckCircle, AlertCircle, ArrowRight, Timer } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AutocompleteInput } from '../../components/ui/AutocompleteInput';
import { findBestTableCombination } from '../../hooks/use-booking';
import { COUNTRIES } from '../../lib/countries';
import { useSettings } from '../../hooks/use-settings';
import { Customer, AdminBookingView } from '../../types';
import { generateTimeSlots } from '../../lib/time-slots';

const AVG_SPEND_PER_GUEST = 65;

// Helper to generate dates
const getNextDays = (count: number) => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
};

const calculateEndTime = (startTime: string, duration: number = 90) => {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  let totalMinutes = h * 60 + m + duration; 
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
};

const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { settings, t, currentLanguage, formatCurrency, formatDuration } = useSettings();
  
  const { data: bookings, isLoading: statsLoading } = useQuery<AdminBookingView[]>({
    queryKey: ['adminBookings'],
    queryFn: getAdminBookings,
  });

  const [partySize, setPartySize] = useState(2);
  const [dates] = useState(getNextDays(7));
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState(settings.default_duration || 90);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+84');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const availableSlots = useMemo(() => {
    return generateTimeSlots(
      selectedDate.toISOString().split('T')[0],
      settings.booking_schedule,
      duration,
      true // isAdmin
    );
  }, [selectedDate, settings.booking_schedule, duration]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysBookings = bookings?.filter(b => b.booking_date === todayStr)?.length || 0;
  const totalGuests = bookings?.reduce((acc, curr) => acc + curr.party_size, 0) || 0;
  const estimatedRevenue = totalGuests * AVG_SPEND_PER_GUEST;

  const handleCustomerSelect = (customer: Customer) => {
    setFirstName(customer.first_name);
    setLastName(customer.last_name);
    
    const fullPhone = customer.phone;
    const matchedCountry = COUNTRIES.find(c => fullPhone.startsWith(c.dial_code));
    if (matchedCountry) {
       setCountryCode(matchedCountry.dial_code);
       setCustomerPhone(fullPhone.slice(matchedCountry.dial_code.length));
    } else {
       setCustomerPhone(fullPhone);
    }
  };

  const handleQuickBook = async () => {
    if (!selectedTime || !firstName.trim() || !lastName.trim() || !customerPhone.trim()) {
      setNotification({ type: 'error', message: t('booking.error_fill_details') });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const tables = await getAvailableTables(dateStr, selectedTime, 1, duration); 
      const tableIds = findBestTableCombination(tables, partySize);

      if (!tableIds || tableIds.length === 0) {
        throw new Error(t('booking.error_no_tables'));
      }

      const cleanPhone = customerPhone.replace(/\D/g, '').replace(/^0+/, '');
      const formattedPhone = `${countryCode}${cleanPhone}`;

      await createBookingWithCustomer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: formattedPhone,
        partySize,
        date: dateStr,
        time: selectedTime,
        tableIds,
        createCustomer: true,
        duration: duration
      });

      setNotification({ type: 'success', message: t('booking.success_title') });
      setFirstName('');
      setLastName('');
      setCustomerPhone('');
      setSelectedTime('');
      setDuration(settings.default_duration || 90);
      
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['dailyBookings'] });
      
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || t('common.error_generic') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-100 font-serif mb-1">{t('dashboard.new_booking')}</h1>
        <p className="text-neutral-400">{t('dashboard.quick_book')}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        
        {/* Quick Book Section */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-neutral-100 mb-4">{t('dashboard.quick_book')}</h2>
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-xl">
            
            <div className="mb-5">
              <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">{t('booking.party_size')}</label>
              <div className="flex items-center justify-between bg-dark-900 rounded-lg p-2">
                <button onClick={() => setPartySize(Math.max(1, partySize - 1))} className="w-10 h-10 rounded-md bg-dark-800 border border-dark-700 flex items-center justify-center text-neutral-300 hover:bg-dark-700 transition-colors"><Minus size={18} /></button>
                <span className="text-2xl font-bold text-neutral-100 px-6">{partySize}</span>
                <button onClick={() => setPartySize(Math.min(20, partySize + 1))} className="w-10 h-10 rounded-md bg-gold-500 text-dark-900 flex items-center justify-center hover:bg-gold-400 transition-colors font-bold"><Plus size={18} /></button>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">{t('booking.select_date')}</label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5">
                {dates.map((date) => {
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  return (
                    <button key={date.toISOString()} onClick={() => { setSelectedDate(date); setSelectedTime(''); }} className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-all ${isSelected ? 'bg-gold-500 border-gold-500 text-dark-900' : 'bg-dark-900 border-dark-700 text-neutral-400 hover:border-neutral-500'}`}>
                      <span className="text-[10px] font-medium uppercase mb-0.5">{date.toLocaleDateString(currentLanguage.code, { weekday: 'short' })}</span>
                      <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">{t('booking.select_time')}</label>
              <div className="text-[10px] text-neutral-500 mb-1.5">{t('booking.lunch')}</div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-2.5">
                {availableSlots.lunch.length > 0 ? availableSlots.lunch.map(time => (
                  <button key={time} onClick={() => setSelectedTime(time)} className={`py-1.5 rounded text-xs font-medium transition-colors border ${selectedTime === time ? 'bg-gold-500 border-gold-500 text-dark-900' : 'bg-dark-900 border-dark-700 text-neutral-400 hover:border-neutral-500'}`}>{time}</button>
                )) : <span className="col-span-4 text-xs text-neutral-500 italic">{t('booking.no_slots')}</span>}
              </div>
              <div className="text-[10px] text-neutral-500 mb-1.5">{t('booking.dinner')}</div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {availableSlots.dinner.length > 0 ? availableSlots.dinner.map(time => (
                  <button key={time} onClick={() => setSelectedTime(time)} className={`py-1.5 rounded text-xs font-medium transition-colors border ${selectedTime === time ? 'bg-gold-500 border-gold-500 text-dark-900' : 'bg-dark-900 border-dark-700 text-neutral-400 hover:border-neutral-500'}`}>{time}</button>
                )) : <span className="col-span-4 text-xs text-neutral-500 italic">{t('booking.no_slots')}</span>}
              </div>
            </div>

            {selectedTime && (
              <div className="bg-dark-900/80 border border-dark-700 rounded-xl p-3 mb-5 flex flex-col items-center">
                <span className="text-xs text-neutral-400 mb-2">{t('booking.selected_booking')} ({formatDuration(duration)})</span>
                <div className="flex items-center gap-6">
                  <div className="text-center"><div className="text-[10px] text-neutral-500 mb-0.5">{t('booking.starts')}</div><div className="text-xl font-bold text-gold-500">{selectedTime}</div></div>
                  <ArrowRight className="text-neutral-600 mt-3" size={16} />
                  <div className="text-center"><div className="text-[10px] text-neutral-500 mb-0.5">{t('booking.ends')}</div><div className="text-xl font-bold text-gold-500">{calculateEndTime(selectedTime, duration)}</div></div>
                </div>
              </div>
            )}
            
             <div className="mb-5">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.duration')} (Min)</label>
                <div className="relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"><Timer size={16} /></div>
                   <input type="number" min={30} step={30} value={duration} onChange={(e) => { setDuration(parseInt(e.target.value)); setSelectedTime(''); }} className="w-full h-10 rounded-md border border-dark-700 bg-dark-900 pl-10 pr-4 text-sm text-neutral-100 focus:outline-none focus:border-gold-500" />
                </div>
             </div>

            {/* Inputs with Autocomplete */}
            <div className="space-y-4 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AutocompleteInput 
                  placeholder={t('auth.ph_first_name')}
                  value={firstName}
                  onChange={setFirstName}
                  onSelect={handleCustomerSelect}
                  className="bg-dark-900 border-dark-700 text-neutral-100 placeholder-neutral-600"
                />
                <Input 
                  placeholder={t('auth.ph_last_name')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-dark-900 border-dark-700 text-neutral-100 placeholder-neutral-600"
                />
              </div>

              <div className="flex gap-2">
                 <div className="w-28 shrink-0">
                   <div className="relative">
                      <select 
                        className="appearance-none flex h-10 w-full rounded-md border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-500 transition-all"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                      >
                        {COUNTRIES.map((c) => (<option key={c.code} value={c.dial_code} className="bg-dark-900 text-neutral-200">{c.code} ({c.dial_code})</option>))}
                      </select>
                   </div>
                 </div>
                 <div className="flex-1">
                  <AutocompleteInput 
                    type="tel" 
                    placeholder={t('auth.ph_phone')}
                    value={customerPhone} 
                    onChange={setCustomerPhone} 
                    onSelect={handleCustomerSelect}
                    className="bg-dark-900 border-dark-700 text-neutral-100 placeholder-neutral-600 focus:border-gold-500"
                  />
                 </div>
              </div>
            </div>

            {notification && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${notification.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {notification.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {notification.message}
              </div>
            )}

            <Button onClick={handleQuickBook} className="w-full h-11 font-bold text-base shadow-lg shadow-gold-500/10" disabled={isSubmitting}>
              {isSubmitting ? t('common.processing') : t('dashboard.confirm_reservation')}
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-neutral-100">{t('dashboard.todays_stats')}</h2>
          {statsLoading ? (
            <div className="text-neutral-500 text-sm">{t('common.loading')}</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-dark-800 border border-dark-700 p-5 rounded-xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500"><Calendar size={24} /></div>
                <div><div className="text-2xl font-bold text-neutral-100">{todaysBookings}</div><div className="text-xs text-neutral-400 uppercase tracking-wider">{t('dashboard.bookings_today')}</div></div>
              </div>
              <div className="bg-dark-800 border border-dark-700 p-5 rounded-xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><Users size={24} /></div>
                <div><div className="text-2xl font-bold text-neutral-100">{totalGuests}</div><div className="text-xs text-neutral-400 uppercase tracking-wider">{t('dashboard.total_guests')}</div></div>
              </div>
              <div className="bg-dark-800 border border-dark-700 p-5 rounded-xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"><TrendingUp size={24} /></div>
                <div><div className="text-2xl font-bold text-neutral-100">{formatCurrency(estimatedRevenue)}</div><div className="text-xs text-neutral-400 uppercase tracking-wider">{t('dashboard.est_revenue')}</div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;