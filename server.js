//Se carga dotenv
require('dotenv').config();

//importa express
const express = require('express');
//app es el nucelo del servidor apra manejar rutas, peticiones y respuestas
const app = express();
//conecta a la base de datos
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('node:path');
const jwt = require('jsonwebtoken');

let renderHTML = path.resolve(__dirname, '..index.html');

//lee desde .env el puerto que definimos en .env
//si no lo encuentra toma por defecto el puerto 3000 con el operador "|| 3000"
const PORT = process.env.PORT || 3000;
const secretKey = process.env.JWT_SECRET;

//indica al servidor que sabrá entender y procesar datos que lleguen en formato JSON
//ej. cuando un usuario envía su correo y contraseña en un formulario de inicio de sesión
app.use(express.json());


//un schema es la estructura que define como se ven los documentos dentro de una coleccion de MDB
const userSchema = new mongoose.Schema({
    correo: {type: String, unique: true, required: true, trim: true, lowercase: true},
    contraseña: {type: String, required: true, trim: true}
});

const User = mongoose.model('User', userSchema);

const materialSchema = new mongoose.Schema({
    material: {type: String, required: true},
    cantidad: {type: Number, required: true},
    lote: {type: String, required: true},
    disponible: {type: Boolean, required: true},
    tipoMovimiento: {type: String, required: true}
});

const Material = mongoose.model('Material', materialSchema);



//BASE DE DATOS
mongoose.connect(process.env.DB_URI)
    .then(() => {
        console.log('Conectado exitosamente a mongodb atlas');
})
    .catch(() =>{
        console.error('Error al conectar a la base de datos');
})

//RUTA DE INICIO DE SESION
app.post('/api/auth/register', async (req, res) => {
    try {
        const {username, correo, contraseña} = req.body;

        const usuarioExistente = await User.findOne({correo});
        if (usuarioExistente) {
            return res.status(400).json({mensaje: 'El correo ya está registrado'});
        }

        const salt = await bcrypt.genSalt(10);
        const contraseñaEncriptada = await bcrypt.hash(contraseña, salt);

        //plantilla para nuevo usuario
        const nuevoUsuario = new User ({
            username,
            correo,
            contraseña: contraseñaEncriptada
        });

        //guarda el nuevo usuario
        await nuevoUsario.save();


        res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            usuario: {username: nuevoUsuario.username, correo: nuevoUsuario.correo}
        })
    } catch(error){
        res.status(500).json({mensaje: 'Error en el servidor', error: error.message})
    }
});

app.post('/api/auth/login', async (req, res) => {
    try{
    const {correo, contraseña} = req.body;

    //Busca si el usuario existe
    const usuario = await User.findOne({correo});
    if (!usuario) {
        return res.status(400).json({mensaje: 'Correo o contraseña incorrectos'});
    }

    //Compara la contraseña ingresada
    const contraseñaCorrecta = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contraseñaCorrecta) {
        return res.sendStatus(400).json({mensaje: "Contraseña incorrecta"});
    }

    const token = jwt.sign(
        {id: usuario._id, correo: usuario.correo},
        secretKey,
        {expiresIn: '2h'}
    );

    //si es correcto se genera un token JWT 
    res.json({
        mensaje: 'Inicio de sesion correcto',
        token: token
    });

    } catch(error){
      res.status(500).json({mensaje: 'Error en el servidor', error: error.message });  
    }
});

//RUTA
//Define una ruta, cuando alguien visite la ruta de la página "http::localhost:300/"
//el servidor responde ejecutando la funcion que recibe dos parametros
//request y response con el texto que definimos en este caso
app.get('/', (req, res) => {
    res.sendFile(renderHTML);
});

//LEVATNAR EL SERVIDOR
//Pone al servidor en espera en el puerto 3000, cuando se ejecuta esta línea
//el servidor cobra visa y se queda esperando las peticiones
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

