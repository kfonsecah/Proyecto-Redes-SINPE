import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ModalMessageProps {
  isOpen: boolean;
  type: "error" | "success";
  message: string;
  onClose: () => void;
}

const ModalMessage: React.FC<ModalMessageProps> = ({
  isOpen,
  type,
  message,
  onClose,
}) => {
  const isSuccess = type === "success";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Content */}
            <motion.div
              className="relative z-10 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.3
              }}
            >
              <div className="card-modern p-6 relative overflow-hidden">
                {/* Decorative background gradient */}
                <div
                  className={`absolute inset-0 opacity-5 ${isSuccess ? 'bg-gradient-success' : 'bg-gradient-to-br from-red-500 to-red-600'
                    }`}
                />

                {/* Close button */}
                <motion.button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>

                <div className="text-center">
                  {/* Icon with animation */}
                  <motion.div
                    className="mx-auto mb-4"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      damping: 15,
                      stiffness: 200,
                      delay: 0.1
                    }}
                  >
                    {isSuccess ? (
                      <div className="w-16 h-16 bg-gradient-success rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <XCircle className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    className={`text-xl font-bold mb-3 ${isSuccess ? 'text-green-700' : 'text-red-700'
                      }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {isSuccess ? '¡Éxito!' : 'Error'}
                  </motion.h3>

                  {/* Message */}
                  <motion.p
                    className="text-gray-700 mb-6 leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {message}
                  </motion.p>

                  {/* Action button */}
                  <motion.button
                    onClick={onClose}
                    className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${isSuccess
                        ? 'bg-gradient-success hover:shadow-lg hover:shadow-green-500/25'
                        : 'bg-gradient-to-br from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/25'
                      }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Entendido
                  </motion.button>
                </div>

                {/* Decorative elements */}
                {isSuccess && (
                  <>
                    <motion.div
                      className="absolute -top-2 -left-2 w-4 h-4 bg-green-400 rounded-full opacity-60"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-300 rounded-full opacity-40"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    />
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModalMessage;
