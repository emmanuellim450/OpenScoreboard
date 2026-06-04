import { Button, FormControl, NativeBaseProvider, TextField, View, Text, Select, Spinner } from "native-base";
import { useState, useEffect } from "react";
import { newImportedPlayer } from "./classes/Player";
import jsonFlags from './flags/countries.json'
import { addImportedPlayer, getMyPlayerLists } from "./functions/players";
import LoadingPage from "./LoadingPage";
import i18n from "./translations/translate";

function buildCountryNameToCodeMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const [code, name] of Object.entries(jsonFlags)) {
        map[name.toLowerCase()] = code;
    }
    map["usa"] = "US";
    map["u.s.a."] = "US";
    map["america"] = "US";
    map["united states"] = "US";
    map["united states of america"] = "US";
    map["uk"] = "GB";
    map["u.k."] = "GB";
    map["united kingdom"] = "GB";
    map["uae"] = "AE";
    map["united arab emirates"] = "AE";
    return map;
}

const countryNameToCode = buildCountryNameToCodeMap();

function normalizeCountryCode(input: string): string {
    const trimmed = input.trim().toUpperCase();
    const validCodes = Object.keys(jsonFlags);
    if (validCodes.includes(trimmed)) {
        return trimmed;
    }
    const mapped = countryNameToCode[input.trim().toLowerCase()];
    if (mapped) {
        return mapped;
    }
    return input.trim();
}

function detectDelimiter(text: string): string {
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.includes('\t')) {
            return '\t';
        }
    }
    return ',';
}

function splitRow(row: string, delimiter: string): string[] {
    return row.split(delimiter).map(s => s.trim());
}

function validateCSV(csvString: string) {
    const rows = csvString.split('\n');
    const delimiter = detectDelimiter(csvString);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i].trim();
        if (row.length === 0) continue;

        const columns = splitRow(row, delimiter);

        if (columns.length !== 4) {
            return `Error: Row ${i + 1} does not have exactly 4 columns.`;
        }

        if (columns[0].length > 60 || columns[1].length > 60) {
            return `Error: Row ${i + 1}, Column 1 or Column 2 has length greater than 60.`;
        }

        if (columns[2] !== '' && !isValidImageUrl(columns[2])) {
            return `Error: Row ${i + 1}, Column 3 should be either blank or a valid image URL.`;
        }

        const normalized = normalizeCountryCode(columns[3]);
        const validValues = Object.keys(jsonFlags);
        if (!validValues.includes(normalized)) {
            return `Error: Row ${i + 1}, Column 4 does not have a valid value.`;
        }
    }

    return true;
}

function isValidImageUrl(url: string) {
    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
    return url === '' || url.match(urlRegex);
}



export default function BulkAddPlayer() {

    let [csvValue, setCSVValue] = useState("")
    let [doneLoading, setDoneLoading] = useState(false)
    let [myPlayerLists, setMyPlayerLists] = useState([])
    let [selectedPlayerListID, setSelectedPlayerListID] = useState("")
    let [loadingPlayers, setLoadingPlayers] = useState(false)

    async function loadPlayerLists() {
        setDoneLoading(false)
        let playerLists = await getMyPlayerLists()
        setMyPlayerLists(playerLists)
        setDoneLoading(true)
    }



    useEffect(() => {
        loadPlayerLists()
    }, [])

    async function onSubmit() {
        if (validateCSV(csvValue) === true) {
            const delimiter = detectDelimiter(csvValue);
            const rows = csvValue.split("\n");
            for (const row of rows) {
                const trimmed = row.trim();
                if (trimmed.length === 0) continue;
                const cols = splitRow(trimmed, delimiter);
                await addImportedPlayer(selectedPlayerListID, newImportedPlayer(cols[0], cols[1], cols[2], normalizeCountryCode(cols[3])));
            }
        }

    }

    return (
        <NativeBaseProvider>

            <View>
                <FormControl>
                    <FormControl.Label>{i18n.t("playerListID")}</FormControl.Label>
                    {
                        doneLoading ?
                            myPlayerLists.length > 0 ?
                                <FormControl>
                                    <FormControl.Label>{i18n.t("selectPlayerList")}</FormControl.Label>

                                    <Select onValueChange={(text) => {
                                        setSelectedPlayerListID(text)
                                    }} selectedValue={selectedPlayerListID}>
                                        {
                                            myPlayerLists.map((playerList) => {
                                                return (
                                                    <Select.Item key={playerList[1].id} label={playerList[1].playerListName} value={playerList[1].id} />
                                                )
                                            })
                                        }
                                    </Select>
                                </FormControl>
                                :
                                <Text>{i18n.t("noPlayerListsGoAdd")}</Text>
                            :
                            <LoadingPage></LoadingPage>
                    }

                    <FormControl.Label>{i18n.t("csvColumnOrder")}</FormControl.Label>
                    <TextField multiline
                        placeholder="CSV Values"
                        onChangeText={(text) => {
                            setCSVValue(text)
                        }}
                    ></TextField>
                </FormControl>

                <Button onPress={async () => {
                    if (selectedPlayerListID.length > 0 && !loadPlayerLists) {
                        setLoadingPlayers(true)
                        await onSubmit()
                        setLoadingPlayers(false)
                    }


                }}>
                    {
                        loadingPlayers ?
                            <Spinner></Spinner> :
                            <Text>{i18n.t("submit")}</Text>
                    }

                </Button>



            </View>
        </NativeBaseProvider>

    )
}

