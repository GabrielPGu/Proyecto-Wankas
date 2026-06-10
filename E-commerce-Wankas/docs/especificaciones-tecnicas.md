# Especificaciones Técnicas del Sistema "Wanka's"

## 1. Arquitectura de Software y Entorno de Ejecución

### 1.1. Framework de Aplicación
La aplicación se fundamenta en **Next.js**, utilizando la arquitectura del **App Router**. Este enfoque permite una renderización híbrida (Server-Side Rendering y Client-Side Rendering), optimizando los tiempos de carga inicial (FCP) y la interactividad del cliente. Se emplea un modelo de desarrollo full-stack, donde Next.js gestiona tanto la capa de presentación como la lógica de backend a través de Server Actions.

### 1.2. Lenguaje de Programación
El desarrollo íntegro del proyecto se realiza en **TypeScript**. La adopción de un sistema de tipado estático robustece el código, mejora la mantenibilidad a largo plazo y reduce la incidencia de errores en tiempo de ejecución.

### 1.3. Modelo de Componentes de Interfaz
La interfaz de usuario se implementa bajo el paradigma de componentes de **React**. Esta arquitectura modular facilita la reutilización de código y la gestión del estado a nivel de componente, resultando en una UI declarativa y predecible.

## 2. Gestión de Datos y Lógica de Backend

### 2.1. Proveedor de Backend y Base de Datos
El sistema utiliza **Supabase** como su principal Backend-as-a-Service (BaaS). La persistencia de los datos relacionales (usuarios, productos, pedidos, etc.) se gestiona a través de la base de datos **PostgreSQL** provista por Supabase.

### 2.2. Interfaz de Acceso a Datos
La comunicación con la base de datos desde la aplicación se realiza exclusivamente a través del cliente oficial `supabase-js`, que abstrae las operaciones SQL en una interfaz programática fluida.

### 2.3. Seguridad en la Autenticación
Las credenciales de los usuarios son gestionadas con altos estándares de seguridad. Las contraseñas se someten a un proceso de hashing utilizando el algoritmo **bcrypt** antes de su almacenamiento en la base de datos, garantizando que nunca se guarden en texto plano.

### 2.4. Lógica de Negocio
La lógica de negocio crítica, incluyendo la creación de pedidos y la gestión de inventario, se implementa mediante **Next.js Server Actions**. Este enfoque asegura que dichas operaciones se ejecuten en un entorno de servidor seguro, previniendo la manipulación de la lógica de negocio desde el cliente.

## 3. Integración con Servicios de Inteligencia Artificial

### 3.1. Orquestación de Flujos de IA
La interacción con los modelos de lenguaje se gestiona y orquesta a través del framework **Genkit** de Google. Este framework estructura las llamadas a la API, define esquemas de entrada y salida con **Zod**, y maneja los prompts de manera organizada.

### 3.2. Modelo de IA y Capacidades
Se utiliza la **API de Google AI (Gemini)** como el proveedor de capacidades de inteligencia artificial para las siguientes funcionalidades:
*   **Análisis Visual:** Reconocimiento de objetos (ingredientes) en imágenes proporcionadas por el usuario.
*   **Generación de Lenguaje Natural:** Elaboración de sugerencias de recetas y análisis de ingredientes faltantes.
*   **Generación de Imágenes:** Creación de representaciones visuales fotorrealistas de platos de comida.

## 4. Diseño de Interfaz y Experiencia de Usuario (UI/UX)

### 4.1. Sistema de Diseño y Componentes
Se emplea la librería **ShadCN UI**, que proporciona un conjunto de componentes de UI accesibles, componibles y estilísticamente neutros, construidos sobre Radix UI. Esto asegura una base sólida en términos de accesibilidad y comportamiento.

### 4.2. Framework de Estilos
El diseño visual se implementa a través del framework **Tailwind CSS**. Su enfoque "utility-first" permite un desarrollo rápido y la creación de un sistema de diseño consistente y mantenible sin salir del entorno de marcado.

## 5. Gestión de Estado en el Cliente

### 5.1. Persistencia de Estado
Para garantizar una experiencia de usuario continua, el estado no crítico, como el contenido del carrito de compras y la sesión de usuario, se persiste en el `localStorage` del navegador.

### 5.2. Propagación de Estado Global
El estado global de la aplicación (sesión de usuario, contenido del carrito, configuración regional) se distribuye a través de la **API Context de React**. Este patrón evita el "prop drilling" y proporciona un acceso eficiente al estado desde cualquier componente en el árbol de la aplicación.

## 6. Internacionalización (i18n)

### 6.1. Arquitectura de Localización
El sistema está diseñado para ser multi-idioma. Todas las cadenas de texto visibles para el usuario están abstraídas en archivos de localización (`.ts`).
### 6.2. Implementación
Un proveedor de contexto de React gestiona el idioma activo (`locale`), cargando dinámicamente el objeto de traducciones correspondiente y distribuyéndolo a todos los componentes. Esto permite un cambio de idioma en tiempo real sin necesidad de recargar la página.
