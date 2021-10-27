
import './App.css';
import Loader from './components/Loader';
import Card from './components/Card';

import firebase from "./firebase";
import 'firebase/compat/firestore';
import { query, orderBy, limit } from "firebase/firestore";  
import 'firebase/compat/auth';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faQuestionCircle, faSearch } from '@fortawesome/free-solid-svg-icons';

import React, { useState, useEffect } from 'react';

const { REACT_APP_GOOGLE_API } = process.env;

function App() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [numberResults, setNumberResults] = useState(undefined);
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
            console.log('user is logged in ');
        } else { 
            setLoggedIn(false);
            console.log('not signed in');
        }
    })
  }

  useEffect(() => {
    checkUser();
    retrieveHistory();
  }, [])

  useEffect(() => {
    retrieveHistory();
  }, [loggedIn])

  useEffect(() => { // setLoadingHistory to false once history stops updating.
    setLoadingHistory(false);
  }, [history])

  function retrieveHistory(){
    // check if user is logged in, and then retrieve History
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
          console.log(doc.data());
          historyArray.push(doc.data());
          //setHistory(prevData => [...prevData, doc.data().text]);
        })
        setHistory(historyArray);
        console.log(historyArray);
      })
      .catch((error => {
        console.log("Error getting documents: ", error);
      }))
      console.log('Retrieved History: ', history);
      

    }
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
  }

  function search(e) {
    e.preventDefault();

    // exit search if search input does not have a single valid Japanese character, 
    const regex = /[\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/
    if(searchInput.match(regex)===null){
      alert('Search does not contain any Japanese!');
      return;
    }

    // only allow one search a second
    if(justSearched) return; 
    setJustSearched(true);
    setTimeout(() => setJustSearched(false), 1000);

    setParsedResults([]); // erase previous results
    setLoadingSearch(true); // mount loader

    let searchString = searchInput.replace(/\s/g, ''); // remove all spaces from user's search
    console.log('search is: ', searchString);
    let formattedNumberResults = 0;
    let url = `https://www.googleapis.com/customsearch/v1?key=${REACT_APP_GOOGLE_API}&cx=22519e5637b61b1c8&q=\"${searchString}"`;
    fetch(url, {mode: 'cors'})
    .then((response) => {
        return response.json();
    })
    .then((response) => {
      console.log('search response: ', response);
      // The results with <b> tags contain the search term
      // If neither the htmlSnippet or htmlTitle contains this, then the hit is likely a bad one
      function parseResults(resultsObj) {
        // replace all <b>...</b> tags with the keyword searched, &nbsp HTML entities; 
        function replaceTagInString(inputString){
          const regexTag = new RegExp("<b>.*</b>", "g");
          const regexHTML = new RegExp("&nbsp;", "g");
          let outputString = inputString.replaceAll(regexTag, searchString);
          outputString = outputString.replaceAll(regexHTML, "…");         
          return outputString;
        }
        // removes the result's date if it exists in the result
        function removeDateInString(inputString){
          const regex = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-]\d{2}/g;
          const outputString = inputString.replaceAll(regex, '');
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
          let endMarkersPunc= [".", , "。", "…", "？", "?","！","!"];

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
          let extractedObject = extractSentence(sentenceString);

          // once w ehaver our sentence, we can split into 3 parts, phrase 1, bold keyword, phrase 2
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
      setNumberResults(formattedNumberResults);
      console.log(response.items);
      setLoadingSearch(false);

      // check if user is logged in, and then write to firestore to save user's search
      if(loggedIn) {
        const user = firebase.auth().currentUser;
        const uniqueId = user.uid;

        const date = new Date();
        const time = date.getTime();
        
        const db = firebase.firestore(); // initialise your database
        console.log('num of res from ', formattedNumberResults);
        db.collection('users').doc(uniqueId).collection('searches').add({
            text: searchString,
            searchedOn: time,
            numResultsFormatted: formattedNumberResults,
        })
        .catch((error) => {
            console.error("Error addin doc: ", error);
        })        
        // ADD: code that adds directly to history state in local (?)
        
        /* ADD: code to delete once no. searches get past 10*/

        retrieveHistory();
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
          <NavItem text="About" icon={faQuestionCircle}></NavItem>
        </div>
      </Navbar>
      <div className='main-content'>
        <Card parsedResults={parsedResults} loading={loadingSearch}/>
        <History loading={loadingHistory} loggedIn={loggedIn} history={history}/>
        <NumberResults numberResults={numberResults}/>
      </div>
    </div>
  );
}

function History(props) {
  if(!props.loggedIn){
    return (
      <div className='history'>
        Log to view hist
      </div>
    )
  }
  if(props.loading){
    return (
      <div className='history'>
        <div id='loader'>
          <Loader loading={props.loading}/>
        </div>
      </div>
    );
  }
  if(props.history.length !== 0){
    return (
      <div className='history'>
        <div>Recent searches</div>
        {props.history.map((item, index) => {
          return (<div key={index} className='history-item'>
            <div>{item.text}</div>
            <div>{item.numResultsFormatted}</div>
          </div>);
        })}
      </div>
    );
  }
  return null;
}

function NumberResults(props) {
  console.log(props.numberResults);
  if(props.numberResults === undefined) return null;
  return (<div>About {props.numberResults} matching sentences</div>);
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
      <button herf="#" className="text-button" onClick={props.onClick}>
      <FontAwesomeIcon icon={props.icon}/> {props.text}
      </button>
    </li>
  );
}

function NavSearchBar(props) {
  return (
    <form autoComplete="off">
    <input type="text" maxLength="15" placeholder="Type some japanese here" 
    autoComplete="false" className="nav-search-bar" 
    onChange={props.handleChange}>
    </input>
    <button className="nav-search-bar-button" onClick={props.search}><FontAwesomeIcon icon={faSearch}/>Search</button>
    </form>
  );
}



export default App;
