import fetch from 'node-fetch';

async function getExternalProducts() {
    const url = 'http://localhost:3000/get-all-product-stock';
    const apiLog = "625789";
    const apiKey = "789da23ef034810c2e3295fea47532a342ecf61e";

    // Fetch active and inactive products
    const dataActif = await fetchProductData(url, 1);
    const dataInActif = await fetchProductData(url, 0);

    const mergedData = [...dataActif, ...dataInActif];
    const groupedData = mergedData.reduce((acc, item) => {
        if (!acc.has(item.prd_id)) {
            acc.set(item.prd_id, { prd_id: item.prd_id });
        }
        return acc;
    }, new Map());

    const formattedData = Array.from(groupedData.values());

    // Process in batches
    const batchSize = 10; // Adjust batch size as needed
    for (let i = 0; i < formattedData.length; i += batchSize) {
        const batch = formattedData.slice(i, i + batchSize);
        await Promise.all(batch.map(prd => processProduct(prd, apiLog, apiKey)));
    }
}

async function fetchProductData(url, actif) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "api_log": "625789",
            "api_key": "789da23ef034810c2e3295fea47532a342ecf61e",
            "actif": actif
        }),
    });

    if (!response.ok) {
        console.error(`Erreur HTTP : ${response.status} ${response.statusText}`);
        throw new Error('Erreur lors de la récupération des produits');
    }

    const data = await response.json();
    return data.stockList;
}

async function processProduct(prd, apiLog, apiKey) {
    try {
        const productInfo = await fetch('http://localhost:3000/get-product-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_log: apiLog,
                api_key: apiKey,
                product_id: prd.prd_id
            }),
        });

        if (!productInfo.ok) {
            console.error(`Erreur HTTP : ${productInfo.status} ${productInfo.statusText}`);
            throw new Error(`Erreur lors de la récupération du produit ${prd.prd_id}`);
        }

        const productData = await productInfo.json();
        await createShopifyProduct(productData);
    } catch (error) {
        console.error(`Erreur lors de la récupération du produit ${prd.prd_id}:`, error.message);
    }
}

async function createShopifyProduct(soapProduct) {
    const shopUrl = 'https://xg3gt2-1b.myshopify.com';
    const accessToken = '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';

    const productData = {
        product: {
            title: soapProduct.prd_libel,
            body_html: soapProduct.prd_large_description,
            vendor: "Your Vendor Name", // Replace with actual vendor name
            product_type: "Your Product Type", // Replace with actual product type
            variants: [
                {
                    price: soapProduct.prd_px_euro,
                    sku: soapProduct.prd_codebarre,
                    weight: soapProduct.prd_poids,
                    weight_unit: "g", // Assuming weight is in grams
                    inventory_management: "shopify",
                    inventory_quantity: 10, // Set initial inventory quantity
                    tax_code: soapProduct.prd_taux_tva, // Map to appropriate tax code
                }
            ],
            images: [
                { src: soapProduct.prd_rep_img_800 + soapProduct.id_produit + ".jpg" }
            ],
            tags: "Geisha, Adrien Lastic", // Add relevant tags
        }
    };

    const response = await fetch(`${shopUrl}/admin/api/2023-01/products.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify(productData),
    });

    if (!response.ok) {
        console.error(`Erreur HTTP : ${response.status} ${response.statusText}`);
        const error = await response.text();
        console.error('Détails de l\'erreur :', error);
        throw new Error('Échec de l\'ajout du produit.');
    }
    console.log(product? product.prd_libel: "Pas de produit!")
    const data = await response.json();
}





/*
async function syncProductsToShopify() {
    try {
        // Étape 1 : Récupérer les produits depuis l'API externe
        const externalProducts = await getExternalProducts();

        // Étape 2 : Ajouter chaque produit dans Shopify
        //for (const product of externalProducts) {
            //await createShopifyProduct(product);
        //}

        console.log('Tous les produits ont été importés avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'importation des produits :', error);
    }
}

syncProductsToShopify();*/
getExternalProducts() 
