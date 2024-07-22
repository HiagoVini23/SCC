require("dotenv").config();
import express from 'express';
import ContractRoutes from './routes/ContractRoutes';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ContractService } from './services/ContractService';

const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

const PORT = process.env.BACKEND_PORT || 3333;
const app = express();

// configurations
app.use(cors(corsOptions));
app.use(bodyParser.json());

app.use('/contracts', ContractRoutes);

app.listen(PORT as number, () => console.log(`Listening on all interfaces: ${PORT}`));
