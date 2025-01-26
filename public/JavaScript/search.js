import { loadProfile } from "./profile.js";

//Display user search results
export function displaySearchResults(users) {
    const overlay = document.querySelector(".popup-overlay");
    const searchResults = document.getElementById("searchResults");
    
    searchResults.innerHTML = '';
    //If no users have been found
    if (users.length === 0) {
        searchResults.innerHTML = "<p>No users found</p>";
    } else { //Display each user that has been found
        users.forEach(user => {
            const userDiv = document.createElement("div");
            userDiv.className = "user-result";
            //Link to user profile
            userDiv.innerHTML = ` 
                <a href="#" class="username-link">${user.username}</a>
            `;
            const usernameLink = userDiv.querySelector(".username-link");
            usernameLink.addEventListener("click", (event) => {
                event.preventDefault();
                loadProfile(user.username);
                closeSearchPopup();
            });

            searchResults.appendChild(userDiv);
        });
    }
    
    overlay.style.display = "block";
    //Close button listener
    document.getElementById("closeSearchButton").addEventListener("click", closeSearchPopup);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closeSearchPopup();
        }
    });
}

//Close search popup function
function closeSearchPopup() {
    const overlay = document.querySelector(".popup-overlay");
    overlay.style.display = "none";
}