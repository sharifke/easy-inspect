import React, { useState, useRef, useEffect } from 'react';
import type { Photo, PhotoAnnotations, Arrow, Circle, TextAnnotation } from '../../types/inspection';

interface PhotoAnnotationProps {
  photo: Photo;
  onSave: (annotations: PhotoAnnotations) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

type Tool = 'arrow' | 'circle' | 'text' | 'none';

interface Point {
  x: number;
  y: number;
}

const PhotoAnnotation: React.FC<PhotoAnnotationProps> = ({
  photo,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  console.log('PhotoAnnotation initialized with photo:', photo);
  console.log('Photo annotations:', photo.annotations);

  const [selectedTool, setSelectedTool] = useState<Tool>('none');
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [annotations, setAnnotations] = useState<PhotoAnnotations>(
    photo.annotations || { arrows: [], circles: [], text: [] }
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [history, setHistory] = useState<PhotoAnnotations[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'];

  useEffect(() => {
    // Initialize history with current annotations
    setHistory([annotations]);
    setHistoryIndex(0);
  }, []);

  useEffect(() => {
    drawAnnotations();
  }, [annotations, currentPoint, startPoint, isDrawing]);

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing annotations
    annotations.arrows.forEach((arrow) => {
      drawArrow(ctx, arrow, canvas.width, canvas.height);
    });

    annotations.circles.forEach((circle) => {
      drawCircle(ctx, circle, canvas.width, canvas.height);
    });

    annotations.text.forEach((text) => {
      drawText(ctx, text, canvas.width, canvas.height);
    });

    // Draw current drawing
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 3;

      if (selectedTool === 'arrow') {
        drawArrowPreview(ctx, startPoint, currentPoint);
      } else if (selectedTool === 'circle') {
        drawCirclePreview(ctx, startPoint, currentPoint);
      }
    }
  };

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

  const drawArrowPreview = (
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point
  ) => {
    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLength = 20;

    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - arrowLength * Math.cos(angle - Math.PI / 6),
      end.y - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      end.x - arrowLength * Math.cos(angle + Math.PI / 6),
      end.y - arrowLength * Math.sin(angle + Math.PI / 6)
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

  const drawCirclePreview = (
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point
  ) => {
    const radius = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );

    ctx.beginPath();
    ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
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

  const getCanvasPoint = (event: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
      if (event.touches.length === 0) return null;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleMouseDown = (event: React.MouseEvent | React.TouchEvent) => {
    if (selectedTool === 'none') return;

    const point = getCanvasPoint(event);
    if (!point) return;

    if (selectedTool === 'text') {
      setTextPosition(point);
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPoint(point);
  };

  const handleMouseMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPoint) return;

    const point = getCanvasPoint(event);
    if (!point) return;

    setCurrentPoint(point);
  };

  const handleMouseUp = (_event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPoint || !currentPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    let newAnnotations = { ...annotations };

    if (selectedTool === 'arrow') {
      const arrow: Arrow = {
        id: `arrow_${Date.now()}`,
        startX: (startPoint.x / width) * 100,
        startY: (startPoint.y / height) * 100,
        endX: (currentPoint.x / width) * 100,
        endY: (currentPoint.y / height) * 100,
        color: selectedColor,
        width: 3,
      };
      newAnnotations.arrows = [...newAnnotations.arrows, arrow];
    } else if (selectedTool === 'circle') {
      const radius =
        (Math.sqrt(
          Math.pow(currentPoint.x - startPoint.x, 2) +
            Math.pow(currentPoint.y - startPoint.y, 2)
        ) /
          Math.min(width, height)) *
        100;

      const circle: Circle = {
        id: `circle_${Date.now()}`,
        x: (startPoint.x / width) * 100,
        y: (startPoint.y / height) * 100,
        radius,
        color: selectedColor,
        width: 3,
      };
      newAnnotations.circles = [...newAnnotations.circles, circle];
    }

    addToHistory(newAnnotations);
    setAnnotations(newAnnotations);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handleTextSubmit = () => {
    if (!textInput || !textPosition) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    const textAnnotation: TextAnnotation = {
      id: `text_${Date.now()}`,
      x: (textPosition.x / width) * 100,
      y: (textPosition.y / height) * 100,
      text: textInput,
      color: selectedColor,
      fontSize: 20,
    };

    const newAnnotations = {
      ...annotations,
      text: [...annotations.text, textAnnotation],
    };

    addToHistory(newAnnotations);
    setAnnotations(newAnnotations);
    setTextInput('');
    setTextPosition(null);
  };

  const addToHistory = (newAnnotations: PhotoAnnotations) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
    }
  };

  const handleClear = () => {
    const newAnnotations = { arrows: [], circles: [], text: [] };
    addToHistory(newAnnotations);
    setAnnotations(newAnnotations);
  };

  const handleSave = () => {
    onSave(annotations);
  };

  const handleImageLoad = () => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;

    canvas.width = image.width;
    canvas.height = image.height;
    drawAnnotations();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Foto annoteren</h2>
        <button
          onClick={onCancel}
          className="text-white hover:text-gray-300"
          disabled={isSaving}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          {/* Tools */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedTool('arrow')}
              className={`p-3 rounded-lg ${
                selectedTool === 'arrow'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Pijl"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>
            <button
              onClick={() => setSelectedTool('circle')}
              className={`p-3 rounded-lg ${
                selectedTool === 'circle'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Cirkel"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
            </button>
            <button
              onClick={() => setSelectedTool('text')}
              className={`p-3 rounded-lg ${
                selectedTool === 'text'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Tekst"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
            </button>
          </div>

          {/* Color Picker */}
          <div className="flex space-x-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-full border-2 ${
                  selectedColor === color ? 'border-white' : 'border-gray-600'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex space-x-2 ml-auto">
            <button
              onClick={handleUndo}
              className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={historyIndex <= 0}
              title="Ongedaan maken"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            <button
              onClick={handleRedo}
              className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={historyIndex >= history.length - 1}
              title="Opnieuw"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                />
              </svg>
            </button>
            <button
              onClick={handleClear}
              className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              title="Alles wissen"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center p-4"
      >
        <div className="relative">
          <img
            ref={imageRef}
            src={photo.url}
            alt={photo.filename}
            className="max-w-full max-h-full"
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 cursor-crosshair touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          />
        </div>
      </div>

      {/* Text Input Modal */}
      {textPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tekst toevoegen</h3>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              placeholder="Voer tekst in..."
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleTextSubmit();
                }
              }}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setTextInput('');
                  setTextPosition(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleTextSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                disabled={!textInput}
              >
                Toevoegen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-white bg-gray-700 rounded-lg hover:bg-gray-600"
            disabled={isSaving}
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoAnnotation;
