import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ConfirmContext = createContext(() => Promise.resolve(false));

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [options, setOptions] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((opts = {}) => {
    const normalized = typeof opts === 'string' ? { message: opts } : opts;
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setOptions(normalized);
    });
  }, []);

  const close = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setOptions(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        open={!!options}
        title={options?.title}
        message={options?.message}
        details={options?.details}
        confirmLabel={options?.confirmLabel}
        cancelLabel={options?.cancelLabel}
        tone={options?.tone}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
};

export default ConfirmContext;
