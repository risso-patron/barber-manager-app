# Especificación: Autenticación y Roles

## Escenario: Login exitoso
- Usuario ingresa credenciales válidas.
- El sistema autentica y redirige según el rol (cliente, empleado, admin).

## Escenario: Acceso restringido por rol
- Un usuario intenta acceder a una ruta no permitida para su rol.
- El sistema bloquea el acceso y muestra mensaje claro.

## Escenario: Registro de nuevo cliente
- Un visitante completa el formulario de registro con datos válidos.
- El sistema crea la cuenta y permite login inmediato.
