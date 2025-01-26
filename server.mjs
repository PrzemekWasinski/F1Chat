import bodyParser from "body-parser";
import express from "express";
import path from "path";
import fs from "fs";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import session from "express-session";
import fileUpload from "express-fileupload";

const fileName = "server.mjs";
const studentID = "M00931085";

//Set up express
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: "cookie",
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 //24 hours
    }
}));

app.use(fileUpload({
    createParentPath: true
}));

app.use(express.static("public"));

const connectionURI = "mongodb://127.0.0.1:27017?retryWrites=true&w=majority";

const client = new MongoClient(connectionURI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
    }
});

let database;
let userCollection;
let postCollection;

async function connectToMongo() {
    if (!client.topology || !client.topology.isConnected()) {
        try {
            await client.connect();
            database = client.db("cst2120");
            userCollection = database.collection("users");
            postCollection = database.collection("content");
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }
    return { database, userCollection, postCollection };
}

app.use(async (req, res, next) => {
    try {
        await connectToMongo();
        next();
    } catch (error) {
        console.error('Database connection middleware error:', error);
        res.status(500).json({ error: 'Database connection error' });
    }
});


// MongoDB Functions

//Check if a user exists
async function findUsername(username) {
    await client.connect(); 
    const query = { "username": username };
    const results = await userCollection.find(query).toArray();
    await client.close();
    return results;
}

//Find user's team
async function findTeam(username) {
    await client.connect();
    const query = { "username": username };
    const result = await userCollection.find(query).toArray();
    const userTeam = result[0]["team"];
    await client.close();
    return userTeam;
}

//Check if username and password match
async function checkLogin(username, password) {
    await client.connect();
    const query = {$and: [{"username": username}, {"password": password}]};
    const results = await userCollection.find(query).toArray();
    await client.close();
    return results;
}

//Add a new user
async function insertOne(userJSON) {
    await client.connect();
    await userCollection.insertOne(userJSON);
    await client.close();
}

//Retrieve all posts
async function getAllPosts() {
    await client.connect();
    const results = await postCollection.find({}).toArray();
    await client.close();
    return results;
}
//Create a post
async function createPost(postData) {
    await client.connect();
    await postCollection.insertOne(postData);
    await client.close();
}

//Follow a user
async function followUser(user, req) {
    if (!req.session.user) {
        console.log("User error from: followUser()")
    }

    // Check if user is trying to follow themselves
    if (user === req.session.user.username) {
        console.log("You cannot follow yourself")
    }

    await client.connect();
    const query = { username: req.session.user.username };
    
    const currentUser = await userCollection.findOne(query);
    if (!currentUser) {
        await client.close();
        console.log("User not found")
    }

    const newFollows = currentUser.follows || [];
    if (!newFollows.includes(user)) {
        newFollows.push(user);
        const updateDoc = {$set: {follows: newFollows}};
        const updateResults = await userCollection.updateOne(query, updateDoc);
        console.log("Follow update results:", updateResults);
    }
    
    await client.close();
    return "Successfully followed user";
}

//Unfollow a user
async function unfollowUser(user, req) {
    if (!req.session.user) {
        console.log("User error from unfollowUser()")
    }

    await client.connect();
    const query = { username: req.session.user.username };
    
    const currentUser = await userCollection.findOne(query);
    if (!currentUser) {
        await client.close();
        console.log("User not found")
    }

    const newFollows = (currentUser.follows || []).filter(username => username !== user);
    
    const updateDoc = {$set: {follows: newFollows}};
    const updateResults = await userCollection.updateOne(query, updateDoc);
    console.log("Unfollow update results:", updateResults);
    
    await client.close();
    return "Successfully unfollowed user";
}

// Loading the page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get login status
app.get(`/${studentID}/login`, (req, res) => {
    if (req.session.user) {
        res.send({
            "status": "logged_in",
            "username": req.session.user.username,
            "message": "User is currently logged in"
        });
    } else {
        res.send({
            "status": "logged_out",
            "message": "No active session"
        });
    }
});

// Login
app.post(`/${studentID}/login`, async (req, res) => {
    try {
        const results = await checkLogin(req.body["username"], req.body["password"]);
        if (results.length > 0) {
            req.session.user = {
                username: req.body["username"],
            };
            const result = await findTeam(req.body["username"]);
            res.send({
                "status": "success",
                "message": "Login successful",
                "username": req.session.user.username,
                "team": result
            });
        } else {
            res.send({
                "status": "error",
                "message": "Username or password incorrect"
            });
        }
    } catch (error) {
        console.log(`${error} (from ${fileName})`);
        res.send({
            "status": "error",
            "message": "Server error"
        });
    }
});

// Logout
app.delete(`/${studentID}/login`, (req, res) => {
    if (req.session.user) {
        req.session.destroy(function(error) {
            if (error) {
                res.send({
                    "status": "error",
                    "message": "Error during logout"
                });
            } else {
                res.send({
                    "status": "success",
                    "message": "Successfully logged out"
                });
            }
        });
    } else {
        res.send({
            "status": "error",
            "message": "No active session to logout"
        });
    }    
});

// Register
app.post(`/${studentID}/users`, async (req, res) => {
    try {
        const username = await findUsername(req.body["username"]);

        if (username.length > 0) {
            console.log(`Username: ${req.body["username"]} already exists (from ${fileName})`);
            res.send({"message": "Username already exists"});
        } else {
            await insertOne(req.body);
            console.log(`User: ${req.body["username"]} added to database (from ${fileName})`);
            res.send({"message": "User added successfully"});
        }
    } catch (error) {
        console.log(`${error} (from ${fileName})`);
        res.send({"message": "Server error"});
    }
});

// Your existing post endpoint
app.post(`/${studentID}/contents`, async (req, res) => {
    try {
        let fileName = null;

        // Check if files were uploaded
        if (req.files && req.files.uploadFile) {
            const uploadFile = req.files.uploadFile; // Get the uploaded file
            const uploadsDir = './public/uploads'; // Path to uploads folder

            // Ensure uploads directory exists
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Define the upload path (file will be saved with its original name)
            const uploadPath = path.join(uploadsDir, uploadFile.name);

            try {
                // Move the uploaded file to the uploads folder
                await uploadFile.mv(uploadPath);
                fileName = uploadFile.name; // Set the file name to save in the database
            } catch (uploadError) {
                console.error("File upload error:", uploadError);
                return res.status(500).json({ "message": "Error uploading file" });
            }
        }

        // Log the incoming request body for debugging
        console.log(req.body);

        // Prepare the post data to save in the database
        const postData = {
            username: req.session.user.username,
            title: req.body.title,
            description: req.body.description,
            likes: req.body.likes,
            comments: req.body.comments,
            fileName: fileName // Save the uploaded file's name or path in the database
        };

        // Function to create the post (implement this based on your DB setup)
        await createPost(postData);

        // Send success response
        res.json({ "message": "Post created successfully" });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ "message": "Error creating post" });
    }
});


//Retrieve all posts in the database
app.get(`/${studentID}/contents/all`, async (req, res) => {
    try {
        await connectToMongo();
        const posts = await getAllPosts();
        res.json(posts);
    } catch (error) {
        console.error('Error fetching all posts:', error);
        res.status(500).json({ 
            error: 'Failed to fetch posts',
            message: error.message 
        });
    }
});

//Like a post
app.post(`/${studentID}/contents/:postId/like`, async (req, res) => {
    try {
        const { studentId, postId } = req.params;
        const { username } = req.body;
        console.log(postId)

        console.log("Like request:", { studentId, postId, username });

        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        await connectToMongo();

        if (!ObjectId.isValid(postId)) {
            return res.status(400).json({ error: "Invalid post ID format" });
        }

        // Find the post
        const post = await postCollection.findOne({ _id: new ObjectId(postId) });
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        let currentLikes = [];
        if (post.likes) {
            currentLikes = Array.isArray(post.likes) ? post.likes : [];
        }

        await postCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $set: { likes: currentLikes } }
        );

        const userLikedIndex = currentLikes.indexOf(username);
        let updatedLikes;
        
        if (userLikedIndex === -1) {
            updatedLikes = [...currentLikes, username];
            await postCollection.updateOne(
                { _id: new ObjectId(postId) },
                { $set: { likes: updatedLikes } }
            );
            res.json({ message: 'Post liked', liked: true, likes: updatedLikes });
        } else {
            updatedLikes = currentLikes.filter(user => user !== username);
            await postCollection.updateOne(
                { _id: new ObjectId(postId) },
                { $set: { likes: updatedLikes } }
            );
            res.json({ message: 'Post unliked', liked: false, likes: updatedLikes });
        }

    } catch (error) {
        console.error('Error in like/unlike:', error);
        res.status(500).json({ 
            error: 'Failed to process like/unlike',
            message: error.message 
        });
    }
});

//Comment on a post
app.post(`/${studentID}/contents/:postId/comment`, async (req, res) => {
    try {
        const { studentId, postId } = req.params;
        const { username, comment } = req.body;

        await connectToMongo();

        if (!comment || !username) {
            return res.status(400).json({ error: 'Comment and username are required' });
        }

        // Find the post
        const post = await postCollection.findOne({ _id: new ObjectId(postId) });
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (!Array.isArray(post.comments)) {
            await postCollection.updateOne(
                { _id: new ObjectId(postId) },
                { $set: { comments: [] } }
            );
        }

        const newComment = {
            id: new ObjectId(),
            username: username,
            text: comment
        };

        const result = await postCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $push: { comments: newComment } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({ 
            message: 'Comment added successfully',
            comment: newComment
        });

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ 
            error: 'Failed to add comment',
            message: error.message 
        });
    }
});

//Get comments
app.get(`/${studentID}/contents/:postId/comments`, async (req, res) => {
    try {
        const { studentId, postId } = req.params;
        await connectToMongo();

        //Find the post
        const post = await postCollection.findOne(
            { _id: new ObjectId(postId) },
            { projection: { comments: 1 } }
        );

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(post.comments || []);

    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ 
            error: 'Failed to fetch comments',
            message: error.message 
        });
    }
});

//Get posts of users the current user follows
app.get(`/${studentID}/contents`, async (req, res) => {
    try {
        await connectToMongo();
        
        if (!req.session.user) {
            return res.status(401).json({ error: 'User not logged in' });
        }

        const currentUser = await userCollection.findOne({ 
            username: req.session.user.username 
        });

        if (!currentUser || !currentUser.follows) {
            return res.json([]);
        }

        const posts = await postCollection.find({
            username: { $in: currentUser.follows }
        }).toArray();

        res.json(posts);
    } catch (error) {
        console.error('Error fetching followed users posts:', error);
        res.status(500).json({ 
            error: 'Failed to fetch posts',
            message: error.message 
        });
    }
});

//Get following status of a user
app.get(`/${studentID}/follow/:username`, async (req, res) => {
    try {
        if (!req.session.user) {
            return res.json({
                status: "error",
                message: "User not authenticated"
            });
        }

        await client.connect();
        const query = { username: req.session.user.username };
        const results = await userCollection.findOne(query);
        
        if (!results) {
            await client.close();
            return res.json({
                status: "error",
                message: "User not found"
            });
        }

        await client.close();
        res.json({
            status: "success",
            following: results.follows || []
        });
    } catch (error) {
        console.error("Error in following route:", error);
        res.json({
            status: "error",
            message: error.message
        });
    }
});

//Follow a user
app.post(`/${studentID}/follow`, async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                status: "error",
                message: "User not authenticated"
            });
        }

        const result = await followUser(req.body.user, req);
        console.log(result)
        res.json({
            status: "success",
            message: "Successfully followed user"
        });
    } catch (error) {
        res.json({
            status: "error",
            message: error.message
        });
    }
});

//Unfollow a user
app.delete(`/${studentID}/follow`, async (req, res) => {
    try {
        if (!req.session.user) {
            return res.json({
                status: "error",
                message: "User not authenticated"
            });
        }

        const result = await unfollowUser(req.body.user, req);
        console.log(result)
        res.json({
            status: "success",
            message: "Successfully unfollowed user"
        });
    } catch (error) {
        res.json({
            status: "error",
            message: error.message
        });
    }
});

//Search for posts by title
app.get(`/${studentID}/contents/search`, async (req, res) => {
    try {
        const { studentId } = req.params;
        const searchQuery = req.query.q;

        if (!searchQuery) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        await connectToMongo();

        const searchRegex = new RegExp(searchQuery, 'i');
        const posts = await postCollection.find({
            $or: [
                { title: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ]
        }).toArray();

        res.json(posts);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Failed to search posts',
            message: error.message 
        });
    }
});

//Search for users by username
app.get(`/${studentID}/users/search`, async (req, res) => {
    await client.connect();
    try {
        const searchTerm = req.query.term;
        const studentID = req.params.studentID;
        
        console.log("Search request received:", { studentID, searchTerm }); 

        if (!searchTerm) {
            console.log("No search term provided");
            return res.json({ error: "Search term is required" });
        }

        const users = await userCollection.find({
            username: { $regex: searchTerm, $options: "i" }
        }).project({
            username: 1,
            _id: 0
        }).limit(10).toArray();

        console.log("Search results:", users); // Debug log

        res.json(users);
        await client.close();
    } catch (error) {
        console.error("Detailed search error:", error);
        res.json({ 
            error: "Internal server error", 
            details: error.message 
        });
        await client.close();
    }
});

//Search for a certain user's posts
app.get(`/${studentID}/users/:username/posts`, async (req, res) => {
    await client.connect();
    try {
        const username = req.params.username;
        
        const posts = await postCollection.find({ 
            username: username 
        }).toArray();

        res.json({
            status: "success",
            posts: posts
        });
        await client.close();
    } catch (error) {
        console.error("Error fetching user posts:", error);
        res.json({
            status: "error",
            message: error.message
        });
        await client.close();
    }
});

//Call API to get a certain year's season results
app.get(`/${studentID}/f1-standings/:year`, async (req, res) => {
    const year = req.params.year;
    const driversArray = [];
    const constructorsArray = [];
    const api = `https://ergast.com/api/f1/${year}`;

    try {
        const driverResponse = await fetch(`${api}/driverStandings.json`);
        if (!driverResponse.ok) {
            throw new Error(`Failed to fetch driver standings: ${driverResponse.status}`);
        }
        const driverData = await driverResponse.json();

        const constructorResponse = await fetch(`${api}/constructorStandings.json`);
        if (!constructorResponse.ok) {
            throw new Error(`Failed to fetch constructor standings: ${constructorResponse.status}`);
        }
        const constructorData = await constructorResponse.json();

        const drivers = driverData.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings;
        if (drivers) {
            drivers.forEach(driver => {
                driversArray.push({
                    Position: driver.position,
                    Name: `${driver.Driver.givenName} ${driver.Driver.familyName}`,
                    Team: driver.Constructors[0].name,
                    Points: driver.points
                });
            });
        }

        const constructors = constructorData.MRData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings;
        if (constructors) {
            constructors.forEach(constructor => {
                constructorsArray.push({
                    Position: constructor.position,
                    Name: constructor.Constructor.name,
                    Points: constructor.points
                });
            });
        }

        res.json({
            success: true,
            data: {
                driversArray,
                constructorsArray
            }
        });

    } catch (error) {
        console.error('Error fetching F1 standings:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch F1 standings'
        });
    }
});



//Connect to mongoDB
connectToMongo().catch(console.error);

//Listen on port 8080
app.listen(8080, () => {
    console.log("Express listening on port 8080");
});


