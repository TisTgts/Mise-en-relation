import { isProductionBuild } from '../config/security';

/** Désactive les logs sensibles en build de production. */
export function initAppSecurity() {
  if (!isProductionBuild()) return;

  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.warn = noop;
}
