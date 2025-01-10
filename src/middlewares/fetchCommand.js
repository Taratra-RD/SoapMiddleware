import fn from 'fs/promises';
import fetch from 'node-fetch';
import { DOMParser } from 'xmldom';
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const SHOPIFY_STORE = process.env.URL_SHOPIFY;
const ACCESS_TOKEN = process.env.ACCESS_SHOPIFY;
const API_LOG = process.env.API_LOG;
const API_KEY = process.env.API_KEY;

async function fetchAllCommands(apiLog, apiKey, idClient) {
    const filePath = './command.json';
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
            <bus:GetTbCommandes>
                <api_log>${apiLog}</api_log>
                <api_key>${apiKey}</api_key>
                <params>
                    <id_client>
                        ${idClient}
                    </id_client>
                </params>
            </bus:GetTbCommandes>
        </soapenv:Body>
    </soapenv:Envelope>`;

    const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
        method: "POST",
        body: bodyContent,
        headers: headersList
    });

    const data = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, "application/xml");

    const items = xmlDoc.getElementsByTagName("item");

    const stockList = await Promise.all(Array.from(items).map(async (item) => {
        const cde_id = item.getElementsByTagName("cde_id")[0]?.textContent || null;

        // Fetch details for the current cde_id
        const commandDetails = cde_id ? await fetchCommandeDetail(apiLog, apiKey, cde_id) : [];

        return {
            cde_id,
            cde_dt: item.getElementsByTagName("cde_dt")[0]?.textContent || '',
            cde_num: item.getElementsByTagName("cde_num")[0]?.textContent || '',
            cde_client_id: item.getElementsByTagName("cde_client_id")[0]?.textContent || '',
            cde_nom: item.getElementsByTagName("cde_nom")[0]?.textContent || '',
            cde_prenom: item.getElementsByTagName("cde_prenom")[0]?.textContent || '',
            cde_email: item.getElementsByTagName("cde_email")[0]?.textContent || '',
            cde_adresse: item.getElementsByTagName("cde_adresse")[0]?.textContent || '',
            cde_codepostal: item.getElementsByTagName("cde_codepostal")[0]?.textContent || '',
            cde_ville: item.getElementsByTagName("cde_ville")[0]?.textContent || '',
            cde_pays: item.getElementsByTagName("cde_pays")[0]?.textContent || '',
            cde_tel: item.getElementsByTagName("cde_tel")[0]?.textContent || '',
            cde_fax: item.getElementsByTagName("cde_fax")[0]?.textContent || '',
            cde_message: item.getElementsByTagName("cde_message")[0]?.textContent || '',
            cde_livraison_nom: item.getElementsByTagName("cde_livraison_nom")[0]?.textContent || '',
            cde_livraison_prenom: item.getElementsByTagName("cde_livraison_prenom")[0]?.textContent || '',
            cde_livraison_rue: item.getElementsByTagName("cde_livraison_rue")[0]?.textContent || '',
            cde_livraison_rue2: item.getElementsByTagName("cde_livraison_rue2")[0]?.textContent || '',
            cde_livraison_rue3: item.getElementsByTagName("cde_livraison_rue3")[0]?.textContent || '',
            cde_livraison_codepostal: item.getElementsByTagName("cde_livraison_codepostal")[0]?.textContent || '',
            cde_total_ht: parseFloat(item.getElementsByTagName("cde_total_ht")[0]?.textContent) || 0,
            cde_total_ttc: parseFloat(item.getElementsByTagName("cde_total_ttc")[0]?.textContent) || 0,
            cde_paiement: parseInt(item.getElementsByTagName("cde_paiement")[0]?.textContent, 10) || 0,
            cde_statut: parseInt(item.getElementsByTagName("cde_statut")[0]?.textContent, 10) || 0,
            cde_dt_paiement: item.getElementsByTagName("cde_dt_paiement")[0]?.textContent || '',
            cde_mode_transport: parseInt(item.getElementsByTagName("cde_mode_transport")[0]?.textContent, 10) || 0,
            cde_country: item.getElementsByTagName("cde_country")[0]?.textContent || '',
            cde_ref_interne: item.getElementsByTagName("cde_ref_interne")[0]?.textContent || '',
            details: commandDetails // Include fetched details
        };
    }));

    const jsonData = JSON.stringify(stockList, null, 2);
    await fn.writeFile(filePath, jsonData, 'utf8');
    console.log(`Updated command data written to ${filePath}.`);
}

// Function to fetch details for a specific command ID
async function fetchCommandeDetail(apiLog, apiKey, cde_id) {
    const headersList = {
        "Accept": "*/*",
        "User-Agent": "Node Fetch",
        "Content-Type": "text/xml",
        "SOAPAction": "http://soapdev.netcomvad.com/soap_pro.php#GetCommandeDetail"
    };

    const bodyContent = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
        <soapenv:Header/>
        <soapenv:Body>
            <bus:GetCommandeDetail>
                <cde_id xsi:type="xsd:int">${cde_id}</cde_id>
                <api_log>${apiLog}</api_log>
                <api_key>${apiKey}</api_key>
            </bus:GetCommandeDetail>
        </soapenv:Body>
    </soapenv:Envelope>`;

    const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
        method: "POST",
        body: bodyContent,
        headers: headersList
    });

    const data = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, "application/xml");

    const items = xmlDoc.getElementsByTagName("item");

    return Array.from(items).map(item => ({
        prd_id: item.getElementsByTagName("prd_id")[0]?.textContent || null,
        libel: item.getElementsByTagName("libel")[0]?.textContent || '',
        taille: item.getElementsByTagName("taille")[0]?.textContent || '',
        couleur: item.getElementsByTagName("couleur")[0]?.textContent || '',
        qte: parseInt(item.getElementsByTagName("qte")[0]?.textContent, 10) || 0,
        pu: parseFloat(item.getElementsByTagName("pu")[0]?.textContent) || 0,
        pu_ht: parseFloat(item.getElementsByTagName("pu_ht")[0]?.textContent) || 0,
        taux_tva: parseInt(item.getElementsByTagName("taux_tva")[0]?.textContent, 10) || 0
    }));
}

const fetchCommands = async () => {
    let orders = [];
    const url = `${SHOPIFY_STORE}/admin/api/2023-01/orders.json`; // Mettez à jour avec votre URL et version d'API
    let hasNextPage = true;

    try {
        while (hasNextPage) {
            const response = await axios.get(url, {
                headers: {
                    'X-Shopify-Access-Token': ACCESS_TOKEN
                }
            });

            // `axios` gère automatiquement le JSON, donc utilisez response.data
            const data = response.data;
            
            orders = [...orders, ...data.orders];

            // Vérifie s'il y a une page suivante dans l'en-tête "Link"
            const linkHeader = response.headers['link'];
            hasNextPage = linkHeader && linkHeader.includes('rel="next"');

            if (hasNextPage) {
                const nextPageUrl = linkHeader.split(',').find(part => part.includes('rel="next"')).split(';')[0].trim().slice(1, -1);
                url = nextPageUrl; // Mettre à jour l'URL pour la prochaine requête
            }
        } 

        fs.writeFileSync('shopify_orders.json', JSON.stringify(orders, null, 2)); 
        console.log('Les commandes ont été enregistrés dans "shopify_orders.json".');
    } catch (error) {
        if (error.response) {
            // La requête a été effectuée mais le serveur a répondu avec un code de statut non 2xx
            console.error(`Error fetching commands: HTTP ${error.response.status}`, error.response.data);
        } else if (error.request) {
            // La requête a été faite mais aucune réponse n'a été reçue
            console.error('Error fetching commands: No response received', error.request);
        } else {
            // Une erreur s'est produite lors de la configuration de la requête
            console.error('Error fetching commands:', error.message);
        }
    }
};

const loadJson = (path) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) reject(err);
            resolve(JSON.parse(data));
        });
    });
};

// Step 2: Compare the two JSON files
const compareOrders = async () => {
    await fetchAllCommands(API_LOG, API_KEY, '625789');
    await fetchCommands();
    try {
        // Load the data from both files
        const shopifyOrders = await loadJson('./shopify_orders.json');
        const commandOrders = await loadJson('./command.json');
        const shopifyProducts = await loadJson('./shopify_products.json')

        for (const command of commandOrders) {
            const commandId = command.cde_id.toString(); // Ensure it's a string for comparison

            // Search for the order in shopify_orders.json by checking if the cde_id is present in the 'note' field
            const existingOrder = shopifyOrders.find(order => order.note && order.note.includes(`Command ID: ${commandId}`));
           
            if (existingOrder) {
                // If the order exists, check if the status needs to be updated
                if (existingOrder.financial_status !== getFinancialStatus(command.cde_statut)) {
                    console.log(`Updating order with cde_id ${command.cde_id}`);
                    await updateOrderStatus(existingOrder.id, 'paid');
                } else {
                    console.log(`Order with cde_id ${command.cde_id} is already up to date.`);
                }
            } else {
                // If the order does not exist, create a new order
                console.log(`Creating new order with cde_id ${command.cde_id}`);
                await createOrder(command, shopifyProducts);
            }
        }
    } catch (error) {
        console.error('Error during order comparison:', error.message);
    }
};

// Step 3: Get financial status based on cde_statut
const getFinancialStatus = (status) => {
    if (status === 2) {
        return 'pending';
    } else if (status === 0) {
        return 'paid';
    } else if (status === 1) {
        return 'open';
    }else if (status === 3 || status === 4) {
        return 'voided';
    }
    // Add more statuses if needed
    return 'pending';
};

const createOrder = async (command, shopifyProducts) => {
    const url = `${SHOPIFY_STORE}/admin/api/2023-01/orders.json`;

    // Find the product and variant ID based on prd_id and taille
    const getProductVariantId = (prd_id, taille) => {
        const product = shopifyProducts.find(p => p.vendor === prd_id.toString());
        if (product) {
            const variant = product.variants.find(v => v.option1 === taille);
            return variant ? variant.id : null;
        }
        return null;
    };

    const lineItems = command.details.map(detail => {
        const variantId = getProductVariantId(detail.prd_id, detail.taille);
        return {
            variant_id: variantId,
            quantity: detail.qte,
            title: detail.libel || "Custom Product Title",
            name: detail.libel || "Custom Product Name",  
            price: detail.pu, 
            custom_attributes: [
                { name: 'taille', value: detail.taille },
                { name: 'couleur', value: detail.couleur }
            ]
        };
    });

    const orderData = {
        order: {
            email: command.cde_email,
            customer: {
                first_name: command.cde_prenom,
                last_name: command.cde_nom,
                phone: command.cde_tel,
                addresses: [
                    {
                        address1: command.cde_adresse,
                        city: command.cde_ville,
                        province: '',
                        country: command.cde_pays,
                        zip: command.cde_codepostal
                    }
                ]
            },
            line_items: lineItems,
            financial_status: getFinancialStatus(command.cde_statut),
            total_price: command.cde_total_ttc,
            note: `Command ID: ${command.cde_id}`
        }
    };
    try {
        const response = await axios.post(url, orderData, {
            headers: {
                'X-Shopify-Access-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        console.log(`Order created successfully for cde_id ${command.cde_id}`);
    } catch (error) {
        if (error.response) {
            console.error("Shopify response data:", error.response.data);
            console.error("Shopify response status:", error.response.status);
        } else {
            console.error("Error creating order:", error.message);
        }
    }
};

const updateOrderStatus = async (orderId, newStatus) => {
    const url = `${SHOPIFY_STORE}/admin/api/2023-01/orders/${orderId}.json`; // Shopify API URL

    const orderData = {
        order: {
            id: orderId,
            financial_status: newStatus // You can update to 'paid', 'pending', etc.
        }
    };

    try {
        // Send the PUT request to Shopify API
        const response = await axios.put(url, orderData, {
            headers: {
                'X-Shopify-Access-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Order status updated successfully!`);
    } catch (error) {
        if (error.response) {
            // Handle server response errors
            console.error(`Error updating order status: HTTP ${error.response.status}`, error.response.data);
        } else if (error.request) {
            // Handle no response received
            console.error('Error updating order status: No response received', error.request);
        } else {
            // Handle other errors
            console.error('Error updating order status:', error.message);
        }
    }
};

export default compareOrders;