import { GAME_STAGES, GAME_STAGES_TIME } from "@/common/gameStages";
import { FirebaseDatabase } from "@/firebase/config";
import { Box, Button, Image, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import { ref, child, set, get, update, onValue } from "firebase/database";
import { generateSlug } from "random-word-slugs";
import { useEffect, useRef, useState } from "react";
import "@fontsource-variable/quicksand";
import TimerBox from "@/props/dashboard/TimerBox";
import { HoriztonalCounter, VerticalCounter } from "@/props/dashboard/Counter";

export default function Dashboard() {

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

                    setRedAutoRobotTask(gameData.props.redAutoRobotTask);
                    setBlueAutoRobotTask(gameData.props.blueAutoRobotTask);
                    setRedUpperSidePlantingZone(gameData.props.redUpperSidePlantingZone);
                    setRedLowerSidePlantingZone(gameData.props.redLowerSidePlantingZone);
                    setBlueUpperSidePlantingZone(gameData.props.blueUpperSidePlantingZone);
                    setBlueLowerSidePlantingZone(gameData.props.blueLowerSidePlantingZone);
                    setRedColouredPlantingZone(gameData.props.redColouredPlantingZone);
                    setBlueColouredPlantingZone(gameData.props.blueColouredPlantingZone);
                    setRedCenterPlantingZone(gameData.props.redCenterPlantingZone);
                    setBlueCenterPlantingZone(gameData.props.blueCenterPlantingZone);

                    onValue(child(dbRef, `games/${gameID}/props`), (snapshot) => {
                        const newPropsData = snapshot.val();
                        if (newPropsData) {
                            setRedAutoRobotTask(newPropsData.redAutoRobotTask);
                            setBlueAutoRobotTask(newPropsData.blueAutoRobotTask);
                            setRedUpperSidePlantingZone(newPropsData.redUpperSidePlantingZone);
                            setRedLowerSidePlantingZone(newPropsData.redLowerSidePlantingZone);
                            setBlueUpperSidePlantingZone(newPropsData.blueUpperSidePlantingZone);
                            setBlueLowerSidePlantingZone(newPropsData.blueLowerSidePlantingZone);
                            setRedColouredPlantingZone(newPropsData.redColouredPlantingZone);
                            setBlueColouredPlantingZone(newPropsData.blueColouredPlantingZone);
                            setRedCenterPlantingZone(newPropsData.redCenterPlantingZone);
                            setBlueCenterPlantingZone(newPropsData.blueCenterPlantingZone);
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
            clock: { stage: "PREP", timestamp: 0, elapsed: 0, paused: true },
            props: {},
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

    // Game Props
    const [redAutoRobotTask, setRedAutoRobotTask] = useState(0);
    const [blueAutoRobotTask, setBlueAutoRobotTask] = useState(0);
    const [redUpperSidePlantingZone, setRedUpperSidePlantingZone] = useState(0);
    const [redLowerSidePlantingZone, setRedLowerSidePlantingZone] = useState(0);
    const [blueUpperSidePlantingZone, setBlueUpperSidePlantingZone] = useState(0);
    const [blueLowerSidePlantingZone, setBlueLowerSidePlantingZone] = useState(0);
    const [redColouredPlantingZone, setRedColouredPlantingZone] = useState(0);
    const [blueColouredPlantingZone, setBlueColouredPlantingZone] = useState(0);
    const [redCenterPlantingZone, setRedCenterPlantingZone] = useState(0);
    const [blueCenterPlantingZone, setBlueCenterPlantingZone] = useState(0);

    useEffect(() => {
        console.log("Updating Props")

        // GameRules
        if (redAutoRobotTask > 2) {setRedAutoRobotTask(2); return;}
        if (blueAutoRobotTask > 2) {setBlueAutoRobotTask(2); return;}


        if (gameID) {
            set(child(dbRef, `games/${gameID}/props`), {
                redAutoRobotTask: redAutoRobotTask,
                blueAutoRobotTask: blueAutoRobotTask,
                redUpperSidePlantingZone: redUpperSidePlantingZone,
                redLowerSidePlantingZone: redLowerSidePlantingZone,
                blueUpperSidePlantingZone: blueUpperSidePlantingZone,
                blueLowerSidePlantingZone: blueLowerSidePlantingZone,
                redColouredPlantingZone: redColouredPlantingZone,
                blueColouredPlantingZone: blueColouredPlantingZone,
                redCenterPlantingZone: redCenterPlantingZone,
                blueCenterPlantingZone: blueCenterPlantingZone,
            });
        }
    }, [redAutoRobotTask, blueAutoRobotTask, redUpperSidePlantingZone, redLowerSidePlantingZone, blueUpperSidePlantingZone, blueLowerSidePlantingZone, redColouredPlantingZone, blueColouredPlantingZone, redCenterPlantingZone, blueCenterPlantingZone])

    return (
        <>
        <Box style={{
            height: containerHeight,
            position: 'absolute',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            //overflow: 'hidden',
            backgroundColor: '#3A3B3C',
            fontFamily: "'Quicksand Variable', sans-serif",
            fontWeight: "700",
            fontSize: "2rem",
            color: 'white',
        }}>
            <Box style={{
                fontSize: '1.3rem',
                margin: '1rem',
            }}>
            GameID: {gameID}
            </Box>
            <Box style={{
                height: '20%',
                width: '100%',
                position: 'absolute',
            }}>
                {/** Clock Box */}
                <TimerBox 
                    timeText={clockText} 
                    gameStage={gameStage.current} 
                    clockToggle={clockToggle.current} 
                    toggleClock={toggleClock} 
                    resetStage={resetStage} 
                    changeStage={changeStage}
                />
            </Box>   
            <Box style={{
                height: '75%',
                width: '100%',
                top: '25%',
                position: 'absolute',
            }}>
                <Box style={{
                    height: '95%',
                    width: '100%',
                    zIndex: 1,
                }}>
                    <Image src="/GameField.png" alt="Logo" style={{
                        height: '100%',
                        width: '100%',
                        objectFit: 'contain',
                    }}/>
                </Box>
                <Box style={{
                    height: '10%',
                    width: '10%',
                    left: '39.2%',
                    top: '3%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <HoriztonalCounter counter={redAutoRobotTask} setCounter={setRedAutoRobotTask} />
                </Box>
                <Box style={{
                    height: '10%',
                    width: '10%',
                    left: '52.2%',
                    top: '3%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <HoriztonalCounter counter={blueAutoRobotTask} setCounter={setBlueAutoRobotTask} />
                </Box>
                <Box style={{
                    height: '10%',
                    width: '10%',
                    left: '35.5%',
                    top: '85%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <HoriztonalCounter counter={redColouredPlantingZone} setCounter={setRedColouredPlantingZone} />
                </Box>
                <Box style={{
                    height: '10%',
                    width: '10%',
                    left: '55.5%',
                    top: '85%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <HoriztonalCounter counter={blueColouredPlantingZone} setCounter={setBlueColouredPlantingZone} />
                </Box>
                <Box style={{
                    height: '10%',
                    width: '10%',
                    left: '46%',
                    top: '66%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <VerticalCounter counter={redLowerSidePlantingZone} setCounter={setRedLowerSidePlantingZone} />
                </Box>
                <Box style={{
                    height: '10%',
                    width: '10%',
                    left: '51.5%',
                    top: '66%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <VerticalCounter counter={blueLowerSidePlantingZone} setCounter={setBlueLowerSidePlantingZone} />
                </Box>
                <Box style={{
                    height: '10%',
                    width: '10%',
                    left: '46%',
                    top: '14.5%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <VerticalCounter counter={redUpperSidePlantingZone} setCounter={setRedUpperSidePlantingZone} />
                </Box>
                <Box style={{
                    height: '10%',
                    width: '10%',
                    left: '51.5%',
                    top: '14.5%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <VerticalCounter counter={blueUpperSidePlantingZone} setCounter={setBlueUpperSidePlantingZone} />
                </Box>
                <Box style={{
                    height: '10%',
                    width: '10%',
                    left: '45%',
                    top: '40%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <VerticalCounter counter={redCenterPlantingZone} setCounter={setRedCenterPlantingZone} />
                </Box>
                <Box style={{
                    height: '10%',
                    width: '10%',
                    left: '52.2%',
                    top: '40%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <VerticalCounter counter={blueCenterPlantingZone} setCounter={setBlueCenterPlantingZone} />
                </Box>
            </Box>
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