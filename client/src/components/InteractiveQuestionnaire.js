import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuestionnaireById, submitQuestionnaire } from "../services/api";
import "../styles/InteractiveQuestionnaire.css";

const InteractiveQuestionnaire = () => {
  const { id } = useParams(); // Retrieve the 'id' from the URL
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Generate and store sessionId if not already in localStorage
  const sessionId = localStorage.getItem("sessionId") || generateSessionId();

  function generateSessionId() {
    const newSessionId = "sess_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("sessionId", newSessionId); // Store sessionId in localStorage
    return newSessionId;
  }

  // Fetch questionnaire data when the component mounts
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const data = await getQuestionnaireById(id);
        setQuestionnaire(data);

        // Load saved progress if any from localStorage
        const savedProgress = JSON.parse(
          localStorage.getItem(`progress_${sessionId}_${id}`)
        );
        if (savedProgress) {
          setAnswers(savedProgress.answers);
          setTimeSpent(savedProgress.timeSpent);
        }
      } catch (error) {
        console.error("Error fetching questionnaire:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [id, sessionId]);

  // Function to handle answering a question
  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prevAnswers) => {
      const updatedAnswers = { ...prevAnswers, [questionId]: answer };

      // Save progress to localStorage after each change
      localStorage.setItem(
        `progress_${sessionId}_${id}`,
        JSON.stringify({
          answers: updatedAnswers,
          timeSpent,
        })
      );

      return updatedAnswers;
    });
  };

  // Function to save progress periodically or after each answer
  const handleSaveProgress = async () => {
    try {
      localStorage.setItem(
        `progress_${sessionId}_${id}`,
        JSON.stringify({
          answers,
          timeSpent,
        })
      );
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleImageUpload = (questionId, file) => {
    // Make sure the file is valid and of an image type
    if (file && file.type.startsWith("image/")) {
      const newAnswers = { ...answers, [questionId]: file };
      setAnswers(newAnswers);

      // Save progress to localStorage after each change
      localStorage.setItem(
        `progress_${sessionId}_${id}`,
        JSON.stringify({
          answers: newAnswers,
          timeSpent,
        })
      );
    } else {
      alert("Please upload a valid image file.");
    }
  };

  // Validate that all questions have been answered
  const validateAnswers = () => {
    for (const question of questionnaire.questions) {
      const answer = answers[question._id];
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        return false; // If any question has no answer or empty array, return false
      }
    }
    return true; // All answers are provided
  };

  const handleSubmit = async () => {
    if (!validateAnswers()) {
      alert("Please answer all questions before submitting.");
      return; // Prevent submission if validation fails
    }

    // Format answers for submission to match the backend's expected structure
    const formattedAnswers = Object.keys(answers).map((key) => {
      const answer = answers[key];
      return {
        questionId: key,
        answer: Array.isArray(answer) ? answer : [answer], // Always send as an array
      };
    });

    try {
      await submitQuestionnaire(sessionId, id, formattedAnswers, timeSpent);

      // Clear progress from localStorage after submission
      localStorage.removeItem(`progress_${sessionId}_${id}`);

      alert("Questionnaire submitted!");
      navigate(`/statistics/${id}`);
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60); // Get minutes
    const remainingSeconds = seconds % 60; // Get remaining seconds
    return `${minutes} minutes ${remainingSeconds} seconds`;
  };

  // Function to simulate the timer for timeSpent (e.g., every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prevTime) => {
        const newTime = prevTime + 1;

        // Save progress to localStorage as timeSpent changes
        localStorage.setItem(
          `progress_${sessionId}_${id}`,
          JSON.stringify({
            answers,
            timeSpent: newTime,
          })
        );

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [answers, sessionId, id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!questionnaire) {
    return <div>Questionnaire not found.</div>;
  }

  return (
    <div className="questionnaire">
      <form className="questionnaire-form">
        <h1 className="questionnaire-title">{questionnaire.name}</h1>
        <p className="questionnaire-description">{questionnaire.description}</p>

        {questionnaire.questions.map((question) => (
          <div key={question._id} className="question">
            <p className="question-text">{question.text}</p>

            {question.type === "text" && (
              <input
                type="text"
                className="text-input"
                placeholder="Add your answer here"
                value={answers[question._id] || ""}
                onChange={(e) =>
                  handleAnswerChange(question._id, e.target.value)
                }
              />
            )}

            {question.type === "single_choice" && (
              <div className="single-choice">
                {question.options.map((option, index) => (
                  <label key={index} className="single-choice-label">
                    <input
                      type="radio"
                      className="single-choice-input"
                      name={question._id}
                      value={option}
                      checked={answers[question._id] === option}
                      onChange={(e) =>
                        handleAnswerChange(question._id, e.target.value)
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}

            {question.type === "multiple_choice" && (
              <div className="multiple-choice">
                {question.options.map((option, index) => (
                  <label key={index} className="multiple-choice-label">
                    <input
                      type="checkbox"
                      className="multiple-choice-input"
                      value={option}
                      checked={answers[question._id]?.includes(option)}
                      onChange={(e) => {
                        const newAnswers = [...(answers[question._id] || [])];
                        if (e.target.checked) {
                          newAnswers.push(option);
                        } else {
                          const index = newAnswers.indexOf(option);
                          if (index > -1) {
                            newAnswers.splice(index, 1);
                          }
                        }
                        handleAnswerChange(question._id, newAnswers);
                      }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}

            {question.type === "image" && (
              <div className="image-upload-question">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageUpload(question._id, e.target.files[0])
                  }
                />
                {answers[question._id] &&
                  answers[question._id] instanceof File && (
                    <div className="uploaded-image-preview">
                      <img
                        src={URL.createObjectURL(answers[question._id])}
                        alt="Uploaded"
                        className="uploaded-image"
                        width="200"
                      />
                    </div>
                  )}
              </div>
            )}
          </div>
        ))}

        <div className="form-actions">
          <button
            type="button"
            className="save-button"
            onClick={handleSaveProgress}
          >
            Save Progress
          </button>
          <button
            type="button"
            className="submit-button"
            onClick={handleSubmit}
          >
            Submit Questionnaire
          </button>
        </div>
      </form>

      <p className="time-spent">Time Spent: {formatTime(timeSpent)}</p>
    </div>
  );
};

export default InteractiveQuestionnaire;
