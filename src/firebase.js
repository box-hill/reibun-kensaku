import firebase from "firebase/compat/app";

const firebaseConfig = {
    apiKey: "AIzaSyDqKHML7jRE3g3pxva7DHMxVDCZFwm6j14",
    authDomain: "reibun-kensaku.firebaseapp.com",
    projectId: "reibun-kensaku",
    storageBucket: "reibun-kensaku.appspot.com",
    messagingSenderId: "697365377881",
    appId: "1:697365377881:web:78c42a2d5bde7122f0d248"
};

firebase.initializeApp(firebaseConfig);

export default firebase;