import React, { useEffect, useRef } from 'react';
import { Text, View, Button, Pressable } from 'native-base';
import firebase from 'firebase';
import * as firebaseui from 'firebaseui'
import { NativeBaseProvider } from 'native-base';
import { openScoreboardColor, openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";

export default function Login() {

    let ui = useRef(null)

    useEffect(() => {
        ui.current = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth())
        ui.current.start("#uicontainer", {
            signInFlow: 'popup',
            signInOptions: [
                firebase.auth.EmailAuthProvider.PROVIDER_ID,
            ],
            callbacks: {
                signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                    return false;
                }
            }
        })
        return () => {
            ui.current?.reset()
        }
    }, [])

    const signInWithGoogle = async () => {
        try {
            const provider = new firebase.auth.GoogleAuthProvider()
            await firebase.auth().signInWithPopup(provider)
        } catch (error) {
            console.error("Google sign in error:", error)
        }
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <link type="text/css" rel="stylesheet" href="https://www.gstatic.com/firebasejs/ui/5.0.0/firebase-ui-auth.css" />
            <View>
                <Text textAlign={"center"} padding={3} fontSize={"5xl"} fontWeight="bold" color={openScoreboardColor}>Open Scoreboard</Text>
                <div id="uicontainer"></div>
                <View padding={4}>
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