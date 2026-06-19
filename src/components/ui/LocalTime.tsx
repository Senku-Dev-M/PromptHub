'use client';

import React, { useState, useEffect } from 'react';

interface LocalTimeProps {
  date: string | Date;
  format?: 'short' | 'long';
}

export default function LocalTime({ date, format = 'long' }: LocalTimeProps) {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = format === 'long' 
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
      
    setFormatted(new Date(date).toLocaleDateString('es-ES', options));
  }, [date, format]);

  // Fallback to UTC date during server rendering to avoid hydration mismatch
  const utcOptions: Intl.DateTimeFormatOptions = format === 'long'
    ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };

  const fallback = new Date(date).toLocaleDateString('es-ES', utcOptions);

  return <>{formatted || fallback}</>;
}
