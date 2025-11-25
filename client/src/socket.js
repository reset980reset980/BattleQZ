import { io } from "socket.io-client";

// Connect to the server (assuming localhost:3000 for now)
const URL = "http://localhost:3000";
const socket = io(URL, { autoConnect: false });

export default socket;
