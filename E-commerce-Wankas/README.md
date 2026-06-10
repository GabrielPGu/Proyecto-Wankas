# Wankas - Plataforma de Comercio Electrónico Inteligente para Productos Comestibles

Wankas es una plataforma de comercio electrónico de vanguardia diseñada específicamente para la venta y gestión de productos comestibles. El proyecto se distingue por su enfoque en la eficiencia operativa a través de un modelo de "recojo en tienda y pago al momento", y su integración estratégica de capacidades de Inteligencia Artificial para enriquecer la experiencia del usuario y optimizar la gestión culinaria personal.

## Descripción General del Proyecto

El objetivo principal de Wankas es ofrecer una solución integral para la compra de alimentos, permitiendo a los usuarios explorar un catálogo diverso, gestionar sus selecciones en un carrito de compras digital y formalizar pedidos que serán recogidos en una de las sedes físicas designadas. La transacción económica se finaliza en el punto de recolección, simplificando el proceso de pago en línea en esta fase inicial.

Una característica central e innovadora de Wankas es su módulo de inteligencia artificial. Este módulo permite a los usuarios interactuar con la plataforma de una manera completamente nueva: subiendo imágenes de alimentos, el sistema es capaz de reconocer dichos productos y, a partir de ellos, generar sugerencias de recetas. Además, la plataforma identifica los ingredientes que puedan faltar para la preparación de una receta seleccionada y ofrece la opción de añadirlos directamente al carrito de compras desde el catálogo disponible.

## Capacidades Clave del Sistema

El sistema Wankas está estructurado en torno a varias funcionalidades fundamentales que garantizan una experiencia de usuario completa y eficiente:

* **Gestión de Catálogo de Productos:** Proporciona una visualización clara y organizada de productos comestibles, incluyendo imágenes de alta calidad, nombres, precios y unidades de medida. Incorpora funcionalidades de navegación por categorías y subcategorías, búsqueda avanzada por criterios diversos, y opciones de filtrado y ordenamiento dinámicas para una exploración eficiente del inventario. Cada producto cuenta con una página de detalle que puede incluir descripciones extendidas e información nutricional.

* **Módulo de Carrito de Compras:** Permite a los usuarios añadir, eliminar y ajustar las cantidades de productos, con un resumen en tiempo real del subtotal y total. La persistencia del estado del carrito asegura una experiencia de compra continua.

* **Sistema de Autenticación y Perfil de Usuario:** Implementado sobre Firebase Authentication, este módulo gestiona el ciclo de vida del usuario, desde el registro y el inicio/cierre de sesión seguro hasta la recuperación de contraseña. Los usuarios disponen de un área de perfil donde pueden revisar su historial de pedidos y actualizar información personal básica.

* **Proceso de Checkout Optimizado para Recojo en Tienda:** El flujo de finalización de compra se centra exclusivamente en el modelo "recojo en tienda y pago al momento". Los usuarios deben seleccionar obligatoriamente una sede física de Wankas de una lista predefinida, eligiendo también una fecha y un rango horario específico para la recolección de su pedido. Se informa claramente que el pago se realizará al momento de retirar los productos.

* **Funcionalidad Inteligente de Alimentos y Recetas:** Esta es la propuesta de valor distintiva de Wankas:
    * **Identificación Visual de Alimentos:** A través de una interfaz dedicada, los usuarios pueden subir o capturar imágenes de alimentos. El backend procesa estas imágenes utilizando la **Google Cloud Vision API** para identificar los productos presentes, cuyos resultados se presentan al usuario para confirmación.
    * **Generación de Recetas Contextual:** Basándose en los alimentos identificados por el usuario, el sistema utiliza la **Gemini API** para generar sugerencias de recetas relevantes. Estas recetas incluyen título, descripción, ingredientes necesarios y pasos de preparación detallados.
    * **Asistencia para la Compra de Ingredientes:** Una vez que el usuario selecciona una receta, la aplicación compara los ingredientes requeridos con los alimentos previamente identificados. Los ingredientes faltantes son destacados, con la opción de añadirlos directamente al carrito de compras desde el catálogo de Wankas.

## Arquitectura Tecnológica

Wankas se construye sobre una pila tecnológica moderna y escalable, diseñada para la modularidad y la mantenibilidad:

* **Frontend:** Desarrollado con **React** (utilizando Vite para el entorno de desarrollo), emplea **Chakra UI** para el sistema de componentes de la interfaz de usuario y **Framer Motion** para animaciones y transiciones fluidas, asegurando una experiencia de usuario dinámica y responsiva.
* **Backend:** Implementado con **Node.js** y **Express.js**, actúa como una API RESTful que orquesta la lógica de negocio, la interacción con la base de datos y la comunicación con los servicios de IA.
* **Base de Datos:** **Firestore** (parte de Firebase) es utilizada para la persistencia de datos esenciales como productos, usuarios, pedidos y la información de las sedes.
* **Autenticación:** La gestión de usuarios y sesiones se realiza a través de **Firebase Authentication**.
* **Servicios de Inteligencia Artificial:** La **Google Cloud Vision API** es utilizada para el reconocimiento de imágenes de alimentos, mientras que la **Gemini API** se emplea para la generación de contenido textual, específicamente recetas. Ambas integraciones se manejan desde el backend para garantizar la seguridad de las claves de API.

## Integrantes

-Poma Gutierrez Gabriel
-Castilla Huanca Marco
-Basualdo Ale Marcos
