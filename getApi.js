const express = require('express');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 3000;

const maxHouseNumber = 1000;
const maxCorpusNumber = 2000;

const readStreetsFromJSON = (filePath) => {
    try {
        const data = fs.readFileSync(filePath);
        const streets = JSON.parse(data);
        return streets;
    } catch (error) {
        console.error(`Ошибка при чтении файла: ${error.message}`);
        throw error;
    }
};

const checkAddressesForStreet = async (streetName) => {
    const addresses = [];
    for (let houseNumber = 1; houseNumber <= maxHouseNumber; houseNumber++) {
        let foundAddressWithoutCorpus = false;
        for (let corpusNumber = 0; corpusNumber <= maxCorpusNumber; corpusNumber++) {
            try {
                const address = `${streetName} ${houseNumber}${corpusNumber > 0 ? ' ' + corpusNumber : ''}`;
                const response = await axios.get(`https://api.maps.by/api/abbress/list?address=${address}`);
                if (response.data !== "server is not available") {
                    addresses.push(...response.data);
                    foundAddressWithoutCorpus = true;
                } else {
                    if (foundAddressWithoutCorpus) {
                        break;
                    }
                }
            } catch (error) {
                console.error(`Ошибка при проверке адреса ${address}: ${error.message}`);
                break;
            }
        }
    }
    return addresses;
};

app.get('/api/cacheSetter', async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../Data/AddressesStreet.json');
        const streets = readStreetsFromJSON(filePath);
        
        const addressesByStreet = {};
        for (let street of streets) {
            const addresses = await checkAddressesForStreet(street);
            addressesByStreet[street] = addresses;
        }

        res.json({ addressesByStreet });
    } catch (error) {
        res.status(500).json({ error: "Ошибка при получении адресов" });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
