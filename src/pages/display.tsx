import { GAME_STAGES, GAME_STAGES_TEXT, GAME_STAGES_TIME } from "@/common/gameStages";
import { FirebaseDatabase } from "@/firebase/config";
import FloatBox from "@/props/display/FloatBox";
import { Box, Button, Flex, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import { ref, child, set, get, update, onValue } from "firebase/database";
import { generateSlug } from "random-word-slugs";
import { useEffect, useRef, useState } from "react";
import { useTimer } from "react-timer-and-stopwatch";

export default function Display() {

    const dbRef = ref(FirebaseDatabase);

    const [gameID, setGameID] = useState("");
    const [deviceID, setDeviceID] = useState("");
    const gameStage = useRef("PREP");
    const clockData = useRef({ stage: "PREP", timestamp: 0, elapsed: 0, paused: true });
    const [clockText, setClockText] = useState({ minutes: "00", seconds: "00", milliseconds: "000" });
    const grandClock = useRef(false);
    const gameFetchLock = useRef(false);
    const clockElapse = useRef(0);
    const clockToggle = useRef(false);

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
                    gameStage.current = gameData.clock.stage;
                    clockElapse.current = gameData.clock.elapsed;
                    clockToggle.current = !gameData.clock.paused;
                    clockData.current = gameData.clock;
                    updateClockText();
                    onValue(child(dbRef, `games/${gameID}/clock`), (snapshot) => {
                        const newClockData = snapshot.val();
                        if (newClockData) {
                            gameStage.current = newClockData.stage;
                            clockElapse.current = newClockData.elapsed;
                            clockToggle.current = !newClockData.paused;
                            clockData.current = newClockData;
                            updateClockText();
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

    const updateClockText = () => {
        const remainingTime = clockData.current.paused ? (GAME_STAGES_TIME[GAME_STAGES.indexOf(gameStage.current)]*1000)-clockData.current.elapsed : (GAME_STAGES_TIME[GAME_STAGES.indexOf(gameStage.current)]*1000)-clockData.current.elapsed-(Date.now()-clockData.current.timestamp);
        if (remainingTime >= 0) { 
            const minutes = Math.floor(remainingTime/60000)+"";
            const seconds = Math.floor(remainingTime/1000%60)+"";
            const milliseconds = remainingTime%1000+"";
            setClockText({
                minutes: minutes.length < 2 ? "0"+minutes : minutes,
                seconds: seconds.length < 2 ? "0"+seconds : seconds,
                milliseconds: milliseconds.length < 3 ? milliseconds.length < 2 ? "00"+milliseconds : "0"+milliseconds : milliseconds
            })
            if (clockToggle.current) {
                setTimeout(() => {
                    updateClockText();
                }, 37);
            }
        } else {
            if (grandClock.current) {
                if (GAME_STAGES.indexOf(gameStage.current)+1 < GAME_STAGES.length) {
                    const newGameStage = GAME_STAGES[GAME_STAGES.indexOf(gameStage.current)+1];
                    console.log(`Resetting Timer for ${newGameStage}`);
                    const remainingTime = GAME_STAGES_TIME[GAME_STAGES.indexOf(newGameStage)]*1000;
                    clockData.current = { stage: newGameStage, timestamp: Date.now(), elapsed: 0, paused: remainingTime > 0 ? false : true };
                    updateClockText();
                    gameStage.current = newGameStage;
                    clockToggle.current = remainingTime > 0 ? true : false;
                    clockElapse.current = 0;
                    set(child(dbRef, `games/${gameID}/clock`), {
                        stage: newGameStage,
                        timestamp: Date.now(),
                        elapsed: 0,
                        paused: remainingTime > 0 ? false : true
                    })
                }
            }
        }
    }


    const createGame = () => {
        const newGameID = generateSlug(2);
        grandClock.current = true;
        const newDeviceID = generateSlug(2);
        setDeviceID(newDeviceID);
        set(child(dbRef, `games/${newGameID}`), {
            createdAt: Date.now(),
            device: {},
            clock: { stage: "PREP", timestamp: 0, elapsed: 0, paused: true }
        });
        setGameID(newGameID);
        setGameIDModal(false);
    };

    const startClock = () => {
        console.log("Clock Started")
        clockToggle.current = true;
        clockData.current = { stage: gameStage.current, elapsed: clockElapse.current, paused: false, timestamp: Date.now() };
        updateClockText();
        set(child(dbRef, `games/${gameID}/clock`), {
            stage: gameStage.current,
            timestamp: Date.now(),
            elapsed: clockElapse.current,
            paused: false
        })
    }

    const stopClock = () => {
        console.log("Clock Stopped")
        clockToggle.current = false;
        clockElapse.current += Date.now()-clockData.current.timestamp;
        clockData.current = { stage: gameStage.current, elapsed: clockElapse.current, paused: true, timestamp: Date.now() };
        updateClockText();
        set(child(dbRef, `games/${gameID}/clock`), {
            stage: gameStage.current,
            timestamp: Date.now(),
            elapsed: clockElapse.current,
            paused: true
        })
    }

    const toggleClock = () => {
        if (clockToggle.current) {
            stopClock();
        } else {
            startClock();
        }
    }

    const resetStage = () => {
        stopClock();
        console.log("Reset Stage Time")
        clockToggle.current = false;
        clockElapse.current = 0;
        clockData.current = { stage: gameStage.current, paused: true, elapsed: 0, timestamp: Date.now() };
        updateClockText();
        set(child(dbRef, `games/${gameID}/clock`), {
            stage: gameStage.current,
            timestamp: Date.now(),
            elapsed: 0,
            paused: true
        })
    }

    const changeStage = (skipStage:number) => {
        if (GAME_STAGES.indexOf(gameStage.current)+skipStage < 0 ) return;
        if (GAME_STAGES.indexOf(gameStage.current)+skipStage > GAME_STAGES.length-1 ) return;
        const index = GAME_STAGES.indexOf(gameStage.current);
        const nextStage = GAME_STAGES[index+skipStage];
        const remainingTime = GAME_STAGES_TIME[index+skipStage]*1000;
        gameStage.current = nextStage;
        clockToggle.current = remainingTime > 0 ? true : false;
        clockElapse.current = 0;
        clockData.current = { stage: nextStage, timestamp: Date.now(), elapsed: 0, paused: remainingTime > 0 ? false : true };
        updateClockText();
        set(child(dbRef, `games/${gameID}/clock`), {
            stage: nextStage,
            timestamp: Date.now(),
            elapsed: 0,
            paused: remainingTime > 0 ? false : true
        })
    }

    const gameIDInput = useRef<HTMLInputElement>(null);
    const [gameIDModal, setGameIDModal] = useState(true);

    const submitGameID = () => {
        if (gameIDInput.current) {
            console.log("Game ID: "+gameIDInput.current.value);
            setDeviceID(generateSlug(2));
            setGameID(gameIDInput.current.value);
            setGameIDModal(false);
            updateClockText();
        }
    }

    /* const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            setContainerHeight(window.innerHeight);
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []) */

    return (
        <>
        <Box style={{
            //height: containerHeight,
            //width: '20rem',
            //overflow: 'hidden',
        }}>
                <FloatBox 
                    timeText={clockText} 
                    redTeamPoints={0} 
                    blueTeamPoints={0} 
                    gameStage={GAME_STAGES_TEXT[GAME_STAGES.indexOf(gameStage.current)]}
                />
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
                <Button colorScheme='green' mr={3} onClick={createGame}>
                Create Game
                </Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
        </>
    )
}