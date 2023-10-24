import { Box, SimpleGrid } from "@chakra-ui/react";
import styled from "@emotion/styled";
import '@fontsource-variable/quicksand';
import { ChineseTeamTitle, EnglishTeamTitle, ItemPoints, Points } from "./TextBoxProps";

const UnderBackground = styled(Box)`
    width: 20%;
    height: 100%;
    -webkit-clip-path: polygon(0 0, 100% 25%, 100% 100%, 0 100%);
    clip-path: polygon(0 0, 100% 25%, 100% 100%, 0 100%);
    background: #e63946;
`;

const FrontBackground = styled(Box)`
    width: 100%;
    height: 100%;
    -webkit-clip-path: polygon(0 0, 100% 25%, 100% 100%, 0 100%);
    clip-path: polygon(0 4%, 93% 27%, 93% 100%, 0 100%);
    background: #E56060;
`;

const TextBox = styled(Box)`
    height: 75%;
    width: 18.5%;
    position: absolute;
    top: 25%;
    left: 0%;
    color: #fff;
    font-family: 'Quicksand Variable', sans-serif;
`;

export default function RedSideDisplay(props: any) {
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