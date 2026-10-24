import React, { useState, useEffect, useRef, useCallback } from "react";
import "./ImageAdjustModal.css";

const PREVIEW_SIZE = 300;
const EXPORT_SIZE = 512;

export default function ImageAdjustModal({
  isOpen,
  imageSrc,
  onApply,
  onCancel,
  title = "Adjust Profile Photo",
}) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchStartDistRef = useRef(null);
  const zoomStartRef = useRef(1);
  

  // Load image whenever imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    setIsLoaded(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setIsLoaded(true);
    };
    img.onerror = (err) => {
      console.error("Failed to load image into adjuster:", err);
      // Fallback try without crossOrigin if tainted
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        imageRef.current = fallbackImg;
        setIsLoaded(true);
      };
      fallbackImg.src = imageSrc;
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Draw preview onto the interactive canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !isLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = PREVIEW_SIZE;
    canvas.height = PREVIEW_SIZE;

    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    const isFlipped = rotation === 90 || rotation === 270;
    const effW = isFlipped ? img.naturalHeight : img.naturalWidth;
    const effH = isFlipped ? img.naturalWidth : img.naturalHeight;

    const baseScale = Math.max(PREVIEW_SIZE / effW, PREVIEW_SIZE / effH);
    const totalScale = baseScale * zoom;

    ctx.save();
    // Center of canvas + pan
    ctx.translate(PREVIEW_SIZE / 2 + pan.x, PREVIEW_SIZE / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);

    const drawW = img.naturalWidth * totalScale;
    const drawH = img.naturalHeight * totalScale;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [isLoaded, zoom, pan, rotation]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch drag & pinch handlers
  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
      pinchStartDistRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      pinchStartDistRef.current = getTouchDist(e.touches);
      zoomStartRef.current = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    } else if (e.touches.length === 2 && pinchStartDistRef.current) {
      const currentDist = getTouchDist(e.touches);
      const ratio = currentDist / pinchStartDistRef.current;
      const nextZoom = Math.min(3, Math.max(1, zoomStartRef.current * ratio));
      setZoom(Number(nextZoom.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    pinchStartDistRef.current = null;
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3, Math.max(1, Number((prev + delta).toFixed(2)))));
  };

  // Zoom controls
  const handleZoomChange = (e) => {
    setZoom(parseFloat(e.target.value));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(1, Number((prev - 0.15).toFixed(2))));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Apply crop & export high-resolution canvas
  const handleApply = () => {
    const img = imageRef.current;
    if (!img) return;

    try {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = EXPORT_SIZE;
      exportCanvas.height = EXPORT_SIZE;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      const isFlipped = rotation === 90 || rotation === 270;
      const effW = isFlipped ? img.naturalHeight : img.naturalWidth;
      const effH = isFlipped ? img.naturalWidth : img.naturalHeight;

      const ratio = EXPORT_SIZE / PREVIEW_SIZE;
      const baseScale = Math.max(PREVIEW_SIZE / effW, PREVIEW_SIZE / effH);
      const exportScale = baseScale * zoom * ratio;

      const exportPanX = pan.x * ratio;
      const exportPanY = pan.y * ratio;

      ctx.save();
      ctx.translate(EXPORT_SIZE / 2 + exportPanX, EXPORT_SIZE / 2 + exportPanY);
      ctx.rotate((rotation * Math.PI) / 180);

      const drawW = img.naturalWidth * exportScale;
      const drawH = img.naturalHeight * exportScale;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      exportCanvas.toBlob(
        (blob) => {
          let dataUrl = "";
          try {
            dataUrl = exportCanvas.toDataURL("image/jpeg", 0.92);
          } catch (e) {
            console.warn("Could not generate dataURL (tainted canvas), using blob URL:", e);
            if (blob) dataUrl = URL.createObjectURL(blob);
          }
          onApply(blob, dataUrl);
        },
        "image/jpeg",
        0.92
      );
    } catch (err) {
      console.error("Error generating cropped image:", err);
      // Fallback
      onApply(null, imageSrc);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="nx-adjust-backdrop" onClick={onCancel}>
      <div className="nx-adjust-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="nx-adjust-header">
          <div className="nx-adjust-title-group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2v14a2 2 0 0 0 2 2h14" />
              <path d="M18 22V8a2 2 0 0 0-2-2H2" />
            </svg>
            <h3 className="nx-adjust-title">{title}</h3>
          </div>
          <button
            type="button"
            className="nx-adjust-close-btn"
            onClick={onCancel}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Viewport Area */}
        <div className="nx-adjust-viewport-wrap">
          <div
            className="nx-adjust-viewport"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <canvas ref={canvasRef} className="nx-adjust-canvas" />

            {/* Circular Crop Guide Mask */}
            <div className="nx-adjust-crop-mask">
              <div className="nx-adjust-grid">
                <div className="nx-adjust-grid-line nx-grid-v1" />
                <div className="nx-adjust-grid-line nx-grid-v2" />
                <div className="nx-adjust-grid-line nx-grid-h1" />
                <div className="nx-adjust-grid-line nx-grid-h2" />
              </div>
            </div>

            {!isLoaded && (
              <div className="nx-adjust-loading-overlay">
                <div className="nx-btn-mini-spinner" />
                <span>Loading image...</span>
              </div>
            )}
          </div>
          <span className="nx-adjust-hint">Drag to reposition &bull; Scroll or pinch to zoom</span>
        </div>

        {/* Zoom Slider & Controls */}
        <div className="nx-adjust-controls">
          <div className="nx-adjust-slider-row">
            <button
              type="button"
              className="nx-adjust-tool-btn"
              onClick={handleZoomOut}
              title="Zoom out"
              disabled={zoom <= 1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.02"
              value={zoom}
              onChange={handleZoomChange}
              className="nx-adjust-slider"
              aria-label="Zoom"
            />

            <button
              type="button"
              className="nx-adjust-tool-btn"
              onClick={handleZoomIn}
              title="Zoom in"
              disabled={zoom >= 3}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>

            <span className="nx-adjust-zoom-val">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="nx-adjust-actions-row">
            <button
              type="button"
              className="nx-adjust-secondary-btn"
              onClick={handleRotate}
              title="Rotate 90 degrees"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Rotate
            </button>

            <button
              type="button"
              className="nx-adjust-secondary-btn"
              onClick={handleReset}
              title="Reset position and zoom"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="nx-adjust-footer">
          <button
            type="button"
            className="nx-adjust-btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="nx-adjust-btn-apply"
            onClick={handleApply}
            disabled={!isLoaded}
          >
            Apply &amp; Set Photo
          </button>
        </div>
      </div>
    </div>
  );
}
