
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminBookings, updateBookingGroup, updateCustomer, createBookingWithCustomer, getAvailableTables, deleteBookingSmart } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AutocompleteInput } from '../../components/ui/AutocompleteInput';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Search, Calendar, FilterX, Plus, AlertCircle, Clock, Users, Trash2, Minus, Timer } from 'lucide-react';
import { COUNTRIES } from '../../lib/countries';
import { findBestTableCombination } from '../../hooks/use-booking';
import { useSettings } from '../../hooks/use-settings';
import { Customer, AdminBookingView } from '../../types';
import { generateTimeSlots } from '../../lib/time-slots';

const ZaloIcon = ({ className, size = "1em" }: { className?: string; size?: number | string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} width={size} height={size}>
    <path d="M10 10C10 6.68629 12.6863 4 16 4H32C35.3137 4 38 6.68629 38 10V32C38 35.3137 35.3137 38 32 38H16C12.6863 38 10 35.3137 10 32V10Z" fill="currentColor" fillOpacity="0.2"/>
    <path d="M28.5 16H19V19.5H25.5L19 28.5V32H29V28.5H22.5L29 19.5V16H28.5Z" fill="currentColor"/>
  </svg>
);

const WhatsAppIcon = ({ className, size = "1em" }: { className?: string; size?: number | string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={size} height={size}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const calculateEndTime = (startTime: string, duration: number = 90) => {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  let totalMinutes = h * 60 + m + duration; 
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
};

const getNextDays = (days: number, startDate: Date = new Date()) => {
  const dates = [];
  const start = new Date(startDate);
  start.setHours(0,0,0,0);
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const AdminBookings: React.FC = () => {
  const queryClient = useQueryClient();
  const { settings, t, currentLanguage, formatTime } = useSettings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [error, setGlobalError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBookingGroup, setSelectedBookingGroup] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [bookingToDelete, setBookingToDelete] = useState<AdminBookingView | null>(null);

  const [formPartySize, setFormPartySize] = useState(2);
  const [formDate, setFormDate] = useState<Date>(new Date());
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState(90);
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCountryCode, setFormCountryCode] = useState('+84');

  const { data: bookings, isLoading } = useQuery<AdminBookingView[]>({
    queryKey: ['adminBookings'],
    queryFn: getAdminBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: async (booking: AdminBookingView) => {
        if (!booking.customer_id) throw new Error(t('common.error_generic'));
        await deleteBookingSmart(booking.group_id, booking.customer_id, booking.customer_user_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['dailyBookings'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setBookingToDelete(null);
      setGlobalError(null);
    },
    onError: (err: any) => {
        setBookingToDelete(null);
        setGlobalError(`${t('common.error_delete')}: ${err.message}`);
    }
  });

  const availableSlots = useMemo(() => {
    return generateTimeSlots(
      formDate.toISOString().split('T')[0],
      settings.booking_schedule,
      formDuration,
      true // isAdmin
    );
  }, [formDate, settings.booking_schedule, formDuration]);

  const handleConfirmDelete = () => {
    if (bookingToDelete) {
        cancelMutation.mutate(bookingToDelete);
    }
  };

  const openAddModal = () => {
    setFormPartySize(2);
    setFormDate(new Date());
    setFormTime('');
    setFormDuration(settings.default_duration || 90);
    setFormFirstName('');
    setFormLastName('');
    setFormPhone('');
    setFormCountryCode('+84');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormFirstName(customer.first_name);
    setFormLastName(customer.last_name);
    const fullPhone = customer.phone;
    const matchedCountry = COUNTRIES.find(c => fullPhone.startsWith(c.dial_code));
    if (matchedCountry) {
       setFormCountryCode(matchedCountry.dial_code);
       setFormPhone(fullPhone.slice(matchedCountry.dial_code.length));
    } else {
       setFormPhone(fullPhone);
    }
  };

  const handleAddBooking = async () => {
    if (!formTime || !formFirstName.trim() || !formLastName.trim() || !formPhone.trim()) {
        setFormError(t('common.error_fill_all'));
        return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
        const dateStr = formDate.toISOString().split('T')[0];
        const tables = await getAvailableTables(dateStr, formTime, 1, formDuration);
        const tableIds = findBestTableCombination(tables, formPartySize);
        if (!tableIds || tableIds.length === 0) throw new Error(t('booking.error_no_tables'));
        const cleanPhone = formPhone.replace(/\D/g, '').replace(/^0+/, '');
        const fullPhone = `${formCountryCode}${cleanPhone}`;
        await createBookingWithCustomer({
            firstName: formFirstName.trim(),
            lastName: formLastName.trim(),
            phone: fullPhone,
            partySize: formPartySize,
            date: dateStr,
            time: formTime,
            tableIds,
            createCustomer: true,
            duration: formDuration
        });
        setIsAddModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
        queryClient.invalidateQueries({ queryKey: ['dailyBookings'] });
    } catch (err: any) {
        setFormError(err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const fetchBookingDetails = async (groupId: string) => {
    const { data: booking, error } = await supabase.from('bookings').select('*, customer:customers(*)').eq('group_id', groupId).limit(1).single();
    if (error || !booking) {
      alert(t('common.error_fetch'));
      return;
    }
    setSelectedBookingGroup(booking);
    setFormPartySize(booking.party_size);
    setFormDate(new Date(booking.booking_date));
    setFormTime(booking.booking_time.substring(0, 5));
    setFormDuration(booking.duration || 90);
    if (booking.customer) {
        setFormFirstName(booking.customer.first_name || '');
        setFormLastName(booking.customer.last_name || '');
        const fullPhone = booking.customer.phone || '';
        const matchedCountry = COUNTRIES.find(c => fullPhone.startsWith(c.dial_code));
        if (matchedCountry) {
            setFormCountryCode(matchedCountry.dial_code);
            setFormPhone(fullPhone.slice(matchedCountry.dial_code.length));
        } else {
            setFormPhone(fullPhone);
        }
    }
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBookingGroup) return;
    setIsSaving(true);
    setFormError(null);
    try {
        const dateStr = formDate.toISOString().split('T')[0];
        if (selectedBookingGroup.customer_id) {
            const cleanPhone = formPhone.replace(/\D/g, '').replace(/^0+/, '');
            const fullPhone = `${formCountryCode}${cleanPhone}`;
            await updateCustomer(selectedBookingGroup.customer_id, {
                first_name: formFirstName,
                last_name: formLastName,
                phone: fullPhone
            });
        }
        const tables = await getAvailableTables(dateStr, formTime, 1, formDuration, selectedBookingGroup.group_id);
        const bestTableIds = findBestTableCombination(tables, formPartySize);
        if (!bestTableIds || bestTableIds.length === 0) throw new Error(t('booking.error_no_tables'));
        await updateBookingGroup(selectedBookingGroup.group_id, {
            date: dateStr,
            time: formTime,
            partySize: formPartySize,
            duration: formDuration,
            tableIds: bestTableIds
        });
        setIsEditModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
        queryClient.invalidateQueries({ queryKey: ['dailyBookings'] });
    } catch (err: any) {
        setFormError(err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter(b => {
      const matchesSearch = b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.phone?.includes(searchTerm);
      const matchesDate = filterDate ? b.booking_date === filterDate : true;
      return matchesSearch && matchesDate;
    });
  }, [bookings, searchTerm, filterDate]);

  const dateOptions = useMemo(() => {
    return getNextDays(14, isEditModalOpen && selectedBookingGroup ? undefined : new Date());
  }, [selectedBookingGroup, isEditModalOpen]);

  const handleWhatsApp = (p: string) => window.open(`https://wa.me/${p.replace(/\D/g, '')}`, '_blank');
  const handleZalo = (p: string) => window.open(`https://zalo.me/${p.replace(/\D/g, '')}`, '_blank');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100 font-serif mb-1">{t('dashboard.manage_bookings')}</h1>
          <p className="text-neutral-400">{t('dashboard.manage_bookings_desc')}</p>
        </div>
        {error && <div className="bg-red-500/10 p-3 rounded-lg text-red-500 text-sm border border-red-500/20">{error}</div>}
        <div className="flex flex-col md:flex-row justify-between gap-4 items-end md:items-center">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                <input placeholder={t('dashboard.search_bookings')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-gold-500 outline-none min-w-[240px] w-full md:w-auto" />
            </div>
            <div className="relative w-full md:w-auto">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-gold-500 cursor-pointer w-full md:w-auto" />
            </div>
            {(searchTerm || filterDate) && <Button variant="ghost" onClick={() => { setSearchTerm(''); setFilterDate(''); }} className="text-neutral-400 hover:text-white whitespace-nowrap h-[42px]"><FilterX size={16} className="mr-2" /> {t('common.cancel')}</Button>}
          </div>
          <Button onClick={openAddModal} className="whitespace-nowrap shadow-lg shadow-gold-500/10 h-[42px]"><Plus size={18} className="mr-2" /> {t('dashboard.add_new_booking')}</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-dark-700 bg-dark-800/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-800/80 text-neutral-400 font-medium border-b border-dark-700">
              <tr>
                <th className="p-4 pl-6 font-medium">{t('dashboard.col_customer')}</th>
                <th className="p-4 font-medium">{t('dashboard.tables')}</th>
                <th className="p-4 font-medium">{t('dashboard.col_date_time')}</th>
                <th className="p-4 font-medium">{t('dashboard.col_size')}</th>
                <th className="p-4 pr-6 font-medium text-right">{t('dashboard.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => {
                  const endTime = calculateEndTime(booking.booking_time, booking.duration);
                  return (
                    <tr key={booking.group_id} className="hover:bg-dark-700/30 transition-colors group">
                      <td className="p-4 pl-6"><div className="text-neutral-100 font-medium">{booking.customer_name}</div><div className="text-xs text-neutral-500 font-mono mt-0.5">{booking.phone}</div></td>
                      <td className="p-4 text-neutral-300">{booking.table_numbers}</td>
                      <td className="p-4"><div className="text-neutral-200">{new Date(booking.booking_date).toLocaleDateString(currentLanguage.code, { month: 'short', day: 'numeric' })}</div><div className="text-xs text-neutral-500 font-mono mt-0.5 flex items-center gap-1"><Clock size={10} /> {formatTime(booking.booking_time.substring(0, 5))} - {formatTime(endTime)}</div></td>
                      <td className="p-4"><div className="flex items-center gap-1.5"><Users size={14} className="text-neutral-500" /><span className="text-neutral-200">{booking.party_size}</span></div></td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => fetchBookingDetails(booking.group_id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gold-500/10 text-gold-500 hover:bg-gold-500/20 border border-gold-500/20 transition-colors text-xs font-medium">{t('common.edit')}</button>
                          <button onClick={() => handleWhatsApp(booking.phone)} className="p-1.5 rounded-md bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 transition-colors"><WhatsAppIcon size={18} /></button>
                          <button onClick={() => handleZalo(booking.phone)} className="p-1.5 rounded-md bg-[#0068FF]/10 text-[#0068FF] hover:bg-[#0068FF]/20 border border-[#0068FF]/20 transition-colors"><ZaloIcon size={22} /></button>
                          <div className="w-px h-4 bg-dark-700 mx-1"></div>
                          <button onClick={() => setBookingToDelete(booking)} className="p-1.5 rounded-md border transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (<tr><td colSpan={5} className="p-12 text-center text-neutral-500">{t('dashboard.no_bookings_found')}</td></tr>)}
            </tbody>
          </table>
      </div>

      <ConfirmModal isOpen={!!bookingToDelete} onClose={() => setBookingToDelete(null)} onConfirm={handleConfirmDelete} title={t('dashboard.cancel_reservation')} message={bookingToDelete?.customer_user_id ? t('dashboard.cancel_warning_account') : t('dashboard.cancel_warning_guest')} isLoading={cancelMutation.isPending} />

      <Modal isOpen={isEditModalOpen || isAddModalOpen} onClose={() => { setIsEditModalOpen(false); setIsAddModalOpen(false); }} title={isAddModalOpen ? t('dashboard.new_booking') : t('common.edit') + ' ' + t('navigation.reservations')}>
         <div className="space-y-4">
             {formError && <div className="bg-red-500/10 p-3 rounded-lg flex items-center gap-2 text-red-500 text-xs border border-red-500/20"><AlertCircle size={16} className="shrink-0" />{formError}</div>}
             
             {/* Party Size & Dates */}
             <div><label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.party_size')}</label><div className="flex items-center justify-between bg-dark-900 rounded-lg p-2"><button onClick={() => setFormPartySize(Math.max(1, formPartySize - 1))} className="w-10 h-10 rounded-md bg-dark-800 border border-dark-700 flex items-center justify-center text-neutral-300 hover:bg-dark-700 transition-colors"><Minus size={18} /></button><span className="text-2xl font-bold text-neutral-100 px-6">{formPartySize}</span><button onClick={() => setFormPartySize(Math.min(20, formPartySize + 1))} className="w-10 h-10 rounded-md bg-gold-500 text-dark-900 flex items-center justify-center hover:bg-gold-400 transition-colors font-bold"><Plus size={18} /></button></div></div>
             <div><label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.select_date')}</label><div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{dateOptions.map((date) => { const isSelected = date.toDateString() === formDate.toDateString(); return (<button key={date.toISOString()} onClick={() => { setFormDate(date); setFormTime(''); }} className={`flex flex-col items-center justify-center min-w-[60px] py-2 rounded-lg border transition-all ${isSelected ? 'bg-gold-500 border-gold-500 text-dark-900' : 'bg-dark-900 border-dark-700 text-neutral-400 hover:border-neutral-500'}`}><span className="text-[10px] font-medium uppercase mb-0.5">{date.toLocaleDateString(currentLanguage.code, { weekday: 'short' })}</span><span className="text-lg font-bold leading-none">{date.getDate()}</span></button>); })}</div></div>
             
             {/* Dynamic Time Slots */}
             <div>
               <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.select_time')}</label>
               <div className="text-[10px] text-neutral-500 mb-1.5">{t('booking.lunch')}</div>
               <div className="grid grid-cols-4 gap-2 mb-2">
                 {availableSlots.lunch.length > 0 ? availableSlots.lunch.map(time => (
                   <button key={time} onClick={() => setFormTime(time)} className={`py-1.5 rounded-md text-xs font-medium transition-colors border ${formTime === time ? 'bg-gold-500 border-gold-500 text-dark-900' : 'bg-dark-900 border-dark-700 text-neutral-400 hover:border-neutral-500'}`}>{formatTime(time)}</button>
                 )) : <span className="col-span-4 text-xs text-neutral-500 italic">{t('booking.no_slots')}</span>}
               </div>
               <div className="text-[10px] text-neutral-500 mb-1.5">{t('booking.dinner')}</div>
               <div className="grid grid-cols-4 gap-2">
                 {availableSlots.dinner.length > 0 ? availableSlots.dinner.map(time => (
                   <button key={time} onClick={() => setFormTime(time)} className={`py-1.5 rounded-md text-xs font-medium transition-colors border ${formTime === time ? 'bg-gold-500 border-gold-500 text-dark-900' : 'bg-dark-900 border-dark-700 text-neutral-400 hover:border-neutral-500'}`}>{formatTime(time)}</button>
                 )) : <span className="col-span-4 text-xs text-neutral-500 italic">{t('booking.no_slots')}</span>}
               </div>
             </div>

             <div><label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.duration')} (Min)</label><div className="relative"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"><Timer size={16} /></div><input type="number" min={30} step={30} value={formDuration} onChange={(e) => { setFormDuration(parseInt(e.target.value)); setFormTime(''); }} className="w-full h-10 rounded-md border border-dark-700 bg-dark-900 pl-10 pr-4 text-sm text-neutral-100 focus:outline-none focus:border-gold-500" /></div></div>

             <div className="grid grid-cols-2 gap-3 pt-2">
               <AutocompleteInput placeholder={t('auth.ph_first_name')} value={formFirstName} onChange={setFormFirstName} onSelect={handleCustomerSelect} className="bg-dark-900" />
               <Input placeholder={t('auth.ph_last_name')} value={formLastName} onChange={e => setFormLastName(e.target.value)} className="bg-dark-900" />
             </div>

             <div className="flex gap-2">
                 <div className="w-24 shrink-0"><select className="w-full h-10 rounded-md border border-dark-700 bg-dark-900 px-2 py-2 text-sm text-neutral-100 focus:outline-none focus:border-gold-500" value={formCountryCode} onChange={(e) => setFormCountryCode(e.target.value)}>{COUNTRIES.map((c) => (<option key={c.code} value={c.dial_code}>{c.code} ({c.dial_code})</option>))}</select></div>
                 <div className="flex-1">
                   <AutocompleteInput type="tel" placeholder={t('auth.ph_phone')} value={formPhone} onChange={setFormPhone} onSelect={handleCustomerSelect} className="bg-dark-900" />
                 </div>
              </div>

             <div className="flex gap-3 pt-4 border-t border-dark-700">
                <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setIsAddModalOpen(false); }} className="flex-1 border-dark-700 h-11">{t('common.cancel')}</Button>
                <Button onClick={isAddModalOpen ? handleAddBooking : handleSaveEdit} className="flex-1 shadow-lg shadow-gold-500/10 h-11" disabled={isSaving}>{isSaving ? t('common.processing') : (isAddModalOpen ? t('dashboard.add_new_booking') : t('common.save'))}</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default AdminBookings;
