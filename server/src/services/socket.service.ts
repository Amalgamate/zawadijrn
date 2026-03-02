
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
    user?: any;
}

let io: SocketIOServer;

export const initializeSocket = (httpServer: any) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*", // Adjust for production
            methods: ["GET", "POST"]
        }
    });

    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const secret = process.env.JWT_SECRET || 'fallback_secret_should_be_changed';
            const decoded = jwt.verify(token, secret);
            socket.user = decoded;
            next();
        } catch (err) {
            console.error("Socket auth error:", err);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`🔌 User connected to socket: ${socket.user?.id} (${socket.user?.email})`);

        // Join user's personal room for direct notifications
        if (socket.user?.id) {
            socket.join(socket.user.id);
        }

        // Join ticket room
        socket.on('join_ticket', (ticketId: string) => {
            console.log(`User ${socket.user?.id} joined ticket room: ${ticketId}`);
            socket.join(ticketId);
        });

        socket.on('leave_ticket', (ticketId: string) => {
            socket.leave(ticketId);
        });

        socket.on('disconnect', () => {
            // console.log('User disconnected from socket');
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
