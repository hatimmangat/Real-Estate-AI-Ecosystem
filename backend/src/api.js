import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './database/db.js';
import authRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import agencyRoutes from './routes/companies.routes.js';
import propertyRoutes from './routes/property.routes.js';
import reviewRoutes from './routes/review.routes.js';
import adRoutes from './routes/ad.routes.js';
import auctionRoutes from './routes/auction.routes.js';
import investmentRoutes from './routes/investment.routes.js';
import chatRoutes from './routes/chatbot.routes.js';
import interiorDesignRoutes from './routes/interiorDesign.routes.js';
import projectRoutes from './routes/project.routes.js';
import housePriceRoutes from './routes/housePrice.routes.js';
import geoEncodeRoutes from './routes/geoEnc.routes.js';
const app = express();
const port = process.env.PORT || 8000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://estateepro.netlify.app'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB()
  .then(() => {
    console.log('Database connected, Server Started Successfully');
  })
  .catch((error) => {
    console.error('Failed to start server due to DB connection error:', error.message);
    process.exit(1);
  });

app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/chatbot', chatRoutes);
app.use('/api/interior-design', interiorDesignRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/house-price', housePriceRoutes);
app.use('/api/geocode', geoEncodeRoutes);
app.get('/', (req, res) => {
  res.status(200).send('Server is running!');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});