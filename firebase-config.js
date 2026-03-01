// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBRewXvtCNzcZVSONJo-0yZr7UHlc7FRWQ",
    authDomain: "sapna-furniture.firebaseapp.com",
    databaseURL: "https://sapna-furniture-default-rtdb.firebaseio.com",
    projectId: "sapna-furniture",
    storageBucket: "sapna-furniture.firebasestorage.app",
    messagingSenderId: "422562227412",
    appId: "1:422562227412:web:398bbd10b498e8c1bac741"
};

// Initialize Firebase using Global var (Compat mode jo humne use kia hai HTML mein)
try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.database();
    console.log("Firebase Setup Active ✨");
} catch (e) {
    console.error("Firebase Initialization Error.", e);
}