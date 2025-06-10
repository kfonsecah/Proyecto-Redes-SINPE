import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  CreditCard,
  User,
  DollarSign,
  AlertCircle,
  CheckCircle,
  MessageSquare
} from "lucide-react";
import ModalMessage from "./modal";
import { formatCurrency } from "../utils/formatCurrency";

interface Account {
  id: string;
  number: string;
  currency: string;
  balance: number;
}

interface TransferData {
  fromAccount: string;
  phone: string;
  amount: number;
  currency: string;
  comment?: string;
}

interface Props {
  onContinue: (data: TransferData) => void;
}

const SinpeTransferForm: React.FC<Props> = ({ onContinue }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccount, setFromAccount] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CRC");
  const [comment, setComment] = useState("");
  const [receiverName, setReceiverName] = useState<string | null>(null);
  const [modalError, setModalError] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    fetch(`${API_URL}/sinpe/user-link/${user.name}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.linked) {
          alert("Ninguna de tus cuentas está vinculada a SINPE Móvil.");
        } else {
          localStorage.setItem("senderInfo", data.phone);
          console.log("Sender info saved:", data.phone);
        }
      })
      .catch(() => {
        alert("Error al verificar si tu cuenta está vinculada a SINPE.");
      });
  }, [API_URL]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const username = user?.name || "";

    fetch(`${API_URL}/accounts?user=${encodeURIComponent(username)}`)
      .then((res) => res.json())
      .then((data: Account[]) => {
        console.log("📊 Cuentas cargadas para SINPE:", data);
        setAccounts(data);
        if (data.length > 0) {
          setFromAccount(data[0].number);
          setCurrency(data[0].currency);
        }
      })
      .catch(() => {
        alert("Error al cargar cuentas");
      });
  }, [API_URL]);

  useEffect(() => {
    if (fromAccount) {
      const bankCode = fromAccount.slice(5, 8);
      localStorage.setItem("senderAccount", bankCode);
      console.log("Bank code saved:", bankCode);
    }
  }, [fromAccount]);

  useEffect(() => {
    const buscarNombre = async () => {
      if (!phone.match(/^[0-9]{8}$/)) {
        setReceiverName(null);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/validate/${phone}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        console.log("📱 Destinatario encontrado:", data);
        localStorage.setItem("receiverInfo", JSON.stringify(data));
        setReceiverName(data.name);
      } catch {
        setReceiverName(null);
        setModalError(true);
      }
    };

    buscarNombre();
  }, [phone, API_URL]);

  const selectedAccount = accounts.find((acc) => acc.number === fromAccount);
  const amountNumber = Number(amount);

  // CORREGIR LA VALIDACIÓN DE FONDOS COMO EN TRANSFERENCIAS NORMALES
  const isValidAmount = selectedAccount && amountNumber > 0 && amountNumber <= selectedAccount.balance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.match(/^[0-9]{8}$/)) {
      alert("Ingrese un número de teléfono válido.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("El monto debe ser mayor a 0.");
      return;
    }

    // MEJORAR LA VALIDACIÓN DE FONDOS CON LOGS DETALLADOS
    if (!selectedAccount) {
      alert("No se ha seleccionado una cuenta válida.");
      return;
    }

    console.log("🔍 VALIDACIÓN DE FONDOS SINPE:");
    console.log("   - Cuenta seleccionada:", selectedAccount);
    console.log("   - Balance disponible:", selectedAccount.balance);
    console.log("   - Monto a transferir:", amountNumber);
    console.log("   - ¿Fondos suficientes?:", selectedAccount.balance >= amountNumber);

    if (amountNumber > selectedAccount.balance) {
      alert(`Fondos insuficientes. Saldo disponible: ${formatCurrency(selectedAccount.balance, selectedAccount.currency)} | Requerido: ${formatCurrency(amountNumber, selectedAccount.currency)}`);
      return;
    }

    if (!receiverName) {
      alert("El número de destino no está registrado en SINPE Móvil.");
      return;
    }

    const transferData: TransferData = {
      fromAccount,
      phone,
      amount: Number(amount),
      currency,
      comment,
    };

    console.log("✅ Datos de transferencia SINPE validados:", transferData);
    onContinue(transferData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
      <div className="container-modern max-w-2xl mx-auto">
        <motion.div
          className="card-modern p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header del formulario */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              SINPE Móvil
            </h2>
            <p className="text-gray-600">
              Envía dinero usando solo un número de teléfono
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Cuenta origen */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <CreditCard className="inline w-4 h-4 mr-2" />
                Cuenta origen
              </label>
              <select
                value={fromAccount}
                onChange={(e) => {
                  const acc = accounts.find((a) => a.number === e.target.value);
                  setFromAccount(e.target.value);
                  if (acc) setCurrency(acc.currency);
                }}
                className="input-modern w-full focus-ring"
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.number}>
                    {acc.number} ({acc.currency})
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <motion.div
                  className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm text-purple-700">
                    <strong>Saldo disponible:</strong>{" "}
                    {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Teléfono */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Smartphone className="inline w-4 h-4 mr-2" />
                Número de teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 88888888"
                className="input-modern w-full focus-ring"
                required
              />
              {receiverName && (
                <motion.div
                  className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="text-sm text-green-700">
                    <CheckCircle className="inline w-4 h-4 mr-1" />
                    <strong>Destinatario:</strong> {receiverName}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Monto */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <DollarSign className="inline w-4 h-4 mr-2" />
                Monto a transferir
              </label>
              <div className="flex gap-3">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input-modern rounded-xl px-4 py-3 min-w-[100px] focus-ring"
                >
                  <option value="CRC">₡ CRC</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-modern flex-1 focus-ring"
                  required
                  min={0.01}
                  step="0.01"
                />
              </div>
              {amount && !isValidAmount && (
                <motion.div
                  className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="text-sm text-red-700">
                    <AlertCircle className="inline w-4 h-4 mr-1" />
                    El monto excede el saldo disponible
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Comentario */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <MessageSquare className="inline w-4 h-4 mr-2" />
                Comentario (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Motivo de la transferencia"
                className="input-modern w-full resize-none focus-ring"
                rows={3}
              />
            </motion.div>

            {/* Botón de envío */}
            <motion.button
              type="submit"
              disabled={!isValidAmount || !receiverName}
              className="btn-primary-modern w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Smartphone className="inline w-5 h-5 mr-2" />
              Continuar con SINPE
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Modal de error */}
      <ModalMessage
        isOpen={modalError}
        type="error"
        message="Este número no está registrado en SINPE Móvil."
        onClose={() => setModalError(false)}
      />
    </div>
  );
};

export default SinpeTransferForm;
