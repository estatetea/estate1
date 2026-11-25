// The Estate Tea logo. For Christmas (until 6 Jan 2027) the owner's logo with a Santa hat, everywhere: the website, the
// owner's web app and the team app. After the season the usual logo comes back by itself (on the next deploy).
export const SEASON_END = '2027-01-06';
export const isChristmas = () => { try { return new Date() <= new Date(SEASON_END + 'T23:59:59+05:30'); } catch { return false; } };
export const LOGO_DEFAULT = 'https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png';
export const LOGO_XMAS = '/images/brand/logo-xmas-mark.png';
export const LOGO = isChristmas() ? LOGO_XMAS : LOGO_DEFAULT;
