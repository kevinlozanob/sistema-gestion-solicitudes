# Sistema de Gestión de Solicitudes con IA

## 📋 Descripción
Sistema completo de gestión de solicitudes de soporte técnico con integración de **Inteligencia Artificial**, análisis automático, notificaciones inteligentes y reportes avanzados.

##  Características Principales

### **Autenticación & Seguridad**
- JWT Authentication con roles (CLIENTE, SOPORTE, ADMIN)
- Rate limiting (100 req/15min)
- Helmet para headers de seguridad
- CORS configurado
- Validaciones robustas
- Sanitización de inputs

### **INTELIGENCIA ARTIFICIAL**
-  Análisis automático de solicitudes con Groq AI
-  Categorización inteligente
-  Respuestas sugeridas
-  Estimación de tiempos
-  Priorización automática

###  **Reportes Avanzados**
-  Dashboard en tiempo real
-  Gráficos interactivos (Recharts)
-  Exportación Excel/PDF
-  Métricas por soporte
-  Análisis de tendencias

###  **Sistema de Notificaciones**
-  Email automático al crear solicitudes
-  Notificaciones con análisis IA
-  Templates HTML profesionales
-  Notificaciones de asignación

## 🛠 **Tecnologías Utilizadas**

### **Backend**
- **Node.js** + **Express.js**
- **Prisma ORM** 6.16.1 + **SQLite**
- **Groq AI** (Inteligencia Artificial)
- **JWT** + **bcryptjs** (Autenticación)
- **Nodemailer** (Email)
- **ExcelJS** + **PDFKit** (Exportaciones)
- **Helmet** + **CORS** + **Rate Limiting** (Seguridad)

### **Frontend**
- **React** 18.2.0 + **Vite**
- **Recharts** 2.8.0 (Gráficos)
- **Lucide React** (Iconos)
- **CSS-in-JS** (Estilos)

### **DevOps & Documentación**
- **Swagger** (Documentación API)
- **Postman Collection** (Testing)
- **Railway** (Deployment)
- **Prisma Migrations**
- **Seeds para datos de prueba**

## 🚀 **Instalación y Uso**

### **Prerrequisitos**
- Node.js 18+
- npm o yarn
- Servidor SMTP (Gmail/Outlook)
- API Key de Groq AI (opcional para IA)

### **1. Clonar repositorio**
```bash
git clone https://github.com/kevinlozanob/sistema-gestion-solicitudes.git
cd sistema-gestion-solicitudes
```

### **2. Instalar dependencias**
```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### **3. Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### **4. Configurar base de datos**
```bash
npx prisma generate
npx prisma db push
npm run seed
```

### **5. Ejecutar aplicación**
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## **Cómo Probar la Aplicación**

### **🌐 Demo en Producción**
- **Frontend:** https://sistema-gestion-solicitudes-production-1bf0.up.railway.app
- **Backend API:** https://sistema-gestion-solicitudes-production.up.railway.app
- **Documentación:** https://sistema-gestion-solicitudes-production.up.railway.app/api-docs
- **Health Check:** https://sistema-gestion-solicitudes-production.up.railway.app/health

### **🏠 Desarrollo Local**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Documentación:** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/health

### **Credenciales de Prueba**
- **Admin:** `admin@test.com` / `admin123`
- **Soporte:** `soporte1@test.com` / `soporte123`
- **Cliente:** `cliente1@test.com` / `cliente123`

### **Flujo de Prueba Completo**

#### **Como Cliente:**
1. Login con `cliente1@test.com`
2. Crear nueva solicitud (IA analiza automáticamente)
3. Ver estado en "Mis Solicitudes"
4. Usar búsqueda avanzada

#### **Como Soporte:**
1. Login con `soporte1@test.com`
2. Ver solicitudes asignadas
3. Generar respuesta con IA
4. Actualizar estado a "EN_PROCESO" → "CERRADA"

#### **Como Admin:**
1. Login con `admin@test.com`
2. Ver dashboard de reportes
3. Gestionar usuarios
4. Exportar reportes Excel/PDF
5. Asignar solicitudes a soportes

## **🎯 Estado de Implementación**

### **✅ Funcionalidades Implementadas (100%)**
- [x] **Sistema de autenticación JWT** con 3 roles (CLIENTE, SOPORTE, ADMIN)
- [x] **CRUD completo de solicitudes** con validaciones robustas
- [x] **🤖 INTELIGENCIA ARTIFICIAL integrada** (Groq AI)
  - [x] Análisis automático de solicitudes
  - [x] Categorización inteligente
  - [x] Respuestas sugeridas
  - [x] Estimación de tiempos
- [x] **Sistema de notificaciones por email** con templates HTML
- [x] **Dashboard de reportes avanzados** con gráficos interactivos
- [x] **Exportación de reportes** (Excel + PDF)
- [x] **Búsqueda avanzada** con múltiples filtros
- [x] **Gestión completa de usuarios**
- [x] **Historial de actividades** por solicitud
- [x] **Documentación API completa** (Swagger)
- [x] **Seguridad avanzada** (Rate limiting, CORS, Helmet)
- [x] **Base de datos** con migraciones y seeds
- [x] **Deployment en producción** (Railway)

### **⚡ Funcionalidades EXTRA implementadas**
- [x] **Integración con IA** (no solicitada originalmente)
- [x] **Sistema de notificaciones** avanzado
- [x] **Reportes con gráficos** interactivos
- [x] **Exportación Excel/PDF**
- [x] **Documentación Swagger** completa
- [x] **Colección Postman** para testing
- [x] **Interfaz moderna** con diseño responsivo
- [x] **Análisis de métricas** en tiempo real

### **🚫 Pendientes (0%)**
**TODAS las funcionalidades solicitadas están implementadas y funcionando.**

### **🏆 Lo que superó las expectativas**
- **IA completamente funcional** con análisis real de solicitudes usando  AI
- **Interfaz profesional** con diseño moderno y responsivo
- **Sistema de reportes** con métricas avanzadas y visualizaciones
- **Notificaciones inteligentes** con análisis IA incorporado
- **Documentación exhaustiva** con ejemplos y testing completo
- **Deployment en producción** funcional en Railway
- **Arquitectura escalable** y código bien estructurado

##  **Testing con Postman**
```bash
# Importar colección
postman_collection.json
```

## 🎊 **Arquitectura del Proyecto**

```
├── backend/
│   ├── src/
│   │   ├── app.js              # Servidor principal
│   │   ├── middleware/         # Autenticación, validaciones
│   │   ├── routes/            # Endpoints REST
│   │   └── services/          # IA, Email, Lógica de negocio
│   ├── prisma/               # Base de datos y migraciones
│   └── database/             # Seeds de datos
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   └── pages/           # Páginas principales
│   └── public/
├── docs/
│   ├── swagger.yaml         # Documentación API
│   └── postman_collection.json
└── README.md               # Este archivo
```

## **📊 Métricas del Proyecto**
- **Líneas de código:** ~3,500+ líneas
- **Endpoints API:** 25+ endpoints
- **Componentes React:** 15+ componentes
- **Tiempo de desarrollo:** Completado según especificaciones
- **Cobertura de funcionalidades:** 100% + extras

## **Autor**
Kevin Nicolas Lozano Bello - Desarrollador Full Stack
- Email: kebello776@gmail.com
- GitHub: https://github.com/kevinlozanob/sistema-gestion-solicitudes