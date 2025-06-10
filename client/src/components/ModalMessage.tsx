import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  User,
  Building2
} from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

interface Transaction {
  type: "credit" | "debit";
  amount: number;
  currency: string;
  date: string;
}

interface AccountDetails {
  id: number;
  number: string;
  currency: string;
  registeredBalance: number;
  calculatedBalance: number;
  transactions: Transaction[];
}

interface Props {
  isOpen: boolean;
  data: AccountDetails | null;
  username: string;
  onClose: () => void;
}

const AccountModal: React.FC<Props> = ({ isOpen, data, username, onClose }) => {
  if (!isOpen || !data) return null;

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
              className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden"
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
              <div className="card-modern overflow-hidden">
                {/* Header */}
                <motion.div
                  className="bg-gradient-primary p-6 text-white relative overflow-hidden"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Elementos decorativos */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <CreditCard className="w-8 h-8 text-white" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold mb-1">Detalles de Cuenta</h2>
                        <p className="text-blue-100">
                          <User className="inline w-4 h-4 mr-2" />
                          {username}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      onClick={onClose}
                      className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                </motion.div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {/* Información de la cuenta */}
                  <motion.div
                    className="grid md:grid-cols-2 gap-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Número de Cuenta</span>
                        <Building2 className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-lg font-mono font-bold text-gray-900">{data.number}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Moneda</span>
                        <DollarSign className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{data.currency}</p>
                    </div>
                  </motion.div>

                  {/* Saldos */}
                  <motion.div
                    className="grid md:grid-cols-2 gap-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="card-modern p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700">Saldo Registrado</span>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-green-700">
                        {formatCurrency(data.registeredBalance, data.currency)}
                      </p>
                    </div>

                    <div className="card-modern p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">Saldo Calculado</span>
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-700">
                        {formatCurrency(data.calculatedBalance, data.currency)}
                      </p>
                    </div>
                  </motion.div>

                  {/* Historial de transacciones */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Historial de Transacciones
                    </h3>

                    {data.transactions.length > 0 ? (
                      <div className="space-y-3">
                        {data.transactions.map((tx, index) => (
                          <motion.div
                            key={index}
                            className="card-modern p-4 hover-lift cursor-pointer"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === "credit"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-red-100 text-red-600"
                                  }`}>
                                  {tx.type === "credit" ? (
                                    <TrendingUp className="w-6 h-6" />
                                  ) : (
                                    <TrendingDown className="w-6 h-6" />
                                  )}
                                </div>
                                <div>
                                  <p className={`font-semibold ${tx.type === "credit" ? "text-green-700" : "text-red-700"
                                    }`}>
                                    {tx.type === "credit" ? "Crédito" : "Débito"}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(tx.date).toLocaleDateString('es-CR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${tx.type === "credit" ? "text-green-700" : "text-red-700"
                                  }`}>
                                  {tx.type === "credit" ? "+" : "-"}
                                  {formatCurrency(tx.amount, tx.currency)}
                                </p>
                                <p className="text-sm text-gray-500">{tx.currency}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">
                          Sin transacciones
                        </h4>
                        <p className="text-gray-600">
                          No hay transacciones registradas para esta cuenta
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AccountModal;
