import { useEffect } from 'react';

/** Met à jour `document.title` à chaque changement de vue (cahier des charges, section 8). */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} — Jigi Dons`;
  }, [title]);
}
