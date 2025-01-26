import { login, checkLoginStatus } from "./login.js";
import { register } from "./register.js";
import { loadPosts, handleUpload, upload, closePopup, displayPosts } from "./contents.js";

const studentID = "M00931085";

//Load pages into content div
export async function loadContent(templateId) { 
    const contentDiv = document.getElementById("content");
    const template = document.getElementById(templateId);
    
    contentDiv.innerHTML = ""; 
    contentDiv.appendChild(template.content.cloneNode(true)); 

    const loginStatus = await checkLoginStatus();

    //Display the right button for logout/login
    if (loginStatus["status"] === "logged_in") {
        document.getElementById("loginPageButton").style.display = "none";
        document.getElementById("logOutButton").style.display = "block";
    } else {
        document.getElementById("logOutButton").style.display = "none";
        document.getElementById("loginPageButton").style.display = "block";
    }

    if (templateId === "homeTemplate") { //If current page is home page
        if (loginStatus["status"] !== "logged_in") {
            document.getElementById("followedPostsToggle").style.display = "none";
        }
        //Check what show followed posts button should say
        const followedPostsToggle = document.getElementById("followedPostsToggle");
        if (followedPostsToggle) {
            followedPostsToggle.addEventListener("click", async function() {
                const button = this;
                try {
                    if (loginStatus.status !== "logged_in") {
                        return;
                    }
        
                    const showingFollowed = button.textContent === "Show All Posts";
                    button.disabled = true;
        
                    await loadPosts(!showingFollowed);
                    
                    button.textContent = showingFollowed 
                        ? "Show Followed Users' Posts"
                        : "Show All Posts";
        
                } catch (error) {
                    console.log(error);
                } finally {
                    button.disabled = false;
                }
            });
        }
        try { //Load all posts
            await loadPosts();

            const loginResponse = await checkLoginStatus();
            const loginStatus = typeof loginResponse === 'string' ? JSON.parse(loginResponse) : loginResponse;
            //Show upload button only if logged in
            const uploadButton = document.getElementById("uploadButton");
            if (uploadButton && loginStatus.status === "logged_in") {
                uploadButton.style.display = "block";
            }

            const uploadForm = document.getElementById("uploadForm");
            if (uploadForm) {
                uploadForm.addEventListener("submit", handleUpload);
            }
            //Listen for search button input
            const searchButton = document.getElementById("postSearchButton");
            if (searchButton) {
                searchButton.addEventListener("click", async function() {
                    const searchQuery = document.getElementById("postSearch").value.trim();
                    
                    try {
                        let posts;
                        const response = await fetch(searchQuery //If search is empty show all posts, otherwise show search results
                            ? `/${studentID}/contents/search?q=${encodeURIComponent(searchQuery)}`
                            : `/${studentID}/contents/all`, {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json"
                            }
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const text = await response.text();
                        if (!text) {
                            throw new Error('Empty response received');
                        }

                        try {
                            posts = JSON.parse(text);
                        } catch (error) {
                            console.log('Failed to parse JSON:', text);
                            throw new Error('Invalid JSON response');
                        }

                        if (!Array.isArray(posts) || posts.length === 0) {
                            const postsContainer = document.getElementById("posts-container");
                            postsContainer.innerHTML = "<p>No posts found matching your search.</p>";
                            return;
                        }
                        //Display the posts retrieved from the database
                        await displayPosts(posts);

                    } catch (error) {
                        console.log('Search error:', error);
                        const postsContainer = document.getElementById("posts-container");
                        postsContainer.innerHTML = `<p>Error searching posts: ${error.message}</p>`;
                    }
                });
            }
            //Listen for upload button clicks
            const uploadButtonElement = document.getElementById("uploadButton");
            if (uploadButtonElement) {
                uploadButtonElement.addEventListener("click", function() {
                    upload();
                });
            }
            //Listen for close popup button clicks
            const closeUploadPopupElement = document.getElementById("closeUploadPopup");
            if (closeUploadPopupElement) {
                closeUploadPopupElement.addEventListener("click", function() {
                    closePopup();
                });
            }

        } catch (error) {
            console.log('Error in loadContent:', error);
            contentDiv.innerHTML = `<p>Error loading content: ${error.message}</p>`;
        }

    } else if (templateId === "loginTemplate") { //If current page is login page
        const loginButton = document.getElementById("loginButton");
        //Listen for login button clicks
        if (loginButton) {
            loginButton.addEventListener("click", function() {
                login();
            });
        }

        const registerPageButton = document.getElementById("loginRegisterPageButton");

        if (registerPageButton) { //If the register button exists listen for clicks
            registerPageButton.addEventListener("click", function() {
                const contentDiv = document.getElementById("content");
                const template = document.getElementById("registerTemplate");

                if (template) { //Load register page
                    contentDiv.innerHTML = "";
                    contentDiv.appendChild(template.content.cloneNode(true));
                } else {
                    console.log("registerTemplate not found");
                }

                const registerButton = document.getElementById("registerButton");
                if (registerButton) {
                    registerButton.addEventListener("click", function() {
                        register();
                    });
                }
            });
        }
    }
}