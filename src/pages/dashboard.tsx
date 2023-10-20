import { FirebaseDatabase } from "@/firebase/config";
import { ref, push, child, set, remove } from "firebase/database";
import { useEffect, useRef, useState } from "react";

export default function Dashboard() {

    const [pingRequest, setPingRequest] = useState(true);
    const pingLock = useRef(false);

    useEffect(() => {
        console.log("Ping Request: "+pingRequest)
        console.log("Ping Lock: "+pingLock.current)
        if (pingRequest && !pingLock.current) {
            pingLock.current = true;
            const dbRef = ref(FirebaseDatabase);
            const pingID = push(child(dbRef, 'pings')).key;
            const timeNow = Date.now();
            set(child(dbRef, `pings/${pingID}`), {
                timestamp: timeNow
            })
            .then(() => {
                console.log("\nPing Request Sent\nWrite Time: "+(Date.now() - timeNow)+"ms");
                pingLock.current = false;
            })
            .catch((error) => {
                console.error(error);
                pingLock.current = false;
            });
            
            remove(child(dbRef, `pings/${pingID}`));
            setPingRequest(false);
        } else {
            console.log("Ping Request Blocked");
        }
    }, [pingRequest])
    


    return (<></>)
}