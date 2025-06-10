import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRightLeft, CreditCard } from "lucide-react";

interface Props {
  onFinish: () => void;
}

const TransferProcessing: React.FC<Props> = ({ onFinish }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simula el progreso de la transferencia
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Timer principal para completar la transferencia
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => {
        onFinish();
      }, 2000);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className="card-modern p-12 text-center max-w-md w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            {/* Icono animado de transferencia */}
            <motion.div
              className="relative mb-8 mx-auto w-24 h-24"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-primary rounded-full flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <ArrowRightLeft className="w-10 h-10 text-white" />
              </motion.div>

              {/* Anillo de progreso */}
              <motion.div
                className="absolute inset-0 border-4 border-transparent border-t-blue-300 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            {/* Barra de progreso */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <motion.p
                className="text-sm text-gray-600 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Procesando transferencia... {progress}%
              </motion.p>
            </div>

            {/* Título */}
            <motion.h3
              className="text-2xl font-bold text-gray-800 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Procesando Transferencia
            </motion.h3>

            {/* Descripción */}
            <motion.p
              className="text-gray-600 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Estamos procesando tu transferencia de forma segura.
              No cierres esta ventana.
            </motion.p>

            {/* Elementos decorativos */}
            <motion.div
              className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full opacity-60"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 0.8, 0.6]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-300 rounded-full opacity-40"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="success"
            className="card-modern p-12 text-center max-w-md w-full"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.6,
              type: "spring",
              damping: 15,
              stiffness: 300
            }}
          >
            {/* Confetti Animation */}
            <motion.div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-green-400 rounded-full"
                  initial={{
                    x: "50%",
                    y: "50%",
                    scale: 0,
                  }}
                  animate={{
                    x: `${50 + (Math.random() - 0.5) * 200}%`,
                    y: `${50 + (Math.random() - 0.5) * 200}%`,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>

            {/* Icono de éxito */}
            <motion.div
              className="mb-8 mx-auto"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.6,
                type: "spring",
                damping: 10,
                delay: 0.2
              }}
            >
              <div className="w-24 h-24 bg-gradient-success rounded-full flex items-center justify-center shadow-lg mx-auto">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Título de éxito */}
            <motion.h3
              className="text-3xl font-bold text-green-700 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              ¡Transferencia Exitosa!
            </motion.h3>

            {/* Mensaje */}
            <motion.p
              className="text-gray-600 text-lg mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Tu transferencia ha sido procesada correctamente y está en camino.
            </motion.p>

            {/* Información adicional */}
            <motion.div
              className="bg-green-50 p-4 rounded-xl border border-green-200 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-center text-green-700 text-sm">
                <CreditCard className="w-4 h-4 mr-2" />
                <span className="font-medium">
                  Recibirás una confirmación por correo electrónico
                </span>
              </div>
            </motion.div>

            {/* Elementos decorativos de éxito */}
            <motion.div
              className="absolute -top-3 -right-3 w-6 h-6 bg-green-400 rounded-full opacity-70"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-3 -left-3 w-4 h-4 bg-green-300 rounded-full opacity-50"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransferProcessing;
