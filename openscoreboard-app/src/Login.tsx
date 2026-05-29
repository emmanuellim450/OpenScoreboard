import React, { useEffect, useRef, useState } from 'react';
import { Text, View, Pressable, Input, Button, Spinner } from 'native-base';
import firebase from 'firebase';
import { NativeBaseProvider } from 'native-base';
import { openScoreboardColor, openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import { loginToFirebase, registerToFirebase } from '../database';

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)
    const [isForgotPassword, setIsForgotPassword] = useState(false)

    const signInWithGoogle = async () => {
        try {
            const provider = new firebase.auth.GoogleAuthProvider()
            await firebase.auth().signInWithPopup(provider)
        } catch (error) {
            console.error("Google sign in error:", error)
        }
    }

    const handleForgotPassword = async () => {
        setLoading(true)
        setErrorMessage("")
        setSuccessMessage("")
        try {
            await firebase.auth().sendPasswordResetEmail(email)
            setSuccessMessage("Password reset email sent. Check your inbox.")
        } catch (err) {
            switch (err.code) {
                case "auth/user-not-found":
                    setErrorMessage("No account found with this email address")
                    break;
                case "auth/invalid-email":
                    setErrorMessage("Invalid email address")
                    break;
                default:
                    setErrorMessage("Failed to send reset email. Please try again")
                    break;
            }
        }
        setLoading(false)
    }

    const handleEmailSignIn = async () => {
        setLoading(true)
        setErrorMessage("")
        setSuccessMessage("")

        if (isRegistering) {
            let result = await registerToFirebase(email, password)
            if (result && result.error) {
                setErrorMessage(result.errorMessage)
            }
        } else {
            // First check what sign-in methods exist for this email
            try {
                const methods = await firebase.auth().fetchSignInMethodsForEmail(email)
                if (methods.length > 0 && !methods.includes('password')) {
                    // Account exists but not with email/password
                    if (methods.includes('google.com')) {
                        setErrorMessage("This email is registered with Google Sign-In. Please use the 'Sign in with Google' button below.")
                    } else {
                        setErrorMessage(`This email is registered with ${methods[0]}. Please use that sign-in method.`)
                    }
                    setLoading(false)
                    return
                }
            } catch (err) {
                // If fetchSignInMethods fails, proceed with normal sign in
            }

            let result = await loginToFirebase(email, password)
            if (result && result.errorMessage) {
                setErrorMessage(result.errorMessage)
            }
        }
        setLoading(false)
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <View flex={1} justifyContent={"center"} alignItems={"center"} padding={4}>
                <Text textAlign={"center"} padding={3} fontSize={"5xl"} fontWeight="bold" color={openScoreboardColor}>Open Scoreboard</Text>

                <View width={"100%"} maxW={400} padding={4} borderWidth={1} borderColor={"gray.200"} borderRadius={8}>
                    <Text fontSize={"xl"} fontWeight={"bold"} marginBottom={4}>
                        {isForgotPassword ? "Reset Password" : isRegistering ? "Create Account" : "Sign In"}
                    </Text>

                    <Input
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        marginBottom={3}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {!isForgotPassword &&
                        <Input
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            marginBottom={3}
                            type="password"
                            secureTextEntry
                        />
                    }

                    {errorMessage.length > 0 &&
                        <Text color={"red.500"} marginBottom={3}>{errorMessage}</Text>
                    }

                    {successMessage.length > 0 &&
                        <Text color={"green.500"} marginBottom={3}>{successMessage}</Text>
                    }

                    <Button
                        onPress={isForgotPassword ? handleForgotPassword : handleEmailSignIn}
                        backgroundColor={openScoreboardColor}
                        marginBottom={3}
                        disabled={loading}
                    >
                        {loading ?
                            <Spinner color={openScoreboardButtonTextColor} />
                            :
                            <Text color={openScoreboardButtonTextColor}>
                                {isForgotPassword ? "Send Reset Email" : isRegistering ? "Create Account" : "Sign In"}
                            </Text>
                        }
                    </Button>

                    {!isForgotPassword && !isRegistering &&
                        <Pressable onPress={() => {
                            setIsForgotPassword(true)
                            setErrorMessage("")
                            setSuccessMessage("")
                        }} _pressed={{ opacity: 0.6 }}>
                            <Text textAlign={"center"} color={openScoreboardColor} marginBottom={3} underline>
                                Forgot password?
                            </Text>
                        </Pressable>
                    }

                    <Pressable onPress={() => {
                        setIsRegistering(isForgotPassword ? false : !isRegistering)
                        setIsForgotPassword(false)
                        setErrorMessage("")
                        setSuccessMessage("")
                    }} _pressed={{ opacity: 0.6 }}>
                        <Text textAlign={"center"} color={openScoreboardColor} underline>
                            {isForgotPassword ? "Back to sign in" : isRegistering ? "Already have an account? Sign in" : "No account? Create one"}
                        </Text>
                    </Pressable>
                </View>

                <View width={"100%"} maxW={400} padding={4}>
                    <Pressable
                        onPress={signInWithGoogle}
                        borderWidth={1}
                        borderColor={"gray.300"}
                        borderRadius={4}
                        padding={3}
                        flexDirection={"row"}
                        alignItems={"center"}
                        justifyContent={"center"}
                        backgroundColor={"white"}
                    >
                        <Text fontSize={"md"}>Sign in with Google</Text>
                    </Pressable>
                </View>
            </View>
        </NativeBaseProvider>
    )
}