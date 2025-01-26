import { checkLoginStatus } from "./login.js";
import { loadContent } from "./pages.js";
import { toggleLike, addComment } from "./contents.js";

const studentID = "M00931085";

//Follow user function
async function followUser(username) {
    try {
        const response = await fetch(`/${studentID}/follow`, { //Send the user's username in request
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user: username }) 
        });

        const result = await response.json();
        console.log(result) //Log the result

    } catch (error) {
        console.log(error); //Return any errors
    }
}
//Unfolllow a user function
async function unfollowUser(username) {
    try {
        const response = await fetch(`/${studentID}/follow`, {
            method: "DELETE", //Send delete request with the user's username
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user: username })
        });

        const result = await response.json();
        console.log(result) //Log the result

    } catch (error) {
        console.log(error); //Return any errors
    }
}
//Load a user's profile function
export async function loadProfile(username) {
    let buttonText = "Follow";
    let isFollowing = false;
    
    try {
        //Add support for image/video
        if (!document.getElementById('commentsModal')) {
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div id="commentsModal" class="modal">
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h3>Comments</h3>
                        <div class="comments-list"></div>
                        <div class="new-comment-section">
                            <input type="text" id="newCommentInput" placeholder="Write a comment...">
                            <button id="submitComment">Post</button>
                        </div>
                    </div>
                </div>
            `;
            modal.style.fontFamily = "helvetica";
            document.body.appendChild(modal.firstElementChild);
        }

        const modal = document.getElementById('commentsModal');
        const closeModal = document.querySelector('.close-modal');
        closeModal.onclick = () => modal.style.display = "none";

        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };

        //Check follow status
        const followingResponse = await fetch(`/${studentID}/follow/:${username}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const followingResult = await followingResponse.json();
        if (followingResult.following && followingResult.following.length > 0) {
            if (followingResult["following"].includes(username)) {
                buttonText = "Unfollow";
                isFollowing = true;
            }
        }

        //Get user's posts
        const postsResponse = await fetch(`/${studentID}/users/${username}/posts`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const postsResult = await postsResponse.json();
        const posts = postsResult.posts || [];

        const loginStatus = await checkLoginStatus();
        const isLoggedIn = loginStatus.status === "logged_in";
        const currentUser = loginStatus.username;

        //Display each post returned from the database
        let postsHTML = "";
        for (let i = posts.length - 1; i >= 0; i--) {
            const post = posts[i];
        
            let fileDisplay = "";
            //If post contains a file
            if (post.fileName) {
                const filePath = `/uploads/${post.fileName}`;
                const fileExtension = post.fileName.split(".").pop().toLowerCase();
                //If file is an image
                if (["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
                    fileDisplay = `
                        <div class="media-container">
                            <img src="${filePath}" alt="Uploaded content" class="post-image">
                        </div>`;
                } //If file is a video
                else if (["mp4", "webm"].includes(fileExtension)) {
                    fileDisplay = `
                        <div class="media-container">
                            <video controls class="post-video">
                                <source src="${filePath}" type="video/${fileExtension}">
                                Your browser does not support the video tag.
                            </video>
                        </div>`;
                }
            }

            //Display likes and comments
            let likesCount = post.likes ? post.likes.length : 0;
            let isLiked = post.likes && currentUser ? post.likes.includes(currentUser) : false;
            let commentsCount = post.comments ? post.comments.length : 0;

            const actionButtons = isLoggedIn ? `
                <div class="post-actions">
                    <button class="like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post._id}">
                        ${isLiked ? 'Unlike' : 'Like'} (${likesCount})
                    </button>
                    <button class="comment-btn" data-post-id="${post._id}">
                        Comments (${commentsCount})
                    </button>
                </div>
            ` : `
                <div class="post-actions">
                    <span>Likes: ${likesCount}</span>
                    <span>Comments: ${commentsCount}</span>
                </div>
            `;

            postsHTML += `
                <div class="post" data-post-index="${i}">
                    <div class="post-content">
                        <small>Posted by: ${post.username}</small>
                        <h3 class="post-title">${post.title}</h3>
                        <p class="post-description">${post.description}</p>
                        ${fileDisplay}
                        <div class="post-footer">
                            ${actionButtons}
                        </div>
                    </div>
                </div>
            `;
        }

        const profileTemplate = document.getElementById("profileTemplate");

        //Display folllow button based on whether the user is following the profile's owner
        let followButtonHTML = "";
        if (isLoggedIn && currentUser !== username) {
            followButtonHTML = `<button id="followButton">${buttonText}</button>`;
        }

        const postsSectionHTML = posts.length > 0 ? postsHTML : "<p>No posts yet.</p>";

        profileTemplate.innerHTML = `
            <div class="profile-header">
                <h2>${username}'s Profile</h2>
                ${followButtonHTML}
            </div>
            <div class="posts-section">
                <h3>Posts</h3>
                ${postsSectionHTML}
            </div>
        `;

        //Finally load the profile
        loadContent("profileTemplate");

        //Follow button listener
        const followButton = document.getElementById("followButton");
        if (followButton) {
            followButton.addEventListener("click", async () => {
                try {
                    if (isFollowing) {
                        await unfollowUser(username);
                        followButton.textContent = "Follow";
                        isFollowing = false;
                    } else {
                        await followUser(username);
                        followButton.textContent = "Unfollow";
                        isFollowing = true;
                    }
                } catch (error) {
                    console.log('Failed to update follow status:', error);
                    alert('Failed to update follow status. Please try again.');
                }
            });
        }

        // Like and comment listeners
        if (isLoggedIn) {
            // Like button listener
            document.querySelectorAll('.like-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const postId = event.target.dataset.postId;
                    try {
                        const result = await toggleLike(postId, currentUser);
                        const newLikeCount = result.likes.length;
                        const newIsLiked = result.liked;
                        button.textContent = `${newIsLiked ? 'Unlike' : 'Like'} (${newLikeCount})`;
                        button.className = `like-btn ${newIsLiked ? 'liked' : ''}`;
                    } catch (error) {
                        console.log('Failed to toggle like:', error);
                        alert('Failed to update like status. Please try again.');
                    }
                });
            });

            // Comment button listener
            document.querySelectorAll('.comment-btn').forEach((button) => {
                button.addEventListener('click', async (event) => {
                    const postId = event.target.dataset.postId;
                    const postElement = event.target.closest('.post');
                    const postIndex = posts.length - 1 - parseInt(postElement.dataset.postIndex);
                    const post = posts[postIndex];

                    modal.style.display = "block";
                    const commentsList = modal.querySelector('.comments-list');
                    commentsList.innerHTML = '';
                    
                    if (post.comments && post.comments.length > 0) {
                        post.comments.forEach(comment => {
                            const commentElement = document.createElement('div');
                            commentElement.className = 'comment';
                            commentElement.innerHTML = `<strong>${comment.username}:</strong> ${comment.text}`;
                            commentsList.appendChild(commentElement);
                        });
                    }

                    const submitComment = document.getElementById('submitComment');
                    const newCommentInput = document.getElementById('newCommentInput');
                    newCommentInput.value = '';
                    //Submit comments
                    const handleSubmit = async () => {
                        const commentText = newCommentInput.value.trim();
                        if (commentText) {
                            try {
                                const result = await addComment(postId, currentUser, commentText);
                                
                                const commentElement = document.createElement('div');
                                commentElement.className = 'comment';
                                commentElement.innerHTML = `<strong>${currentUser}:</strong> ${commentText}`;
                                commentsList.appendChild(commentElement);
                                
                                post.comments = post.comments || [];
                                post.comments.push({ username: currentUser, text: commentText });
                                button.textContent = `Comments (${post.comments.length})`;
                                
                                newCommentInput.value = '';
                                
                            } catch (error) {
                                console.log('Failed to add comment:', error);
                                alert('Failed to add comment. Please try again.');
                            }
                        }
                    };
                    //Submit comments by clicking "enter"
                    submitComment.onclick = handleSubmit;
                    newCommentInput.onkeypress = (e) => {
                        if (e.key === 'Enter') {
                            handleSubmit();
                        }
                    };
                });
            });
        }

    } catch (error) {
        console.log(error); //Show any errors
    }
}