// En production, neutralise les logs de debug pour éviter d'exposer des
// informations dans la console du navigateur. Les erreurs (console.error)
// restent actives pour permettre le diagnostic des incidents réels.
const silenceDebugConsoleInProduction = () => {
  if (process.env.NODE_ENV !== 'production') return;
  const noop = () => {};
  ['log', 'debug', 'info', 'warn'].forEach((method) => {
    if (typeof console[method] === 'function') {
      console[method] = noop;
    }
  });
};

silenceDebugConsoleInProduction();

export default silenceDebugConsoleInProduction;
