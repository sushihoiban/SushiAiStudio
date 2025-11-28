
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Bookmark, AlertCircle, Edit2, Trash2, Phone, ArrowRight, Timer, Minus, Plus } from 'lucide-react';
import { getMyBookings, cancelBookingGroup, updateBookingGroup, getAvailableTables } from '../services/api';
import { useAuth } from '../hooks/use-auth';
import { useBooking, findBestTableCombination } from '../hooks/use-booking';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Modal } from '../components/ui/Modal';
import { useSettings } from '../hooks/use-settings';
import { generateTimeSlots } from '../lib/time-slots';

// Icons
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

const Reservations: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { openBooking } = useBooking();
  const { settings, t, currentLanguage, formatDuration, formatTime } = useSettings();

  // States
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [bookingToEdit, setBookingToEdit] = useState<any | null>(null);
  
  // Edit Form State
  const [editPartySize, setEditPartySize] = useState(2);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editTime, setEditTime] = useState('');
  const [editDuration, setEditDuration] = useState(90);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myBookings', user?.id],
    queryFn: () => getMyBookings(user!.id),
    enabled: !!user,
  });

  const availableSlots = useMemo(() => {
    return generateTimeSlots(
      editDate.toISOString().split('T')[0],
      settings.booking_schedule,
      editDuration
    );
  }, [editDate, settings.booking_schedule, editDuration]);

  // Group bookings by group_id
  const groupedBookings = useMemo(() => {
    if (!bookings) return [];
    const groups: Record<string, any> = {};
    
    bookings.forEach(booking => {
      if (!groups[booking.group_id]) {
        groups[booking.group_id] = {
          ...booking,
          tables: [booking.table?.table_number].filter(Boolean),
        };
      } else {
        if (booking.table?.table_number) {
          groups[booking.group_id].tables.push(booking.table.table_number);
        }
      }
    });
    
    return Object.values(groups).sort((a: any, b: any) => 
      new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime() || 
      a.booking_time.localeCompare(b.booking_time)
    );
  }, [bookings]);

  const cancelMutation = useMutation<void, Error, string>({
    mutationFn: cancelBookingGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      setBookingToCancel(null);
    },
    onError: (err: any) => alert(err.message)
  });

  const handleEditOpen = (booking: any) => {
    setBookingToEdit(booking);
    setEditPartySize(booking.party_size);
    setEditDate(new Date(booking.booking_date));
    setEditTime(booking.booking_time.substring(0, 5));
    setEditDuration(booking.duration || 90);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!bookingToEdit) return;
    setIsSaving(true);
    setEditError(null);

    try {
        const dateStr = editDate.toISOString().split('T')[0];
        
        // Check Availability (excluding current booking group)
        const tables = await getAvailableTables(dateStr, editTime, 1, editDuration, bookingToEdit.group_id);
        
        // Intelligent assignment with NEW party size
        const bestTableIds = findBestTableCombination(tables, editPartySize);

        if (!bestTableIds || bestTableIds.length === 0) {
            throw new Error(t('booking.error_no_tables'));
        }

        // Update Booking
        await updateBookingGroup(bookingToEdit.group_id, {
            date: dateStr,
            time: editTime,
            partySize: editPartySize,
            duration: editDuration,
            tableIds: bestTableIds
        });

        queryClient.invalidateQueries({ queryKey: ['myBookings'] });
        setBookingToEdit(null);
    } catch (err: any) {
        setEditError(err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleWhatsApp = () => {
    const phone = settings.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleZalo = () => {
    const phone = settings.phone.replace(/\D/g, '');
    window.open(`https://zalo.me/${phone}`, '_blank');
  };

  if (authLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold-500"></div>
        </div>
    );
  }

  if (!user) {
    return (
      <div className="w-[90%] md:w-[var(--content-width)] mx-auto py-16 text-center">
         <div className="max-w-md mx-auto bg-dark-800/50 border border-dark-700 rounded-2xl p-8 shadow-2xl">
            <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500">
                <Bookmark size={32} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-neutral-100 mb-3">{t('auth.please_sign_in')}</h1>
            <p className="text-neutral-400 mb-8">
                {t('navigation.sub_view_history')}
            </p>
            <Link to="/auth">
                <Button className="w-full">{t('auth.sign_in_button')}</Button>
            </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="w-[90%] md:w-[var(--content-width)] mx-auto py-16">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
        <div>
            <h1 className="font-serif text-3xl md:text-4xl text-gold-500 mb-2">{t('navigation.my_reservations')}</h1>
            <p className="text-neutral-400">{t('navigation.sub_view_history')}</p>
        </div>
        <Button onClick={openBooking} className="shrink-0">{t('navigation.book_table')}</Button>
      </div>

      {bookingsLoading ? (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500"></div>
        </div>
      ) : groupedBookings.length === 0 ? (
        <div className="text-center py-16 bg-dark-800/30 rounded-2xl border border-dark-700 border-dashed">
            <div className="h-14 w-14 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center text-neutral-500">
                <Calendar size={24} />
            </div>
            <h3 className="text-lg font-medium text-neutral-200 mb-1">{t('dashboard.no_bookings_found')}</h3>
            <p className="text-neutral-500 mb-6">{t('navigation.no_bookings_hint')}</p>
            <Button variant="outline" onClick={openBooking}>{t('navigation.book_table')}</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupedBookings.map((booking: any) => {
             const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
             const now = new Date();
             const hasStarted = now >= bookingDateTime;
             
             const bookingTimeClean = booking.booking_time.substring(0, 5);
             const endTime = calculateEndTime(bookingTimeClean, booking.duration || 90);
             const tableList = booking.tables.join(', ');

             return (
                <div 
                  key={booking.group_id} 
                  className={`relative overflow-hidden bg-dark-800 border rounded-xl p-5 transition-all ${
                      hasStarted ? 'border-dark-700 opacity-80' : 'border-gold-500/30 shadow-lg shadow-black/20'
                  }`}
                >
                  <div className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      hasStarted ? 'bg-dark-700 text-neutral-400' : 'bg-green-500/20 text-green-500'
                  }`}>
                      {hasStarted ? t('common.status_completed') : t('common.status_upcoming')}
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                     <div className={`h-12 w-12 rounded-lg flex flex-col items-center justify-center border ${
                         hasStarted ? 'bg-dark-700 border-dark-600 text-neutral-400' : 'bg-gold-500/10 border-gold-500/30 text-gold-500'
                     }`}>
                        <span className="text-xs font-medium uppercase">{bookingDateTime.toLocaleDateString(currentLanguage.code, { weekday: 'short' })}</span>
                        <span className="text-xl font-bold leading-none">{bookingDateTime.getDate()}</span>
                     </div>
                     <div>
                        <div className="text-sm text-neutral-400 mb-1">{bookingDateTime.getFullYear()}</div>
                        <div className="font-serif font-bold text-lg text-neutral-100">
                             {bookingDateTime.toLocaleDateString(currentLanguage.code, { month: 'long' })}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-dark-700/50 mb-4">
                    <div className="flex items-center gap-3 text-sm text-neutral-300">
                        <Clock size={16} className="text-gold-500/70" />
                        <span className="font-mono">{formatTime(bookingTimeClean)} - {formatTime(endTime)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-300">
                        <Users size={16} className="text-gold-500/70" />
                        <span>{booking.party_size} {t('common.unit_people')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-300">
                        <Bookmark size={16} className="text-gold-500/70" />
                        <span>{t('common.table')} {tableList}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                      <button 
                        onClick={() => handleEditOpen(booking)}
                        disabled={hasStarted}
                        className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${
                            hasStarted 
                            ? 'bg-dark-700 text-neutral-500 border-transparent cursor-not-allowed' 
                            : 'bg-dark-700 hover:bg-dark-600 text-neutral-200 border-dark-600'
                        }`}
                        title={hasStarted ? t('common.tooltip_edit_disabled') : t('common.edit')}
                      >
                          <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setBookingToCancel(booking.group_id)}
                        disabled={hasStarted}
                        className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${
                            hasStarted 
                            ? 'bg-dark-700 text-neutral-500 border-transparent cursor-not-allowed' 
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20'
                        }`}
                        title={hasStarted ? t('common.tooltip_cancel_disabled') : t('common.delete')}
                      >
                          <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={handleWhatsApp}
                        className="flex items-center justify-center p-2 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 transition-colors"
                        title={`${t('common.contact_via')} WhatsApp`}
                      >
                          <WhatsAppIcon size={18} />
                      </button>
                      <button 
                        onClick={handleZalo}
                        className="flex items-center justify-center p-2 rounded-lg bg-[#0068FF]/10 hover:bg-[#0068FF]/20 text-[#0068FF] border border-[#0068FF]/20 transition-colors"
                        title={`${t('common.contact_via')} Zalo`}
                      >
                          <ZaloIcon size={20} />
                      </button>
                  </div>
                </div>
             );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onConfirm={() => bookingToCancel && cancelMutation.mutate(bookingToCancel)}
        title={t('common.confirm')}
        message={t('dashboard.cancel_warning_account')}
        isLoading={cancelMutation.isPending}
      />

      {/* Edit Modal */}
      <Modal isOpen={!!bookingToEdit} onClose={() => setBookingToEdit(null)} title={t('common.edit') + ' ' + t('navigation.reservations')}>
         <div className="space-y-4">
             {editError && (
                 <div className="bg-red-500/10 p-3 rounded-lg flex items-center gap-2 text-red-500 text-xs border border-red-500/20">
                     <AlertCircle size={16} className="shrink-0" />
                     {editError}
                 </div>
             )}
             
             {/* Party Size */}
             <div>
               <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.party_size')}</label>
               <div className="flex items-center justify-between bg-dark-800 rounded-lg p-2">
                 <button 
                   onClick={() => setEditPartySize(Math.max(1, editPartySize - 1))}
                   className="w-10 h-10 rounded-md bg-dark-700 flex items-center justify-center text-neutral-300 hover:bg-dark-600 transition-colors"
                 >
                   <Minus size={18} />
                 </button>
                 <span className="text-2xl font-bold text-neutral-100 px-6">{editPartySize}</span>
                 <button 
                   onClick={() => setEditPartySize(Math.min(20, editPartySize + 1))}
                   className="w-10 h-10 rounded-md bg-gold-500 text-dark-900 flex items-center justify-center hover:bg-gold-400 transition-colors font-bold"
                 >
                   <Plus size={18} />
                 </button>
               </div>
             </div>

             {/* Date Selection */}
             <div>
               <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{t('booking.select_date')}</label>
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                 {getNextDays(14).map((date) => {
                   const isSelected = date.toDateString() === editDate.toDateString();
                   return (
                     <button
                       key={date.toISOString()}
                       onClick={() => { setEditDate(date); setEditTime(''); }}
                       className={`flex flex-col items-center justify-center min-w-[60px] py-2 rounded-lg border transition-all ${
                         isSelected 
                           ? 'bg-gold-500 border-gold-500 text-dark-900' 
                           : 'bg-dark-800 border-dark-700 text-neutral-400 hover:border-neutral-500'
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
                     value={editDuration}
                     onChange={(e) => { setEditDuration(parseInt(e.target.value)); setEditTime(''); }}
                     className="flex h-10 w-full rounded-md border border-dark-700 bg-dark-800 pl-10 pr-3 py-2 text-sm text-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-500 appearance-none transition-colors cursor-pointer"
                   >
                      {Array.from({ length: Math.floor(((settings.default_duration || 90) - 30) / 30) + 1 }, (_, i) => 30 + i * 30).map(opt => (
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
               
               <div className="text-[10px] text-neutral-500 mb-1.5">{t('booking.lunch')}</div>
               <div className="grid grid-cols-4 gap-2 mb-2">
                 {availableSlots.lunch.length > 0 ? availableSlots.lunch.map(time => (
                   <button
                     key={time}
                     onClick={() => setEditTime(time)}
                     className={`py-1.5 rounded-md text-xs font-medium transition-colors border ${
                       editTime === time
                         ? 'bg-gold-500 border-gold-500 text-dark-900'
                         : 'bg-dark-800 border-dark-700 text-neutral-400 hover:border-neutral-500'
                     }`}
                   >
                     {formatTime(time)}
                   </button>
                 )) : <span className="col-span-4 text-xs text-neutral-500 italic">{t('booking.no_slots')}</span>}
               </div>

               <div className="text-[10px] text-neutral-500 mb-1.5">{t('booking.dinner')}</div>
               <div className="grid grid-cols-4 gap-2">
                 {availableSlots.dinner.length > 0 ? availableSlots.dinner.map(time => (
                   <button
                     key={time}
                     onClick={() => setEditTime(time)}
                     className={`py-1.5 rounded-md text-xs font-medium transition-colors border ${
                       editTime === time
                         ? 'bg-gold-500 border-gold-500 text-dark-900'
                         : 'bg-dark-800 border-dark-700 text-neutral-400 hover:border-neutral-500'
                     }`}
                   >
                     {formatTime(time)}
                   </button>
                 )) : <span className="col-span-4 text-xs text-neutral-500 italic">{t('booking.no_slots')}</span>}
               </div>
             </div>

             {editTime && (
               <div className="bg-dark-800 border border-dark-700 rounded-xl p-3 flex flex-col items-center">
                 <div className="flex items-center gap-6">
                   <div className="text-center">
                     <div className="text-[10px] text-neutral-500 mb-0.5">{t('booking.starts')}</div>
                     <div className="text-xl font-bold text-gold-500">{formatTime(editTime)}</div>
                   </div>
                   <ArrowRight className="text-neutral-600 mt-3" size={16} />
                   <div className="text-center">
                     <div className="text-[10px] text-neutral-500 mb-0.5">{t('booking.ends')}</div>
                     <div className="text-xl font-bold text-gold-500">{calculateEndTime(editTime, editDuration)}</div>
                   </div>
                 </div>
               </div>
             )}

             <div className="flex gap-3 pt-4 border-t border-dark-700">
                 <Button variant="outline" onClick={() => setBookingToEdit(null)} className="flex-1 border-dark-700">{t('common.cancel')}</Button>
                 <Button onClick={handleSaveEdit} className="flex-1 shadow-lg shadow-gold-500/10" disabled={isSaving}>{isSaving ? t('common.processing') : t('common.save')}</Button>
             </div>
         </div>
      </Modal>
    </div>
  );
};

export default Reservations;
