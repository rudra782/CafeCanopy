import { useState } from 'react';

function canCreateWebGLContext() {
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return Boolean(context);
  } catch {
    return false;
  }
}

export function useWebGLSupport() {
  const [supported] = useState(canCreateWebGLContext);

  return supported;
}
