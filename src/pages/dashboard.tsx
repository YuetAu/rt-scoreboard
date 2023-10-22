import { FirebaseDatabase } from "@/firebase/config";
import { Box, Button, FormControl, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spacer, VStack, useDisclosure } from "@chakra-ui/react";
import { ref, push, child, set, remove, get, update } from "firebase/database";
import { generateSlug } from "random-word-slugs";
import { useEffect, useRef, useState } from "react";

export default function Dashboard() {

    const dbRef = ref(FirebaseDatabase);

    /* const [pingRequest, setPingRequest] = useState(false);
    const pingLock = useRef(false);
    
    useEffect(() => {
        if (pingRequest && !pingLock.current) {
            pingLock.current = true;
            const pingID = push(child(dbRef, 'pings')).key;
            const timeNow = Date.now();
            set(child(dbRef, `pings/${pingID}`), {
                timestamp: timeNow
            })
            .then(() => {
                console.log("\nPing Request Sent\nWrite Time: "+(Date.now() - timeNow)+"ms");
            })
            .catch((error) => {
                console.error(error);
            });
            
            remove(child(dbRef, `pings/${pingID}`)).then(() => {
                console.log("Ping Request Removed");
            }).catch((error) => {
                console.error(error);
            }).finally(() => {
                pingLock.current = false;
            });
            setPingRequest(false);
        } else {
            console.log("Ping Request Blocked");
        }
    }, [pingRequest]) */

    const [gameID, setGameID] = useState("");
    const [deviceID, setDeviceID] = useState("");
    const gameFetchLock = useRef(false);

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

    const gameIDInput = useRef<HTMLInputElement>(null);
    const [gameIDModal, setGameIDModal] = useState(true);

    const submitGameID = () => {
        if (gameIDInput.current) {
            console.log("Game ID: "+gameIDInput.current.value);
            setGameID(gameIDInput.current.value);
            const newDeviceID = generateSlug(2)
            setDeviceID(newDeviceID);
            setGameIDModal(false);
        }
    }

    return (
        <>
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
            </ModalFooter>
            </ModalContent>
        </Modal>
        </>
    )
}