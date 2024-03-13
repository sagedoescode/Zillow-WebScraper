
/// EXTRACTOR.JS

function waitForElements(selectors, callback) {
    const observer = new MutationObserver((mutations, observer) => {
        // Check if all selectors are present in the document
        if (selectors.every(selector => document.querySelector(selector))) {
            observer.disconnect();
            callback();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
let extractedData = [];

function extractData() {
    console.log("Extracting...");
    const tabData = {};

    tabData.url = window.location.href;
    let listedByElement = document.querySelector('.ds-listing-agent-header');
    console.log(listedByElement)
    if (listedByElement) {
        extractedData.push({ listedBy: listedByElement.textContent.trim()});
    }
    // Query the agent name
    let agentNameElement = document.querySelector('.ds-listing-agent-display-name');
    console.log(agentNameElement)
    if (agentNameElement) {
        extractedData.push({ agentName: agentNameElement.textContent.trim() });
    }

    // Query the business name
    let businessNameElement = document.querySelector('.ds-listing-agent-business-name');
    if (businessNameElement) {
        extractedData.push({ businessName: businessNameElement.textContent.trim() });
    }

    // Query the phone number
    let phoneNumberElement = document.querySelector('.ds-listing-agent-info-text');
    if (phoneNumberElement) {
        extractedData.push({ phoneNumber: phoneNumberElement.textContent.trim() });
    }
    // Query the full address
    let addressElement = document.querySelector('h1.Text-c11n-8-84-3__sc-aiai24-0.hrfydd');
    if (addressElement) {
        const fullAddress = addressElement.textContent.trim();
        const addressParts = fullAddress.split(',');

        if (addressParts.length > 1) {
            extractedData.push({ address: addressParts[0].trim() });
            const cityStateZipParts = addressParts[1].trim().split(' ');


            // The city might consist of more than one word
            const city = cityStateZipParts.slice(-1)[0];
            const state = cityStateZipParts.slice(-1)[0];
            const zipCode = cityStateZipParts.slice(-1)[0];

            extractedData.push({ city: city });
            extractedData.push({ state: state });
            extractedData.push({ zipCode: zipCode });
            
        }
    }


    // Query the price
    let priceElement = document.querySelector('span[data-testid="price"]');
    if (priceElement) {
        tabData.price = priceElement.textContent.trim();
    }

    // Since tabData contains the URL and price, we add it to extractedData as well
    extractedData.push(tabData);

    console.log("Data extracted:", extractedData);
    chrome.runtime.sendMessage({ action: 'extractedData', tabId: chrome.devtools.inspectedWindow.tabId, data: extractedData }, () => {
        // After sending the data, request to close the tab
        chrome.runtime.sendMessage({ action: 'closeTab' });
    });
}
// Use waitForElement to wait for the .ds-listing-agent-display-name element to appear
waitForElements(['.ds-listing-agent-display-name', 'h1.Text-c11n-8-84-3__sc-aiai24-0.hrfydd'], extractData);
