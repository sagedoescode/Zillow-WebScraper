// POPUP.JS
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('DownloadData').addEventListener('click', downloadCSV);
    console.log("Downloading data..")
});

function downloadCSV() {
    // Retrieve the data from Chrome's local storage
    chrome.storage.local.get('extractedData', function(result) {
        if (result.extractedData) {
            const csvContent = convertArrayToCSV(result.extractedData);
            // Create a downloadable link and trigger the download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'extracted_data.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.log('No data found in Chrome storage.');
        }
    });
}

// Function to convert array of objects to CSV
function convertArrayToCSV(array) {
    const header = Object.keys(array[0]).join(',');
    const rows = array.map(obj => Object.values(obj).join(','));
    return `${header}\n${rows.join('\n')}`;
}
document.addEventListener('DOMContentLoaded', function() {
    // Hide the settings container and show the content container
    document.querySelector('.settings').style.display = 'none';
    document.querySelector('.content').style.display = 'flex';

    // JavaScript to handle menu item clicks
    document.getElementById('settings').addEventListener('click', function() {
        // Hide content and show settings
        document.querySelector('.content').style.display = 'none';
        document.querySelector('.settings').style.display = 'flex';
    });
 

    document.getElementById('home').addEventListener('click', function() {
        // Hide settings and show content
        document.querySelector('.settings').style.display = 'none';
        document.querySelector('.content').style.display = 'flex';
    });
    
    let sliderOne = document.getElementById("slider-1");
    let sliderTwo = document.getElementById("slider-2");
    let displayValOne = document.getElementById("range1");
    let displayValTwo = document.getElementById("range2");
    let minGap = 0;
    let sliderTrack = document.querySelector(".slider-track");
    let sliderMaxValue = document.getElementById("slider-1").max;

    // Function to update slider 1 value and associated text
    function slideOne() {
        if (parseInt(sliderTwo.value) - parseInt(sliderOne.value) <= minGap) {
            sliderOne.value = parseInt(sliderTwo.value) - minGap;
        }
        displayValOne.textContent = sliderOne.value;
        fillColor();
    }
    
    // Function to update slider 2 value and associated text
    function slideTwo() {
        if (parseInt(sliderTwo.value) - parseInt(sliderOne.value) <= minGap) {
            sliderTwo.value = parseInt(sliderOne.value) + minGap;
        }
        displayValTwo.textContent = sliderTwo.value;
        fillColor();
    }
    
    // Event listeners for slider 1
    sliderOne.addEventListener('input', slideOne);
    sliderOne.addEventListener('change', slideOne); // in case input is changed by keyboard
    
    // Event listeners for slider 2
    sliderTwo.addEventListener('input', slideTwo);
    sliderTwo.addEventListener('change', slideTwo); // in case input is changed by keyboard

    function fillColor() {
        percent1 = (sliderOne.value / sliderMaxValue) * 100;
        percent2 = (sliderTwo.value / sliderMaxValue) * 100;
        sliderTrack.style.background = `linear-gradient(to right, #dadae5 ${percent1}% , #3264fe ${percent1}% , #3264fe ${percent2}%, #dadae5 ${percent2}%)`;
    }
    
    var startButton = document.getElementById('startScraping');
    var stopButton = document.getElementById('stopScraping');
    var statusDisplay = document.getElementById('status');

    startButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'startScraping' }, function(response) {
          statusDisplay.textContent = response.message;
        });
      });
    
      stopButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'stopScraping' }, function(response) {
          statusDisplay.textContent = response.message;
        });
      });
    });
    
// Listening for messages from the background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'scrapedData') {
    console.log(message.data.header); // Log the header
    console.log(message.data.info); // Log the info
    }
});
