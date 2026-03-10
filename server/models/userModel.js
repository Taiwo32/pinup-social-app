import mongoose from "mongoose";
import Post from "./post.js";
import Story from "./Story.js";
import Message from "./Message.js";
import Connection from "./Connections.js";

const userSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    email: {type: String, required: true,},
    full_name: {type: String, required: true},
    username: {type: String, unique: true},
    bio: {type: String, default: "Hey there i am using PingUp App."},
    profile_picture: {type: String, default: " "},
    cover_photo: {type: String, default: " "},
    location: {type: String, default: " "},
    followers: [{type: String, ref: 'User'}, ],
    following: [{type: String, ref: 'User'}, ],
    connections: [{type: String, ref: 'User'}, ],

},{timestamps: true, minimize: false});

/* CASCADE DELETE MIDDLEWARE */

userSchema.pre("findOneAndDelete", async function (next) {
  const userId = this.getQuery()._id;

  await Post.deleteMany({ user: userId });

  await Story.deleteMany({ user: userId });

  await Message.deleteMany({
    $or: [
      { from_user_id: userId },
      { to_user_id: userId }
    ]
  });

  await Connection.deleteMany({
    $or: [
      { from_user_id: userId },
      { to_user_id: userId }
    ]
  });

  next();
});

const userModel = mongoose.model('User', userSchema);

export default userModel;