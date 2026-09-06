# 🛡️ Módulo 5: Gestión Documentaria y Seguridad

**Sistema Integral de Gestión Empresarial para Mantenimiento y Servicios Técnicos**
**Responsable del Módulo:** Victor Hugo La Madrid Pacherres
**Rama:** `feature/modulo-5-documentos-seguridad`

---

## 📖 Descripción del Módulo

Este módulo es el pilar transversal del sistema. Se encarga de garantizar que la información sensible de la empresa esté protegida, controlar quién accede a qué áreas, registrar cada movimiento importante para futuras auditorías, y administrar el ciclo de vida de todos los documentos legales, técnicos y laborales de la empresa.

A diferencia de un CRUD tradicional, este módulo actúa como el **cerebro de permisos y el archivo central** que conecta con los otros 4 módulos del ecosistema.

---

## 🎯 Requerimientos Funcionales (RF)

Para mantener una carga de trabajo equilibrada y realista, las funcionalidades de este módulo se dividen en dos grandes bloques: **Seguridad** y **Gestión Documental**.

### 🔒 Bloque 1: Seguridad y Accesos
- [ ] **RF-501: Autenticación de Usuarios.** Login, logout y sistema de recuperación de contraseñas seguro.
- [ ] **RF-502: Gestión de Usuarios.** CRUD de cuentas de usuario, incluyendo estados de cuenta (Activo, Inactivo, Bloqueado).
- [ ] **RF-503: Roles y Permisos (RBAC).** Creación de roles (Ej: Gerente, RRHH, Técnico, Almacenero) y asignación de permisos específicos de lectura/escritura por cada módulo.
- [ ] **RF-504: Auditoría y Bitácora de Actividades.** Registro automático e inmutable de acciones críticas (Ej: *El usuario [X] modificó el costo de la Orden [Y] el día [Z]*).

### 📂 Bloque 2: Gestión Documental
- [ ] **RF-505: Repositorio Centralizado.** Subida, descarga y visualización de documentos (PDFs, imágenes, Excel) categorizados por tipo (Contratos, Certificados, Informes, Órdenes).
- [ ] **RF-506: Control de Vencimientos y Alertas.** Sistema de notificaciones automáticas (en el dashboard) para documentos próximos a caducar (Ej: SOAT de vehículos, contratos de trabajadores, certificaciones de equipos).
- [ ] **RF-507: Control de Versiones.** Historial de modificaciones de un mismo documento para evitar pérdida de información.
- [ ] **RF-508: Vinculación Inter-módulos.** Capacidad de asociar un documento subido a una entidad externa (un trabajador de RR. HH., un equipo de Almacén, o una Orden de Trabajo de Operaciones).

---

## 🔗 Integración con otros Módulos

El Módulo 5 no funciona de manera aislada; provee servicios al resto del sistema:

1. **Con RR. HH. (Mód. 1):** Almacena y alerta sobre el vencimiento de contratos y documentos de identidad de los trabajadores. El empleado registrado en RR. HH. se vincula con un usuario del sistema creado aquí.
2. **Con Operaciones (Mód. 2):** Guarda de forma segura los informes técnicos, manuales y evidencias fotográficas de los mantenimientos.
3. **Con Almacén (Mód. 3):** Custodia manuales de equipos, garantías y certificaciones de calibración.
4. **Con Finanzas (Mód. 4):** Registra en la bitácora de auditoría cualquier modificación en los presupuestos o facturas para evitar fraudes internos.

---

## 🚀 Tecnologías y Herramientas (Sugerido)
*(Puedes modificar esta sección según el stack que estén usando en el equipo)*
* **Backend:** [Ej: Node.js / Java Spring / Python Django]
* **Base de Datos:** [Ej: PostgreSQL / MySQL / Supabase]
* **Almacenamiento de Archivos:** [Ej: AWS S3 / Supabase Storage / Cloudinary]
* **Autenticación:** [Ej: JWT (JSON Web Tokens) / OAuth2]

---

## 📋 Próximos Pasos (To-Do)
1. [ ] Diseñar el modelo Entidad-Relación (MER) para Tablas de Usuarios, Roles, Permisos, Documentos y Logs.
2. [ ] Desarrollar la API RESTful para el módulo de Autenticación.
3. [ ] Implementar el middleware de verificación de roles para proteger las rutas.
4. [ ] Configurar el bucket/storage para la carga de documentos.
