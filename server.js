const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Simple Blockchain - FIXED FORMAT
let blockchain = [
    { 
        block: 1,
        hash: 'genesis_block',
        transactions: [{ 
            action: 'genesis', 
            user: 'system', 
            bookTitle: 'First Block',
            timestamp: new Date().toISOString() 
        }],
        timestamp: new Date().toISOString()
    }
];

let books = [
    { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', available: true },
    { id: '2', title: 'To Kill a Mockingbird', author: 'Harper Lee', available: true }
];

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/books', (req, res) => {
    res.json(books);
});

app.post('/api/books', (req, res) => {
    const { title, author } = req.body;
    const newBook = {
        id: Date.now().toString(),
        title,
        author,
        available: true
    };
    books.push(newBook);
    
    // FIXED: Proper transaction format
    blockchain.push({
        block: blockchain.length + 1,
        hash: 'block_' + Date.now(),
        transactions: [{ 
            action: 'add', 
            user: 'admin', 
            bookId: newBook.id,
            bookTitle: title,
            timestamp: new Date().toISOString() 
        }],
        timestamp: new Date().toISOString()
    });
    
    res.json(newBook);
});

app.post('/api/books/:id/borrow', (req, res) => {
    const book = books.find(b => b.id === req.params.id);
    const { userName } = req.body;
    
    if (book && book.available) {
        book.available = false;
        // FIXED: Proper transaction format
        blockchain.push({
            block: blockchain.length + 1,
            hash: 'block_' + Date.now(),
            transactions: [{ 
                action: 'borrow', 
                user: userName, 
                bookId: book.id,
                bookTitle: book.title,
                timestamp: new Date().toISOString() 
            }],
            timestamp: new Date().toISOString()
        });
        res.json({ message: 'Book borrowed!' });
    } else {
        res.status(400).json({ error: 'Book not available' });
    }
});

app.post('/api/books/:id/return', (req, res) => {
    const book = books.find(b => b.id === req.params.id);
    const { userName } = req.body;
    
    if (book && !book.available) {
        book.available = true;
        // FIXED: Proper transaction format
        blockchain.push({
            block: blockchain.length + 1,
            hash: 'block_' + Date.now(),
            transactions: [{ 
                action: 'return', 
                user: userName, 
                bookId: book.id,
                bookTitle: book.title,
                timestamp: new Date().toISOString() 
            }],
            timestamp: new Date().toISOString()
        });
        res.json({ message: 'Book returned!' });
    } else {
        res.status(400).json({ error: 'Book already available' });
    }
});

app.get('/api/blockchain', (req, res) => {
    res.json(blockchain);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});