import express from "express";
import answersRouter from "./app/answersRouter.mjs";
import questionsRouter from "./app/questionsRouter.mjs";

const app = express();
const port = 4000;

app.use(express.json());

app.get("/test", (req, res) => {
  return res.json("Server API is working 🚀");
});

app.use("/answers", answersRouter)

app.use("/questions", questionsRouter)

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
