/**
 * institutionContext.js
 *
 * Plain module-level variable — no React, no Zustand.
 * AuthContext writes to this on every user change.
 * axiosConfig reads from this synchronously inside the request interceptor.
 *
 * This is the bridge between React's reactive world and axios's non-reactive
 * interceptor world, replacing the cold localStorage read that caused
 * x-institution-type to be stale after a context switch.
 */

let _institutionType = 'PRIMARY_CBC';

export const setInstitutionType = (type) => {
  _institutionType = type || 'PRIMARY_CBC';
};

export const getInstitutionType = () => _institutionType;
