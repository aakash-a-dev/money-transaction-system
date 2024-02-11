const express = require("express");
const cors = require("cors");
const rootRouter = require("./routes/index")
const {signupBody, signinBody, updateBody} = require("./types");
const router = require("./routes/user");
const app = express();
const { User, Account } = require("./db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./config");
const bcrypt = require('bcrypt');
const { authMiddleware } = require("./middleware");

require('dotenv').config();
app.use(express.json());
app.use(cors());

app.use("/api/v1", rootRouter);


router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const user = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter 
            }
        }]
    })

    res.json({
        user: user.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id

        }))
    })
})

router.get("/balance", authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });

    res.json({
        balance: account.balance
    })
})

router.post("/signup", async (req, res) => {
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

    await Account.create({
        balance: 1 + Math.random() * 1000
    })

    const token = jwt.sign({
        userId
    }, JWT_SECRET);

    res.json({
        message: "User created successfully",
        token: token
    })
})

router.post("/signin", async (req, res) => {
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


router.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body);
    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })

        await User.updateOne(req.body, {
        _id: req.userId
    })

    res.json({
        message: "Updated successfully"
    })
    }
})

app.listen(3000, () => {
    console.log(`Server started at http://localhost:3000`);
})