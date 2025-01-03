import fetch from 'node-fetch';

async function getExternalProducts() {
    const url = 'http://localhost:3000/get-all-isbn';

    // Fetch ISBN list
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "api_log": "625789",
            "api_key": "789da23ef034810c2e3295fea47532a342ecf61e"
        }),
    });

    if (!response.ok) {
        console.error(`Erreur HTTP : ${response.status} ${response.statusText}`);
        throw new Error('Erreur lors de la récupération des produits');
    }

    const data = await response.json();

    // Map the ISBN list to fetch product details
    const apiLog = "625789";
    const apiKey = "789da23ef034810c2e3295fea47532a342ecf61e";

    const enrichedData = await Promise.all(
        data.isbnList.map(async (isbn) => {
            try {
                const productInfo = await fetch('http://localhost:3000/get-product-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        api_log: apiLog,
                        api_key: apiKey,
                        product_id: isbn.prd_id
                    }),
                });
                
               if (!productInfo.ok) {
                    console.error(`Erreur HTTP : ${productInfo.status} ${productInfo.statusText}`);
                    throw new Error(`Erreur lors de la récupération du produit ${isbn.id_produit}`);
                }
                
                const productData = await productInfo.json();
                return productData.isbnList[0]; // Merge data
            } catch (error) {
                console.error(`Erreur lors de la récupération du produit ${isbn.id_produit}:`, error.message);
                return productData.isbnList
            }
        })
    );
    
    return enrichedData; 
}


async function createShopifyProduct(product) {
    const shopUrl = 'https://xg3gt2-1b.myshopify.com';
    const accessToken = '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';

    const productData = {
        product: {
            id: product ? product.id_produit : "",
            title: product ? product.prd_libel: "product null",
            body_html: product ? product.prd_small_description : "",
            vendor: "nothing",
            product_type: "Example Type",
            product_type: 49,
            variants: [
                {
                    price: 18.20,
                    sku: "prd_px_euro"
                }
            ],
            images: [],
            image: product ? product.prd_rep_img_40 : null
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


async function syncProductsToShopify() {
    try {
        // Étape 1 : Récupérer les produits depuis l'API externe
        const externalProducts = await getExternalProducts();

        // Étape 2 : Ajouter chaque produit dans Shopify
        for (const product of externalProducts) {
            await createShopifyProduct(product);
        }

        console.log('Tous les produits ont été importés avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'importation des produits :', error);
    }
}

syncProductsToShopify();

