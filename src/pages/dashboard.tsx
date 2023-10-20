import { FirebaseDatabase } from "@/firebase/config";
import { ref, push, child, set, remove } from "firebase/database";
import { useEffect, useRef, useState } from "react";

export default function Dashboard() {

    const dbRef = ref(FirebaseDatabase);

    const [pingRequest, setPingRequest] = useState(true);
    const pingLock = useRef(false);
    
    useEffect(() => {
        console.log("Ping Request: "+pingRequest)
        console.log("Ping Lock: "+pingLock.current)
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
    }, [pingRequest])
    


    return (<></>)
}