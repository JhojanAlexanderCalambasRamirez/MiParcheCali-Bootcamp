# Contacto:

Alexandercalambas23@gmail.com
+57 3122396877

# MiParcheCali-Bootcamp

Proyecto Final Bootcamp FullStack - Micro servicios.

# Github Repository; 
https://github.com/JhojanAlexanderCalambasRamirez/MiParcheCali-Bootcamp

# Drive con archivos del proyecto;
https://drive.google.com/drive/folders/15hR-HnyXxYo0llPUDlKsljbpfe0CES-z

# Párchate Cali — Backend (Microservicios)

Backend basado en Node.js + Express dividido en 5 microservicios:

| Servicio   | Puerto | Descripción                                           |
| ---------- | :----: | ----------------------------------------------------- |
| Auth       |  3001  | Registro y login (JWT).                               |
| Users      |  3002  | Gestión/consulta de usuarios (requiere token y rol).  |
| Patches    |  3003  | CRUD de parches (planes). Subida de fotos por parche. |
| Favorites  |  3004  | Favoritos de usuarios buscadores.                     |
| Categories |  3005  | CRUD de categorías (ADMIN).                           |

## 1) Requisitos

cors, morgan, dotenv, axios, express, jsonwebtoken, brycptjs, mysql2

## 2) Instalación

En la terminal ejecuta;

npm init -y
npm install

El `package.json` ya incluye todas las dependencias: `express`, `mysql2`, `jsonwebtoken`, `bcryptjs`, etc.

# Conexión a MySQL/MariaDB

DB_HOST=Localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=parchecali

CORS_ORIGINS=http://localhost:5500

# 3) Base de datos

Crea la BD y tablas. Puedes ejecutar el siguiente script una sola vez
(en `mysql` o `mariadb` CLI, o con un cliente gráfico):

# sql
CREATE DATABASE IF NOT EXISTS parchecali
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE parchecali;

-- 1) Usuarios
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('ADMIN','USUARIO_BUSCADOR','USUARIO_EMPRESA') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB;

-- 2) Categorías
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  slug   VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 3) Parches 
CREATE TABLE IF NOT EXISTS patches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  categoria_id BIGINT UNSIGNED NOT NULL,
  descripcion TEXT NOT NULL,
  zona VARCHAR(120) NOT NULL,
  telefono VARCHAR(40) NOT NULL,
  direccion VARCHAR(200) NOT NULL,
  link_red_social VARCHAR(250) NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  cover_image_url VARCHAR(300) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_patches_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_patches_categoria FOREIGN KEY (categoria_id) REFERENCES categories(id),
  INDEX idx_patches_categoria (categoria_id),
  INDEX idx_patches_user (user_id),
  FULLTEXT KEY ftx_patches_text (titulo, descripcion, zona, direccion)
) ENGINE=InnoDB;

-- 4) Fotos por parche
CREATE TABLE IF NOT EXISTS patch_photos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patch_id BIGINT UNSIGNED NOT NULL,
  url VARCHAR(300) NOT NULL,
  posicion TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_photos_patch FOREIGN KEY (patch_id) REFERENCES patches(id),
  INDEX idx_patch_photos_patch (patch_id)
) ENGINE=InnoDB;

-- 5) Favoritos
CREATE TABLE IF NOT EXISTS favorites (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  patch_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fav_user  FOREIGN KEY (user_id)  REFERENCES users(id),
  CONSTRAINT fk_fav_patch FOREIGN KEY (patch_id) REFERENCES patches(id),
  UNIQUE KEY uq_user_patch (user_id, patch_id),
  INDEX idx_fav_user (user_id),
  INDEX idx_fav_patch (patch_id)
) ENGINE=InnoDB;


# 4) Ejecutar los microservicios

Abre **una terminal por servicio** dentro de `Backend/`:

npm run dev:auth
npm run dev:users
npm run dev:categories
npm run dev:patches
npm run dev:favorites

Puertos esperados al arrancar:

* Auth → `http://localhost:3001`
* Users → `http://localhost:3002`
* Patches → `http://localhost:3003`
* Favorites → `http://localhost:3004`
* Categories → `http://localhost:3005`

* **CORS / Frontend no puede llamar**
  Si tu frontend corre en `http://localhost:5500`, configura CORS para permitir ese origen (o usa `cors()` abierto durante desarrollo).

¡Listo! Con esto puedes **instalar dependencias**, **levantar** los 5 microservicios y **probar** el flujo básico end-to-end en local.
