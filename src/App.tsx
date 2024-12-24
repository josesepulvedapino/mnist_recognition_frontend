import { useState } from "react";
import { DrawingCanvas } from "./components/DrawingCanvas";
import { PredictionResult } from "./components/PredictionResult";
import axios from "axios";
import { ImageUpload } from "./components/ImageUpload";
import { BrainCircuit, Brain, Upload } from "lucide-react";

interface Prediction {
  digit: number;
  confidences: number[];
}

function App() {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async (imageData: string) => {
    setIsLoading(true);
    try {
      const blob = await fetch(imageData).then((res) => res.blob());
      const file = new File([blob], "digit.png", { type: "image/png" });

      // Crear FormData
      const formData = new FormData();
      formData.append("file", file);

      // Hacer la petición al backend
      const response = await axios.post(
        "https://mnist-recognition-backend.onrender.com/predict",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Procesar la respuesta
      if (response.data.success) {
        setPrediction({
          digit: response.data.predicted_digit,
          confidences: Object.values(response.data.probabilities),
        });
      } else {
        console.error("Error en la predicción:", response.data.error);
      }
    } catch (error) {
      console.error("Error predicting digit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BrainCircuit className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              Reconocimiento de Dígitos
            </h1>
          </div>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Dibuja un número del 0 al 9 en el área de dibujo y nuestro modelo de
            IA lo reconocerá. Cuanto más claro y centrado esté el número, mejor
            será la predicción.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 transition-transform transform hover:scale-105">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Dibuja un Dígito</h2>
            </div>
            <DrawingCanvas onPredict={handlePredict} />
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transition-transform transform hover:scale-105">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Sube una Imagen</h2>
            </div>
            <ImageUpload onUpload={handlePredict} />
          </div>
        </div>

        <PredictionResult prediction={prediction} isLoading={isLoading} />

        <div className="mt-12 bg-blue-100 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">¿Cómo usar?</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>
              Dibuja un número del 0 al 9 en el área de dibujo usando el mouse o
              tu dedo
            </li>
            <li>O sube una imagen de un dígito escrito a mano</li>
            <li>Intenta que el número sea lo más claro y centrado posible</li>
            <li>Haz clic en "Predecir" para que la IA reconozca el dígito</li>
            <li>Si quieres intentar con otro número, haz clic en "Limpiar"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;
