
document.addEventListener("DOMContentLoaded", function () {

    const secciones = document.querySelectorAll(".page-section");
    const enlacesMenu = document.querySelectorAll(".sidebar-nav .nav-link");

    function mostrarSeccion(id) {

        const seccion = document.getElementById(id);

        if (!seccion || !seccion.classList.contains("page-section")) {
            return;
        }

        // Ocultar todas las secciones
        secciones.forEach(function (elemento) {
            elemento.classList.remove("active-section");
        });

        // Mostrar la sección seleccionada
        seccion.classList.add("active-section");

        // Actualizar el menú
        enlacesMenu.forEach(function (enlace) {
            const activo = enlace.getAttribute("href") === "#" + id;

            enlace.classList.toggle("active", activo);

            if (activo) {
                enlace.setAttribute("aria-current", "page");
            } else {
                enlace.removeAttribute("aria-current");
            }
        });
    }

    // Navegación del menú
    enlacesMenu.forEach(function (enlace) {

        enlace.addEventListener("click", function (evento) {

            const id = enlace.getAttribute("href").substring(1);

            if (!document.getElementById(id)) {
                return;
            }

            evento.preventDefault();

            mostrarSeccion(id);

            history.replaceState(null, "", "#" + id);
        });
    });

    // Mostrar sección según la dirección
    const idInicial = window.location.hash.substring(1);

    if (idInicial && document.getElementById(idInicial)) {
        mostrarSeccion(idInicial);
    } else {
        mostrarSeccion("inicio");
    }

});
