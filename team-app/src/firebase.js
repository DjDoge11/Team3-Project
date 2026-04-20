// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPoORfRfy8BqqIAzpUOJGqjCQ6176IcGg",
  authDomain: "gpa-calculator-87bf1.firebaseapp.com",
  projectId: "gpa-calculator-87bf1",
  storageBucket: "gpa-calculator-87bf1.firebasestorage.app",
  messagingSenderId: "49080740729",
  appId: "1:49080740729:web:21735d4202c243ccdd5da8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();


