import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface TransferData {
  fromAccount: string;
  toAccount: string;
  toName: string;
  amount: number;
  currency: string;
  description?: string;
}

interface Props {
  data?: TransferData;
  onConfirm: () => void;
  onCancel: () => void;
}

const TransferSummary: React.FC<Props> = ({ data, onConfirm, onCancel }) => {
  const [transfer, setTransfer] = useState<TransferData | null>(data || null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!data) {
      const saved = localStorage.getItem("pendingTransfer");
      if (saved) {
        setTransfer(JSON.parse(saved));
      }
    }
  }, [data]);

  if (!transfer) return <p className="text-center">Cargando datos...</p>;

  const { fromAccount, toAccount, toName, amount, currency, description } =
    transfer;

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      CRC: "₡",
      USD: "$",
      EUR: "€",
    };
    return `${symbols[currency] || ""} ${amount.toLocaleString()}`;
  };

  const handleConfirm = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const bankToTransfer = localStorage.getItem("bankToTransfer");
    const bankFromTransfer = localStorage.getItem("bankFromTransfer");

    const payloadBase = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      transaction_id: uuidv4(),
      sender: {
        account_number: fromAccount,
        bank_code: bankFromTransfer || "quien envia",
        name: user.name || "Desconocido",
      },
      receiver: {
        account_number: toAccount,
        bank_code: bankToTransfer || "quien recibe",
        name: toName,
      },
      amount: {
        value: amount,
        currency,
      },
      description: description || "Transferencia SINPE",
    };

    try {
      // Obtener HMAC desde la API
      const hmacRes = await fetch(`${API_URL}/transactions/hmac`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBase),
      });

      const { hmac_md5 } = await hmacRes.json();

      const finalPayload = {
        ...payloadBase,
        hmac_md5,
      };

      // Enviar transacción completa
      const trxRes = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      if (!trxRes.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const result = await trxRes.json();

      console.log("✅ Transacción enviada:", finalPayload);
      console.log("📬 Respuesta del servidor:", result);

      // Validar que recibimos ACK del servidor
      if (result.status === "ACK" && result.transaction_id === finalPayload.transaction_id) {
        console.log("✅ ACK confirmado - Transferencia exitosa");
        localStorage.removeItem("pendingTransfer");
        onConfirm();
      } else {
        console.error("❌ No se recibió ACK válido:", result);
        throw new Error("La transferencia no fue confirmada por el banco destino");
      }

    } catch (error: any) {
      console.error("❌ Error al confirmar transferencia:", error);

      // Extraer mensaje de error más específico
      let errorMessage = "Error desconocido";

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Mostrar error específico al usuario
      alert(`❌ No se pudo completar la transferencia:\n\n${errorMessage}\n\nVerifica que todos los datos sean correctos.`);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-8">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">
        Confirmar Transferencia
      </h2>

      <div className="space-y-4 text-base text-gray-800">
        <p>
          <strong>Cuenta origen:</strong> {fromAccount}
        </p>
        <p>
          <strong>Cuenta destino:</strong> {toAccount}
        </p>
        <p>
          <strong>Nombre destinatario:</strong> {toName}
        </p>
        <p>
          <strong>Monto a transferir:</strong>{" "}
          {formatCurrency(amount, currency)}
        </p>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onCancel}
          className="bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-md hover:bg-gray-300 transition"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-700 transition"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default TransferSummary;
