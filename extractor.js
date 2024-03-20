/// EXTRACTOR.JS

async function waitForElement(selector, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            observer.disconnect();
            reject(
                new Error(
                    `Timeout: Elemento "${selector}" não encontrado após ${timeout}ms`
                )
            );
        }, timeout);

        if (document.querySelector(selector)) {
            clearTimeout(timer);
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver((mutations) => {
            if (document.querySelector(selector)) {
                clearTimeout(timer);
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

function findOverview(elements) {
    let target = null;

    for (const el of elements) {
        if (el.innerText.toLowerCase().includes("overview")) {
            target = el;
            break;
        }
    }

    if (target) {
        return target.offsetTop + 100;
    }

    return target;
}

function getAddress() {
    let buildingAddress = document.querySelector(
        'h2[data-test-id="bdp-building-address"]'
    );

    if (!buildingAddress) {
        buildingAddress = document.querySelector('h1[class^="Text-c11n"]');
    }

    if (!buildingAddress) {
        buildingAddress = document.querySelector('h1[class^="Text-c22n"]');
    }

    const addressBtn = buildingAddress.querySelector("button");

    if (addressBtn) {
        const buttonText = addressBtn.innerHTML;
        addressBtn.remove();

        const remainingText = buildingAddress.innerHTML;
        const concatenatedText = `${buttonText} ${remainingText}`;

        buildingAddress = concatenatedText;
    }

    let addressMatch;
    const addressRegex = /([^,]+),\s*([^,]+),\s*([A-Za-z]+)\s*(\d{5})/;

    if (typeof buildingAddress === "string") {
        buildingAddress = buildingAddress.trim();
        addressMatch = buildingAddress.match(addressRegex);
    } else {
        addressMatch = buildingAddress.innerHTML.match(addressRegex);
    }

    return addressMatch;
}

async function extractData() {
    await waitForElement('div[data-testid="data-column"]');
    const dataView = await waitForElement('div[data-testid="data-view"]');

    const h4Elements = await dataView.querySelectorAll("h4");
    const targetH4 = findOverview(h4Elements);
    if (targetH4) {
        dataView.scrollTop = targetH4.offsetTop;
    }

    const h2Elements = await dataView.querySelectorAll("h2");
    const targetH2 = await findOverview(h2Elements);
    if (targetH2) {
        dataView.scrollTop = targetH2.offsetTop;
    }

    await waitForElement('div[class="ds-listing-agent-header"]');
    await waitForElement('div[class="ds-listing-agent-container"]');
    await waitForElement('ul[class="ds-listing-agent-info"]');

    let tabData = {};

    const address = getAddress();

    const listingAgent = document.querySelector(
        'div[class="ds-listing-agent-header"]'
    )?.innerHTML;

    const agentName = document.querySelector(
        'span[class="ds-listing-agent-business-name"]'
    )?.innerHTML;

    tabData["listedBy"] = decodeHtmlEntities(listingAgent);
    tabData["name"] = decodeHtmlEntities(agentName);

    tabData["address"] = decodeHtmlEntities(address[1].trim());
    const unit = decodeHtmlEntities(address[0].trim());

    if (address[1].includes("#")) {
        tabData["address"] = `${address.input.split(",")[0]}`;
    }

    if (unit.includes("#")) {
        tabData["address"] = `${tabData["address"]} ${address.input
            .split(",")[1]
            .trim()}`;
    }

    tabData["city"] = decodeHtmlEntities(
        address[2]
            .trim()
            .replace(/<\/?[^>]+(>|$)/g, "")
            .trim()
    );
    tabData["state"] = decodeHtmlEntities(address[3].trim());
    tabData["zipcode"] = decodeHtmlEntities(address[4].trim());

    return tabData;
}

function decodeHtmlEntities(html) {
    if (!html) return "";

    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value.trim();
}

extractData();
