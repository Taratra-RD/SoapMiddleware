import express from 'express';

import shopifyRoutes from './src/routes/shopify.routes.js';
import soapRoutes from './src/routes/soap.routes.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/shopify', shopifyRoutes); 
app.use('/soap', soapRoutes); 

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
