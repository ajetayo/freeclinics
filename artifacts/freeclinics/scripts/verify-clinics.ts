import {
  getAllClinics,
  getClinicsByCityState,
  getClinicBySlug,
} from '../src/lib/clinics';

const all = getAllClinics();
console.log('Total clinic count:', all.length);

const distinctStates = new Set(all.map((c) => c.stateSlug));
console.log('Distinct stateSlug values:', distinctStates.size);

const portland = getClinicsByCityState('oregon', 'portland');
console.log("\ngetClinicsByCityState('oregon', 'portland') count:", portland.length);
for (const c of portland) {
  console.log(' -', c.name);
}

console.log('\nSample record (first clinic in dataset):');
console.log(JSON.stringify(all[0], null, 2));

console.log('\ngetClinicBySlug round-trip on all[0].slug:',
  getClinicBySlug(all[0].slug)?.name === all[0].name ? 'OK' : 'FAIL');
