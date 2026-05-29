import { AceBaseClient } from 'acebase-client';
import { getFirebaseConfig, isLocalDatabase } from './openscoreboard.config';
import firebase from 'firebase';

let firebaseConfig = getFirebaseConfig()
let db: AceBaseClient | firebase.database.Database

if (typeof window !== "undefined" && isLocalDatabase) {
    db = new AceBaseClient({
        host: window.location.hostname,
        port: process.env.NODE_ENV === "production" ? parseInt(window.location.port) : 8080,
        dbname: process.env.EXPO_PUBLIC_DATABASE_NAME || "mydb",
        https: window.location.protocol.includes("https") ? true : false,
    });
}
else {
    const firebaseApp = firebase.initializeApp(firebaseConfig);
    const analytics = firebase.analytics(firebaseApp)
    db = firebase.database()
    // Handle redirect result from Google Sign-In
    firebase.auth().getRedirectResult().catch((error) => {
        console.error("Redirect error:", error)
    })
}

export function authStateListener(callbackFunction) {
    return firebase.auth().onAuthStateChanged((user) => {
        callbackFunction(user)
    })
}

export async function loginToFirebase(email, password) {
    let result = {
        error: false,
        success: true,
        errorMessage: "",
        user: {},
        isEmailVerified: true
    }
    try {
        let res = await firebase.auth().signInWithEmailAndPassword(email, password)
        if (!res.user.emailVerified) {
            result.isEmailVerified = false
            result.errorMessage = "You must first verify your email address."
        }
        else {
            result.user = firebase.auth().currentUser
            return result
        }
    } catch (err) {
        switch (err.code) {
            case "auth/user-not-found":
                result.errorMessage = "No account found with this email address"
                break;
            case "auth/invalid-email":
                result.errorMessage = "Invalid email address"
                break;
            case "auth/wrong-password":
                result.errorMessage = "Incorrect password"
                break;
            case "auth/invalid-credential":
            case "auth/invalid-login-credentials":
            case "INVALID_LOGIN_CREDENTIALS":
                result.errorMessage = "No account found with this email, or incorrect password"
                break;
            case "auth/too-many-requests":
                result.errorMessage = "Too many failed attempts. Please try again later"
                break;
            default:
                result.errorMessage = "Sign in failed. Please check your email and password"
                break;
        }
    }

    return result
}

export async function registerToFirebase(email, password) {
    let result = {
        error: false,
        success: true,
        errorMessage: "",
        user: {}
    }
    try {
        let res = await firebase.auth().createUserWithEmailAndPassword(email, password)
        firebase.auth().currentUser.sendEmailVerification()
        result.user = firebase.auth().currentUser
        return result.user
    } catch (err) {
        result.error = true
        switch (err.code) {
            case "auth/email-already-in-use":
                result.errorMessage = "Account already exists. Please login."
                break;
            case "auth/invalid-email":
                result.errorMessage = "Invalid Email"
                break;
            case "auth/weak-password":
                result.errorMessage = "Password must be at least 6 characters."
                break;
            default:
                result.errorMessage = err.message
                break;
        }
    }
    return result
}

export async function signOut() {
    firebase.auth().signOut()
}

/**
 * 
 * @returns string User ID or mylocalserver
 */
export function getUserPath() {
    if (isLocalDatabase) {
        return "mylocalserver"
    }
    else {
        let userPath = firebase.auth().currentUser.uid
        if (userPath) {
            return userPath
        }
        else {
            return false
        }
    }
}

export default db