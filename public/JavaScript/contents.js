import { checkLoginStatus } from "./login.js";
import { loadProfile } from "./profile.js";

const studentID = "M00931085";

const allowedExtensions = ["jpg", "jpeg", "png", "gif", "mp4", "webm", "mp3", "wav"]; 

//Show upload popup
export function upload() {
    document.getElementById("uploadPopup").style.display = "block";
}

//Close upload popup
export function closePopup() {
    document.getElementById("uploadPopup").style.display = "none";
}

//Upload files
export async function handleUpload(event) {
    event.preventDefault();
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const fileInput = document.querySelector("input[type='file']");
    const file = fileInput.files[0];

    try {
        if (file) {
            // Get file extension and check if it's allowed
            const fileExtension = file.name.split(".").pop().toLowerCase();
            if (!allowedExtensions.includes(fileExtension)) {
                console.log("Invalid file type");
                return;
            }
        }

        let formData = new FormData(); // Using FormData to handle file uploads
        formData.append('title', title);
        formData.append('description', description);
        formData.append('likes', []);
        formData.append('comments', []);
        
        if (file) {
            formData.append('uploadFile', file); // Add the file to the FormData
        }

        const response = await fetch(`/${studentID}/contents`, {
            method: "POST",
            body: formData // Send FormData with file
        });

        const result = await response.json();
        if (response.ok) { 
            document.getElementById("uploadPopup").style.display = "none";
            await loadPosts();
            document.getElementById("uploadForm").reset();
        } else {
            console.log(result);
        }
    } catch (error) {
        console.log("Upload error:", error);
    }
}

// Get posts
export async function loadPosts(followedOnly = false) {
    try { 
        // If show followed only is clicked, fetch followed only, else get all
        const endpoint = followedOnly ? `/${studentID}/contents` : `/${studentID}/contents/all`;
        
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            credentials: "same-origin"
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log(errorData);
            
            if (errorData.error === "Database connection error") {
                return await loadPosts(followedOnly);
            }
        }

        const posts = await response.json();
        await displayPosts(posts);
    } catch (error) {
        console.log(error);
    }
}


//Check if like button status should be liked or not
export async function toggleLike(postId, username) {
    try {
        const response = await fetch(`/M00931085/contents/${postId}/like`, {
            method: "POST",
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log(errorData.message)
        }

        return await response.json();
    } catch (error) {
        console.log(error);
    }
}

//Add comments to posts
export async function addComment(postId, username, comment) {
    try {
        const response = await fetch(`/M00931085/contents/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, comment })
        });


        return await response.json();
    } catch (error) {
        console.log('Error in addComment:', error);
    }
}

//Get comments from posts
export async function getComments(postId) {
    try {
        const response = await fetch(`/${studentID}/contents/${postId}/comments`);

        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }

        const comments = await response.json();
        return comments;
    } catch (error) {
        console.log('Error in getComments:', error);
    }
}

//Display posts
export async function displayPosts(posts) {
    const postsContainer = document.getElementById("posts-container");
    while (postsContainer.firstChild) {
        postsContainer.removeChild(postsContainer.firstChild);
    }
    //HTML for each post
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
        modal.style.fontFamily = "helvetica"
        document.body.appendChild(modal.firstElementChild);

        if (!document.getElementById('commentsModalStyle')) {
            const style = document.createElement('style');
            document.head.appendChild(style);
        }
    }

    const loginStatus = await checkLoginStatus();
    const isLoggedIn = loginStatus.status === "logged_in";
    const currentUsername = loginStatus.username;

    const modal = document.getElementById('commentsModal');
    const closeModal = document.querySelector('.close-modal');
    closeModal.onclick = () => modal.style.display = "none";

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    //If posts array is empty, display error message
    if (!Array.isArray(posts) || posts.length === 0) {
        console.log('No posts to display');
        return;
    }

    const fragment = document.createDocumentFragment();

    //For each post in posts array display the post
    for (let i = posts.length - 1; i >= 0; i--) {
        const post = posts[i];

        const postElement = document.createElement("div");
        postElement.className = "post";
        
        let fileDisplay = "";
        if (post.fileName) {
            const filePath = `/uploads/${post.fileName}`;
            const fileExtension = post.fileName.split(".").pop().toLowerCase();
            //Display post correctly based on its extension
            if (["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
                fileDisplay = `
                    <div class="media-container">
                        <img src="${filePath}" alt="Uploaded content" class="post-image">
                    </div>`;
            }
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

        let likesCount = 0;
        if (post.likes) {
            likesCount = post.likes.length;
        }

        let isLiked = false;
        if (post.likes && currentUsername) {
            if (post.likes.includes(currentUsername)) {
                isLiked = true;
            }
        }

        let commentsCount = 0;
        if (Array.isArray(post.comments)) {
            commentsCount = post.comments.length;
        }

        //Set buttons status in the posts
        const actionButtons = isLoggedIn ? `
            <div class="post-actions">
                <button class="like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post._id}">
                    ${isLiked ? 'Unlike' : 'Like'} (${likesCount})
                </button>
                <button class="comment-btn" data-post-id="${post._id}">
                    Comment (${commentsCount})
                </button>
            </div>
        ` : `
            <div class="post-actions">
                <span>Likes: ${likesCount}</span>
                <span>Comments: ${commentsCount}</span>
            </div>
        `;

        postElement.innerHTML = `
            <small>Posted by: 
                <a href="#" class="username-link" data-username="${post.username}">
                    ${post.username}
                </a>
            </small>
            <h3>${post.title}</h3>
            <p>${post.description}</p>
            ${fileDisplay}
            <div class="post-footer">
                ${actionButtons}
            </div>
        `;

        const usernameLink = postElement.querySelector(".username-link");
        usernameLink.addEventListener("click", async (event) => {
            event.preventDefault();
            await loadProfile(post.username);
        });

        if (isLoggedIn) { //Listen for like button clicks
            const likeBtn = postElement.querySelector(".like-btn");
            likeBtn.addEventListener("click", async () => {
                try {
                    const result = await toggleLike(post._id, currentUsername);
                    const newLikeCount = result.likes.length;
                    const newIsLiked = result.liked;
                    likeBtn.textContent = `${newIsLiked ? 'Unlike' : 'Like'} (${newLikeCount})`;
                    likeBtn.className = `like-btn ${newIsLiked ? 'liked' : ''}`;
                    post.likes = result.likes;
                } catch (error) {
                    console.error('Failed to toggle like:', error);
                }
            });
            //Listen for comment button clicks
            const commentBtn = postElement.querySelector(".comment-btn");
            commentBtn.addEventListener("click", async () => {
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

                const newCommentInput = document.getElementById('newCommentInput');
                const submitComment = document.getElementById('submitComment');
                
                const newSubmitComment = submitComment.cloneNode(true);
                submitComment.parentNode.replaceChild(newSubmitComment, submitComment);

                newSubmitComment.addEventListener('click', async () => {
                    const commentText = newCommentInput.value.trim();
                    if (commentText) {
                        try {
                            const result = await addComment(post._id, currentUsername, commentText);
                            //Add the comment to the comments popup
                            const commentElement = document.createElement('div');
                            commentElement.className = 'comment';
                            commentElement.innerHTML = `<strong>${currentUsername}:</strong> ${commentText}`;
                            commentsList.appendChild(commentElement);
                            
                            commentBtn.textContent = `Comment (${post.comments.length})`;
                            newCommentInput.value = '';
                            
                        } catch (error) {
                            console.log(error);
                        }
                    }
                });
            });
        }
        
        fragment.appendChild(postElement);
    }

    postsContainer.appendChild(fragment);
}