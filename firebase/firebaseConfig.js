import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPOZv3AoDW0nnFft_2Z_6YHt7Odx7Fgf0",
  authDomain: "stemm-lab-786b3.firebaseapp.com",
  projectId: "stemm-lab-786b3",
  storageBucket: "stemm-lab-786b3.firebasestorage.app",
  messagingSenderId: "719021860633",
  appId: "1:719021860633:web:388376999d44411d870788",
  measurementId: "G-SPHVYV0V7W"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);