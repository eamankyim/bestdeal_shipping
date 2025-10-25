# Future Features - To Be Implemented

This document outlines features that have been removed from the current version but are planned for future implementation.

## Warehouse Dashboard - Removed Quick Actions

The following quick actions have been temporarily removed from the Warehouse Dashboard and will be implemented in future versions:

### 1. **Scan New Parcel**
- **Icon:** Scan/QR Code icon
- **Functionality:** Quick barcode/QR code scanning for fast parcel intake
- **Backend Requirements:**
  - Scanner device integration
  - Barcode/QR code generation system
  - Real-time parcel lookup by scan code
- **API Endpoints:**
  - `POST /api/warehouse/scan` - Process scanned parcel
  - `GET /api/parcels/by-barcode/:code` - Get parcel by barcode

### 2. **Create Shipment Batch**
- **Icon:** Plus icon
- **Functionality:** Create batches of shipments for consolidated shipping
- **Features:**
  - Select destination
  - Choose vessel/flight
  - Set departure and arrival dates
  - Add multiple parcels to a batch
  - Container number tracking
- **Backend Requirements:**
  - Batch management system
  - Vessel/flight schedule integration
  - Multi-parcel selection and grouping
- **API Endpoints:**
  - `POST /api/batches` - Create new batch
  - `PUT /api/batches/:id` - Update batch
  - `POST /api/batches/:id/parcels` - Add parcels to batch
  - `GET /api/vessels` - Get available vessels/flights

### 3. **Upload Manifest**
- **Icon:** Upload icon
- **Functionality:** Bulk upload shipping manifests via Excel/CSV
- **Features:**
  - File upload (Excel, CSV formats)
  - Data validation and preview
  - Bulk parcel creation
  - Error handling for invalid data
- **Backend Requirements:**
  - File parsing service (Excel/CSV)
  - Bulk insert with validation
  - Error reporting system
- **API Endpoints:**
  - `POST /api/warehouse/upload-manifest` - Upload and process manifest file
  - `GET /api/warehouse/manifest-template` - Download template file

### 4. **Quality Check**
- **Icon:** Checkmark icon
- **Functionality:** Comprehensive quality inspection system for parcels
- **Features:**
  - Select parcel for inspection
  - Multi-criteria assessment:
    - Package condition
    - Seal integrity
    - Weight verification
    - Overall condition assessment
  - Inspector assignment
  - Pass/Fail status
  - Quality check history
  - Generate inspection reports
- **Backend Requirements:**
  - Quality check tracking database
  - Inspector user assignment
  - Historical quality data
  - Reporting and analytics
- **API Endpoints:**
  - `POST /api/quality-checks` - Create quality check
  - `GET /api/quality-checks` - List all quality checks
  - `GET /api/quality-checks/:id` - Get specific check details
  - `GET /api/quality-checks/reports` - Generate quality reports

## Warehouse Status Panel - Removed

The following warehouse environmental monitoring features were removed:

### Environmental Monitoring
- **Storage Capacity** - Track used vs available storage space (m³)
- **Temperature** - Monitor warehouse temperature
- **Humidity** - Track humidity levels
- **Security Status** - Display security system status
- **Quality Status** - Show quality check monitoring status
- **Last Quality Check** - Display timestamp of last inspection

**Backend Requirements:**
- IoT sensor integration for temperature/humidity
- Storage capacity calculation system
- Security system integration
- Real-time monitoring dashboard

**API Endpoints:**
- `GET /api/warehouse/environmental-status` - Get current conditions
- `GET /api/warehouse/capacity` - Get storage capacity info
- `GET /api/warehouse/security-status` - Get security system status

## Quality Check Results Table - Removed

**Features:**
- Display recent quality check results
- Track tracking ID, customer, condition, status
- Show inspector and timestamp
- Filter by status (Passed/Failed)

**Backend Requirements:**
- Quality check history database
- Filtering and search capabilities

## Implementation Priority

When implementing these features, suggested priority order:

1. **Phase 1 (Critical):**
   - Create Shipment Batch
   - Upload Manifest

2. **Phase 2 (Important):**
   - Quality Check system
   - Scan New Parcel

3. **Phase 3 (Enhancement):**
   - Environmental Monitoring
   - Quality Check History & Reports

## Current Simplified Version

The warehouse dashboard now focuses on:
- ✅ **Add Product** - Simple product intake
- ✅ **Products Table** - View all products in warehouse
- ✅ **Recent Activities** - Activity timeline
- ✅ **Statistics** - Key metrics (Products in Stock, Pending Processing, Added Today, Total Weight)

This simplified version allows for core functionality while backend systems are developed.

## Notes for Developers

- All removed features have their UI components preserved in git history (commit before removal)
- Form validation and UX patterns can be reused when reimplementing
- Consider progressive enhancement: start with basic features, add advanced ones later
- Quality check system may require additional mobile app development for warehouse staff

---

**Last Updated:** October 10, 2025
**Status:** Features removed, awaiting backend development


