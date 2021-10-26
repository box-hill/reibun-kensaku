
import './App.css';
import Loader from './components/Loader';

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
  const [loadingSearch, setLoadingSearch] = useState(false);

  // check if user is logged in
  function checkUser(){
    firebase.auth().onAuthStateChanged(function(user) {
        if(user) {
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
  }, [])
  
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
    if( justSearched ) return; 
    setJustSearched(true);
    setTimeout(() => setJustSearched(false), 1000);

    setResults([]); // erase previous results
    setLoadingSearch(true); // mount loader

    let searchString = searchInput.replace(/\s/g, ''); // remove all spaces
    console.log('search is: ', searchString);

    /* ADD: code for google search api goes here */
    // string manipulation can go somewhere else.
    let url = `https://www.googleapis.com/customsearch/v1?key=${REACT_APP_GOOGLE_API}&cx=22519e5637b61b1c8&start=20&q=\"${searchString}"`;
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
    if( loggedIn ) {
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
    <div>
      <Navbar>
        <div className="nav-search">
          <NavSearchBar search={search} handleChange={handleChange}/>
        </div>
        <div className="nav-items">
          {loggedIn ? <NavItem text="Sign out" icon={faGoogle} onClick={logUserOut}></NavItem> : <NavItem text="Sign in" icon={faGoogle} onClick={googleLogin}></NavItem>}
          <NavItem text="About" icon={faQuestionCircle}></NavItem>
        </div>
      </Navbar>
      <Loader loading={loadingSearch}/>
      <Card results={results}/>
    </div>
  );
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

function Card(props) {
  if(props.results === undefined) {
    return (
      <div className='error-center'>
        <div className='error-emoji'>(╯°□°)╯︵ ┻━┻</div>
        <div>Can't find any matching sentences.</div>
        <div>Try changing your search.</div>
        <div className='error-jap'>フレーズに該当する例文が見つかりません。</div>
        <div>フレーズを変更して検索してください。</div>
      </div>
    );
  }
  return (
    <div>
      {props.results.map((result, index) => {return <div key={index}>{result.title}</div>})}
    </div>
  );
}

export default App;
