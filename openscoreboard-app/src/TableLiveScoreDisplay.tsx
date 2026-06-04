import React, { useEffect, useState, useRef } from 'react';
import { Text, View, NativeBaseProvider, FlatList, Spinner } from 'native-base';
import { openScoreboardColor, openScoreboardTheme } from "../openscoreboardtheme";
import db from '../database';

function computeMatchScore(match, bestOf) {
  let a = 0, b = 0;
  for (let i = 1; i <= 9; i++) {
    if (match[`isGame${i}Finished`]) {
      if (match[`game${i}AScore`] > match[`game${i}BScore`]) a++;
      else b++;
    }
  }
  let winningScore = Math.floor((bestOf || 5) / 2) + 1;
  let finished = a >= winningScore || b >= winningScore;
  let winner = finished ? (a >= winningScore ? "A" : "B") : null;
  let setsNeeded = winningScore;
  let totalPossibleSets = bestOf || 5;
  return { a, b, finished, winner, winningScore, setsNeeded, totalPossibleSets };
}

function TableScoreCard({ tableID }) {
  let [tableData, setTableData] = useState(null);
  let offListRef = useRef([]);
  let currentMatchRef = useRef("");

  function cleanup() {
    offListRef.current.forEach((fn) => fn());
    offListRef.current = [];
  }

  async function subscribeToMatch(matchKey) {
    cleanup();
    currentMatchRef.current = matchKey;

    if (!matchKey) {
      let nameSnap = await db.ref(`tables/${tableID}/tableName`).get();
      setTableData({ tableName: nameSnap.val() || "Table", noMatch: true });
      return;
    }

    let nameSnap = await db.ref(`tables/${tableID}/tableName`).get();
    let name = nameSnap.val() || "Table";

    let matchSnap = await db.ref(`matches/${matchKey}/`).get();
    let match = matchSnap.val();
    if (!match) {
      setTableData({ tableName: name, noMatch: true });
      return;
    }
    setTableData({ tableName: name, ...match });

    for (let key in match) {
      let ref = db.ref(`matches/${matchKey}/${key}`);
      ref.on("value", (snap) => {
        let val = snap.val();
        if (val && typeof val["value"] !== "undefined") val = val["value"];
        setTableData((prev) => (prev ? { ...prev, [key]: val } : prev));
      });
      offListRef.current.push(() => ref.off());
    }
  }

  useEffect(() => {
    let currentMatchRef_d = db.ref(`tables/${tableID}/currentMatch`);

    function handleCurrentMatchChange(snap) {
      let newMatchKey = snap.val();
      if (newMatchKey !== currentMatchRef.current) {
        subscribeToMatch(newMatchKey);
      }
    }

    currentMatchRef_d.on("value", handleCurrentMatchChange);

    return () => {
      currentMatchRef_d.off("value", handleCurrentMatchChange);
      cleanup();
    };
  }, [tableID]);

  if (!tableData) {
    return (
      <View padding={4} margin={2} borderWidth={1} borderColor="gray.300" borderRadius="md">
        <Spinner />
      </View>
    );
  }

  if (tableData.noMatch) {
    return (
      <View padding={4} margin={2} borderWidth={1} borderColor="gray.300" borderRadius="md">
        <Text fontSize={"xl"} fontWeight="bold">{tableData.tableName}</Text>
        <Text>No active match</Text>
      </View>
    );
  }

  let playerALabel = tableData.teamNameA || (tableData.playerA ? tableData.playerA.firstName + " " + tableData.playerA.lastName : "Player A");
  let playerBLabel = tableData.teamNameB || (tableData.playerB ? tableData.playerB.firstName + " " + tableData.playerB.lastName : "Player B");

  let totalGames = tableData.bestOf || 5;
  let matchScore = computeMatchScore(tableData, totalGames);

  let currentGame = 1;
  for (let i = 1; i <= totalGames; i++) {
    if (!tableData[`isGame${i}Finished`] && tableData[`isGame${i}Started`]) {
      currentGame = i;
      break;
    }
    if (!tableData[`isGame${i}Finished`] && i === 1) {
      currentGame = i;
      break;
    }
  }

  let gameScores = [];
  let gamesBeyondWinning = 0;
  for (let i = 1; i <= totalGames; i++) {
    let aScore = tableData[`game${i}AScore`];
    let bScore = tableData[`game${i}BScore`];
    if (aScore === undefined) continue;
    let finished = tableData[`isGame${i}Finished`];
    let isCurrent = i === currentGame && !matchScore.finished;

    if (matchScore.finished && !finished && i > matchScore.setsNeeded) {
      gamesBeyondWinning++;
      continue;
    }

    gameScores.push({ game: i, a: aScore, b: bScore, finished, isCurrent });
  }

  return (
    <View padding={4} margin={2} borderWidth={1} borderColor="gray.300" borderRadius="md">
      {matchScore.finished ? (
        <View bg={openScoreboardColor} padding={1} borderRadius="sm" marginBottom={2}>
          <Text fontSize={"md"} fontWeight="bold" textAlign="center" color="white">
            Match Finished — {matchScore.winner === "A" ? playerALabel : playerBLabel} Won {matchScore.a}-{matchScore.b}
          </Text>
        </View>
      ) : null}

      <Text fontSize={"2xl"} fontWeight="bold" textAlign="center">{tableData.tableName}</Text>
      <Text fontSize={"xl"} textAlign="center">{playerALabel} vs {playerBLabel}</Text>

      <View flexDirection={"row"} justifyContent="center" marginTop={2}>
        <View alignItems="center" marginX={4}>
          <Text fontSize={"4xl"} fontWeight="bold">{tableData[`game${currentGame}AScore`] ?? 0}</Text>
          <Text fontSize={"sm"}>{playerALabel}</Text>
        </View>
        <View alignItems="center" marginX={4}>
          <Text fontSize={"4xl"} fontWeight="bold">-</Text>
        </View>
        <View alignItems="center" marginX={4}>
          <Text fontSize={"4xl"} fontWeight="bold">{tableData[`game${currentGame}BScore`] ?? 0}</Text>
          <Text fontSize={"sm"}>{playerBLabel}</Text>
        </View>
      </View>

      <View flexDirection={"row"} justifyContent="center" marginTop={2} flexWrap="wrap">
        {gameScores.map((gs) => {
          let aWon = gs.finished && gs.a > gs.b;
          let bWon = gs.finished && gs.b > gs.a;
          return (
            <View
              key={gs.game}
              margin={1}
              paddingX={2}
              paddingY={1}
              bg={gs.isCurrent ? "blue.100" : gs.finished ? (aWon ? "green.200" : "red.200") : "gray.100"}
              borderRadius="md"
            >
              <Text fontSize={"sm"} fontWeight={gs.isCurrent ? "bold" : "medium"}>
                G{gs.game}: {gs.a}-{gs.b}
                {gs.finished ? (aWon ? " ✓" : " ✗") : gs.isCurrent ? " ●" : ""}
              </Text>
            </View>
          );
        })}
        {gamesBeyondWinning > 0 ? (
          <View margin={1} paddingX={2} paddingY={1} bg="gray.200" borderRadius="md">
            <Text fontSize={"sm"} color="gray.500">+{gamesBeyondWinning} not played</Text>
          </View>
        ) : null}
      </View>

      <View flexDirection={"row"} justifyContent="center" marginTop={1}>
        <Text fontSize={"sm"} color="gray.600">
          Match Score: {playerALabel} {matchScore.a} - {matchScore.b} {playerBLabel}
          {matchScore.finished ? "" : ` (Best of ${totalGames})`}
        </Text>
      </View>
    </View>
  );
}

export default function TableLiveScoreDisplay(props) {
  let tableIDs = (props.route?.params?.tables || "").split(",").filter(Boolean);

  if (tableIDs.length === 0) {
    return (
      <NativeBaseProvider theme={openScoreboardTheme}>
        <View flex={1} justifyContent="center" alignItems="center">
          <Text fontSize={"xl"}>No tables specified</Text>
        </View>
      </NativeBaseProvider>
    );
  }

  return (
    <NativeBaseProvider theme={openScoreboardTheme}>
      <View flex={1} width="100%" height="100%">
        <FlatList
          width={"100%"}
          maxW={600}
          alignSelf="center"
          data={tableIDs}
          renderItem={({ item }) => <TableScoreCard tableID={item} />}
        />
      </View>
    </NativeBaseProvider>
  );
}
