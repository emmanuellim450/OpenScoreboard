import React, { useEffect, useRef, useState } from 'react';
import { Button, View, Modal, AddIcon, FormControl, Input, Text, Spinner, FlatList, Divider, Checkbox } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { addNewTeam, getTeam, updateMyTeam, updateTeam } from '../functions/teams';
import { newImportedPlayer } from '../classes/Player';
import { newTeam } from '../classes/Team';
import { v4 as uuidv4 } from 'uuid';
import { TeamPlayerItem } from '../listitems/TeamPlayerItem';
import { getMyPlayerLists, getImportPlayerList, sortPlayers } from '../functions/players';
import i18n from '../translations/translate';

export function NewTeamModal(props) {

    let [loadingNewTeam, setLoadingNewTeam] = useState(false);
    let [loadingEditTeam, setLoadingEditTeam] = useState(false);

    let [teamName, setTeamName] = useState("");
    let [teamLogoURL, setTeamLogoURL] = useState("");
    let [players, setPlayers] = useState({});

    let editingTeam = useRef({});

    let [showAddPlayer, setShowAddPlayer] = useState(false);

    let [firstName, setFirstName] = useState("");
    let [lastName, setLastName] = useState("");
    let [imageURL, setImageURL] = useState("");

    let [addPlayerMode, setAddPlayerMode] = useState<'manual' | 'import'>('manual');
    let [myPlayerLists, setMyPlayerLists] = useState([]);
    let [selectedListID, setSelectedListID] = useState("");
    let [importedPlayers, setImportedPlayers] = useState([]);
    let [searchText, setSearchText] = useState("");
    let [loadingList, setLoadingList] = useState(false);
    let [loadingPlayers, setLoadingPlayers] = useState(false);
    let [selectedImportPlayers, setSelectedImportPlayers] = useState<Record<string, boolean>>({});
    let [listLoaded, setListLoaded] = useState(false);

    let teamNameRef = useRef()
    let firstNameRef = useRef()

    const onAddTeam = async () => {
        if (props.isEditingTeam) {
            setLoadingNewTeam(true);
            await updateTeam(props.editingTeamID, { ...editingTeam.current, teamName: teamName, teamLogoURL: teamLogoURL, players: JSON.parse(JSON.stringify(players)) });
            await updateMyTeam(props.editingMyTeamID, teamName, teamLogoURL);
            setLoadingNewTeam(false);

            props.onClose();
        }
        else {
            setLoadingNewTeam(true);
            let formattedTeam = newTeam(teamName, teamLogoURL, players);
            await addNewTeam(formattedTeam);
            props.onClose();

            setLoadingNewTeam(false);
        }

    }

    useEffect(() => {
        async function loadEditTeam(teamID) {
            if (props.isEditingTeam) {
                setLoadingEditTeam(true);
                let team = await getTeam(teamID);
                editingTeam.current = team;
                const { teamName, teamLogoURL, players } = team;
                setTeamName(teamName);
                setTeamLogoURL(teamLogoURL || "");
                setPlayers(players);
                setLoadingEditTeam(false);
            }
            else {
                setTeamName("");
                setLoadingEditTeam(false);
                setTeamLogoURL("");
                setPlayers({});
                editingTeam.current = null;
            }
        }
        loadEditTeam(props.editingTeamID);

    }, [props.isEditingTeam]);

    useEffect(() => {
        setTimeout(() => {
            document.getElementById(teamNameRef.current.id).focus()
        }, 200);


    }, [])

    useEffect(() => {
        setTimeout(() => {
            if (showAddPlayer && addPlayerMode === 'manual') {
                document.getElementById(firstNameRef.current.id).focus()
            }
        }, 200);

    }, [showAddPlayer, addPlayerMode])

    useEffect(() => {
        async function loadLists() {
            setLoadingList(true);
            let lists = await getMyPlayerLists();
            setMyPlayerLists(lists);
            setLoadingList(false);
            setListLoaded(true);
        }
        if (showAddPlayer && addPlayerMode === 'import') {
            loadLists();
        }
    }, [showAddPlayer, addPlayerMode]);

    async function loadPlayersFromList(listID: string) {
        if (!listID) return;
        setLoadingPlayers(true);
        setSelectedImportPlayers({});
        let players = await getImportPlayerList(listID);
        setImportedPlayers(sortPlayers(players));
        setLoadingPlayers(false);
    }

    function addPlayerToTeam(player) {
        setPlayers(prev => ({ ...prev, [uuidv4()]: newImportedPlayer(player.firstName, player.lastName, player.imageURL, player.country || "") }));
    }

    return (
        <Modal

            onClose={() => {
                props.onClose(false);
                setShowAddPlayer(false);
            }} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{showAddPlayer ? i18n.t("addTeamPlayer") : i18n.t("newTeam")}</Modal.Header>
                <Modal.Body>
                    {showAddPlayer ?
                        <>
                            <View flexDir={"row"} flexWrap={"wrap"}>
                                <View padding={1} flex={1}>
                                    <Button
                                        onPress={() => setAddPlayerMode('manual')}
                                        variant={addPlayerMode === 'manual' ? 'solid' : 'outline'}
                                    >
                                        <Text color={addPlayerMode === 'manual' ? openScoreboardButtonTextColor : openScoreboardColor}>{i18n.t("manual")}</Text>
                                    </Button>
                                </View>
                                <View padding={1} flex={1}>
                                    <Button
                                        onPress={() => setAddPlayerMode('import')}
                                        variant={addPlayerMode === 'import' ? 'solid' : 'outline'}
                                    >
                                        <Text color={addPlayerMode === 'import' ? openScoreboardButtonTextColor : openScoreboardColor}>{i18n.t("importFromList")}</Text>
                                    </Button>
                                </View>
                            </View>
                            {addPlayerMode === 'manual' ?
                                <FormControl>
                                    <FormControl.Label>{i18n.t("firstName")}<Text color={"red"}>*</Text></FormControl.Label>
                                    <Input ref={firstNameRef} value={firstName} onChangeText={setFirstName}></Input>
                                    <FormControl.Label>{i18n.t("lastName")}</FormControl.Label>
                                    <Input value={lastName} onChangeText={setLastName}></Input>
                                    <FormControl.Label>{i18n.t("imageURL")}</FormControl.Label>
                                    <Input value={imageURL} onChangeText={setImageURL}></Input>

                                    <View flexDir={"row"}>
                                        <View padding={1} flex={1}>
                                            <Button
                                                onPress={async () => {
                                                    setPlayers(prev => ({ ...prev, [uuidv4()]: newImportedPlayer(firstName, lastName, imageURL, "") }));
                                                    setShowAddPlayer(false);
                                                    setFirstName("");
                                                    setLastName("");
                                                    setImageURL("")
                                                }}
                                            >
                                                <Text color={openScoreboardButtonTextColor}>{i18n.t("add")}</Text>
                                            </Button>
                                        </View>
                                        <View padding={1} flex={1}>
                                            <Button variant={"outline"}
                                                onPress={async () => {
                                                    setShowAddPlayer(false);
                                                    setFirstName("");
                                                    setLastName("");
                                                    setImageURL("")
                                                }}
                                            >
                                                <Text color={openScoreboardColor}>{i18n.t("back")}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </FormControl>
                                :
                                <FormControl>
                                    <FormControl.Label>{i18n.t("selectPlayerList")}</FormControl.Label>
                                    {loadingList ?
                                        <Spinner></Spinner>
                                        :
                                        <>
                                            <View>
                                                {myPlayerLists.map((list) => {
                                                    let listID = list[1].id;
                                                    let listName = list[1].playerListName;
                                                    return (
                                                        <View key={listID} paddingY={1}>
                                                            <Button
                                                                variant={selectedListID === listID ? 'solid' : 'outline'}
                                                                onPress={() => {
                                                                    setSelectedListID(listID);
                                                                    loadPlayersFromList(listID);
                                                                    setSearchText("");
                                                                }}
                                                            >
                                                                <Text color={selectedListID === listID ? openScoreboardButtonTextColor : openScoreboardColor}>{listName}</Text>
                                                            </Button>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                            {selectedListID && (
                                                <>
                                                    <FormControl.Label>{i18n.t("searchPlayerName")}</FormControl.Label>
                                                    <Input
                                                        placeholder={i18n.t("searchPlayerName")}
                                                        value={searchText}
                                                        onChangeText={setSearchText}
                                                    ></Input>
                                                    <Divider></Divider>
                                                    {loadingPlayers ?
                                                        <Spinner></Spinner>
                                                        :
                                                        <FlatList
                                                            maxHeight={300}
                                                            data={importedPlayers.filter((item) => {
                                                                let fullName = (item[1].firstName + " " + item[1].lastName).toLowerCase();
                                                                return fullName.includes(searchText.toLowerCase());
                                                            })}
                                                            keyExtractor={(item) => item[0]}
                                                            renderItem={({ item }) => {
                                                                let player = item[1];
                                                                let playerID = item[0];
                                                                let isSelected = selectedImportPlayers[playerID] || false;
                                                                return (
                                                                    <Checkbox
                                                                        value={playerID}
                                                                        isChecked={isSelected}
                                                                        onChange={() => {
                                                                            setSelectedImportPlayers({
                                                                                ...selectedImportPlayers,
                                                                                [playerID]: !isSelected
                                                                            });
                                                                        }}
                                                                        marginY={1}
                                                                    >
                                                                        <Text paddingLeft={1}>{player.firstName} {player.lastName}</Text>
                                                                    </Checkbox>
                                                                );
                                                            }}
                                                        ></FlatList>
                                                    }
                                                    {Object.keys(selectedImportPlayers).filter(k => selectedImportPlayers[k]).length > 0 && (
                                                        <View flexDir={"row"} paddingY={2}>
                                                            <View padding={1} flex={1}>
                                                                <Button
                                                                    onPress={() => {
                                                                        for (const pid of Object.keys(selectedImportPlayers)) {
                                                                            if (selectedImportPlayers[pid]) {
                                                                                let playerData = importedPlayers.find(([id]) => id === pid);
                                                                                if (playerData) {
                                                                                    addPlayerToTeam(playerData[1]);
                                                                                }
                                                                            }
                                                                        }
                                                                        setShowAddPlayer(false);
                                                                        setSelectedImportPlayers({});
                                                                    }}
                                                                >
                                                                    <Text color={openScoreboardButtonTextColor}>
                                                                        {i18n.t("add")} ({Object.keys(selectedImportPlayers).filter(k => selectedImportPlayers[k]).length})
                                                                    </Text>
                                                                </Button>
                                                            </View>
                                                            <View padding={1} flex={1}>
                                                                <Button variant={"outline"}
                                                                    onPress={() => {
                                                                        setShowAddPlayer(false);
                                                                        setSelectedImportPlayers({});
                                                                    }}
                                                                >
                                                                    <Text color={openScoreboardColor}>{i18n.t("back")}</Text>
                                                                </Button>
                                                            </View>
                                                        </View>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    }
                                </FormControl>
                            }
                        </> :
                        <FormControl>
                            <FormControl.Label>{i18n.t("teamName")}</FormControl.Label>
                            <Input
                                onSubmitEditing={(event) => {
                                    if (!showAddPlayer && teamName.length > 0) {
                                        onAddTeam()
                                    }
                                }}
                                ref={teamNameRef} value={teamName} onChangeText={setTeamName}></Input>
                            <FormControl.Label>{i18n.t("teamLogoURL")}</FormControl.Label>
                            <Input value={teamLogoURL} onChangeText={setTeamLogoURL}></Input>
                            <FormControl.Label>{i18n.t("players")}</FormControl.Label>
                            {players && Object.entries(players).map((player, index) => {
                                return (
                                    <View key={player[0]}>
                                        <TeamPlayerItem
                                            onUpdate={(id, player) => {
                                                let newPlayerList = { ...players, [id]: player };
                                                setPlayers(newPlayerList);
                                            }}
                                            onSave={(player) => {
                                                setPlayers(prev => ({ ...prev, [uuidv4()]: player }));
                                            }}
                                            onDelete={(id) => {
                                                let newPlayerList = { ...players };
                                                delete newPlayerList[id]
                                                setPlayers(newPlayerList);
                                            }}
                                            id={player[0]} {...player[1]}></TeamPlayerItem>
                                    </View>
                                );
                            })}
                            <Button
                                onPress={() => {
                                    setAddPlayerMode('manual');
                                    setShowAddPlayer(true);
                                }}
                            >
                                <AddIcon color={openScoreboardButtonTextColor}></AddIcon>
                            </Button>
                        </FormControl>
                    }

                </Modal.Body>
                <Modal.Footer>
                    <View padding={1}>
                        <Button disabled={showAddPlayer}
                            onPress={async () => {
                                if (props.isEditingTeam) {
                                    setLoadingNewTeam(true);
                                    await updateTeam(props.editingTeamID, { ...editingTeam.current, teamName: teamName, teamLogoURL: teamLogoURL, players: JSON.parse(JSON.stringify(players)) });
                                    await updateMyTeam(props.editingMyTeamID, teamName, teamLogoURL);
                                    setLoadingNewTeam(false);

                                    props.onClose();
                                }
                                else {
                                    setLoadingNewTeam(true);
                                    let formattedTeam = newTeam(teamName, teamLogoURL, players);
                                    await addNewTeam(formattedTeam);
                                    props.onClose();

                                    setLoadingNewTeam(false);
                                }

                            }}
                        >
                            {loadingNewTeam ?
                                <Spinner></Spinner>
                                :
                                <Text color={openScoreboardButtonTextColor}>{props.isEditingTeam ? i18n.t("save") : i18n.t("add")}</Text>}

                        </Button>
                    </View>
                    <View padding={1}>
                        <Button

                            variant={"ghost"}
                            onPress={() => {
                                setShowAddPlayer(false);
                                props.onClose(false);
                            }}
                        ><Text>{i18n.t("close")}</Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
