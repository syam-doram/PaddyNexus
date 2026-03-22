const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/machines?includeSettled=true');
        const data = await res.json();
        console.log("Machines count:", data.length);
        console.log("First machine:", JSON.stringify(data[0], null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
