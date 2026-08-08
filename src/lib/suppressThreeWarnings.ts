if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('THREE.Clock: This module has been deprecated')
    ) {
      return; // Suppress upstream R3F Clock deprecation warning
    }
    originalWarn.apply(console, args);
  };
}