require('dotenv').config()
const jwt = require(`jsonwebtoken`);
const basicAuth = require(`basic-auth`);
const bcrypt = require(`bcryptjs`);
const cookieParser = require(`cookie-parser`);
const express = require(`express`);

const users = require(`./users.json`);

const app = express();

async function signJWT(req, res) {
    const user = basicAuth(req);
    const _user = users.find(_u => _u.username == user.name);

    if (_user) {
        if (bcrypt.compareSync(user.pass, _user.password)) {
            const _token = jwt.sign(
                {
                    username: _user.username,
                    admin: _user.admin,
                },
                process.env.SECRET,
                {
                    expiresIn: "4h",
                }
            );
            console.log(`Authenticated as ${_user.username}`);
            res
                .cookie("Token", _token, {
                    httpOnly: true,
                })
                .status(200)
                .json({
                    Token: `Bearer ` + _token,
                });
        } else {
            res.status(401).send("Unauthorized");
        }
    } else {
        res.status(401).send("User not found");
    }
}

function verifyJWT(req, res) {
    try {
        jwt.verify(
            req.cookies && req.cookies.Token,
            process.env.SECRET
        );
        res.status(200).send('Authorized');
    } catch (err) {
        res.status(401).send(err.message);
    }
}

app.use(cookieParser());

app.get(`/login`, signJWT);

app.get(`/auth`, verifyJWT)

app.listen(4000, () => {
    console.log('Authentication server listening on port 4000');
})