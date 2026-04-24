# Especificación: Gestión de Inventario

## Escenario: Alta de producto
- Admin agrega un producto con nombre, stock inicial y proveedor.
- El sistema guarda el producto y lo muestra en inventario.

## Escenario: Baja de producto
- Admin elimina un producto.
- El sistema lo remueve del inventario y registra el evento.

## Escenario: Edición de producto
- Admin edita datos de un producto.
- El sistema actualiza la información y registra el cambio.

## Escenario: Alerta de stock bajo
- Un producto alcanza el umbral mínimo de stock.
- El sistema alerta al admin y lo marca visualmente.

## Escenario: Historial de movimientos
- Admin consulta el historial de un producto.
- El sistema muestra entradas, salidas y ajustes con fecha y usuario.
