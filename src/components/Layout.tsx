
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { SocialSidebar } from './SocialSidebar';
import { useSettings } from '../hooks/use-settings';
import { useBooking } from '../hooks/use-booking';
import { BookingModal } from './BookingModal';

const Layout: React.FC = () => {
  const { loading, t, settings } = useSettings();
  const { isOpen, closeBooking } = useBooking();
  const location = useLocation();

  useEffect(() => {
    let title = settings.restaurant_name || "Sushi Hoiban";
    switch (location.pathname) {
      case '/':
        title = `${t('navigation.home')} | ${settings.restaurant_name}`;
        break;
      case '/menu':
        title = `${t('navigation.menu')} | ${settings.restaurant_name}`;
        break;
      case '/reservations':
        title = `${t('navigation.reservations')} | ${settings.restaurant_name}`;
        break;
      case '/auth':
        title = `${t('navigation.sign_in')} | ${settings.restaurant_name}`;
        break;
      default:
        title = settings.restaurant_name || "Sushi Hoiban";
    }
    document.title = title;
  }, [location, t, settings.restaurant_name]);

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
