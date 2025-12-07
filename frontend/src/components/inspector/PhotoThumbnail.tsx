import React, { useEffect, useRef } from 'react';
import type { Photo, Arrow, Circle, TextAnnotation } from '../../types/inspection';

interface PhotoThumbnailProps {
  photo: Photo;
  onClick?: () => void;
  className?: string;
}

const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({ photo, onClick, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const drawAnnotations = () => {
      const canvas = canvasRef.current;
      const image = imageRef.current;

      console.log('[PhotoThumbnail] drawAnnotations called', {
        canvas: !!canvas,
        image: !!image,
        imageComplete: image?.complete,
        photoId: photo.id,
        hasAnnotations: !!photo.annotations
      });

      if (!canvas || !image || !image.complete) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match image display size
      const rect = image.getBoundingClientRect();

      console.log('[PhotoThumbnail] Image rect:', {
        width: rect.width,
        height: rect.height,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight
      });

      // If rect is invalid, don't set canvas dimensions
      if (rect.width === 0 || rect.height === 0) {
        console.log('[PhotoThumbnail] Invalid rect dimensions, skipping');
        return;
      }

      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only draw if there are annotations
      if (!photo.annotations) {
        console.log('[PhotoThumbnail] No annotations to draw');
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

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
      if (image.complete) {
        drawAnnotations();
      } else {
        image.addEventListener('load', drawAnnotations);
        return () => image.removeEventListener('load', drawAnnotations);
      }
    }
  }, [photo.annotations]);

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
    ctx.lineWidth = arrow.width || 2;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowLength = 15;

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
    ctx.lineWidth = circle.width || 2;
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

    // Scale font size based on canvas size (smaller for thumbnails)
    const scaledFontSize = Math.max(12, (textAnnotation.fontSize * Math.min(width, height)) / 500);

    ctx.fillStyle = textAnnotation.color;
    ctx.font = `${scaledFontSize}px Arial`;
    ctx.fillText(textAnnotation.text, x, y);
  };

  return (
    <div className={`relative w-full h-full ${className || ''}`} onClick={onClick}>
      <img
        ref={imageRef}
        src={photo.thumbnailUrl || photo.url}
        alt={photo.filename}
        className="w-full h-full object-cover"
      />
      {photo.annotations && (photo.annotations.arrows.length > 0 || photo.annotations.circles.length > 0 || photo.annotations.text.length > 0) && (
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none z-10"
        />
      )}
    </div>
  );
};

export default PhotoThumbnail;
