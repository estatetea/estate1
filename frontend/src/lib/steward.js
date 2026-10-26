// One Steward/Ledger base URL per service for admin listing, delivery updates and Brew lookup, so all read the same order record.
export const STEWARD_URL = (process.env.STEWARD_URL || process.env.STEWARD_RENDER_URL || 'https://estate-tea-steward.onrender.com').replace(/\/$/, '');
export const LEDGER_URL = (process.env.LEDGER_URL || 'https://estate-tea-ledger.onrender.com').replace(/\/$/, '');
