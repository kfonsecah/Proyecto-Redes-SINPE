import React from "react";
import { motion } from "framer-motion";
import {
  Home,
  Eye,
  Plus,
  UserPlus,
  ArrowRightLeft,
  Smartphone,
  CreditCard,
  Users,
  ChevronRight
} from "lucide-react";

interface SidebarItemProps {
  id: string;
  label: string;
  title?: string;
  image?: string | null;
  link?: string;
  isActive: boolean;
  onClick: (id: string) => void;
}

// Mapeo de iconos para cada sección
const getIcon = (id: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    home: <Home className="w-5 h-5" />,
    "ver-cuentas": <Eye className="w-5 h-5" />,
    "crear-cuenta": <Plus className="w-5 h-5" />,
    suscripcion: <CreditCard className="w-5 h-5" />,
    transferencia: <ArrowRightLeft className="w-5 h-5" />,
    "Suscripcion a Numero": <Smartphone className="w-5 h-5" />,
    "Sinpe Movil": <Smartphone className="w-5 h-5" />,
    "Creacion de Usuario": <UserPlus className="w-5 h-5" />,
  };

  return iconMap[id] || <Home className="w-5 h-5" />;
};

export const SidebarItem: React.FC<SidebarItemProps> = ({
  id,
  label,
  title,
  image,
  link,
  isActive,
  onClick,
}) => {
  return (
    <motion.button
      onClick={() => onClick(id)}
      className={`w-full text-left flex items-center gap-3 py-3 px-4 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden ${isActive
          ? "bg-gradient-primary text-white shadow-lg"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        }`}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Indicador activo */}
      {isActive && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
          layoutId="activeIndicator"
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        />
      )}

      {/* Icono o imagen */}
      <motion.div
        className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
        whileHover={{ scale: 1.1 }}
      >
        {image ? (
          <img src={image} alt={`${label} icon`} className="w-5 h-5 object-cover rounded" />
        ) : (
          getIcon(id)
        )}
      </motion.div>

      {/* Contenido */}
      <div className="text-left flex-1 min-w-0">
        <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </div>
        {title && (
          <div className={`text-xs truncate ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
            {title}
          </div>
        )}
        {link && (
          <div className={`text-[10px] truncate ${isActive ? 'text-blue-200' : 'text-blue-500'}`}>
            {link}
          </div>
        )}
      </div>

      {/* Indicador de navegación */}
      <motion.div
        className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}
        animate={{ x: isActive ? 2 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight className="w-4 h-4" />
      </motion.div>

      {/* Efecto de brillo en hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.5 }}
      />
    </motion.button>
  );
};
