import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const SHOPIFY_STORE = process.env.URL_SHOPIFY;
const ACCESS_TOKEN = process.env.ACCESS_SHOPIFY;

const getProductFromShopify = async (req, res) => {
    try {
        let products = [];
        let url = `${SHOPIFY_STORE}/admin/api/2023-01/products.json?limit=100`; // Commence avec une page
        let hasNextPage = true;

        while (hasNextPage) {
            const response = await axios.get(url, {
                headers: {
                    'X-Shopify-Access-Token': ACCESS_TOKEN
                }
            });

            products = [...products, ...response.data.products];

            // Vérifie s'il y a une page suivante dans l'en-tête "Link"
            const linkHeader = response.headers['link'];
            hasNextPage = linkHeader && linkHeader.includes('rel="next"');

            // Si une page suivante existe, extraire l'URL de la page suivante à partir des liens
            if (hasNextPage) {
                const nextPageUrl = linkHeader.split(',').find(part => part.includes('rel="next"')).split(';')[0].trim().slice(1, -1);
                url = nextPageUrl; // Mettre à jour l'URL pour la prochaine requête
            }
        }

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
}


export {
    getProductFromShopify
}