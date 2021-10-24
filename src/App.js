
import './App.css';

import firebase from "./firebase";
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faQuestionCircle, faSearch } from '@fortawesome/free-solid-svg-icons';

import React, { useState, useEffect } from 'react';

function App() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [searchInput, setSearchInput] = useState(undefined);
  const [justSearched, setJustSearched] = useState(false);

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

    // only allow 1 search a second
    if( justSearched ) return; 
    setJustSearched(true);
    setTimeout(() => setJustSearched(false), 1000);

    const searchString = searchInput; 
    console.log('search is: ', searchString);
    
    /* ADD: code for google search api goes here */
    // string manipulation can go somewhere else.
    
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
    console.log(e.target.value);
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
    <form>
    <input type="text" maxLength="25" placeholder="Type some japanese here" className="nav-search-bar" id="search-input" onChange={props.handleChange}>
    </input>
    <button className="nav-search-bar-button" onClick={props.search}><FontAwesomeIcon icon={faSearch}/>Search</button>
    </form>
  );
}

export default App;
