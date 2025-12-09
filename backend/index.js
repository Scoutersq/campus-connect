const http = require("http");
const app = require("./src/app.js");
const { connectDB } = require("./src/db/db.js");
const { ensureStudentIds } = require("./src/utils/studentIds.js");
const { ensureAdminCodes } = require("./src/utils/adminCodes.js");
const { createSocketServer } = require("./src/socket/index.js");

async function startServer() {
    try {
        await connectDB();
        await Promise.all([ensureStudentIds(), ensureAdminCodes()]);

        const server = http.createServer(app);
        createSocketServer(server);

        const port = process.env.PORT || 3000;

        server.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
}

startServer();