

import React, { useEffect, useState } from 'react';
import { Text, Button, View, NativeBaseProvider, Divider } from 'native-base';
import { signOut, authStateListener } from '../database';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import { isLocalDatabase } from '../openscoreboard.config';
import i18n from './translations/translate';


export default function MyAccount() {
    let [user, setUser] = useState(null);

    useEffect(() => {
        let unsub = authStateListener((firebaseUser) => {
            setUser(firebaseUser);
        });
        return unsub;
    }, []);

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <View height="100%" width={"100%"} flex={1} padding={4}>
                {user ? (
                    <View maxW={"lg"} width={"100%"} alignSelf="center">
                        <Text fontSize={"2xl"} fontWeight="bold">{i18n.t("accountInfo")}</Text>
                        <View marginTop={3}>
                            <Text fontSize={"md"} fontWeight="medium">{i18n.t("email")}:</Text>
                            <Text fontSize={"md"}>{user.email}</Text>
                        </View>
                        {user.displayName ? (
                            <View marginTop={2}>
                                <Text fontSize={"md"} fontWeight="medium">{i18n.t("displayName")}:</Text>
                                <Text fontSize={"md"}>{user.displayName}</Text>
                            </View>
                        ) : null}
                        <View marginTop={2}>
                            <Text fontSize={"md"} fontWeight="medium">{i18n.t("signInMethod")}:</Text>
                            {user.providerData.filter(p => p.providerId).map((provider, index) => {
                                let label = provider.providerId === "password" ? "Email/Password" : provider.providerId === "google.com" ? "Google" : provider.providerId;
                                return <Text key={index} fontSize={"md"}>{label}</Text>;
                            })}
                        </View>
                        <Divider marginTop={4} marginBottom={4} />
                        <Button
                            onPress={() => { signOut() }}
                        >
                            <Text color={openScoreboardButtonTextColor}>{i18n.t("logOut")}</Text>
                        </Button>
                    </View>
                ) : (
                    <Text fontSize={"3xl"}>{i18n.t("notSignedIn")}</Text>
                )}
            </View>
        </NativeBaseProvider>
    )
}