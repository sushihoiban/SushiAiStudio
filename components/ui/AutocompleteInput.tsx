
import React, { useState, useEffect, useRef } from 'react';
import { Input } from './Input';
import { searchCustomers } from '../../services/api';
import { Customer } from '../../types';
import { User, Phone } from 'lucide-react';

interface AutocompleteInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (customer: Customer) => void;
  className?: string;
  type?: string;
  label?: string;
  startIcon?: React.ReactNode;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  placeholder,
  value,
  onChange,
  onSelect,
  className,
  type = "text",
  label,
  startIcon
}) => {
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (value.length >= 2) {
        setLoading(true);
        try {
          const results = await searchCustomers(value);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error searching customers", error);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input
        type={type}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        startIcon={startIcon}
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((customer) => (
            <div
              key={customer.id}
              onClick={() => {
                onSelect(customer);
                setShowSuggestions(false);
              }}
              className="p-3 hover:bg-dark-700 cursor-pointer border-b border-dark-700/50 last:border-none transition-colors"
            >
              <div className="font-medium text-neutral-100 text-sm">
                {customer.first_name} {customer.last_name}
              </div>
              <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                <Phone size={12} className="text-gold-500" /> {customer.phone}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
