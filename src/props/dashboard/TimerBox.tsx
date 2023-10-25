import { Box, Button, ButtonGroup } from "@chakra-ui/react";


export default function TimerBox(props: any) {
    const time = props.timeText;
    return (
        <>
        <Box style={{
            position: "relative",
            top: "-0.2rem",
            bottom: "-0.5rem",
            fontSize: "2rem",
            textAlign: "center",
            height: "1rem",
        }}>
            {props.gameStage}
        </Box>
        <Box style={{
            position: "relative",
            top: "-0.5rem",
            bottom: "-0.5rem",
            fontSize: "5rem",
            textAlign: "center",
            height: "6rem",
        }}>
        {time.minutes}:{time.seconds}.{time.milliseconds}
        </Box>
        <Box style={{
            position: "relative",
            top: "-0.6rem",
            textAlign: "center",
            margin: "0"
        }}>
            <ButtonGroup spacing='2'>
                <Button onClick={()=>props.changeStage(-1)}>{"<<"}Prev</Button>
                <Button onClick={()=>props.changeStage(1)}>Next{">>"}</Button>
                <Button colorScheme={props.clockToggle?"red":"green"} onClick={props.toggleClock}>{props.clockToggle?"Stop":"Start"}</Button>
                <Button colorScheme="red" onClick={props.resetStage}>Reset</Button>
            </ButtonGroup>
        </Box>
        </>
    )
}