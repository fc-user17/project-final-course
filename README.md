# 💰 Módulo 4: Administración y Finanzas

**Sistema Integral de Gestión Empresarial para Mantenimiento y Servicios Técnicos**
**Responsable del Módulo:** [Nombre de tu compañero/a]
**Rama:** `feature/modulo-4-admin-finanzas`

---

## 📖 Descripción del Módulo

Este módulo es el motor económico de la empresa. Su objetivo principal es controlar, registrar y analizar todos los flujos de dinero (ingresos y gastos), asegurando que los servicios de mantenimiento que ofrece la empresa sean rentables. 

Este módulo transforma las horas de trabajo y los repuestos utilizados en dinero real, permitiendo a la gerencia saber exactamente cuánto cuesta un servicio, cuánto se debe cobrar y cuál es la utilidad neta.

---

## 🎯 Requerimientos Funcionales (RF)

Para estructurar el desarrollo, las funcionalidades de este módulo se dividen en tres grandes bloques: **Costos y Presupuestos**, **Flujo de Caja y Facturación**, y **Reportes Financieros**.

### 📊 Bloque 1: Costos y Presupuestos
- [ ] **RF-401: Gestión de Presupuestos.** Creación, edición, aprobación y rechazo de presupuestos para clientes antes de realizar un servicio.
- [ ] **RF-402: Cálculo Automático de Costos Reales.** Funcionalidad clave que calcula el costo de una Orden de Trabajo (OT) basándose en la fórmula:
  > *Costo Real = (Costo Materiales/Repuestos) + (Costo Mano de Obra por hora) + (Gastos Operativos extra)*

### 💵 Bloque 2: Flujo de Caja y Facturación
- [ ] **RF-403: Registro de Ingresos y Gastos.** Mantenimiento (CRUD) de caja chica, gastos operativos (transporte, viáticos) y pagos recibidos.
- [ ] **RF-404: Cuentas por Cobrar y por Pagar.** Seguimiento de clientes que deben dinero por servicios finalizados y pagos pendientes a proveedores.
- [ ] **RF-405: Emisión y Control de Facturación.** Generación de comprobantes (facturas/boletas) vinculados a las órdenes de trabajo finalizadas.

### 📈 Bloque 3: Reportes y Rentabilidad
- [ ] **RF-406: Análisis de Rentabilidad por Servicio.** Reporte que compara el monto cobrado al cliente vs. el costo real de ejecución para obtener el margen de ganancia.
- [ ] **RF-407: Reportes Financieros Periódicos.** Generación de reportes de ingresos y egresos mensuales/anuales exportables (PDF, Excel) para el Dashboard de gerencia.

---

## 🔗 Integración con otros Módulos

El Módulo 4 es el que más datos "consume" del resto del sistema para poder hacer sus cálculos:

1. **Con RR. HH. (Mód. 1):** Obtiene el sueldo o tarifa por hora del técnico para calcular el costo de *mano de obra* en una orden de trabajo.
2. **Con Operaciones (Mód. 2):** Se activa cuando una Orden de Trabajo cambia a estado "Finalizada", jalando las horas trabajadas para generar la facturación.
3. **Con Almacén (Mód. 3):** Obtiene el costo unitario de cada repuesto o material utilizado en el mantenimiento para calcular el *costo de materiales*.
4. **Con Documentaria y Seg. (Mód. 5):** Envía las facturas, boletas y presupuestos aprobados para que se guarden en el repositorio central. Las aprobaciones de pagos quedan registradas en la bitácora de auditoría.

---

## 🚀 Tecnologías y Herramientas (Sugerido)
*(Se debe usar el mismo stack acordado por el equipo)*
* **Backend:** [Ej: Node.js / Java Spring / Python Django]
* **Base de Datos:** [Ej: PostgreSQL / MySQL / SQL Server] - *Ideal para manejo preciso de decimales y transacciones financieras.*
* **Librerías de Reportes:** [Ej: PDFKit, JasperReports, o librerías de Excel]

---

## 📋 Próximos Pasos (To-Do)
1. [ ] Diseñar el modelo Entidad-Relación (MER) para Tablas de Presupuestos, Facturas, Gastos, Ingresos y Cuentas.
2. [ ] Definir los tipos de datos exactos (Ej: `DECIMAL(10,2)`) para evitar errores en cálculos de dinero.
3. [ ] Desarrollar la lógica (endpoints/servicios) para calcular la fórmula del costo real.
4. [ ] Crear los endpoints de cambio de estado (Ej: de "Presupuesto Pendiente" a "Presupuesto Aprobado").
