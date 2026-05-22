// server.js

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static('public'));

// User class
class User {
    constructor(id, name, username, email, password, updatedAt, image, rol, heroClass, hp, atk, def, wins, losses) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.email = email;
        this.password = password;
        this.updatedAt = updatedAt;
        this.image = image;
        this.rol = rol;
        
        // RPG Stats
        const classes = ['Warrior', 'Mage', 'Cyber-Ninja'];
        this.heroClass = heroClass || classes[Math.floor(Math.random() * classes.length)];
        this.hp = hp !== undefined ? hp : Math.floor(Math.random() * 50) + 100; // 100-150
        this.atk = atk !== undefined ? atk : Math.floor(Math.random() * 20) + 10; // 10-30
        this.def = def !== undefined ? def : Math.floor(Math.random() * 15) + 5;  // 5-20
        this.wins = wins || 0;
        this.losses = losses || 0;
    }

    updateProfile(newData) {
        if (newData.name) this.name = newData.name;
        if (newData.username) this.username = newData.username;
        if (newData.email) this.email = newData.email;
        if (newData.image) this.image = newData.image;
        if (newData.wins !== undefined) this.wins = newData.wins;
        if (newData.losses !== undefined) this.losses = newData.losses;
        this.updatedAt = new Date();
    }

    passwordValid(inputPassword) {
        return this.password === inputPassword;
    }
}

// In-memory data
let users = [
    new User(1, 'John Doe', 'johndoe', 'john@example.com', 'pwd', new Date(), 'john.jpg', 'admin', 'Warrior', 150, 25, 15, 5, 1),
    new User(2, 'Jane Smith', 'janesmith', 'jane@example.com', 'pwd', new Date(), 'jane.jpg', 'user', 'Mage', 100, 35, 5, 8, 2),
    new User(3, 'Robert Brown', 'robbrown', 'robert@example.com', 'pwd', new Date(), 'robert.jpg', 'user', 'Cyber-Ninja', 120, 28, 10, 12, 0)
];

// CRUD Endpoints

// Get all users
app.get('/users', (req, res) => {
    res.json(users);
});

// Get user by ID
app.get('/users/:id', (req, res) => {
    const user = users.find(u => u.id == req.params.id);
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Create a new user
app.post('/users', (req, res) => {
    const { name, username, email, password, image, rol, heroClass, hp, atk, def } = req.body;
    const newUser = new User(
        users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        name || 'Unknown Hero',
        username || 'hero',
        email || 'hero@arena.com',
        password || 'pwd',
        new Date(),
        image || 'default.jpg',
        rol || 'user',
        heroClass, hp, atk, def, 0, 0
    );
    users.push(newUser);
    res.status(201).json(newUser);
});

// Update a user
app.put('/users/:id', (req, res) => {
    const user = users.find(u => u.id == req.params.id);
    if (user) {
        user.updateProfile(req.body);
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Delete a user
app.delete('/users/:id', (req, res) => {
    users = users.filter(u => u.id != req.params.id);
    res.status(204).send();
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
