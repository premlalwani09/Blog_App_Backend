import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";

const app = express();
const port = 4000;

app.use(cors({ origin: "https://blog-app-frontend-hw3x.onrender.com" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect("mongodb+srv://premlalwani1209:prem@cluster0.7r4av3n.mongodb.net/firstDB?retryWrites=true&w=majority&appName=Cluster0").then(() =>
  app.listen(port, () => console.log("Server started at port " + port))
);

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
});

const messageModel = mongoose.model("message", messageSchema, "messages");

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String }, // Add imageUrl field to store image path
});

const blogModel = mongoose.model("blog", blogSchema, "blogs");

// Set storage engine for Multer
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB file size limit
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single('image');

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

app.post("/saveData", (req, res) => {
  const dataToSave = new messageModel(req.body);
  dataToSave.save().then(() => res.json("Data Submitted"));
});

app.get("/showData", async (req, res) => {
  const savedData = await messageModel.find();
  if (savedData) res.json(savedData);
});

app.delete("/deleteData", async (req, res) => {
  const deletedData = await messageModel.findByIdAndDelete(req.body.idToDelete);
  if (deletedData._id) res.json("Data Deleted");
});

app.get("/getDataById/:idToEdit", async (req, res) => {
  const dataToUpdate = await messageModel.findById(req.params.idToEdit);
  if (dataToUpdate._id) res.json(dataToUpdate);
});

app.put("/updateData", async (req, res) => {
  const { name, email, message, id } = req.body;
  const updatedData = await messageModel.findByIdAndUpdate(id, { name, email, message });
  if (updatedData._id) res.json("Data Updated");
});

app.post("/addBlog", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      if (req.file == undefined) {
        res.status(400).send('No file selected!');
      } else {
        const { title, author, content } = req.body;
        const dataToSave = new blogModel({
          title,
          author,
          content,
          imageUrl: `/uploads/${req.file.filename}`
        });
        await dataToSave.save();
        res.json("Blog Added");
      }
    }
  });
});

app.get("/getBlogs", async (req, res) => {
  try {
    const { author } = req.query;
    let query = {};
    if (author) {
      query = { author: author };
    }
    const savedData = await blogModel.find(query);
    res.json(savedData);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: "Failed to fetch blogs." });
  }
});

app.use('/uploads', express.static('uploads'));




