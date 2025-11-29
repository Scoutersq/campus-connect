const app = require("./src/app.js");
const { connectDB } = require("./src/db/db.js");
const { ensureStudentIds } = require("./src/utils/studentIds.js");

async function startServer() {
    try {
        await connectDB();
        await ensureStudentIds();

        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    } catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
}

startServer();