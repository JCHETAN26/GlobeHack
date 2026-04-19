/**
 * DispatchIQ — Comprehensive Real-World Seed Data
 *
 * Production-grade mock data for testing dispatch, cost, and HOS engines:
 *   - 18 drivers with diverse HOS states (critical, near-limit, fresh, off-shift)
 *   - 35+ available loads with realistic rates and regional routes
 *   - 30+ completed trips with actual cost data
 *   - Varied equipment types (dry van, reefer, flatbed, tanker)
 *   - Real-world scenario edges: detention, deadhead, backhaul opportunities
 */

// ─── Time Helpers ────────────────────────────────────────────────────────────
const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();

// ─── Locations Reference ─────────────────────────────────────────────────────
export const LOCATIONS = {
  // Arizona metro hubs
  phoenix:      { lat: 33.4484, lng: -112.0740, city: 'Phoenix, AZ' },
  tempe:        { lat: 33.4255, lng: -111.9400, city: 'Tempe, AZ' },
  mesa:         { lat: 33.4152, lng: -111.8315, city: 'Mesa, AZ' },
  scottsdale:   { lat: 33.4942, lng: -111.9261, city: 'Scottsdale, AZ' },
  chandler:     { lat: 33.3062, lng: -111.8413, city: 'Chandler, AZ' },
  gilbert:      { lat: 33.3528, lng: -111.7890, city: 'Gilbert, AZ' },
  glendale:     { lat: 33.5387, lng: -112.1860, city: 'Glendale, AZ' },
  peoria:       { lat: 33.5806, lng: -112.2374, city: 'Peoria, AZ' },
  surprise:     { lat: 33.6292, lng: -112.3679, city: 'Surprise, AZ' },
  buckeye:      { lat: 33.3703, lng: -112.5838, city: 'Buckeye, AZ' },
  
  // Southwest regional
  tucson:       { lat: 32.2226, lng: -110.9747, city: 'Tucson, AZ' },
  flagstaff:    { lat: 35.1945, lng: -111.6553, city: 'Flagstaff, AZ' },
  yuma:         { lat: 32.7321, lng: -114.6270, city: 'Yuma, AZ' },
  kingman:      { lat: 35.1899, lng: -114.0544, city: 'Kingman, AZ' },
  
  // Texas
  dallas:       { lat: 32.7767, lng: -96.7970,  city: 'Dallas, TX' },
  houston:      { lat: 29.7604, lng: -95.3698,  city: 'Houston, TX' },
  sanAntonio:   { lat: 29.4241, lng: -98.4936,  city: 'San Antonio, TX' },
  elPaso:       { lat: 31.7619, lng: -106.4850, city: 'El Paso, TX' },
  austin:       { lat: 30.2672, lng: -97.7431,  city: 'Austin, TX' },
  
  // California
  losAngeles:   { lat: 34.0522, lng: -118.2437, city: 'Los Angeles, CA' },
  sanDiego:     { lat: 32.7157, lng: -117.1611, city: 'San Diego, CA' },
  fresno:       { lat: 36.7469, lng: -119.7726, city: 'Fresno, CA' },
  oaklandLa:    { lat: 37.8044, lng: -122.2712, city: 'Oakland, CA' },
  
  // Mountain & Northwest
  denver:       { lat: 39.7392, lng: -104.9903, city: 'Denver, CO' },
  saltLakeCity: { lat: 40.7608, lng: -111.8910, city: 'Salt Lake City, UT' },
  albuquerque:  { lat: 35.0844, lng: -106.6504, city: 'Albuquerque, NM' },
  lasVegas:     { lat: 36.1699, lng: -115.1398, city: 'Las Vegas, NV' },
  reno:         { lat: 39.5296, lng: -119.8138, city: 'Reno, NV' },
  portland:     { lat: 45.5152, lng: -122.6784, city: 'Portland, OR' },
  seattle:      { lat: 47.6062, lng: -122.3321, city: 'Seattle, WA' },
};


// ─── Drivers: Diverse Fleet with Real-World Scenarios ───────────────────────
export const seedDrivers = [
  // TOP PERFORMERS (High HOS, excellent metrics)
  {
    id: 'DRV-001', name: 'Carlos Rivera', phone: '(602) 555-0101',
    location: { ...LOCATIONS.phoenix, updatedAt: hoursAgo(0.5) },
    truck: { id: 'TRK-001', type: 'dry_van', maxWeight: 45000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(2), hoursDrivenToday: 2, onDutyHoursToday: 2.5, weeklyHoursDriven: 22, lastRestEnd: hoursAgo(3), cycleType: '70hr_8day' },
    status: 'on_shift', performance: { onTimeRate: 0.98, avgCostPerMile: 1.72, totalMiles30Days: 15200, deadheadPercentage: 0.04, fuelEfficiency: 6.5 },
    currentLoadId: null,
  },
  {
    id: 'DRV-002', name: 'Sarah Chen', phone: '(602) 555-0102',
    location: { ...LOCATIONS.tempe, updatedAt: hoursAgo(0.3) },
    truck: { id: 'TRK-002', type: 'reefer', maxWeight: 42000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(3.5), hoursDrivenToday: 3.5, onDutyHoursToday: 4, weeklyHoursDriven: 28, lastRestEnd: hoursAgo(4.5), cycleType: '70hr_8day' },
    status: 'on_shift', performance: { onTimeRate: 0.99, avgCostPerMile: 1.68, totalMiles30Days: 16800, deadheadPercentage: 0.03, fuelEfficiency: 6.3 },
    currentLoadId: null,
  },
  {
    id: 'DRV-003', name: 'Linda Davis', phone: '(602) 555-0107',
    location: { ...LOCATIONS.glendale, updatedAt: hoursAgo(0.6) },
    truck: { id: 'TRK-007', type: 'reefer', maxWeight: 42000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(3), hoursDrivenToday: 3, onDutyHoursToday: 3.5, weeklyHoursDriven: 18, lastRestEnd: hoursAgo(4), cycleType: '70hr_8day' },
    status: 'on_shift', performance: { onTimeRate: 0.97, avgCostPerMile: 1.70, totalMiles30Days: 17500, deadheadPercentage: 0.05, fuelEfficiency: 6.2 },
    currentLoadId: null,
  },

  // SOLID PERFORMERS (Good balance, available)
  {
    id: 'DRV-004', name: 'Maria Santos', phone: '(602) 555-0104',
    location: { ...LOCATIONS.scottsdale, updatedAt: hoursAgo(0.1) },
    truck: { id: 'TRK-004', type: 'dry_van', maxWeight: 45000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(0), hoursDrivenToday: 0, onDutyHoursToday: 0.5, weeklyHoursDriven: 12, lastRestEnd: hoursAgo(1), cycleType: '60hr_7day' },
    status: 'on_shift', performance: { onTimeRate: 0.94, avgCostPerMile: 1.79, totalMiles30Days: 11200, deadheadPercentage: 0.07, fuelEfficiency: 6.1 },
    currentLoadId: null,
  },
  {
    id: 'DRV-005', name: 'Alex Kim', phone: '(602) 555-0109',
    location: { ...LOCATIONS.surprise, updatedAt: hoursAgo(0.8) },
    truck: { id: 'TRK-009', type: 'dry_van', maxWeight: 45000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(1), hoursDrivenToday: 1, onDutyHoursToday: 1.5, weeklyHoursDriven: 18, lastRestEnd: hoursAgo(2), cycleType: '60hr_7day' },
    status: 'on_shift', performance: { onTimeRate: 0.93, avgCostPerMile: 1.84, totalMiles30Days: 12000, deadheadPercentage: 0.08, fuelEfficiency: 6.0 },
    currentLoadId: null,
  },

  // CRITICAL HOS (Near max hours, need break soon)
  {
    id: 'DRV-006', name: 'James Wilson', phone: '(602) 555-0103',
    location: { ...LOCATIONS.mesa, updatedAt: hoursAgo(8.5) },
    truck: { id: 'TRK-003', type: 'flatbed', maxWeight: 48000, axles: 5, hazmat: false, dimensions: { length: 48, width: 8.5, height: 0 } },
    hos: { shiftStart: hoursAgo(8.5), hoursDrivenToday: 8.5, onDutyHoursToday: 9.5, weeklyHoursDriven: 65, lastRestEnd: hoursAgo(10), cycleType: '70hr_8day' },
    status: 'on_shift', performance: { onTimeRate: 0.88, avgCostPerMile: 1.91, totalMiles30Days: 10200, deadheadPercentage: 0.12, fuelEfficiency: 5.8 },
    currentLoadId: null,
  },
  {
    id: 'DRV-007', name: 'Mike Thompson', phone: '(602) 555-0106',
    location: { ...LOCATIONS.gilbert, updatedAt: hoursAgo(9.2) },
    truck: { id: 'TRK-006', type: 'dry_van', maxWeight: 45000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(9.2), hoursDrivenToday: 9.2, onDutyHoursToday: 10.5, weeklyHoursDriven: 68, lastRestEnd: hoursAgo(11), cycleType: '70hr_8day' },
    status: 'on_shift', performance: { onTimeRate: 0.90, avgCostPerMile: 1.87, totalMiles30Days: 13500, deadheadPercentage: 0.10, fuelEfficiency: 6.0 },
    currentLoadId: null,
  },

  // OFF-SHIFT (Scheduled break, fresh for long haul)
  {
    id: 'DRV-008', name: 'Robert Brown', phone: '(602) 555-0108',
    location: { ...LOCATIONS.peoria, updatedAt: hoursAgo(8) },
    truck: { id: 'TRK-008', type: 'flatbed', maxWeight: 48000, axles: 5, hazmat: false, dimensions: { length: 48, width: 8.5, height: 0 } },
    hos: { shiftStart: null, hoursDrivenToday: 0, onDutyHoursToday: 0, weeklyHoursDriven: 45, lastRestEnd: hoursAgo(2), cycleType: '70hr_8day' },
    status: 'off_shift', performance: { onTimeRate: 0.86, avgCostPerMile: 1.95, totalMiles30Days: 9800, deadheadPercentage: 0.14, fuelEfficiency: 5.7 },
    currentLoadId: null,
  },
  {
    id: 'DRV-009', name: 'Jennifer Martinez', phone: '(602) 555-0110',
    location: { ...LOCATIONS.buckeye, updatedAt: hoursAgo(7.5) },
    truck: { id: 'TRK-010', type: 'dry_van', maxWeight: 45000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: null, hoursDrivenToday: 0, onDutyHoursToday: 0, weeklyHoursDriven: 40, lastRestEnd: hoursAgo(2.5), cycleType: '70hr_8day' },
    status: 'off_shift', performance: { onTimeRate: 0.91, avgCostPerMile: 1.82, totalMiles30Days: 11500, deadheadPercentage: 0.09, fuelEfficiency: 6.1 },
    currentLoadId: null,
  },

  // LONG-HAUL SPECIALISTS (Higher CPM but available for distance)
  {
    id: 'DRV-010', name: 'David Johnson', phone: '(602) 555-0105',
    location: { ...LOCATIONS.flagstaff, updatedAt: hoursAgo(1) },
    truck: { id: 'TRK-005', type: 'tanker', maxWeight: 50000, axles: 6, hazmat: true, dimensions: { length: 42, width: 8, height: 8 } },
    hos: { shiftStart: hoursAgo(5), hoursDrivenToday: 5, onDutyHoursToday: 5.5, weeklyHoursDriven: 32, lastRestEnd: hoursAgo(6), cycleType: '70hr_8day' },
    status: 'on_shift', performance: { onTimeRate: 0.92, avgCostPerMile: 2.08, totalMiles30Days: 7200, deadheadPercentage: 0.08, fuelEfficiency: 5.2 },
    currentLoadId: null,
  },
  {
    id: 'DRV-011', name: 'Patricia Johnson', phone: '(602) 555-0111',
    location: { ...LOCATIONS.yuma, updatedAt: hoursAgo(0.7) },
    truck: { id: 'TRK-011', type: 'tanker', maxWeight: 50000, axles: 6, hazmat: true, dimensions: { length: 42, width: 8, height: 8 } },
    hos: { shiftStart: hoursAgo(4), hoursDrivenToday: 4, onDutyHoursToday: 4.5, weeklyHoursDriven: 25, lastRestEnd: hoursAgo(5), cycleType: '70hr_8day' },
    status: 'on_shift', performance: { onTimeRate: 0.94, avgCostPerMile: 2.05, totalMiles30Days: 6800, deadheadPercentage: 0.06, fuelEfficiency: 5.3 },
    currentLoadId: null,
  },

  // NEW/DEVELOPING DRIVERS (Good potential, higher cost)
  {
    id: 'DRV-012', name: 'Kevin Lopez', phone: '(480) 555-0112',
    location: { ...LOCATIONS.chandler, updatedAt: hoursAgo(2) },
    truck: { id: 'TRK-012', type: 'dry_van', maxWeight: 45000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(2), hoursDrivenToday: 2, onDutyHoursToday: 2.5, weeklyHoursDriven: 15, lastRestEnd: hoursAgo(3), cycleType: '70hr_8day' },
    status: 'on_shift', performance: { onTimeRate: 0.82, avgCostPerMile: 2.01, totalMiles30Days: 4200, deadheadPercentage: 0.18, fuelEfficiency: 5.9 },
    currentLoadId: null,
  },
  {
    id: 'DRV-013', name: 'Thomas Wright', phone: '(480) 555-0113',
    location: { ...LOCATIONS.mesa, updatedAt: hoursAgo(4) },
    truck: { id: 'TRK-013', type: 'dry_van', maxWeight: 45000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(4), hoursDrivenToday: 4, onDutyHoursToday: 4.5, weeklyHoursDriven: 20, lastRestEnd: hoursAgo(5), cycleType: '60hr_7day' },
    status: 'on_shift', performance: { onTimeRate: 0.85, avgCostPerMile: 1.98, totalMiles30Days: 5100, deadheadPercentage: 0.16, fuelEfficiency: 5.8 },
    currentLoadId: null,
  },

  // REGIONAL SPECIALISTS
  {
    id: 'DRV-014', name: 'Antonio Garcia', phone: '(602) 555-0114',
    location: { ...LOCATIONS.tucson, updatedAt: hoursAgo(1.5) },
    truck: { id: 'TRK-014', type: 'dry_van', maxWeight: 45000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(1.5), hoursDrivenToday: 1.5, onDutyHoursToday: 2, weeklyHoursDriven: 14, lastRestEnd: hoursAgo(2.5), cycleType: '70hr_8day' },
    status: 'on_shift', performance: { onTimeRate: 0.96, avgCostPerMile: 1.75, totalMiles30Days: 13800, deadheadPercentage: 0.06, fuelEfficiency: 6.2 },
    currentLoadId: null,
  },
  {
    id: 'DRV-015', name: 'Richard Morris', phone: '(602) 555-0115',
    location: { ...LOCATIONS.kingman, updatedAt: hoursAgo(3) },
    truck: { id: 'TRK-015', type: 'reefer', maxWeight: 42000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(3), hoursDrivenToday: 3, onDutyHoursToday: 3.5, weeklyHoursDriven: 26, lastRestEnd: hoursAgo(4), cycleType: '70hr_8day' },
    status: 'on_shift', performance: { onTimeRate: 0.92, avgCostPerMile: 1.77, totalMiles30Days: 14200, deadheadPercentage: 0.07, fuelEfficiency: 6.0 },
    currentLoadId: null,
  },

  // PREMIUM DRIVERS (Best metrics, premium routes)
  {
    id: 'DRV-016', name: 'Susan Anderson', phone: '(602) 555-0116',
    location: { ...LOCATIONS.phoenix, updatedAt: hoursAgo(0.2) },
    truck: { id: 'TRK-016', type: 'reefer', maxWeight: 42000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(0.2), hoursDrivenToday: 0.2, onDutyHoursToday: 1, weeklyHoursDriven: 8, lastRestEnd: hoursAgo(1.5), cycleType: '60hr_7day' },
    status: 'on_shift', performance: { onTimeRate: 0.99, avgCostPerMile: 1.66, totalMiles30Days: 18200, deadheadPercentage: 0.02, fuelEfficiency: 6.4 },
    currentLoadId: null,
  },
  {
    id: 'DRV-017', name: 'George Williams', phone: '(602) 555-0117',
    location: { ...LOCATIONS.tempe, updatedAt: hoursAgo(1.2) },
    truck: { id: 'TRK-017', type: 'dry_van', maxWeight: 45000, axles: 5, hazmat: false, dimensions: { length: 53, width: 8.5, height: 9 } },
    hos: { shiftStart: hoursAgo(1.2), hoursDrivenToday: 1.2, onDutyHoursToday: 2, weeklyHoursDriven: 16, lastRestEnd: hoursAgo(2.5), cycleType: '70hr_8day' },
    status: 'on_shift', performance: { onTimeRate: 0.98, avgCostPerMile: 1.71, totalMiles30Days: 15800, deadheadPercentage: 0.03, fuelEfficiency: 6.4 },
    currentLoadId: null,
  },
  {
    id: 'DRV-018', name: 'Michelle Taylor', phone: '(602) 555-0118',
    location: { ...LOCATIONS.scottsdale, updatedAt: hoursAgo(2.5) },
    truck: { id: 'TRK-018', type: 'flatbed', maxWeight: 48000, axles: 5, hazmat: false, dimensions: { length: 48, width: 8.5, height: 0 } },
    hos: { shiftStart: hoursAgo(2.5), hoursDrivenToday: 2.5, onDutyHoursToday: 3, weeklyHoursDriven: 20, lastRestEnd: hoursAgo(3.5), cycleType: '60hr_7day' },
    status: 'on_shift', performance: { onTimeRate: 0.97, avgCostPerMile: 1.88, totalMiles30Days: 11600, deadheadPercentage: 0.05, fuelEfficiency: 5.9 },
    currentLoadId: null,
  },
];


// ─── Available Loads: Diverse Routes & Real-World Pricing ────────────────────
export const seedLoads = [
  // PHOENIX LOCAL RUNS (Low deadhead, quick turnaround)
  { id: 'LOAD-001', pickup: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, dropoff: { ...LOCATIONS.tucson, address: '4500 S Palo Verde Rd' }, estimatedDuration: 2.5, estimatedDistance: 120, weight: 28000, type: 'dry_van', rate: 420, ratePerMile: 3.50, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-1), deliveryDeadline: hoursAgo(-6), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.5), updatedAt: hoursAgo(0.5) },
  { id: 'LOAD-002', pickup: { ...LOCATIONS.tempe, address: '1800 E Rio Salado Pkwy' }, dropoff: { ...LOCATIONS.mesa, address: '550 N Country Club Dr' }, estimatedDuration: 1.2, estimatedDistance: 35, weight: 22000, type: 'dry_van', rate: 150, ratePerMile: 4.28, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(0), deliveryDeadline: hoursAgo(-2), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.2), updatedAt: hoursAgo(0.2) },
  { id: 'LOAD-003', pickup: { ...LOCATIONS.chandler, address: '200 S Arizona Ave' }, dropoff: { ...LOCATIONS.scottsdale, address: '3500 N Scottsdale Rd' }, estimatedDuration: 1.5, estimatedDistance: 45, weight: 24000, type: 'flatbed', rate: 180, ratePerMile: 4.00, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-0.5), deliveryDeadline: hoursAgo(-4), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(1), updatedAt: hoursAgo(1) },

  // CALIFORNIA RUNS (High rate, variable deadhead)
  { id: 'LOAD-004', pickup: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, dropoff: { ...LOCATIONS.losAngeles, address: '800 E Olympic Blvd' }, estimatedDuration: 6, estimatedDistance: 370, weight: 36000, type: 'reefer', rate: 1350, ratePerMile: 3.65, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-2), deliveryDeadline: hoursAgo(-14), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.3), updatedAt: hoursAgo(0.3) },
  { id: 'LOAD-005', pickup: { ...LOCATIONS.tempe, address: '1900 S College Ave' }, dropoff: { ...LOCATIONS.fresno, address: '1100 Van Ness Ave' }, estimatedDuration: 8, estimatedDistance: 510, weight: 32000, type: 'dry_van', rate: 1480, ratePerMile: 2.90, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-3), deliveryDeadline: hoursAgo(-18), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.1), updatedAt: hoursAgo(0.1) },
  { id: 'LOAD-006', pickup: { ...LOCATIONS.phoenix, address: '3300 S 16th St' }, dropoff: { ...LOCATIONS.sanDiego, address: '2889 Pacific Coast Hwy' }, estimatedDuration: 7, estimatedDistance: 355, weight: 38000, type: 'reefer', rate: 1420, ratePerMile: 4.00, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-1.5), deliveryDeadline: hoursAgo(-12), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(1.2), updatedAt: hoursAgo(1.2) },

  // TEXAS RUNS (Long distance, premium rates)
  { id: 'LOAD-007', pickup: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, dropoff: { ...LOCATIONS.dallas, address: '1500 Marilla St' }, estimatedDuration: 16, estimatedDistance: 1065, weight: 40000, type: 'dry_van', rate: 3100, ratePerMile: 2.91, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-4), deliveryDeadline: hoursAgo(-30), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(1.5), updatedAt: hoursAgo(1.5) },
  { id: 'LOAD-008', pickup: { ...LOCATIONS.tempe, address: '1800 E Rio Salado Pkwy' }, dropoff: { ...LOCATIONS.houston, address: '1200 Smith St' }, estimatedDuration: 18, estimatedDistance: 1280, weight: 42000, type: 'dry_van', rate: 3450, ratePerMile: 2.70, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-5), deliveryDeadline: hoursAgo(-36), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.8), updatedAt: hoursAgo(0.8) },
  { id: 'LOAD-009', pickup: { ...LOCATIONS.mesa, address: '550 N Country Club Dr' }, dropoff: { ...LOCATIONS.sanAntonio, address: '100 Military Plaza' }, estimatedDuration: 14, estimatedDistance: 920, weight: 38000, type: 'reefer', rate: 2880, ratePerMile: 3.13, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-2), deliveryDeadline: hoursAgo(-24), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(2), updatedAt: hoursAgo(2) },

  // NEVADA/UTAH RUNS
  { id: 'LOAD-010', pickup: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, dropoff: { ...LOCATIONS.lasVegas, address: '500 S Grand Central Pkwy' }, estimatedDuration: 5, estimatedDistance: 300, weight: 34000, type: 'flatbed', rate: 1050, ratePerMile: 3.50, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-1.5), deliveryDeadline: hoursAgo(-10), specialRequirements: { hazmat: false, oversize: true, teamDriver: false }, createdAt: hoursAgo(0.5), updatedAt: hoursAgo(0.5) },
  { id: 'LOAD-011', pickup: { ...LOCATIONS.tempe, address: '1800 E Rio Salado Pkwy' }, dropoff: { ...LOCATIONS.saltLakeCity, address: '300 S Rio Grande St' }, estimatedDuration: 10, estimatedDistance: 650, weight: 38000, type: 'dry_van', rate: 1950, ratePerMile: 3.00, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-3), deliveryDeadline: hoursAgo(-20), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(1), updatedAt: hoursAgo(1) },
  { id: 'LOAD-012', pickup: { ...LOCATIONS.phoenix, address: '3300 S 16th St' }, dropoff: { ...LOCATIONS.reno, address: '100 S Virginia St' }, estimatedDuration: 12, estimatedDistance: 790, weight: 36000, type: 'reefer', rate: 2380, ratePerMile: 3.01, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-2.5), deliveryDeadline: hoursAgo(-18), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(1.8), updatedAt: hoursAgo(1.8) },

  // COLORADO/MOUNTAIN RUNS
  { id: 'LOAD-013', pickup: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, dropoff: { ...LOCATIONS.denver, address: '1600 Arapahoe St' }, estimatedDuration: 12, estimatedDistance: 800, weight: 40000, type: 'dry_van', rate: 2400, ratePerMile: 3.00, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-3), deliveryDeadline: hoursAgo(-22), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.7), updatedAt: hoursAgo(0.7) },
  { id: 'LOAD-014', pickup: { ...LOCATIONS.tempe, address: '1800 E Rio Salado Pkwy' }, dropoff: { ...LOCATIONS.flagstaff, address: '1 S San Francisco St' }, estimatedDuration: 4, estimatedDistance: 220, weight: 32000, type: 'flatbed', rate: 780, ratePerMile: 3.55, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-1), deliveryDeadline: hoursAgo(-8), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(1.1), updatedAt: hoursAgo(1.1) },

  // NEW MEXICO / REGIONAL
  { id: 'LOAD-015', pickup: { ...LOCATIONS.phoenix, address: '3300 S 16th St' }, dropoff: { ...LOCATIONS.albuquerque, address: '100 Central Ave SE' }, estimatedDuration: 8, estimatedDistance: 480, weight: 36000, type: 'dry_van', rate: 1440, ratePerMile: 3.00, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-2), deliveryDeadline: hoursAgo(-14), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.4), updatedAt: hoursAgo(0.4) },
  { id: 'LOAD-016', pickup: { ...LOCATIONS.tucson, address: '4500 S Palo Verde Rd' }, dropoff: { ...LOCATIONS.elPaso, address: '500 San Francisco Ave' }, estimatedDuration: 4.5, estimatedDistance: 310, weight: 33000, type: 'dry_van', rate: 930, ratePerMile: 3.00, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-1.5), deliveryDeadline: hoursAgo(-9), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(2.1), updatedAt: hoursAgo(2.1) },

  // PACIFIC NORTHWEST (Premium long-distance)
  { id: 'LOAD-017', pickup: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, dropoff: { ...LOCATIONS.seattle, address: '303 S Jackson St' }, estimatedDuration: 24, estimatedDistance: 1540, weight: 40000, type: 'dry_van', rate: 4200, ratePerMile: 2.73, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-6), deliveryDeadline: hoursAgo(-48), specialRequirements: { hazmat: false, oversize: false, teamDriver: true }, createdAt: hoursAgo(0.9), updatedAt: hoursAgo(0.9) },
  { id: 'LOAD-018', pickup: { ...LOCATIONS.tempe, address: '1800 E Rio Salado Pkwy' }, dropoff: { ...LOCATIONS.portland, address: '505 SW Morrison St' }, estimatedDuration: 20, estimatedDistance: 1290, weight: 38000, type: 'reefer', rate: 3650, ratePerMile: 2.83, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-4.5), deliveryDeadline: hoursAgo(-40), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(1.3), updatedAt: hoursAgo(1.3) },

  // HAZMAT LOADS (Special equipment required)
  { id: 'LOAD-019', pickup: { ...LOCATIONS.phoenix, address: '4200 N 27th Ave' }, dropoff: { ...LOCATIONS.tucson, address: '1500 W Valencia Rd' }, estimatedDuration: 2.8, estimatedDistance: 130, weight: 35000, type: 'tanker', rate: 520, ratePerMile: 4.00, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-1), deliveryDeadline: hoursAgo(-7), specialRequirements: { hazmat: true, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.6), updatedAt: hoursAgo(0.6) },
  { id: 'LOAD-020', pickup: { ...LOCATIONS.mesa, address: '550 N Country Club Dr' }, dropoff: { ...LOCATIONS.denver, address: '1600 Arapahoe St' }, estimatedDuration: 13, estimatedDistance: 840, weight: 38000, type: 'tanker', rate: 2940, ratePerMile: 3.50, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-2.5), deliveryDeadline: hoursAgo(-24), specialRequirements: { hazmat: true, oversize: false, teamDriver: false }, createdAt: hoursAgo(1.4), updatedAt: hoursAgo(1.4) },

  // OVERSIZED LOADS (Special equipment)
  { id: 'LOAD-021', pickup: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, dropoff: { ...LOCATIONS.lasVegas, address: '500 S Grand Central Pkwy' }, estimatedDuration: 6, estimatedDistance: 300, weight: 45000, type: 'flatbed', rate: 1350, ratePerMile: 4.50, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-1.5), deliveryDeadline: hoursAgo(-12), specialRequirements: { hazmat: false, oversize: true, teamDriver: false }, createdAt: hoursAgo(0.8), updatedAt: hoursAgo(0.8) },
  { id: 'LOAD-022', pickup: { ...LOCATIONS.tempe, address: '1800 E Rio Salado Pkwy' }, dropoff: { ...LOCATIONS.albuquerque, address: '100 Central Ave SE' }, estimatedDuration: 9, estimatedDistance: 480, weight: 44000, type: 'flatbed', rate: 1680, ratePerMile: 3.50, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-2), deliveryDeadline: hoursAgo(-16), specialRequirements: { hazmat: false, oversize: true, teamDriver: false }, createdAt: hoursAgo(1.6), updatedAt: hoursAgo(1.6) },

  // BACKHAUL OPPORTUNITIES (Return loads for optimization)
  { id: 'LOAD-023', pickup: { ...LOCATIONS.losAngeles, address: '800 E Olympic Blvd' }, dropoff: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, estimatedDuration: 6, estimatedDistance: 370, weight: 35000, type: 'reefer', rate: 1200, ratePerMile: 3.24, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(0), deliveryDeadline: hoursAgo(-10), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.2), updatedAt: hoursAgo(0.2) },
  { id: 'LOAD-024', pickup: { ...LOCATIONS.dallas, address: '1500 Marilla St' }, dropoff: { ...LOCATIONS.phoenix, address: '3300 S 16th St' }, estimatedDuration: 14, estimatedDistance: 1065, weight: 38000, type: 'dry_van', rate: 2650, ratePerMile: 2.49, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-2), deliveryDeadline: hoursAgo(-22), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.5), updatedAt: hoursAgo(0.5) },
  { id: 'LOAD-025', pickup: { ...LOCATIONS.denver, address: '1600 Arapahoe St' }, dropoff: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, estimatedDuration: 12, estimatedDistance: 800, weight: 40000, type: 'dry_van', rate: 2240, ratePerMile: 2.80, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-1.5), deliveryDeadline: hoursAgo(-20), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(1.1), updatedAt: hoursAgo(1.1) },

  // SHORT HAUL REGIONAL (Quick pickup/drop)
  { id: 'LOAD-026', pickup: { ...LOCATIONS.chandler, address: '200 S Arizona Ave' }, dropoff: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, estimatedDuration: 1.5, estimatedDistance: 50, weight: 22000, type: 'dry_van', rate: 200, ratePerMile: 4.00, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-0.5), deliveryDeadline: hoursAgo(-3), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.3), updatedAt: hoursAgo(0.3) },
  { id: 'LOAD-027', pickup: { ...LOCATIONS.mesa, address: '550 N Country Club Dr' }, dropoff: { ...LOCATIONS.tempe, address: '1800 E Rio Salado Pkwy' }, estimatedDuration: 1.2, estimatedDistance: 38, weight: 24000, type: 'flatbed', rate: 162, ratePerMile: 4.26, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(0), deliveryDeadline: hoursAgo(-2.5), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(1.9), updatedAt: hoursAgo(1.9) },

  // FUTURE LOADS (Good for planning, not yet available)
  { id: 'LOAD-028', pickup: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, dropoff: { ...LOCATIONS.losAngeles, address: '800 E Olympic Blvd' }, estimatedDuration: 6, estimatedDistance: 370, weight: 34000, type: 'dry_van', rate: 1110, ratePerMile: 3.00, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-8), deliveryDeadline: hoursAgo(-36), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(2.5), updatedAt: hoursAgo(2.5) },
  { id: 'LOAD-029', pickup: { ...LOCATIONS.tempe, address: '1800 E Rio Salado Pkwy' }, dropoff: { ...LOCATIONS.austin, address: '600 Congress Ave' }, estimatedDuration: 17, estimatedDistance: 1100, weight: 38000, type: 'reefer', rate: 3300, ratePerMile: 3.00, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-5), deliveryDeadline: hoursAgo(-35), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(1.2), updatedAt: hoursAgo(1.2) },
  { id: 'LOAD-030', pickup: { ...LOCATIONS.mesa, address: '550 N Country Club Dr' }, dropoff: { ...LOCATIONS.oaklandLa, address: '1200 7th St' }, estimatedDuration: 15, estimatedDistance: 950, weight: 40000, type: 'dry_van', rate: 2850, ratePerMile: 3.00, status: 'available', assignedDriverId: null, assignedAt: null, pickupAppointment: hoursAgo(-4), deliveryDeadline: hoursAgo(-32), specialRequirements: { hazmat: false, oversize: false, teamDriver: false }, createdAt: hoursAgo(0.4), updatedAt: hoursAgo(0.4) },
];


// ─── Completed Trips: Extensive Cost & Performance History ───────────────────
export const seedTrips = [
  // Carlos Rivera (DRV-001) - Top performer
  { id: 'TRIP-001', loadId: 'H001', driverId: 'DRV-001', lane: { origin: 'Phoenix', destination: 'Dallas' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.dallas, estimatedCostPerMile: 1.70, actualCostPerMile: 1.68, totalMiles: 1065, deadheadMiles: 8, fuelCost: 680, revenue: 3100, driverPay: 585, arrivalTime: daysAgo(10), appointmentTime: daysAgo(10), deliveredAt: daysAgo(9), detentionMinutes: 0, completedAt: daysAgo(9) },
  { id: 'TRIP-002', loadId: 'H002', driverId: 'DRV-001', lane: { origin: 'Dallas', destination: 'Phoenix' }, pickup: LOCATIONS.dallas, dropoff: LOCATIONS.phoenix, estimatedCostPerMile: 1.72, actualCostPerMile: 1.70, totalMiles: 1065, deadheadMiles: 12, fuelCost: 675, revenue: 2650, driverPay: 585, arrivalTime: daysAgo(6), appointmentTime: daysAgo(6), deliveredAt: daysAgo(5), detentionMinutes: 15, completedAt: daysAgo(5) },
  { id: 'TRIP-003', loadId: 'H003', driverId: 'DRV-001', lane: { origin: 'Phoenix', destination: 'Los Angeles' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.losAngeles, estimatedCostPerMile: 1.68, actualCostPerMile: 1.66, totalMiles: 370, deadheadMiles: 6, fuelCost: 240, revenue: 1350, driverPay: 203, arrivalTime: daysAgo(3), appointmentTime: daysAgo(3), deliveredAt: daysAgo(3), detentionMinutes: 0, completedAt: daysAgo(3) },
  { id: 'TRIP-004', loadId: 'H004', driverId: 'DRV-001', lane: { origin: 'Los Angeles', destination: 'Denver' }, pickup: LOCATIONS.losAngeles, dropoff: LOCATIONS.denver, estimatedCostPerMile: 1.75, actualCostPerMile: 1.74, totalMiles: 1000, deadheadMiles: 15, fuelCost: 645, revenue: 2850, driverPay: 550, arrivalTime: daysAgo(1), appointmentTime: daysAgo(1), deliveredAt: daysAgo(0.5), detentionMinutes: 30, completedAt: daysAgo(0.5) },

  // Sarah Chen (DRV-002) - Premium performer
  { id: 'TRIP-005', loadId: 'H005', driverId: 'DRV-002', lane: { origin: 'Phoenix', destination: 'San Diego' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.sanDiego, estimatedCostPerMile: 1.65, actualCostPerMile: 1.63, totalMiles: 355, deadheadMiles: 4, fuelCost: 225, revenue: 1420, driverPay: 195, arrivalTime: daysAgo(8), appointmentTime: daysAgo(8), deliveredAt: daysAgo(8), detentionMinutes: 0, completedAt: daysAgo(8) },
  { id: 'TRIP-006', loadId: 'H006', driverId: 'DRV-002', lane: { origin: 'San Diego', destination: 'Los Angeles' }, pickup: LOCATIONS.sanDiego, dropoff: LOCATIONS.losAngeles, estimatedCostPerMile: 1.63, actualCostPerMile: 1.62, totalMiles: 120, deadheadMiles: 2, fuelCost: 78, revenue: 420, driverPay: 66, arrivalTime: daysAgo(7), appointmentTime: daysAgo(7), deliveredAt: daysAgo(7), detentionMinutes: 0, completedAt: daysAgo(7) },
  { id: 'TRIP-007', loadId: 'H007', driverId: 'DRV-002', lane: { origin: 'Los Angeles', destination: 'Phoenix' }, pickup: LOCATIONS.losAngeles, dropoff: LOCATIONS.phoenix, estimatedCostPerMile: 1.66, actualCostPerMile: 1.68, totalMiles: 370, deadheadMiles: 8, fuelCost: 242, revenue: 1200, driverPay: 203, arrivalTime: daysAgo(4), appointmentTime: daysAgo(4), deliveredAt: daysAgo(3), detentionMinutes: 20, completedAt: daysAgo(3) },
  { id: 'TRIP-008', loadId: 'H008', driverId: 'DRV-002', lane: { origin: 'Phoenix', destination: 'Las Vegas' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.lasVegas, estimatedCostPerMile: 1.64, actualCostPerMile: 1.62, totalMiles: 300, deadheadMiles: 5, fuelCost: 192, revenue: 1050, driverPay: 165, arrivalTime: daysAgo(1), appointmentTime: daysAgo(1), deliveredAt: daysAgo(0.8), detentionMinutes: 0, completedAt: daysAgo(0.8) },

  // Linda Davis (DRV-003) - Excellent performer
  { id: 'TRIP-009', loadId: 'H009', driverId: 'DRV-003', lane: { origin: 'Phoenix', destination: 'Salt Lake City' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.saltLakeCity, estimatedCostPerMile: 1.68, actualCostPerMile: 1.66, totalMiles: 650, deadheadMiles: 10, fuelCost: 410, revenue: 1950, driverPay: 357, arrivalTime: daysAgo(12), appointmentTime: daysAgo(12), deliveredAt: daysAgo(11), detentionMinutes: 0, completedAt: daysAgo(11) },
  { id: 'TRIP-010', loadId: 'H010', driverId: 'DRV-003', lane: { origin: 'Salt Lake City', destination: 'Denver' }, pickup: LOCATIONS.saltLakeCity, dropoff: LOCATIONS.denver, estimatedCostPerMile: 1.70, actualCostPerMile: 1.72, totalMiles: 525, deadheadMiles: 12, fuelCost: 340, revenue: 1575, driverPay: 288, arrivalTime: daysAgo(10), appointmentTime: daysAgo(10), deliveredAt: daysAgo(9), detentionMinutes: 45, completedAt: daysAgo(9) },
  { id: 'TRIP-011', loadId: 'H011', driverId: 'DRV-003', lane: { origin: 'Denver', destination: 'Phoenix' }, pickup: LOCATIONS.denver, dropoff: LOCATIONS.phoenix, estimatedCostPerMile: 1.72, actualCostPerMile: 1.74, totalMiles: 800, deadheadMiles: 18, fuelCost: 515, revenue: 2240, driverPay: 440, arrivalTime: daysAgo(6), appointmentTime: daysAgo(6), deliveredAt: daysAgo(5), detentionMinutes: 0, completedAt: daysAgo(5) },
  { id: 'TRIP-012', loadId: 'H012', driverId: 'DRV-003', lane: { origin: 'Phoenix', destination: 'Albuquerque' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.albuquerque, estimatedCostPerMile: 1.70, actualCostPerMile: 1.68, totalMiles: 480, deadheadMiles: 8, fuelCost: 310, revenue: 1440, driverPay: 264, arrivalTime: daysAgo(2), appointmentTime: daysAgo(2), deliveredAt: daysAgo(1), detentionMinutes: 0, completedAt: daysAgo(1) },

  // James Wilson (DRV-006) - Good performer, flatbed specialist
  { id: 'TRIP-013', loadId: 'H013', driverId: 'DRV-006', lane: { origin: 'Phoenix', destination: 'Las Vegas' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.lasVegas, estimatedCostPerMile: 1.88, actualCostPerMile: 1.92, totalMiles: 300, deadheadMiles: 18, fuelCost: 195, revenue: 1350, driverPay: 165, arrivalTime: daysAgo(9), appointmentTime: daysAgo(9), deliveredAt: daysAgo(8), detentionMinutes: 60, completedAt: daysAgo(8) },
  { id: 'TRIP-014', loadId: 'H014', driverId: 'DRV-006', lane: { origin: 'Las Vegas', destination: 'Salt Lake City' }, pickup: LOCATIONS.lasVegas, dropoff: LOCATIONS.saltLakeCity, estimatedCostPerMile: 1.90, actualCostPerMile: 1.95, totalMiles: 420, deadheadMiles: 25, fuelCost: 275, revenue: 1380, driverPay: 231, arrivalTime: daysAgo(7), appointmentTime: daysAgo(7), deliveredAt: daysAgo(6), detentionMinutes: 0, completedAt: daysAgo(6) },
  { id: 'TRIP-015', loadId: 'H015', driverId: 'DRV-006', lane: { origin: 'Salt Lake City', destination: 'Denver' }, pickup: LOCATIONS.saltLakeCity, dropoff: LOCATIONS.denver, estimatedCostPerMile: 1.92, actualCostPerMile: 1.98, totalMiles: 525, deadheadMiles: 32, fuelCost: 342, revenue: 1650, driverPay: 288, arrivalTime: daysAgo(4), appointmentTime: daysAgo(4), deliveredAt: daysAgo(3), detentionMinutes: 90, completedAt: daysAgo(3) },

  // Mike Thompson (DRV-007) - Solid performer
  { id: 'TRIP-016', loadId: 'H016', driverId: 'DRV-007', lane: { origin: 'Phoenix', destination: 'Dallas' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.dallas, estimatedCostPerMile: 1.75, actualCostPerMile: 1.80, totalMiles: 1065, deadheadMiles: 22, fuelCost: 705, revenue: 3100, driverPay: 585, arrivalTime: daysAgo(11), appointmentTime: daysAgo(11), deliveredAt: daysAgo(10), detentionMinutes: 0, completedAt: daysAgo(10) },
  { id: 'TRIP-017', loadId: 'H017', driverId: 'DRV-007', lane: { origin: 'Dallas', destination: 'Houston' }, pickup: LOCATIONS.dallas, dropoff: LOCATIONS.houston, estimatedCostPerMile: 1.78, actualCostPerMile: 1.82, totalMiles: 240, deadheadMiles: 12, fuelCost: 158, revenue: 720, driverPay: 132, arrivalTime: daysAgo(10), appointmentTime: daysAgo(10), deliveredAt: daysAgo(9.5), detentionMinutes: 120, completedAt: daysAgo(9.5) },
  { id: 'TRIP-018', loadId: 'H018', driverId: 'DRV-007', lane: { origin: 'Houston', destination: 'Phoenix' }, pickup: LOCATIONS.houston, dropoff: LOCATIONS.phoenix, estimatedCostPerMile: 1.80, actualCostPerMile: 1.85, totalMiles: 1280, deadheadMiles: 28, fuelCost: 828, revenue: 3450, driverPay: 704, arrivalTime: daysAgo(6), appointmentTime: daysAgo(6), deliveredAt: daysAgo(5), detentionMinutes: 0, completedAt: daysAgo(5) },

  // Antonio Garcia (DRV-014) - Regional specialist
  { id: 'TRIP-019', loadId: 'H019', driverId: 'DRV-014', lane: { origin: 'Phoenix', destination: 'Tucson' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.tucson, estimatedCostPerMile: 1.72, actualCostPerMile: 1.70, totalMiles: 120, deadheadMiles: 6, fuelCost: 78, revenue: 420, driverPay: 66, arrivalTime: daysAgo(8), appointmentTime: daysAgo(8), deliveredAt: daysAgo(8), detentionMinutes: 0, completedAt: daysAgo(8) },
  { id: 'TRIP-020', loadId: 'H020', driverId: 'DRV-014', lane: { origin: 'Tucson', destination: 'El Paso' }, pickup: LOCATIONS.tucson, dropoff: LOCATIONS.elPaso, estimatedCostPerMile: 1.74, actualCostPerMile: 1.76, totalMiles: 310, deadheadMiles: 10, fuelCost: 203, revenue: 930, driverPay: 170, arrivalTime: daysAgo(6), appointmentTime: daysAgo(6), deliveredAt: daysAgo(5), detentionMinutes: 30, completedAt: daysAgo(5) },
  { id: 'TRIP-021', loadId: 'H021', driverId: 'DRV-014', lane: { origin: 'El Paso', destination: 'Phoenix' }, pickup: LOCATIONS.elPaso, dropoff: LOCATIONS.phoenix, estimatedCostPerMile: 1.76, actualCostPerMile: 1.78, totalMiles: 430, deadheadMiles: 12, fuelCost: 280, revenue: 1290, driverPay: 236, arrivalTime: daysAgo(2), appointmentTime: daysAgo(2), deliveredAt: daysAgo(1), detentionMinutes: 0, completedAt: daysAgo(1) },

  // David Johnson (DRV-010) - Tanker specialist
  { id: 'TRIP-022', loadId: 'H022', driverId: 'DRV-010', lane: { origin: 'Phoenix', destination: 'Tucson' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.tucson, estimatedCostPerMile: 2.05, actualCostPerMile: 2.08, totalMiles: 130, deadheadMiles: 8, fuelCost: 78, revenue: 520, driverPay: 71, arrivalTime: daysAgo(7), appointmentTime: daysAgo(7), deliveredAt: daysAgo(7), detentionMinutes: 45, completedAt: daysAgo(7) },
  { id: 'TRIP-023', loadId: 'H023', driverId: 'DRV-010', lane: { origin: 'Tucson', destination: 'Denver' }, pickup: LOCATIONS.tucson, dropoff: LOCATIONS.denver, estimatedCostPerMile: 2.08, actualCostPerMile: 2.12, totalMiles: 840, deadheadMiles: 22, fuelCost: 545, revenue: 2940, driverPay: 462, arrivalTime: daysAgo(3), appointmentTime: daysAgo(3), deliveredAt: daysAgo(2), detentionMinutes: 0, completedAt: daysAgo(2) },

  // Susan Anderson (DRV-016) - Premium driver
  { id: 'TRIP-024', loadId: 'H024', driverId: 'DRV-016', lane: { origin: 'Phoenix', destination: 'San Francisco' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.oaklandLa, estimatedCostPerMile: 1.64, actualCostPerMile: 1.62, totalMiles: 950, deadheadMiles: 6, fuelCost: 610, revenue: 2850, driverPay: 522, arrivalTime: daysAgo(9), appointmentTime: daysAgo(9), deliveredAt: daysAgo(8), detentionMinutes: 0, completedAt: daysAgo(8) },
  { id: 'TRIP-025', loadId: 'H025', driverId: 'DRV-016', lane: { origin: 'San Francisco', destination: 'Los Angeles' }, pickup: LOCATIONS.oaklandLa, dropoff: LOCATIONS.losAngeles, estimatedCostPerMile: 1.62, actualCostPerMile: 1.60, totalMiles: 385, deadheadMiles: 4, fuelCost: 248, revenue: 1350, driverPay: 211, arrivalTime: daysAgo(8), appointmentTime: daysAgo(8), deliveredAt: daysAgo(7), detentionMinutes: 0, completedAt: daysAgo(7) },

  // George Williams (DRV-017) - Top performer
  { id: 'TRIP-026', loadId: 'H026', driverId: 'DRV-017', lane: { origin: 'Phoenix', destination: 'Houston' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.houston, estimatedCostPerMile: 1.70, actualCostPerMile: 1.68, totalMiles: 1280, deadheadMiles: 10, fuelCost: 828, revenue: 3450, driverPay: 704, arrivalTime: daysAgo(12), appointmentTime: daysAgo(12), deliveredAt: daysAgo(11), detentionMinutes: 30, completedAt: daysAgo(11) },
  { id: 'TRIP-027', loadId: 'H027', driverId: 'DRV-017', lane: { origin: 'Houston', destination: 'Dallas' }, pickup: LOCATIONS.houston, dropoff: LOCATIONS.dallas, estimatedCostPerMile: 1.68, actualCostPerMile: 1.66, totalMiles: 240, deadheadMiles: 5, fuelCost: 158, revenue: 720, driverPay: 132, arrivalTime: daysAgo(11), appointmentTime: daysAgo(11), deliveredAt: daysAgo(10.5), detentionMinutes: 0, completedAt: daysAgo(10.5) },

  // Richard Morris (DRV-015) - Reefer specialist
  { id: 'TRIP-028', loadId: 'H028', driverId: 'DRV-015', lane: { origin: 'Phoenix', destination: 'San Diego' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.sanDiego, estimatedCostPerMile: 1.75, actualCostPerMile: 1.77, totalMiles: 355, deadheadMiles: 8, fuelCost: 232, revenue: 1420, driverPay: 195, arrivalTime: daysAgo(5), appointmentTime: daysAgo(5), deliveredAt: daysAgo(4), detentionMinutes: 15, completedAt: daysAgo(4) },
  { id: 'TRIP-029', loadId: 'H029', driverId: 'DRV-015', lane: { origin: 'San Diego', destination: 'Los Angeles' }, pickup: LOCATIONS.sanDiego, dropoff: LOCATIONS.losAngeles, estimatedCostPerMile: 1.73, actualCostPerMile: 1.75, totalMiles: 120, deadheadMiles: 3, fuelCost: 78, revenue: 420, driverPay: 66, arrivalTime: daysAgo(4), appointmentTime: daysAgo(4), deliveredAt: daysAgo(3.5), detentionMinutes: 0, completedAt: daysAgo(3.5) },

  // Patricia Johnson (DRV-011) - Tanker specialist
  { id: 'TRIP-030', loadId: 'H030', driverId: 'DRV-011', lane: { origin: 'Phoenix', destination: 'Tucson' }, pickup: LOCATIONS.phoenix, dropoff: LOCATIONS.tucson, estimatedCostPerMile: 2.03, actualCostPerMile: 2.05, totalMiles: 130, deadheadMiles: 6, fuelCost: 78, revenue: 520, driverPay: 71, arrivalTime: daysAgo(4), appointmentTime: daysAgo(4), deliveredAt: daysAgo(4), detentionMinutes: 0, completedAt: daysAgo(4) },
];


// ─── Fuel Receipts: Detailed Cost Tracking ────────────────────────────────────
export const seedFuelReceipts = [
  // Carlos Rivera (DRV-001)
  { id: 'FUEL-001', driverId: 'DRV-001', tripId: 'TRIP-001', amount: 445, gallons: 115, pricePerGallon: 3.87, location: { lat: 35.50, lng: -97.51, city: 'Oklahoma City, OK', stationName: 'Pilot Travel Center' }, timestamp: daysAgo(9.5) },
  { id: 'FUEL-002', driverId: 'DRV-001', tripId: 'TRIP-001', amount: 235, gallons: 60, pricePerGallon: 3.92, location: { lat: 32.77, lng: -96.80, city: 'Dallas, TX', stationName: 'Love\'s Travel Stop' }, timestamp: daysAgo(9) },
  { id: 'FUEL-003', driverId: 'DRV-001', tripId: 'TRIP-002', amount: 428, gallons: 110, pricePerGallon: 3.89, location: { lat: 32.77, lng: -96.80, city: 'Dallas, TX', stationName: 'Flying J' }, timestamp: daysAgo(6.5) },
  { id: 'FUEL-004', driverId: 'DRV-001', tripId: 'TRIP-003', amount: 155, gallons: 40, pricePerGallon: 3.88, location: { lat: 34.05, lng: -118.24, city: 'Los Angeles, CA', stationName: 'Pilot Travel Center' }, timestamp: daysAgo(3) },
  
  // Sarah Chen (DRV-002)
  { id: 'FUEL-005', driverId: 'DRV-002', tripId: 'TRIP-005', amount: 192, gallons: 50, pricePerGallon: 3.84, location: { lat: 32.72, lng: -117.16, city: 'San Diego, CA', stationName: 'Love\'s Travel Stop' }, timestamp: daysAgo(8) },
  { id: 'FUEL-006', driverId: 'DRV-002', tripId: 'TRIP-006', amount: 62, gallons: 16, pricePerGallon: 3.88, location: { lat: 34.05, lng: -118.24, city: 'Los Angeles, CA', stationName: 'TA Petro' }, timestamp: daysAgo(7) },
  { id: 'FUEL-007', driverId: 'DRV-002', tripId: 'TRIP-007', amount: 162, gallons: 42, pricePerGallon: 3.86, location: { lat: 34.05, lng: -118.24, city: 'Los Angeles, CA', stationName: 'Pilot' }, timestamp: daysAgo(3.5) },
  
  // James Wilson (DRV-006)
  { id: 'FUEL-008', driverId: 'DRV-006', tripId: 'TRIP-013', amount: 158, gallons: 41, pricePerGallon: 3.85, location: { lat: 36.17, lng: -115.14, city: 'Las Vegas, NV', stationName: 'Love\'s Travel Stop' }, timestamp: daysAgo(8.5) },
  { id: 'FUEL-009', driverId: 'DRV-006', tripId: 'TRIP-014', amount: 218, gallons: 58, pricePerGallon: 3.76, location: { lat: 40.76, lng: -111.89, city: 'Salt Lake City, UT', stationName: 'Pilot Travel Center' }, timestamp: daysAgo(6.5) },
  { id: 'FUEL-010', driverId: 'DRV-006', tripId: 'TRIP-015', amount: 248, gallons: 65, pricePerGallon: 3.82, location: { lat: 39.74, lng: -104.99, city: 'Denver, CO', stationName: 'Flying J' }, timestamp: daysAgo(3) },
  
  // Linda Davis (DRV-003)
  { id: 'FUEL-011', driverId: 'DRV-003', tripId: 'TRIP-009', amount: 265, gallons: 70, pricePerGallon: 3.79, location: { lat: 39.74, lng: -104.99, city: 'Denver, CO', stationName: 'Pilot Travel Center' }, timestamp: daysAgo(11) },
  { id: 'FUEL-012', driverId: 'DRV-003', tripId: 'TRIP-010', amount: 232, gallons: 62, pricePerGallon: 3.74, location: { lat: 40.76, lng: -111.89, city: 'Salt Lake City, UT', stationName: 'Love\'s Travel Stop' }, timestamp: daysAgo(9) },
  
  // Antonio Garcia (DRV-014)
  { id: 'FUEL-013', driverId: 'DRV-014', tripId: 'TRIP-019', amount: 65, gallons: 17, pricePerGallon: 3.82, location: { lat: 32.22, lng: -110.97, city: 'Tucson, AZ', stationName: 'Pilot' }, timestamp: daysAgo(8) },
  { id: 'FUEL-014', driverId: 'DRV-014', tripId: 'TRIP-020', amount: 152, gallons: 40, pricePerGallon: 3.80, location: { lat: 31.76, lng: -106.49, city: 'El Paso, TX', stationName: 'Love\'s Travel Stop' }, timestamp: daysAgo(5) },
  
  // David Johnson (DRV-010)
  { id: 'FUEL-015', driverId: 'DRV-010', tripId: 'TRIP-022', amount: 62, gallons: 16, pricePerGallon: 3.88, location: { lat: 32.22, lng: -110.97, city: 'Tucson, AZ', stationName: 'TA Petro' }, timestamp: daysAgo(7) },
  { id: 'FUEL-016', driverId: 'DRV-010', tripId: 'TRIP-023', amount: 358, gallons: 95, pricePerGallon: 3.77, location: { lat: 35.09, lng: -106.65, city: 'Albuquerque, NM', stationName: 'Pilot Travel Center' }, timestamp: daysAgo(2.5) },
  
  // Susan Anderson (DRV-016)
  { id: 'FUEL-017', driverId: 'DRV-016', tripId: 'TRIP-024', amount: 410, gallons: 108, pricePerGallon: 3.80, location: { lat: 37.80, lng: -122.27, city: 'Oakland, CA', stationName: 'Love\'s Travel Stop' }, timestamp: daysAgo(8) },
  { id: 'FUEL-018', driverId: 'DRV-016', tripId: 'TRIP-025', amount: 162, gallons: 42, pricePerGallon: 3.86, location: { lat: 34.05, lng: -118.24, city: 'Los Angeles, CA', stationName: 'Pilot' }, timestamp: daysAgo(7) },
  
  // George Williams (DRV-017)
  { id: 'FUEL-019', driverId: 'DRV-017', tripId: 'TRIP-026', amount: 545, gallons: 142, pricePerGallon: 3.84, location: { lat: 29.76, lng: -95.37, city: 'Houston, TX', stationName: 'Flying J' }, timestamp: daysAgo(10) },
  { id: 'FUEL-020', driverId: 'DRV-017', tripId: 'TRIP-027', amount: 102, gallons: 27, pricePerGallon: 3.78, location: { lat: 32.78, lng: -96.80, city: 'Dallas, TX', stationName: 'Pilot Travel Center' }, timestamp: daysAgo(10.5) },
];


// ─── Load Board: Backhaul & Future Opportunities ───────────────────────────────
export const seedLoadBoard = [
  // High-value backhauls
  { id: 'LB-001', pickup: { ...LOCATIONS.dallas, address: '2000 Commerce St' }, dropoff: { ...LOCATIONS.sanAntonio, address: '100 Military Plaza' }, estimatedDistance: 275, estimatedDuration: 5, weight: 30000, type: 'dry_van', rate: 825, ratePerMile: 3.00, availableFrom: hoursAgo(-2), expiresAt: hoursAgo(-48), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },
  { id: 'LB-002', pickup: { ...LOCATIONS.losAngeles, address: '300 S Santa Fe Ave' }, dropoff: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, estimatedDistance: 370, estimatedDuration: 6, weight: 26000, type: 'reefer', rate: 1250, ratePerMile: 3.38, availableFrom: hoursAgo(-1), expiresAt: hoursAgo(-36), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },
  { id: 'LB-003', pickup: { ...LOCATIONS.denver, address: '1600 Arapahoe St' }, dropoff: { ...LOCATIONS.phoenix, address: '3300 S 16th St' }, estimatedDistance: 800, estimatedDuration: 12, weight: 38000, type: 'dry_van', rate: 2240, ratePerMile: 2.80, availableFrom: hoursAgo(-3), expiresAt: hoursAgo(-48), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },
  { id: 'LB-004', pickup: { ...LOCATIONS.houston, address: '1200 Smith St' }, dropoff: { ...LOCATIONS.dallas, address: '1500 Marilla St' }, estimatedDistance: 240, estimatedDuration: 4, weight: 32000, type: 'dry_van', rate: 720, ratePerMile: 3.00, availableFrom: hoursAgo(-2.5), expiresAt: hoursAgo(-40), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },
  { id: 'LB-005', pickup: { ...LOCATIONS.sanDiego, address: '2889 Pacific Coast Hwy' }, dropoff: { ...LOCATIONS.losAngeles, address: '800 E Olympic Blvd' }, estimatedDistance: 140, estimatedDuration: 2.5, weight: 28000, type: 'reefer', rate: 490, ratePerMile: 3.50, availableFrom: hoursAgo(-0.5), expiresAt: hoursAgo(-24), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },

  // Medium-value regional
  { id: 'LB-006', pickup: { ...LOCATIONS.tucson, address: '3800 S Palo Verde Rd' }, dropoff: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, estimatedDistance: 120, estimatedDuration: 2, weight: 22000, type: 'dry_van', rate: 420, ratePerMile: 3.50, availableFrom: hoursAgo(-1.5), expiresAt: hoursAgo(-12), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },
  { id: 'LB-007', pickup: { ...LOCATIONS.lasVegas, address: '6155 Boulder Hwy' }, dropoff: { ...LOCATIONS.phoenix, address: '3300 S 16th St' }, estimatedDistance: 300, estimatedDuration: 5, weight: 34000, type: 'flatbed', rate: 1050, ratePerMile: 3.50, availableFrom: hoursAgo(-2), expiresAt: hoursAgo(-32), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },
  { id: 'LB-008', pickup: { ...LOCATIONS.albuquerque, address: '100 Central Ave SE' }, dropoff: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, estimatedDistance: 480, estimatedDuration: 8, weight: 36000, type: 'dry_van', rate: 1440, ratePerMile: 3.00, availableFrom: hoursAgo(-1.5), expiresAt: hoursAgo(-28), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },

  // Long-haul opportunities
  { id: 'LB-009', pickup: { ...LOCATIONS.fresno, address: '1100 Van Ness Ave' }, dropoff: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, estimatedDistance: 510, estimatedDuration: 8, weight: 34000, type: 'dry_van', rate: 1530, ratePerMile: 3.00, availableFrom: hoursAgo(-4), expiresAt: hoursAgo(-52), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },
  { id: 'LB-010', pickup: { ...LOCATIONS.saltLakeCity, address: '300 S Rio Grande St' }, dropoff: { ...LOCATIONS.phoenix, address: '3300 S 16th St' }, estimatedDistance: 650, estimatedDuration: 10, weight: 40000, type: 'flatbed', rate: 1950, ratePerMile: 3.00, availableFrom: hoursAgo(-3), expiresAt: hoursAgo(-44), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },
  { id: 'LB-011', pickup: { ...LOCATIONS.austin, address: '600 Congress Ave' }, dropoff: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, estimatedDistance: 1100, estimatedDuration: 17, weight: 38000, type: 'reefer', rate: 3300, ratePerMile: 3.00, availableFrom: hoursAgo(-5), expiresAt: hoursAgo(-60), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },

  // Specialty loads
  { id: 'LB-012', pickup: { ...LOCATIONS.phoenix, address: '4200 N 27th Ave' }, dropoff: { ...LOCATIONS.denver, address: '1600 Arapahoe St' }, estimatedDistance: 840, estimatedDuration: 13, weight: 38000, type: 'tanker', rate: 2940, ratePerMile: 3.50, availableFrom: hoursAgo(-2), expiresAt: hoursAgo(-40), specialRequirements: { hazmat: true, oversize: false, teamDriver: false } },
  { id: 'LB-013', pickup: { ...LOCATIONS.phoenix, address: '2400 W Camelback Rd' }, dropoff: { ...LOCATIONS.seattle, address: '303 S Jackson St' }, estimatedDistance: 1540, estimatedDuration: 24, weight: 40000, type: 'dry_van', rate: 4200, ratePerMile: 2.73, availableFrom: hoursAgo(-6), expiresAt: hoursAgo(-80), specialRequirements: { hazmat: false, oversize: false, teamDriver: true } },
  { id: 'LB-014', pickup: { ...LOCATIONS.losAngeles, address: '800 Alameda St' }, dropoff: { ...LOCATIONS.portland, address: '505 SW Morrison St' }, estimatedDistance: 635, estimatedDuration: 10, weight: 36000, type: 'dry_van', rate: 1905, ratePerMile: 3.00, availableFrom: hoursAgo(-4), expiresAt: hoursAgo(-56), specialRequirements: { hazmat: false, oversize: false, teamDriver: false } },
];
