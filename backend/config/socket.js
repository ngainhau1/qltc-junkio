const { Server } = require('socket.io');

let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                credentials: true
            }
        });
        
        io.on('connection', (socket) => {
            console.log(`🔌 Client connected via WebSockets: ${socket.id}`);
            
            socket.on('join_user_room', (userId) => {
                // User joins their personal room for private notifications
                socket.join(userId);
                console.log(`User ${userId} joined their personal socket room.`);
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
