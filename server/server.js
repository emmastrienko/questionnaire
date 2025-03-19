require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const questionnaireRoutes = require("./routes/questionnaire");
app.use("/api/questionnaires", questionnaireRoutes);

app.use("/uploads", express.static("uploads")); // Enables access to uploaded images

// if (proccess.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../client/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../client", "dist", "index.html"));
//   });
// }

const PORT = process.env.PORT;
//const __dirname = path.resolve();

app.listen(PORT, () => console.log("Server running on port 5000"));
