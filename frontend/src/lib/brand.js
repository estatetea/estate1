// The Estate Tea logo. For Christmas (until 6 Jan 2027) the owner's logo with a Santa hat, everywhere: the website, the
// owner's web app and the team app. After the season the usual logo comes back by itself (on the next deploy).
export const SEASON_END = '2027-01-06';
export const isChristmas = () => { try { return new Date() <= new Date(SEASON_END + 'T23:59:59+05:30'); } catch { return false; } };
export const LOGO_DEFAULT = 'https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png';
export const LOGO_XMAS = '/images/brand/logo-xmas-mark.png';
export const LOGO = isChristmas() ? LOGO_XMAS : LOGO_DEFAULT;

// The cake and the cookies are shown at their price before GST ("GST excluded"; the owner, 25 Nov). Christmas Spirit keeps
// its GST-inclusive price. The amount charged is the same either way: GST is added on the order.
export const EX_GST_ITEMS = new Set(['christmas-cookies', 'plum-cake']);
export const exGst = it => EX_GST_ITEMS.has(it?.product_id || it?.id);
export const shownPrice = it => exGst(it) ? Math.round(Number(it.price) / (1 + Number(it.gst_rate || 0.18)) * 100) / 100 : Number(it.price);
