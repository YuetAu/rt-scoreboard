import { GAME_STAGES, GAME_STAGES_TIME } from "@/common/gameStages";
import { FirebaseDatabase } from "@/firebase/config";
import { Box, Button, Image, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import { ref, child, set, get, update, onValue } from "firebase/database";
import { generateSlug } from "random-word-slugs";
import { useEffect, useRef, useState } from "react";
import "@fontsource-variable/quicksand";
import TimerBox from "@/props/dashboard/TimerBox";
import { Counter } from "@/props/dashboard/Counter";
import { useSnackbar } from "notistack";

export default function Dashboard() {

    const dbRef = ref(FirebaseDatabase);

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

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
                    enqueueSnackbar(`Game Loaded`, {variant: "success"})
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

                    if (gameData.props) updateGameProps(gameData.props);
                    onValue(child(dbRef, `games/${gameID}/props`), (snapshot) => {
                        const newPropsData = snapshot.val();
                        if (newPropsData) {
                            updateGameProps(newPropsData);
                        }
                    });

                } else {
                    console.log("Game does not exist");
                    enqueueSnackbar(`Game Not Exist`, {variant: "error"})
                }
            }).catch((error) => {
                console.error(error);
            }).finally(() => {
                gameFetchLock.current = false;
            });
        }
    }, [gameID])

    const updateGameProps = (gameProps: any) => {
        setRedAutoRobotTask(gameProps.redAutoRobotTask);
        setBlueAutoRobotTask(gameProps.blueAutoRobotTask);
        setRedUpperSidePlantingZone(gameProps.redUpperSidePlantingZone);
        setRedLowerSidePlantingZone(gameProps.redLowerSidePlantingZone);
        setBlueUpperSidePlantingZone(gameProps.blueUpperSidePlantingZone);
        setBlueLowerSidePlantingZone(gameProps.blueLowerSidePlantingZone);
        setRedColouredPlantingZone(gameProps.redColouredPlantingZone);
        setBlueColouredPlantingZone(gameProps.blueColouredPlantingZone);
        setRedCenterPlantingZone(gameProps.redCenterPlantingZone);
        setBlueCenterPlantingZone(gameProps.blueCenterPlantingZone);
        setRedCenterGoldenPlantingZone(gameProps.redCenterGoldenPlantingZone);
        setBlueCenterGoldenPlantingZone(gameProps.blueCenterGoldenPlantingZone);
        setRedUpperSideGoldenPlantingZone(gameProps.redUpperSideGoldenPlantingZone);
        setBlueUpperSideGoldenPlantingZone(gameProps.blueUpperSideGoldenPlantingZone);
        setRedLowerSideGoldenPlantingZone(gameProps.redLowerSideGoldenPlantingZone);
        setBlueLowerSideGoldenPlantingZone(gameProps.blueLowerSideGoldenPlantingZone);
        setRedColouredGoldenPlantingZone(gameProps.redColouredGoldenPlantingZone);
        setBlueColouredGoldenPlantingZone(gameProps.blueColouredGoldenPlantingZone);
        setRedAutoRobotRecogn(gameProps.redAutoRobotRecogn);
        setBlueAutoRobotRecogn(gameProps.blueAutoRobotRecogn);
        setRedAutoRobotMove(gameProps.redAutoRobotMove);    
        setBlueAutoRobotMove(gameProps.blueAutoRobotMove);
        setGameScore(gameProps.scores);
    }

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
                    if (newGameStage == "END") {
                        enqueueSnackbar(`Game END`, {variant: "success"})
                        gameEndVictoryCalc();
                    }
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
        enqueueSnackbar("Clock Started", {variant: "success"})
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
        enqueueSnackbar("Clock Stopped", {variant: "success"})
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
        closeSnackbar();
        console.log("Reset Stage Time")
        clockToggle.current = false;
        clockElapse.current = 0;
        clockData.current = { stage: gameStage.current, paused: true, elapsed: 0, timestamp: Date.now() };
        updateClockText();
        enqueueSnackbar(`Reset stage ${gameStage.current}`, {variant: "success"});
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
        enqueueSnackbar(`Skip stage to ${gameStage.current}`, {variant: "success"})
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

    const resetClock = () => {
        stopClock();
        console.log("Reset Clock")
        clockToggle.current = false;
        clockElapse.current = 0;
        gameStage.current = GAME_STAGES[0]
        clockData.current = { stage: gameStage.current, paused: true, elapsed: 0, timestamp: Date.now() };
        updateClockText();
        set(child(dbRef, `games/${gameID}/clock`), {
            stage: gameStage.current,
            timestamp: Date.now(),
            elapsed: 0,
            paused: true
        })
    }

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
    const [redCenterGoldenPlantingZone, setRedCenterGoldenPlantingZone] = useState(0);
    const [blueCenterGoldenPlantingZone, setBlueCenterGoldenPlantingZone] = useState(0);
    const [redUpperSideGoldenPlantingZone, setRedUpperSideGoldenPlantingZone] = useState(0);
    const [blueUpperSideGoldenPlantingZone, setBlueUpperSideGoldenPlantingZone] = useState(0);
    const [redLowerSideGoldenPlantingZone, setRedLowerSideGoldenPlantingZone] = useState(0);
    const [blueLowerSideGoldenPlantingZone, setBlueLowerSideGoldenPlantingZone] = useState(0);
    const [redColouredGoldenPlantingZone, setRedColouredGoldenPlantingZone] = useState(0);
    const [blueColouredGoldenPlantingZone, setBlueColouredGoldenPlantingZone] = useState(0);
    const [redAutoRobotRecogn, setRedAutoRobotRecogn] = useState(0);
    const [blueAutoRobotRecogn, setBlueAutoRobotRecogn] = useState(0);
    const [redAutoRobotMove, setRedAutoRobotMove] = useState(0);
    const [blueAutoRobotMove, setBlueAutoRobotMove] = useState(0);

    const [gameScore, setGameScore] = useState({ red: 0, blue: 0, redOccoupyingZone: 0, blueOccoupyingZone: 0, redPlacedSeedlings: 0, bluePlacedSeedlings: 0, redGreatVictory: false, blueGreatVictory: false });
    const gameProps = useRef<any>({});

    const forceResetProps = useRef(false);

    const resetProps = () => {
        forceResetProps.current = true;
        setRedAutoRobotTask(0);
        setBlueAutoRobotTask(0);
        setRedUpperSidePlantingZone(0);
        setRedLowerSidePlantingZone(0);
        setBlueUpperSidePlantingZone(0);
        setBlueLowerSidePlantingZone(0);
        setRedColouredPlantingZone(0);
        setBlueColouredPlantingZone(0);
        setRedCenterPlantingZone(0);
        setBlueCenterPlantingZone(0);
        setRedCenterGoldenPlantingZone(0);
        setBlueCenterGoldenPlantingZone(0);
        setRedUpperSideGoldenPlantingZone(0);
        setBlueUpperSideGoldenPlantingZone(0);
        setRedLowerSideGoldenPlantingZone(0);
        setBlueLowerSideGoldenPlantingZone(0);
        setRedColouredGoldenPlantingZone(0);
        setBlueColouredGoldenPlantingZone(0);
        setRedAutoRobotRecogn(0);
        setBlueAutoRobotRecogn(0);
        setRedAutoRobotMove(0);
        setBlueAutoRobotMove(0);
        gameProps.current = {};
        forceResetProps.current = false;
    }

    useEffect(() => {
        console.log("Updating Props")

        if (gameID == "") return;
        
        if (!forceResetProps.current && gameStage.current == "PREP") {resetProps(); enqueueSnackbar("Changes not allowed at PREP", {variant: "error", preventDuplicate: true}); return;}
        if (gameStage.current == "END") { enqueueSnackbar("Editing after game", {variant: "info"}); }

        // GameRules
        if (redAutoRobotTask > 2) {setRedAutoRobotTask(2); return;}
        if (blueAutoRobotTask > 2) {setBlueAutoRobotTask(2); return;}

        const redPlacedNormalSeedlings = redUpperSidePlantingZone+redCenterPlantingZone+redLowerSidePlantingZone+redColouredPlantingZone;
        const redPlacedGoldenSeedlings = redUpperSideGoldenPlantingZone+redCenterGoldenPlantingZone+redLowerSideGoldenPlantingZone+redColouredGoldenPlantingZone;
        const redPlacedSeedlings = redPlacedNormalSeedlings+redPlacedGoldenSeedlings;
        const bluePlacedNormalSeedlings = blueUpperSidePlantingZone+blueCenterPlantingZone+blueLowerSidePlantingZone+blueColouredPlantingZone;
        const bluePlacedGoldenSeedlings = blueUpperSideGoldenPlantingZone+blueCenterGoldenPlantingZone+blueLowerSideGoldenPlantingZone+blueColouredGoldenPlantingZone;
        const bluePlacedSeedlings = bluePlacedNormalSeedlings+bluePlacedGoldenSeedlings;

        // For Future Victory Check
        if (gameProps.current.scores) {
            if (!gameProps.current.scores.redAutoRobotTaskElapsed && redAutoRobotTask == 2) {gameProps.current.scores.redAutoRobotTaskElapsed = Date.now()-clockData.current.timestamp+clockData.current.elapsed;}
            if (!gameProps.current.scores.blueAutoRobotTaskElapsed && blueAutoRobotTask == 2) {gameProps.current.scores.blueAutoRobotTaskElapsed = Date.now()-clockData.current.timestamp+clockData.current.elapsed;}
            if (redAutoRobotTask < 2) {gameProps.current.scores.redAutoRobotTaskElapsed = null}
            if (blueAutoRobotTask < 2) {gameProps.current.scores.blueAutoRobotTaskElapsed = null}
        }

        if (redPlacedNormalSeedlings > 9) {
            enqueueSnackbar("Red Team Too Many Seedlings", {variant: "error", preventDuplicate: true})
            if (redUpperSidePlantingZone > gameProps.current.redUpperSidePlantingZone) {setRedUpperSidePlantingZone(gameProps.current.redUpperSidePlantingZone); return;}
            if (redCenterPlantingZone > gameProps.current.redCenterPlantingZone) {setRedCenterPlantingZone(gameProps.current.redCenterPlantingZone); return;}
            if (redLowerSidePlantingZone > gameProps.current.redLowerSidePlantingZone) {setRedLowerSidePlantingZone(gameProps.current.redLowerSidePlantingZone); return;}
            if (redColouredPlantingZone > gameProps.current.redColouredPlantingZone) {setRedColouredPlantingZone(gameProps.current.redColouredPlantingZone); return;}
        }


        if (bluePlacedNormalSeedlings > 9) {
            enqueueSnackbar("Blue Team Too Many Seedlings", {variant: "error", preventDuplicate: true, anchorOrigin: { horizontal: "right", vertical: "bottom" }})
            if (blueUpperSidePlantingZone > gameProps.current.blueUpperSidePlantingZone) {setBlueUpperSidePlantingZone(gameProps.current.blueUpperSidePlantingZone); return;}
            if (blueCenterPlantingZone > gameProps.current.blueCenterPlantingZone) {setBlueCenterPlantingZone(gameProps.current.blueCenterPlantingZone); return;}
            if (blueLowerSidePlantingZone > gameProps.current.blueLowerSidePlantingZone) {setBlueLowerSidePlantingZone(gameProps.current.blueLowerSidePlantingZone); return;}
            if (blueColouredPlantingZone > gameProps.current.blueColouredPlantingZone) {setBlueColouredPlantingZone(gameProps.current.blueColouredPlantingZone); return;}
        }

        if (redAutoRobotTask != 2 && redPlacedGoldenSeedlings > 0) {
            enqueueSnackbar("Red Team Golden Seedlings Not Unlocked", {variant: "error", preventDuplicate: true})
            if (redUpperSideGoldenPlantingZone > gameProps.current.redUpperSideGoldenPlantingZone) {setRedUpperSideGoldenPlantingZone(gameProps.current.redUpperSideGoldenPlantingZone); return;}
            if (redCenterGoldenPlantingZone > gameProps.current.redCenterGoldenPlantingZone) {setRedCenterGoldenPlantingZone(gameProps.current.redCenterGoldenPlantingZone); return;}
            if (redLowerSideGoldenPlantingZone > gameProps.current.redLowerSideGoldenPlantingZone) {setRedLowerSideGoldenPlantingZone(gameProps.current.redLowerSideGoldenPlantingZone); return;}
            if (redColouredGoldenPlantingZone > gameProps.current.redColouredGoldenPlantingZone) {setRedColouredGoldenPlantingZone(gameProps.current.redColouredGoldenPlantingZone); return;}
        }

        if (redPlacedGoldenSeedlings > 3) {
            enqueueSnackbar("Red Team Too Many Golden Seedlings", {variant: "error", preventDuplicate: true})
            if (redUpperSideGoldenPlantingZone > gameProps.current.redUpperSideGoldenPlantingZone) {setRedUpperSideGoldenPlantingZone(gameProps.current.redUpperSideGoldenPlantingZone); return;}
            if (redCenterGoldenPlantingZone > gameProps.current.redCenterGoldenPlantingZone) {setRedCenterGoldenPlantingZone(gameProps.current.redCenterGoldenPlantingZone); return;}
            if (redLowerSideGoldenPlantingZone > gameProps.current.redLowerSideGoldenPlantingZone) {setRedLowerSideGoldenPlantingZone(gameProps.current.redLowerSideGoldenPlantingZone); return;}
            if (redColouredGoldenPlantingZone > gameProps.current.redColouredGoldenPlantingZone) {setRedColouredGoldenPlantingZone(gameProps.current.redColouredGoldenPlantingZone); return;}
        }

        if (blueAutoRobotTask != 2 && bluePlacedGoldenSeedlings > 0) {
            enqueueSnackbar("Blue Team Golden Seedlings Not Unlocked", {variant: "error", preventDuplicate: true, anchorOrigin: { horizontal: "right", vertical: "bottom" }})
            if (blueUpperSideGoldenPlantingZone > gameProps.current.blueUpperSideGoldenPlantingZone) {setBlueUpperSideGoldenPlantingZone(gameProps.current.blueUpperSideGoldenPlantingZone); return;}
            if (blueCenterGoldenPlantingZone > gameProps.current.blueCenterGoldenPlantingZone) {setBlueCenterGoldenPlantingZone(gameProps.current.blueCenterGoldenPlantingZone); return;}
            if (blueLowerSideGoldenPlantingZone > gameProps.current.blueLowerSideGoldenPlantingZone) {setBlueLowerSideGoldenPlantingZone(gameProps.current.blueLowerSideGoldenPlantingZone); return;}
            if (blueColouredGoldenPlantingZone > gameProps.current.blueColouredGoldenPlantingZone) {setBlueColouredGoldenPlantingZone(gameProps.current.blueColouredGoldenPlantingZone); return;}
        }

        if (bluePlacedGoldenSeedlings > 3) {
            enqueueSnackbar("Blue Team Too Many Golden Seedlings", {variant: "error", preventDuplicate: true, anchorOrigin: { horizontal: "right", vertical: "bottom" }})
            if (blueUpperSideGoldenPlantingZone > gameProps.current.blueUpperSideGoldenPlantingZone) {setBlueUpperSideGoldenPlantingZone(gameProps.current.blueUpperSideGoldenPlantingZone); return;}
            if (blueCenterGoldenPlantingZone > gameProps.current.blueCenterGoldenPlantingZone) {setBlueCenterGoldenPlantingZone(gameProps.current.blueCenterGoldenPlantingZone); return;}
            if (blueLowerSideGoldenPlantingZone > gameProps.current.blueLowerSideGoldenPlantingZone) {setBlueLowerSideGoldenPlantingZone(gameProps.current.blueLowerSideGoldenPlantingZone); return;}
            if (blueColouredGoldenPlantingZone > gameProps.current.blueColouredGoldenPlantingZone) {setBlueColouredGoldenPlantingZone(gameProps.current.blueColouredGoldenPlantingZone); return;}
        }

        if (redCenterPlantingZone+redCenterGoldenPlantingZone+blueCenterPlantingZone+blueCenterGoldenPlantingZone > 8) {
            enqueueSnackbar("Center Planting Zone Too Many Seelings", {variant: "error", preventDuplicate: true, anchorOrigin: { horizontal: "center", vertical: "bottom" }})
            if (redCenterPlantingZone > gameProps.current.redCenterPlantingZone) {setRedCenterPlantingZone(gameProps.current.redCenterPlantingZone); return;}
            if (redCenterGoldenPlantingZone > gameProps.current.redCenterGoldenPlantingZone) {setRedCenterGoldenPlantingZone(gameProps.current.redCenterGoldenPlantingZone); return;}
            if (blueCenterPlantingZone > gameProps.current.blueCenterPlantingZone) {setBlueCenterPlantingZone(gameProps.current.blueCenterPlantingZone); return;}
            if (blueCenterGoldenPlantingZone > gameProps.current.blueCenterGoldenPlantingZone) {setBlueCenterGoldenPlantingZone(gameProps.current.blueCenterGoldenPlantingZone); return;}
        }

        // Calculate the marks
        var redPoints = 0;
        if (redAutoRobotRecogn == 1) redPoints += 30; // 2.5.2.1
        if (redAutoRobotTask == 2 && redAutoRobotMove == 1) redPoints += 50; // 2.5.2.2
        if (redAutoRobotTask == 2 && redAutoRobotMove == 0) redPoints += 25; // 2.5.2.2 NOTE
        redPoints += redColouredPlantingZone * 10; // 2.5.1.1
        redPoints += (redUpperSidePlantingZone+redLowerSidePlantingZone) * 15; // 2.5.1.2
        redPoints += redCenterPlantingZone * 20; // 2.5.1.3
        redPoints += redColouredGoldenPlantingZone * 20; // 2.5.1.4
        redPoints += (redUpperSideGoldenPlantingZone+redLowerSideGoldenPlantingZone) * 30; // 2.5.1.5
        redPoints += redCenterGoldenPlantingZone * 40; // 2.5.1.6

        var bluePoints = 0;
        if (blueAutoRobotRecogn == 1) bluePoints += 30; // 2.5.2.1
        if (blueAutoRobotTask == 2 && blueAutoRobotMove == 1) bluePoints += 50; // 2.5.2.2
        if (blueAutoRobotTask == 2 && blueAutoRobotMove == 0) bluePoints += 25; // 2.5.2.2 NOTE
        bluePoints += blueColouredPlantingZone * 10; // 2.5.1.1
        bluePoints += (blueUpperSidePlantingZone+blueLowerSidePlantingZone) * 15; // 2.5.1.2
        bluePoints += blueCenterPlantingZone * 20; // 2.5.1.3
        bluePoints += blueColouredGoldenPlantingZone * 20; // 2.5.1.4
        bluePoints += (blueUpperSideGoldenPlantingZone+blueLowerSideGoldenPlantingZone) * 30; // 2.5.1.5
        bluePoints += blueCenterGoldenPlantingZone * 40; // 2.5.1.6

        // Perform Great Victory Check
        // Per Interpretation on 2.7.1 and Game Process Realated Great Victory
        // The team occupying 4 Planting Zones with more than 5 seedlings in total will achieve Great Victory, the team wins and the game ends immediately.
        var redGreatVictory = false;
        var blueGreatVictory = false;
        var redOccoupyingZone = 0;
        var blueOccoupyingZone = 0;

        if ((redUpperSidePlantingZone+redUpperSideGoldenPlantingZone) > (blueUpperSidePlantingZone+blueUpperSideGoldenPlantingZone)) {
            redOccoupyingZone += 1;
        } else if ((redUpperSidePlantingZone+redUpperSideGoldenPlantingZone) < (blueUpperSidePlantingZone+blueUpperSideGoldenPlantingZone)) {
            blueOccoupyingZone += 1;
        }

        if ((redCenterPlantingZone+redCenterGoldenPlantingZone) > (blueCenterPlantingZone+blueCenterGoldenPlantingZone)) {
            redOccoupyingZone += 1;
        } else if ((redCenterPlantingZone+redCenterGoldenPlantingZone) < (blueCenterPlantingZone+blueCenterGoldenPlantingZone)) {
            blueOccoupyingZone += 1;
        }

        if ((redLowerSidePlantingZone+redLowerSideGoldenPlantingZone) > (blueLowerSidePlantingZone+blueLowerSideGoldenPlantingZone)) {
            redOccoupyingZone += 1;
        } else if ((redLowerSidePlantingZone+redLowerSideGoldenPlantingZone) < (blueLowerSidePlantingZone+blueLowerSideGoldenPlantingZone)) {
            blueOccoupyingZone += 1;
        }

        if ((redColouredPlantingZone+redColouredGoldenPlantingZone) > (blueColouredPlantingZone+blueColouredGoldenPlantingZone)) {
            redOccoupyingZone += 1;
        } else if ((redColouredPlantingZone+redColouredGoldenPlantingZone) < (blueColouredPlantingZone+blueColouredGoldenPlantingZone)) {
            blueOccoupyingZone += 1;
        }

        if (redOccoupyingZone == 4 && redPlacedSeedlings > 5) {
            redGreatVictory = true;
            enqueueSnackbar(`RED GREAT VICTORY`, {variant: "success", autoHideDuration: 10000})
            stopClock();
        }

        if (blueOccoupyingZone == 4 && bluePlacedSeedlings > 5) {
            blueGreatVictory = true;
            enqueueSnackbar(`BLUE GREAT VICTORY`, {variant: "success", anchorOrigin: { horizontal: "right", vertical: "bottom" }, autoHideDuration: 10000})
            stopClock();
        }

        console.log(redPoints, bluePoints)

        gameProps.current = {
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
            redCenterGoldenPlantingZone: redCenterGoldenPlantingZone,
            blueCenterGoldenPlantingZone: blueCenterGoldenPlantingZone,
            redUpperSideGoldenPlantingZone: redUpperSideGoldenPlantingZone,
            blueUpperSideGoldenPlantingZone: blueUpperSideGoldenPlantingZone,
            redLowerSideGoldenPlantingZone: redLowerSideGoldenPlantingZone,
            blueLowerSideGoldenPlantingZone: blueLowerSideGoldenPlantingZone,
            redColouredGoldenPlantingZone: redColouredGoldenPlantingZone,
            blueColouredGoldenPlantingZone: blueColouredGoldenPlantingZone,
            redAutoRobotRecogn: redAutoRobotRecogn,
            blueAutoRobotRecogn: blueAutoRobotRecogn,
            redAutoRobotMove: redAutoRobotMove,
            blueAutoRobotMove: blueAutoRobotMove,
            scores: {
                ...gameProps.current.scores,
                red: redPoints,
                blue: bluePoints,
                redOccoupyingZone: redOccoupyingZone,
                blueOccoupyingZone: blueOccoupyingZone,
                redPlacedSeedlings: redPlacedSeedlings,
                bluePlacedSeedlings: bluePlacedSeedlings,
                redPlacedGoldenSeedlings: redPlacedGoldenSeedlings,
                bluePlacedGoldenSeedlings: bluePlacedGoldenSeedlings,
                redGreatVictory: redGreatVictory,
                blueGreatVictory: blueGreatVictory,
            }
        }

        set(child(dbRef, `games/${gameID}/props`), gameProps.current);
    }, [redAutoRobotTask, blueAutoRobotTask, 
        redUpperSidePlantingZone, redLowerSidePlantingZone, 
        blueUpperSidePlantingZone, blueLowerSidePlantingZone, 
        redColouredPlantingZone, blueColouredPlantingZone, 
        redCenterPlantingZone, blueCenterPlantingZone, 
        redCenterGoldenPlantingZone, blueCenterGoldenPlantingZone,
        redUpperSideGoldenPlantingZone, blueUpperSideGoldenPlantingZone,
        redLowerSideGoldenPlantingZone, blueLowerSideGoldenPlantingZone,
        redColouredGoldenPlantingZone, blueColouredGoldenPlantingZone,
        redAutoRobotRecogn, blueAutoRobotRecogn,
        redAutoRobotMove, blueAutoRobotMove,
    ])

    const gameEndVictoryCalc = () => {
        // Preform Victory Check after 3 minutes Game Time
        // Per Interpretation on 2.7.1
        // The team with a higher total score
        /*
        In case two teams have the same score, the winner will be decided according to the following order:
            i.  The team that occupies more Planting Zone;
            ii. The team whose AR finished all the AR tasks first;
            iii. The team with more golden seedlings in the Planting Zones;
            iv. The team that has committed fewer violations;
            v. The team with a less total weight of robots;
            vi. Decisions made by referees.
        */

        const updateVictory = (redVictory: boolean, blueVictory: boolean) => {
            set(child(dbRef, `games/${gameID}/props/scores`), {
                redVictory: redVictory,
                blueVictory: blueVictory,
            });
        }

        var redVictory = false;
        var blueVictory = false;
        
        if (gameProps.current.scores.red > gameProps.current.scores.blue) {
            redVictory = true;
        } else if (gameProps.current.scores.red < gameProps.current.scores.blue) {
            blueVictory = true;
        } else {
            if (gameProps.current.scores.redOccoupyingZone > gameProps.current.scores.blueOccoupyingZone) {
                redVictory = true;
            } else if (gameProps.current.scores.redOccoupyingZone < gameProps.current.scores.blueOccoupyingZone) {
                blueVictory = true;
            } else {
                if (gameProps.current.scores.redAutoRobotTaskElapsed < gameProps.current.scores.blueAutoRobotTaskElapsed) {
                    redVictory = true;
                } else if (gameProps.current.scores.redAutoRobotTaskElapsed > gameProps.current.scores.blueAutoRobotTaskElapsed) {
                    blueVictory = true;
                } else {
                    if (gameProps.current.scores.redPlacedGoldenSeedlings > gameProps.current.scores.bluePlacedGoldenSeedlings) {
                        redVictory = true;
                    } else if (gameProps.current.scores.redPlacedGoldenSeedlings < gameProps.current.scores.bluePlacedGoldenSeedlings) {
                        blueVictory = true;
                    } else {
                        // Unable to determine winner
                        redVictory = false;
                        blueVictory = false;
                    }
                }
            }
        }
        if (redVictory) enqueueSnackbar(`RED VICTORY`, {variant: "success", autoHideDuration: 10000})
        if (blueVictory) enqueueSnackbar(`BLUE VICTORY`, {variant: "success", anchorOrigin: { horizontal: "right", vertical: "bottom" }, autoHideDuration: 10000})
        updateVictory(redVictory, blueVictory);
    }

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
                zIndex: 10
            }}>
            GameID: {gameID}
            <br />
            <Button onClick={()=>{navigator.clipboard.writeText(gameID).then(()=>enqueueSnackbar("GameID Copied!", {variant: "success"}))}} colorScheme="blue" size={"sm"}>Copy GameID</Button>
            <br />
            <Button onClick={()=>{resetProps();closeSnackbar();enqueueSnackbar("Props Reset!", {variant: "success"})}} colorScheme="red" size={"sm"}>Reset Props</Button>
            <br />
            <Button onClick={()=>{resetClock();closeSnackbar();enqueueSnackbar("Clock Reset!", {variant: "success"})}} colorScheme="red" size={"sm"}>Reset Clock</Button>
            </Box>
            <Box style={{
                height: '20%',
                width: '100%',
                position: 'absolute',
                justifyContent: 'center',
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
                    left: '42.3%',
                    top: '3%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={redAutoRobotTask} setCounter={setRedAutoRobotTask} color={"red"} />
                </Box>
                <Box style={{
                    left: '55%',
                    top: '3%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={blueAutoRobotTask} setCounter={setBlueAutoRobotTask} color={"blue"} />
                </Box>
                <Box style={{
                    left: '38.5%',
                    top: '85%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={redColouredPlantingZone} setCounter={setRedColouredPlantingZone} color={"red"} />
                </Box>
                <Box style={{
                    left: '58.5%',
                    top: '85%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={blueColouredPlantingZone} setCounter={setBlueColouredPlantingZone} color={"blue"} />
                </Box>
                <Box style={{
                    left: '46%',
                    top: '79.2%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={redLowerSidePlantingZone} setCounter={setRedLowerSidePlantingZone} color={"red"} />
                </Box>
                <Box style={{
                    left: '51.5%',
                    top: '79.2%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={blueLowerSidePlantingZone} setCounter={setBlueLowerSidePlantingZone} color={"blue"} />
                </Box>
                <Box style={{
                    left: '46%',
                    top: '28%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={redUpperSidePlantingZone} setCounter={setRedUpperSidePlantingZone} color={"red"} />
                </Box>
                <Box style={{
                    left: '51.5%',
                    top: '28%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={blueUpperSidePlantingZone} setCounter={setBlueUpperSidePlantingZone} color={"blue"} />
                </Box>
                <Box style={{
                    left: '45%',
                    top: '54.5%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={redCenterPlantingZone} setCounter={setRedCenterPlantingZone} color={"red"} />
                </Box>
                <Box style={{
                    left: '52.2%',
                    top: '54.5%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={blueCenterPlantingZone} setCounter={setBlueCenterPlantingZone} color={"blue"} />
                </Box>

                <Box style={{
                    left: '45%',
                    top: '45%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={redCenterGoldenPlantingZone} setCounter={setRedCenterGoldenPlantingZone} color={"gold"} />
                </Box>
                <Box style={{
                    left: '52.2%',
                    top: '45%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={blueCenterGoldenPlantingZone} setCounter={setBlueCenterGoldenPlantingZone} color={"gold"} />
                </Box>
                <Box style={{
                    left: '46%',
                    top: '20%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={redUpperSideGoldenPlantingZone} setCounter={setRedUpperSideGoldenPlantingZone} color={"gold"} />
                </Box>
                <Box style={{
                    left: '51.5%',
                    top: '20%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={blueUpperSideGoldenPlantingZone} setCounter={setBlueUpperSideGoldenPlantingZone} color={"gold"} />
                </Box>
                <Box style={{
                    left: '46%',
                    top: '71.2%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={redLowerSideGoldenPlantingZone} setCounter={setRedLowerSideGoldenPlantingZone} color={"gold"} />
                </Box>
                <Box style={{
                    left: '51.5%',
                    top: '71.2%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={blueLowerSideGoldenPlantingZone} setCounter={setBlueLowerSideGoldenPlantingZone} color={"gold"} />
                </Box>
                <Box style={{
                    left: '38.5%',
                    top: '77%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={redColouredGoldenPlantingZone} setCounter={setRedColouredGoldenPlantingZone} color={"gold"} />
                </Box>
                <Box style={{
                    left: '58.5%',
                    top: '77%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Counter counter={blueColouredGoldenPlantingZone} setCounter={setBlueColouredGoldenPlantingZone} color={"gold"} />
                </Box>
                <Box style={{
                    left: '32.5%',
                    top: '1.5%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Button onClick={()=>{setRedAutoRobotRecogn(redAutoRobotRecogn==1?0:1)}} colorScheme={redAutoRobotRecogn==1?"green":"red"}>Rc</Button>
                </Box>
                <Box style={{
                    left: '36.5%',
                    top: '1.5%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Button onClick={()=>{setRedAutoRobotMove(redAutoRobotMove==1?0:1)}} colorScheme={redAutoRobotMove==1?"green":"red"}>Mv</Button>
                </Box>
                <Box style={{
                    left: '59.8%',
                    top: '1.5%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Button onClick={()=>{setBlueAutoRobotRecogn(blueAutoRobotRecogn==1?0:1)}} colorScheme={blueAutoRobotRecogn==1?"green":"red"}>Rc</Button>
                </Box>
                <Box style={{
                    left: '63.7%',
                    top: '1.5%',
                    position: 'absolute',
                    zIndex: 10,
                }}>
                    <Button onClick={()=>{setBlueAutoRobotMove(blueAutoRobotMove==1?0:1)}} colorScheme={blueAutoRobotMove==1?"green":"red"}>Mv</Button>
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