import { Box, SimpleGrid } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { ChineseTeamTitle, EnglishTeamTitle, ItemPoints, Points } from "./TextBoxProps";

const UnderBackground = styled(Box)`
    width: 20%;
    height: 100%;
    -webkit-clip-path: polygon(100% 0, 0 25%, 0 100%, 100% 100%);
    clip-path: polygon(100% 0, 0 25%, 0 100%, 100% 100%);
    background: #1481BA;
`;

const FrontBackground = styled(Box)`
    width: 100%%;
    height: 100%;
    -webkit-clip-path: polygon(100% 0, 0 25%, 0 100%, 100% 100%);
    clip-path: polygon(100% 4%, 7% 27%, 7% 100%, 100% 100%);
    background: #11B5E4;
`;

const TextBox = styled(Box)`
    height: 75%;
    width: 18.5%;
    position: absolute;
    top: 25%;
    left: 81.5%;
    color: #fff;
    font-family: 'Quicksand Variable', sans-serif;
`;


export default function BlueSideDisplay(props: any) {
    return (
        <UnderBackground>
            <FrontBackground>
                <TextBox>
                    <ChineseTeamTitle>{props.zhTeamTitle}</ChineseTeamTitle>
                    <EnglishTeamTitle>{props.enTeamTitle}</EnglishTeamTitle>
                    <Points>{props.teamPoints}</Points>
                    <ItemPoints>
                        <SimpleGrid columns={2} spacing={2}>
                            <p>AR Box: 4</p>
                            <p>TR CA1: 1</p>
                            <p>TR CA2: 2</p>
                            <p>TR CA3: 3</p>
                        </SimpleGrid>
                    </ItemPoints>
                </TextBox>
            </FrontBackground>
        </UnderBackground>
    )
}