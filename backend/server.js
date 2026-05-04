import 'dotenv/config';
import express from "express";
import connectDb from "./config/mongo.js";
import cors from "cors";
import adminAuthRoutes from "./routes/adminAuth.js";
import facultyAuthRoutes from "./routes/facultyAuth.js";
import adminRoutes from "./routes/adminRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

connectDb();

app.use(express.json());

// Public Routes (No authentication required)
app.use("/api/auth/admin", adminAuthRoutes);
app.use("/api/auth/faculty", facultyAuthRoutes);

// Protected Routes (Authentication required)
app.use("/api/admin", adminRoutes);
app.use("/api/faculty", facultyRoutes);

app.use("/", (req, res) => {
    res.send("Hello World!");
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});