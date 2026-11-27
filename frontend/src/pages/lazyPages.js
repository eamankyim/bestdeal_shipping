import { lazyPage } from '../utils/lazyPage';

// Each page is its own download, fetched the first time it is opened, so nobody waits for pages
// they never use (a customer on the tracking page gets only that page). Pages most likely to be
// opened next are fetched while the browser is idle: the home page while someone signs in
// (LoginPage), the Jobs page once the menu is on screen (MainLayout).
// utils/lazyPage.js: unlike React.lazy, a page shows the moment its code is there.
export const AcceptInvitePage = lazyPage(() => import('./AcceptInvitePage'));
export const DashboardPage = lazyPage(() => import('./DashboardPage'));
export const JobsPage = lazyPage(() => import('./JobsPage'));
export const CustomersPage = lazyPage(() => import('./CustomersPage'));
export const ReportsPage = lazyPage(() => import('./ReportsPage'));
export const WarehouseDashboard = lazyPage(() => import('./WarehouseDashboard'));
export const GhanaWarehouseDashboardPage = lazyPage(() => import('./GhanaWarehouseDashboardPage'));
export const AdminDashboardPage = lazyPage(() => import('./AdminDashboardPage'));
export const BatchManagementPage = lazyPage(() => import('./BatchManagementPage'));
export const InvoiceManagementPage = lazyPage(() => import('./InvoiceManagementPage'));
export const PublicTrackingPage = lazyPage(() => import('./PublicTrackingPage'));
export const PrivacyPolicyPage = lazyPage(() => import('./PrivacyPolicyPage'));
export const SupportPage = lazyPage(() => import('./SupportPage'));
