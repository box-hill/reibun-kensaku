
import './App.css';

import firebase from "./firebase";
import 'firebase/compat/firestore';
import 'firebase/compat/auth';


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

  testWrite();

  return (
    <div> Initiating file test 123 123

    </div>
  );
}

export default App;
