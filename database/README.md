# 🗄️ Bases de Datos y Despliegue en Vercel - Flow Stream

Este directorio contiene todos los archivos SQL para crear y gestionar la base de datos de tu sistema. Cumpliendo con tu instrucción de **no aplicar cambios directos en la base de datos**, aquí tienes los archivos listos para que puedas ejecutarlos tú mismo.

---

## 📁 Archivos Disponibles

1. **[`schema_supabase_postgres.sql`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/database/schema_supabase_postgres.sql)** *(Recomendado para Vercel)*:
   - Compatible con **Supabase**, **Neon Postgres** y **Vercel Postgres**.
   - Diseñado para funcionar en la nube con API instantánea.

2. **[`schema.sql`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/database/schema.sql)**:
   - Compatible con **MySQL** y **MariaDB** (phpMyAdmin, XAMPP, Laragon, MySQL Workbench, Clever Cloud).

3. **[`seed.sql`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/database/seed.sql)**:
   - Datos iniciales de prueba (cuentas de Netflix, Disney+, HBO Max, Prime Video con perfiles y clientes asignados).

4. **[`queries_utiles.sql`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/database/queries_utiles.sql)**:
   - Consultas preparadas para alertas de 2 días de WhatsApp, perfiles libres y balance contable en Soles (S/).

---

## 🚀 ¿Qué Base de Datos Utilizar?

### 🥇 Opción 1: Supabase (PostgreSQL en la Nube) — *La mejor combinación con Vercel*
- **Ventajas**:
  - Plan gratuito generoso (500 MB, más que suficiente para miles de clientes y cuentas).
  - Incluye panel web visual similar a Excel / phpMyAdmin para ver y editar registros.
  - Genera automáticamente API REST y JavaScript SDK (`@supabase/supabase-js`), lo que te permite conectar React directamente sin necesidad de crear un servidor backend adicional.
- **Cómo ejecutar el script**:
  1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
  2. En el menú lateral, ve a **SQL Editor**.
  3. Pega el contenido de [`schema_supabase_postgres.sql`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/database/schema_supabase_postgres.sql) y haz clic en **Run**.

---

### 🥈 Opción 2: Neon Serverless Postgres o Vercel Postgres
- Base de datos en la nube integrada directamente en Vercel.
- Excelente si creas endpoints serverless en `/api`.

---

### 🥉 Opción 3: MySQL en la Nube (Railway / Aiven / Clever Cloud)
- Si prefieres MySQL clásico:
  1. Puedes usar un servicio gratuito en la nube como Railway o Clever Cloud.
  2. Ejecuta el archivo [`schema.sql`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/database/schema.sql).

---

## 🌐 ¿Está bien usar Vercel para el Subdominio?

**¡Sí, Vercel es ideal y perfecto para esto!**

1. **Subdominio gratuito incluido**:
   - Al desplegar tu proyecto, Vercel te asignará automáticamente un subdominio seguro con HTTPS (SSL) del tipo:
     `https://flowstream.vercel.app` (o el nombre que elijas si está disponible).
2. **Dominio propio gratis a futuro**:
   - Si más adelante compras un dominio propio (por ejemplo `clientes.mitienda.com` o `flowstream.pe`), Vercel te permite conectarlo en 1 minuto sin costo extra.
3. **Cero costo de infraestructura**:
   - En el plan Hobby (gratuito) soporta tráfico rápido con CDN mundial.
4. **Configuración SPA lista**:
   - Ya se ha incluido el archivo [`vercel.json`](file:///c:/Users/03331/Desktop/Gestion%20de%20clientes/client/vercel.json) con la regla de redirección para evitar errores 404 al recargar páginas.
