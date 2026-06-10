# Wanka's - Panel de Administración

Este es el panel de administración para el sistema de Wanka's, desarrollado con Next.js.

## Despliegue Local

Para ejecutar este proyecto en tu entorno local, sigue los siguientes pasos:

### Prerrequisitos

Asegúrate de tener instalado lo siguiente:
- [Node.js](https://nodejs.org/) (versión LTS recomendada)
- npm (se instala junto con Node.js)

### Pasos de Instalación

1.  **Instalar Dependencias:**
    Abre una terminal en la raíz del proyecto y ejecuta el siguiente comando para instalar todas las dependencias necesarias:
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno:**
    Crea un archivo llamado `.env.local` en la raíz del proyecto. Este archivo contendrá las claves para conectarse a la base de datos de Supabase. Añade las siguientes líneas, reemplazando los valores de ejemplo con tus propias claves:
    ```
    NEXT_PUBLIC_SUPABASE_URL=TU_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
    ```

3.  **Ejecutar el Servidor de Desarrollo:**
    Una vez instaladas las dependencias y configuradas las variables, ejecuta el siguiente comando para iniciar la aplicación:
    ```bash
    npm run dev
    ```

4.  **Abrir en el Navegador:**
    La aplicación estará disponible en `http://localhost:9002`.

¡Y eso es todo! Ahora tienes el panel de administración funcionando localmente.
