import { useState } from 'react';
import {Upload } from "lucide-react";

interface ImageUploadProps {
  onUpload: (imageData: string) => void;
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const processUploadedImage = (originalImage: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Canvas para el tamaño MNIST (28x28)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) return;

        // Canvas para procesamiento inicial
        const processCanvas = document.createElement('canvas');
        const processCtx = processCanvas.getContext('2d');
        
        if (!processCtx) return;
        
        // Configurar canvas de procesamiento
        processCanvas.width = img.width;
        processCanvas.height = img.height;
        processCtx.fillStyle = 'white';
        processCtx.fillRect(0, 0, img.width, img.height);
        processCtx.drawImage(img, 0, 0);
        
        // Obtener y procesar datos de imagen
        const imageData = processCtx.getImageData(0, 0, img.width, img.height);
        
        // Convertir a escala de grises
        for (let i = 0; i < imageData.data.length; i += 4) {
          const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
          imageData.data[i] = avg;
          imageData.data[i + 1] = avg;
          imageData.data[i + 2] = avg;
        }
        processCtx.putImageData(imageData, 0, 0);

        // Detectar bordes del dígito
        let minX = imageData.width;
        let minY = imageData.height;
        let maxX = 0;
        let maxY = 0;
        let hasContent = false;

        for (let y = 0; y < imageData.height; y++) {
          for (let x = 0; x < imageData.width; x++) {
            const i = (y * imageData.width + x) * 4;
            if (imageData.data[i] < 250) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
              hasContent = true;
            }
          }
        }

        if (!hasContent) {
          resolve(originalImage);
          return;
        }

        // Calcular dimensiones
        const width = maxX - minX;
        const height = maxY - minY;

        // Preparar canvas final
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, 28, 28);
        
        // Calcular escalado manteniendo proporción
        const scale = Math.min(
          20 / width,
          20 / height
        );
        
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        const x = (28 - scaledWidth) / 2;
        const y = (28 - scaledHeight) / 2;

        // Dibujar imagen procesada y centrada
        tempCtx.drawImage(
          processCanvas,
          minX, minY, width, height,
          x, y, scaledWidth, scaledHeight
        );

        // Invertir colores para formato MNIST
        const finalImageData = tempCtx.getImageData(0, 0, 28, 28);
        for (let i = 0; i < finalImageData.data.length; i += 4) {
          finalImageData.data[i] = 255 - finalImageData.data[i];
          finalImageData.data[i + 1] = 255 - finalImageData.data[i + 1];
          finalImageData.data[i + 2] = 255 - finalImageData.data[i + 2];
        }
        tempCtx.putImageData(finalImageData, 0, 0);

        resolve(tempCanvas.toDataURL('image/png'));
      };
      img.src = originalImage;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const originalImage = reader.result as string;
      const processedImage = await processUploadedImage(originalImage);
      onUpload(processedImage);
    };
    reader.readAsDataURL(file);
  };

  
  return (
    <div className="h-[400px] flex items-center"> {/* Altura fija igual al canvas */}
      <div
      className={`border-2 border-dashed rounded-lg p-6 text-center w-full h-full flex flex-col items-center justify-center ${
        dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      >
      <label className="flex flex-col items-center cursor-pointer space-y-4">
        <Upload className="w-12 h-12 text-blue-600" />
        <span className="text-sm text-gray-600">
        Arrastra y suelta una imagen o
        </span>
        <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
        id="fileInput"
        />
        <button
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        onClick={() => document.getElementById('fileInput')?.click()}
        >
        Selecciona un archivo
        </button>
      </label>
      </div>
    </div>
  );
}