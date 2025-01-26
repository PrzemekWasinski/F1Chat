const studentID = "M00931085";

//Hash table storing teams and their colours
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

//Get season results from api
async function getSeasonResults(year) {
    try { //Call get request
        const response = await fetch(`/${studentID}/f1-standings/${year}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        console.log(data.data);
        return data.data;

    } catch (error) {
        console.log(`${error} from api.js`);
        return { driversArray: [], constructorsArray: [] };
    }
}

//Display season results
export function loadSeasonsTemplate() {
    const date = new Date();
    let currentYear = date.getFullYear();

    const contentDiv = document.getElementById("content");
    contentDiv.innerHTML = "";  

    const select = document.createElement("select");
    select.id = "seasons-year";
    select.name = "year";

    for (let i = currentYear; i >= 1958; i--) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        select.appendChild(option); 
    }
    contentDiv.appendChild(select);

    const seasonDiv = document.createElement("div");
    seasonDiv.id = "seasons-year-display";
    contentDiv.appendChild(seasonDiv);

    select.addEventListener("change", function() {
        loadHTML(select.value);
    });

    loadHTML(currentYear); //Load current year results by default

    //Load results into the page
    async function loadHTML(year) {
        const result = await getSeasonResults(year); 
        const driversArray = result["driversArray"];
        const constructorsArray = result["constructorsArray"];

        seasonDiv.innerHTML = "";  

        const containerDiv = document.createElement("div");
        containerDiv.id = "seasons-container";
        containerDiv.style.display = "flex";
        containerDiv.style.justifyContent = "space-between"; 
        containerDiv.style.alignItems = "flex-start"; 
        seasonDiv.appendChild(containerDiv);

        // Drivers Section
        const driversDiv = document.createElement("div");
        driversDiv.id = "seasons-drivers";
        driversDiv.style.flex = "0 1 45%";
        driversDiv.style.paddingRight = "20px"; 
        const driversTitle = document.createElement("h3");
        driversTitle.id = "seasons-drivers-title";
        driversTitle.textContent = "Drivers:";
        driversDiv.appendChild(driversTitle);

        const driversList = document.createElement("ul");
        driversList.id = "seasons-drivers-list";
        driversList.style.listStyleType = "none";
        driversList.style.padding = "0";

        //Display every driver and their results 
        for (let i = 0; i < driversArray.length; i++) {
            const driverTeam = driversArray[i]["Team"];

            const li = document.createElement("li");
            li.id = `seasons-driver-${i}`;
            if (driverTeam in teamColours) {
                li.style.background = teamColours[driverTeam]["primary"];
            } else {
                li.style.background = "#8a8a8a";
            }

            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.padding = "5px 10px";

            const nameSpan = document.createElement("span");
            nameSpan.id = `seasons-driver-name-${i}`;
            nameSpan.style.flex = "1"; 
            nameSpan.style.marginRight = "10px"; 
            nameSpan.textContent = `${i + 1}:  ${driversArray[i].Name}`;
            li.appendChild(nameSpan);

            const pointsSpan = document.createElement("span");
            pointsSpan.id = `seasons-driver-points-${i}`;
            pointsSpan.style.width = "80px"; 
            pointsSpan.textContent = `Pts: ${driversArray[i].Points.toString().padEnd(4)}`;
            li.appendChild(pointsSpan);

            const teamSpan = document.createElement("span");
            teamSpan.id = `seasons-driver-team-${i}`;
            teamSpan.style.flex = "2";  
            teamSpan.textContent = `Team: ${driversArray[i].Team}`;
            li.appendChild(teamSpan);

            driversList.appendChild(li);
        }

        //Constructors (teams) section
        driversDiv.appendChild(driversList);
        containerDiv.appendChild(driversDiv);

        const constructorsDiv = document.createElement("div");
        constructorsDiv.id = "seasons-constructors";
        constructorsDiv.style.flex = "0 1 45%"; 
        const constructorsTitle = document.createElement("h3");
        constructorsTitle.id = "seasons-constructors-title";
        constructorsTitle.textContent = "Constructors:";
        constructorsDiv.appendChild(constructorsTitle);

        const constructorsList = document.createElement("ul");
        constructorsList.id = "seasons-constructors-list";
        constructorsList.style.listStyleType = "none";
        constructorsList.style.padding = "0";

        //Display every team in constructors array and their results
        for (let i = 0; i < constructorsArray.length; i++) {
            const li = document.createElement("li");
            li.id = `seasons-constructor-${i}`;
            const constructorName = constructorsArray[i]["Name"];

            if (constructorName in teamColours) {
                li.style.background = teamColours[constructorName]["primary"];
            } else {
                li.style.background = "#8a8a8a";
            }
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.padding = "5px 10px";

            const nameSpan = document.createElement("span");
            nameSpan.id = `seasons-constructor-name-${i}`;
            nameSpan.style.flex = "1";
            nameSpan.style.marginRight = "10px"; 
            nameSpan.textContent = `${i + 1}:  ${constructorsArray[i].Name}`;
            li.appendChild(nameSpan);

            const pointsSpan = document.createElement("span");
            pointsSpan.id = `seasons-constructor-points-${i}`;
            pointsSpan.style.width = "80px";
            pointsSpan.textContent = `Pts: ${constructorsArray[i].Points.toString().padEnd(4)}`;
            li.appendChild(pointsSpan);

            constructorsList.appendChild(li);
        }

        constructorsDiv.appendChild(constructorsList);
        containerDiv.appendChild(constructorsDiv);
    }
}
