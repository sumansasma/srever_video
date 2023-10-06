const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const fs = require('fs');
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

db.run(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    filename TEXT,
    isDeleted BOOLEAN DEFAULT 0
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
        function (err) { // Use a regular function here
            if (err) {
                console.error(err.message);
                res.status(500).send('Error uploading video.');
            } else {
                const videoId = this.lastID; // Get the ID of the inserted record
                const uploadTime = new Date().toLocaleString(); // Get the upload time

                // Send a success response with video ID and upload time
                res.send(`Video uploaded successfully. ID: ${videoId}, Upload Time: ${uploadTime}`);
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

// Serve video files from a specific URL path
app.get('/uploads/:videourl', (req, res) => {
  const videoUrl = req.params.videourl;
  res.sendFile(path.join(__dirname, 'uploads', videoUrl));
});

// Define a route for deleting videos by ID
app.delete('/delete/:id', (req, res) => {
    const videoId = req.params.id;

    // Retrieve the filename of the video to be deleted from the database
    db.get('SELECT filename FROM videos WHERE id = ?', [videoId], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Error deleting video' });
        } else if (!row) {
            res.status(404).json({ error: 'Video not found' });
        } else {
            const filename = row.filename;

            // Delete the video record from the database
            db.run('DELETE FROM videos WHERE id = ?', [videoId], (deleteErr) => {
                if (deleteErr) {
                    console.error(deleteErr.message);
                    res.status(500).json({ error: 'Error deleting video record' });
                } else {
                    // Delete the associated video file from the 'uploads' directory
                    const filePath = path.join(__dirname, 'uploads', filename);
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting video file:', unlinkErr);
                            res.status(500).json({ error: 'Error deleting video file' });
                        } else {
                            res.json({ message: 'Video deleted successfully' });
                        }
                    });
                }
            });
        }
    });
});



// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
