package com.pe.config;
import com.pe.model.*;
import com.pe.repository.OrdenTrabajoRepository;
import com.pe.repository.RolRepository;
import com.pe.repository.TipoMantenimientoRepository;
import com.pe.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Seeder que se ejecuta automaticamente al iniciar la aplicacion (CommandLineRunner).
 *
 * Siembra de forma idempotente (solo inserta si el dato no existe):
 *  1. Los 4 roles del sistema.
 *  2. Usuario administrador de prueba.
 *  3. Tipos de mantenimiento (Preventivo, Correctivo, Predictivo).
 *  4. Ordenes de trabajo de demostracion con distintos estados y prioridades.
 *
 * Credenciales del admin de prueba:
 *   Email:    admin@empresa.pe
 *   Password: Admin123!
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final TipoMantenimientoRepository tipoMantenimientoRepository;
    private final OrdenTrabajoRepository ordenTrabajoRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("========== Iniciando seeder de datos base ==========");
        seedRoles();
        seedAdminUser();
        seedTiposMantenimiento();
        seedOrdenesTrabajo();
        log.info("========== Seeder finalizado correctamente ==========");
    }

    // =========================================================================
    // 1. ROLES
    // =========================================================================

    private void seedRoles() {
        Map<NombreRol, String> descripcionPorRol = Map.of(
                NombreRol.ADMIN,    "Administrador del sistema con acceso total",
                NombreRol.TECNICO,  "Tecnico de mantenimiento y servicios",
                NombreRol.RRHH,     "Recursos Humanos - gestion de personal",
                NombreRol.FINANZAS, "Administracion y finanzas"
        );

        for (NombreRol nombreRol : NombreRol.values()) {
            if (rolRepository.findByNombreRol(nombreRol).isEmpty()) {
                Rol rol = Rol.builder()
                        .nombreRol(nombreRol)
                        .descripcion(descripcionPorRol.get(nombreRol))
                        .build();
                rolRepository.save(rol);
                log.info("  [ROL] Insertado: {}", nombreRol);
            }
        }
    }

    // =========================================================================
    // 2. USUARIO ADMIN
    // =========================================================================

    private void seedAdminUser() {
        String adminEmail = "admin@empresa.pe";
        if (!usuarioRepository.existsByEmail(adminEmail)) {
            Rol rolAdmin = rolRepository.findByNombreRol(NombreRol.ADMIN)
                    .orElseThrow(() -> new RuntimeException("Rol ADMIN no encontrado"));

            Usuario admin = Usuario.builder()
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode("Admin123!"))
                    .rol(rolAdmin)
                    .activo(true)
                    .build();

            usuarioRepository.save(admin);
            log.info("  [USUARIO] Admin creado: {}", adminEmail);
        }

        String tecnicoEmail = "tecnico@empresa.pe";
        if (!usuarioRepository.existsByEmail(tecnicoEmail)) {
            Rol rolTecnico = rolRepository.findByNombreRol(NombreRol.TECNICO)
                    .orElseThrow(() -> new RuntimeException("Rol TECNICO no encontrado"));

            Usuario tecnico = Usuario.builder()
                    .email(tecnicoEmail)
                    .passwordHash(passwordEncoder.encode("Tecnico123!"))
                    .rol(rolTecnico)
                    .activo(true)
                    .build();

            usuarioRepository.save(tecnico);
            log.info("  [USUARIO] Tecnico creado: {}", tecnicoEmail);
        }
    }

    // =========================================================================
    // 3. TIPOS DE MANTENIMIENTO
    // =========================================================================

    private void seedTiposMantenimiento() {
        record TipoData(String nombre, String descripcion, Integer periodicidadDias) {}

        List<TipoData> tipos = List.of(
            new TipoData("Preventivo Mensual",
                "Inspeccion y lubricacion de equipos rotativos y sistemas electricos cada 30 dias", 30),
            new TipoData("Preventivo Trimestral",
                "Revision completa de sistemas hidraulicos, neumaticos y estructurales cada 90 dias", 90),
            new TipoData("Preventivo Semestral",
                "Overhaul parcial de maquinaria pesada y calibracion de instrumentos", 180),
            new TipoData("Correctivo Urgente",
                "Intervencion inmediata ante falla critica que paraliza la operacion", null),
            new TipoData("Correctivo Programado",
                "Correccion de falla menor detectada que permite planificar su reparacion", null),
            new TipoData("Predictivo - Analisis Vibraciones",
                "Monitoreo de vibraciones y analisis de espectro para deteccion temprana de fallas", 60),
            new TipoData("Predictivo - Termografia",
                "Inspeccion termografica de tableros electricos, motores y conexiones", 120)
        );

        for (TipoData dato : tipos) {
            if (!tipoMantenimientoRepository.existsByNombreIgnoreCase(dato.nombre())) {
                TipoMantenimiento tipo = TipoMantenimiento.builder()
                        .nombre(dato.nombre())
                        .descripcion(dato.descripcion())
                        .periodicidadDias(dato.periodicidadDias())
                        .activo(true)
                        .build();
                tipoMantenimientoRepository.save(tipo);
                log.info("  [TIPO MANT.] Creado: {}", dato.nombre());
            }
        }
    }

    // =========================================================================
    // 4. ORDENES DE TRABAJO DE DEMOSTRACION
    // =========================================================================

    private void seedOrdenesTrabajo() {
        if (ordenTrabajoRepository.count() > 0) {
            log.info("  [OT] Ya existen ordenes de trabajo. Omitiendo seeder de OTs.");
            return;
        }

        List<TipoMantenimiento> tipos = tipoMantenimientoRepository.findAll();
        if (tipos.isEmpty()) {
            log.warn("  [OT] No se encontraron tipos de mantenimiento para sembrar OTs.");
            return;
        }

        java.util.function.Function<String, TipoMantenimiento> findTipo = keyword ->
            tipos.stream()
                .filter(t -> t.getNombre().toLowerCase().contains(keyword.toLowerCase()))
                .findFirst()
                .orElse(tipos.get(0));

        record OtData(TipoMantenimiento tipo, LocalDate fecha, Prioridad prioridad,
                      EstadoOrden estado, String descripcion, Long tecnicoId) {}

        LocalDate hoy = LocalDate.now();

        List<OtData> otsData = List.of(
            new OtData(findTipo.apply("Correctivo Urgente"),
                hoy, Prioridad.URGENTE, EstadoOrden.EN_PROCESO,
                "Falla en compresor de aire linea 3 - temperatura fuera de rango. Cambio de sellos y limpieza de filtros de alta presion.", 1L),
            new OtData(findTipo.apply("Preventivo Mensual"),
                hoy.plusDays(3), Prioridad.MEDIA, EstadoOrden.PROGRAMADA,
                "Lubricacion y ajuste de bandas transportadoras sector almacen. Verificacion de tension y alineacion.", 2L),
            new OtData(findTipo.apply("Preventivo Mensual"),
                hoy.plusDays(7), Prioridad.MEDIA, EstadoOrden.PENDIENTE,
                "Revision de sistema electrico tablero principal - limpieza de contactores y verificacion de protecciones.", null),
            new OtData(findTipo.apply("Correctivo Programado"),
                hoy.plusDays(2), Prioridad.ALTA, EstadoOrden.PENDIENTE,
                "Cambio de rodamientos en motor bomba hidraulica N.2. Ruido anormal detectado durante inspeccion.", 3L),
            new OtData(findTipo.apply("Preventivo Trimestral"),
                hoy.minusDays(15), Prioridad.BAJA, EstadoOrden.FINALIZADA,
                "Revision completa de sistema hidraulico - cambio de aceite, filtros y revision de mangueras. Trabajo completado sin novedades.", 2L),
            new OtData(findTipo.apply("Predictivo - Analisis"),
                hoy.plusDays(10), Prioridad.MEDIA, EstadoOrden.PROGRAMADA,
                "Analisis de vibraciones en grupo de motores linea de produccion A. Comparacion con linea base anterior.", null),
            new OtData(findTipo.apply("Predictivo - Termografia"),
                hoy.minusDays(5), Prioridad.ALTA, EstadoOrden.OBSERVADA,
                "Inspeccion termografica tableros electricos pisos 1 y 2. Se detectaron puntos calientes en breakers sector norte.", 1L),
            new OtData(findTipo.apply("Correctivo Urgente"),
                hoy.minusDays(30), Prioridad.URGENTE, EstadoOrden.FINALIZADA,
                "Reparacion de fuga hidraulica en prensa N.1. Se cambio manguera y sellos. Equipo operativo nuevamente.", 3L),
            new OtData(findTipo.apply("Preventivo Semestral"),
                hoy.plusDays(20), Prioridad.ALTA, EstadoOrden.PENDIENTE,
                "Overhaul de compresor principal - revision de pistones, valvulas y sistema de refrigeracion.", null),
            new OtData(findTipo.apply("Correctivo Programado"),
                hoy.minusDays(2), Prioridad.MEDIA, EstadoOrden.EN_PROCESO,
                "Reemplazo de sensor de temperatura en horno industrial N.3. Ajuste de parametros PID post-instalacion.", 2L)
        );

        int count = 0;
        for (OtData dato : otsData) {
            OrdenTrabajo ot = OrdenTrabajo.builder()
                    .tipoMantenimiento(dato.tipo())
                    .fechaProgramada(dato.fecha())
                    .prioridad(dato.prioridad())
                    .estado(dato.estado())
                    .descripcion(dato.descripcion())
                    .tecnicoId(dato.tecnicoId())
                    .build();

            ot = ordenTrabajoRepository.save(ot);
            ot.setCodigo(String.format("OT-%05d", ot.getId()));
            ordenTrabajoRepository.save(ot);
            count++;
            log.info("  [OT] Creada: {} - {} - {}", ot.getCodigo(), dato.tipo().getNombre(), dato.estado());
        }

        log.info("  [OT] {} ordenes de trabajo de demostracion sembradas.", count);
    }
}
