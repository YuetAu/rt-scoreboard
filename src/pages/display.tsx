import { FirebaseDatabase } from "@/firebase/config";
import { ref, onValue, get, child } from "firebase/database";

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

    return (<></>)
}