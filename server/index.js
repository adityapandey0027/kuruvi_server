import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { connectDB } from './config/db.js';

import authRouter from './routes/authRoutes.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import categoryRoute from './routes/categoryRoutes.js';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth",authRouter);
app.use("/api/categories", categoryRoute);

app.get('/', (req, res)=>{
    res.send('Server is running');
})


await connectDB();


app.use(errorMiddleware);
app.listen(port, () =>{
    console.log(`Server is running on port ${port}`);
})