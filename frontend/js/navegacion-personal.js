
document.addEventListener("DOMContentLoaded", function () {
    const secciones = document.querySelectorAll(
        ".rrhh-layout .page-section"
    );

    const enlacesMenu = document.querySelectorAll(
        ".rrhh-layout .sidebar-nav .nav-link"
    );

    function mostrarSeccion(id, desplazarse = true) {
        const destino = document.getElementById(id);

        if (!destino) {
            return;
        }

        const seccion = destino.classList.contains("page-section")
            ? destino
            : destino.closest(".page-section");

        if (!seccion) {
            return;
        }

        // Ocultar las demás secciones.
        secciones.forEach(function (elemento) {
            elemento.classList.remove("active-section");
        });

        // Mostrar solamente la sección seleccionada.
        seccion.classList.add("active-section");

        // Actualizar el elemento activo del menú.
        enlacesMenu.forEach(function (enlace) {
            const activo = enlace.getAttribute("href") === "#" + seccion.id;

            enlace.classList.toggle("active", activo);

            if (activo) {
                enlace.setAttribute("aria-current", "page");
            } else {
                enlace.removeAttribute("aria-current");
            }
        });

        // Actualizar el enlace del navegador.
        if (window.location.hash !== "#" + id) {
            history.replaceState(null, "", "#" + id);
        }

        // Desplazarse al formulario si corresponde.
        if (desplazarse) {
            destino.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    // Navegación del menú, accesos rápidos y botones internos.
    document.querySelectorAll(
        '.rrhh-layout a[href^="#"]'
    ).forEach(function (enlace) {
        enlace.addEventListener("click", function (evento) {
            const id = enlace.getAttribute("href").substring(1);

            if (!document.getElementById(id)) {
                return;
            }

            evento.preventDefault();
            mostrarSeccion(id);
        });
    });

    // Abrir la sección indicada en la dirección, si existe.
    const idInicial = window.location.hash.substring(1);
    const destinoInicial = document.getElementById(idInicial);

    if (destinoInicial) {
        mostrarSeccion(idInicial, false);
    } else {
        mostrarSeccion("inicio", false);
    }
});
