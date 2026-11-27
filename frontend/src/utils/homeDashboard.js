import { dashboardAPI, statusesAPI } from './api';
import { hasFullAccess, isGhanaWarehouse } from './permissions';
import { startEarly } from './earlyData';

/** Which dashboard a person sees on their home page (pages/DashboardPage.jsx). */
export const homeDashboard = (user) => {
  const role = String(user?.role || '').trim().toLowerCase().replace(/[ _]+/g, '-');
  if (role === 'finance') return 'finance';
  if (role === 'warehouse' || role === 'warehouse-staff') return isGhanaWarehouse(user) ? 'ghana' : 'uk';
  if (role === 'driver') return 'driver';
  if (role === 'delivery-agent') return 'rider';
  if (hasFullAccess(user)) return 'office';
  return null;
};

/** The request behind each dashboard. */
export const DASHBOARD_REQUESTS = {
  office: dashboardAPI.getOverview,
  finance: dashboardAPI.getFinance,
  uk: dashboardAPI.getUKWarehouse,
  ghana: dashboardAPI.getGhanaWarehouse,
  driver: dashboardAPI.getDriver,
  rider: dashboardAPI.getDelivery,
};

// Pages that open on a dashboard, and which one
const OPENING_PAGES = {
  '/': homeDashboard,
  '/dashboard': homeDashboard,
  '/uk-warehouse': () => 'uk',
  '/ghana-warehouse': () => 'ghana',
};

/**
 * When the app opens already signed in, or just after signing in: asks for the status list and the
 * opening dashboard's numbers at once, while the page's code is still being downloaded.
 */
export const warmUp = (user, path = window.location.pathname) => {
  startEarly(statusesAPI.get);
  const dashboard = OPENING_PAGES[path]?.(user);
  if (dashboard) startEarly(DASHBOARD_REQUESTS[dashboard]);
};
