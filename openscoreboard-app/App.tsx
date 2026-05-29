import React, { useEffect, useState, useRef } from 'react';
import ArchivedMatchList from './src/ArchivedMatchList';
import { createNativeStackNavigator, } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AddPlayers from './src/AddPlayers';
import MyTables from './src/MyTables';
import TableScoring from './src/TableScoring';
import MyScoreboards from './src/MyScoreboards';
import MyTeams from './src/MyTeams';
import MyTeamMatches from './src/MyTeamMatches';
import { isLocalDatabase, subFolderPath } from './openscoreboard.config';
import Home from './src/Home';
import Login from './src/Login';
import ScheduledTableMatches from './src/ScheduledTableMatches';
import { LinearGradient } from 'expo-linear-gradient';
import { authStateListener } from './database';
import MyAccount from './src/MyAccount';
import LoadingPage from './src/LoadingPage';
import MyPlayerLists from './src/MyPlayerLists';
//import QRCodeScreen from './src/QRCode';
import MyDynamicURLs from './src/MyDynamicURLs';
import BulkAddPlayer from './src/BulkAddPlayers';
import PlayerRegistration from './src/PlayerRegistration';
import i18n from './src/translations/translate';
import TableLiveScoringLink from './src/TableLiveScoringLink';

const routeMap = {
  "/": "Home",
  "/login": "Login",
  "/tables": "MyTables",
  "/scoreboards": "MyScoreboards",
  "/teams": "MyTeams",
  "/teammatches": "MyTeamMatches",
  "/scheduledtablematches": "ScheduledTableMatches",
  "/addplayers": "AddPlayers",
  "/players": "MyPlayerLists",
  "/dynamicurls": "DynamicURLS",
  "/livescoring": "TableLiveScoringLink",
  "/account": "MyAccount",
  "/archivedmatches": "ArchivedMatchList",
  "/bulkplayer": "BulkAddPlayer",
}

function getRouteInfo(path) {
  if (path.endsWith("/")) path = path.slice(0, -1);

  if (routeMap[path]) return { name: routeMap[path], params: {} };

  let match;
  match = path.match(/^\/scoring\/table\/([^/]+)\/([^/]+)\/([^/]+)/);
  if (match) {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      name: "TableScoring",
      params: {
        tableID: match[1],
        name: decodeURIComponent(match[2]),
        password: match[3],
        sportName: searchParams.get("sportName") || "tableTennis",
        scoringType: searchParams.get("scoringType"),
      },
    };
  }

  match = path.match(/^\/teamscoring\/teammatch\/([^/]+)\/([^/]+)\/([^/]+)/);
  if (match) {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      name: "TeamMatchScoring",
      params: {
        isTeamMatch: match[1] === "true",
        teamMatchID: match[2],
        tableNumber: match[3],
        name: searchParams.get("name") || "",
        sportName: searchParams.get("sportName") || "tableTennis",
        scoringType: searchParams.get("scoringType"),
        tableID: searchParams.get("tableID") || "",
      },
    };
  }

  match = path.match(/^\/playerregistration\/([^/]+)\/([^/]+)/);
  if (match) {
    return {
      name: "PlayerRegistration",
      params: { playerListID: match[1], password: match[2] },
    };
  }

  return { name: "Home", params: {} };
}
const ScoreboardStack = createNativeStackNavigator()

function ScoreboardNavigation() {

  let [doneLoading, setDoneLoading] = useState(false)
  let [isSignedIn, setIsSignedIn] = useState(isLocalDatabase)
  let navigationRef = useRef(null)



  useEffect(() => {
    if (!isLocalDatabase) {
      authStateListener((user) => {

        if (user) {

          setIsSignedIn(true)
          setDoneLoading(true)

        }
        else {
          setIsSignedIn(false)
          setDoneLoading(true)
        }



      })
    }
    else {
      setDoneLoading(true)
    }
  }, [])

  useEffect(() => {
    if (!doneLoading) return;
    if (!navigationRef.current) return;
    let { name, params } = getRouteInfo(window.location.pathname);
    navigationRef.current.navigate(name, params);
  }, [doneLoading]);

  useEffect(() => {
    if (!doneLoading) return;
    let onPopState = () => {
      if (!navigationRef.current) return;
      let { name, params } = getRouteInfo(window.location.pathname);
      navigationRef.current.navigate(name, params);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [doneLoading]);

  if (doneLoading) {
    return (


      <NavigationContainer ref={navigationRef} onStateChange={(state) => {
        if (!state) return;
        let route = state.routes[state.index];
        if (!route) return;
        let url = window.location.pathname;
        for (let [path, name] of Object.entries(routeMap)) {
          if (name === route.name) {
            url = path;
            break;
          }
        }
        if (url !== window.location.pathname) {
          window.history.pushState(null, "", url);
        }
      }}>


        <ScoreboardStack.Navigator screenOptions={{
          contentStyle: {
            backgroundColor: "white"
          },
          headerTitleStyle: {
            color: "white",
          },
          headerBackground: () => {
            return (<LinearGradient
              colors={['#000000', '#0028ff']}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}

            />)
          },

          headerTintColor: "white"
        }} >


          {


            isSignedIn ? <>
              <ScoreboardStack.Group navigationKey={isSignedIn === true ? "user" : "guest"}>
                <ScoreboardStack.Screen name="Home" component={Home} options={{ title: "Open Scoreboard" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name={"MyTables"} component={MyTables} options={{ title: i18n.t("myTables") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="ArchivedMatchList" component={ArchivedMatchList} options={{ title: i18n.t("archivedMatches") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="AddPlayers" component={AddPlayers} options={{ title: i18n.t("managePlayers") }} />
                <ScoreboardStack.Screen name="MyScoreboards" component={MyScoreboards} options={{ title: i18n.t("myScoreboards") }} />
                <ScoreboardStack.Screen name="MyTeams" component={MyTeams} options={{ title: i18n.t("myTeams") }} />
                <ScoreboardStack.Screen name="MyTeamMatches" component={MyTeamMatches} options={{ title: i18n.t("myTeamMatches") }} />
                <ScoreboardStack.Screen name="ScheduledTableMatches" component={ScheduledTableMatches} options={{ title: i18n.t("scheduledMatches") }} />
                <ScoreboardStack.Screen name="TableScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TeamMatchScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="MyAccount" component={MyAccount} options={{ title: i18n.t("myAccount") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="MyPlayerLists" component={MyPlayerLists} options={{ title: i18n.t("playerLists") }} ></ScoreboardStack.Screen>
                {/* <ScoreboardStack.Screen name="QRCodeScreen" component={QRCodeScreen}  ></ScoreboardStack.Screen> */}
                <ScoreboardStack.Screen name="DynamicURLS" component={MyDynamicURLs} options={{ title: i18n.t("dynamicURLs") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="BulkAddPlayer" component={BulkAddPlayer} options={{ title: "Bulk Add Player" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="PlayerRegistration" component={PlayerRegistration} options={{ title: i18n.t("playerRegistrationScreen") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TableLiveScoringLink" component={TableLiveScoringLink} options={{ title: i18n.t("tableLiveScoring") }} ></ScoreboardStack.Screen>

              </ScoreboardStack.Group>

            </>

              : <>
                <ScoreboardStack.Screen name="Login" component={Login} />
                <ScoreboardStack.Screen name="TableScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TeamMatchScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="PlayerRegistration" component={PlayerRegistration} options={{ headerShown: false }} ></ScoreboardStack.Screen>
              </>


          }
        </ScoreboardStack.Navigator>

      </NavigationContainer>

    )
  }
  else {
    return <LoadingPage></LoadingPage>
  }

}
export default function App() {


  return (

    <ScoreboardNavigation />




  );

}


