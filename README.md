# Módulo: Operaciones y Mantenimiento

Módulo principal del **Sistema Integral de Gestión Empresarial para una Empresa de
Mantenimiento y Servicios Técnicos**. Gestiona el ciclo completo de una orden de
trabajo: desde su creación hasta su cierre, pasando por la asignación de técnicos,
equipos, materiales y el registro de todo lo ocurrido durante el mantenimiento.

*Responsable:* Gibbsson Farías Castillo
*Rama:* farias-castillo/operaciones-mantenimiento

## Descripción

Este módulo permite:

- Registrar y administrar *tipos de mantenimiento* (preventivo, correctivo, etc.).
- Crear y gestionar *órdenes de trabajo (OT)*, con fecha, prioridad y técnico asignado.
- Programar mantenimientos preventivos según periodicidad.
- Asignar técnicos, equipos y herramientas a cada orden.
- Registrar actividades realizadas, materiales utilizados, incidencias, horas
  trabajadas y evidencias durante la ejecución.
- Controlar el flujo de estados de una orden: `Pendiente → Programada → En proceso
  → Observada → Finalizada / Cancelada`.
- Consultar el historial de mantenimientos y generar reportes.

Este módulo se conecta con los otros 4 módulos del sistema: toma el técnico
disponible de *RR.HH., descuenta repuestos de **Equipos, Herramientas y Almacén*,
envía los costos calculados a *Administración y Finanzas*, y guarda los informes en
*Gestión Documentaria y Seguridad*.

## Tecnologías

| Componente | Tecnología |
|---|---|
| Lenguaje / Framework | Java + Spring Boot |
| Gestor de dependencias | Maven |
| Persistencia | Spring Data JPA / Hibernate |
| Base de datos | PostgreSQL |
| Validaciones | Bean Validation (Jakarta) |
| Boilerplate | Lombok |
| Pruebas | JUnit 5 + Mockito |

## Requerimientos funcionales cubiertos

| RF | Descripción | Estado |
|---|---|---|
| RF-01 | Registrar y administrar tipos de mantenimiento | ✅ Implementado |
| RF-02 | Crear órdenes de trabajo (OT) con código, fecha y prioridad | ⏳ En progreso |
| RF-03 | Programar mantenimientos preventivos según periodicidad | ⏳ Pendiente |
| RF-04 | Asignar técnico a la orden validando disponibilidad | ⏳ Pendiente |
| RF-05 | Asignar equipos y/o herramientas a la orden | ⏳ Pendiente |
| RF-06 | Registrar actividades realizadas | ⏳ Pendiente |
| RF-07 | Registrar materiales/repuestos utilizados | ⏳ Pendiente |
| RF-08 | Registrar incidencias | ⏳ Pendiente |
| RF-09 | Registrar horas trabajadas | ⏳ Pendiente |
| RF-10 | Registrar evidencias | ⏳ Pendiente |
| RF-11 | Cambiar el estado de la OT validando el flujo permitido | ⏳ Pendiente |
| RF-12 | Consultar historial de mantenimientos | ⏳ Pendiente |
| RF-13 | Generar reportes de órdenes | ⏳ Pendiente |
| RF-14 | Indicadores del módulo para el dashboard general | ⏳ Pendiente |



## Flujo de trabajo Git

bash
git checkout -b farias-castillo/operaciones-mantenimiento
# ... trabajo por RF, un commit por funcionalidad cerrada ...
git push -u origin farias-castillo/operaciones-mantenimiento

