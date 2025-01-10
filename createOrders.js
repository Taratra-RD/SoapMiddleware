import axios from 'axios'
import dotenv from 'dotenv';
dotenv.config();

const SHOPIFY_STORE = process.env.URL_SHOPIFY;
const ACCESS_TOKEN = process.env.ACCESS_SHOPIFY;

const createOrder = async () => {
    const url = `${SHOPIFY_STORE}/admin/api/2023-01/orders.json`; // URL de l'API Shopify
    const orderData = {
        order: {
            email: "customer@example.com", // Adresse e-mail du client
            line_items: [
                {
                    variant_id: 42430453710918, // ID de la variante du produit
                    quantity: 1 // Quantité commandée
                }
            ]
        }
    };

    try {
        const response = await axios.post(url, orderData, {
            headers: {
                'X-Shopify-Access-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        console.log("Order created successfully:", response.data);
    } catch (error) {
        if (error.response) {
            // La requête a été effectuée mais le serveur a répondu avec un code de statut non 2xx
            console.error(`Error creating order: HTTP ${error.response.status}`, error.response.data);
        } else if (error.request) {
            // La requête a été faite mais aucune réponse n'a été reçue
            console.error('Error creating order: No response received', error.request);
        } else {
            // Une erreur s'est produite lors de la configuration de la requête
            console.error('Error creating order:', error.message);
        }
    }
};

createOrder()