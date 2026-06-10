# A Tener en Cuenta para Configurar y Ejecutar el Proyecto

Este documento proporciona una guía sobre los requisitos y pasos para configurar y ejecutar este proyecto Next.js con Supabase y Genkit.

## 1. Prerrequisitos

Asegúrate de tener instalado lo siguiente en tu sistema:

*   **Node.js**: Se recomienda la versión LTS (Long Term Support) o superior. Puedes descargarlo desde [nodejs.org](https://nodejs.org/).
*   **npm** (Node Package Manager): Generalmente se instala junto con Node.js.
    *   Opcionalmente, puedes usar **yarn** como gestor de paquetes.

## 2. Configuración del Proyecto

1.  **Clonar el Repositorio**:
    Si estás trabajando con un repositorio Git, clónalo a tu máquina local:
    ```bash
    git clone <url-del-repositorio>
    cd <nombre-del-directorio-del-proyecto>
    ```

2.  **Instalar Dependencias**:
    Este proyecto utiliza `package.json` para gestionar sus dependencias. Para instalarlas, ejecuta el siguiente comando en la raíz del proyecto:
    ```bash
    npm install
    ```
    o si usas yarn:
    ```bash
    yarn install
    ```
    Esto creará una carpeta `node_modules` con todas las dependencias necesarias.

## 3. Variables de Entorno

El proyecto requiere ciertas variables de entorno para funcionar correctamente, especialmente para la conexión con Supabase y Google AI (Genkit).

1.  Crea un archivo llamado `.env` en la raíz de tu proyecto (este archivo está en `.gitignore` y no debe ser subido al control de versiones).
2.  Añade las siguientes variables a tu archivo `.env` y reemplaza los valores de ejemplo con tus propias claves:

    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase

    # Google AI (para Genkit)
    GOOGLE_API_KEY=tu_api_key_de_google_ai
    ```

    *   **`NEXT_PUBLIC_SUPABASE_URL`**: La URL de tu proyecto Supabase.
    *   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: La clave anónima (pública) de tu proyecto Supabase.
    *   **`GOOGLE_API_KEY`**: Tu clave API para los servicios de Google AI (como Gemini) que utiliza Genkit.

    Puedes obtener estas claves desde tus respectivos dashboards de Supabase y Google AI Studio.

## 4. Ejecutar la Aplicación

El proyecto tiene dos componentes principales que necesitan ser ejecutados para el desarrollo:

1.  **Servidor de Desarrollo de Next.js**:
    Inicia la aplicación Next.js (frontend):
    ```bash
    npm run dev
    ```
    Esto usualmente levantará la aplicación en `http://localhost:9002` (o el puerto configurado en `package.json`).

2.  **Servidor de Desarrollo de Genkit**:
    En una terminal separada, inicia el servidor de desarrollo de Genkit para las funciones de IA:
    ```bash
    npm run genkit:dev
    ```
    o para que se reinicie automáticamente con los cambios:
    ```bash
    npm run genkit:watch
    ```
    Genkit usualmente corre en `http://localhost:3400` y la UI de inspección en `http://localhost:4000`.

## 5. Configuración del Backend (Supabase)

Este proyecto asume que tienes un backend de Supabase configurado con las siguientes tablas y consideraciones:

*   **Tablas Necesarias**:
    *   `categories`: Para las categorías de productos.
        *   Columnas esperadas: `id` (uuid, pk), `name_es` (text).
    *   `products`: Para los productos.
        *   Columnas esperadas: `id` (uuid, pk), `name_es` (text), `description_es` (text), `price` (numeric), `stock` (integer), `image_urls` (text[]), `thumbnail_url` (text), `category_id` (uuid, fk a `categories.id`).
    *   `profiles`: Para los perfiles de usuario.
        *   Columnas esperadas: `id` (uuid, pk, fk a `auth.users.id`), `name` (text), `email` (text, unique), `phone_number` (text, nullable).
    *   `locations`: Para las ubicaciones de las tiendas.
        *   Columnas esperadas: `id` (uuid, pk), `name_es` (text), `address` (text), `opening_hours_es` (text o jsonb), `latitude` (numeric, nullable), `longitude` (numeric, nullable).
    *   `orders`: Para los pedidos.
        *   Columnas esperadas: `id` (uuid, pk), `user_id` (uuid, fk a `profiles.id`), `location_id` (uuid, fk a `locations.id`), `order_date` (timestampz, default now()), `pickup_date` (timestampz), `status` (text, default 'pending'), `total_price` (numeric), `notes` (text, nullable).
    *   `order_items`: Para los artículos de un pedido.
        *   Columnas esperadas: `order_id` (uuid, pk, fk a `orders.id`), `product_id` (uuid, pk, fk a `products.id`), `quantity` (integer), `price_at_purchase` (numeric).

*   **Autenticación**:
    *   El registro y login simulado se conecta a la tabla `profiles`. Para una autenticación real completa, deberías integrar Supabase Auth y asegurar que la creación de perfiles esté vinculada a `auth.users`.
    *   Considera configurar la confirmación por correo electrónico en Supabase Auth si deseas un flujo de verificación real.

*   **Políticas de Seguridad a Nivel de Fila (RLS)**:
    *   Es **altamente recomendable** configurar políticas RLS en todas tus tablas para asegurar que los usuarios solo puedan acceder y modificar los datos que les corresponden. Por ejemplo:
        *   Los usuarios solo pueden leer sus propios perfiles.
        *   Los usuarios solo pueden crear pedidos para sí mismos.
        *   Los usuarios solo pueden leer sus propios pedidos.
        *   Las tablas públicas como `products`, `categories`, y `locations` pueden tener RLS que permitan lectura a todos los usuarios (autenticados o anónimos según tu necesidad).
    *   Para la cancelación de pedidos, la lógica actual permite que un usuario intente cancelar *su propio* pedido si está *pendiente*. La `anon key` de Supabase necesitará permisos de `UPDATE` en la tabla `orders` para que esto funcione sin RLS específicas que permitan esta acción de forma más granular. Una RLS bien configurada sería una capa de seguridad adicional.

*   **Storage**:
    *   Asegúrate de tener un bucket público en Supabase Storage (por ejemplo, `product-images`) para almacenar las imágenes de los productos si las URLs apuntan allí.

Siguiendo estos pasos, deberías poder configurar y ejecutar el proyecto en tu entorno de desarrollo.
