import React from 'react';

interface Prediction {
  digit: number;
  confidences: number[];
}

interface PredictionResultProps {
  prediction: Prediction | null;
  isLoading: boolean;
}

export function PredictionResult({ prediction, isLoading }: PredictionResultProps) {
  if (isLoading) {
    return (
      <div className="mt-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Analizando imagen...</p>
      </div>
    );
  }

  if (!prediction) return null;

  return (
    <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-bold text-center mb-4">
        Dígito Predicho: {prediction.digit}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {prediction.confidences.map((confidence, index) => (
          <div
            key={index}
            className="flex flex-col items-center p-2 bg-gray-50 rounded-lg"
          >
            <span className="text-lg font-semibold">{index}</span>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 mt-1">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}