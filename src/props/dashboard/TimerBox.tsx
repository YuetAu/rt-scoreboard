import { Box } from "@chakra-ui/react";


export default function TimerBox(props: any) {
    const time = props.timeText;
    return (
        <Box style={{
            
            fontSize: "5rem",
            textAlign: "center",
        }}>
        {time.minutes}:{time.seconds}.{time.milliseconds}
        </Box>
    )
}