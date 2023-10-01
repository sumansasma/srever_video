const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;

const cors = require('cors'); // Import the 'cors' middleware

app.use(cors());

// Set up the SQLite database
const db = new sqlite3.Database('mydatabase.db');

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Serve uploaded videos statically
app.use('/uploads', express.static('uploads'));

// Create a table for videos (if it doesn't exist)
db.run(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    filename TEXT
  )
`);

// Define a route for uploading videos
app.post('/upload', upload.single('video'), (req, res) => {
    const { title, description } = req.body;
    const filename = req.file.filename;

    // Insert video metadata into the database
    db.run(
        'INSERT INTO videos (title, description, filename) VALUES (?, ?, ?)',
        [title, description, filename],
        (err) => {
            if (err) {
                console.error(err.message);
                res.status(500).send('Error uploading video.');
            } else {
                res.redirect('/');
            }
        }
    );
});

// Define a route for the default upload page (set as the root)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
});

// Define a route for uploading videos
app.post('/upload', upload.single('video'), (req, res) => {
    const { title, description } = req.body;
    const filename = req.file.filename;

    // Insert video metadata into the database
    db.run(
        'INSERT INTO videos (title, description, filename) VALUES (?, ?, ?)',
        [title, description, filename],
        (err) => {
            if (err) {
                console.error(err.message);
                res.status(500).send('Error uploading video.');
            } else {
                res.redirect('/');
            }
        }
    );
});

// Define a route for fetching videos
app.get('/fetch-videos', (req, res) => {
    db.all('SELECT * FROM videos', (err, videos) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Error fetching videos.');
        } else {
            res.json(videos);
        }
    });
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});