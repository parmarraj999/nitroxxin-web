import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useEventsContext } from '../../context/EventsContext';
import { useForYouContext } from '../../context/ForYouContext';
import { useAccessoriesContext } from '../../context/AccessoriesContext';
import { useAuth } from '../../context/AuthContext';
import './ScreenLoader.css';

export default function ScreenLoader() {
  const location = useLocation();
  const { pathname } = location;

  const { eventsLoading, events } = useEventsContext();
  const { layoutLoading, banners, combos } = useForYouContext();
  const { productsLoading, products } = useAccessoriesContext();
  const { loading: authLoading } = useAuth();

  const [isDone, setIsDone] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const startTimeRef = useRef(Date.now());
  const isTriggeredRef = useRef(false);

  useEffect(() => {
    if (isTriggeredRef.current) return;

    const MIN_DISPLAY_MS = 600;
    const MAX_TIMEOUT_MS = 2500;

    // Check if the current opened page's data is ready
    const checkDataLoaded = () => {
      // 1. Home / For You page
      if (pathname === '/' || pathname === '') {
        const hasForYou = !layoutLoading || (banners && banners.length > 0) || (combos && combos.length > 0);
        const hasEvents = !eventsLoading || (events && events.length > 0);
        return hasForYou && hasEvents;
      }

      // 2. Events browse or detail routes
      if (pathname.startsWith('/event') || pathname.startsWith('/all-events')) {
        return !eventsLoading || (events && events.length > 0);
      }

      // 3. Marketplace / Accessories routes
      if (
        pathname.startsWith('/accessories') ||
        pathname.startsWith('/shop') ||
        pathname.startsWith('/category') ||
        pathname.startsWith('/brand') ||
        pathname.startsWith('/product')
      ) {
        return !productsLoading || (products && products.length > 0);
      }

      // 4. Other pages (privacy, profile, cart, etc.)
      return !authLoading;
    };

    const completeLoader = () => {
      if (isTriggeredRef.current) return;
      isTriggeredRef.current = true;

      const elapsed = Date.now() - startTimeRef.current;
      const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);

      setTimeout(() => {
        setIsFading(true);
        setTimeout(() => {
          setIsDone(true);
        }, 450);
      }, delay);
    };

    // If data is already loaded or when it becomes loaded
    if (checkDataLoaded()) {
      completeLoader();
      return;
    }

    // Interval to poll context states until ready
    const interval = setInterval(() => {
      if (checkDataLoaded()) {
        clearInterval(interval);
        completeLoader();
      }
    }, 50);

    // Safety timeout: ensure loader never blocks user even if network/Firestore hangs
    const maxTimer = setTimeout(() => {
      clearInterval(interval);
      completeLoader();
    }, MAX_TIMEOUT_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(maxTimer);
    };
  }, [
    pathname,
    eventsLoading,
    events,
    layoutLoading,
    banners,
    combos,
    productsLoading,
    products,
    authLoading,
  ]);

  if (isDone || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`screen-loader-overlay${isFading ? ' screen-loader--fade-out' : ''}`}
      aria-label="Loading application"
    >
      <div className="screen-loader-container">
        <div className="screen-loader-logo-wrapper">
          <img
            src="/assets/image/loader-logo.png"
            alt="Nitroxx"
            className="screen-loader-logo"
            onError={(e) => {
              // Fallback to assets/images if assets/image isn't served
              e.currentTarget.src = '/assets/images/loader-logo.png';
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
