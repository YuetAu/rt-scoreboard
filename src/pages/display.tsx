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

    const searchParams = useSearchParams();

    const initialRender = useRef(true);
    const [gameID, setGameID] = useState("");

    useEffect(() => {
        console.log("Initial Render: "+initialRender.current);
        if (initialRender.current) {
            initialRender.current = false;
            const newGameID = searchParams.get("gameID") || generateSlug()
            setGameID(newGameID);
            console.log("Game ID: "+newGameID);
        }
    }, [initialRender]);


    return (<></>)
}