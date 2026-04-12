import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scrolls the main content area back to the top on every route change. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Scroll the window and any overflow container back to top
    window.scrollTo(0, 0);
    document.querySelector('[role="main"]')?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
