import React, { useEffect, useRef } from 'react';
import type { Photo, Arrow, Circle, TextAnnotation } from '../../types/inspection';

interface PhotoViewerProps {
  photo: Photo;
  className?: string;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ photo, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const drawAnnotations = () => {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      const container = containerRef.current;

      console.log('[PhotoViewer] drawAnnotations called', {
        canvas: !!canvas,
        image: !!image,
        imageComplete: image?.complete,
        container: !!container,
        photoUrl: photo.url,
        hasAnnotations: !!photo.annotations
      });

      if (!canvas || !image || !container || !image.complete) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Match canvas dimensions to displayed image size (not natural size)
      const rect = image.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      console.log('[PhotoViewer] Image rect:', {
        width: rect.width,
        height: rect.height,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        left: rect.left,
        top: rect.top
      });

      console.log('[PhotoViewer] Container rect:', {
        width: containerRect.width,
        height: containerRect.height,
        left: containerRect.left,
        top: containerRect.top
      });

      // If rect is invalid, don't set canvas dimensions
      if (rect.width === 0 || rect.height === 0) {
        console.log('[PhotoViewer] Invalid rect dimensions, skipping');
        return;
      }

      canvas.width = rect.width;
      canvas.height = rect.height;

      // Position canvas to match image position within container
      const leftOffset = rect.left - containerRect.left;
      const topOffset = rect.top - containerRect.top;
      canvas.style.left = `${leftOffset}px`;
      canvas.style.top = `${topOffset}px`;

      console.log('[PhotoViewer] Canvas dimensions set to:', canvas.width, 'x', canvas.height);
      console.log('[PhotoViewer] Canvas position:', { left: leftOffset, top: topOffset });

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only draw if there are annotations
      if (!photo.annotations) {
        console.log('[PhotoViewer] No annotations to draw');
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      console.log('[PhotoViewer] Drawing annotations:', {
        arrows: photo.annotations.arrows.length,
        circles: photo.annotations.circles.length,
        text: photo.annotations.text.length
      });

      // Draw arrows
      photo.annotations.arrows.forEach((arrow) => {
        drawArrow(ctx, arrow, width, height);
      });

      // Draw circles
      photo.annotations.circles.forEach((circle) => {
        drawCircle(ctx, circle, width, height);
      });

      // Draw text
      photo.annotations.text.forEach((text) => {
        drawText(ctx, text, width, height);
      });
    };

    // Draw on image load
    const image = imageRef.current;
    if (image) {
      const onLoad = () => {
        // Give the browser time to render the image
        setTimeout(drawAnnotations, 100);
      };

      if (image.complete && image.naturalWidth > 0) {
        // Image is already loaded
        onLoad();
      } else {
        image.addEventListener('load', onLoad);
        return () => image.removeEventListener('load', onLoad);
      }
    }

    // Redraw on window resize
    window.addEventListener('resize', drawAnnotations);
    return () => window.removeEventListener('resize', drawAnnotations);
  }, [photo.annotations, photo.url]);

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    arrow: Arrow,
    width: number,
    height: number
  ) => {
    const startX = (arrow.startX / 100) * width;
    const startY = (arrow.startY / 100) * height;
    const endX = (arrow.endX / 100) * width;
    const endY = (arrow.endY / 100) * height;

    ctx.strokeStyle = arrow.color;
    ctx.fillStyle = arrow.color;
    ctx.lineWidth = arrow.width || 3;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowLength = 20;

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle - Math.PI / 6),
      endY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle + Math.PI / 6),
      endY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  const drawCircle = (
    ctx: CanvasRenderingContext2D,
    circle: Circle,
    width: number,
    height: number
  ) => {
    const x = (circle.x / 100) * width;
    const y = (circle.y / 100) * height;
    const radius = (circle.radius / 100) * Math.min(width, height);

    ctx.strokeStyle = circle.color;
    ctx.lineWidth = circle.width || 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawText = (
    ctx: CanvasRenderingContext2D,
    textAnnotation: TextAnnotation,
    width: number,
    height: number
  ) => {
    const x = (textAnnotation.x / 100) * width;
    const y = (textAnnotation.y / 100) * height;

    ctx.fillStyle = textAnnotation.color;
    ctx.font = `${textAnnotation.fontSize}px Arial`;
    ctx.fillText(textAnnotation.text, x, y);
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full flex items-center justify-center ${className || ''}`}>
      <img
        ref={imageRef}
        src={photo.url}
        alt={photo.filename}
        className="max-w-full max-h-full object-contain"
      />
      <canvas
        ref={canvasRef}
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
};

export default PhotoViewer;
