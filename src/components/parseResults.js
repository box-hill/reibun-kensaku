// The results with <b> tags contain the search term
// If neither the htmlSnippet or htmlTitle contains this, then the hit is likely a bad one
function parseResults(resultsObj, searchString) {
    // replace all <b>...</b> tags with the keyword searched, &nbsp HTML entities; 
    function replaceTagInString(inputString){
        const regexTag = new RegExp(`<b>.*</b>`, 'g');
        const regexHTML = new RegExp("&nbsp;", "g");
        let outputString = inputString.replaceAll(regexTag, searchString);
        outputString = outputString.replaceAll(regexHTML, "…");         
        return outputString;
    }
    function removeDateInString(inputString){
        // removes the result's date if it exists in the result
        const regex = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-]\d{2}/g;
        const outputString = inputString.replaceAll(regex, '');
        return outputString;
    }
    function removeHTMLtagsInString(inputString){
        let regex = /(<([^>]+)>)/ig;
        let outputString = inputString.replaceAll(regex, '');
        regex = /&.*;/g;
        outputString = outputString.replaceAll(regex, '');
        return outputString;
    }
    // extract sentence by estimating the start and end markers
    function extractSentence(sentence){
        let hitIndex = sentence.indexOf(searchString);
        function findIndexMarker(string, markers, hitIndex, start=true, punctuation=false){
        // to find the start of the sentence, find the latest marker before hitIndex
        if(start){
            let latestStartIndex = 0;
            markers.forEach((marker) => {
            let markerIndex = string.indexOf(marker) + 1; // don't include the punctuation at the start
            latestStartIndex = ((markerIndex > latestStartIndex) && (markerIndex < hitIndex)) ? markerIndex : latestStartIndex;
            });
            return latestStartIndex;
        }
        else{ // find the earliest end of the sentence that is after the hitIndex
            let earliestEndIndex = string.length;
            markers.forEach((marker) => {
            let markerIndex = punctuation ? string.indexOf(marker) + 1 : string.indexOf(marker); // include the punctuation if needed
            earliestEndIndex = ((markerIndex < earliestEndIndex) && (markerIndex > hitIndex)) ? markerIndex : earliestEndIndex;
            });
            return earliestEndIndex;
        }
        }
        let startMarkers = [".", ";", "。", "…", "？", "?", "|","｜","！","!","→"];
        let endMarkers = [";","|","｜","→","【", "&"];
        let endMarkersPunc= [".", "。", "…", "？", "?","！","!"];

        let startIndex = findIndexMarker(sentence, startMarkers, hitIndex, true);
        let endIndex = findIndexMarker(sentence, endMarkers, hitIndex, false);
        let endIndexPunc = findIndexMarker(sentence, endMarkersPunc, hitIndex, false, true);

        endIndex = (endIndexPunc < endIndex) ? endIndexPunc : endIndex;
        return {
        text: sentence.slice(startIndex, endIndex), 
        start: sentence.slice(startIndex, hitIndex),
        searchedPhrase: searchString,
        end: sentence.slice(hitIndex + searchString.length, endIndex)
        };
    }
    let outputArray = [];
    // Add text and link property from our results
    resultsObj.forEach(resultObj => {
        let sentenceString = '';
        if(resultObj.htmlSnippet.includes("<b>")){
        sentenceString = replaceTagInString(resultObj.htmlSnippet);
            //outputArray = [...outputArray, {text: replaceTagInString(resultObj.htmlSnippet), link: resultObj.link}];
        }
        else if(resultObj.htmlTitle.includes("<b>")){
        sentenceString = replaceTagInString(resultObj.htmlTitle);
        }
        else {
        sentenceString = null;
        outputArray = [...outputArray, {text: null}]
        return;
        }              
        // Remove post date in sentence and extract sentence
        sentenceString = removeDateInString(sentenceString);
        sentenceString = removeHTMLtagsInString(sentenceString);
        let extractedObject = extractSentence(sentenceString);

        const fullSentence = extractedObject.text
        const start = extractedObject.start;
        const searchedPhrase = extractedObject.searchedPhrase;
        const end = extractedObject.end;

        outputArray = [...outputArray, {
        text: fullSentence, 
        start: start, 
        searchedPhrase: searchedPhrase, 
        end: end, 
        link: resultObj.link
        }];
    });
    console.log(outputArray);          
    return outputArray;
}

export default parseResults;