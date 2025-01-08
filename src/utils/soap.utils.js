import fetch from 'node-fetch';
import fs from 'fs';
import axios from 'axios';
import fn from 'fs/promises';

const SHOPIFY_STORE = process.env.URL_SHOPIFY;
const ACCESS_TOKEN = process.env.ACCESS_SHOPIFY;

function transformStockList(stockList) {
    const transformedStockList = {};

    stockList.forEach(item => {
        const { prd_id, stock_ean13, stock_qt, stock_actif, stock_suivi } = item;

        if (!transformedStockList[prd_id]) {
            transformedStockList[prd_id] = {
                prd_id: prd_id,
                variants: []
            };
        }

        transformedStockList[prd_id].variants.push({
            stock_ean13: stock_ean13,
            stock_qt: stock_qt,
            stock_actif: stock_actif,
            stock_suivi: stock_suivi
        });
    });

    // Convertir l'objet en tableau
    return Object.values(transformedStockList);
}

async function getProductInfo(formatStockList) {
    const batchSize = 10; // Number of products to fetch in one request
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms)); // Delay function

    const results = [];

    for (let i = 0; i < formatStockList.length; i += batchSize) {
        const batch = formatStockList.slice(i, i + batchSize);
        const batchPromises = batch.map(async stockItem => {
            const prd_id = stockItem.prd_id;
            try {
                const response = await fetch("http://localhost:3000/soap/get-product-info", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json' // Set the content type to JSON
                    },
                    body: JSON.stringify({
                        api_log: '625789',
                        api_key: '789da23ef034810c2e3295fea47532a342ecf61e',
                        product_id: prd_id
                    }),
                });
                let responseData = await response.json();
                if (process.env.NODE_ENV === 'development') {
                    console.log('productInfo', prd_id);
                }
                return {
                    ...stockItem,
                    productInfo: responseData, // Ajout de productInfo directement sous prd_id
                    variants: stockItem.variants.map(variant => ({
                        ...variant
                    }))
                };
            } catch (error) {
                console.error(`Error fetching product info for prd_id ${prd_id}:`, error);
                return stockItem; // Return the original stockItem if there's an error
            }
        });

        // Wait for all promises in the batch to resolve
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Delay before the next batch
        await delay(1000); // Delay for 1 second (adjust as needed)
    }

    return results;
}

const deleteAllProducts = async () => {
    try {
        // Étape 1: Obtenir tous les produits
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

            // Vérifier si une page suivante existe
            const linkHeader = response.headers['link'];
            hasNextPage = linkHeader && linkHeader.includes('rel="next"');

            if (hasNextPage) {
                const nextPageUrl = linkHeader.split(',').find(part => part.includes('rel="next"')).split(';')[0].trim().slice(1, -1);
                url = nextPageUrl; // Mettre à jour l'URL pour la page suivante
            }
        }

        console.log(`Nombre de produits à supprimer: ${products.length}`);

        // Étape 2: Supprimer chaque produit
        for (const product of products) {
            const productId = product.id;
            console.log(`Suppression du produit avec ID: ${productId}`);

            const deleteUrl = `${SHOPIFY_STORE}/admin/api/2023-01/products/${productId}.json`;

            try {
                await axios.delete(deleteUrl, {
                    headers: {
                        'X-Shopify-Access-Token': ACCESS_TOKEN
                    }
                });

                console.log(`Produit avec ID ${productId} supprimé`);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log(`Produit avec ID ${productId} déjà supprimé ou introuvable. Ignoré.`);
                } else {
                    console.error(`Erreur lors de la suppression du produit avec ID ${productId}:`, error.message);
                }
            }
        }

        console.log('Tous les produits ont été supprimés.');

    } catch (error) {
        console.error('Erreur lors de la suppression des produits:', error);
    }
};


//fetchAllShopifyProducts()
export { transformStockList, getProductInfo };