package com.pe.config;

import com.pe.model.*;
import com.pe.repository.EquipoRepository;
import com.pe.repository.OrdenTrabajoRepository;
import com.pe.repository.RolRepository;
import com.pe.repository.TipoMantenimientoRepository;
import com.pe.repository.UsuarioRepository;
import com.pe.recursos_humanos.trabajadores.Trabajador;
import com.pe.recursos_humanos.trabajadores.TrabajadorRepository;
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
 *  2. Usuario administrador y tecnico de prueba.
 *  3. Trabajadores (RRHH) para asignaciones tecnicas.
 *  4. Equipos (Almacen) para mantenimiento y operaciones.
 *  5. Tipos de mantenimiento (Preventivo, Correctivo, Predictivo).
 *  6. Ordenes de trabajo de demostracion con tecnicos y equipos reales.
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
    private final TrabajadorRepository trabajadorRepository;
    private final EquipoRepository equipoRepository;
    private final TipoMantenimientoRepository tipoMantenimientoRepository;
    private final OrdenTrabajoRepository ordenTrabajoRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("========== Iniciando seeder de datos base ==========");
        seedRoles();
        seedAdminUser();
        seedTrabajadores();
        seedEquipos();
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
    // 3. TRABAJADORES (RRHH - TÉCNICOS)
    // =========================================================================

    private void seedTrabajadores() {
        record TrabajadorSeed(String nombres, String documento, String cargo, String area, String estado) {}

        List<TrabajadorSeed> lista = List.of(
            new TrabajadorSeed("Carlos Ramírez Soto", "45871236", "Técnico Mecánico", "Mantenimiento", "ACTIVO"),
            new TrabajadorSeed("Juan Pérez Vargas", "47895623", "Técnico Electricista", "Operaciones", "ACTIVO"),
            new TrabajadorSeed("María Gómez Rivas", "71234568", "Especialista Hidráulico", "Mantenimiento", "ACTIVO"),
            new TrabajadorSeed("Roberto Sánchez Díaz", "40123987", "Técnico Electromecánico", "Operaciones", "ACTIVO"),
            new TrabajadorSeed("Luis Alarcón Mendoza", "43567891", "Supervisor de Mantenimiento", "Mantenimiento", "ACTIVO")
        );

        for (TrabajadorSeed d : lista) {
            if (trabajadorRepository.findByDocumentoIdentidad(d.documento()).isEmpty()) {
                Trabajador t = new Trabajador();
                t.setNombres(d.nombres());
                t.setDocumentoIdentidad(d.documento());
                t.setCargo(d.cargo());
                t.setArea(d.area());
                t.setEstado(d.estado());
                trabajadorRepository.save(t);
                log.info("  [TRABAJADOR] Creado: {} ({})", d.nombres(), d.cargo());
            }
        }
    }

    // =========================================================================
    // 4. EQUIPOS (ALMACÉN)
    // =========================================================================

    private void seedEquipos() {
        record EquipoSeed(String codigo, String marca, String modelo, String serie,
                          EstadoEquipo estado, String ubicacion, String responsable) {}

        List<EquipoSeed> lista = List.of(
            new EquipoSeed("EQP-001", "Atlas Copco", "GA 37 VSD+ Compresor Tornillo", "AC-2023-9081",
                EstadoEquipo.OPERATIVO, "Planta Principal - Sector Compresores", "Carlos Ramírez Soto"),
            new EquipoSeed("EQP-002", "Mazak", "Quick Turn 250 Torno CNC", "MZ-8841-B",
                EstadoEquipo.OPERATIVO, "Taller de Mecanizado - Bahía 2", "Juan Pérez Vargas"),
            new EquipoSeed("EQP-003", "Flowserve", "Mark 3 ANSI Bomba Centrífuga", "FS-5510-C",
                EstadoEquipo.EN_MANTENIMIENTO, "Estación de Bombeo N° 2", "María Gómez Rivas"),
            new EquipoSeed("EQP-004", "Toyota", "8FBCU25 Montacargas Eléctrico", "TY-3091-E",
                EstadoEquipo.OPERATIVO, "Almacén Central - Zona Despacho", "Roberto Sánchez Díaz"),
            new EquipoSeed("EQP-005", "Caterpillar", "DE200 GC Generador Diésel 200kVA", "CAT-7721-P",
                EstadoEquipo.OPERATIVO, "Subestación Eléctrica Auxiliar", "Luis Alarcón Mendoza"),
            new EquipoSeed("EQP-006", "Schneider Electric", "Masterpact MTZ2 Tablero Principal", "SE-1104-X",
                EstadoEquipo.OPERATIVO, "Sala Eléctrica - Nivel 1", "Juan Pérez Vargas")
        );

        for (EquipoSeed d : lista) {
            if (equipoRepository.findByCodigoPatrimonialIgnoreCase(d.codigo()).isEmpty()) {
                Equipo e = new Equipo();
                e.setCodigoPatrimonial(d.codigo());
                e.setMarca(d.marca());
                e.setModelo(d.modelo());
                e.setNumeroSerie(d.serie());
                e.setEstado(d.estado());
                e.setUbicacion(d.ubicacion());
                e.setResponsable(d.responsable());
                equipoRepository.save(e);
                log.info("  [EQUIPO] Creado: {} - {} {}", d.codigo(), d.marca(), d.modelo());
            }
        }
    }

    // =========================================================================
    // 5. TIPOS DE MANTENIMIENTO
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
    // 6. ORDENES DE TRABAJO DE DEMOSTRACION
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

        List<Trabajador> trabajadores = trabajadorRepository.findAll();
        List<Equipo> equipos = equipoRepository.findAll();

        java.util.function.Function<Integer, Long> getTecnicoId = idx -> {
            if (trabajadores.isEmpty() || idx == null || idx < 0 || idx >= trabajadores.size()) {
                return null;
            }
            return trabajadores.get(idx).getId();
        };

        java.util.function.Function<String, Equipo> findEquipo = cod ->
            equipos.stream()
                .filter(e -> e.getCodigoPatrimonial().equalsIgnoreCase(cod))
                .findFirst()
                .orElse(null);

        java.util.function.Function<String, TipoMantenimiento> findTipo = keyword ->
            tipos.stream()
                .filter(t -> t.getNombre().toLowerCase().contains(keyword.toLowerCase()))
                .findFirst()
                .orElse(tipos.get(0));

        record OtData(TipoMantenimiento tipo, LocalDate fecha, Prioridad prioridad,
                      EstadoOrden estado, String descripcion, Integer tecnicoIndex, String equipoCodigo) {}

        LocalDate hoy = LocalDate.now();

        List<OtData> otsData = List.of(
            new OtData(findTipo.apply("Correctivo Urgente"),
                hoy, Prioridad.URGENTE, EstadoOrden.EN_PROCESO,
                "Falla en compresor de aire linea 3 - temperatura fuera de rango. Cambio de sellos y limpieza de filtros de alta presion.",
                0, "EQP-001"),
            new OtData(findTipo.apply("Preventivo Mensual"),
                hoy.plusDays(3), Prioridad.MEDIA, EstadoOrden.PROGRAMADA,
                "Lubricacion y ajuste de cadenas y mastil de montacargas electrico. Verificacion de bateria y frenos.",
                1, "EQP-004"),
            new OtData(findTipo.apply("Preventivo Mensual"),
                hoy.plusDays(7), Prioridad.MEDIA, EstadoOrden.PENDIENTE,
                "Revision de sistema electrico tablero principal - limpieza de contactores y verificacion de protecciones.",
                null, "EQP-006"),
            new OtData(findTipo.apply("Correctivo Programado"),
                hoy.plusDays(2), Prioridad.ALTA, EstadoOrden.PENDIENTE,
                "Cambio de rodamientos y sellos en bomba centrifuga ANSI. Ruido y vibracion anormal detectados en inspeccion.",
                2, "EQP-003"),
            new OtData(findTipo.apply("Preventivo Trimestral"),
                hoy.minusDays(15), Prioridad.BAJA, EstadoOrden.FINALIZADA,
                "Revision y calibracion de torno CNC - cambio de refrigerante, filtros y ajuste de husillo.",
                3, "EQP-002"),
            new OtData(findTipo.apply("Predictivo - Analisis"),
                hoy.plusDays(10), Prioridad.MEDIA, EstadoOrden.PROGRAMADA,
                "Analisis de vibraciones en torno CNC. Comparacion con linea base de fabricacion anterior.",
                null, "EQP-002"),
            new OtData(findTipo.apply("Predictivo - Termografia"),
                hoy.minusDays(5), Prioridad.ALTA, EstadoOrden.OBSERVADA,
                "Inspeccion termografica en tablero de distribucion principal. Se detectaron puntos calientes en breakers N° 3 y 5.",
                1, "EQP-006"),
            new OtData(findTipo.apply("Correctivo Urgente"),
                hoy.minusDays(30), Prioridad.URGENTE, EstadoOrden.FINALIZADA,
                "Parada de emergencia en compresor Atlas Copco por baja presion de aceite. Cambio de filtro y purga completados.",
                0, "EQP-001"),
            new OtData(findTipo.apply("Preventivo Semestral"),
                hoy.plusDays(20), Prioridad.ALTA, EstadoOrden.PENDIENTE,
                "Mantenimiento semestral y prueba con carga de generador Caterpillar 200kVA.",
                null, "EQP-005"),
            new OtData(findTipo.apply("Correctivo Programado"),
                hoy.minusDays(2), Prioridad.MEDIA, EstadoOrden.EN_PROCESO,
                "Reemplazo de presostato y valvula reguladora en estacion de bombeo.",
                2, "EQP-003")
        );

        int count = 0;
        for (OtData dato : otsData) {
            OrdenTrabajo ot = OrdenTrabajo.builder()
                    .tipoMantenimiento(dato.tipo())
                    .fechaProgramada(dato.fecha())
                    .prioridad(dato.prioridad())
                    .estado(dato.estado())
                    .descripcion(dato.descripcion())
                    .tecnicoId(getTecnicoId.apply(dato.tecnicoIndex()))
                    .equipo(findEquipo.apply(dato.equipoCodigo()))
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
