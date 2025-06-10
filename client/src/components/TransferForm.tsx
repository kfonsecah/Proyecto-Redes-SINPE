import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  CreditCard,
  Building2,
  DollarSign,
  AlertCircle,
  Users,
} from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

interface Account {
  id: string;
  number: string;
  currency: string;
  balance: number;
}

interface SubscribedAccount {
  number: string;
  name: string;
}

export interface TransferData {
  fromAccount: string;
  toAccount: string;
  toName: string;
  amount: number;
  currency: string;
  description?: string;
}

interface Props {
  userId: string;
  subscribedAccounts: SubscribedAccount[];
  onSubmit: (data: TransferData) => void;
}

const TransferForm: React.FC<Props> = ({ subscribedAccounts, onSubmit }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccount, setFromAccount] = useState("");
  const [useSubscribed, setUseSubscribed] = useState(true);
  const [toAccount, setToAccount] = useState(
    subscribedAccounts[0]?.number || ""
  );
  const [manualAccount, setManualAccount] = useState("");
  const [manualName, setManualName] = useState("");
  const [bankName, setBankName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CRC");
  const [description, setDescription] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  // Función para obtener el nombre del banco basado en el código
  const getBankName = (bankCode: string): string => {
    const bankNames: Record<string, string> = {
      "152": "NovaBank (Local)",
      "241": "Banco Nacional",
      "151": "Banco Popular",
      "161": "BCR",
      "111": "Banco Davivienda",
      "876": "Banco Promerica",
      "223": "BAC San José",
    };
    return bankNames[bankCode] || `Banco ${bankCode}`;
  };

  // Función para extraer código del banco del IBAN
  const getBankCodeFromIban = (iban: string): string => {
    if (iban.length >= 8) {
      return iban.substring(5, 8); // Posiciones 5-7 (0-indexed)
    }
    return "";
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const username = user?.name || "";
    const fetchAccounts = async () => {
      try {
        const res = await fetch(
          `${API_URL}/accounts?user=${encodeURIComponent(username)}`
        );
        const data: Account[] = await res.json();
        setAccounts(data);
        if (data.length > 0) {
          setFromAccount(data[0].number);
          setCurrency(data[0].currency);
        }
      } catch (error) {
        console.error("Error al cargar cuentas:", error);
      }
    };

    fetchAccounts();
  }, [API_URL]);

  useEffect(() => {
    if (fromAccount) {
      const bankCode = fromAccount.slice(5, 8);
      localStorage.setItem("bankFromTransfer", bankCode);
      console.log("Bank code saved:", bankCode);
    }
  }, [fromAccount]);

  useEffect(() => {
    const buscarNombre = async () => {
      if (!manualAccount.trim() || manualAccount.length < 8) {
        setManualName("");
        setBankName("");
        return;
      }

      const banco = getBankCodeFromIban(manualAccount);
      const nombreBanco = getBankName(banco);

      console.log("🏦 Código de banco detectado:", banco);
      console.log("🏪 Nombre del banco:", nombreBanco);

      localStorage.setItem("bankToTransfer", banco);
      setBankName(nombreBanco);

      if (banco !== "152") {
        // Banco externo
        setManualName("Titular de cuenta externa");
        console.log("✅ Transferencia a banco externo configurada");
      } else {
        // Banco local - buscar nombre del titular
        try {
          const res = await fetch(`${API_URL}/accounts/owner/${manualAccount}`);
          if (!res.ok) throw new Error("Cuenta no encontrada");
          const data = await res.json();
          setManualName(data.name || "Titular desconocido");
          console.log("✅ Titular de cuenta local encontrado:", data.name);
        } catch (error) {
          console.error("❌ Error buscando titular:", error);
          setManualName("Titular no encontrado");
        }
      }
    };

    if (!useSubscribed && manualAccount.trim()) {
      buscarNombre();
    } else {
      setBankName("");
    }
  }, [manualAccount, useSubscribed, API_URL]);

  const selectedAccount = accounts.find((acc) => acc.number === fromAccount);
  const amountNumber = Number(amount);
  const isValidAmount =
    amountNumber > 0 && amountNumber <= (selectedAccount?.balance ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que el monto sea positivo
    if (!amount || Number(amount) <= 0) {
      alert("El monto debe ser mayor a 0.");
      return;
    }

    // Validar que el monto no exceda el saldo
    if (!isValidAmount) {
      alert("El monto excede el saldo disponible o es inválido.");
      return;
    }

    const finalToAccount = useSubscribed ? toAccount : manualAccount;
    const finalToName = useSubscribed
      ? subscribedAccounts.find((s) => s.number === toAccount)?.name || ""
      : manualName || "N/A";

    const transferData: TransferData = {
      fromAccount,
      toAccount: finalToAccount,
      toName: finalToName,
      amount: Number(amount),
      currency,
      description,
    };

    localStorage.setItem("pendingTransfer", JSON.stringify(transferData));
    onSubmit(transferData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-lg">
              <ArrowRightLeft className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Nueva Transferencia
            </h2>
            <p className="text-gray-600">
              Envía dinero de forma segura e instantánea
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
                  localStorage.setItem(
                    "bankFromTransfer",
                    fromAccount.slice(5, 8)
                  );
                }}
                className="input-modern w-full focus-ring"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.number}>
                    {acc.number} ({acc.currency})
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <motion.div
                  className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm text-blue-700">
                    <strong>Saldo disponible:</strong>{" "}
                    {formatCurrency(
                      selectedAccount.balance,
                      selectedAccount.currency
                    )}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Destino */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Building2 className="inline w-4 h-4 mr-2" />
                Destino
              </label>

              {/* Opciones de radio modernizadas */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <motion.label
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${useSubscribed
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="radio"
                    name="destino"
                    checked={useSubscribed}
                    onChange={() => setUseSubscribed(true)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-center flex-col">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${useSubscribed ? "bg-blue-500" : "bg-gray-300"
                        }`}
                    >
                      <Users
                        className={`w-4 h-4 ${useSubscribed ? "text-white" : "text-gray-600"
                          }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium ${useSubscribed ? "text-blue-700" : "text-gray-600"
                        }`}
                    >
                      Cuenta Suscrita
                    </span>
                  </div>
                </motion.label>

                <motion.label
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${!useSubscribed
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="radio"
                    name="destino"
                    checked={!useSubscribed}
                    onChange={() => setUseSubscribed(false)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-center flex-col">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${!useSubscribed ? "bg-blue-500" : "bg-gray-300"
                        }`}
                    >
                      <Building2
                        className={`w-4 h-4 ${!useSubscribed ? "text-white" : "text-gray-600"
                          }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium ${!useSubscribed ? "text-blue-700" : "text-gray-600"
                        }`}
                    >
                      Cuenta Manual
                    </span>
                  </div>
                </motion.label>
              </div>

              {/* Campos de destino */}
              <motion.div
                key={useSubscribed ? "subscribed" : "manual"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {useSubscribed ? (
                  <select
                    value={toAccount}
                    onChange={(e) => {
                      setToAccount(e.target.value);
                      const selected = subscribedAccounts.find(
                        (acc) => acc.number === e.target.value
                      );
                      if (selected) setManualName(selected.name);
                    }}
                    className="input-modern w-full focus-ring"
                    required
                  >
                    <option value="">Selecciona una cuenta suscrita</option>
                    {subscribedAccounts.map((acc) => (
                      <option key={acc.number} value={acc.number}>
                        {acc.name} - {acc.number}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={manualAccount}
                      onChange={(e) =>
                        setManualAccount(e.target.value.toUpperCase())
                      }
                      placeholder="Ej: CR2415200001234567890"
                      className="input-modern w-full focus-ring"
                      required
                    />
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Nombre del destinatario"
                      className="input-modern w-full focus-ring"
                      required
                      readOnly={getBankCodeFromIban(manualAccount) !== "152"}
                    />

                    {/* Mostrar información del banco detectado */}
                    {manualAccount.length >= 8 && (
                      <motion.div
                        className={`p-3 rounded-xl border ${getBankCodeFromIban(manualAccount) === "152"
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-200"
                          }`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="flex items-center">
                          <Building2
                            className={`w-4 h-4 mr-2 ${getBankCodeFromIban(manualAccount) === "152"
                              ? "text-green-700"
                              : "text-blue-700"
                              }`}
                          />
                          <div>
                            <p
                              className={`text-sm font-medium ${getBankCodeFromIban(manualAccount) === "152"
                                ? "text-green-700"
                                : "text-blue-700"
                                }`}
                            >
                              <strong>Banco detectado:</strong> {bankName}
                            </p>
                            {getBankCodeFromIban(manualAccount) !== "152" && (
                              <p className="text-xs text-blue-600 mt-1">
                                🌐 Transferencia externa - Se procesará vía red
                                interbancaria
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
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
              {!isValidAmount && amount && (
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
                Comentario (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Pago de factura, préstamo, etc."
                className="input-modern w-full resize-none focus-ring"
                rows={3}
              />
            </motion.div>

            {/* Botón de envío */}
            <motion.button
              type="submit"
              className="btn-primary-modern w-full py-4 text-lg font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowRightLeft className="inline w-5 h-5 mr-2" />
              Realizar Transferencia
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default TransferForm;
