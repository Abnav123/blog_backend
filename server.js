import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import user_routes from './routes/user_routes.js';
import debate_routes from './routes/debate_routes.js';
import argument_routes from './routes/argument_routes.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
    origin: '*'
}));

app.use('/users', user_routes);
app.use('/debates', debate_routes);
app.use('/arguments', argument_routes);

mongoose.connect(process.env.MONGODB_URL)
.then(() => {console.log("Connected to MongoDB Database")})
.catch((err) => {console.log("Error connecting to MongoDB Database", err)});

app.get('/', (req, res) => {
    res.send("Server is running");
});

app.listen(port, () => {
    console.log(`Server is listening on port: ${port} `);
});