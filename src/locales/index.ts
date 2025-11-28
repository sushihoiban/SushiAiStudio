
import { common } from './common';
import { navigation } from './navigation';
import { auth } from './auth';
import { booking } from './booking';
import { home } from './home';
import { dashboard } from './dashboard';
import { admin_settings } from './admin_settings';
import { menu } from './menu';

export const resources = {
  common,
  navigation,
  auth,
  booking,
  home,
  dashboard,
  admin_settings,
  menu
};

export type ResourceKeys = keyof typeof resources;
