import { Box } from "@chakra-ui/react";
import styled from "@emotion/styled";

const Background = styled(Box)`
    width: 50%;
    height: 100%;
    -webkit-clip-path: polygon(0 0, 100% 25%, 100% 100%, 0 100%);
    clip-path: polygon(0 0, 25% 15%, 75% 15%, 100% 0);
    background: #EA9546;
`;

const TextBox = styled(Box)`
    width: 50%;
    height: 15%;
    left: 25%;
    position: absolute;
`;

const Timer = styled(Box)`
    position: relative;
    color: #fff;
    font-weight: 700;
    font-size: 4.5rem;
    margin: 0;
    top: 1rem;
    height: 3.7rem;
    width: 100%;
    text-align: center;
    overflow: hidden;
    line-height: 3rem;
`;


export default function TimeDisplay(props: any) {
    const timeText = props.timeText;
    return (
        <Background>
            <TextBox>
                <Timer>{timeText.minutes}:{timeText.seconds}.{timeText.milliseconds}</Timer>
            </TextBox>
        </Background>
    )
}