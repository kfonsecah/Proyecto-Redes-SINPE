import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface SinpeTransferData {
  fromAccount: string;
  phone: string;
  amount: number;
  currency: string;
  comment?: string;
}

interface Props {
  data?: SinpeTransferData;
  onConfirm: () => void;
  onCancel: () => void;
}

const SinpeTransferSummary: React.FC<Props> = ({
  data,
  onConfirm,
  onCancel,
}) => {
  const [transfer, setTransfer] = useState<SinpeTransferData | null>(
    data || null
  );
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!data) {
      const saved = localStorage.getItem("pendingSinpeTransfer");
      if (saved) setTransfer(JSON.parse(saved));
    }
  }, [data]);

  const handleConfirm = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const bank_Receiver = JSON.parse(
      localStorage.getItem("receiverInfo") || "{}"
    );
    const bank_Sender = localStorage.getItem("senderAccount") || "BANK";
    const sender_phone = localStorage.getItem("senderInfo") || "";

    const payload = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      transaction_id: uuidv4(),
      sender: {
        phone: sender_phone,
        bank_code: bank_Sender,
        name: user.name || "Desconocido",
      },
      receiver: {
        phone: transfer?.phone,
        bank_code: bank_Receiver.bank_code,
        name: bank_Receiver.name,
      },
      amount: {
        value: transfer?.amount,
        currency: transfer?.currency,
      },
      description: transfer?.comment || "Transferencia SINPE desde app demo",
    };

    console.log(payload);

    try {
      const hmacRes = await fetch(`${API_URL}/transactions/hmac`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const { hmac_md5 } = await hmacRes.json();

      const finalPayload = { ...payload, hmac_md5 };

      const sinpeRes = await fetch(`${API_URL}/sinpe-movil`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      if (!sinpeRes.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const result = await sinpeRes.json();

      console.log("✅ Transferencia SINPE enviada:", finalPayload);
      console.log("📬 Respuesta del servidor:", result);

      // Validar que recibimos ACK del servidor para SINPE Móvil
      if (result.status === "ACK" && result.transaction_id === finalPayload.transaction_id) {
        console.log("✅ ACK SINPE confirmado - Transferencia exitosa");
        localStorage.removeItem("pendingSinpeTransfer");
        onConfirm();
      } else {
        console.error("❌ No se recibió ACK válido para SINPE:", result);
        throw new Error("La transferencia SINPE no fue confirmada por el banco destino");
      }

    } catch (error: any) {
      console.error("❌ Error al enviar SINPE:", error);

      // Extraer mensaje de error más específico
      let errorMessage = "Error desconocido";

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Mostrar error específico al usuario
      alert(`❌ No se pudo completar la transferencia SINPE:\n\n${errorMessage}\n\nTus fondos no han sido descontados.`);
    }
  };

  if (!transfer) return <p>Cargando...</p>;

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-8">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">
        Confirmar Transferencia SINPE
      </h2>
      <div className="space-y-4">
        <p>
          <strong>Cuenta origen:</strong> {transfer.fromAccount}
        </p>
        <p>
          <strong>Teléfono destino:</strong> {transfer.phone}
        </p>
        <p>
          <strong>Monto:</strong> {transfer.amount.toLocaleString()}{" "}
          {transfer.currency}
        </p>
        {transfer.comment && (
          <p>
            <strong>Comentario:</strong> {transfer.comment}
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-between">
        <button onClick={onCancel} className="bg-gray-200 py-2 px-4 rounded-md">
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default SinpeTransferSummary;
