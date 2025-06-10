import React from "react";
import { motion } from "framer-motion";
import {
  Shield,
  CreditCard,
  ArrowRightLeft,
  Smartphone,
  TrendingUp,
  Clock,
  Lock,
  Users
} from "lucide-react";

const Home: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user?.name || "Usuario";
  const isAdmin = username.toLowerCase() === "admin";

  const features = [
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Cuentas Digitales",
      description: "Gestiona tus cuentas bancarias de forma segura y eficiente",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <ArrowRightLeft className="w-8 h-8" />,
      title: "Transferencias",
      description: "Realiza transferencias instantáneas entre cuentas",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "SINPE Móvil",
      description: "Paga y recibe dinero usando solo un número de teléfono",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Seguridad",
      description: "Protección avanzada con encriptación de extremo a extremo",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const stats = [
    { label: "Transacciones Seguras", value: "99.9%", icon: <Lock className="w-5 h-5" /> },
    { label: "Disponibilidad", value: "24/7", icon: <Clock className="w-5 h-5" /> },
    { label: "Usuarios Activos", value: "50K+", icon: <Users className="w-5 h-5" /> },
    { label: "Crecimiento", value: "+15%", icon: <TrendingUp className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <motion.div
        className="relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-10 right-10 w-72 h-72 bg-blue-400 rounded-full opacity-10"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-96 h-96 bg-purple-400 rounded-full opacity-10"
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 25, repeat: Infinity }}
          />
        </div>

        <div className="relative z-10 container-modern py-20">
          {/* Saludo personalizado */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👋
              </motion.span>
              <span className="ml-2">
                ¡Bienvenido{isAdmin ? " Administrador" : ""}, {username}!
              </span>
            </motion.div>

            <h1 className="heading-primary mb-6">
              Tu Banca Digital
              <motion.span
                className="block text-transparent bg-clip-text bg-gradient-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Nueva Generación
              </motion.span>
            </h1>

            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              Gestiona tus finanzas de manera inteligente, segura y eficiente.
              Realiza transferencias, consulta saldos y administra tus cuentas con la mejor tecnología bancaria.
            </motion.p>
          </motion.div>

          {/* Estadísticas */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="card-modern p-6 text-center hover-lift"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-xl mb-3"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <div className="text-white">{stat.icon}</div>
                </motion.div>
                <motion.div
                  className="text-2xl font-bold text-gray-900 mb-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.4 + index * 0.1, type: "spring" }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Características principales */}
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card-modern p-8 text-center hover-lift group"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 + index * 0.2 }}
                whileHover={{ scale: 1.02, y: -10 }}
              >
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <div className="text-white">{feature.icon}</div>
                </motion.div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

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

          {/* Call to action */}
          <motion.div
            className="text-center mt-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
          >
            <motion.div
              className="inline-flex items-center gap-6 bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  ¿Listo para comenzar?
                </h3>
                <p className="text-gray-600 text-sm">
                  Utiliza el menú lateral para acceder a todas las funcionalidades
                </p>
              </div>
              <motion.div
                className="flex-shrink-0"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <ArrowRightLeft className="w-6 h-6 text-white" />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
