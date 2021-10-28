
import './App.css';
import Loader from './components/Loader';
import Results from './components/Results';

import firebase from "./firebase";
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import React, { useState, useEffect } from 'react';

const { REACT_APP_GOOGLE_API } = process.env;

function App() {

  const [loggedIn, setLoggedIn] = useState(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [justSearched, setJustSearched] = useState(false);

  const [parsedResults, setParsedResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // check if user is logged in
  function checkUser(){
    firebase.auth().onAuthStateChanged(function(user) {
        if(user){
            setLoggedIn(true);
        } else { 
            setLoggedIn(false);
        }
    })
  }

  useEffect(() => {
    checkUser();
    const searchBar = document.getElementById('focus');
    searchBar.focus();
  }, [])

  useEffect(() => {
    retrieveHistory();
  }, [loggedIn])

  useEffect(() => { // setLoadingHistory to false once history stops updating.
    setLoadingHistory(false);
  }, [history])

  function retrieveHistory(){
    // check if user is logged in, and then retrieve History, setHistory, and also remove old searches
    if(loggedIn){
      setLoadingHistory(true);
      const user = firebase.auth().currentUser;
      const uniqueId = user.uid;

      const db = firebase.firestore(); // initialise your database
      const docRef = db.collection('users').doc(uniqueId).collection('searches');

      docRef.orderBy("searchedOn", "desc").get()
      .then((querySnapshot) => {
        console.log('query', querySnapshot);
        let historyArray = [];
        querySnapshot.forEach((doc) => {
          const obj = doc.data();
          historyArray.push({id:doc.id, ...obj});
        })
        setHistory(historyArray);
        console.log(historyArray);

        // remove history that exceeds 15
        const maxHistoryLength = 15;
        let idsToRemove = [];
        console.log('historyArray.length is ', historyArray.length);
        if(historyArray.length > maxHistoryLength) {
          for(let i=maxHistoryLength; i<historyArray.length; i++){
            console.log(historyArray);
            idsToRemove.push(historyArray[i].id);
          }
          console.log('ids to remove: ', idsToRemove)
          idsToRemove.forEach((id) => {
            docRef.doc(id).delete();
          })
        }
      })
      .catch((error => {
        console.log("Error getting documents: ", error);
      }))
    }
    else {
      let localHistory = localStorage.getItem('pastSearches');
      localHistory = JSON.parse(localHistory);
      
      if(localHistory === null || localHistory === undefined || localHistory[0] === null) return;
      console.log('localHistoryas dad is: ', localHistory);
      setHistory(localHistory);
    }
    console.log('Retrieved History: ', history);
  }

  function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(result => {
            const user = result.user;
            console.log(user)
        })
        .catch(console.log);
  }

  function logUserOut(){
    const auth = firebase.auth();    
    auth.signOut();
    // refresh history, using history in local storage
    retrieveHistory();
  }

  function search(e) {
    if(typeof e !== 'string'){
      e.preventDefault();
      // exit search if search input does not have a single valid Japanese character, 
      const regex = /[\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/
      if(searchInput.match(regex)===null){
        alert('Search does not contain any Japanese!');
        return;
      }
    }
    
    // only allow one search a second
    if(justSearched) return; 
    setJustSearched(true);
    setTimeout(() => setJustSearched(false), 1000);

    setParsedResults([]); // erase previous results
    setLoadingSearch(true); // mount loader

    let searchString = '';
    if(typeof e === 'string'){
      searchString = e;
    }
    else{
      searchString = searchInput.replace(/\s/g, ''); // remove all spaces from user's search
      console.log('search is: ', searchString);
    }
    let formattedNumberResults = 0;
    let url = `https://www.googleapis.com/customsearch/v1?key=${REACT_APP_GOOGLE_API}&lr=lang_ja&cx=22519e5637b61b1c8&q=\"${searchString}"`;
    fetch(url, {mode: 'cors'})
    .then((response) => {
        return response.json();
    })
    .then((response) => {
      console.log('search response: ', response);
      if(response.error) {
        setLoadingSearch(false);
        setParsedResults('API key limit reached');
        return;
      }
      // no results found:
      if(response.items === undefined) {
        setLoadingSearch(false);
        setParsedResults(undefined);
        return;
      }
      // The results with <b> tags contain the search term
      // If neither the htmlSnippet or htmlTitle contains this, then the hit is likely a bad one
      function parseResults(resultsObj) {
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
      setParsedResults(parseResults(response.items));

      formattedNumberResults = response.searchInformation.formattedTotalResults
      console.log(response.items);
      setLoadingSearch(false);

      saveHistory(searchString, formattedNumberResults);

      // save history to cloud/localStorage and setState
      function saveHistory(string, numResults){
        // check if user is logged in, and then write to firestore to save user's search
        if(loggedIn) {
          const user = firebase.auth().currentUser;
          const uniqueId = user.uid;

          const date = new Date();
          const time = date.getTime();
          
          const db = firebase.firestore(); // initialise your database
          console.log('num of res from ', numResults);
          db.collection('users').doc(uniqueId).collection('searches').add({
              text: string,
              searchedOn: time,
              numResultsFormatted: numResults,
          })
          .catch((error) => {
              console.error("Error addin doc: ", error);
          })        
          retrieveHistory();
        }
        // read, update and save to local storage
        else {
          let justSearched = {text: string, numResultsFormatted: numResults};
          let retrievedSearches = localStorage.getItem('pastSearches');
          if(retrievedSearches === null){
            console.log('eneterd null');
            retrievedSearches = [justSearched];
          }
          else {
            retrievedSearches = JSON.parse(retrievedSearches);
            if(!(retrievedSearches instanceof Array)){
              retrievedSearches = [retrievedSearches, justSearched];
            }
            else {
              retrievedSearches = [justSearched, ...retrievedSearches];
              let historyLen = retrievedSearches.length;
              if(historyLen > 15){
                console.log(historyLen, ' --- historyLen')
                for(let i=15; i<historyLen; i++){
                  retrievedSearches.pop();
                  console.log('pop')
                }
              }
            }
          }
          retrievedSearches = objToArray(retrievedSearches);
          console.log(retrievedSearches, 'this is my retrievedearches after obj to array')
          console.log('localStorage searches: ', retrievedSearches);
          setHistory(retrievedSearches);
          console.log(history);
          localStorage.setItem('pastSearches', JSON.stringify(retrievedSearches));
        }
      }     
    })
    .catch((error) => {
        console.log(error);
    });     
  }

  function handleChange(e) {
    setSearchInput(e.target.value);
  }

  return (
    <div className='app'>
      <Navbar>
        <div className="nav-search">
          <NavSearchBar search={search} handleChange={handleChange}/>
        </div>
        <div className="nav-items">
          {loggedIn ? <NavItem text="Sign out" icon={faGoogle} onClick={logUserOut}></NavItem> : <NavItem text="Sign in" icon={faGoogle} onClick={googleLogin}></NavItem>}
        </div>
      </Navbar>
      <div className='flex-center'>
        <div className='main-content'>
          <Results parsedResults={parsedResults} loading={loadingSearch} search={search}/>
          <History loading={loadingHistory} loggedIn={loggedIn} history={history}/>
        </div>
      </div>
    </div>
  );
}

function objToArray(obj) {
  if(obj instanceof Array || obj === null) {
    return obj;
  }
  return [obj];
}

function History(props) {
  console.log(props.history);
  if(props.loading){
    return (
      <div className='history'>
        <div id='loader'>
          <Loader loading={props.loading}/>
        </div>
      </div>
    );
  }
  if(props.history === null || props.history === undefined){
    return  (
      <div className='history'>
        <div>Try searching something!</div>
      </div>
    );
  }
  if(props.history[0] === null || props.history[0] === undefined){
    return  (
      <div className='history'>
        <div>Try searching something!</div>
      </div>
    );
  }
  if(props.history.length === 0) {
    return  (
      <div className='history'>
        <div className='history-heading'>Recent searches</div>
        <div className='history-table'></div>
      </div>
    );
  }
  if(props.history.length !== 0){
    return (
      <div className='history'>
        <div className='history-heading'>Recent searches</div>
        <div className='history-table'>
          {props.history.map((item, index) => {
            return (<div key={index} className='history-item' id={'past-search-'+index}>
              <div>{item.text}</div>
              <div className="num-results">{item.numResultsFormatted} Matches</div>
            </div>);
          })}
        </div>
      </div>
    );
  }
  return null;
}

function Navbar(props) {
  return (
    <nav className="navbar">
      <ul className="navbar-nav"> { props.children }</ul>
    </nav>
  );
}

function NavItem(props) {
  return (
    <li className="nav-item">
      <button herf="#" className="nav-button" onClick={props.onClick}>
        <div className="text-button"><FontAwesomeIcon icon={props.icon}/>{props.text}</div>
      </button>
    </li>
  );
}

function NavSearchBar(props) {
  return (
    <form autoComplete="off">
    <input type="text" maxLength="15" placeholder="Search a phrase..." required
    autoComplete="false" className="nav-search-bar" id="focus"
    onChange={props.handleChange}>
    </input>
    <button className="nav-search-bar-button" onClick={props.search}><FontAwesomeIcon icon={faSearch}/></button>
    </form>
  );
}



export default App;
