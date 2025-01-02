const express = require('express');
const soap = require('soap');
const app = express();
const port = 3000;

const soapUrl = 'http://www.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL';

app.get('/countries', async (req, res) => {
    try {
        const client = await soap.createClientAsync(soapUrl);
        const result = await client.ListOfCountryNamesByNameAsync({});
        const countries = result[0].ListOfCountryNamesByNameResult.tCountryCodeAndName;
        res.json(countries);
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des données.');
    }
});

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
