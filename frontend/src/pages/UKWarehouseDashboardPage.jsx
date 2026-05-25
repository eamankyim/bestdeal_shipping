import { dashboardAPI } from '../utils/api';
import WarehouseDashboard from './WarehouseDashboard';

export default function UKWarehouseDashboardPage() {
  return (
    <WarehouseDashboard
      dashboardApi={dashboardAPI.getUKWarehouse}
      title="UK Warehouse Dashboard"
      isUK
    />
  );
}
