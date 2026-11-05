import React, { useState, useRef, useEffect } from 'react';
import './ImageWithLoader.css';

/**
 * ImageWithLoader
 * Smooth image loader component featuring:
 * - Animated dark shimmer skeleton while loading
 * - Centered glowing spinner with Nitroxx crimson accent
 * - Seamless fade-in and scale-in transition when loaded
 * - Instant display if image is already cached in browser
 * - Graceful error fallback
 */
export default function ImageWithLoader({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  loading = 'lazy',
  decoding = 'async',
  fallbackSrc = '',
  showSpinner = true,
  size = 'normal', // 'normal' | 'small' | 'large'
  style = {},
  imgStyle = {},
  onClick,
  priority = false,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Fast check: if the image is already cached and loaded by the browser
  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    setHasError(false);
    setIsLoaded(false);

    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (props.onLoad) props.onLoad(e);
  };

  const handleError = (e) => {
    if (fallbackSrc && src !== fallbackSrc) {
      // try fallback if provided
      if (imgRef.current) {
        imgRef.current.src = fallbackSrc;
      }
    } else {
      setHasError(true);
      setIsLoaded(true);
    }
    if (props.onError) props.onError(e);
  };

  const sizeClass = size === 'small' ? 'nx-img-loader-wrap--small' : size === 'large' ? 'nx-img-loader-wrap--large' : '';

  return (
    <div
      className={`nx-img-loader-wrap ${sizeClass} ${containerClassName} ${isLoaded ? 'is-loaded' : 'is-loading'}`}
      style={style}
      onClick={onClick}
    >
      {/* Skeleton Shimmer & Spinner overlay */}
      <div className={`nx-img-skeleton ${isLoaded ? 'is-hidden' : ''}`} aria-hidden="true">
        <div className="nx-img-shimmer" />
        {/* {showSpinner && (
          <div className="nx-img-spinner-box">
            <div className="nx-img-spinner" />
          </div>
        )} */}
      </div>

      {/* Error state */}
      {hasError ? (
        <div className="nx-img-error" role="img" aria-label={alt || 'Image unavailable'}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>No image</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`nx-img-elem ${className} ${isLoaded ? 'nx-img--visible' : ''}`}
          loading={priority ? 'eager' : loading}
          decoding={decoding}
          onLoad={handleLoad}
          onError={handleError}
          style={imgStyle}
          {...props}
        />
      )}
    </div>
  );
}

