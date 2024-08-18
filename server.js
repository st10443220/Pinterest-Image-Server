import express from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 10000;

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const expressServer = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

const io = new Server(expressServer, {
    cors: {
        origin: ["https://st10443220.github.io/Pinterest-Image-Downloader/"], // Allow this origin
        methods: ["GET", "POST"], // Allow specific HTTP methods
        credentials: true // If you need to send cookies or authorization headers
    }
});

io.on("connection", (socket) => {
    const id = socket.id;
    console.log(`User with socket id { ${id} } has connected`);

    socket.on("message", async ({ url }) => {
        console.log(`Received message with URL: { ${url} }`);
        try {
            const imageSource = await getImageFile(url);
            console.log(`Image Source Scraped: ${imageSource}`);
            socket.emit("message", { imageSource });
        } catch (error) {
            console.error(`Error fetching image: ${error.message}`);
            socket.emit("message", { imageSource: null });
        }
    });

    socket.on("disconnect", () => {
        console.log(`User with socket id { ${id} } has disconnected`);
    });
});

async function getImageFile(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    const imageSource = await page.evaluate(() => {
        const imageLink = document.querySelector(".hCL.kVc.L4E.MIw");
        return imageLink ? imageLink.getAttribute("src") : null;
    });

    await browser.close();

    return imageSource;
}
