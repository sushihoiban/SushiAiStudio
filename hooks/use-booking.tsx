
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './use-auth';
import { RestaurantTable } from '../types';

interface BookingContextType {
  isOpen: boolean;
  openBooking: () => void;
  closeBooking: () => void;
}

const BookingContext = createContext<BookingContextType>({
  isOpen: false,
  openBooking: () => {},
  closeBooking: () => {},
});

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();

  const openBooking = () => {
    // Enforce authentication: User must be logged in or a guest to book
    if (!user && !isGuest) {
      navigate('/auth', { replace: true });
      return;
    }
    setIsOpen(true);
  };
  
  const closeBooking = () => setIsOpen(false);

  return (
    <BookingContext.Provider value={{ isOpen, openBooking, closeBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);

// Intelligent Table Assignment Algorithm
// Moves here to be shared between Public Booking Modal and Admin Dashboard
export const findBestTableCombination = (tables: RestaurantTable[], partySize: number): string[] | null => {
  // 1. Try to find a single table that fits
  // Filter tables that have enough seats, sort by seats ascending (least wasted space first)
  const singleTables = tables
    .filter(t => t.seats >= partySize)
    .sort((a, b) => a.seats - b.seats);
  
  if (singleTables.length > 0) {
    return [singleTables[0].id];
  }

  // 2. Find combinations of tables
  // Heuristic: Prefer fewest tables, then least wasted capacity.
  let bestCombo: RestaurantTable[] | null = null;
  
  // Sort tables by capacity descending to try filling with large tables first
  const sortedTables = [...tables].sort((a, b) => b.seats - a.seats);

  const search = (currentCombo: RestaurantTable[], remainingTables: RestaurantTable[]) => {
    const currentCapacity = currentCombo.reduce((sum, t) => sum + t.seats, 0);
    
    // Check optimization: If current combo is already worse than best found (more tables), stop.
    if (bestCombo && currentCombo.length > bestCombo.length) return;

    if (currentCapacity >= partySize) {
      // Found a valid combination
      if (!bestCombo) {
        bestCombo = [...currentCombo];
      } else {
        // Compare with bestCombo
        if (currentCombo.length < bestCombo.length) {
          // Priority 1: Fewer tables
          bestCombo = [...currentCombo];
        } else if (currentCombo.length === bestCombo.length) {
          // Priority 2: Less wasted capacity
          const bestCapacity = bestCombo.reduce((sum, t) => sum + t.seats, 0);
          if (currentCapacity < bestCapacity) {
            bestCombo = [...currentCombo];
          }
        }
      }
      return;
    }

    // Max depth constraint to prevent performance issues (e.g., max 5 tables per booking)
    if (currentCombo.length >= 5) return;
    if (remainingTables.length === 0) return;

    // Recursive search
    for (let i = 0; i < remainingTables.length; i++) {
      // Pass remaining tables starting from next index to avoid permutations (sets only)
      search([...currentCombo, remainingTables[i]], remainingTables.slice(i + 1));
    }
  };

  search([], sortedTables);

  return bestCombo ? bestCombo.map(t => t.id) : null;
};
