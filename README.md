# Miki App

Aplicación web móvil para kioscos, con **frontend en React** y **backend en Node/Express + SQLite**.  
Permite gestionar productos, compras y caja de manera simple y rápida.

---

## 🚀 Requisitos

- Node.js >= 18
- npm (o yarn)
- SQLite3

---

## 📂 Estructura del proyecto

miki-app/
├── backend/       
│   ├── server.js
│   ├── package.json
│   └── database.sqlite
├── miki-app/       
│   ├── src/
│   ├── public/
│   └── package.json
└── .gitignore


---

## 🔧 Instalación

### 1. Clonar el repo
```bash
git clone https://github.com/adrian-falcon-117/miki-app.git
cd miki-app

Backend
cd backend
npm install
npm start

Esto levanta el servidor en http://localhost:5000 (puedes ajustar el puerto en server.js).

Frontend
cd ../miki-app
npm install
npm start

Esto levanta el frontend en http://localhost:3000.

Scripts útiles
Backend
npm start → corre el servidor con Node.

npm run dev → corre el servidor con nodemon (reinicia automáticamente).

Frontend
npm start → corre la app en modo desarrollo.

npm run build → genera la versión de producción.

Base de datos
Se usa SQLite3 como motor embebido.
