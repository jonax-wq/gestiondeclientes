# 🍿 Flow Stream - Gestión Profesional de Cuentas de Streaming y Clientes

Un sistema moderno, elegante y optimizado tanto para **PC como para Celular** diseñado especialmente para administradores y revendedores de cuentas de streaming (Netflix, Disney+, Max, Prime Video, Spotify, Paramount+, etc.).

---

## 📱 Características Principales

1. **Gestión de Cuentas Maestras y Pantallas**:
   - Agrega cuentas completas con correo, contraseña, fecha de corte y costo.
   - Configura la cantidad de perfiles de cada cuenta con sus PINs individuales.
   - Visualización gráfica de las pantallas de TV: identifica qué perfiles están libres y cuáles están ocupados con el nombre y número del cliente.

2. **Asignación de Clientes**:
   - Registro con **número de celular (WhatsApp)** y selector de código de país (+51, +57, +52, +54, etc.).
   - Selección en cascada de la cuenta y perfil disponible.
   - Asignación de PIN del perfil.
   - Cálculo automático de **fecha de vencimiento a 30 días exactos**.

3. **Icono Directo de WhatsApp & Alerta de 2 Días**:
   - **Indicador luminoso y pulso de atención** cuando a un cliente le faltan **2 días o menos** para que termine su membresía.
   - Botón directo de WhatsApp que abre el chat con el cliente (`wa.me`) con el mensaje prediseñado:
     - Recordatorio de vencimiento (2 días antes con nombre, plataforma, perfil, PIN y fecha).
     - Aviso de vencimiento de hoy.
     - Mensaje de bienvenida / entrega de credenciales.
     - Opción para editar el mensaje antes de enviar.

4. **100% Responsivo para Celulares**:
   - En computadoras: Tabla interactiva con filtros y buscador rápido.
   - En celulares: Tarjetas táctiles tipo aplicación nativa con botón gigante de WhatsApp al alcance del pulgar, renovar rápido (+30 días) y liberar pantalla.

5. **Acciones Rápidas**:
   - **Renovación con 1 clic**: Suma automáticamente 30 días a la membresía.
   - **Liberar perfil**: Si un cliente cancela, el perfil vuelve a estado "Libre" inmediatamente para venderlo a otra persona.

---

## 🗄️ Base de Datos (Scripts SQL)

Cumpliendo con tu indicación de **no aplicar cambios directos en la base de datos**, los queries están organizados en la carpeta [`database/`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/database/):

- [`schema.sql`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/database/schema.sql): Estructura de tablas (`cuentas_streaming`, `perfiles`, `clientes`, `historial_renovaciones`) compatible con MySQL / MariaDB / PostgreSQL / SQLite.
- [`seed.sql`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/database/seed.sql): Datos de prueba iniciales (cuentas de Netflix, Disney+, Max, perfiles y clientes con alertas de 2 días listas para probar).
- [`queries_utiles.sql`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/database/queries_utiles.sql): Consultas preparadas para filtrar clientes que vencen en 2 días, ver perfiles libres y calcular ganancias.
- [`README.md`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/database/README.md): Instrucciones paso a paso para ejecutarlos en phpMyAdmin, MySQL Workbench o consola.

Además, desde la misma aplicación web en el botón **"Base de Datos SQL"**, puedes generar y descargar el script `.sql` actualizado con tus datos actuales en tiempo real.

---

## 🚀 Cómo Iniciar el Sistema

Desde la carpeta principal del proyecto:

```bash
npm run dev
```

Abre en tu navegador (PC o celular en la misma red local):
```
http://localhost:5180
```
