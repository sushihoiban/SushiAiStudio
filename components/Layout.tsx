
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { SocialSidebar } from './SocialSidebar';
import { useSettings } from '../hooks/use-settings';
import { useBooking } from '../hooks/use-booking';
import { BookingModal } from './BookingModal';

const Layout: React.FC = () => {
  const { loading } = useSettings();
  const { isOpen, closeBooking } = useBooking();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 pb-16 lg:pb-0">
      <Navbar />
      <SocialSidebar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BookingModal isOpen={isOpen} onClose={closeBooking} />
    </div>
  );
};

export default Layout;
