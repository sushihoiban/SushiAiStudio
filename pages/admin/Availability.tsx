
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { RestaurantTable, Booking, Customer } from '../../types';
import { Calendar, RefreshCw, Coffee, User, Phone, Trash2, Edit2, Users, Clock, Minus, Plus, ArrowRight, Timer } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Input } from '../../components/ui/Input';
import { AutocompleteInput } from '../../components/ui/AutocompleteInput';
import { updateBookingGroup, updateCustomer, getAvailableTables, deleteBookingSmart } from '../../services/api';
import { COUNTRIES } from '../../lib/countries';
import { findBestTableCombination } from '../../hooks/use-booking';
import { useSettings } from '../../hooks/use-settings';
import { timeToMinutes, minutesToTime, generateTimeSlots, shouldIncrementDate } from '../../lib/time-slots';

const getNextDays = (count: number, startDate: Date = new Date()) => {
  const days = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
};

const AdminAvailability: React.FC = () => {
  const queryClient = useQueryClient();
  const { settings, t, currentLanguage, formatTime } = useSettings();
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit Form State
  const [editPartySize, setEditPartySize] = useState(2);
  const [editSelectedDate, setEditSelectedDate] = useState<Date>(new Date());
  const [editSelectedTime, setEditSelectedTime] = useState('');
  const [editDuration, setEditDuration] = useState(90);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCountryCode, setEditCountryCode] = useState('+84');
  const [updateError, setUpdateError] = useState<string | null>(null);

  const editDates = useMemo(() => getNextDays(14, editSelectedDate), [isEditing, editSelectedDate]); 

  // Dynamic Grid Logic: Render range based on schedule, consolidating break
  const timeSlots = useMemo(() => {
    const dateObj = new Date(selectedDate);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const schedule = settings.booking_schedule?.find(s => s.day === dayName);

    if (!schedule || !schedule.isOpen) return [];

    const slots = [];
    const openM = timeToMinutes(schedule.openTime);
    let closeM = timeToMinutes(schedule.closeTime);
    
    // Handle overnight display
    if (closeM < openM) closeM += 1440;

    let breakStartM = schedule.hasBreak ? timeToMinutes(schedule.breakStart) : -1;
    let breakEndM = schedule.hasBreak ? timeToMinutes(schedule.breakEnd) : -1;

    // Adjust break if needed for overnight schedule
    if (schedule.hasBreak && closeM > 1440) {
        if (breakStartM < openM && breakStartM !== -1) breakStartM += 1440;
        if (breakEndM < openM && breakEndM !== -1) breakEndM += 1440;
    }

    let currentM = openM;
    while (currentM < closeM) {
      if (schedule.hasBreak && currentM === breakStartM) {
         // Break Column - Consolidated
         slots.push({ label: t('admin_settings.break'), start: currentM, isBreak: true });
         // Skip to end of break
         currentM = breakEndM;
         continue;
      }
      
      // Safety skip if inside break but not at start
      if (schedule.hasBreak && currentM > breakStartM && currentM < breakEndM) {
          currentM = breakEndM;
          continue;
      }

      const timeStr = minutesToTime(currentM);
      slots.push({ label: formatTime(timeStr), start: currentM, isBreak: false });
      currentM += 30;
    }
    return slots;
  }, [selectedDate, settings.booking_schedule, t, formatTime]);

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['allTables'],
    queryFn: async () => {
      const { data, error } = await supabase.from('restaurant_tables').select('*').order('table_number', { ascending: true });
      if (error) throw error;
      return data as RestaurantTable[];
    }
  });

  const { data: bookings, refetch } = useQuery({
    queryKey: ['dailyBookings', selectedDate],
    queryFn: async () => {
      // 1. Fetch current date bookings
      const { data: today, error } = await supabase.from('bookings').select('*, customer:customers(*)').eq('booking_date', selectedDate);
      if (error) throw error;
      
      // 2. Fetch NEXT date bookings for early morning (if overnight schedule)
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      
      const { data: tomorrow, error: errorTomorrow } = await supabase
          .from('bookings')
          .select('*, customer:customers(*)')
          .eq('booking_date', nextDateStr)
          .lt('booking_time', '06:00'); // Assuming shift doesn't go past 6AM
      
      if (errorTomorrow) throw errorTomorrow;

      // Merge and map tomorrow's bookings to have startM + 1440 for grid positioning
      const merged = [
          ...today.map(b => ({ ...b, gridStartM: timeToMinutes(b.booking_time) })),
          ...tomorrow.map(b => ({ ...b, gridStartM: timeToMinutes(b.booking_time) + 1440 }))
      ];
      
      return merged as (Booking & { gridStartM: number, customer: { first_name: string; last_name: string; phone: string; user_id: string | null } })[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (booking: any) => {
       await deleteBookingSmart(booking.group_id, booking.customer_id, booking.customer?.user_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowDeleteConfirm(false);
      setSelectedBooking(null);
    },
    onError: (err: any) => {
      setUpdateError(`${t('common.error_delete')}: ${err.message}`);
      setShowDeleteConfirm(false);
    }
  });

  useEffect(() => {
    if (selectedBooking) {
        setIsEditing(false);
        setUpdateError(null);
        setShowDeleteConfirm(false);
        setEditPartySize(selectedBooking.party_size);
        const bDate = new Date(selectedBooking.booking_date);
        setEditSelectedDate(bDate);
        setEditSelectedTime(selectedBooking.booking_time.substring(0, 5));
        setEditDuration(selectedBooking.duration || 90);
        setEditFirstName(selectedBooking.customer?.first_name || '');
        setEditLastName(selectedBooking.customer?.last_name || '');
        
        const fullPhone = selectedBooking.customer?.phone || '';
        const matchedCountry = COUNTRIES.find(c => fullPhone.startsWith(c.dial_code));
        if (matchedCountry) {
           setEditCountryCode(matchedCountry.dial_code);
           setEditPhone(fullPhone.slice(matchedCountry.dial_code.length));
        } else {
           setEditPhone(fullPhone);
        }
    }
  }, [selectedBooking]);

  const handleCustomerSelect = (customer: Customer) => {
    setEditFirstName(customer.first_name);
    setEditLastName(customer.last_name);
    const fullPhone = customer.phone;
    const matchedCountry = COUNTRIES.find(c => fullPhone.startsWith(c.dial_code));
    if (matchedCountry) {
       setEditCountryCode(matchedCountry.dial_code);
       setEditPhone(fullPhone.slice(matchedCountry.dial_code.length));
    } else {
       setEditPhone(fullPhone);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedBooking) {
      deleteMutation.mutate(selectedBooking);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedBooking) return;
    setUpdateError(null);
    setIsSaving(true);
    try {
        const dayName = editSelectedDate.toLocaleDateString('en-US', { weekday: 'long' });
        const daySchedule = settings.booking_schedule?.find(s => s.day === dayName);
        let dateToSubmit = new Date(editSelectedDate);
        
        if (daySchedule && shouldIncrementDate(editSelectedTime, daySchedule.openTime)) {
            dateToSubmit.setDate(dateToSubmit.getDate() + 1);
        }
        
        const dateStr = dateToSubmit.toISOString().split('T')[0];
        
        if (selectedBooking.customer_id) {
           const cleanPhone = editPhone.replace(/\D/g, '').replace(/^0+/, '');
           const fullPhone = `${editCountryCode}${cleanPhone}`;
           await updateCustomer(selectedBooking.customer_id, {
             first_name: editFirstName,
             last_name: editLastName,
             phone: fullPhone
           });
        }
        const tables = await getAvailableTables(dateStr, editSelectedTime, 1, editDuration, selectedBooking.group_id);
        const bestTableIds = findBestTableCombination(tables, editPartySize);
        if (!bestTableIds || bestTableIds.length === 0) throw new Error(t('booking.error_no_tables'));
        await updateBookingGroup(selectedBooking.group_id, {
            date: dateStr,
            time: editSelectedTime,
            partySize: editPartySize,
            duration: editDuration,
            tableIds: bestTableIds
        });
        queryClient.invalidateQueries({ queryKey: ['dailyBookings'] });
        queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
        setIsEditing(false);
        setSelectedBooking(null);
    } catch (err: any) {
        setUpdateError(err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const getBookingAtSlot = (tableId: string, slotStart: number) => {
    if (!bookings) return null;
    return bookings.find(b => {
      if (b.table_id !== tableId) return false;
      const startM = b.gridStartM;
      const bDuration = b.duration || 90;
      const endM = startM + bDuration;
      return slotStart >= startM && slotStart < endM;
    });
  };
  
  const isBookingStart = (booking: any, slotStart: number) => {
      const startM = booking.gridStartM;
      return startM === slotStart;
  };
  
  const calculateEndTime = (startTime: string, duration: number = 90) => {
    const [h, m] = startTime.split(':').map(Number);
    let total = h * 60 + m + duration;
    return `${(Math.floor(total / 60) % 24).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
  };

  if (tablesLoading) return <div className="p-8 text-neutral-500">{t('common.loading')}</div>;

  const editOptions = generateTimeSlots(
    editSelectedDate.toISOString().split('T')[0], 
    settings.booking_schedule, 
    editDuration, 
    true
  );

  return (
    <div className="space-y-4 h-full flex flex-col">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-neutral-100 font-serif mb-1">{t('dashboard.availability')}</h1></div>
        <div className="flex items-center gap-4 text-xs bg-dark-800/50 p-2 px-3 rounded-lg border border-dark-700">
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/30"></div><span className="text-neutral-400">{t('dashboard.legend_free')}</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-[#3d1f1f] border-l-2 border-gold-500"></div><span className="text-neutral-400">{t('dashboard.legend_booked')}</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-yellow-900/20 border-none"></div><span className="text-neutral-400">{t('dashboard.legend_break')}</span></div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-56"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} /><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-3 py-2 text-sm text-neutral-100 focus:border-gold-500 outline-none transition-colors" /></div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}><RefreshCw size={16} /></Button>
      </div>

      {/* Compact Grid */}
      <div className="flex-1 overflow-auto rounded-xl border border-dark-700 bg-dark-900/50 relative custom-scrollbar">
          <div className="min-w-max">
            {/* Header Row */}
            <div className="flex border-b border-dark-700 bg-dark-800 text-neutral-300 text-xs font-semibold sticky top-0 z-30 shadow-md h-9">
               <div className="w-14 border-r border-dark-700 shrink-0 bg-dark-800 sticky left-0 z-40 text-center flex items-center justify-center"><span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">{t('common.table')}</span></div>
               {timeSlots.length > 0 ? timeSlots.map((slot: any, idx: number) => (
                 slot.isBreak
                 ? <div key={`break-${idx}`} className="w-20 border-r border-dark-700 shrink-0 bg-dark-800 flex flex-col items-center justify-center text-amber-500">
                      <Coffee size={14} className="mb-0.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t('admin_settings.break')}</span>
                   </div>
                 : <div key={slot.label} className="w-16 flex items-center justify-center font-mono text-[10px] text-neutral-400 bg-dark-800/80">{slot.label}</div>
               )) : (
                 <div className="p-3 text-neutral-500">{t('common.closed')}</div>
               )}
            </div>
            
            {/* Grid Body */}
            <div className="divide-y divide-dark-700">
               {timeSlots.length > 0 && tables?.map(table => (
                 <div key={table.id} className="flex group hover:bg-dark-800/30 transition-colors h-10">
                    <div className="w-14 border-r border-dark-700 shrink-0 bg-dark-900 sticky left-0 z-20 flex flex-col items-center justify-center shadow-[4px_0_10px_-5px_rgba(0,0,0,0.5)]">
                       <span className="font-serif font-bold text-sm text-neutral-200 leading-none">{table.table_number}</span>
                       <div className="flex items-center gap-0.5 text-neutral-500 mt-0.5"><User size={8} /><span className="text-[8px] font-medium">{table.seats}</span></div>
                    </div>
                    {timeSlots.map((slot: any, idx: number) => {
                        if (slot.isBreak) {
                            return <div key={`break-${idx}`} className="w-20 bg-yellow-900/5 border-r border-dark-700 relative overflow-hidden flex flex-col items-center justify-center">
                                {/* Diagonal Lines Pattern */}
                                <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(45deg, #d97706 25%, transparent 25%, transparent 50%, #d97706 50%, #d97706 75%, transparent 75%, transparent)', backgroundSize: '8px 8px'}}></div>
                            </div>;
                        }

                        const booking = getBookingAtSlot(table.id, slot.start);
                        const isStart = booking ? isBookingStart(booking, slot.start) : false;
                        
                        return (
                            <div key={slot.label} className={`w-16 border-r border-dark-700/30 border-b border-dark-700/30 relative ${booking ? '' : 'bg-emerald-500/10 hover:bg-emerald-500/20'}`}>
                                {booking && (
                                    <div onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }} className={`absolute inset-0.5 shadow-sm z-10 cursor-pointer flex flex-col justify-center px-1 transition-all hover:brightness-110 ${isStart ? 'bg-[#3d1f1f] border-l-[3px] border-gold-500 rounded-r-sm' : 'bg-[#3d1f1f] rounded-sm border-l border-white/5 opacity-80'}`}>
                                        {isStart && <span className="text-[9px] font-bold text-white truncate leading-tight">{booking.customer?.first_name}</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                 </div>
               ))}
            </div>
         </div>
      </div>

      {selectedBooking && (
        <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title={isEditing ? t('common.edit') : t('booking.selected_booking')}>
           {isEditing ? (
             <div className="space-y-4">
                 {updateError && <div className="bg-red-500/10 text-red-500 p-2 text-sm rounded">{updateError}</div>}
                 <div><label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.party_size')}</label><div className="flex items-center justify-between bg-dark-900 rounded-lg p-2"><button onClick={() => setEditPartySize(Math.max(1, editPartySize - 1))} className="w-10 h-10 rounded-md bg-dark-800 border border-dark-700 flex items-center justify-center text-neutral-300 hover:bg-dark-700 transition-colors"><Minus size={18} /></button><span className="text-2xl font-bold text-neutral-100 px-6">{editPartySize}</span><button onClick={() => setEditPartySize(Math.min(20, editPartySize + 1))} className="w-10 h-10 rounded-md bg-gold-500 text-dark-900 flex items-center justify-center hover:bg-gold-400 transition-colors font-bold"><Plus size={18} /></button></div></div>
                 <div><label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.select_date')}</label><div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{editDates.map((date) => { const isSelected = date.toDateString() === editSelectedDate.toDateString(); return (<button key={date.toISOString()} onClick={() => { setEditSelectedDate(date); setEditSelectedTime(''); }} className={`flex flex-col items-center justify-center min-w-[60px] py-2 rounded-lg border transition-all ${isSelected ? 'bg-gold-500 border-gold-500 text-dark-900' : 'bg-dark-900 border-dark-700 text-neutral-400 hover:border-neutral-500'}`}><span className="text-[10px] font-medium uppercase mb-0.5">{date.toLocaleDateString(currentLanguage.code, { weekday: 'short' })}</span><span className="text-lg font-bold leading-none">{date.getDate()}</span></button>); })}</div></div>
                 <div><label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.select_time')}</label>
                    <div className="grid grid-cols-4 gap-2 mb-2 max-h-40 overflow-y-auto">
                      {editOptions.lunch.length > 0 ? editOptions.lunch.map((time: string) => (
                        <button key={time} onClick={() => setEditSelectedTime(time)} className={`py-1.5 rounded-md text-xs font-medium transition-colors border ${editSelectedTime === time ? 'bg-gold-500 border-gold-500 text-dark-900' : 'bg-dark-900 border-dark-700 text-neutral-400 hover:border-neutral-500'}`}>{formatTime(time)}</button>
                      )) : <span className="text-xs text-neutral-500 col-span-4">{t('booking.no_slots')}</span>}
                      {editOptions.dinner.length > 0 ? editOptions.dinner.map((time: string) => (
                        <button key={time} onClick={() => setEditSelectedTime(time)} className={`py-1.5 rounded-md text-xs font-medium transition-colors border ${editSelectedTime === time ? 'bg-gold-500 border-gold-500 text-dark-900' : 'bg-dark-900 border-dark-700 text-neutral-400 hover:border-neutral-500'}`}>{formatTime(time)}</button>
                      )) : <span className="text-xs text-neutral-500 col-span-4">{t('booking.no_slots')}</span>}
                    </div>
                 </div>
                 <div><label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.duration')} (Min)</label><div className="relative"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"><Timer size={16} /></div><input type="number" min={30} step={30} value={editDuration} onChange={(e) => { setEditDuration(parseInt(e.target.value)); setEditSelectedTime(''); }} className="w-full h-10 rounded-md border border-dark-700 bg-dark-900 pl-10 pr-4 text-sm text-neutral-100 focus:outline-none focus:border-gold-500" /></div><p className="text-[10px] text-neutral-500 mt-1">{t('dashboard.admin_override')}</p></div>

                 <div className="grid grid-cols-2 gap-3 pt-2">
                     <AutocompleteInput placeholder={t('auth.ph_first_name')} value={editFirstName} onChange={setEditFirstName} onSelect={handleCustomerSelect} className="bg-dark-900"/>
                     <Input label={t('auth.ph_last_name')} value={editLastName} onChange={e => setEditLastName(e.target.value)} className="bg-dark-900"/>
                 </div>
                 <div className="flex gap-2"><div className="w-24 shrink-0"><label className="block text-xs font-medium text-neutral-400 mb-1.5">Code</label><select className="w-full h-10 rounded-md border border-dark-700 bg-dark-900 px-2 py-2 text-sm text-neutral-100 focus:outline-none focus:border-gold-500" value={editCountryCode} onChange={(e) => setEditCountryCode(e.target.value)}>{COUNTRIES.map((c) => (<option key={c.code} value={c.dial_code}>{c.code} ({c.dial_code})</option>))}</select></div><div className="flex-1"><AutocompleteInput type="tel" label={t('auth.ph_phone')} placeholder={t('admin_settings.search_users')} value={editPhone} onChange={setEditPhone} onSelect={handleCustomerSelect} className="bg-dark-900" /></div></div>

                 <div className="flex gap-3 pt-4 border-t border-dark-700"><Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 border-dark-700">{t('common.cancel')}</Button><Button onClick={handleSaveEdit} className="flex-1 shadow-lg shadow-gold-500/10" disabled={isSaving}>{isSaving ? t('common.processing') : t('common.save')}</Button></div>
             </div>
           ) : (
             <div className="space-y-6">
                <div className="flex items-center gap-4 bg-dark-800/50 p-4 rounded-xl border border-dark-700"><div className="h-14 w-14 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 border border-gold-500/20 shrink-0"><User size={24} /></div><div><h3 className="text-xl font-bold text-neutral-100">{selectedBooking.customer?.first_name} {selectedBooking.customer?.last_name}</h3><div className="flex items-center gap-2 text-sm text-neutral-400 mt-1"><Phone size={12} className="text-gold-500"/><span>{selectedBooking.customer?.phone}</span></div></div></div>
                <div className="grid grid-cols-2 gap-3"><div className="p-3 bg-dark-900 border border-dark-700 rounded-lg"><div className="text-xs text-neutral-500 uppercase mb-1">{t('common.time')}</div><div className="flex items-center gap-2 text-neutral-200"><Clock size={16} className="text-gold-500"/><span className="font-mono font-semibold">{formatTime(selectedBooking.booking_time.substring(0, 5))} - {formatTime(calculateEndTime(selectedBooking.booking_time, selectedBooking.duration))}</span></div></div><div className="p-3 bg-dark-900 border border-dark-700 rounded-lg"><div className="text-xs text-neutral-500 uppercase mb-1">{t('booking.party_size')}</div><div className="flex items-center gap-2 text-neutral-200"><Users size={16} className="text-gold-500"/><span>{selectedBooking.party_size}</span></div></div></div>
                <div className="grid grid-cols-2 gap-3"><button onClick={() => { setUpdateError(null); setIsEditing(true); }} className="flex items-center justify-center gap-2 p-3 rounded-lg bg-dark-800 text-neutral-300 hover:bg-dark-700 border border-dark-700 transition-colors font-medium text-sm"><Edit2 size={18} /> {t('common.edit')}</button><button onClick={() => setShowDeleteConfirm(true)} className="flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors font-medium text-sm"><Trash2 size={18} /> {t('dashboard.cancel_reservation')}</button></div>
             </div>
           )}
        </Modal>
      )}
      
      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDeleteConfirm} title={t('dashboard.cancel_reservation')} message={selectedBooking?.customer && !selectedBooking.customer.user_id ? t('dashboard.cancel_warning_guest') : t('dashboard.cancel_warning_account')} isLoading={deleteMutation.isPending} />
    </div>
  );
};

export default AdminAvailability;
