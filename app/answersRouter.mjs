import { Router } from "express";
import connectionPool from "../utils/db.mjs"

const answersRouter = Router()

answersRouter.post("/:answerId/vote", async (req, res) => {
  try {
    const { answerId } = req.params;
    const { vote } = req.body;

    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({
        message: "Invalid vote value.",
      });
    }

    const result = await connectionPool.query(
      `UPDATE answers
       SET vote_count = COALESCE(vote_count, 0) + $1
       WHERE id = $2
       RETURNING id`,
      [vote, answerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Answer not found.",
      });
    }

    return res.status(200).json({
      message: "Vote on the answer has been recorded successfully.",
    });
  } catch (error) {
   
    return res.status(500).json({
      message: "Unable to vote answer.",
    });
  }
});

export default answersRouter