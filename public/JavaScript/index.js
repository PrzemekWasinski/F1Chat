import { logOut, checkLoginStatus, applyTheme } from "./login.js";
import { loadSeasonsTemplate } from "./api.js";
import { displaySearchResults } from "./search.js";
import { handleUpload } from "./contents.js";
import { loadContent } from "./pages.js";

//When loading the website in
window.onload = async function() {
    document.getElementById("logOutButton").style.display = "none";
    document.getElementById("loginPageButton").style.display = "block";
    await checkLoginStatus();
    loadContent("homeTemplate");
    applyTheme("Default")
    document.getElementById('uploadForm').addEventListener('submit', handleUpload());
};

const studentID = "M00931085";

//Listeners for navigation bar buttons
document.getElementById("homePageButton").addEventListener("click", function() {
    loadContent("homeTemplate");
});

document.getElementById("loginPageButton").addEventListener("click", function() {
    loadContent("loginTemplate");
});

document.getElementById("seasonsButton").addEventListener("click", function() {
    loadSeasonsTemplate();
});

document.getElementById("logOutButton").addEventListener("click", function() {
    logOut();
})

//User Search
const userSearchInput = document.getElementById("userSearch");
const userSearchButton = document.getElementById("userSearchButton");

const overlay = document.createElement("div");
overlay.className = "popup-overlay";
document.body.appendChild(overlay);

// Create popup
const searchPopupContainer = document.createElement("div");
searchPopupContainer.innerHTML = `
    <div id="searchPopup">
        <div class="popup-content">
            <div class="search-header">
                <h3 class="search-title">Search Results</h3>
                <button id="closeSearchButton" class="close-button">×</button>
            </div>
            <div id="searchResults"></div>
        </div>
    </div>
`;
overlay.appendChild(searchPopupContainer);

//Listen for user search
userSearchButton.addEventListener("click", async () => {
    const searchTerm = userSearchInput.value.trim();
    if (searchTerm === "") return;

    try {
        const response = await fetch(`/${studentID}/users/search?term=${encodeURIComponent(searchTerm)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const users = await response.json();
        displaySearchResults(users, searchTerm);
    } catch (error) {
        console.error(`${error} from: User search GET`);
    }
});