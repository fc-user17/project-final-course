/**
 * ============================================================================
 * Autor: VLM
 * Descripción: Módulo central de Autenticación y Control de Acceso Basado en Roles (RBAC).
 * 
 * Funcionalidades:
 * - Comunicación con el endpoint POST /api/auth/login de Spring Boot.
 * - Almacenamiento seguro del token JWT, rol y datos de usuario en localStorage.
 * - Interceptor global de fetch para inyectar automáticamente el header 'Authorization: Bearer <token>'.
 * - Protección de rutas según el rol (ADMIN, RRHH, FINANZAS, TECNICO).
 * - Renderizado dinámico de la barra de usuario y filtrado de módulos en el dashboard.
 * - Cierre de sesión (Logout).
 * ============================================================================
 */

(function () {
    // Configuración de la URL del backend
    window.API_URL = window.API_URL || "http://localhost:8080";

    // Constantes de almacenamiento
    const STORAGE_KEYS = {
        TOKEN: "auth_token",
        EMAIL: "auth_email",
        ROLE: "auth_role",
        TYPE: "auth_type"
    };

    // Matriz de permisos por página según el rol (RF-503: RBAC)
    // El rol ADMIN siempre tiene acceso a todo.
    const PAGE_PERMISSIONS = {
        "index.html": ["ADMIN", "RRHH", "FINANZAS", "TECNICO"],
        "personal.html": ["ADMIN", "RRHH"],
        "RRHH.html": ["ADMIN", "RRHH"],
        "rrhh.html": ["ADMIN", "RRHH"],
        "pagos.html": ["ADMIN", "FINANZAS"],
        "proveedores.html": ["ADMIN", "FINANZAS"],
        "compras.html": ["ADMIN", "FINANZAS"],
        "ventas.html": ["ADMIN", "FINANZAS"],
        "operaciones.html": ["ADMIN", "TECNICO"],
        "almacen.html": ["ADMIN", "TECNICO"],
        "asistencia-trabajador.html": ["ADMIN", "RRHH", "TECNICO", "FINANZAS"]
    };

    // Mapeo de tarjetas de módulos en index.html con sus roles permitidos
    const MODULE_PERMISSIONS = {
        "personal": ["ADMIN", "RRHH"],
        "compras": ["ADMIN", "FINANZAS"],
        "ventas": ["ADMIN", "FINANZAS"],
        "pagos": ["ADMIN", "FINANZAS"],
        "proveedores": ["ADMIN", "FINANZAS"],
        "operaciones": ["ADMIN", "TECNICO"],
        "almacen": ["ADMIN", "TECNICO"],
        "asistencia": ["ADMIN", "RRHH", "TECNICO", "FINANZAS"]
    };

    /**
     * Módulo principal de Autenticación expuesto globalmente como `window.auth`
     */
    window.auth = {
        /**
         * Envía las credenciales al backend para autenticar al usuario.
         * @param {string} email 
         * @param {string} password 
         * @returns {Promise<{success: boolean, message?: string, user?: object}>}
         */
        async login(email, password) {
            try {
                const response = await fetch(`${window.API_URL}/api/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 400) {
                        return {
                            success: false,
                            message: "Credenciales inválidas. Verifica tu correo y contraseña."
                        };
                    }
                    return {
                        success: false,
                        message: `Error de autenticación (${response.status}). Intenta nuevamente.`
                    };
                }

                // Respuesta exitosa del backend: { token, tipo, email, rol }
                const data = await response.json();

                // Guardar en localStorage
                localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
                localStorage.setItem(STORAGE_KEYS.EMAIL, data.email);
                localStorage.setItem(STORAGE_KEYS.ROLE, data.rol);
                localStorage.setItem(STORAGE_KEYS.TYPE, data.tipo || "Bearer");

                // Compatibilidad con sessionStorage usado en develop
                sessionStorage.setItem("autenticacion", data.token);
                sessionStorage.setItem("usuario", data.email);
                sessionStorage.setItem("rol", data.rol);

                return {
                    success: true,
                    user: {
                        email: data.email,
                        rol: data.rol,
                        token: data.token
                    }
                };
            } catch (error) {
                console.error("[Auth] Error de conexión:", error);
                throw error;
            }
        },

        /**
         * Cierra la sesión activa y redirige a la página de login.
         */
        logout() {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.EMAIL);
            localStorage.removeItem(STORAGE_KEYS.ROLE);
            localStorage.removeItem(STORAGE_KEYS.TYPE);

            sessionStorage.removeItem("autenticacion");
            sessionStorage.removeItem("usuario");
            sessionStorage.removeItem("rol");

            window.location.href = "login.html";
        },

        /**
         * Retorna el token JWT actual o null.
         */
        getToken() {
            return localStorage.getItem(STORAGE_KEYS.TOKEN);
        },

        /**
         * Retorna los datos del usuario logueado o null.
         */
        getUser() {
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            if (!token) return null;

            return {
                email: localStorage.getItem(STORAGE_KEYS.EMAIL),
                rol: localStorage.getItem(STORAGE_KEYS.ROLE),
                token: token,
                tipo: localStorage.getItem(STORAGE_KEYS.TYPE) || "Bearer"
            };
        },

        /**
         * Verifica si existe una sesión activa.
         */
        isAuthenticated() {
            return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
        },

        /**
         * Verifica si el usuario actual posee alguno de los roles permitidos.
         * El rol ADMIN tiene acceso irrestricto.
         * @param {string|string[]} roles 
         */
        hasRole(roles) {
            const user = this.getUser();
            if (!user) return false;
            if (user.rol === "ADMIN") return true;

            const allowed = Array.isArray(roles) ? roles : [roles];
            return allowed.includes(user.rol);
        }
    };

    /**
     * Interceptor global transparente de window.fetch.
     * Inyecta el header Authorization con el token JWT a todas las peticiones
     * hacia el backend de Spring Boot, sin necesidad de modificar el código existente.
     */
    const originalFetch = window.fetch;
    window.fetch = async function (resource, config = {}) {
        const token = window.auth.getToken();

        // Si la petición va dirigida a nuestra API y no es el endpoint de login/registro
        const urlStr = typeof resource === "string" ? resource : (resource && resource.url ? resource.url : "");
        const isBackendCall = urlStr.includes(window.API_URL) || urlStr.startsWith("/api/");
        const isAuthEndpoint = urlStr.includes("/api/auth/login") || urlStr.includes("/api/auth/registro");

        if (token && isBackendCall && !isAuthEndpoint) {
            config = config || {};
            config.headers = config.headers || {};

            // Compatibilidad si headers es Headers object o plano
            if (config.headers instanceof Headers) {
                if (!config.headers.has("Authorization")) {
                    config.headers.append("Authorization", `Bearer ${token}`);
                }
            } else {
                if (!config.headers["Authorization"]) {
                    config.headers["Authorization"] = `Bearer ${token}`;
                }
            }
        }

        const response = await originalFetch(resource, config);

        // Si el token expiró o fue rechazado con 401 en una ruta protegida
        if (response.status === 401 && isBackendCall && !isAuthEndpoint) {
            console.warn("[Auth] Token expirado o inválido. Redirigiendo a login...");
            alert("Tu sesión ha expirado o no es válida. Por favor, inicia sesión nuevamente.");
            window.auth.logout();
        }

        return response;
    };

    /**
     * Guardián de Rutas (Route Guard):
     * Se ejecuta al cargar la página y comprueba los permisos de acceso.
     */
    function verificarAccesoRuta() {
        // Obtener el nombre del archivo HTML actual
        const path = window.location.pathname;
        let currentPage = path.substring(path.lastIndexOf("/") + 1).toLowerCase();
        if (!currentPage || currentPage === "") currentPage = "index.html";

        const esPaginaLogin = currentPage === "login.html";

        // Si está en login.html y ya tiene sesión activa, enviarlo al inicio
        if (esPaginaLogin) {
            if (window.auth.isAuthenticated()) {
                window.location.href = "index.html";
            }
            return;
        }

        // Si está en cualquier otra página y NO está autenticado -> a login.html
        if (!window.auth.isAuthenticated()) {
            window.location.href = "login.html";
            return;
        }

        // Si está autenticado, validar si su rol tiene permiso para esta página específica
        const user = window.auth.getUser();
        const permisosRequeridos = PAGE_PERMISSIONS[currentPage];

        if (permisosRequeridos && user.rol !== "ADMIN" && !permisosRequeridos.includes(user.rol)) {
            alert(`Acceso Denegado: Tu rol (${user.rol}) no tiene autorización para acceder al módulo de ${currentPage.replace(".html", "").toUpperCase()}.`);
            window.location.href = "index.html";
            return;
        }

        // Renderizar la barra de usuario y adaptar la vista
        window.addEventListener("DOMContentLoaded", () => {
            renderizarBarraUsuario(user);
            aplicarFiltroModulos(user);
        });
    }

    /**
     * Renderiza una barra superior con la información del usuario autenticado,
     * su rol con badge distintivo y el botón de Cerrar Sesión.
     */
    function renderizarBarraUsuario(user) {
        if (!user || document.querySelector(".user-top-bar")) return;

        const bar = document.createElement("div");
        bar.className = "user-top-bar";
        bar.innerHTML = `
            <div class="user-info-section">
                <span>👤 Conectado como: <strong class="user-email-text">${user.email}</strong></span>
                <span class="role-badge role-${user.rol}">${user.rol}</span>
            </div>
            <div>
                <button type="button" class="btn-logout" id="btnLogoutNav" title="Cerrar sesión en el sistema">
                    🚪 Cerrar Sesión
                </button>
            </div>
        `;

        document.body.insertBefore(bar, document.body.firstChild);

        const btnLogout = document.getElementById("btnLogoutNav");
        if (btnLogout) {
            btnLogout.addEventListener("click", () => {
                if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
                    window.auth.logout();
                }
            });
        }
    }

    /**
     * Oculta o deshabilita los módulos en index.html que no corresponden al rol del usuario.
     */
    function aplicarFiltroModulos(user) {
        if (!user || user.rol === "ADMIN") return; // El ADMIN ve todo

        // Filtrar tarjetas en el dashboard
        Object.entries(MODULE_PERMISSIONS).forEach(([idModulo, rolesPermitidos]) => {
            const tarjeta = document.getElementById(idModulo);
            if (tarjeta) {
                const tieneAcceso = rolesPermitidos.includes(user.rol);
                if (!tieneAcceso) {
                    tarjeta.classList.add("bloqueada");
                    tarjeta.title = `Módulo restringido para el rol ${user.rol}`;
                    const btn = tarjeta.querySelector("a");
                    if (btn) {
                        btn.style.display = "none";
                    }
                    const aviso = document.createElement("span");
                    aviso.className = "badge-restringido";
                    aviso.textContent = "🔒 Restringido para tu rol";
                    tarjeta.appendChild(aviso);
                }
            }
        });

        // Filtrar enlaces en la barra de navegación <nav>
        const navLinks = document.querySelectorAll("nav a");
        navLinks.forEach(link => {
            const href = link.getAttribute("href");
            if (!href || href.startsWith("#") || href === "index.html") return;

            const targetPage = href.toLowerCase();
            const permisos = PAGE_PERMISSIONS[targetPage];
            if (permisos && !permisos.includes(user.rol)) {
                link.style.display = "none"; // Ocultar link no autorizado
            }
        });
    }

    // Ejecutar verificación de ruta inmediatamente
    verificarAccesoRuta();
})();
