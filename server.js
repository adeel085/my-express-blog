const express = require('express');
let expressSession = require('express-session')
const hbs = require('hbs');
const sequelize = require('./config/connection.js');
const { User, Post, Comment } = require('./models');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const PORT = process.env.PORT || 3001;

const baseURL = "https://my-tech-blog-85.herokuapp.com/";

app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSession({ secret: 'max', saveUninitialized: false, resave: false }));
app.use(express.static(__dirname + '/public'));

app.get('/', async (req, res) => {

    const posts = await Post.findAll({
        order: [
            ['id', 'DESC']
        ],
        include: User
    });

    res.render('home', {
        baseURL: baseURL,
        posts: posts,
        loggedIn: (req.session.user) ? true : false
    });
});

app.get('/blogpost/:id', async (req, res) => {
    
    const post = await Post.findOne({
        where: {
            id: req.params.id
        },
        include: [User, Comment],
    });

    if (post == null) {
        res.status(404).send("Not Found");
    }
    else {

        for (let i = 0; i < post.comments.length; i++) {
            const user = await User.findOne({
                where: {
                    id: post.comments[i].dataValues.user_id
                }
            });

            post.comments[i].dataValues.user = user.dataValues;
        }

        res.render('blogpost', {
            baseURL: baseURL,
            post: post,
            loggedIn: (req.session.user) ? true : false
        });
    }
});

app.post('/blogpost/comment/', async (req, res) => {

    let postId = req.body.postId;

    const comment = Comment.create({
        text: req.body.comment,
        date: (new Date()).toISOString().slice(0,10),
        post_id: postId,
        user_id: req.session.user.id
    });

    console.log(comment.dataValues);

    res.redirect('/blogpost/' + postId);
});

app.get('/dashboard', async (req, res) => {

    if (req.session.user) {
        const posts = await Post.findAll({
            where: {
                user_id: req.session.user.id
            },
            order: [
                ['id', 'DESC']
            ],
            include: User
        });
        
        res.render('dashboard', {
            baseURL: baseURL,
            posts: posts,
            loggedIn: (req.session.user) ? true : false
        });
    }
    else {
        res.redirect('/login');
    }
});

app.post('/dashboard/blogpost', (req, res) => {

    if (req.session.user) {
        let userId = req.session.user.id;
        const post = Post.create({
            title: req.body.postTitle,
            content: req.body.postContent,
            date: (new Date()).toISOString().slice(0,10),
            user_id: userId
        });

        console.log(post.dataValues);

        res.redirect("/dashboard");
    }
    else {
        res.redirect('/login');
    }
});

app.delete('/dashboard/blogpost/:id', async (req, res) => {

    if (req.session.user) {
        const result = await Post.destroy({
            where: {
                id: req.params.id
            }
        });
        res.send(result + "");
    }
    else {
        res.redirect('/login');
    }
});

app.post('/dashboard/blogpost/edit/:id', async (req, res) => {

    if (req.session.user) {
        await Post.update(
            {
                title: req.body.postTitle,
                content: req.body.postContent
            },
            {
                returning: true,
                where: {
                    id: req.params.id
                }
            }
        );
        res.redirect('/dashboard');
    }
    else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    
    if (req.session.user) {
        res.redirect('/');
    }
    else {

        let invalidLogin = (req.query.status == "invalid-login");

        res.render('login', {
            baseURL: baseURL,
            loggedIn: (req.session.user) ? true : false,
            invalidLogin: invalidLogin
        });
    }
});

app.post('/login', async (req, res) => {
    if (req.session.user) {
        res.redirect('/');
    }
    else {

        const users = await User.findAll({
            where: {
                username: req.body.username
            }
        });

        let user = undefined;

        for (let i = 0; i < users.length; i++) {
            let matched = await bcrypt.compare(req.body.password, users[i].password);
            if (matched === true) {
                user = users[i];
                break;
            }
        }

        if (user) {
            req.session.user = user;
            res.redirect('/');
        }
        else {
            res.redirect('/login?status=invalid-login');
        }
    }
});

app.get('/signup', (req, res) => {
    if (req.session.user) {
        res.redirect('/');
    }
    else {

        let userNameTaken = (req.query.status == "username-taken");

        res.render('signup', {
            baseURL: baseURL,
            loggedIn: (req.session.user) ? true : false,
            userNameTaken: userNameTaken
        });
    }
});

app.post('/signup', async (req, res) => {
    if (req.session.user) {
        res.redirect('/');
    }
    else {
        const user = await User.findOne({
            where: {
                username: req.body.username,
            }
        });

        if (user) {
            res.redirect('/signup?status=username-taken');
        }
        else {

            const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

            const user = await User.create({
                username: req.body.username,
                password: hashedPassword
            },
            {
                isNewRecord: true
            });

            console.log(user.dataValues);

            req.session.user = user.dataValues;
            res.redirect('/');
        }
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

(async () => {

    // uncomment these line if you want to create database
    // await sequelize.sync({ force: true });
    // console.log("Database created");

    app.listen(PORT, async () => {
        console.log(`App listening on port ${PORT}!`);
    });
})();