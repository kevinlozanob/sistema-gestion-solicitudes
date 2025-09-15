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
-  Análisis automático de solicitudes
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
- **Gemini AI**
- **JWT** + **bcryptjs** (Autenticación)
- **Nodemailer** (Email)
- **ExcelJS** + **PDFKit** (Exportaciones)

### **Frontend**
- **React** 18.2.0 + **Vite**
- **Recharts** 2.8.0
- **Lucide React**
- **CSS-in-JS**

### **DevOps & Documentación**
- **Swagger** (Documentación API)
- **Postman Collection**
- **Prisma Migrations**
- **Seeds para datos de prueba**

## 🚀 **Instalación y Uso**

### **Prerrequisitos**
- Node.js 18+
- npm o yarn
- Servidor SMTP (Gmail/Outlook)

### **1. Clonar repositorio**
```bash
git clone <tu-repo>
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

### **Credenciales de Prueba**
- **Admin:** `admin@test.com` / `admin123`
- **Soporte:** `soporte1@test.com` / `soporte123`
- **Cliente:** `cliente1@test.com` / `cliente123`

### **URLs Importantes**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Documentación:** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/health

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


## **Autor**
Kevin Nicolas Lozano Bello - Desarrollador Full Stack
- Email: kebello776@gmail.com
