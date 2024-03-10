import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { connect } from "./config.js";
import { userModel } from "./models/user.model.js";
import { chatModel } from "./models/chat.schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const server = createServer(app);

const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", async function (socket) {
  console.log("Connection is established");

  // Send last 50 messages to new user

  socket.on("newuser", async function (username) {
    socket.username = username;

    const lastMessages = await chatModel
      .find()
      .sort({ timestamp: -1 })
      .limit(50);
    socket.emit(
      "load_messages",
      lastMessages.map((message) => ({
        username: message.username,
        text: message.message,
      }))
    );

    const oldUser = await userModel.findOne({ name: socket.username });

    if (!oldUser) {
      const newUser = new userModel({
        name: username,
      });
      await newUser.save();

      socket.broadcast.emit(
        "update",
        `Welcome to the ChatterUp ${username}... Happy Chatting :)`
      );
    } else {
      socket.broadcast.emit("update", username + " joined the conversation");
    }
  });
  socket.on("exituser", function (username) {
    socket.broadcast.emit("update", username + " left the conversation");
  });

  socket.on("chat", async function (message) {
    const newChat = new chatModel({
      username: socket.username,
      message: message.text,
      timestamp: new Date(),
    });

    await newChat.save();

    socket.broadcast.emit("chat", message);
  });

  socket.on("disconnect", () => {
    console.log("Connection is disconnected");
  });
});

server.listen(5000, () => {
  console.log("Server is listening on port 5000...");
  connect();
});
