
import { supabase } from '../lib/supabase';
import { AdminBookingView, Customer, RestaurantTable, RestaurantSettings, Booking, Profile } from '../types';

// Helper for UUID generation
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to convert "HH:MM" to minutes
const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// --- Settings Functions ---

export const getSettings = async (): Promise<RestaurantSettings | null> => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single();
  
  if (error) {
    console.warn("Could not fetch settings:", error.message);
    return null;
  }
  return data;
};

export const updateSettings = async (settings: Partial<RestaurantSettings>): Promise<RestaurantSettings> => {
  const { data: existing } = await supabase.from('settings').select('id').single();
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...payload } = settings;
  
  if (existing) {
    const { data, error } = await supabase
      .from('settings')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data as RestaurantSettings;
  } else {
    const { data, error } = await supabase
      .from('settings')
      .insert([payload])
      .select()
      .single();
      
    if (error) throw error;
    return data as RestaurantSettings;
  }
};

// --- Profile / Team Management Functions ---

export const getProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Profile[] || [];
};

export const updateProfileRole = async (id: string, role: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id);

  if (error) throw error;
};

// --- Table Management Functions ---

export const getTables = async (): Promise<RestaurantTable[]> => {
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select('*')
    .order('table_number', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const addTable = async (table: { table_number: number; seats: number }): Promise<void> => {
  const { error } = await supabase
    .from('restaurant_tables')
    .insert([table]);
  
  if (error) throw error;
};

export const updateTable = async (id: string, updates: Partial<RestaurantTable>): Promise<void> => {
  const { error } = await supabase
    .from('restaurant_tables')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
};

export const deleteTable = async (id: string): Promise<void> => {
  // Use select() to verify deletion happened
  const { data, error } = await supabase
    .from('restaurant_tables')
    .delete()
    .eq('id', id)
    .select();
  
  if (error) throw error;
  
  // If no data returned, row wasn't deleted (RLS or ID mismatch)
  if (!data || data.length === 0) {
    throw new Error("Failed to delete table. It may have attached bookings or permissions are denied.");
  }
};

// --- Admin Functions ---

export const getAdminBookings = async (): Promise<AdminBookingView[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      group_id,
      customer_id,
      booking_date,
      booking_time,
      duration,
      party_size,
      customer:customers (
        first_name,
        last_name,
        phone,
        user_id
      ),
      table:restaurant_tables (
        table_number
      )
    `)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: true });

  if (error) throw error;

  // Client-side aggregation by group_id
  const groups: Record<string, AdminBookingView> = {};

  data.forEach((booking: any) => {
    const gid = booking.group_id;
    if (!groups[gid]) {
      groups[gid] = {
        group_id: gid,
        customer_id: booking.customer_id,
        customer_name: booking.customer ? `${booking.customer.first_name} ${booking.customer.last_name}` : 'Unknown',
        phone: booking.customer?.phone || '',
        customer_user_id: booking.customer?.user_id || null,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time ? booking.booking_time.substring(0, 5) : '',
        duration: booking.duration || 90,
        party_size: booking.party_size,
        table_numbers: '', 
        status: 'confirmed'
      };
    }
    
    const tNo = booking.table?.table_number;
    if (tNo) {
       const current = groups[gid].table_numbers;
       groups[gid].table_numbers = current ? `${current}, ${tNo}` : `${tNo}`;
    }
  });

  return Object.values(groups);
};

export const cancelBookingGroup = async (groupId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('bookings')
    .delete()
    .eq('group_id', groupId)
    .select();
  
  if (error) throw error;
  if (!data || data.length === 0) {
     throw new Error("Deletion failed. Permissions denied or booking not found.");
  }
};

export const updateBookingGroup = async (groupId: string, updates: { date: string, time: string, partySize: number, duration: number, tableIds?: string[] }): Promise<void> => {
  if (updates.tableIds && updates.tableIds.length > 0) {
      const { data: existing, error: fetchError } = await supabase
          .from('bookings')
          .select('customer_id')
          .eq('group_id', groupId)
          .limit(1)
          .single();

      if (fetchError || !existing) throw new Error("Booking not found");

      const customerId = existing.customer_id;

      // Delete old
      const { error: delError } = await supabase.from('bookings').delete().eq('group_id', groupId);
      if (delError) throw delError;

      // Insert new
      const newRows = updates.tableIds.map(tid => ({
          group_id: groupId,
          customer_id: customerId,
          table_id: tid,
          booking_date: updates.date,
          booking_time: updates.time,
          party_size: updates.partySize,
          duration: updates.duration || 90
      }));

      const { error: insError } = await supabase.from('bookings').insert(newRows);
      if (insError) throw insError;

  } else {
      const payload: any = {};
      if (updates.date) payload.booking_date = updates.date;
      if (updates.time) payload.booking_time = updates.time;
      if (updates.partySize) payload.party_size = updates.partySize;
      if (updates.duration) payload.duration = updates.duration;
      
      const { error } = await supabase.from('bookings').update(payload).eq('group_id', groupId);
      if (error) throw error;
  }
};

export const filterCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data as Customer[] || [];
};

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  if (!query || query.length < 2) return [];
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(5);
    
  if (error) {
    console.error('Search customers error:', error);
    return [];
  }
  return data as Customer[] || [];
};

export const addCustomer = async (customer: Partial<Customer>): Promise<void> => {
  const { error } = await supabase
    .from('customers')
    .insert([{
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      email: customer.email,
      status: customer.status || 'regular'
    }]);

  if (error) throw error;
};

export const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<void> => {
  const { error } = await supabase
    .from('customers')
    .update({
      first_name: updates.first_name,
      last_name: updates.last_name,
      phone: updates.phone,
      email: updates.email,
      status: updates.status
    })
    .eq('id', id);

  if (error) throw error;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  // Client-side cascade: Delete bookings first to avoid FK constraint errors
  const { error: bookingError } = await supabase.from('bookings').delete().eq('customer_id', id);
  if (bookingError) throw bookingError;

  // Then delete customer
  const { data, error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Failed to delete customer. Record may not exist.");
  }
};

// Smart delete: Checks if customer is temporary (no user_id) and deletes them, otherwise just cancels bookings
export const deleteBookingSmart = async (groupId: string, customerId: string, customerUserId?: string | null): Promise<void> => {
  if (customerId && !customerUserId) {
      // Temporary/Walk-in customer (created for this booking)
      // Delete the customer record, which cascades to delete bookings
      await deleteCustomer(customerId);
  } else {
      // Registered user or manual booking without deleting customer record
      await cancelBookingGroup(groupId);
  }
};

// --- Public/Booking Functions ---

export const getAvailableTables = async (date: string, time: string, partySize: number, duration: number = 90, excludeGroupId?: string): Promise<RestaurantTable[]> => {
  const { data: allTables, error: tableError } = await supabase
      .from('restaurant_tables')
      .select('*');
  if (tableError) throw tableError;

  // 1. Fetch bookings for the requested DATE
  let query = supabase
      .from('bookings')
      .select('group_id, table_id, booking_time, duration')
      .eq('booking_date', date);
  
  if (excludeGroupId) {
      query = query.neq('group_id', excludeGroupId);
  }

  const { data: bookingsToday, error: bookingError } = await query;
  if (bookingError) throw bookingError;

  // 2. Fetch bookings for PREVIOUS DATE that might overlap (overnight bookings)
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().split('T')[0];

  let queryPrev = supabase
      .from('bookings')
      .select('group_id, table_id, booking_time, duration')
      .eq('booking_date', prevDateStr);
      
  if (excludeGroupId) {
      queryPrev = queryPrev.neq('group_id', excludeGroupId);
  }
  const { data: bookingsPrev, error: bookingErrorPrev } = await queryPrev;
  if (bookingErrorPrev) throw bookingErrorPrev;

  // Combine relevant bookings to check against
  const reqStart = timeToMinutes(time);
  const reqEnd = reqStart + duration;

  const relevantBookings = [
     ...bookingsToday.map(b => ({ ...b, startM: timeToMinutes(b.booking_time) })),
     ...bookingsPrev.map(b => ({ 
          ...b, 
          // Previous day bookings effectively start 24h earlier relative to today
          startM: timeToMinutes(b.booking_time) - 1440 
     }))
  ];

  const available = allTables.filter(t => {
      const overlap = relevantBookings.find(b => {
          if (b.table_id !== t.id) return false;
          
          const bStart = b.startM;
          const bDuration = b.duration || 90;
          const bEnd = bStart + bDuration;

          // Standard Overlap check: 
          // A starts before B ends AND A ends after B starts
          return (reqStart < bEnd && reqEnd > bStart);
      });
      return !overlap;
  });
  
  return available;
};

export const createBookingWithCustomer = async (payload: {
  firstName: string;
  lastName: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
  tableIds: string[];
  createCustomer: boolean;
  duration?: number;
  userId?: string;
}): Promise<void> => {
  let customerId;
  
  // 1. Try to find customer by user_id first if provided
  if (payload.userId) {
     const { data: byUser } = await supabase.from('customers').select('id').eq('user_id', payload.userId).single();
     if (byUser) {
        customerId = byUser.id;
     }
  }

  // 2. If not found by user_id (or no userId provided), try phone
  if (!customerId) {
    const { data: existing } = await supabase.from('customers').select('id, user_id').eq('phone', payload.phone).single();
    
    if (existing) {
        customerId = existing.id;
        // If we have a userId but the existing customer doesn't, link them!
        if (payload.userId && !existing.user_id) {
            await supabase.from('customers').update({ user_id: payload.userId }).eq('id', customerId);
        }
    } else {
        // Create new
        const { data: newCust, error: createError } = await supabase.from('customers').insert([{
            first_name: payload.firstName,
            last_name: payload.lastName,
            phone: payload.phone,
            status: 'regular',
            user_id: payload.userId || null
        }]).select('id').single();
        
        if (createError) throw createError;
        customerId = newCust.id;
    }
  }

  const groupId = generateUUID();
  const bookingRows = payload.tableIds.map(tid => ({
      group_id: groupId,
      customer_id: customerId,
      table_id: tid,
      booking_date: payload.date,
      booking_time: payload.time,
      party_size: payload.partySize,
      duration: payload.duration || 90
  }));

  const { error: bookingError } = await supabase.from('bookings').insert(bookingRows);
  if (bookingError) throw bookingError;
};

export const getMyBookings = async (userId: string): Promise<Booking[]> => {
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  if (custError || !customer) return [];

  const { data, error } = await supabase
    .from('bookings')
    .select('*, table:restaurant_tables(*)')
    .eq('customer_id', customer.id)
    .order('booking_date', { ascending: true });
  
  if (error) throw error;
  return data || [];
};
