//Se carga dotenv
require('dotenv').config();

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const secretKey = process.env.JWT_SECTRET;

const http = require('http');

//Crea un servidor y acepta un callback con dos parametros request y response
const servidor = http.createServer((req, res) =>{

    //cabecera, especifica el tipo de estado HTTP (200 = exito) y el contenido (text/plain)
    res.writeHead(200, { 'Content-Type' : 'text/plain'});

    //respuesta al cliente
    res.end('Hola mundo desde Node.js\n');
});

console.log('Intentado iniciar el servidor...');

//pone al servidor en escucha en el puerto definido (3000)
servidor.listen(PORT, () => {
    console.log(`El servidor está corriendo desde el puerto ${PORT}`);
});