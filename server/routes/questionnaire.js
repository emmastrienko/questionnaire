import express from "express";
const router = express.Router();
import { Questionnaire, UserResponse } from "../models/Questionnaire.js";
// const PartialResponse = require("../models/PartialResponse");
import upload from "../middleware/uploadImage.js";

// Create a new questionnaire
router.post("/create", async (req, res) => {
  try {
    const { name, description, questions } = req.body;
    const questionnaire = new Questionnaire({
      name,
      description,
      questions,
    });
    await questionnaire.save();
    res.status(201).send(questionnaire);
  } catch (error) {
    res.status(500).send({ error: "Failed to create questionnaire" });
  }
});

// Route to upload an image and store the path in MongoDB
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Save image URL in response
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Image upload failed" });
  }
});

// Save partial responses
// router.post("/save-progress", async (req, res) => {
//   try {
//     const { questionnaireId, answers } = req.body;
//     const existingResponse = await PartialResponse.findOne({
//       questionnaireId,
//     });

//     if (existingResponse) {
//       // Update existing partial response
//       existingResponse.answers = answers;
//       await existingResponse.save();
//       res.status(200).send(existingResponse);
//     } else {
//       // Create a new partial response
//       const newResponse = new PartialResponse({
//         userId,
//         questionnaireId,
//         answers,
//       });
//       await newResponse.save();
//       res.status(201).send(newResponse);
//     }
//   } catch (error) {
//     res.status(500).send({ error: "Failed to save progress" });
//   }
// });

router.post("/:id/submit", async (req, res) => {
  try {
    const { answers, sessionId, timeSpent } = req.body; // Assuming answers, sessionId, and timeSpent are sent in the body

    // Find the questionnaire by ID
    const questionnaire = await Questionnaire.findById(req.params.id);
    if (!questionnaire) {
      return res.status(404).json({ error: "Questionnaire not found" });
    }

    // Increment the total completions count
    questionnaire.totalCompletions += 1;

    // Create a new user response document
    const newUserResponse = new UserResponse({
      sessionId,
      questionnaireId: questionnaire._id,
      answers: answers.map((answer) => ({ answer: answer.answer })), // Assuming answers are an array of { answer: 'value' }
      timeSpent,
      status: "completed",
      completedAt: new Date(),
    });

    // Save the user response
    await newUserResponse.save();

    // Link the user response to the questionnaire
    questionnaire.userResponses.push(newUserResponse._id);
    await questionnaire.save();

    res.json({ message: "Questionnaire submitted successfully", answers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit questionnaire" });
  }
});

// Get a questionnaire (with questions)
router.get("/:id", async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    if (!questionnaire) {
      return res.status(404).send({ error: "Questionnaire not found" });
    }
    res.status(200).send(questionnaire);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch questionnaire" });
  }
});

// Update Questionnaire
router.put("/:id", async (req, res) => {
  try {
    const updatedQuestionnaire = await Questionnaire.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedQuestionnaire);
  } catch (err) {
    res.status(400).send("Error updating questionnaire");
  }
});

// Route to get paginated questionnaires
// router.get('/', async (req, res) => {
//   const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
//   const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

//   const skip = (page - 1) * limit;

//   try {
//     // Fetch questionnaires with pagination
//     const questionnaires = await Questionnaire.find()
//       .skip(skip)
//       .limit(limit);

//     const totalCount = await Questionnaire.countDocuments();  // Get total count for pagination

//     res.json({
//       data: questionnaires,
//       totalCount,
//       totalPages: Math.ceil(totalCount / limit), // Total number of pages
//     });
//   } catch (error) {
//     console.error('Error fetching questionnaires:', error);
//     res.status(500).json({ error: 'Failed to fetch questionnaires' });
//   }
// });

router.get("/", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const sortCriterion = req.query.sortCriterion || "name"; // Default sorting criterion
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1; // Sorting order
  const lastItemId = req.query.lastItemId || null; // For pagination

  // Constructing the sorting object dynamically based on the sort criterion
  let sortObj = {};
  if (sortCriterion === "questions") {
    sortObj = { questionCount: sortOrder }; // Sort by the number of questions (calculated field)
  } else if (sortCriterion === "totalCompletions") {
    sortObj = { totalCompletions: sortOrder }; // Sort by total completions
  } else {
    sortObj = { name: sortOrder }; // Default to sorting by name
  }

  try {
    let query = {};

    // If paginating using an object ID
    if (lastItemId) {
      query[sortCriterion] = { [sortOrder === 1 ? "$gt" : "$lt"]: lastItemId };
    }

    // Aggregation pipeline
    const questionnaires = await Questionnaire.aggregate([
      {
        $addFields: {
          questionCount: { $size: "$questions" }, // Add a field with the number of questions
        },
      },
      {
        $sort: { ...sortObj, name: sortOrder, totalCompletions: sortOrder }, // Sorting by multiple fields
      },
      {
        $skip: (parseInt(req.query.page || 1) - 1) * limit, // Pagination (skip previous pages)
      },
      {
        $limit: limit, // Limit the number of results
      },
    ]);

    res.json({
      data: questionnaires,
      lastItemId:
        questionnaires.length > 0
          ? questionnaires[questionnaires.length - 1]._id
          : null,
    });
  } catch (error) {
    console.error("Error fetching questionnaires:", error);
    res.status(500).json({ error: "Failed to fetch questionnaires" });
  }
});

// Increment completion count
router.post("/complete/:id", async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    if (!questionnaire) {
      return res.status(404).send({ error: "Questionnaire not found" });
    }
    questionnaire.totalCompletions += 1;
    await questionnaire.save();
    res.status(200).send(questionnaire);
  } catch (error) {
    res.status(500).send({ error: "Failed to update completions" });
  }
});

// Delete a questionnaire
router.delete("/:id", async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findByIdAndDelete(req.params.id);
    if (!questionnaire) {
      return res.status(404).send({ error: "Questionnaire not found" });
    }
    res.status(200).send({ message: "Questionnaire deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: "Failed to delete questionnaire" });
  }
});

// Save the final submission
router.post("/:id/submit", async (req, res) => {
  const { sessionId, answers, timeSpent } = req.body; // Use sessionId here
  const { id } = req.params;

  try {
    let userResponse = await UserResponse.findOne({
      sessionId, // Use sessionId instead of userId
      questionnaireId: id,
      status: "in-progress",
    });

    if (!userResponse) {
      return res.status(404).json({ message: "No progress found" });
    }

    userResponse.answers = answers;
    userResponse.timeSpent = timeSpent;
    userResponse.status = "completed";
    userResponse.completedAt = new Date();

    // Update questionnaire's total completions
    const questionnaire = await Questionnaire.findById(id);
    questionnaire.totalCompletions += 1;
    await questionnaire.save();

    await userResponse.save();
    res.status(200).json({ message: "Questionnaire submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error submitting questionnaire" });
  }
});

router.get("/:questionnaireId/statistics", async (req, res) => {
  const { questionnaireId } = req.params;

  try {
    // Fetch user responses related to the given questionnaireId
    const responses = await UserResponse.find({ questionnaireId });

    if (!responses || responses.length === 0) {
      return res
        .status(404)
        .json({ error: "No responses found for this questionnaire" });
    }

    // Calculate total responses
    const totalResponses = responses.length;

    // Calculate average completion time (timeSpent in seconds, average in seconds)
    const totalTime = responses.reduce(
      (sum, response) => sum + response.timeSpent,
      0
    );
    const averageCompletionTime = totalTime / totalResponses;

    // Responses per day/week/month (filtering by completion time)
    const now = new Date();

    const dailyResponses = responses.filter((response) => {
      const responseDate = new Date(response.completedAt);
      return responseDate.toDateString() === now.toDateString(); // Same day
    });

    const weeklyResponses = responses.filter((response) => {
      const responseDate = new Date(response.completedAt);
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Start of this week
      return responseDate >= startOfWeek;
    });

    const monthlyResponses = responses.filter((response) => {
      const responseDate = new Date(response.completedAt);
      return (
        responseDate.getMonth() === now.getMonth() &&
        responseDate.getFullYear() === now.getFullYear()
      ); // Same month and year
    });

    const pieChartData = responses.reduce((acc, response) => {
      // Iterate through each answer object
      response.answers.forEach((answerObj) => {
        // If answerObj.answer is an array (or a single value), handle accordingly
        const answers = Array.isArray(answerObj.answer)
          ? answerObj.answer
          : [answerObj.answer];

        answers.forEach((answer) => {
          // We use the answer _id or value as the key
          const answerId = answer._id || answer;
          acc[answerId] = (acc[answerId] || 0) + 1;
        });
      });
      return acc;
    }, {});

    // Return the statistics as a JSON response
    res.json({
      averageCompletionTime,
      totalResponses,
      dailyResponsesCount: dailyResponses.length,
      weeklyResponsesCount: weeklyResponses.length,
      monthlyResponsesCount: monthlyResponses.length,
      pieChartData,
    });
  } catch (error) {
    console.error("Error fetching questionnaire statistics:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
