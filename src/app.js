require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const requestsRouter = require('./routes/requests');
const reportsRouter = require('./routes/reports');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const emailService = require('./services/emailService');
const aiService = require('./services/aiService'); // ✅ NUEVO: Servicio IA

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true);

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://sistema-gestion-solicitudes-production.up.railway.app', 
    'https://sistema-gestion-solicitudes-production-1bf0.up.railway.app',
    'http://127.0.0.1:5173',
    'http://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: false // Deshabilitado para desarrollo local
}));


app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
  skip: (req) => {
    // No aplicar rate limit a endpoints de salud
    return req.path === '/health' || req.path === '/';
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/solicitudes', requestsRouter);
app.use('/reportes', require('./routes/reportes'));
app.use('/usuarios', require('./routes/usuarios'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "API Sistema de Solicitudes",
  customfavIcon: "/favicon.ico"
}));

app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API de Gestión de Solicitudes con IA',
    version: '2.0.0',
    features: [
      'Gestión completa de solicitudes',
      'Análisis automático con IA (Groq)',
      'Sistema de notificaciones por email',
      'Búsqueda avanzada con filtros',
      'Control de roles y permisos',
      'Historial de actividades'
    ],
    endpoints: {
      docs: '/api-docs',
      health: '/health',
      auth: '/auth/login',
      solicitudes: '/solicitudes',
      reportes: '/reportes'
    },
    ai_powered: true,
    groq_integration: true
  });
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validaciones de entrada
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Formato de datos inválido' });
    }
    
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        rol: user.rol,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Log de login 
    console.log(`Login exitoso: ${user.email} (${user.rol})`);
    
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/usuarios', async (req, res) => {
  try {
    let { nombre, email, password, rol } = req.body;

    // Validaciones mejoradas
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3) {
      return res.status(400).json({ error: 'Nombre debe tener al menos 3 caracteres' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (!password || typeof password !== 'string' || password.length < 6 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ 
        error: 'Contraseña debe tener al menos 6 caracteres, con letras y números' 
      });
    }
    if (!['CLIENTE', 'SOPORTE', 'ADMIN'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    
    nombre = nombre.trim();
    email = email.trim().toLowerCase();

    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }

    // Hash de contraseña con salt mayor para seguridad
    const hash = await bcrypt.hash(password, 12);

    // Crear usuario
    const usuario = await prisma.user.create({
      data: { nombre, email, password: hash, rol },
    });

    console.log(`Usuario creado: ${email} (${rol})`);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: { id: usuario.id, nombre, email, rol },
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/prueba-auth', auth(['ADMIN','SOPORTE','CLIENTE']), (req, res) => {
  res.json({ 
    mensaje: `🎯 Bienvenido ${req.user.email}, tu rol es ${req.user.rol}`,
    usuario: req.user,
    timestamp: new Date().toISOString(),
    ai_enabled: true
  });
});

app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    
    // Verificar servicios
    const emailConnected = await emailService.testConnection();
    const aiConnected = await aiService.testConnection();
    
    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      services: {
        database: 'OK',
        email: emailConnected ? 'OK' : 'ERROR',
        ai: aiConnected ? 'OK' : 'ERROR'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

app.use((req, res) => {
  console.log(`❌ 404 - Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method,
    suggestion: 'Consulta la documentación en /api-docs'
  });
});

app.use((error, req, res, next) => {
  console.error('❌ Error no manejado:', error);
  
  // Errores específicos
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  if (error.code === 'P2002') { // Prisma unique constraint
    return res.status(409).json({ error: 'Conflicto de datos únicos' });
  }
  
  if (error.code === 'P2025') { // Prisma record not found
    return res.status(404).json({ error: 'Recurso no encontrado' });
  }
  
  // Error genérico
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, async () => {
  console.log('\n🚀 ===============================================');
  console.log(`   SISTEMA DE SOLICITUDES CON IA INICIADO`);
  console.log('===============================================');
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log(`Documentación: http://localhost:${PORT}/api-docs`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  // Verificar servicios
  console.log('\n🔍 Verificando servicios...');
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Base de datos: Conectada');
  } catch (error) {
    console.log('Base de datos: Error de conexión');
  }
  
  const emailConnected = await emailService.testConnection();
  console.log(`${emailConnected ? '✅' : '❌'} Email service: ${emailConnected ? 'Conectado' : 'Error de conexión'}`);
  
  const aiConnected = await aiService.testConnection();
  console.log(`${aiConnected ? '✅' : '❌'} Groq AI service: ${aiConnected ? 'Conectado' : 'Error de conexión'}`);
  
  console.log('\n Sistema listo para recibir solicitudes!');
  console.log('===============================================\n');
});

// ✅ GRACEFUL SHUTDOWN - Cierre elegante del servidor
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Señal ${signal} recibida, cerrando servidor gracefully...`);
  
  server.close(async () => {
    console.log('🔌 Servidor HTTP cerrado');
    
    try {
      await prisma.$disconnect();
      console.log('🗄️ Base de datos desconectada');
      console.log('✅ Shutdown completado exitosamente');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error cerrando base de datos:', error);
      process.exit(1);
    }
  });
  
  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    console.error('⏰ Timeout alcanzado, forzando cierre del servidor');
    process.exit(1);
  }, 10000);
};

// ✅ SIGNAL HANDLERS - Manejo de señales del sistema
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ✅ EXCEPTION HANDLERS - Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('💥 Excepción no capturada:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚫 Promesa rechazada no manejada en:', promise);
  console.error('Razón:', reason);
  process.exit(1);
});

// ✅ MEMORY MONITORING - Opcional: monitoreo de memoria
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const usage = process.memoryUsage();
    const formatMemory = (bytes) => Math.round(bytes / 1024 / 1024) + ' MB';
    
    if (usage.heapUsed > 100 * 1024 * 1024) { // > 100MB
      console.log(`⚠️ Alto uso de memoria: ${formatMemory(usage.heapUsed)}`);
    }
  }, 60000); // Cada minuto
}

module.exports = app;