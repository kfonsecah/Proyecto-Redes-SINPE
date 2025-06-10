import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, CreditCard, User, DollarSign, Phone, Building2 } from "lucide-react";

interface Account {
    id: string;
    number: string;
    currency: string;
    balance: number;
}

const PullFunds: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [localAccountNumber, setLocalAccountNumber] = useState("");
    const [externalAccountNumber, setExternalAccountNumber] = useState("");
    const [cedula, setCedula] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");

    const API_URL = import.meta.env.VITE_API_URL;

    // Función para extraer el código del banco del IBAN
    const getBankCodeFromIban = (iban: string): string => {
        if (iban.length >= 8) {
            return iban.substring(5, 8); // Posiciones 5-7 (0-indexed)
        }
        return "";
    };

    // Función para obtener el nombre del banco basado en el código
    const getBankName = (bankCode: string): string => {
        const bankNames: Record<string, string> = {
            "152": "NovaBank (Local)",
            "241": "Banco Nacional",
            "151": "Banco Popular",
            "161": "BCR"
        };
        return bankNames[bankCode] || `Banco ${bankCode}`;
    };

    // Función para obtener la configuración del banco
    const getBankConfig = (bankCode: string) => {
        const bankConfigs: Record<string, { ip: string; puerto: string }> = {
            "241": { ip: "192.168.4.10", puerto: "5050" },
            "151": { ip: "192.168.4.11", puerto: "5051" },
            "161": { ip: "192.168.4.12", puerto: "5052" }
        };
        return bankConfigs[bankCode];
    };

    useEffect(() => {
        // Cargar cuentas del usuario
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const username = user?.name || "";

        fetch(`${API_URL}/accounts?user=${encodeURIComponent(username)}`)
            .then((res) => res.json())
            .then((data: Account[]) => {
                setAccounts(data);
                if (data.length > 0) {
                    setLocalAccountNumber(data[0].number);
                }
            })
            .catch((error) => {
                console.error("Error al cargar cuentas:", error);
                setMessage("Error al cargar cuentas");
                setMessageType("error");
            });
    }, [API_URL]);

    const selectedAccount = accounts.find((acc) => acc.number === localAccountNumber);
    const externalBankCode = getBankCodeFromIban(externalAccountNumber);
    const externalBankName = getBankName(externalBankCode);
    const isValidIban = externalAccountNumber.length >= 8;
    const isExternalBank = externalBankCode !== "152"; // 152 es nuestro código local

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!externalAccountNumber || !cedula || !amount || !localAccountNumber) {
            setMessage("Por favor complete todos los campos");
            setMessageType("error");
            return;
        }

        if (!isValidIban) {
            setMessage("Por favor ingrese un IBAN válido");
            setMessageType("error");
            return;
        }

        if (!isExternalBank) {
            setMessage("No puede traer fondos de una cuenta del mismo banco. Use transferencias normales.");
            setMessageType("error");
            return;
        }

        if (Number(amount) <= 0) {
            setMessage("El monto debe ser mayor a 0");
            setMessageType("error");
            return;
        }

        const bankConfig = getBankConfig(externalBankCode);
        if (!bankConfig) {
            setMessage(`El banco ${externalBankName} no está disponible para pull funds`);
            setMessageType("error");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(`${API_URL}/enviar-pull-funds`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    account_number: externalAccountNumber,
                    cedula: cedula,
                    monto: Number(amount),
                    bancoDestino: {
                        codigo: externalBankCode,
                        nombre: externalBankName,
                        ip: bankConfig.ip,
                        puerto: bankConfig.puerto
                    },
                    localAccountNumber: localAccountNumber
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`✅ Fondos transferidos exitosamente: ₡${amount} desde ${externalBankName}`);
                setMessageType("success");

                // Limpiar formulario
                setExternalAccountNumber("");
                setCedula("");
                setAmount("");

                // Recargar cuentas para mostrar el nuevo balance
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                setMessage(`❌ Error: ${data.error || data.details || "Error desconocido"}`);
                setMessageType("error");
            }
        } catch (error: any) {
            console.error("Error en pull funds:", error);
            setMessage(`❌ Error de conexión: ${error.message}`);
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
            <div className="container-modern max-w-2xl mx-auto">
                <motion.div
                    className="card-modern p-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Header */}
                    <motion.div
                        className="text-center mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
                            <Download className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Traer Fondos
                        </h2>
                        <p className="text-gray-600">
                            Transfiere dinero desde tus cuentas en otros bancos usando tu cédula
                        </p>
                    </motion.div>

                    {/* Mensaje de estado */}
                    {message && (
                        <motion.div
                            className={`mb-6 p-4 rounded-xl border ${messageType === "success"
                                    ? "bg-green-50 border-green-200 text-green-700"
                                    : "bg-red-50 border-red-200 text-red-700"
                                }`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            {message}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Cuenta local destino */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                <CreditCard className="inline w-4 h-4 mr-2" />
                                Cuenta local (destino)
                            </label>
                            <select
                                value={localAccountNumber}
                                onChange={(e) => setLocalAccountNumber(e.target.value)}
                                className="input-modern w-full focus-ring"
                                required
                            >
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.number}>
                                        {acc.number} ({acc.currency}) - ₡{acc.balance.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </motion.div>

                        {/* Cuenta externa con detección automática del banco */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                <CreditCard className="inline w-4 h-4 mr-2" />
                                Número de cuenta IBAN (origen)
                            </label>
                            <input
                                type="text"
                                value={externalAccountNumber}
                                onChange={(e) => setExternalAccountNumber(e.target.value.toUpperCase())}
                                placeholder="Ej: CR2124100001234567890"
                                className="input-modern w-full focus-ring"
                                required
                            />
                            {isValidIban && (
                                <motion.div
                                    className={`mt-3 p-3 rounded-xl border ${isExternalBank
                                            ? "bg-blue-50 border-blue-200"
                                            : "bg-orange-50 border-orange-200"
                                        }`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="flex items-center">
                                        <Building2 className={`w-4 h-4 mr-2 ${isExternalBank ? "text-blue-700" : "text-orange-700"
                                            }`} />
                                        <p className={`text-sm font-medium ${isExternalBank ? "text-blue-700" : "text-orange-700"
                                            }`}>
                                            Banco detectado: {externalBankName}
                                        </p>
                                    </div>
                                    {!isExternalBank && (
                                        <p className="text-xs text-orange-600 mt-1">
                                            Esta es una cuenta del mismo banco. Use transferencias normales.
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Cédula */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                <User className="inline w-4 h-4 mr-2" />
                                Número de cédula
                            </label>
                            <input
                                type="text"
                                value={cedula}
                                onChange={(e) => setCedula(e.target.value)}
                                placeholder="Ej: 123456789"
                                className="input-modern w-full focus-ring"
                                required
                            />
                        </motion.div>

                        {/* Monto */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                <DollarSign className="inline w-4 h-4 mr-2" />
                                Monto a transferir
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="input-modern w-full focus-ring"
                                required
                                min="0.01"
                                step="0.01"
                            />
                        </motion.div>

                        {/* Botón de envío */}
                        <motion.button
                            type="submit"
                            disabled={loading || !isExternalBank || !isValidIban}
                            className="btn-primary-modern w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                        >
                            {loading ? (
                                <>
                                    <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Download className="inline w-5 h-5 mr-2" />
                                    Traer Fondos
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Información adicional */}
                    <motion.div
                        className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <p className="text-sm text-blue-700">
                            <Phone className="inline w-4 h-4 mr-1" />
                            <strong>Nota:</strong> El banco de destino se detecta automáticamente del IBAN. Se verificará que la cédula proporcionada esté asociada a la cuenta antes de procesar la transferencia.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default PullFunds;