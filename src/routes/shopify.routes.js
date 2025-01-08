import { Router } from 'express';

// Local Modules
import {getProductFromShopify} from '../controllers/shopify.controllers.js';

// Initialization
const router = Router();

// Requests 
router.get('/', getProductFromShopify);

export default router;