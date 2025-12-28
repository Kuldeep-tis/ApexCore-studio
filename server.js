const express = require('express');
const nunjucks = require('nunjucks');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 1. Setup Template Engine (Nunjucks replaces Jinja2)
nunjucks.configure('templates', {
    autoescape: true,
    express: app
});

// 2. Middleware
app.use(express.static('static')); // Serves static files if you have a static folder
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 3. Database Connection (Opens your existing database.db)
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error("Database error:", err.message);
    else console.log("Connected to SQLite database.");
});

// Ensure 'users' table exists (Matching your python init_db logic)
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

// 4. AI Chatbot Setup (Replacing backend/chatbot.py)
const genAI = new GoogleGenerativeAI(process.env.gemini_api_key);
// Using a fallback model list logic similar to your python script is complex, 
// so we default to 'gemini-pro' which is standard.
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const chatbotContext = `You are Larry, a helpful and friendly support agent for ApexCore Studios, a high-performance payment infrastructure company. 
You specialize in helping customers with:
- High-risk payment processing and merchant accounts
- Payment gateway integration
- Chargeback prevention
- Offshore merchant accounts
- Multi-currency processing
- Industry-specific solutions (CBD, forex, adult entertainment, etc.)

Be professional, knowledgeable, and helpful. Keep responses concise and informative. If you don't know something, suggest they contact the sales team.`;

// --- ROUTES (Matching your main.py) ---

// Basic Page Routes
app.get('/', (req, res) => res.render('base/index.html'));
app.get('/solutions/high-risk-accounts', (req, res) => res.render('solutions/high-risk-accounts.html'));
app.get('/solutions/payment-gateway', (req, res) => res.render('solutions/payment-gateway.html'));
app.get('/solutions/chargeback-prevention', (req, res) => res.render('solutions/chargeback-prevention.html'));
app.get('/solutions/offshore-processing', (req, res) => res.render('solutions/offshore-processing.html'));

// Industry Routes
app.get('/industries/e-commerce', (req, res) => res.render('industries/e-commerce.html'));
app.get('/industries/cbd-hemp', (req, res) => res.render('industries/cbd-hemp.html'));
app.get('/industries/adult-entertainment', (req, res) => res.render('industries/adult-entertainment.html'));
app.get('/industries/forex-crypto', (req, res) => res.render('industries/forex-crypto.html'));

// Partners & Others
app.get('/partners/partners', (req, res) => res.render('partners/partners.html'));
app.get('/chatbots', (req, res) => res.render('chatbots.html'));
app.get('/services', (req, res) => res.render('services.html'));

// Form Submission Endpoint (Replaces /submit)
app.post('/submit', (req, res) => {
    const { firstName, lastName, email, company, phone, message } = req.body;

    if (!firstName || !lastName || !email || !phone || !message) {
        return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    const stmt = db.prepare('INSERT INTO users (first_name, last_name, email, company, phone, message) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(firstName, lastName, email, company, phone, message, function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ success: false, message: 'Failed to submit form.' });
        }
        res.json({ success: true, message: 'Form submitted successfully!' });
    });
    stmt.finalize();
});

// Chatbot Endpoint (Replaces /chatbot)
app.post('/chatbot', async (req, res) => {
    try {
        const userInput = req.body.user_input;
        if (!userInput) return res.status(400).json({ response: 'Please provide a message.' });

        const prompt = `${chatbotContext}\n\nUser question: ${userInput}\n\nLarry's response:`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ response: "I'm sorry, I'm having trouble processing your request right now." });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`ApexCore server running on port ${port}`);
});