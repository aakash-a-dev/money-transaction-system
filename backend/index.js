const express = require("express");
const cors = require("cors");
const rootRouter = require("./routes/index")
const {signupBody, signinBody} = require("./types");
const router = require("./routes/user");
const app = express();
const { User } = require("./db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./config");
const bcrypt = require('bcrypt');

require('dotenv').config();
app.use(express.json());
app.use(cors());

app.use("/api/v1", rootRouter);

app.post("/signup", async (req, res) => {
    const { success } = signupBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect Input"
        })
    }

    const existingUser = await User.findOne({
        username: req.body.username
    })

    if (existingUser) {
        return res.status(411).json({
            message: "Email already taken/Incorrect Inputs"
        })
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
        username: req.body.username,
        password: hashedPassword,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    })

    const userId = user._id;

    const token = jwt.sign({
        userId
    }, JWT_SECRET);

    res.json({
        message: "User created successfully",
        token: token
    })
})

app.post("/signin", async (req, res) => {
    const { success } = signinBody.safeParse(req.body);
    if (!success) {
                return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    const user = await User.findOne({
        username: req.body.username,
    });

    
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(req.body.password, user.password);

    if (!passwordMatch) {
        return res.status(401).json({ message: "Incorrect password" });
    }

    if (user) {
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET)

        res.json({
            token: token
        })
        return;
    }

       res.status(411).json({
        message: "Error while logging in"
    })

})

app.listen(3000, () => {
    console.log(`Server started at http://localhost:3000`);
})