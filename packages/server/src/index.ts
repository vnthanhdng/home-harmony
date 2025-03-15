// packages/server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import unitRoutes from './routes/unitRoutes';
import memberRoutes from './routes/memberRoutes';
import invitationRoutes from './routes/invitationRoutes';
import authRoutes from './routes/authRoutes';


// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Public health check route
app.get('/', (req, res) => {
  res.send('HomeTeam API is running');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', unitRoutes);
app.use('/api', memberRoutes);
app.use('/api', invitationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

export default app;