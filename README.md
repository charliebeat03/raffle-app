# raffle-app
Una app  web para hacer rifas ,donde los usuarios compran sus boletos con numeros elegidos por ellos y luego los admin giran una ruleta aleatoriamente y se seleccionan 3 ganadores para otorgarles un premio

[readme.md](https://github.com/user-attachments/files/24728016/readme.md)
## **DOCUMENTACIÓN DEL SISTEMA - PARA TESTERS**

## ÍNDICE

### SECCIÓN 1: INTRODUCCIÓN AL SISTEMA
1.1. Propósito del Sistema  
1.2. Roles de Usuario  
1.3. Estructura de Navegación  

### SECCIÓN 2: USUARIOS REGULARES
2.1. Acceso al Sistema  
2.2. Autenticación de Usuarios  
2.3. Compra de Boletos  
2.4. Visualización de Rifas  

### SECCIÓN 3: PANEL DE ADMINISTRACIÓN
3.1. Acceso de Administrador  
3.2. Gestión de Rifas  
3.3. Gestión de Administradores  
3.4. Sistema de Sorteo  
3.5. Lista de Ganadores  
3.6. Notificaciones  

### SECCIÓN 4: FUNCIONALIDADES DETALLADAS
4.1. Formularios y Validaciones  
4.2. Procesos de Compra  
4.3. Procesos de Sorteo  
4.4. Sistema de Notificaciones  
4.5. Eliminación de Datos  

### SECCIÓN 5: PRUEBAS ESPECÍFICAS
5.1. Casos de Prueba para Usuarios  
5.2. Casos de Prueba para Administradores  
5.3. Pruebas de Validación  
5.4. Pruebas de Responsividad  


## SECCIÓN 1: INTRODUCCIÓN AL SISTEMA

### 1.1. Propósito del Sistema
El Sistema de Gestión de Rifas es una plataforma web que permite:
- Venta de boletos numerados para rifas
- Gestión de múltiples rifas simultáneamente
- Realización de sorteos mediante ruleta virtual
- Notificación automática a ganadores
- Administración completa del sistema

### 1.2. Roles de Usuario
1. **Usuario Regular**: Puede registrarse, iniciar sesión y comprar boletos
2. **Administrador**: Acceso completo al sistema, incluyendo creación de rifas, realización de sorteos y gestión de otros administradores

### 1.3. Estructura de Navegación
- **Comprar Boletos**: Para usuarios registrados
- **Ruleta/Sorteo**: Para visualizar sorteos (usuarios) o realizarlos (admin)
- **Ganadores**: Listado de ganadores por rifa
- **Administración**: Solo para administradores autenticados


## SECCIÓN 2: USUARIOS REGULARES

### 2.1. Acceso al Sistema
**URL**: `http://localhost:3000` (desarrollo)

### 2.2. Autenticación de Usuarios

#### Formulario de Inicio de Sesión
**Campos**:
- **Teléfono**: Número de teléfono registrado (requerido)
- **Botón**: "Iniciar Sesión"
- **Enlace**: "¿Primera vez? Regístrese aquí"

**Validaciones**:
- El teléfono debe existir en la base de datos
- Si no existe, se sugiere registrarse

#### Formulario de Registro
**Campos**:
- **Nombre Completo**: Texto, requerido
- **Teléfono**: Número único, requerido
- **Email**: Opcional
- **Botón**: "Registrarse e Iniciar Sesión"
- **Enlace**: "¿Ya tienes cuenta? Inicia sesión aquí"

**Comportamiento**:
- Registro automático al sistema después de registrarse
- No requiere verificación de email

### 2.3. Compra de Boletos

#### Proceso de Compra (8 pasos):
1. **Seleccionar Rifa**: Dropdown con rifas activas
   - Muestra: Título, precio, boletos vendidos/totales
2. **Ver Detalles de Rifa**: Tarjeta informativa
   - Premio, descripción, boletos disponibles, precio unitario
3. **Especificar Cantidad**: Campo numérico
   - Validación: 1 ≤ cantidad ≤ boletos disponibles
   - Botón para borrar cantidad (X)
4. **Seleccionar Números**: Botón "Seleccionar Números"
   - Abre modal con cuadrícula de números
   - Solo disponibles (verde), vendidos (gris, deshabilitado)
5. **Modal de Selección**:
   - Grid de números 1-100 (o según rifa)
   - Click para seleccionar/deseleccionar
   - Resumen: seleccionados/cantidad requerida
   - Botones: "Cancelar", "Confirmar Selección"
6. **Resumen de Compra**:
   - Números seleccionados visibles
   - Total calculado: cantidad × precio unitario
   - Estado: "Seleccionados: X de Y"
7. **Confirmar Compra**: Botón grande verde
   - Texto: "Comprar Boletos Seleccionados"
   - Deshabilitado hasta que selección sea completa
8. **Confirmación Exitosa**:
   - Mensaje de éxito con números comprados y total
   - Mostrar boletos comprados en tarjetas

### 2.4. Visualización de Rifas
- Lista de rifas activas con progreso
- Información detallada de cada rifa
- Estado de boletos (disponibles/vendidos)


## SECCIÓN 3: PANEL DE ADMINISTRACIÓN

### 3.1. Acceso de Administrador
**Credenciales por defecto**:
- Usuario: `admin`
- Contraseña: `Admin123!`

**Formulario de Login Admin**:
- Campos: Usuario, Contraseña
- Botón "Iniciar Sesión"
- Botón "Mostrar/Ocultar" contraseña

### 3.2. Gestión de Rifas

#### Crear Nueva Rifa
**Formulario**:
1. **Título**: Texto, requerido
2. **Descripción**: Textarea, opcional
3. **Total de Boletos**: Número (10-1000), default 100
4. **Precio por Boleto**: Decimal, mínimo 1, default 10
5. **Premio**: Texto, requerido
6. **Botón**: "Crear Rifa"

#### Listado de Rifas (Tabla)
**Columnas**:
1. **ID**: Número único
2. **Título**: Con descripción si existe
3. **Boletos**: Vendidos/Totales + barra de progreso
4. **Precio**: $ por boleto
5. **Premio**: Descripción del premio
6. **Estado**: Badges (Activa/Inactiva/Completada)
7. **Recaudación**: Total vendido × precio
8. **Acciones**: Botones según estado

**Botones de Acción**:
- **Completar**: Para rifas activas (rojo)
  - Confirmación requerida
  - Finaliza la rifa, no más ventas
- **Eliminar**: Para rifas completadas sin boletos vendidos (rojo con basura)
  - Confirmación requerida
  - Solo disponible si tickets_sold = 0

### 3.3. Gestión de Administradores

#### Listado de Administradores
**Columnas**:
1. **Usuario**: Con icono y badge "Tú" si es el actual
2. **Email**: Dirección completa
3. **Teléfono**: Número o "No registrado"
4. **Estado**: Badge (Activo/Inactivo)
5. **Acciones**: Botón eliminar (excepto para sí mismo)

#### Crear Nuevo Administrador (Modal)
**Campos**:
1. **Nombre de Usuario**: Texto único, requerido
2. **Email**: Email único, requerido
3. **Teléfono (WhatsApp)**: Requerido, para notificaciones
4. **Contraseña**: Con botón mostrar/ocultar
   - Validaciones: 8+ caracteres, mayúscula, minúscula, número, carácter especial
5. **Botones**: "Cancelar", "Crear Administrador"

**Advertencias**:
- El nuevo admin tendrá acceso completo
- Puede eliminar otros administradores (excepto a sí mismo)

#### Eliminar Administrador
- Botón de basura en columna Acciones
- Confirmación requerida
- No se puede eliminar a sí mismo
- Acción irreversible

### 3.4. Sistema de Sorteo

#### Configuración del Sorteo
1. **Seleccionar Rifa**: Dropdown con rifas activas
2. **Información de Rifa**: Premio, boletos vendidos, estado, ganadores actuales
3. **Botón Girar Ruleta**: Cambia texto según progreso
   - "Iniciar Sorteo" (primer ganador)
   - "Seleccionar Ganador X" (segundo/tercero)
4. **Estado**: "Ganadores seleccionados: X/3"
5. **Números sorteados**: Lista visible

#### Proceso del Sorteo
1. **Animación**: Ruleta gira 5 segundos
2. **Resultado**: Se detiene en número ganador
3. **Registro Automático**: Guarda ganador en base de datos
4. **Restricciones**:
   - Máximo 3 ganadores por rifa
   - Un usuario no puede ganar más de una vez por rifa
   - Excluye números ya sorteados

#### Contactar Ganadores
- **Enlaces WhatsApp**: Generados automáticamente
- **Botón individual**: En tarjeta de cada ganador
- **Botón "Contactar Todos"**: Abre todos los enlaces
- **Contenido del mensaje**: Felicitaciones, número de boleto, premio

#### Reporte de Compras
- **Botón**: "Ver Reporte de Compras"
- **Estadísticas**: Compradores, boletos vendidos, recaudación, ganadores
- **Tabla detallada**: Usuario, boletos comprados, números, estado ganador

### 3.5. Lista de Ganadores

#### Vista General
- **Selector de Rifa**: Dropdown con rifas completadas
- **Información de Rifa**: Premio, fecha, boletos
- **Tabla de Ganadores**: Ordenados por posición

#### Columnas de la Tabla
1. **Posición**: Badge (1°, 2°, 3°)
2. **Ganador**: Nombre con avatar
3. **Número Ganador**: Badge azul
4. **Premio**: Descripción completa
5. **Teléfono**: Solo visible para admin
6. **Contactar**: Botón WhatsApp (solo admin)
7. **Estado**: Badge (Notificado/Pendiente)
8. **Acciones**: Botón marcar como notificado (solo admin)

### 3.6. Notificaciones

#### Sistema de Notificaciones WhatsApp
**Cuando un usuario compra boletos**:
1. **En consola del servidor**:
   - Mensaje detallado de la compra
   - Enlaces WhatsApp para cada admin con teléfono
   - Enlace para contactar al cliente
2. **Contenido del mensaje**:
   - Datos de cliente (nombre, teléfono, email)
   - Detalles de compra (rifa, cantidad, números, total)
   - Instrucciones para confirmar pago

**Requisitos para recibir notificaciones**:
- Admin debe tener teléfono registrado
- Teléfono debe estar activo en WhatsApp
- Admin debe estar marcado como activo


## SECCIÓN 4: FUNCIONALIDADES DETALLADAS

### 4.1. Formularios y Validaciones

#### Validaciones de Contraseña (Admin)
- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 letra minúscula
- Al menos 1 número
- Al menos 1 carácter especial (@$!%*?&)
- Mensaje de error específico

#### Validaciones de Compra
- Cantidad: número entero positivo
- No exceder boletos disponibles
- Seleccionar exactamente la cantidad especificada
- Números deben estar disponibles
- No permitir números fuera de rango

#### Validaciones de Rifa
- Título: requerido
- Total de boletos: 10-1000
- Precio: mínimo 1
- Premio: requerido

### 4.2. Procesos de Compra

#### Flujo Completo
1. Usuario registrado/iniciado sesión
2. Selecciona rifa activa
3. Especifica cantidad (validación en tiempo real)
4. Selecciona números específicos
5. Confirma compra
6. Sistema:
   - Reserva los números
   - Actualiza contadores
   - Envía notificaciones a admins
   - Muestra confirmación al usuario

#### Estados de Números
- **Disponible**: Verde, clickeable
- **Vendido**: Gris, no clickeable
- **Seleccionado**: Azul con sombra

### 4.3. Procesos de Sorteo

#### Lógica de la Ruleta
- **Base**: 100 números (1-100)
- **Ángulo por número**: 3.6° (360/100)
- **Punto 0°**: Parte superior (triángulo rojo)
- **Cálculo de parada**: 5 vueltas + ajuste al número ganador
- **Restricciones**: No repetir ganadores, excluir ya sorteados

#### Secuencia del Sorteo
1. Admin selecciona rifa
2. Sistema verifica boletos disponibles para sorteo
3. Ruleta gira y selecciona ganador aleatorio
4. Se registra ganador con posición (1°, 2°, 3°)
5. Se actualiza estado de la rifa
6. Si es tercer ganador: confeti y modal de finalización

### 4.4. Sistema de Notificaciones

#### Tipos de Notificación
1. **Compra de Boletos**: A todos los admins con teléfono
2. **Ganadores del Sorteo**: Al admin para contactar
3. **Mensajes al Cliente**: Plantillas predefinidas

#### Formato de Mensajes
```
🎫 NUEVA COMPRA DE BOLETOS
============================
Rifa: [Título]
Cliente: [Nombre]
Teléfono: [Teléfono]
Email: [Email o "No proporcionado"]
Cantidad: [X] boletos
Números: [lista]
Total: $[Total]
Fecha: [Fecha/Hora]
============================
Contactar al cliente para confirmar pago.
```

### 4.5. Eliminación de Datos

#### Reglas de Eliminación
1. **Administradores**:
   - Cualquier admin puede eliminar cualquier otro admin
   - No se puede eliminar a sí mismo
   - Confirmación requerida

2. **Rifas**:
   - Solo rifas completadas (is_completed = true)
   - Solo si no tienen boletos vendidos (tickets_sold = 0)
   - Confirmación requerida
   - Acción irreversible

3. **Usuarios**: No hay eliminación directa
4. **Tickets**: No hay eliminación directa
5. **Ganadores**: No hay eliminación directa


## SECCIÓN 5: PRUEBAS ESPECÍFICAS

### 5.1. Casos de Prueba para Usuarios

#### Registro e Inicio de Sesión
1. **Nuevo Usuario**:
   - Completar formulario de registro
   - Verificar inicio automático de sesión
   - Verificar que aparece sección de compra

2. **Usuario Existente**:
   - Iniciar sesión con teléfono registrado
   - Verificar acceso a compras
   - Probar teléfono no registrado (debe sugerir registro)

3. **Cambio entre Login/Registro**:
   - Click en "¿Primera vez?" desde login
   - Click en "¿Ya tienes cuenta?" desde registro
   - Verificar que se mantienen datos del teléfono

#### Compra de Boletos
4. **Selección de Rifa**:
   - Verificar dropdown con rifas activas
   - Verificar que muestra información correcta
   - Probar cambio entre rifas

5. **Especificación de Cantidad**:
   - Probar números válidos (1, 5, 10)
   - Probar números inválidos (0, -1, texto)
   - Probar exceder disponibilidad
   - Probar botón de borrar (X)

6. **Selección de Números**:
   - Abrir modal con cantidad especificada
   - Probar selección/deselección
   - Verificar límite de selección
   - Probar números ya vendidos (deben estar deshabilitados)
   - Verificar resumen en modal

7. **Confirmación de Compra**:
   - Verificar que botón está deshabilitado hasta selección completa
   - Verificar cálculo correcto del total
   - Probar compra exitosa
   - Verificar mensaje de confirmación

#### Responsividad
8. **Dispositivos Móviles**:
   - Verificar que todo es accesible en pantallas pequeñas
   - Probar grids de números (debe ser responsive)
   - Verificar que modales se adaptan
   - Probar navegación en menú hamburguesa

### 5.2. Casos de Prueba para Administradores

#### Gestión de Rifas
9. **Crear Nueva Rifa**:
   - Completar formulario con datos válidos
   - Probar validaciones (campos requeridos)
   - Verificar que aparece en listado
   - Verificar que está activa por defecto

10. **Completar Rifa**:
    - En rifa activa, hacer click en "Completar"
    - Confirmar en diálogo
    - Verificar que cambia estado a "Completada"
    - Verificar que ya no aparece en dropdown de compras

11. **Eliminar Rifa**:
    - Intentar eliminar rifa activa (no debe permitir)
    - Intentar eliminar rifa completada con boletos vendidos (no debe permitir)
    - Eliminar rifa completada sin boletos vendidos
    - Verificar que desaparece del listado

#### Gestión de Administradores
12. **Crear Nuevo Admin**:
    - Abrir modal de creación
    - Probar contraseñas inválidas (ver errores)
    - Crear admin con datos válidos
    - Verificar que aparece en listado
    - Verificar que tiene teléfono registrado

13. **Eliminar Admin**:
    - Intentar eliminarse a sí mismo (no debe permitir)
    - Eliminar otro admin
    - Verificar que desaparece del listado
    - Verificar que no afecta a otros datos

#### Sistema de Sorteo
14. **Configuración Inicial**:
    - Seleccionar rifa con boletos vendidos
    - Verificar información mostrada
    - Verificar que muestra "Ganadores seleccionados: 0/3"

15. **Realizar Sorteo**:
    - Hacer click en "Iniciar Sorteo"
    - Verificar animación de ruleta
    - Verificar que se registra ganador
    - Verificar que actualiza contador (1/3)
    - Repetir hasta 3 ganadores

16. **Restricciones de Sorteo**:
    - Verificar que un usuario no gana dos veces en misma rifa
    - Verificar que no repite números sorteados
    - Verificar que al tercer ganador se completa la rifa

17. **Contactar Ganadores**:
    - Hacer click en botones WhatsApp individuales
    - Verificar que se abre con mensaje predefinido
    - Probar botón "Contactar Todos los Ganadores"
    - Verificar que se abren múltiples pestañas

18. **Reporte de Compras**:
    - Hacer click en "Ver Reporte de Compras"
    - Verificar estadísticas
    - Verificar tabla con compradores
    - Verificar que muestra números comprados por cada usuario

### 5.3. Pruebas de Validación

#### Validaciones de Formulario
19. **Formulario de Registro Usuario**:
    - Nombre vacío: error
    - Teléfono vacío: error
    - Email inválido: debe permitir (es opcional)

20. **Formulario de Compra**:
    - Cantidad 0: error
    - Cantidad mayor a disponibilidad: error
    - No seleccionar números: botón deshabilitado
    - Seleccionar menos números que cantidad: mensaje de advertencia

21. **Formulario de Creación Admin**:
    - Contraseña corta: error específico
    - Contraseña sin mayúsculas: error específico
    - Contraseña sin números: error específico
    - Contraseña sin caracteres especiales: error específico
    - Usuario/email duplicado: error

#### Validaciones de Proceso
22. **Compra con Sesión Expirada**:
    - Esperar que expire sesión (simular)
    - Intentar comprar: debe redirigir a login

23. **Sorteo sin Boletos**:
    - Intentar sorteo en rifa sin boletos vendidos
    - Debe mostrar error

24. **Acceso No Autorizado**:
    - Intentar acceder a /admin sin estar autenticado
    - Debe redirigir a login admin

### 5.4. Pruebas de Responsividad

#### Breakpoints a Probar
25. **PC Escritorio** (>1200px):
    - Todo debe verse bien
    - Grids de números: 10 columnas

26. **Tablet** (768px-1200px):
    - Menús deben adaptarse
    - Grids de números: 6-8 columnas
    - Tablas deben ser scrollables horizontalmente

27. **Móvil** (<768px):
    - Menú hamburguesa funcional
    - Grids de números: 4-5 columnas
    - Botones de tamaño adecuado para touch
    - Modales ocupar casi toda pantalla
    - Textos legibles sin zoom

28. **Orientación**:
    - Probar landscape y portrait en móvil
    - Verificar que todo se redistribuye correctamente

#### Compatibilidad Navegadores
29. **Chrome/Edge**: Funcionalidad completa
30. **Firefox**: Funcionalidad completa
31. **Safari iOS**: Probar en iPhone/iPad
32. **Chrome Android**: Probar en dispositivos Android


## REGISTRO DE PRUEBAS

### Plantilla para Registrar Resultados
```
Fecha: ______________
Tester: ______________
Navegador: ______________
Dispositivo: ______________

Caso de Prueba: [Número] - [Descripción]
Resultado: ✅ PASÓ / ❌ FALLÓ / ⚠️ ADVERTENCIA
Observaciones: [Detalles del resultado]
Tiempo: [HH:MM]
Capturas: [Referencia si aplica]
```

### Métricas a Medir
1. **Tiempo de Respuesta**: <3 segundos para acciones
2. **Usabilidad**: Todo debe ser intuitivo
3. **Consistencia**: Mismo comportamiento en todas las secciones
4. **Mensajes de Error**: Claros y útiles
5. **Confirmaciones**: Para acciones destructivas
6. **Feedback Visual**: Para todas las interacciones


## CONTACTO PARA ISSUES

Si encuentras algún problema:
1. Registrar caso de prueba fallido
2. Tomar captura de pantalla
3. Anotar pasos para reproducir
4. Especificar navegador y dispositivo
5. Reportar al desarrollador


**FIN DE LA DOCUMENTACIÓN**

Esta documentación cubre todas las funcionalidades del sistema. 
Cualquier comportamiento no documentado debe ser reportado como un issue para su revisión
 y actualización de la documentación.
