export const APP_NAME = 'AppName';
export const APP_TAGLINE = 'Mise en relation de services';
export const APP_CONTACT_EMAIL = 'contact@appname.bf';

/** Initiales dérivées du nom (ex. AppName → AN). Surchargez si besoin. */
export const APP_INITIALS = (() => {
  const caps = APP_NAME.match(/[A-Z]/g);
  if (caps && caps.length >= 2) return caps.slice(0, 2).join('');
  if (caps?.length === 1) return caps[0];
  return APP_NAME.slice(0, 2).toUpperCase();
})();
