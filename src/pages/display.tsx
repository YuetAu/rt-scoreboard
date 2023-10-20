import { FirebaseDatabase } from "@/firebase/config";
import { ref, onValue, get, child, set } from "firebase/database";
import { useSearchParams } from "next/navigation";
import { generateSlug } from "random-word-slugs";
import { use, useEffect, useRef, useState } from "react";


export default function Display() {

    /* Initial Get Data
    const dbRef = ref(FirebaseDatabase);
    get(child(dbRef, `users/${userId}`)).then((snapshot) => {
    if (snapshot.exists()) {
        console.log(snapshot.val());
    } else {
        console.log("No data available");
    }
    }).catch((error) => {
    console.error(error);
    }); */

    /* Add Value Listener
    const starCountRef = ref(FirebaseDatabase, 'posts/' + postId + '/starCount');
    onValue(starCountRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateStarCount(postElement, data);
        }
    }); */

    const dbRef = ref(FirebaseDatabase);

    const searchParams = useSearchParams();

    const initialRender = useRef(true);
    const [gameID, setGameID] = useState("");
    const gameFetchLock = useRef(false);

    useEffect(() => {
        console.log("Initial Render: "+initialRender.current);
        if (initialRender.current) {
            initialRender.current = false;
            const newGameID = searchParams.get("gameID") || generateSlug()
            setGameID(newGameID);
            console.log("Game ID: "+newGameID);
        }
    }, [initialRender]);

    useEffect(() => {
        if (gameID && !gameFetchLock.current) {
            get(child(dbRef, `games/${gameID}`)).then((snapshot) => {
                if (snapshot.exists()) {
                    //Game already exists
                    //Match Up to status
                    console.log(snapshot.val());
                } else {
                    console.log("No data available");
                    //Game does not exist
                    //New Game
                }
            }).catch((error) => {
                console.error(error);
            }).finally(() => {
                gameFetchLock.current = false;
            });
        }
    }, [gameID]);


    return (<></>)
}