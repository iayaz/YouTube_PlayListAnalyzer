const puppeteer = require('puppeteer');
const pdf = require('pdfkit');
const fs = require('fs');
let cTab;
let link = 'https://www.youtube.com/playlist?list=PLzkuLC6Yvumv_Rd5apfPRWEcjf9b1JRnq';
(async function(){
    try {
        let browserOpen = puppeteer.launch({
            headless : false , 
            defaultViewport : null,
            args : ['--start-maximized']
        })
        let browserInstance = await browserOpen;
        let allTabsArr = await browserInstance.pages();
        let cTab = allTabsArr[0];
        await cTab.goto(link);
        await cTab.waitForSelector('h1#title');
        let name = await cTab.evaluate(function(select){ return document.querySelector(select).innerText} , "h1#title");
        
        let allData = await cTab.evaluate(getData , '#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer');
        console.log(name,allData.noOfVideos,allData.noOfViews);
        let totalVideos = allData.noOfVideos.split(" ")[0];
        console.log(totalVideos);
        let currentVideos = await getCVideosLength();
        console.log(currentVideos,"Here");
        while(totalVideos - currentVideos >= 20){
            await scrollToBottom();
            currentVideos = await getCVideosLength();
        }
        let FinalList = await getStats();
        let pdfDoc = new pdf;
        pdfDoc.pipe(fs.createWriteStream('play.pdf'));
        pdfDoc.text(JSON.stringify(FinalList));
        pdfDoc.end();
    } catch (error) {
        console.log(error);
    }

})()

async function scrollToBottom(){
    await cTab.evaluate(gotoBottom)
    function gotoBottom(){
        window.scrollBy(0,window.innerHeight);
    }
}

function getData(selector){
    let allElements = document.querySelectorAll(selector);
    let noOfVideos = allElements[0].innerText;
    let noOfViews = allElements[1].innerText;
    return{
        noOfVideos,
        noOfViews
    };
}

async function getCVideosLength(){
    let length = await cTab.evaluate(getLength , '#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
    return length;
}

function getLength(durationSelector){
    let durationEle = document.querySelectorAll(durationSelector);
    return durationEle.length;
}
function getNameAndDuration(videoSelector , durationSelector){
    let videoEle = document.querySelectorAll(videoSelector);
    let durationEle = document.querySelectorAll(durationSelector);
    let cList = [];
    for(let  i = 0 ; i < durationEle.length ; i++){
        let VideoTitle = videoEle[i].innerText;
        let durationEle = durationEle[i].innerText;
        cList.push({VideoTitle , durationEle});
    }
}

async function getStats(){
    let list = cTab.evaluate(getNameAndDuration , '#video-title' , '#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer')
    return list;
}