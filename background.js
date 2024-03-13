/// BACKGROUND.JS
let allScrapedData = [];
let openTabsCount = 0;

// Add this function to convert the data object to a CSV-compatible array
function convertDataToCSV(data) {
    return data.map(tabData => Object.values(tabData).join(',')).join('\n');
}
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'startScraping') {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0) {
                console.error("No active tab found.");
                sendResponse({ message: 'Error: No active tab found.' });
                return;
            }
            const activeTab = tabs[0];
            if (!activeTab.id) {
                console.error("Active tab ID is undefined.");
                sendResponse({ message: 'Error: Active tab ID is undefined.' });
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, { action: "startScraping" });
            sendResponse({ message: 'Scraping started on tab ' + activeTab.id });
        });
        return true;
    }// Keeps the message channel open for async sendResponse
    else if (message.action === 'openLinks' && message.openInactive) { // Note the action is now 'openLinks'
        if (Array.isArray(message.hrefs) && message.hrefs.length > 0) {
            openTabsCount = message.hrefs.length;
            message.hrefs.forEach(href => {
                chrome.tabs.create({ url: href, active: false }, (newTab) => {
                    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                        if (tabId === newTab.id && changeInfo.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            chrome.scripting.executeScript({
                                target: { tabId: newTab.id },
                                files: ['extractor.js']
                            });
                        }
                    });
                });
            });
            sendResponse({ message: `Tabs opened and extractor will be injected.` });
        } else {
            console.error("Invalid URLs array.");
            sendResponse({ message: 'Error: Invalid URLs array.' });
        }
        return true; // Indicates asynchronous response
    }else if (message.action === 'closeTab') {
        console.log('Received closeTab message');
        if (sender.tab && sender.tab.id) {
            console.log(`Closing tab with ID: ${sender.tab.id}`);
            chrome.tabs.remove(sender.tab.id);
        } else {
            console.log('Error: No tab ID found to close.');
        }
    
        
    

    
    }else if (message.action === 'stopScraping') {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0) {
                console.error("No active tab found.");
                sendResponse({ message: 'Error: No active tab found.' });
                return;
            }
            const activeTab = tabs[0];
            if (!activeTab.id) {
                console.error("Active tab ID is undefined.");
                sendResponse({ message: 'Error: Active tab ID is undefined.' });
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, { action: "stopScraping" });
            sendResponse({ message: 'Stop message sent to tab ' + activeTab.id });
        });

        return true; // Keeps the message channel open for async sendResponse
            // Handling extracted data from content scripts
    }else if (message.action === 'extractedData') {
    console.log("Received extracted data from a tab.");
    const tabId = message.tabId;
    const tabData = message.data;
    // Append data from each tab
    allScrapedData.push(tabData);
    console.log(`Data from tab ${tabId}: `, tabData);

    // Decrement the counter and check if all tabs have completed
    openTabsCount--;
    if (openTabsCount <= 0) {
        console.log('All data received:', allScrapedData);
        // Convert data to CSV format
        const csvData = convertDataToCSV(allScrapedData);

        // Export data to CSV
        exportToCSV(csvData);

        // Reset data for the next scraping session
        allScrapedData = [];
        openTabsCount = 0;
    }
}   if (message.action === 'scrapedData') {
        console.log('Received scraped data from a tab:', message.data);
        allScrapedData.push(message.data);

        // Check if all tabs have finished scraping
        if (allScrapedData.length === openTabsCount) {
            console.log('All scraped data:', allScrapedData);
            // Export data to CSV
            exportToCSV();
            // Reset for the next scraping session
            allScrapedData = [];
            openTabsCount = 0; // Reset openTabsCount
        }

        sendResponse({ message: 'Data received and tab counted.' });
    }

    // Handling 'allScrapingDone' message
    if (message.action === 'allScrapingDone') {
        console.log('Received allScrapingDone message.');
        // Export data to CSV
        exportToCSV();
        // Reset for the next session
        allScrapedData = [];
        openTabsCount = 0; // Reset openTabsCount
    }

    return true; // Always return true to keep the message channel open
});

// Function to export data to CSV
function exportToCSV() {
    console.log('Exporting to CSV:', allScrapedData); // Debugging
    // Convert scraped data to CSV string
    const csv = convertToCSV(allScrapedData);

    // Prompt user to download CSV file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'scraped_data.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to convert data array to CSV string
function convertToCSV(dataArray) {
    console.log('Converting to CSV:', dataArray); // Debugging
    const header = Object.keys(dataArray[0]).join(',');
    const rows = dataArray.map(obj => Object.values(obj).join(','));
    return `${header}\n${rows.join('\n')}`;
}

// Function to convert the data object to a CSV-compatible array
function convertDataToCSV(data) {
    console.log('Converting data to CSV-compatible array:', data); // Debugging
    return data.map(tabData => Object.values(tabData).join(',')).join('\n');
}