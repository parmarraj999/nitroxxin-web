import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Automatically resets the scroll position to the top of the page
 * whenever the user navigates to a new route.
 */
const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Disable browser's automatic scroll restoration on SPA navigation
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // If there is an anchor hash (e.g. #section), try scrolling to it
    if (hash) {
      const targetElement = document.querySelector(hash);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    const resetScroll = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (e) {
        window.scrollTo(0, 0);
      }

      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }

      // Also reset any scrollable layout containers if present
      const containers = document.querySelectorAll(
        '.app-container, .nx-profile-content, .nx-profile-layout'
      );
      containers.forEach((el) => {
        if (el) {
          el.scrollTop = 0;
        }
      });
    };

    // Immediate reset
    resetScroll();

    // Follow-up reset on the next frame to catch any React route render or layout shift
    const frameId = requestAnimationFrame(() => {
      resetScroll();
    });

    return () => cancelAnimationFrame(frameId);
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;
