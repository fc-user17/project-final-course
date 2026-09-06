# 🛡️ Módulo 5: Seguridad y Autenticación (Fase 1)

**Sistema Integral de Gestión Empresarial para Mantenimiento y Servicios Técnicos**
**Responsable:** Victor Hugo La Madrid Pacherres
**Rama sugerida:** `feature/modulo-5-login-roles`

---

## 📖 Descripción de la Rama

Esta rama contiene la implementación de la arquitectura de seguridad base del sistema. Se encarga de proteger el acceso a la plataforma mediante autenticación de credenciales, asegurar que las contraseñas nunca se expongan en texto plano, y establecer el control de acceso basado en roles (RBAC) para que cada trabajador solo vea los módulos que le corresponden.

---

## 🎯 Requerimientos Funcionales (RF)

*   **RF-501: Autenticación de Usuarios (Login).** Creación de la interfaz de inicio de sesión y validación de credenciales para generar una sesión segura (manejo de tokens).
*   **RF-502: Encriptación de Contraseñas.** Implementación de algoritmos de hashing unidireccional al momento de crear o actualizar un usuario, garantizando la privacidad de los datos.
*   **RF-503: Asignación y Gestión de Roles.** Estructuración de perfiles de usuario (Ej. Administrador, Técnico, Recursos Humanos) y restricción de rutas/vistas según el nivel de privilegios.

---

## 🏗️ Arquitectura y Tecnologías

Para mantener el presupuesto del proyecto en cero y agilizar el desarrollo, la arquitectura de autenticación se apoyará en herramientas con capas gratuitas robustas.

*   **Backend / Auth:** Supabase. Su módulo de autenticación nativo maneja automáticamente la encriptación de contraseñas de forma segura sin costo adicional.
*   **Base de Datos:** PostgreSQL (vía Supabase). Permite usar *Row Level Security* (RLS) para blindar los datos según el rol asignado a cada cuenta.
*   **Estructura de Datos Inicial:**
    *   Tabla `roles`: `id`, `nombre_rol`, `descripcion`
    *   Tabla `usuarios`: `id`, `email`, `password_hash`, `rol_id` (Foreign Key)

---

## 📋 Checklist de Tareas (Diagrama de Gantt)

- [ ] Definir e implementar el modelo de base de datos para `roles` y `usuarios`.
- [ ] Configurar el proveedor de autenticación y los servicios de encriptación en el backend.
- [ ] Crear el script de inserción (seeder) con los roles por defecto y un usuario administrador de prueba.
- [ ] Desarrollar el endpoint/función de Login que valide el usuario, compare el hash y devuelva la sesión.
- [ ] Implementar el *middleware* o guardián de rutas que bloquee el acceso a vistas no autorizadas según el `rol_id`.
