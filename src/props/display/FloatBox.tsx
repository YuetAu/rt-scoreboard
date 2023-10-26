import { Box, SimpleGrid } from "@chakra-ui/react";
import "@fontsource-variable/quicksand";
import "@fontsource-variable/source-code-pro";


export default function FloatBox(props: any) {
    const time = props.timeText;
    return (
        <>
        <Box boxShadow='lg' m={"4rem"} mb={"0.7rem"} rounded='md' bg='white' p={"0.4rem"} style={{
            fontFamily: "'Quicksand Variable', sans-serif",
            fontSize: "1.2rem",
            fontWeight: "700",
            width: "12rem",
            textAlign: "center",
            backgroundColor: "#F9A825",
        }}>
            {props.gameStage}
        </Box>
        <Box boxShadow='lg' m={"4rem"} my={"0.7rem"} rounded='md' bg='white' p={"0.4rem"} style={{
            fontSize: "2rem",
            width: "12rem",
            textAlign: "center",
            fontFamily: "'Source Code Pro Variable', sans-serif",
            fontWeight: "600",
        }}>
            {time.minutes}:{time.seconds}.{time.milliseconds}
        </Box>
        <Box m={"4rem"} mt={"0.7rem"} style={{
            fontFamily: "'Quicksand Variable', sans-serif",
            fontSize: "3rem",
            fontWeight: "700",
            width: "12rem",
            display: "flex",
        }}>
            <Box boxShadow='lg' p={"0.4rem"} mr={"0.7rem"} rounded='md' bg='white' style={{
                backgroundColor: "#F56565",
                textAlign: "center",
                width: "6rem",
            }}>
                {props.redTeamPoints}
            </Box>
            <Box boxShadow='lg' p={"0.4rem"} rounded='md' bg='white' style={{
                backgroundColor: "#11B5E4",
                textAlign: "center",
                width: "6rem",
            }}>
                {props.blueTeamPoints}
            </Box>
        </Box>
        </>
    )
}