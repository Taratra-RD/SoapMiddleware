import fn from 'fs/promises';
import fetch from 'node-fetch';
import { DOMParser } from 'xmldom';
import { transformStockList } from '../utils/soap.utils.js';
import { getProductInfo } from '../utils/soap.utils.js';
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const SHOPIFY_STORE = process.env.URL_SHOPIFY;
const ACCESS_TOKEN = process.env.ACCESS_SHOPIFY;
const apiLog = process.env.API_LOG;
const apiKey = process.env.API_KEY;
const actif = 1;

const fetchAllShopifyProducts = async () => {
    
    try {
        let products = [];
        let url = `${SHOPIFY_STORE}/admin/api/2023-01/products.json?limit=250`; // Commence avec une page
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

        // Sauvegarder les produits dans un fichier JSON
        fs.writeFileSync('shopify_products.json', JSON.stringify(products, null, 2)); // Formattage avec indentation

        console.log('Les produits ont été enregistrés dans "shopify_products.json".');
    } catch (error) {
        console.error('Error fetching products:', error);
    }
};

const syncShopifyProducts = async () => {
    try {
        // Charger les fichiers JSON
        const appProducts = JSON.parse(await fn.readFile('./src/middlewares/product.json', 'utf-8'));
        const shopifyProducts = JSON.parse(await fn.readFile('./src/utils/shopify_products.json', 'utf-8'));

        for (const appProduct of appProducts) {
            try {
                // Trouver le produit correspondant dans Shopify
                const existingProduct = shopifyProducts.find(
                    (shopifyProduct) => shopifyProduct.vendor === appProduct.prd_id
                );

                if (existingProduct) {
                    // Mise à jour du produit existant
                    console.log(`Produit trouvé : ${existingProduct.title}`);

                    for (const appVariant of appProduct.variants) {
                        try {
                            const existingVariant = existingProduct.variants.find(
                                (shopifyVariant) => shopifyVariant.sku === appVariant.stock_ean13
                            );

                            if (existingVariant) {
                                // Vérifiez si la quantité est différente
                                const quantityChanged =
                                    existingVariant.inventory_quantity !== parseInt(appVariant.stock_qt);

                                if (quantityChanged) {
                                    console.log(`Mise à jour de la variante SKU ${existingVariant.sku}`);
                                    const updateUrl = `${SHOPIFY_STORE}/admin/api/2023-01/variants/${existingVariant.id}.json`;
                                    /*await axios.put(updateUrl, {
                                        variant: {
                                            id: existingVariant.id,
                                            inventory_quantity: parseInt(appVariant.stock_qt),
                                        },
                                    }, {
                                        headers: {
                                            'X-Shopify-Access-Token': ACCESS_TOKEN,
                                        },
                                    });*/
                                    try {
                                        await axios.put(updateUrl, {
                                            variant: {
                                                id: existingVariant.id,
                                                inventory_quantity: parseInt(appVariant.stock_qt),
                                            },
                                        }, {
                                            headers: {
                                                'X-Shopify-Access-Token': ACCESS_TOKEN,
                                            },
                                        });
                                    } catch (error) {
                                        console.error(`Erreur lors de la mise à jour de la variante SKU ${existingVariant.sku}`);
                                        if (error.response) {
                                            console.error('Code de statut:', error.response.status);
                                            console.error('Données de réponse:', JSON.stringify(error.response.data, null, 2));
                                        } else {
                                            console.error('Erreur:', error.message);
                                        }
                                    }
                                }
                            } else {
                                // Ajouter une nouvelle variante
                                console.log(`Ajout d'une nouvelle variante SKU ${appVariant.stock_ean13}`);
                                const addVariantUrl = `${SHOPIFY_STORE}/admin/api/2023-01/products/${existingProduct.id}/variants.json`;
                                await axios.post(addVariantUrl, {
                                    variant: {
                                        sku: appVariant.stock_ean13,
                                        inventory_quantity: parseInt(appVariant.stock_qt),
                                        price: appProduct.productInfo?.isbnList[0]?.prd_px_euro || '0.00',
                                    },
                                }, {
                                    headers: {
                                        'X-Shopify-Access-Token': ACCESS_TOKEN,
                                    },
                                });
                            }
                        } catch (variantError) {
                            console.error(`Erreur lors du traitement de la variante SKU ${appVariant.stock_ean13} :`, variantError.message);
                        }
                    }
                } else {
                    // Créer un nouveau produit
                    console.log(`Ajout d'un nouveau produit avec ID ${appProduct.prd_id}`);
                    const createUrl = `${SHOPIFY_STORE}/admin/api/2023-01/products.json`;
                    await axios.post(createUrl, {
                        product: {
                            title: appProduct.productInfo?.isbnList[0]?.prd_libel || 'Produit Sans Nom',
                            body_html: appProduct.productInfo?.isbnList[0]?.prd_large_description || '',
                            vendor: appProduct.prd_id,
                            product_type: appProduct.productInfo?.isbnList[0]?.prd_categorie || '',
                            variants: appProduct.variants.map((variant) => ({
                                sku: variant.stock_ean13,
                                inventory_quantity: parseInt(variant.stock_qt),
                                price: appProduct.productInfo?.isbnList[0]?.prd_px_euro || '0.00',
                            })),
                        },
                    }, {
                        headers: {
                            'X-Shopify-Access-Token': ACCESS_TOKEN,
                        },
                    });
                }
            } catch (productError) {
                console.error(`Erreur lors du traitement du produit ID ${appProduct.prd_id} :`, productError.message);
            }
        }

        console.log('Synchronisation terminée.');
    } catch (error) {
        console.error('Erreur générale lors de la synchronisation avec Shopify :', error.message);
    }
};

async function fetchAndUpdateProductData(apiLog, apiKey, actif) {
    const filePath = './product.json'; // Path to JSON file
    const headersList = {
        "Accept": "*/*",
        "User-Agent": "Node Fetch",
        "Content-Type": "text/xml",
        "SOAPAction": "http://soapdev.netcomvad.com/soap_pro.php#GetAllProductStock"
    };

    const bodyContent = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
        <soapenv:Header/>
        <soapenv:Body>
            <bus:GetAllProductStock>
                <api_log>${apiLog}</api_log>
                <api_key>${apiKey}</api_key>
                <actif>${actif}</actif>
            </bus:GetAllProductStock>
        </soapenv:Body>
    </soapenv:Envelope>`;

    while (true) {
        try {
            console.log("Fetching product stock data...");
            await fetchAllShopifyProducts();
            // Fetch SOAP data
            const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
                method: "POST",
                body: bodyContent,
                headers: headersList
            });

            const data = await response.text();

            // Parse the XML response
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "application/xml");

            const items = xmlDoc.getElementsByTagName("item");
            const stockList = Array.from(items).map(item => ({
                prd_id: item.getElementsByTagName("prd_id")[0]?.textContent,
                stock_ean13: item.getElementsByTagName("stock_ean13")[0]?.textContent,
                stock_qt: item.getElementsByTagName("stock_qt")[0]?.textContent,
                stock_actif: item.getElementsByTagName("stock_actif")[0]?.textContent,
                stock_suivi: item.getElementsByTagName("stock_suivi")[0]?.textContent
            }));

            // Optional: Transform stock list as needed
            const formatStockList = transformStockList(stockList);
            const productInfo = await getProductInfo(formatStockList);

            // Write to JSON file
            const jsonData = JSON.stringify(productInfo, null, 2);

            // Write to JSON file
            await fn.writeFile(filePath, jsonData, 'utf8');
            console.log(`Updated product data written to ${filePath}.`);

            await syncShopifyProducts();
            // Delay before the next update
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
        } catch (error) {
            console.error("Error fetching or updating product data:", error);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before retrying
        }
    }
}

fetchAndUpdateProductData(apiLog, apiKey, actif);

export default fetchAndUpdateProductData;
