import React, { useEffect, useRef, useState } from 'react';
import { Button, Text, View, Input, Modal, FormControl, ChevronLeftIcon, TextField, Spinner } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { addImportedPlayer, editImportedPlayer } from '../functions/players';
import { newImportedPlayer } from '../classes/Player';
import CountryFlagList from '../components/CountryFlagList';
import jsonFlags from '../flags/countries.json'
import { XMLParser } from 'fast-xml-parser';
import i18n from '../translations/translate';

const xmlParser = new XMLParser({ ignoreAttributes: true });

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

function validatePlayerRow(firstName: string, lastName: string, imageURL: string, country: string, rowLabel: string) {
    if (firstName.length > 60 || lastName.length > 60) {
        return `Error: ${rowLabel}: First name or last name exceeds 60 characters.`;
    }
    if (imageURL !== '' && !isValidImageUrl(imageURL)) {
        return `Error: ${rowLabel}: Image URL is not valid.`;
    }
    const normalized = normalizeCountryCode(country);
    const validValues = Object.keys(jsonFlags);
    if (!validValues.includes(normalized)) {
        return `Error: ${rowLabel}: Country code "${country}" is not valid.`;
    }
    return true;
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

function parseXmlPlayers(xmlString: string) {
    const parsed = xmlParser.parse(xmlString);
    if (!parsed || !parsed.players || !parsed.players.player) {
        return { error: i18n.t("invalidXml") };
    }
    let players = parsed.players.player;
    if (!Array.isArray(players)) {
        players = [players];
    }
    const result: { firstName: string; lastName: string; imageURL: string; country: string }[] = [];
    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const firstName = (p.firstName || "").trim();
        const lastName = (p.lastName || "").trim();
        const imageURL = (p.imageURL || "").trim();
        const country = (p.country || "").trim();
        const validation = validatePlayerRow(firstName, lastName, imageURL, country, `Player ${i + 1}`);
        if (validation !== true) {
            return { error: validation };
        }
        result.push({ firstName, lastName, imageURL, country: normalizeCountryCode(country) });
    }
    return { players: result };
}

export function AddNewPlayerModal(props) {

    let [firstName, setFirstName] = useState("");
    let [lastName, setLastName] = useState("");
    let [imageURL, setImageURL] = useState("");
    let [country, setCountry] = useState("");
    let [allCountries, setAllCountries] = useState({});
    let [importMethod, setImportMethod] = useState<'single' | 'csv' | 'xml' | 'sheets'>('single')

    let [showCountrySelection, setShowCountrySelection] = useState(false);

    let [csvValue, setCSVValue] = useState("")
    let [doneLoading, setDoneLoading] = useState(false)
    let [myPlayerLists, setMyPlayerLists] = useState([])
    let [selectedPlayerListID, setSelectedPlayerListID] = useState("")
    let [loadingPlayers, setLoadingPlayers] = useState(false)
    let [csvError, setCSVError] = useState("")

    let [xmlFile, setXmlFile] = useState<File | null>(null)
    let [xmlContent, setXmlContent] = useState("")
    let [xmlError, setXmlError] = useState("")

    let [sheetsUrl, setSheetsUrl] = useState("")
    let [sheetsError, setSheetsError] = useState("")
    let [sheetsLoading, setSheetsLoading] = useState(false)

    let fileInputRef = useRef<HTMLInputElement>(null)

    const onAddPressed = async () => {
        if (props.isEditing) {
            let player = newImportedPlayer(firstName, lastName, imageURL, country);
            await editImportedPlayer(props.route.params.playerListID, props.id, player);
            props.onClose();
            props.onConfirmEdit(
                {
                    ...player,
                    id: props.id
                }
            );
            resetPlayerFields();
        }
        else {
            if (importMethod === 'csv') {
                let result = await onBulkSubmit()
                if (typeof result === 'string') return;
                for (const p of result) {
                    props.onConfirmAdd(p);
                }
                props.onClose();
                resetPlayerFields();
            }
            else if (importMethod === 'xml') {
                let result = await onXmlSubmit()
                if (typeof result === 'string') return;
                for (const p of result) {
                    props.onConfirmAdd(p);
                }
                props.onClose();
                resetPlayerFields();
            }
            else if (importMethod === 'sheets') {
                let result = await onSheetsSubmit()
                if (typeof result === 'string') return;
                for (const p of result) {
                    props.onConfirmAdd(p);
                }
                props.onClose();
                resetPlayerFields();
            }
            else {
                let newPlayer = newImportedPlayer(firstName, lastName, imageURL, country);
                let playerID = await addImportedPlayer(props.route.params.playerListID, newPlayer);
                props.onConfirmAdd({
                    ...newPlayer,
                    id: playerID
                });
                props.onClose();
                resetPlayerFields();
            }
        }
    }

    async function onBulkSubmit() {
        const csvValidation = validateCSV(csvValue)

        if (csvValidation === true) {
            const delimiter = detectDelimiter(csvValue);
            const rows = csvValue.split("\n");
            const added: { id: string; firstName: string; lastName: string; imageURL: string; country: string }[] = [];
            for (const row of rows) {
                const trimmed = row.trim();
                if (trimmed.length === 0) continue;
                const cols = splitRow(trimmed, delimiter);
                const player = newImportedPlayer(cols[0], cols[1], cols[2], normalizeCountryCode(cols[3]));
                const playerID = await addImportedPlayer(props.route.params.playerListID, player);
                added.push({ ...player, id: playerID });
            }
            return added;
        }
        else {
            setCSVError(csvValidation)
            return csvValidation
        }
    }

    async function onXmlSubmit() {
        if (!xmlContent) {
            setXmlError("No XML file loaded.");
            return "No XML file loaded.";
        }
        const result = parseXmlPlayers(xmlContent);
        if (result.error) {
            setXmlError(result.error);
            return result.error;
        }
        const added: { id: string; firstName: string; lastName: string; imageURL: string; country: string }[] = [];
        for (const player of result.players) {
            const p = newImportedPlayer(player.firstName, player.lastName, player.imageURL, player.country);
            const playerID = await addImportedPlayer(props.route.params.playerListID, p);
            added.push({ ...p, id: playerID });
        }
        return added;
    }

    async function onSheetsSubmit() {
        if (!sheetsUrl) {
            setSheetsError("Please enter a URL.");
            return "Please enter a URL.";
        }
        setSheetsLoading(true);
        setSheetsError("");
        try {
            const response = await fetch(sheetsUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const csvText = await response.text();
            const validation = validateCSV(csvText);
            if (validation !== true) {
                setSheetsError(validation);
                return validation;
            }
            const delimiter = detectDelimiter(csvText);
            const rows = csvText.split('\n');
            const added: { id: string; firstName: string; lastName: string; imageURL: string; country: string }[] = [];
            for (const row of rows) {
                const trimmed = row.trim();
                if (trimmed.length === 0) continue;
                const cols = splitRow(trimmed, delimiter);
                const player = newImportedPlayer(cols[0], cols[1], cols[2], normalizeCountryCode(cols[3]));
                const playerID = await addImportedPlayer(props.route.params.playerListID, player);
                added.push({ ...player, id: playerID });
            }
            return added;
        } catch (e) {
            const msg = i18n.t("fetchError");
            setSheetsError(msg);
            return msg;
        } finally {
            setSheetsLoading(false);
        }
    }

    function handleXmlFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setXmlFile(file);
        setXmlError("");
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setXmlContent(text);
            const result = parseXmlPlayers(text);
            if (result.error) {
                setXmlError(result.error);
            }
        };
        reader.readAsText(file);
    }

    let playerFirstName = useRef()

    function canSubmit() {
        if (importMethod === 'csv') {
            return true
        }
        else if (importMethod === 'xml') {
            return xmlContent.length > 0
        }
        else if (importMethod === 'sheets') {
            return sheetsUrl.length > 0 && !sheetsLoading
        }
        else {
            if (firstName && firstName.length > 0) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    useEffect(() => {
        async function getCountryNames() {
            let flagList = jsonFlags;
            setAllCountries(flagList);
        }
        getCountryNames();

    }, []);

    const resetPlayerFields = () => {
        setFirstName("");
        setLastName("");
        setImageURL("");
        setCountry("");
        setCSVValue("");
        setXmlFile(null);
        setXmlContent("");
        setXmlError("");
        setSheetsUrl("");
        setSheetsError("");
    };

    useEffect(() => {
        setTimeout(() => {
            if (playerFirstName.current && playerFirstName.current.id) {
                document.getElementById(playerFirstName.current.id)?.focus()
            }
        }, 200);

    }, [])

    useEffect(() => {
        setFirstName(props.firstName || "");
        setLastName(props.lastName || "");
        setImageURL(props.imageURL || "");
        setCountry(props.country || "");
    }, [props.firstName, props.lastName, props.imageURL, props.country]);

    const tabMethods: { key: 'single' | 'csv' | 'xml' | 'sheets'; label: string }[] = [
        { key: 'single', label: i18n.t("single") },
        { key: 'csv', label: i18n.t("bulk") },
        { key: 'xml', label: i18n.t("xml") },
        { key: 'sheets', label: i18n.t("sheets") },
    ];

    return (
        <Modal isOpen={props.isOpen}
            onClose={() => {
                props.onClose();
            }}
        >
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{props.isEditing ? i18n.t("editPlayer") : i18n.t("addNewPlayer")}</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        {
                            props.isEditing ?
                                null
                                :
                                <View flexDir={"row"} flexWrap={"wrap"}>
                                    {tabMethods.map((tab) => (
                                        <View padding={1} flex={1} key={tab.key}>
                                            <Button
                                                onPress={() => {
                                                    setImportMethod(tab.key)
                                                    setCSVError("")
                                                    setXmlError("")
                                                    setSheetsError("")
                                                }}
                                                variant={importMethod === tab.key ? 'solid' : 'outline'}
                                            >
                                                <Text
                                                    color={importMethod === tab.key ? openScoreboardButtonTextColor : openScoreboardColor}
                                                >{tab.label}</Text>
                                            </Button>
                                        </View>
                                    ))}
                                </View>
                        }

                        {showCountrySelection ?
                            <>
                                <View>
                                    <Button padding={1} justifyContent={"flex-start"} variant={"ghost"} onPress={() => {
                                        setShowCountrySelection(false);
                                    }}>
                                        <View alignItems={"center"} flexDirection={"row"}>
                                            <ChevronLeftIcon></ChevronLeftIcon>
                                            <Text>{i18n.t("back")}</Text>
                                        </View>
                                    </Button>
                                </View>
                                <CountryFlagList onSelection={(countryCode) => {
                                    setCountry(countryCode);
                                    setShowCountrySelection(false);
                                }}></CountryFlagList>
                            </>
                            :
                            <>
                                {importMethod === 'csv' ?
                                    <>
                                        <FormControl isInvalid={csvError.length > 0}>
                                            <FormControl.Label>{i18n.t("csvOrder")}</FormControl.Label>
                                            <FormControl.ErrorMessage>{csvError}</FormControl.ErrorMessage>
                                            <TextField
                                                multiline
                                                placeholder="Paste CSV Values"
                                                onChangeText={(text) => {
                                                    setCSVValue(text)
                                                }}
                                            ></TextField>
                                        </FormControl>
                                    </>
                                    : importMethod === 'xml' ?
                                        <>
                                            <FormControl isInvalid={xmlError.length > 0}>
                                                <FormControl.Label>{i18n.t("xmlOrder")}</FormControl.Label>
                                                <FormControl.ErrorMessage>{xmlError}</FormControl.ErrorMessage>
                                                <Text fontSize="sm" color="gray.500">{i18n.t("xmlHint")}</Text>
                                                <View paddingY={2}>
                                                    <Button onPress={() => fileInputRef.current?.click()}>
                                                        <Text color={openScoreboardButtonTextColor}>{i18n.t("selectXmlFile")}</Text>
                                                    </Button>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept=".xml"
                                                        style={{ display: 'none' }}
                                                        onChange={handleXmlFileSelected}
                                                    />
                                                    {xmlFile && (
                                                        <Text fontSize="sm" paddingTop={1}>
                                                            {i18n.t("xmlSelected")}{xmlFile.name}
                                                        </Text>
                                                    )}
                                                </View>
                                            </FormControl>
                                        </>
                                    : importMethod === 'sheets' ?
                                        <>
                                            <FormControl isInvalid={sheetsError.length > 0}>
                                                <FormControl.Label>{i18n.t("sheetsUrl")}</FormControl.Label>
                                                <FormControl.ErrorMessage>{sheetsError}</FormControl.ErrorMessage>
                                                <Text fontSize="sm" color="gray.500">{i18n.t("sheetsHint")}</Text>
                                                <Input
                                                    value={sheetsUrl}
                                                    onChangeText={(text) => {
                                                        setSheetsUrl(text)
                                                        setSheetsError("")
                                                    }}
                                                    placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                                                ></Input>
                                            </FormControl>
                                        </>
                                    : <>
                                        <FormControl.Label>
                                            {i18n.t("firstName")}
                                        </FormControl.Label>
                                        <Input ref={playerFirstName} value={firstName}
                                            onChangeText={(text) => {
                                                setFirstName(text);
                                            }}
                                        ></Input>

                                        <FormControl.Label>
                                            {i18n.t("lastName")}
                                        </FormControl.Label>
                                        <Input value={lastName}
                                            onChangeText={(text) => {
                                                setLastName(text);
                                            }}
                                        ></Input>

                                        <FormControl.Label>
                                            {i18n.t("imageURL")}
                                        </FormControl.Label>
                                        <Input value={imageURL}
                                            onChangeText={(text) => {
                                                setImageURL(text);
                                            }}
                                        ></Input>
                                        <FormControl.Label>
                                            {i18n.t("country")}
                                        </FormControl.Label>
                                        <Button onPress={() => {
                                            setShowCountrySelection(true);
                                        }}>
                                            <Text color={openScoreboardButtonTextColor}>{country.length > 0 ? allCountries[country.toUpperCase()] : "Select Country"}</Text>
                                        </Button>
                                    </>
                                }
                            </>}

                    </FormControl>
                </Modal.Body>
                <Modal.Footer>
                    <View>
                        <Button disabled={!canSubmit() || sheetsLoading}
                            onPress={onAddPressed}
                        >
                            {sheetsLoading ?
                                <Spinner color={openScoreboardButtonTextColor}></Spinner> :
                                <Text color={openScoreboardButtonTextColor}>{props.isEditing ? i18n.t("update") : i18n.t("add")}</Text>
                            }
                        </Button>
                    </View>
                    <View>
                        <Button variant={"ghost"}
                            onPress={() => {
                                props.onClose();
                            }}
                        >
                            <Text>{i18n.t("close")}</Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
