import { Router } from 'express';

// Local Modules
import { supportObjectControllers, addClientController, addCommandControllers, cartAddItemControllers, getInfoClientControllers, getAllOptionControllers, getAllIsbn, getAllAuteurControllers, getProductInfoControllers, getAllProductStockController, getTbCommandController, getProductStockIdControllers, getAllProductStockFromFileController } from '../controllers/soap.controllers.js';

// Initialization
const router = Router();

// Requests 
router.get('/support-object', supportObjectControllers);
router.post('/add-client', addClientController);
router.post('/add-commant', addCommandControllers);
router.post('/cart-add-item', cartAddItemControllers);
router.post('/get-info-client', getInfoClientControllers);
router.post('/get-all-option', getAllOptionControllers);
router.post('/get-all-isbn', getAllIsbn);
router.post('/get-all-auteur', getAllAuteurControllers);
router.post('/get-product-info', getProductInfoControllers);
router.post('/get-all-product-stock', getAllProductStockController);
router.post('/get-tb-command', getTbCommandController);
router.post('/get-product-stock-id', getProductStockIdControllers);
router.get('/get-product-in-stock', getAllProductStockFromFileController)

export default router;