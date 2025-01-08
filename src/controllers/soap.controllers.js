import { DOMParser } from 'xmldom';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import {transformStockList} from '../utils/soap.utils.js'


const supportObjectControllers = async (req, res) => {
    try {
        // Define the headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml"
        };

        // Define the body for the SOAP request
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:GetSupportObjets>
                    <lang>en</lang>
                </bus:GetSupportObjets>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
            method: "POST", // Using POST for the SOAP request
            body: bodyContent,
            headers: headersList
        });

        // Wait for the response to complete
        const data = await response.text();

        // Parse the XML response into a DOM object
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Initialize the result object
        let result = { supportObjects: [] };

        // Extract the support objects from the XML response
        let items = xmlDoc.getElementsByTagName("item");

        // Loop through each item and extract the relevant data
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            result.supportObjects.push({
                objet_id: item.getElementsByTagName("objet_id")[0]?.textContent,
                objet_tri: item.getElementsByTagName("objet_tri")[0]?.textContent,
                objet_lang: item.getElementsByTagName("objet_lang")[0]?.textContent,
                objet_contact_email: item.getElementsByTagName("objet_contact_email")[0]?.textContent,
                objet_libel_select: item.getElementsByTagName("objet_libel_select")[0]?.textContent,
                objet_libel_champ: item.getElementsByTagName("objet_libel_champ")[0]?.textContent,
                objet_libel_email: item.getElementsByTagName("objet_libel_email")[0]?.textContent
            });
        }

        // Send the result as a JSON response
        res.json(result);

    } catch (error) {
        // Send error response if something goes wrong
        res.status(500).send('Erreur lors de la récupération des objets de support.');
    }
}

const addClientController = async (req, res) => {
    try {
        // Destructure the required fields from req.body
        const { api_log, api_key, noclient, name, email } = req.body;

        // Check if all required fields are provided
        if (!api_log || !api_key || !noclient || !name || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml"
        };

        // Prepare the SOAP body with dynamic values
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:AddClient>
                    <api_log>${api_log}</api_log>
                    <api_key>${api_key}</api_key>
                    <noclient>${noclient}</noclient>
                    <clientinfos>{"name":"${name}","email":"${email}"}</clientinfos>
                </bus:AddClient>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        // Get the response data
        const data = await response.text();

        // Parse the response if necessary (can be adjusted based on response format)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Extract any useful information from the response (adjust based on the structure of the response)
        const result = xmlDoc.getElementsByTagName("result")[0]?.textContent || "Client added successfully"; // Example

        // Send the result as JSON
        res.json({ message: result });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error adding client:", error);
        res.status(500).send('Erreur lors de l\'ajout du client.');
    }
}

const addCommandControllers = async (req, res) => {
    try {
        // Destructure the required fields from req.body
        const { api_log, api_key, cde_info } = req.body;

        // Check if all required fields are provided
        if (!api_log || !api_key || !cde_info) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml",
            "SOAPAction": "http://soapdev.netcomvad.com/soap_pro.php.php#AddCommande"
        };

        // Prepare the SOAP body with dynamic values
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:AddCommande>
                    <api_log>${api_log}</api_log>
                    <api_key>${api_key}</api_key>
                    <cde_info>${cde_info}</cde_info>
                </bus:AddCommande>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        // Get the response data
        const data = await response.text();

        // Parse the response if necessary (can be adjusted based on response format)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Extract any useful information from the response (adjust based on the structure of the response)
        const result = xmlDoc.getElementsByTagName("return")[0]?.textContent || "Commande added successfully"; // Example

        // Send the result as JSON
        res.json({ message: result });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error adding commande:", error);
        res.status(500).send('Erreur lors de l\'ajout de la commande.');
    }
}

const cartAddItemControllers = async (req, res) => {
    try {
        // Destructure the required fields from req.body
        const { api_log, api_key, prd_id, taille, couleur, qte, shopSID } = req.body;

        // Check if all required fields are provided
        if (!api_log || !api_key || !prd_id || !taille || !couleur || !qte || !shopSID) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml",
            "SOAPAction": "http://soapdev.netcomvad.com/soap_pro.php#CartAddItemPro"
        };

        // Prepare the SOAP body with dynamic values
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:CartAddItemPro>
                    <api_log>${api_log}</api_log>
                    <api_key>${api_key}</api_key>
                    <prd_id>${prd_id}</prd_id>
                    <taille>${taille}</taille>
                    <couleur>${couleur}</couleur>
                    <qte>${qte}</qte>
                    <shopSID>${shopSID}</shopSID>
                </bus:CartAddItemPro>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        // Get the response data
        const data = await response.text();

        // Parse the response if necessary (can be adjusted based on response format)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Extract any useful information from the response (adjust based on the structure of the response)
        const result = xmlDoc.getElementsByTagName("return")[0]?.textContent || "Item added to cart successfully"; // Example

        // Send the result as JSON
        res.json({ message: result });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error adding item to cart:", error);
        res.status(500).send('Erreur lors de l\'ajout de l\'article au panier.');
    }
}

const getInfoClientControllers = async (req, res) => {
    try {
        // Destructure the required fields from req.body
        const { api_log, api_key, auth_num, auth_pass } = req.body;

        // Check if all required fields are provided
        if (!api_log || !api_key || !auth_num || !auth_pass) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml",
            "SOAPAction": "http://soapdev.netcomvad.com/soap_pro.php#GetClientInfo"
        };

        // Prepare the SOAP body with dynamic values
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:GetClientInfo>
                    <api_log>${api_log}</api_log>
                    <api_key>${api_key}</api_key>
                    <auth_num>${auth_num}</auth_num>
                    <auth_pass>${auth_pass}</auth_pass>
                </bus:GetClientInfo>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        // Get the response data
        const data = await response.text();

        // Parse the response if necessary (can be adjusted based on response format)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Extract any useful information from the response (adjust based on the structure of the response)
        const clientData = xmlDoc.getElementsByTagName("return")[0]?.textContent || "Client information retrieved successfully"; // Example

        // Send the result as JSON
        res.json({ clientData });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error retrieving client information:", error);
        res.status(500).send('Erreur lors de la récupération des informations du client.');
    }
}

const getAllOptionControllers = async (req, res) => {
    try {
        // Destructure the required fields from req.body
        const { api_log, api_key } = req.body;

        // Check if all required fields are provided
        if (!api_log || !api_key) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml",
            "SOAPAction": "http://soapdev.netcomvad.com/soap_pro.php#GetAllOptions"
        };

        // Prepare the SOAP body with dynamic values
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:GetAllOptions>
                    <api_log>${api_log}</api_log>
                    <api_key>${api_key}</api_key>
                </bus:GetAllOptions>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        // Get the response data
        const data = await response.text();

        // Parse the response XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Extract items from the response
        const items = xmlDoc.getElementsByTagName("item");
        const optionsList = Array.from(items).map(item => ({
            option_id: item.getElementsByTagName("option_id")[0]?.textContent,
            option_prd_id: item.getElementsByTagName("option_prd_id")[0]?.textContent,
            option_taille_fr: item.getElementsByTagName("option_taille_fr")[0]?.textContent,
            option_couleur_fr: item.getElementsByTagName("option_couleur_fr")[0]?.textContent,
            option_ean13: item.getElementsByTagName("option_ean13")[0]?.textContent
        }));

        // Send the result as JSON
        res.json({ optionsList });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error retrieving options:", error);
        res.status(500).send('Erreur lors de la récupération des options.');
    }
}

const getAllIsbn = async (req, res) => {
    try {
        // Destructure the required fields from req.body
        const { api_log, api_key } = req.body;

        // Check if all required fields are provided
        if (!api_log || !api_key) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml",
            "SOAPAction": "http://soapdev.netcomvad.com/soap_pro.php#GetAllIsbn"
        };

        // Prepare the SOAP body with dynamic values
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:GetAllIsbn>
                    <api_log>${api_log}</api_log>
                    <api_key>${api_key}</api_key>
                </bus:GetAllIsbn>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        // Get the response data
        const data = await response.text();

        // Parse the response XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Extract items from the response
        const items = xmlDoc.getElementsByTagName("item");
        const isbnList = Array.from(items).map(item => ({
            prd_id: item.getElementsByTagName("prd_id")[0]?.textContent,
            isbn: item.getElementsByTagName("isbn")[0]?.textContent
        }));

        // Send the result as JSON
        res.json({ isbnList });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error retrieving ISBNs:", error);
        res.status(500).send('Erreur lors de la récupération des ISBN.');
    }
}

const getAllAuteurControllers = async (req, res) => {
    try {
        // Destructure the required fields from req.body
        const { api_log, api_key } = req.body;

        // Check if all required fields are provided
        if (!api_log || !api_key) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml",
            "SOAPAction": "http://soapdev.netcomvad.com/soap_pro.php#GetAllAuteurs"
        };

        // Prepare the SOAP body with dynamic values
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:GetAllAuteurs>
                    <api_log>${api_log}</api_log>
                    <api_key>${api_key}</api_key>
                </bus:GetAllAuteurs>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        // Get the response data
        const data = await response.text();

        // Parse the response XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Extract items from the response
        const items = xmlDoc.getElementsByTagName("item");
        const auteursList = Array.from(items).map(item => ({
            prd_id: item.getElementsByTagName("prd_id")[0]?.textContent,
            auteur: item.getElementsByTagName("auteur")[0]?.textContent
        }));

        // Send the result as JSON
        res.json({ auteursList });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error retrieving auteurs:", error);
        res.status(500).send('Erreur lors de la récupération des auteurs.');
    }
}

const getProductInfoControllers = async (req, res) => {
    try {
        // Destructure the required fields from req.body
        const { api_log, api_key, product_id } = req.body;

        // Check if all required fields are provided
        if (!api_log || !api_key || !product_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml",
            "SOAPAction": "https://soap.busyx.com/soap_pro.php#GetAllIsbn"
        };

        // Prepare the SOAP body with dynamic values
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="https://soap.busyx.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:GetProductInfo>
                    <api_log>${api_log}</api_log>
                    <api_key>${api_key}</api_key>
                    <product_id>${product_id}</product_id>
                </bus:GetProductInfo>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("https://soap.busyx.com/soap_pro.php", {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        // Get the response data
        const data = await response.text();

        // Parse the response XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Extract items from the response
        const items = xmlDoc.getElementsByTagName("item");
        const isbnList = Array.from(items).map(item => ({
            id_produit: item.getElementsByTagName("id_produit")[0]?.textContent,
            prd_codebarre: item.getElementsByTagName("prd_codebarre")[0]?.textContent,
            prd_libel: item.getElementsByTagName("prd_libel")[0]?.textContent,
            prd_small_description: item.getElementsByTagName("prd_small_description")[0]?.textContent,
            prd_large_description: item.getElementsByTagName("prd_large_description")[0]?.textContent,
            prd_px_euro: item.getElementsByTagName("prd_px_euro")[0]?.textContent,
            prd_px_promo: item.getElementsByTagName("prd_px_promo")[0]?.textContent,
            prd_px_pro: item.getElementsByTagName("prd_px_pro")[0]?.textContent,
            prd_canal_soft: item.getElementsByTagName("prd_canal_soft")[0]?.textContent,
            prd_canal_femme: item.getElementsByTagName("prd_canal_femme")[0]?.textContent,
            prd_poids: item.getElementsByTagName("prd_poids")[0]?.textContent,
            prd_taux_tva: item.getElementsByTagName("prd_taux_tva")[0]?.textContent,
            prd_categorie: item.getElementsByTagName("prd_categorie")[0]?.textContent,
            prd_rep_img_40: item.getElementsByTagName("prd_rep_img_40")[0]?.textContent,
            prd_rep_img_100: item.getElementsByTagName("prd_rep_img_100")[0]?.textContent,
            prd_rep_img_300: item.getElementsByTagName("prd_rep_img_300")[0]?.textContent,
            prd_rep_img_400: item.getElementsByTagName("prd_rep_img_400")[0]?.textContent,
            prd_rep_img_800: item.getElementsByTagName("prd_rep_img_800")[0]?.textContent
        }));

        // Send the result as JSON
        res.json({ isbnList });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error retrieving ISBNs:", error);
        res.status(500).send('Erreur lors de la récupération des ISBN.');
    }
}

const getAllProductStockController = async (req, res) => {
    try {
        // Destructure the required fields from req.body
        const { api_log, api_key, actif } = req.body;

        // Check if all required fields are provided
        if (!api_log || !api_key || actif === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml",
            "SOAPAction": "http://soapdev.netcomvad.com/soap_pro.php#GetAllProductStock"
        };

        // Prepare the SOAP body with dynamic values
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:GetAllProductStock>
                    <api_log>${api_log}</api_log>
                    <api_key>${api_key}</api_key>
                    <actif>${actif}</actif>
                </bus:GetAllProductStock>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        // Get the response data
        const data = await response.text();

        // Parse the response XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Extract items from the response
        const items = xmlDoc.getElementsByTagName("item");
        const stockList = Array.from(items).map(item => ({
            prd_id: item.getElementsByTagName("prd_id")[0]?.textContent,
            stock_ean13: item.getElementsByTagName("stock_ean13")[0]?.textContent,
            stock_qt: item.getElementsByTagName("stock_qt")[0]?.textContent,
            stock_actif: item.getElementsByTagName("stock_actif")[0]?.textContent,
            stock_suivi: item.getElementsByTagName("stock_suivi")[0]?.textContent
        }));

        const formatStockList = transformStockList(stockList);
        // Send the result as JSON
        res.json({ formatStockList });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error retrieving product stock:", error);
        res.status(500).send('Erreur lors de la récupération du stock des produits.');
    }
}

const getAllProductStockFromFileController = async (req, res) => {
    const filePath = './src/middlewares/product.json'; // Chemin du fichier JSON

    try {
        // Lire le fichier product.json
        const data = await fs.readFile(filePath, 'utf8');
        
        // Convertir les données JSON en objet
        const products = JSON.parse(data);

        // Envoyer les données comme réponse
        res.status(200).json(products);
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier product.json:', error);

        // Envoyer une erreur en cas de problème
        res.status(500).json({
            error: 'Impossible de récupérer les produits depuis product.json.'
        });
    }
}

const getTbCommandController = async (req, res) => {
    try {
        // Destructure the required fields from req.body
        const { api_log, api_key, id_client } = req.body;

        // Check if all required fields are provided
        if (!api_log || !api_key || !id_client) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml",
            "SOAPAction": "http://soapdev.netcomvad.com/soap_pro.php#GetTbCommandes"
        };

        // Prepare the SOAP body with dynamic values
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:GetTbCommandes>
                    <api_log>${api_log}</api_log>
                    <api_key>${api_key}</api_key>
                    <params>
                        <id_client>${id_client}</id_client>
                    </params>
                </bus:GetTbCommandes>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        // Get the response data
        const data = await response.text();

        // Parse the response XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Extract items from the response
        const items = xmlDoc.getElementsByTagName("item");
        const commandesList = Array.from(items).map(item => ({
            cde_id: item.getElementsByTagName("cde_id")[0]?.textContent,
            cde_dt: item.getElementsByTagName("cde_dt")[0]?.textContent,
            cde_num: item.getElementsByTagName("cde_num")[0]?.textContent,
            cde_client_id: item.getElementsByTagName("cde_client_id")[0]?.textContent,
            cde_nom: item.getElementsByTagName("cde_nom")[0]?.textContent,
            cde_prenom: item.getElementsByTagName("cde_prenom")[0]?.textContent,
            cde_email: item.getElementsByTagName("cde_email")[0]?.textContent,
            cde_adresse: item.getElementsByTagName("cde_adresse")[0]?.textContent,
            cde_codepostal: item.getElementsByTagName("cde_codepostal")[0]?.textContent,
            cde_ville: item.getElementsByTagName("cde_ville")[0]?.textContent,
            cde_pays: item.getElementsByTagName("cde_pays")[0]?.textContent,
            cde_tel: item.getElementsByTagName("cde_tel")[0]?.textContent,
            cde_fax: item.getElementsByTagName("cde_fax")[0]?.textContent,
            cde_message: item.getElementsByTagName("cde_message")[0]?.textContent,
            cde_livraison_nom: item.getElementsByTagName("cde_livraison_nom")[0]?.textContent,
            cde_livraison_prenom: item.getElementsByTagName("cde_livraison_prenom")[0]?.textContent,
            cde_livraison_rue: item.getElementsByTagName("cde_livraison_rue")[0]?.textContent,
            cde_livraison_rue2: item.getElementsByTagName("cde_livraison_rue2")[0]?.textContent,
            cde_livraison_rue3: item.getElementsByTagName("cde_livraison_rue3")[0]?.textContent,
            cde_livraison_codepostal: item.getElementsByTagName("cde_livraison_codepostal")[0]?.textContent,
            cde_livraison_ville: item.getElementsByTagName("cde_livraison_ville")[0]?.textContent,
            cde_livraison_pays: item.getElementsByTagName("cde_livraison_pays")[0]?.textContent,
            cde_port: item.getElementsByTagName("cde_port")[0]?.textContent,
            cde_total_ht: item.getElementsByTagName("cde_total_ht")[0]?.textContent,
            cde_total_ttc: item.getElementsByTagName("cde_total_ttc")[0]?.textContent,
            cde_paiement: item.getElementsByTagName("cde_paiement")[0]?.textContent,
            cde_statut: item.getElementsByTagName("cde_statut")[0]?.textContent,
            cde_dt_paiement: item.getElementsByTagName("cde_dt_paiement")[0]?.textContent,
            cde_mode_transport: item.getElementsByTagName("cde_mode_transport")[0]?.textContent,
            cde_country: item.getElementsByTagName("cde_country")[0]?.textContent,
            cde_ref_interne: item.getElementsByTagName("cde_ref_interne")[0]?.textContent,
        }));

        // Send the result as JSON
        res.json({ commandesList });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error retrieving commandes:", error);
        res.status(500).send('Erreur lors de la récupération des commandes.');
    }
}

const getProductStockIdControllers = async (req, res) => {
    try {
        // Destructure the required fields from req.body
        const { api_log, api_key, prd_id } = req.body;

        // Check if all required fields are provided
        if (!api_log || !api_key || prd_id === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Headers for the SOAP request
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "text/xml",
            "SOAPAction": "http://soapdev.netcomvad.com/soap_pro.php#GetProductStock"
        };

        // Prepare the SOAP body with dynamic values
        const bodyContent = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://soapdev.netcomvad.com/soap_pro.php">
            <soapenv:Header/>
            <soapenv:Body>
                <bus:GetProductStock>
                    <api_log>${api_log}</api_log>
                    <api_key>${api_key}</api_key>
                    <prd_id>${prd_id}</prd_id>
                </bus:GetProductStock>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Perform the SOAP request using fetch
        const response = await fetch("http://soapdev.netcomvad.com/soap_pro.php", {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        // Get the response data
        const data = await response.text();

        // Parse the response XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");

        // Extract items from the response
        const items = xmlDoc.getElementsByTagName("item");
        const stockList = Array.from(items).map(item => ({
            prd_id: item.getElementsByTagName("prd_id")[0]?.textContent,
            stock_ean13: item.getElementsByTagName("stock_ean13")[0]?.textContent,
            stock_qt: item.getElementsByTagName("stock_qt")[0]?.textContent,
            stock_actif: item.getElementsByTagName("stock_actif")[0]?.textContent,
            stock_suivi: item.getElementsByTagName("stock_suivi")[0]?.textContent
        }));

        // Send the result as JSON
        res.json({ stockList });
    } catch (error) {
        // Handle errors gracefully
        console.error("Error retrieving product stock:", error);
        res.status(500).send('Erreur lors de la récupération du stock des produits.');
    }
}

export {supportObjectControllers, addClientController, addCommandControllers, cartAddItemControllers, getInfoClientControllers, getAllOptionControllers, getAllIsbn, getAllAuteurControllers, getProductInfoControllers, getAllProductStockController, getTbCommandController, getProductStockIdControllers, getAllProductStockFromFileController}