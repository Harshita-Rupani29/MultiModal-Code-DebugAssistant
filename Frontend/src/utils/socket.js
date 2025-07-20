import io from "socket.io-client";

const SOCKET_SERVER_URL = import.meta.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

const socket = io(SOCKET_SERVER_URL);

export default socket;