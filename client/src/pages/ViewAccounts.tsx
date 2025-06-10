import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Eye,
  TrendingUp,
  DollarSign,
  Euro,
  PoundSterling,
  ChevronRight,
  Wallet
} from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";
import AccountModal from "../components/ModalMessage";

interface Transaction {
  type: "credit" | "debit";
  amount: number;
  currency: string;
  date: string;
}

interface AccountSummary {
  id: string;
  number: string;
  currency: string;
  balance: number;
}

interface AccountDetails {
  id: number;
  number: string;
  currency: string;
  registeredBalance: number;
  calculatedBalance: number;
  transactions: Transaction[];
}

const ViewAccounts: React.FC = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<AccountDetails | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const name = user?.name || "";
    setUsername(name);

    fetch(`${API_URL}/accounts?user=${encodeURIComponent(name)}`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar cuentas");
        return res.json();
      })
      .then((data: AccountSummary[]) => {
        setAccounts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [API_URL]);

  const handleViewDetails = async (accountNumber: string) => {
    try {
      const res = await fetch(
        `${API_URL}/accounts/details?user=${encodeURIComponent(username)}&account=${encodeURIComponent(accountNumber)}`
      );
      if (!res.ok) throw new Error("Error al cargar detalles");
      const details: AccountDetails = await res.json();
      setSelectedAccount(details);
      setModalOpen(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'USD': return <DollarSign className="w-5 h-5" />;
      case 'EUR': return <Euro className="w-5 h-5" />;
      case 'GBP': return <PoundSterling className="w-5 h-5" />;
      default: return <span className="font-bold text-sm">₡</span>;
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, acc) => {
      if (acc.currency === 'CRC') return total + acc.balance;
      return total + (acc.balance * 500); // Conversión aproximada
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          className="card-modern p-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-600">Cargando tus cuentas...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          className="card-modern p-8 text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="container-modern">
        {/* Header con resumen */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Total de cuentas */}
            <motion.div
              className="card-modern p-6 hover-lift"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total de Cuentas</p>
                  <p className="text-3xl font-bold text-gray-900">{accounts.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            {/* Patrimonio total */}
            <motion.div
              className="card-modern p-6 hover-lift"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Patrimonio Total</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(getTotalBalance(), 'CRC')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            {/* Estado */}
            <motion.div
              className="card-modern p-6 hover-lift"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Estado</p>
                  <p className="text-2xl font-bold text-blue-600">Activo</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Lista de cuentas */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Mis Cuentas</h2>

          {accounts.map((acc, index) => (
            <motion.div
              key={acc.id}
              className="card-modern p-6 hover-lift cursor-pointer group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.01, y: -2 }}
              onClick={() => handleViewDetails(acc.number)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Icono de la tarjeta */}
                  <motion.div
                    className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <CreditCard className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Información de la cuenta */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        Cuenta {acc.currency}
                      </h3>
                      <div className="flex items-center text-gray-500">
                        {getCurrencyIcon(acc.currency)}
                      </div>
                    </div>
                    <p className="text-gray-600 font-mono text-sm">
                      {acc.number}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Cuenta de ahorros • {acc.currency}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {/* Saldo */}
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">Saldo disponible</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(acc.balance, acc.currency)}
                    </p>
                  </div>

                  {/* Botón de ver detalles */}
                  <motion.div
                    className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700"
                    whileHover={{ x: 4 }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver detalles
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </motion.div>
                </div>
              </div>

              {/* Efecto de brillo en hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-2xl"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.8 }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Mensaje si no hay cuentas */}
        {accounts.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No tienes cuentas registradas
            </h3>
            <p className="text-gray-600">
              Contacta a tu asesor para abrir tu primera cuenta
            </p>
          </motion.div>
        )}
      </div>

      <AccountModal
        isOpen={modalOpen}
        data={selectedAccount}
        username={username}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default ViewAccounts;
