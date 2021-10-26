
import './App.css';
import Loader from './components/Loader';
import Card from './components/Card';

import firebase from "./firebase";
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faQuestionCircle, faSearch } from '@fortawesome/free-solid-svg-icons';

import React, { useState, useEffect } from 'react';

const { REACT_APP_GOOGLE_API } = process.env;

function App() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [justSearched, setJustSearched] = useState(false);
  const [results, setResults] = useState([]);
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

      docRef.get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          //console.log(doc.data().text);
          setHistory(prevData => [...prevData, doc.data().text]);
        })
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
    // only allow one search a second
    if(justSearched) return; 
    setJustSearched(true);
    setTimeout(() => setJustSearched(false), 1000);

    setResults([]); // erase previous results
    setLoadingSearch(true); // mount loader

    let searchString = searchInput.replace(/\s/g, ''); // remove all spaces from user's search
    console.log('search is: ', searchString);

    /* ADD: code for google search api goes here */
    // string manipulation can go somewhere else.
    let url = `https://www.googleapis.com/customsearch/v1?key=${REACT_APP_GOOGLE_API}&cx=22519e5637b61b1c8&q=\"${searchString}"`;
    fetch(url, {mode: 'cors'})
    .then((response) => {
        return response.json();
    })
    .then((response) => {
        console.log('search response: ');
        console.log(response);

        setResults(response.items);        
        setTimeout(() => console.log(results), 500);
        setLoadingSearch(false);
    })
    .catch((error) => {
        console.log(error);
    });
    
    // check if user is logged in, and then write to firestore to save user's search
    if(loggedIn) {
        const user = firebase.auth().currentUser;
        const uniqueId = user.uid;

        const date = new Date();
        const time = date.getTime();
        
        const db = firebase.firestore(); // initialise your database
        db.collection('users').doc(uniqueId).collection('searches').add({
            text: searchString,
            searchedOn: time,
        })
        .then((docRef) => {
            console.log("Document written with ID: ", docRef.id, "User ID: ", uniqueId);
        })
        .catch((error) => {
            console.error("Error addin doc: ", error);
        })
      /* ADD: code to delete once searches get past 100*/
    }
     
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
        <Card results={results} loading={loadingSearch} searchInput={searchInput}/>
        <History loading={loadingHistory} loggedIn={loggedIn} history={history}/>
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
        {props.history.map((search, index) => {
          return <div key={index} className='history-item'>{search}</div>
        })}
      </div>
    );
  }
  return (null);
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
    <input type="text" maxLength="25" placeholder="Type some japanese here" 
    autoComplete="false" className="nav-search-bar" 
    onChange={props.handleChange}>
    </input>
    <button className="nav-search-bar-button" onClick={props.search}><FontAwesomeIcon icon={faSearch}/>Search</button>
    </form>
  );
}



export default App;
