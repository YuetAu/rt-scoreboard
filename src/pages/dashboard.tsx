import { GAME_STAGES, GAME_STAGES_TIME } from "@/common/gameStages";
import { FirebaseDatabase } from "@/firebase/config";
import { Box, Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import { ref, child, set, get, update, onValue } from "firebase/database";
import { generateSlug } from "random-word-slugs";
import { useEffect, useRef, useState } from "react";
import { useTimer } from "react-timer-and-stopwatch";

export default function Dashboard() {

    const dbRef = ref(FirebaseDatabase);

    const [gameID, setGameID] = useState("");
    const [deviceID, setDeviceID] = useState("");
    const [gameStage, setGameStage] = useState("PREP");
    const grandClock = useRef(false);
    const gameFetchLock = useRef(false);
    const clockElapse = useRef(0);
    const clockToggle = useRef(false);
    const forceNextStage = useRef(false);

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
                    setClock(gameData.clock);
                    onValue(child(dbRef, `games/${gameID}/clock`), (snapshot) => {
                        const clockData = snapshot.val();
                        if (clockData) {
                            setClock(clockData);
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

    useEffect(() => {
        if (timer.timerIsFinished || forceNextStage.current) {
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
            if (grandClock.current || forceNextStage.current) {
                set(child(dbRef, `games/${gameID}/clock`), {
                    stage: gameStage,
                    timestamp: Date.now(),
                    elapsed: 0,
                    paused: false
                })
            }
            if (gameStage === "END") {
                clockToggle.current = false;
            }
            forceNextStage.current = false;
        }
    }, [gameStage])

    const createGame = () => {
        const newGameID = generateSlug(2);
        grandClock.current = true;
        const newDeviceID = generateSlug(2)
        set(child(dbRef, `games/${newGameID}`), {
            createdAt: Date.now(),
            device: { [newDeviceID]: "DISPLAY" },
            clock: { stage: "PREP", timestamp: 0, elapsed: 0 }
        });
        setGameID(newGameID);
        setGameIDModal(false);
    };

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

    const setClock = (clockData: any) => {
        if (clockData.timestamp != 0) {
            console.log("Updating Clock")
            setGameStage(clockData.stage);
            clockToggle.current = !clockData.paused;
            clockElapse.current = clockData.elapsed;
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

    const toggleClock = () => {
        if (clockToggle.current) {
            stopClock();
            clockToggle.current = false;
        } else {
            startClock();
            clockToggle.current = true;
        }
    }

    const resetStage = () => {
        timer.resetTimer({
            create: {
                timerWithDuration: {
                    time: {
                        seconds: GAME_STAGES_TIME[GAME_STAGES.indexOf(gameStage)],
                    }
                }
            },
            autoplay: false
        });
        set(child(dbRef, `games/${gameID}/clock`), {
            stage: gameStage,
            timestamp: Date.now(),
            elapsed: 0,
            paused: true
        })
    }

    const changeStage = (skipStage:number) => {
        if (GAME_STAGES.indexOf(gameStage)+skipStage < 0 ) return;
        if (GAME_STAGES.indexOf(gameStage)+skipStage > GAME_STAGES.length-1 ) return;
        const index = GAME_STAGES.indexOf(gameStage);
        const nextStage = GAME_STAGES[index+skipStage];
        forceNextStage.current = true;
        setGameStage(nextStage);
    }

    const gameIDInput = useRef<HTMLInputElement>(null);
    const [gameIDModal, setGameIDModal] = useState(true);

    const submitGameID = () => {
        if (gameIDInput.current) {
            console.log("Game ID: "+gameIDInput.current.value);
            setDeviceID(generateSlug(2));
            setGameID(gameIDInput.current.value);
            setGameIDModal(false);
        }
    }

    const [containerHeight, setContainerHeight] = useState(0);
    const heightEventListner = useRef(false);

    useEffect(() => {
        if (!heightEventListner.current) {
            const handleResize = () => {
                setContainerHeight(window.innerHeight);
            }
            handleResize();
            window.addEventListener('resize', handleResize);
            heightEventListner.current = true;
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [])

    return (
        <>
        <Box style={{
            height: containerHeight,
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            //overflow: 'hidden',
        }}>
                
        </Box>
        {/* <Box>
            <h1>Game ID: {gameID}</h1>
            <h1>Device ID: {deviceID}</h1>
            <h1>Game Stage: {gameStage}</h1>
            <h1>Time Left: {timer.timerText}</h1>
            <Button onClick={toggleClock}>Toggle Timer</Button>
            <Button onClick={resetStage}>Reset Timer</Button>
            <Button onClick={()=>changeStage(1)}>Next Stage</Button>
            <Button onClick={()=>changeStage(-1)}>Previous Stage</Button>
        </Box> */}
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
                <Button colorScheme='green' mr={3} onClick={createGame}>
                Create Game
                </Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
        </>
    )
}