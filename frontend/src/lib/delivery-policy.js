// Server-side delivery policy. Never expose the dispatch street address to clients.
// The PIN identifies the dispatch area; precise road routing requires a private origin.
export const DISPATCH_PINCODE = process.env.ESTATE_TEA_DISPATCH_PINCODE || '560007';
export const LOCAL_DELIVERY_LIMIT_KM = 12;
export const LOCAL_DELIVERY_BANDS = Object.freeze([
  { maxKm: 3, feeInr: 15 },
  { maxKm: 6, feeInr: 25 },
  { maxKm: 10, feeInr: 35 },
  { maxKm: 12, feeInr: 45 },
]);
export function getLocalDeliveryFee(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return null;
  return LOCAL_DELIVERY_BANDS.find(band => distanceKm <= band.maxKm)?.feeInr ?? null;
}
// A destination PIN alone is insufficient for reliable road-distance calculation.
// Do not bill a distance-based fee until a validated server-side route is available.
