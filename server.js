const express = require('express');
const SHA256 = require('crypto-js/sha256');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Simple ID generator
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Simple Blockchain
class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return SHA256(
            this.previousHash +
            this.timestamp +
            JSON.stringify(this.transactions)
        ).toString();
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
    }

    createGenesisBlock() {
        return new Block(Date.now(), ["Genesis Block"], "0");
    }

    addTransaction(bookId, action, user) {
        this.pendingTransactions.push({
            bookId,
            action,
            user,
            timestamp: new Date().toISOString(),
            id: generateId()
        });
    }

    minePendingTransactions() {
        let block = new Block(Date.now(), this.pendingTransactions);
        block.previousHash = this.chain[this.chain.length - 1].hash;
        block.hash = block.calculateHash();
        
        this.chain.push(block);
        this.pendingTransactions = [];
    }

    getChain() {
        return this.chain;
    }
}

// Library Data
let books = [
    { id: generateId(), title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', available: true },
    { id: generateId(), title: 'To Kill a Mockingbird', author: 'Harper Lee', available: true }
];

// Initialize Blockchain
const libraryChain = new Blockchain();

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all books
app.get('/api/books', (req, res) => {
    console.log('GET /api/books - Sending', books.length, 'books');
    res.json(books);
});

// Add new book
app.post('/api/books', (req, res) => {
    console.log('POST /api/books - Adding book:', req.body);
    const { title, author } = req.body;
    
    if (!title || !author) {
        return res.status(400).json({ error: 'Title and author are required' });
    }
    
    const newBook = {
        id: generateId(),
        title,
        author,
        available: true
    };
    books.push(newBook);
    
    // Add to blockchain
    libraryChain.addTransaction(newBook.id, 'add', 'admin');
    libraryChain.minePendingTransactions();
    
    res.json(newBook);
});

// Borrow book
app.post('/api/books/:id/borrow', (req, res) => {
    const bookId = req.params.id;
    const { userName } = req.body;
    
    console.log(`Borrowing book ${bookId} for user ${userName}`);
    
    const book = books.find(b => b.id === bookId);
    if (book && book.available) {
        book.available = false;
        
        // Add to blockchain
        libraryChain.addTransaction(bookId, 'borrow', userName);
        libraryChain.minePendingTransactions();
        
        res.json({ message: 'Book borrowed successfully!' });
    } else {
        res.status(400).json({ error: 'Book not available' });
    }
});

// Return book
app.post('/api/books/:id/return', (req, res) => {
    const bookId = req.params.id;
    const { userName } = req.body;
    
    console.log(`Returning book ${bookId} for user ${userName}`);
    
    const book = books.find(b => b.id === bookId);
    if (book && !book.available) {
        book.available = true;
        
        // Add to blockchain
        libraryChain.addTransaction(bookId, 'return', userName);
        libraryChain.minePendingTransactions();
        
        res.json({ message: 'Book returned successfully!' });
    } else {
        res.status(400).json({ error: 'Book already available' });
    }
});

// Get blockchain
app.get('/api/blockchain', (req, res) => {
    console.log('GET /api/blockchain - Sending chain with', libraryChain.chain.length, 'blocks');
    res.json(libraryChain.getChain());
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Library Blockchain running on port ${PORT}`);
    console.log(`📖 Open: http://localhost:${PORT}`);
    console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
});