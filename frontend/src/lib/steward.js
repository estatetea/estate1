// One Steward base URL for admin listing, delivery updates and Brew lookup, so all read the same order record.
export const STEWARD_URL = (process.env.STEWARD_URL || process.env.STEWARD_RENDER_URL || 'https://estate-tea-steward.onrender.com').replace(/\/$/, '');
