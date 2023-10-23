import { GAME_STAGES, GAME_STAGES_TIME } from "@/common/gameStages";
import { FirebaseDatabase } from "@/firebase/config";
import { Box, Button, FormControl, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spacer, VStack, useDisclosure } from "@chakra-ui/react";
import { time } from "console";
import { ref, push, child, set, remove, get, update, onValue } from "firebase/database";
import { generateSlug } from "random-word-slugs";
import { useEffect, useRef, useState } from "react";
import { useTimer } from "react-timer-and-stopwatch";

export default function Dashboard() {

    const dbRef = ref(FirebaseDatabase);

    /* const [pingRequest, setPingRequest] = useState(false);
    const pingLock = useRef(false);
    
    useEffect(() => {
        if (pingRequest && !pingLock.current) {
            pingLock.current = true;
            const pingID = push(child(dbRef, 'pings')).key;
            const timeNow = Date.now();
            set(child(dbRef, `pings/${pingID}`), {
                timestamp: timeNow
            })
            .then(() => {
                console.log("\nPing Request Sent\nWrite Time: "+(Date.now() - timeNow)+"ms");
            })
            .catch((error) => {
                console.error(error);
            });
            
            remove(child(dbRef, `pings/${pingID}`)).then(() => {
                console.log("Ping Request Removed");
            }).catch((error) => {
                console.error(error);
            }).finally(() => {
                pingLock.current = false;
            });
            setPingRequest(false);
        } else {
            console.log("Ping Request Blocked");
        }
    }, [pingRequest]) */

    const [gameID, setGameID] = useState("");
    const [deviceID, setDeviceID] = useState("");
    const [gameStatus, setGameStatus] = useState("WAITING");
    const [gameStage, setGameStage] = useState("PREP");
    const gameFetchLock = useRef(false);
    const clockElapse = useRef(0);

    useEffect(() => {
        if (gameID && !gameFetchLock.current) {
            console.log("Fetching Game: "+gameID);
            get(child(dbRef, `games/${gameID}`)).then((snapshot) => {
                const gameData = snapshot.val();
                if (gameData) {
                    update(child(dbRef, `games/${gameID}`), {
                        device: { ...gameData.device, [deviceID]: "CONTROLLER" },
                    });
                    console.log("Game Fetched");
                    onValue(child(dbRef, `games/${gameID}/status`), (snapshot) => {
                        const status = snapshot.val();
                        if (status) {
                            setGameStatus(status);
                        }
                    });
                    onValue(child(dbRef, `games/${gameID}/clock`), (snapshot) => {
                        const clockData = snapshot.val();
                        console.log(clockData);
                        if (clockData) {
                            if (clockData.timestamp != 0) {
                                console.log("Updating Clock")
                                setGameStage(clockData.stage);
                                clockElapse.current = clockData.elapsed;
                                timer.resetTimer({
                                    create: {
                                        timerWithDuration: {
                                            time: {
                                                milliseconds: (GAME_STAGES_TIME[GAME_STAGES.indexOf(clockData.stage)]*1000)-clockData.elapsed,
                                            }
                                        }
                                    },
                                    autoplay: clockData.paused ? false : true
                                });
                            }
                        }
                    })
                } else {
                    console.log("Game does not exist");
                    //Notify user
                }
            }).catch((error) => {
                console.error(error);
            }).finally(() => {
                gameFetchLock.current = false;
            });
        }
    }, [gameID])

    const gameIDInput = useRef<HTMLInputElement>(null);
    const [gameIDModal, setGameIDModal] = useState(true);

    const submitGameID = () => {
        if (gameIDInput.current) {
            console.log("Game ID: "+gameIDInput.current.value);
            setGameID(gameIDInput.current.value);
            const newDeviceID = generateSlug(2)
            setDeviceID(newDeviceID);
            setGameIDModal(false);
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
                            seconds: GAME_STAGES_TIME[GAME_STAGES.indexOf(gameStage)],
                        }
                    }
                },
                autoplay: true
            });
            set(child(dbRef, `games/${gameID}/clock`), {
                stage: gameStage,
                timestamp: Date.now(),
                elapsed: 0,
                paused: false
            })
            if (gameStage === "END") {
                clockToggle.current = false;
            }
        }
    }, [gameStage])

    

    const startClock = () => {
        console.log("Clock Started")
        timer.resumeTimer();
        set(child(dbRef, `games/${gameID}/clock`), {
            stage: gameStage,
            timestamp: Date.now(),
            elapsed: clockElapse.current,
            paused: false
        })
    }

    const stopClock = () => {
        console.log("Clock Stopped")
        timer.pauseTimer();
        clockElapse.current += timer.timeElapsed;
        set(child(dbRef, `games/${gameID}/clock`), {
            stage: gameStage,
            timestamp: Date.now(),
            elapsed: clockElapse.current,
            paused: true
        })
    }

    const clockToggle = useRef(false);

    const toggleClock = () => {
        if (clockToggle.current) {
            stopClock();
            clockToggle.current = false;
        } else {
            startClock();
            clockToggle.current = true;
        }
    }

    return (
        <>
        <Box>
            <h1>Game ID: {gameID}</h1>
            <h1>Device ID: {deviceID}</h1>
            <h1>Game Status: {gameStatus}</h1>
            <h1>Game Stage: {gameStage}</h1>
            <h1>Time Left: {timer.timerText}</h1>
            <Button onClick={toggleClock}>Toggle Timer</Button>
            <Button onClick={()=>timer.resetTimer()}>Reset Timer</Button>
        </Box>
        <Modal isOpen={gameIDModal} onClose={()=>{}} isCentered>
            <ModalOverlay />
            <ModalContent>
            <ModalHeader>Connect to Game Room</ModalHeader>
            <ModalBody>
                <Input placeholder="Game ID" ref={gameIDInput}/>
            </ModalBody>

            <ModalFooter>
                <Button colorScheme='blue' mr={3} onClick={submitGameID}>
                Submit
                </Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
        </>
    )
}