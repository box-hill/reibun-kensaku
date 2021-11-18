import './styles/styles.css'

import Results from './components/Results';
import History from './components/History';
import Navbar from './components/Navbar';
import NavSearchBar from './components/NavSearchBar';
import NavItem from './components/NavItem';
import parseResults from './components/parseResults'
import firebase from "./firebase";
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { faGoogle } from '@fortawesome/free-brands-svg-icons';

import React, { useState, useEffect } from 'react';

const { REACT_APP_GOOGLE_API } = process.env;

function App() {

  const [initialLogin, setInitialLoginCheck] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [justSearched, setJustSearched] = useState(false);
  const [parsedResults, setParsedResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
 
  useEffect(() => {
    checkUser();
    const searchBar = document.getElementById('focus');
    searchBar.focus();
  }, [])

  useEffect(() => {
    retrieveHistory();
  }, [loggedIn]);
  
  // save history to cloud/localStorage and setState
  function saveHistory(string, numResults){
    // check if user is logged in, and then write to firestore to save user's search
    if(loggedIn) {
      const user = firebase.auth().currentUser;
      const uniqueId = user.uid;

      const date = new Date();
      const time = date.getTime();
      
      const db = firebase.firestore(); // initialise your database
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
            for(let i=15; i<historyLen; i++){
              retrievedSearches.pop();
            }
          }
        }
      }
      retrievedSearches = objToArray(retrievedSearches);
      setHistory(retrievedSearches);
      localStorage.setItem('pastSearches', JSON.stringify(retrievedSearches));
    }
  }
  
  function objToArray(obj) {
    if(obj instanceof Array || obj === null) {
      return obj;
    }
    return [obj];
  }

  // check if user is logged in
  function checkUser(){
    firebase.auth().onAuthStateChanged(function(user) {
        if(user){
            setLoggedIn(true);
            setInitialLoginCheck(true);
            retrieveHistory();   
        } else { 
            setLoggedIn(false);
            setInitialLoginCheck(true);
            retrieveHistory();
        }
    })
  }
  
  function retrieveHistory(){
    setLoadingHistory(true);
    // check if user is logged in, and then retrieve History, setHistory, and also remove old searches
    if(loggedIn){
      const user = firebase.auth().currentUser;
      const uniqueId = user.uid;

      const db = firebase.firestore(); // initialise your database
      const docRef = db.collection('users').doc(uniqueId).collection('searches');

      docRef.orderBy("searchedOn", "desc").get()
      .then((querySnapshot) => {
        let historyArray = [];
        querySnapshot.forEach((doc) => {
          const obj = doc.data();
          historyArray.push({id:doc.id, ...obj});
        })
        setHistory(historyArray);
        // remove history that exceeds 15
        const maxHistoryLength = 15;
        let idsToRemove = [];
        if(historyArray.length > maxHistoryLength) {
          for(let i=maxHistoryLength; i<historyArray.length; i++){
            idsToRemove.push(historyArray[i].id);
          }
          idsToRemove.forEach((id) => {
            docRef.doc(id).delete();
          })
        }
      })
      .catch((error => {
        console.log("Error getting documents: ", error);
      }))
      console.log('Retrieved Cloud History: ', history);
    }
    else {
      let localHistory = localStorage.getItem('pastSearches');
      localHistory = JSON.parse(localHistory);
      if(localHistory === null || localHistory === undefined || localHistory[0] === null){
        setHistory([]);
        setLoadingHistory(false);
        return;
      }
      setHistory(localHistory);
      console.log('Retrieved Local History: ', localHistory);
    }
    setLoadingHistory(false);
  }

  function googleLogin(e) {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(result => {
            console.log('Log in with Google Login successful')
        })
        .catch(console.log);
    retrieveHistory();
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
        saveHistory(searchString, '0');
        return;
      }

      setParsedResults(parseResults(response.items, searchString));

      formattedNumberResults = response.searchInformation.formattedTotalResults
      setLoadingSearch(false);

      saveHistory(searchString, formattedNumberResults);
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
          {loggedIn ? <NavItem text="Sign out" icon={faGoogle} onClick={logUserOut} initialLogin={initialLogin}></NavItem> : 
          <NavItem text="Sign in" icon={faGoogle} onClick={googleLogin} initialLogin={initialLogin}></NavItem>}
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

export default App;
