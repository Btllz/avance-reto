//Se carga dotenv
require('dotenv').config();

//importa express
const express = require('express');
//app es el nucelo del servidor apra manejar rutas, peticiones y respuestas
const app = express();
//conecta a la base de datos
const mongoose = require('mongoose');

//lee desde .env el puerto que definimos en .env
//si no lo encuentra toma por defecto el puerto 3000 con el operador "|| 3000"
const PORT = process.env.PORT || 3000;
const secretKey = process.env.JWT_SECRET;

//indica al servidor que sabrá entender y procesar datos que lleguen en formato JSON
//ej. cuando un usuario envía su correo y contraseña en un formulario de inicio de sesión
app.use(express.json());

//BASE DE DATOS
mongoose.connect(process.env.DB_URI)
    .then(() => {
        console.log('Conectado exitosamente a mongodb atlas');
})
    .catch(() =>{
        console.error('Error al conectar a la base de datos');
})

//RUTA
//Define una ruta, cuando alguien visite la ruta de la página "http::localhost:300/"
//el servidor responde ejecutando la funcion que recibe dos parametros
//request y response con el texto que definimos en este caso
app.get('/', (req, res) => {
    res.send('Proyecto configurado con exito!');
});

//LEVATNAR EL SERVIDOR
//Pone al servidor en espera en el puerto 3000, cuando se ejecuta esta línea
//el servidor cobra visa y se queda esperando las peticiones
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

