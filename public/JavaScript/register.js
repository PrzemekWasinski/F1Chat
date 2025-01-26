import { loadContent } from "./pages.js";

const studentID = "M00931085"

//Register function
export async function register() {
    //Get input field values
    const registerUsername = document.getElementById("registerUsername").value;
    const registerPassword = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const teamSelection = document.querySelector("input[name='team']:checked");

    const feedback = document.getElementById("registerErrorMessage");

    //Regex
    const passwordRegex = /^(?=.*?[0-9])(?=.*?[A-Za-z]).{8,32}$/
    const usernameRegex = /^[0-9A-Za-z]{4,16}$/

    //If input fields are empty
    if (!registerUsername || !registerPassword || !confirmPassword || !teamSelection) {
        console.log("All fields must be filled!");
        feedback.innerHTML = "All fields must be filled";
        return;
    }
    //If regex doesnt match the username
    if (!usernameRegex.test(registerUsername)) {
        console.log("Invalid Username")
        feedback.innerHTML = "Invalid Username";
        return;
    }
    //If passwords dont match
    if (registerPassword !== confirmPassword) {
        console.log("Passwords do not match!");
        feedback.innerHTML = "Passwords do not match";
        return;
    }
    //If passwords dont match regex
    if (!passwordRegex.test(registerPassword)) {
        console.log("Password not strong enough")
        feedback.innerHTML = "Password not strong enough"
        return;
    }
    //If everything is fine put all the data in JSON object
    const userJSON = JSON.stringify({
        "username": registerUsername,
        "password": registerPassword,
        "team": teamSelection.value,
        "follows": []
    });

    try {
        const response = await fetch(`/${studentID}/users`, { //Send details in POST request
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: userJSON
        });

        const result = await response.json();
        console.log(`${result} from: register()`);

        if (result["message"] == "User added successfully") { //If login successful
            loadContent("loginTemplate") //Redirect user to login
        } else {
            feedback.innerHTML = result["message"] //Return error message
        }

    } catch (error) {
        console.log(error);
    }
}