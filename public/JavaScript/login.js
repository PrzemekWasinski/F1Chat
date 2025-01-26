import { loadContent } from "./pages.js";

const studentID = "M00931085";

//Hash table for teams and their colours
const teamColours = {
    "Default": {"primary": "#333", "secondary": "#555"},
    "Red Bull": {"primary": "#0000bf", "secondary": "#c90a0a"},
    "Ferrari" : {"primary": "#d90000", "secondary": "#ffd817"},
    "McLaren": {"primary": "#ff7300", "secondary": "#000000"},
    "Mercedes": {"primary": "#00d6c4", "secondary": "#ababab"},
    "Aston Martin": {"primary": "#005239", "secondary": "#b9db0b"},
    "Alpine F1 Team": {"primary": "#ff36d3", "secondary": "#1166f7"},
    "Haas F1 Team": {"primary": "#d6d6d6", "secondary": "#ff0000"},
    "RB F1 Team": {"primary": "#0b00d4", "secondary": "#ff0000"},
    "Williams": {"primary": "#0051ff", "secondary": "#00a6ff"},
    "Sauber": {"primary": "#02d610", "secondary": "#000000"}
}

//Apply a team's theme
export function applyTheme(team) {
    const navBar = document.getElementById("navBar");

    const userSearchButton = document.getElementById("userSearchButton");
    const homePageButton = document.getElementById("homePageButton");
    const seasonsButton = document.getElementById("seasonsButton");
    const loginPageButton = document.getElementById("loginPageButton");
    const logOutButton = document.getElementById("logOutButton");
    const buttons = [userSearchButton, homePageButton, seasonsButton, loginPageButton, logOutButton]

    //If team exists apply it
    if (team in teamColours) {
        navBar.style.backgroundColor = teamColours[team]["primary"];
        for (let i = 0; i < buttons.length; i++) {
            if (buttons[i]) {
                buttons[i].style.backgroundColor = teamColours[team]["secondary"]
            }
        }

    //Else set the theme to default
    } else {
        navBar.style.backgroundColor = "#333";
        for (let i = 0; i < buttons.length; i++) {
            if (buttons[i]) {
                buttons[i].style.backgroundColor = "#555"
            }
        }
        
    }
};

//Login function
export async function login() {
    //Extract data from input fields
    const loginUsername = document.getElementById("loginUsername").value;
    const loginPassword = document.getElementById("loginPassword").value;

    const feedback = document.getElementById("loginErrorMessage");

    //If fields are empty
    if (!loginUsername || !loginPassword) {
        console.log("All fields must be filled!");
        feedback.innerHTML = "All fields must be filled"
        return;
    }

    const userJSON = JSON.stringify({
        "username": loginUsername, 
        "password": loginPassword
    });

    try { //Check if user is currently logged in
        const statusResponse = await fetch(`/${studentID}/login`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const statusResult = await statusResponse.json();
        console.log("Login status:", statusResult.message);
        if (statusResult.message == "No active session") { //Send post request to check details
            const loginResponse = await fetch(`/${studentID}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: userJSON
            });

            const loginResult = await loginResponse.json();
            console.log("Login attempt:", loginResult);

            //If details are correct apply theme and redirect user
            if (loginResult.status === "success") {
                applyTheme(loginResult["team"]);
                localStorage.setItem("userTeam", loginResult["team"]);
                console.log("Login successful!");
                loadContent("homeTemplate");
                document.getElementById("loginPageButton").style.display = "none";
                document.getElementById("logOutButton").style.display = "block";
            } else {
                console.log(`${loginResult} from: login()`);
                feedback.innerHTML = loginResult["message"];
            }
        } else {
            feedback.innerHTML - "Log out before loggin in"
        }

    } catch (error) {
        console.log(`${error} from: login()`);
    }
}

//Logout function
export async function logOut() { //Remove theme
    document.getElementById("loginPageButton").style.display = "block";
    document.getElementById("logOutButton").style.display = "none";
    applyTheme("Default")
    localStorage.removeItem("userTeam");

    try { //Delete request to log the user out
        const response = await fetch(`/${studentID}/login`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        console.log("Logout attempt:", result.message);
        loadContent("homeTemplate");

    } catch (error) {
        console.log(`${error} from: logOut()`);
    }
}

//Check if there is a user logged in and if so, who?
export async function checkLoginStatus() {
    try {
        const response = await fetch(`/${studentID}/login`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const result = await response.json();
        console.log(result)
        
        if (result.status === "logged_in") {
            console.log(`User ${result.username} is currently logged in`);
            const savedTeam = localStorage.getItem('userTeam');
            
            if (savedTeam) {
                applyTheme(savedTeam); //If there is a team in local storage (meaning someone is logged in) then apply th etheme
            }

            console.log(result)
            return result
        } else {
            console.log("No user is logged in");
            return result;
        }

        
    } catch (error) {
        console.log(`${error} from: checkLoginStatus()`);
        return JSON.stringify({ "status": error })
    }
}