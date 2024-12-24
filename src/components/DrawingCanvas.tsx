import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Brain } from 'lucide-react';

interface DrawingCanvasProps {
  onPredict: (imageData: string) => void;
}

export function DrawingCanvas({ onPredict }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const size = Math.min(container.clientWidth - 40, 400);
      canvas.width = size;
      canvas.height = size;
      
      // Set drawing style
      context.lineWidth = 15;
      context.lineCap = 'round';
      context.strokeStyle = '#000';
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    setCtx(context);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const point = getEventPoint(e);
    if (!point) return;
    ctx?.beginPath();
    ctx?.moveTo(point.x, point.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const point = getEventPoint(e);
    if (!point) return;
    ctx?.lineTo(point.x, point.y);
    ctx?.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctx?.closePath();
  };

  const getEventPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

// DrawingCanvas.tsx
const handlePredict = () => {
  if (!canvasRef.current || !ctx) return;

  // Validar que haya un dibujo
  if (!validateDrawing()) {
    alert('Por favor, dibuja un número antes de predecir');
    return;
  }

  // Crear un canvas temporal para el preprocesamiento
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 28;  // Tamaño MNIST
  tempCanvas.height = 28;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;

  // Obtener el área del dibujo
  const originalCanvas = canvasRef.current;
  const imageData = ctx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
  
  // Encontrar los límites del dibujo
  const bounds = findDrawingBounds(imageData);
  if (!bounds) return;

  // Dibujar en el canvas temporal con el tamaño correcto
  tempCtx.fillStyle = 'white';
  tempCtx.fillRect(0, 0, 28, 28);
  
  // Escalar y centrar el dibujo
  const scale = Math.min(
    20 / (bounds.width), 
    20 / (bounds.height)
  );
  
  const scaledWidth = bounds.width * scale;
  const scaledHeight = bounds.height * scale;
  const x = (28 - scaledWidth) / 2;
  const y = (28 - scaledHeight) / 2;

  tempCtx.drawImage(
    originalCanvas,
    bounds.left, bounds.top, bounds.width, bounds.height,
    x, y, scaledWidth, scaledHeight
  );

  // Invertir colores para coincidir con MNIST (fondo negro, dígito blanco)
  const processedImageData = tempCtx.getImageData(0, 0, 28, 28);
  for (let i = 0; i < processedImageData.data.length; i += 4) {
    processedImageData.data[i] = 255 - processedImageData.data[i];
    processedImageData.data[i + 1] = 255 - processedImageData.data[i + 1];
    processedImageData.data[i + 2] = 255 - processedImageData.data[i + 2];
  }
  tempCtx.putImageData(processedImageData, 0, 0);

  const processedImage = tempCanvas.toDataURL('image/png');
  onPredict(processedImage);
};

// Función auxiliar para encontrar los límites del dibujo
const findDrawingBounds = (imageData: ImageData) => {
  let minX = imageData.width;
  let minY = imageData.height;
  let maxX = 0;
  let maxY = 0;
  let hasDrawing = false;

  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      const i = (y * imageData.width + x) * 4;
      // Detectar píxeles no blancos
      if (imageData.data[i] < 250) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        hasDrawing = true;
      }
    }
  }

  if (!hasDrawing) return null;

  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

// Función para validar que haya un dibujo
const validateDrawing = () => {
  if (!ctx || !canvasRef.current) return false;

  const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i] < 250) {
      return true;
    }
  }
  return false;
};

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-300 rounded-lg touch-none bg-white cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex gap-4">
        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Eraser className="w-5 h-5" />
          Limpiar
        </button>
        <button
          onClick={handlePredict}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Brain className="w-5 h-5" />
          Predecir
        </button>
      </div>
    </div>
  );
}