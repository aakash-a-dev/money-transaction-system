const express = require("express");
const rootRouter = require("./routes/index")
const cors=require("cors");

const app = express();

app.use("/api/v1", rootRouter);


app.listen(3000, () => {
    console.log(`Server started at http://localhost:3000`);
})