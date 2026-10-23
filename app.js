const express = require("express");
const cors = require("cors");
const taskRoutes = require("./routes/tasks");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/api/tasks", taskRoutes);

// Chỉ xuất app ra, KHÔNG gọi listen: test sẽ dùng app này mà không cần mở cổng
module.exports = app;
