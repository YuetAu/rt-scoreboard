import { Box, Button, Flex } from "@chakra-ui/react";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


export function HoriztonalCounter(props: any) {
    return (
        <Flex>
            <Button mx={"0.2rem"} style={{fontSize: "2rem", lineHeight: "2.5rem"}} width={"2.5rem"} onClick={()=>props.setCounter(props.counter+1)}><FontAwesomeIcon icon={faArrowUp}/></Button>
            <Box shadow={"lg"} rounded={"lg"} px={"0.5rem"} style={{
                fontSize: "2rem",
                textAlign: "center",
                lineHeight: "2.5rem",
                width: "2.5rem",
                backgroundColor: "white",
                color: "black",
            }}>
                {props.counter}
            </Box>
            <Button mx={"0.2rem"} style={{fontSize: "2rem", lineHeight: "2.5rem"}} width={"2.5rem"} onClick={()=>props.setCounter(props.counter-1)}><FontAwesomeIcon icon={faArrowDown}/></Button>
        </Flex>
    )
}

export function VerticalCounter(props: any) {
    return (
        <>
            <Button my={"0.2rem"} style={{fontSize: "2rem", lineHeight: "2.5rem"}} width={"2.5rem"} onClick={()=>props.setCounter(props.counter+1)}><FontAwesomeIcon icon={faArrowUp}/></Button>
            <Box shadow={"lg"} rounded={"lg"} style={{
                fontSize: "2rem",
                textAlign: "center",
                lineHeight: "2.5rem",
                width: "2.5rem",
                backgroundColor: "white",
                color: "black",
            }}>
                {props.counter}
            </Box>
            <Button mt={"-0.5rem"} style={{fontSize: "2rem", lineHeight: "2.5rem"}} width={"2.5rem"} onClick={()=>props.setCounter(props.counter-1)}><FontAwesomeIcon icon={faArrowDown}/></Button>
        </>
    )
}