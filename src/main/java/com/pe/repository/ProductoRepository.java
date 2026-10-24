package com.pe.repository;

import com.pe.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    Optional <Producto> findByCodigo(String codigo);
    @Query("""
            SELECT p FROM Producto p
            WHERE p.estado = true
              AND p.stockActual <= p.stockMinimo
            ORDER BY (p.stockMinimo - p.stockActual) DESC, p.stockActual ASC, p.nombre ASC
            """)
    List<Producto> findProductosConStockBajo();
}
