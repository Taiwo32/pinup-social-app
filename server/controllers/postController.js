import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Post from "../models/post.js";
import userModel from "../models/userModel.js";


// Add Post
export const addPost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { content, post_type, } = req.body;
        const images = req.files; // Assuming images are sent as multipart/form-data

        let image_urls = [];

        if (images.length) {
            image_urls = await Promise.all(
                images.map(async (image) => {
                    const fileBuffer = fs.readFileSync(image.path);
                    const response = await imagekit.upload({
                        file: fileBuffer,
                        fileName: image.originalname,
                        folder: "posts",
                    });

                    const url = imagekit.url({
                        path: response.filePath,
                        transformation: [
                            { quality: 'auto' },
                            { format: 'webp' },
                            { width: '1280' }
                        ]
                    })
                    return url;
                })
            )
        }

        await Post.create({
            user: userId,
            content,
            post_type,
            image_urls,
        })
        return res.json({ success: true, message: "Post created successfully" });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
}

// get posts of a user 

export const getFeedPosts = async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await userModel.findById(userId)

        // user connections and followings

        const userIds =  [userId, ...user.connections, ...user.following];
        const posts = await Post.find({ user: { $in: userIds } }).populate('user', ).sort({ createdAt: -1 })

        return res.json({ success: true, posts });


    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
        
    }
}

//like post 

export const likePosts = async (req, res) => {
    try {
        
        const { userId } = req.auth();
        const { postId } = req.body;

        const post = await Post.findById(postId);

        if (post.likes_count.includes(userId)) {
            post.likes_count = post.likes_count.filter(user => user !== userId )
            await post.save();
            return res.json({ success: true, message: "Post unliked successfully" });
        } else {
            post.likes_count.push(userId);
            await post.save();
            return res.json({ success: true, message: "Post liked successfully" });
        }

    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
        
    }
}
