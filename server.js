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
const cors = require('cors');

//lee desde .env el puerto que definimos en .env
//si no lo encuentra toma por defecto el puerto 3000 con el operador "|| 3000"
const PORT = process.env.PORT || 3000;
const secretKey = process.env.JWT_SECRET;

//indica al servidor que sabrá entender y procesar datos que lleguen en formato JSON
//ej. cuando un usuario envía su correo y contraseña en un formulario de inicio de sesión
app.use(express.json());
app.use(cors());



//------SCHEMAS-------
//un schema es la estructura que define como se ven los documentos dentro de una coleccion de MDB
const userSchema = new mongoose.Schema({
    username: {type: String, unique: true, require: true, trim: true},
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



//---------BASE DE DATOS-------
mongoose.connect(process.env.DB_URI)
    .then(() => {
        console.log('Conectado exitosamente a mongodb atlas');
})
    .catch(() =>{
        console.error('Error al conectar a la base de datos');
})



//-------RUTA DE INICIO DE SESION--------
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
        await nuevoUsuario.save();


        res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            usuario: {username: nuevoUsuario.username, correo: nuevoUsuario.correo}
        })
    } catch(error){
        res.status(500).json({mensaje: 'Error en el servidor', error: error.message})
    }
});



//--------LOGIN--------
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
        return res.status(400).json({mensaje: "Contraseña incorrecta"});
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




//-------MATERIALES--------
const verifircarToken = (req, res, next) =>{
    //header de autorizacion
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    if (!token){
        return res.status(401).json({mensaje: 'Acceso denegado. No se encontró un token de autenticación'});
    }

    try {
        //Verificamos el token usando la clave secreta
        const verificado = jwt.verify(token, secretKey);

        //guarda los datos del usuario decodificados en la peticion por si los necesitamos luego
        req.user = verificado;

        //Todo bien, dejamos pasar la ruta que sigue
        next();
    } catch (error){
        return res.status(403).json({mensaje: 'Token inválido o expirado.'});
    }
}




//--------AGREGAR MATERIALES----------
app.post('/api/materiales', verifircarToken, async (req, res) => {
    try {
        const {material, cantidad, lote, disponible, tipoMovimiento} = req.body;

        const nuevoMaterial = new Material ({
            material,
            cantidad,
            lote, 
            disponible,
            tipoMovimiento
        });

        await nuevoMaterial.save();

        res.status(201).json({
            mensaje: 'Material registrado exitosamente',
            material: nuevoMaterial
        });
    } catch (error){
        res.status(500).json({mensaje: 'Error al registrar el material', error: error.message});
    }
});

//-------------RUTA PARA OBTENER TODOS LOS MATERIALES------------
app.get('/api/materiales', verifircarToken, async (req, res) =>{
    try {
        //Método para obtener todos los materiales
        const materiales = await Material.find();

        res.status(200).json({
            mensaje: 'Lista de materiales obtenida con exito',
            total: materiales.length,
            materiales
        });
    } catch (error){
        res.status(500).json({
            mensaje: 'Error al obtener los materiales',
            error: error.message
        });
    }
});



//--------------RUTA PARA ENTRADAS Y SALIDAS------------------
app.put('/api/materiales/:id', verifircarToken, async (req, res) => {
    try{
        const {id} = req.params; 
        const cleanId = id.trim()
        const {material, cantidad, lote, disponible, tipoMovimiento} = req.body;

        const materialesActualizados = await Material.findByIdAndUpdate(
            cleanId,
            {material, cantidad, lote, disponible, tipoMovimiento},
            {new: true} //hace que devuelva el documento nuevo y no el viejo
        );

        if (!materialesActualizados) {
            return res.status(404).json({mensaje: 'Material no encontrado'});
        }

        res.status(200).json({
            mensaje: 'Stock/Material actualizado exitosamente',
            material: materialesActualizados
        });
    } catch(error){
        res.status(500).json ({mensaje: 'Error al actualizar el material', error: error.message});
    }
});

//---------------RUTA PARA ELIMINAR UN MATERIAL----------------
app.delete('/api/materiales/:id', verifircarToken, async (req, res) => {

    try {
        const {id} = req.params;
        const cleanId = id.trim();

        const materialEliminado = await Material.findByIdAndDelete(cleanId);
        
        if(!materialEliminado){
            return res.status(404).json({mensaje: 'Material no encontrado'});
        }

        res.status(200).json({
            mensaje: 'Material eliminado correctamente',
            material: materialEliminado
        });
    } catch (error){
        res.status(500).json({mensaje: 'Error al eliminar el material', error: error.message});
    }
})



//-------------------RUTA PRINCIPAL-------------------
//Define una ruta, cuando alguien visite la ruta de la página "http::localhost:300/"
//el servidor responde ejecutando la funcion que recibe dos parametros
//request y response con el texto que definimos en este caso

//--------------------LEVANTAR EL SERVIDOR------------------
//Pone al servidor en espera en el puerto 3000, cuando se ejecuta esta línea
//el servidor cobra visa y se queda esperando las peticiones
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});