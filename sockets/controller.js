const { Socket } = require('socket.io');
const { comprobarJWT } = require('../helpers');
const { ChatMensajes } = require('../models');

const chatMensajes = new ChatMensajes();

const socketController = async ( socket = new Socket(), io ) => {

    // const token = socket.handshake.headers['x-token'];
    const usuario = await comprobarJWT( socket.handshake.headers['x-token'] );
    if ( !usuario ) {
        return socket.disconnect();
    }

    // Agregar el usuario conectado
    chatMensajes.conectarUsuario( usuario );
    // Envia a todos los usuarios la nueva lista de usuarios conectados
    io.emit('usuarios-activos', chatMensajes.usuariosArr );  
    // Envia al nuevo Usuario conectado el Historial de los ultimos 10 chats
    socket.emit('recibir-mensajes', chatMensajes.ultimos10 );  

    // Conectarlo a una sala especial
    socket.join( usuario.id );  // global, socket.id, usuario.id

    // Limpiar cuando algo se desconecta
    socket.on('disconnect', () => {
        chatMensajes.desconectarUsuario( usuario.id );
        io.emit('usuarios-activos', chatMensajes.usuariosArr );
    });

    socket.on('enviar-mensaje', ({ uid, mensaje }) => {

        if ( uid ) {
            // Mensaje privado
            socket.to( uid ).emit('mensaje-privado', { de: usuario.nombre, mensaje });
            
        } else {
            // Mensaje para todos
            chatMensajes.enviarMensaje( usuario.id, usuario.nombre, mensaje );
            io.emit('recibir-mensajes', chatMensajes.ultimos10 );
        }
        
    });

    

}

module.exports = {
    socketController
}