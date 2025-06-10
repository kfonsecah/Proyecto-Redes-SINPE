import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Shield } from "lucide-react";
import { SidebarItem } from "./sidebarItem";

interface Section {
  id: string;
  label: string;
  title?: string;
  image?: string | null;
  link?: string;
  isActive: boolean;
  onClick: () => void;
}

interface SidebarProps {
  sections: Section[];
}

export const Sidebar: React.FC<SidebarProps> = ({ sections }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/", { replace: true });
    window.location.reload();
    localStorage.removeItem("user");
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user?.name || "Usuario";
  const isAdmin = username.toLowerCase() === "admin";

  return (
    <motion.aside
      className="w-full max-w-xs bg-white border-r border-gray-200 h-screen fixed left-0 top-0 shadow-xl flex flex-col"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header del sidebar */}
      <motion.div
        className="p-6 border-b border-gray-100 bg-gradient-primary"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <Shield className="w-6 h-6 text-white" />
          </motion.div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">NovaBank</h2>
            <p className="text-blue-100 text-sm">Banca Digital</p>
          </div>
        </div>
      </motion.div>

      {/* Información del usuario */}
      <motion.div
        className="p-4 bg-gray-50 border-b border-gray-100"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-medium text-sm truncate">
              {username}
            </p>
            <p className="text-gray-500 text-xs">
              {isAdmin ? "Administrador" : "Cliente"}
            </p>
          </div>
          {isAdmin && (
            <motion.div
              className="w-2 h-2 bg-gradient-gold rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </motion.div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <SidebarItem
              id={section.id}
              label={section.label}
              title={section.title}
              image={section.image}
              link={section.link}
              isActive={section.isActive}
              onClick={() => section.onClick()}
            />
          </motion.div>
        ))}
      </nav>

      {/* Footer con botón de logout */}
      <motion.div
        className="p-4 border-t border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 py-3 px-4 rounded-xl font-semibold transition-all duration-200 border border-red-200"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </motion.button>

        {/* Información de seguridad */}
        <motion.div
          className="mt-3 text-center"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <p className="text-xs text-gray-400">🔒 Sesión segura</p>
        </motion.div>
      </motion.div>
    </motion.aside>
  );
};
