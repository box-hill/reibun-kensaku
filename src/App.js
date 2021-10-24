
import './App.css';

import firebase from "./firebase";
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

function App() {
  const db = firebase.firestore(); // initialise your database

  function testWrite(){
    // const search = document.querySelector('#input-search');
    // const searchString = search.value; 

    // const user = firebase.auth().currentUser;
    // const uniqueId = user.uid;
    // console.log(uniqueId);
    
    const db = firebase.firestore(); // initialise your database
    db.collection('users').doc('test').collection('searches').add({
        //text: searchString,
        text: 'abcdefg'
    })
    .then((docRef) => {
        console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
        console.error("Error addin doc: ", error);
    })

  }

  return (
    <div>
      <Navbar>
        <div className="nav-search">
          <NavSearchBar/>
        </div>
        <div className="nav-items">
          <NavItem text="Sign in" icon={faGoogle}></NavItem>
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
      
      <button herf="#" className="text-button">
      <FontAwesomeIcon icon={props.icon}/> {props.text}
      </button>
    </li>
  );
}

function NavSearchBar() {
  return (
    <input type="text" maxLength="25" placeholder="Type some japanese here" className="nav-search-bar"></input>
  );
}

export default App;
