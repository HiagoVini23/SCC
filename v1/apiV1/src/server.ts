import { loadEnv } from './utils/env'; // ⬅️ Primeiro isso
const envFlag = process.env.NODE_ENV || '';
loadEnv(envFlag); // ⬅️ Já carrega logo
import express from 'express';
import ContractRoutes from './routes/ContractRoutes';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ContractService } from './services/ContractService';
import { ContractController } from 'controllers/ContractController';
const cc = new ContractController();

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

app.listen(PORT as number, async () => {
    console.log(`Listening on all interfaces: ${PORT}`)
    await cc.startAllEventListeningForSoftware();
});
