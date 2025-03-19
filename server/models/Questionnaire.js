const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for questions
const questionSchema = new Schema({
  type: {
    type: String,
    enum: ["text", "single_choice", "multiple_choice", "image"],
    required: true,
  },
  text: { type: String, required: true },
  options: [{ type: String }],
  imageUrl: { type: String },
});

// Define the schema for the questionnaire
// Define the schema for the questionnaire
const questionnaireSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  questions: [questionSchema],
  totalCompletions: { type: Number, default: 0 },
  userResponses: [
    { type: mongoose.Schema.Types.ObjectId, ref: "UserResponse" },
  ], 
  createdAt: { type: Date, default: Date.now },
});

// Adding sorting functionality: using MongoDB's index to sort by question count or completions
questionnaireSchema.index({ name: 1, totalCompletions: 1 });

const Questionnaire = mongoose.model("Questionnaire", questionnaireSchema);

const answerSchema = new mongoose.Schema({
  answer: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
});

const userResponseSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  questionnaireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Questionnaire",
    required: true,
  },
  answers: [answerSchema], // An array of answer objects
  timeSpent: { type: Number },
  status: {
    type: String,
    enum: ["in-progress", "completed"],
    default: "in-progress",
  },
  completedAt: { type: Date },
});

// Creating a model for storing user responses
const UserResponse = mongoose.model("UserResponse", userResponseSchema);

// Export both models
module.exports = {
  Questionnaire,
  UserResponse,
};
