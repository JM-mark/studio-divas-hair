/** Prefix a site-relative path with the configured base ('/studio-divas-hair/'). withBase('') is the home URL. */
export const withBase = (path = ''): string => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
};
