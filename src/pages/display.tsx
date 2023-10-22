import { FirebaseDatabase } from "@/firebase/config";
import { Box } from "@chakra-ui/react";
import { ref, onValue, get, child, set, update } from "firebase/database";
import { generateSlug } from "random-word-slugs";
import { useEffect, useRef, useState } from "react";


export default function Display() {

    const dbRef = ref(FirebaseDatabase);

    const initialRender = useRef(true);
    const [gameID, setGameID] = useState("");
    const [deviceID, setDeviceID] = useState("");
    const [gameStatus, setGameStatus] = useState("WAITING");
    const gameFetchLock = useRef(false);

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            const newGameID = generateSlug(2)
            setGameID(newGameID);
            const newDeviceID = generateSlug(2)
            setDeviceID(newDeviceID);
            console.log("Game ID: "+newGameID);
        }
    }, [initialRender]);

    const createGame = (gameID: string) => {
        set(child(dbRef, `games/${gameID}`), {
            createdAt: Date.now(),
            status: "WAITING",
            device: { [deviceID]: "DISPLAY" },
            grandClock: deviceID,
            clock: { stage: "WAIT", timestamp: 0, remaining: 0 }
            /* clockSkew: "",
            clockSkewArray: {}, */
        }).then(() => {
            // What a Grand Clock will do
            /* onValue(child(dbRef, `games/${gameID}/clockSkew`), (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setTimeout(() => {
                        var array = [];
                        get(child(dbRef, `games/${gameID}/clockSkewArray/${data}`)).then((snapshot) => {
                            const data = snapshot.val();
                            if (data) {
                                array = [...data];
                            }
                        })
                        set(child(dbRef, `games/${gameID}/clockSkewArray/${data}`), array.push(Date.now()));
                    }, 1000);
                }
            }); */
            onValue(child(dbRef, `games/${gameID}/device`), (snapshot) => {
                const deviceData = snapshot.val();
                if (deviceData) {
                    Object.keys(deviceData).forEach(key => {
                        const deviceType = deviceData[key];
                        if (deviceType === "CONTROLLER") {
                            console.log("Controller Connected: "+key);
                            get(child(dbRef, `games/${gameID}/status`)).then((snapshot) => {
                                const status = snapshot.val();
                                if (status === "WAITING") {
                                    update(child(dbRef, `games/${gameID}`), {
                                        status: "READY"
                                    });
                                }
                            });
                        }
                    });
                }
            });
            onValue(child(dbRef, `games/${gameID}/status`), (snapshot) => {
                const status = snapshot.val();
                if (status) {
                    setGameStatus(status);
                }
            });
            return true;
        }).catch((error) => {
            console.error(error);
            return false;
        });
        return false;
    };

    

    useEffect(() => {
        if (gameID && !gameFetchLock.current) {
            console.log("Fetching Game: "+gameID);
            get(child(dbRef, `games/${gameID}`)).then((snapshot) => {
                if (snapshot.exists()) {
                    console.log("Game Fetched");
                    setGameStatus(snapshot.val().status);
                } else {
                    console.log("Creating New Game");
                    createGame(gameID);
                }
            }).catch((error) => {
                console.error(error);
            }).finally(() => {
                gameFetchLock.current = false;
            });
        }
    }, [gameID])


    return (
        <Box>
            <h1>Game ID: {gameID}</h1>
            <h1>Device ID: {deviceID}</h1>
            <h1>Game Status: {gameStatus}</h1>
        </Box>
    )
}