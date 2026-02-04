import { Router } from "express";
import connectionPool from "../utils/db.mjs"

const questionsRouter = Router()

questionsRouter.post("/", async(req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        message: "Invalid request data.",
      });
    }

    const query = `
      INSERT INTO questions (title, description, category, vote)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;

    const values = [title, description, category];

    await connectionPool.query(query, values);

    return res.status(201).json({
      message: "Question created successfully.",
    });
  } catch (error) {

    return res.status(500).json({
      message: "Unable to create question.",
    });
  }
});

questionsRouter.get("/", async (req, res) => {
  try {
    const query = `
      SELECT id, title, description, category
      FROM questions
      ORDER BY id ASC;
    `;

    const result = await connectionPool.query(query);

    return res.status(200).json({
      data: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Unable to fetch questions.",
    });
  }
});

questionsRouter.get("/search", async (req, res) => {
  try {
    const { title, category } = req.query;

    if (!title && !category) {
      return res.status(400).json({
        message: "Invalid search parameters.",
      });
    }

    let query = `
      SELECT id, title, description, category
      FROM questions
      WHERE 1=1
    `;
    const values = [];

    if (title) {
      values.push(`%${title}%`);
      query += ` AND title ILIKE $${values.length}`;
    }

    if (category) {
      values.push(category);
      query += ` AND category = $${values.length}`;
    }

    const result = await connectionPool.query(query, values);

    return res.status(200).json({
      data: result.rows,
    });
  } catch (error) {
  
    return res.status(500).json({
      message: "Unable to fetch a question.",
    });
  }
});

questionsRouter.get("/:questionId", async (req, res) => {
  try {
    const { questionId } = req.params;

    const query = `
      SELECT id, title, description, category
      FROM questions
      WHERE id = $1;
    `;

    const result = await connectionPool.query(query, [questionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Question not found.",
      });
    }

    return res.status(200).json({
      data: result.rows[0],
    });
  } catch (error) {
 
    return res.status(500).json({
      message: "Unable to fetch questions.",
    });
  }
});

questionsRouter.put("/:questionId", async (req, res) => {
  try {
    const { questionId } = req.params;
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        message: "Invalid request data.",
      });
    }

    const query = `
      UPDATE questions
      SET title = $1, description = $2, category = $3
      WHERE id = $4
      RETURNING id;
    `;

    const result = await connectionPool.query(query, [
      title,
      description,
      category,
      questionId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Question not found.",
      });
    }

    return res.status(200).json({
      message: "Question updated successfully.",
    });
  } catch (error) {

    return res.status(500).json({
      message: "Unable to fetch questions.",
    });
  }
});

questionsRouter.delete("/:questionId", async (req, res) => {
  try {
    const { questionId } = req.params;

    const query = `
      DELETE FROM questions
      WHERE id = $1
      RETURNING id;
    `;

    const result = await connectionPool.query(query, [questionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Question not found.",
      });
    }

    return res.status(200).json({
      message: "Question post has been deleted successfully.",
    });
  } catch (error) {
   
    return res.status(500).json({
      message: "Unable to delete question.",
    });
  }
});

questionsRouter.post("/:questionId/answers", async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        message: "Invalid request data.",
      });
    }

    const checkQuestion = await connectionPool.query(
      "SELECT id FROM questions WHERE id = $1",
      [questionId]
    );

    if (checkQuestion.rows.length === 0) {
      return res.status(404).json({
        message: "Question not found.",
      });
    }

    await connectionPool.query(
      `INSERT INTO answers (question_id, content)
       VALUES ($1, $2)`,
      [questionId, content]
    );

    return res.status(201).json({
      message: "Answer created successfully.",
    });
  } catch (error) {

    return res.status(500).json({
      message: "Unable to create answers.",
    });
  }
});

questionsRouter.get("/:questionId/answers", async (req, res) => {
  try {
    const { questionId } = req.params;

    const checkQuestion = await connectionPool.query(
      "SELECT id FROM questions WHERE id = $1",
      [questionId]
    );

    if (checkQuestion.rows.length === 0) {
      return res.status(404).json({
        message: "Question not found.",
      });
    }

    const result = await connectionPool.query(
      `SELECT id, content FROM answers WHERE question_id = $1`,
      [questionId]
    );

    return res.status(200).json({
      data: result.rows,
    });
  } catch (error) {

    return res.status(500).json({
      message: "Unable to fetch answers.",
    });
  }
});

questionsRouter.delete("/:questionId/answers", async (req, res) => {
  try {
    const { questionId } = req.params;

    const checkQuestion = await connectionPool.query(
      "SELECT id FROM questions WHERE id = $1",
      [questionId]
    );

    if (checkQuestion.rows.length === 0) {
      return res.status(404).json({
        message: "Question not found.",
      });
    }

    await connectionPool.query(
      "DELETE FROM answers WHERE question_id = $1",
      [questionId]
    );

    return res.status(200).json({
      message: "All answers for the question have been deleted successfully.",
    });
  } catch (error) {
  
    return res.status(500).json({
      message: "Unable to delete answers.",
    });
  }
});

questionsRouter.post("/:questionId/vote", async (req, res) => {
  try {
    const { questionId } = req.params;
    const { vote } = req.body;

    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({
        message: "Invalid vote value.",
      });
    }

    const result = await connectionPool.query(
      `UPDATE questions
       SET vote_count = COALESCE(vote_count, 0) + $1
       WHERE id = $2
       RETURNING id`,
      [vote, questionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Question not found.",
      });
    }

    return res.status(200).json({
      message: "Vote on the question has been recorded successfully.",
    });
  } catch (error) {
   
    return res.status(500).json({
      message: "Unable to vote question.",
    });
  }
});

export default questionsRouter