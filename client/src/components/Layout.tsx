import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import Home from "../pages/Home";
import CreateAccountForm from "./AccountForm";
import ViewAccounts from "../pages/ViewAccounts";
import SubscribeAccount from "./SubscribeAccount";
import Transferencia from "./Transferencia";
import CreateUser from "./CreateUser";
import PhoneLink from "./PhoneLink";
import SinpeTransfer from "./SinpeTransfer";

export interface Account {
  id: string;
  name: string;
  number: string;
  balance: number;
}

export const Layout: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState("home");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user?.name || "";

  const sections = [
    {
      id: "home",
      label: "Inicio",
      title: "Bienvenida a NovaBank",
      content: <Home />,
    },
    {
      id: "ver-cuentas",
      label: "Ver Cuentas",
      title: "Cuentas Registradas",
      content: <ViewAccounts />,
    },
    {
      id: "suscripcion",
      label: "Suscripción",
      title: "Suscripción a Cuentas",
      content: <SubscribeAccount />,
    },
    {
      id: "transferencia",
      label: "Transferencias",
      title: "Realizar transferencia",
      content: <Transferencia />,
    },
    {
      id: "Suscripcion a Numero",
      label: " Suscripción a Sinpe Movil",
      title: "Asociar cuenta a número de teléfono",
      content: <PhoneLink />,
    },
    {
      id: "Sinpe Movil",
      label: "Sinpe Movil",
      title: "Realizar transferencia a través de Sinpe Móvil",
      content: <SinpeTransfer />,
    }
  ];

  // Agrega secciones solo si el usuario es admin
  if (username.toLowerCase() === "admin") {
    sections.splice(1, 0, {
      id: "crear-cuenta",
      label: "Crear Cuenta",
      title: "Formulario de nueva cuenta",
      content: <CreateAccountForm />,
    });
    sections.push({
      id: "Creacion de Usuario",
      label: "Crear Usuario",
      title: "Crear un nuevo usuario",
      content: <CreateUser />,
    });
  }

  const activeContent = sections.find((s) => s.id === activeTabId)?.content;
  const activeSection = sections.find((s) => s.id === activeTabId);

  const handleTabChange = (newTabId: string) => {
    setActiveTabId(newTabId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex">
      <Sidebar
        sections={sections.map((s) => ({
          ...s,
          onClick: () => handleTabChange(s.id),
          isActive: s.id === activeTabId,
        }))}
      />

      <main className="ml-[300px] flex-1 overflow-hidden">
        {/* Header con título de la sección activa */}
        <motion.div
          className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            key={activeTabId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeSection?.label}
                </h1>
                <p className="text-gray-600 mt-1">
                  {activeSection?.title}
                </p>
              </div>

              {/* Indicador de usuario */}
              <motion.div
                className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{username}</p>
                  <p className="text-gray-500 text-xs">
                    {username.toLowerCase() === "admin" ? "Administrador" : "Cliente"}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Contenido principal con animaciones */}
        <div className="h-[calc(100vh-88px)] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabId}
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{
                duration: 0.4,
                ease: "easeInOut"
              }}
              className="h-full"
            >
              {activeContent}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Elementos decorativos de fondo */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-20 right-20 w-32 h-32 bg-blue-200 rounded-full opacity-10"
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 left-20 w-24 h-24 bg-purple-200 rounded-full opacity-10"
            animate={{
              y: [0, 20, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>
      </main>
    </div>
  );
};
