# Frontend vs Mobile Role-Based Screen Comparison

## Frontend Role-Based Access (from Sidebar.jsx)

### superadmin/admin/customer-service/finance
- ✅ Dashboard (`/dashboard`)
- ✅ Jobs (`/jobs`)
- ✅ Customers (`/customers`) - **MISSING IN MOBILE**
- ✅ Batch Management (`/batch-management`) - ✅ Available in Account
- ✅ Invoice Management (`/invoice-management`) - **MISSING IN MOBILE**
- ✅ Reports (`/reports`) - **MISSING IN MOBILE**
- ✅ Track Shipment (`/track-shipment`) - ✅ Available as Tracking tab
- ✅ Settings (`/admin`) - **MISSING IN MOBILE** (placeholder only)

### driver
- ✅ Driver Dashboard (`/driver-dashboard`)
- ✅ Jobs (`/jobs`)
- ✅ Settings (`/admin`)

### warehouse
- ✅ Warehouse Dashboard (`/warehouse` or `/ghana-warehouse`)
- ✅ Jobs (`/jobs`)
- ✅ Batch Management (`/batch-management`) - ✅ Available in Account
- ✅ Track Shipment (`/track-shipment`) - ✅ Available as Tracking tab
- ✅ Settings (`/admin`)

### delivery-agent
- ✅ Delivery Agent Dashboard (`/delivery-agent`)
- ✅ Jobs (`/jobs`)
- ✅ Settings (`/admin`)

## Mobile Current Access

### All Roles
- ✅ Home (adapts to role)
- ✅ Jobs
- ✅ Tracking
- ✅ Account

### driver/delivery-agent
- ✅ Map (additional tab)

### admin/warehouse_staff
- ✅ Batch Management (in Account)

## Missing in Mobile

1. **Customers Screen** - For admin, customer-service roles
2. **Invoice Management** - For admin, finance roles
3. **Reports Screen** - For admin, finance roles
4. **Settings Screen** - For all roles (currently just placeholder)
5. **Role-specific dashboard views** - Mobile HomeScreen adapts, but could be more explicit

## Action Items

- [ ] Add Customers screen to Account stack
- [ ] Add Invoice Management screen to Account stack
- [ ] Add Reports screen to Account stack
- [ ] Create proper Settings screen (replace placeholder)
- [ ] Add role-based visibility for all new screens



