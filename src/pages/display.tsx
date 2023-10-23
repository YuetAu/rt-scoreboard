import { GAME_STAGES, GAME_STAGES_TIME } from "@/common/gameStages";
import { FirebaseDatabase } from "@/firebase/config";
import { Box, Button } from "@chakra-ui/react";
import { ref, onValue, get, child, set, update } from "firebase/database";
import { generateSlug } from "random-word-slugs";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { useTimer } from "react-timer-and-stopwatch";

export default function Display() {

    const dbRef = ref(FirebaseDatabase);

    const initialRender = useRef(true);
    const [gameID, setGameID] = useState("");
    const [deviceID, setDeviceID] = useState("");
    const [gameStatus, setGameStatus] = useState("WAITING");
    const [gameStage, setGameStage] = useState("PREP");
    const gameFetchLock = useRef(false);
    const clockToggle = useRef(false);

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
            clock: { stage: "PREP", timestamp: 0, elapsed: 0 }
        }).then(() => {
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
                    const gameData = snapshot.val();
                    setGameStatus(gameData.status);
                    setGameStage(gameData.clock.stage);
                    setClock(gameData.clock)
                } else {
                    console.log("Creating New Game");
                    createGame(gameID);
                }
                onValue(child(dbRef, `games/${gameID}/status`), (snapshot) => {
                    const status = snapshot.val();
                    if (status) {
                        setGameStatus(status);
                    }
                });
                onValue(child(dbRef, `games/${gameID}/clock`), (snapshot) => {
                    const clockData = snapshot.val();
                    if (clockData) {
                        setClock(clockData);
                    }
                })
            }).catch((error) => {
                console.error(error);
            }).finally(() => {
                gameFetchLock.current = false;
            });
        }
    }, [gameID])

    const setClock = (clockData: any) => {
        if (clockData.timestamp != 0) {
            console.log("Updating Clock")
            setGameStage(clockData.stage);
            clockToggle.current = !clockData.paused;
            timer.resetTimer({
                create: {
                    timerWithDuration: {
                        time: {
                            milliseconds: clockData.paused ? (GAME_STAGES_TIME[GAME_STAGES.indexOf(clockData.stage)]*1000)-clockData.elapsed : (GAME_STAGES_TIME[GAME_STAGES.indexOf(clockData.stage)]*1000)-clockData.elapsed-(Date.now()-clockData.timestamp),
                        }
                    }
                },
                autoplay: clockData.paused ? false : true
            });
        }
    }
   
    const timer = useTimer({
        create: {
            timerWithDuration: {
                time: {
                    minutes: 1,
                }
            }
        },
        includeMilliseconds: true,
        intervalRate: 37,
        autoplay: false,
        callbacks: {
            onFinish: () => {
                const index = GAME_STAGES.indexOf(gameStage);
                const nextStage = GAME_STAGES[index+1];
                setGameStage(nextStage);
            },
        }
    });
    

    useEffect(() => {
        if (timer.timerIsFinished) {
            console.log(`Resetting Timer for ${gameStage}`);
            timer.resetTimer({
                create: {
                    timerWithDuration: {
                        time: {
                            minutes: GAME_STAGES_TIME[GAME_STAGES.indexOf(gameStage)],
                        }
                    }
                },
                autoplay: true
            });
        }
        set(child(dbRef, `games/${gameID}/clock`), {
            stage: gameStage,
            timestamp: Date.now(),
            elapsed: 0,
            paused: false
        })
        if (gameStage === "END") {
            clockToggle.current = false;
        }
    }, [gameStage])
    


    return (
        <Box>
            <h1>Game ID: {gameID}</h1>
            <h1>Device ID: {deviceID}</h1>
            <h1>Game Status: {gameStatus}</h1>
            <h1>Game Stage: {gameStage}</h1>
            <h1>Time Left: {timer.timerText}</h1>
        </Box>
    )
}