import express from 'express';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;

const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

const expressServer = app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

const io = new Server(expressServer, {
    cors: {
        origin: ["http://127.0.0.1:5500"], // Allow this origin for development
        methods: ["GET", "POST"], // Allow specific HTTP methods
        credentials: true // Allow sending cookies or headers
    }
});

io.on('connection', (socket) => {
    const id = socket.id;
    console.log(`User with socket id ${id} has connected`);

    socket.on('message', async ({ url }) => {
        console.log(`Received message with URL: ${url}`);
        try {
            const { imageSource, imageHeader } = await getImageFile(url);
            console.log(`Image Source Scraped: ${imageSource}`);
            socket.emit('message', { imageSource, imageHeader });
        } catch (error) {
            console.error(`Error fetching image: ${error.message}`);
            socket.emit('message', { imageSource: null, imageHeader: "No header" });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User with socket id ${id} has disconnected`);
    });
});

async function getImageFile(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        const { imageSource, imageHeader } = await page.evaluate(() => {
            const imageLink = document.querySelector(".hCL.kVc.L4E.MIw");
            const imageText = document.querySelector(".lH1.dyH.iFc.H2s.GTB.X8m.zDA.IZT");
            return {
                imageSource: imageLink ? imageLink.getAttribute("src") : null,
                imageHeader: imageText ? imageText.innerText : null
            };
        });

        return { imageSource, imageHeader };
    } catch (error) {
        console.error(`Puppeteer error: ${error.message}`);
        return { imageSource: null, imageHeader: null };
    } finally {
        await browser.close();
    }
}
