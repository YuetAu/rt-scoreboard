import { GAME_STAGES, GAME_STAGES_TEXT, GAME_STAGES_TIME } from "@/common/gameStages";
import { FirebaseDatabase } from "@/firebase/config";
import FloatBox from "@/props/display/FloatBox";
import { Box, Button, Flex, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import { ref, child, set, get, update, onValue } from "firebase/database";
import { generateSlug } from "random-word-slugs";
import { useEffect, useRef, useState } from "react";

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

                    onValue(child(dbRef, `games/${gameID}/props/scores`), (snapshot) => {
                        const newScores = snapshot.val();
                        if (newScores) {
                            setRedTeamPoints(newScores.red);
                            setBlueTeamPoints(newScores.blue);
                            if (newScores.redGreatVictory) {
                                setGreatVictory("red");
                            } else if (newScores.blueGreatVictory) {
                                setGreatVictory("blue");
                            } else {
                                setGreatVictory("");
                            }
                        }
                    });
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

    // Game Scores
    const [redTeamPoints, setRedTeamPoints] = useState(0);
    const [blueTeamPoints, setBlueTeamPoints] = useState(0);
    const [greatVictory, setGreatVictory] = useState("");

    return (
        <>
        <Box>
                <FloatBox 
                    timeText={clockText} 
                    redTeamPoints={redTeamPoints} 
                    blueTeamPoints={blueTeamPoints} 
                    gameStage={GAME_STAGES_TEXT[GAME_STAGES.indexOf(gameStage.current)]}
                    greatVictory={greatVictory}
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