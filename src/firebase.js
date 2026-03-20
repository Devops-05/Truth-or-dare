import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDz1oqSHU_DLvk48OUFyGHTbLD6iZ2uako",
  authDomain: "truth-or-dare-d3cd9.firebaseapp.com",
  databaseURL: "https://truth-or-dare-d3cd9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "truth-or-dare-d3cd9",
  storageBucket: "truth-or-dare-d3cd9.firebasestorage.app",
  messagingSenderId: "713044549148",
  appId: "1:713044549148:web:6e976b0975e7d2e54d89d9"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);