const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const Game = require('./models/game.js');

const userRoutes = require('./routes/users');

mongoose.connect('mongodb://localhost:27017/romme', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    console.log(req.session)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


app.use('/', userRoutes);

app.get('/', (req, res) => {
    res.render('home')
});

app.get('/game/new', async (req, res) => {
    const game = await new Game({p1score:0, p2score:0, date: new Date()})
    game.save()
    res.render('game', {game})
});

app.get('/game/:id', async (req, res) => {
    const {id} = req.params
    const game = await Game.findById(id)
    res.render('game', {game})
});

app.delete('/game/:id', async (req, res) => {
    const { id } = req.params;
    await Game.findByIdAndDelete(id);
    req.flash('success', 'Erfolgreich gelöscht')
    res.redirect('/game');
})

app.put('/game/:id', async (req, res) => {
    const {id} = req.params
    const game = await Game.findById(id)
    game.p1score = +game.p1score + +req.body.p1points
    game.p2score = +game.p2score + +req.body.p2points
    game.save()
    res.redirect(`/game/${game._id}`)
})

app.get('/game', async (req, res) => {
    const games = await Game.find({});
    res.render('gameOverview', {games})
});


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})


