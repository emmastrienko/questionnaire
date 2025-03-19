import React, { useState, useEffect } from "react";
import { updateQuestionnaire, getQuestionnaireById } from "../services/api"; // Assumed API methods
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { v4 as uuidv4 } from "uuid";
import "../styles/QuestionnaireBuilder.css";
import { GripVertical } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

// Sortable item for question options (same as original)
const SortableOptionItem = ({
  option,
  optionIndex,
  handleOptionChange,
  removeOption,
  questionId,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `${questionId}-option-${optionIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: "1px solid #ccc",
    padding: "10px",
    marginBottom: "5px",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  return (
    <div ref={setNodeRef} style={style} className="option-container">
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", padding: "5px" }}
      >
        <GripVertical size={18} />
      </span>
      <input
        type="text"
        value={option}
        onChange={(e) =>
          handleOptionChange(questionId, optionIndex, e.target.value)
        }
        required
      />
      <button
        className="remove-btn"
        type="button"
        onClick={() => removeOption(questionId, optionIndex)}
      >
        Remove
      </button>
    </div>
  );
};

const SortableItem = ({
  question,
  index,
  handleQuestionChange,
  removeQuestion,
  handleOptionChange,
  addOption,
  removeOption,
  handleDragEndOption,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: "1px solid #ccc",
    padding: "10px",
    marginBottom: "10px",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  return (
    <div ref={setNodeRef} style={style} className="question-container">
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", padding: "5px" }}
      >
        <GripVertical size={18} />
      </span>

      <div style={{ flexGrow: 1 }}>
        <div className="input-group">
          <span>{index + 1}.</span>
          <input
            type="text"
            value={question.text}
            onChange={(e) =>
              handleQuestionChange(index, "text", e.target.value)
            }
            required
          />
          <select
            value={question.type}
            onChange={(e) =>
              handleQuestionChange(index, "type", e.target.value)
            }
          >
            <option value="text">Text</option>
            <option value="single_choice">Single Choice</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="image">Image</option>
          </select>
          <button
            className="remove-btn"
            type="button"
            onClick={() => removeQuestion(index)}
          >
            Remove
          </button>
        </div>

        {/* Options for choice questions */}
        {(question.type === "single_choice" ||
          question.type === "multiple_choice") && (
          <div>
            <h3>Options</h3>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={(event) =>
                handleDragEndOption(event, index, question.id)
              }
            >
              <SortableContext
                items={question.options.map(
                  (_, idx) => `${question.id}-option-${idx}`
                )}
                strategy={verticalListSortingStrategy}
              >
                {question.options.map((option, optionIndex) => (
                  <SortableOptionItem
                    key={optionIndex}
                    option={option}
                    optionIndex={optionIndex}
                    handleOptionChange={handleOptionChange}
                    removeOption={removeOption}
                    questionId={question.id}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <button
              className="add-option-btn"
              type="button"
              onClick={() => addOption(index)}
            >
              Add Option
            </button>
          </div>
        )}

        {/* Image input for image-type questions */}
        {question.type === "image" && (
          <div>
            <p>User can upload an image to this question</p>
          </div>
        )}
      </div>
    </div>
  );
};

const QuestionnaireEditor = ({ questionnaireId }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);

  const { id } = useParams(); 
  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: uuidv4(),
        type: "text",
        text: "",
        options: [],
      },
    ]);
  };

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const response = await getQuestionnaireById(id); // Use 'id' here from useParams
        console.log(response); // Check the response
        if (response) {
          setName(response.name);
          setDescription(response.description);
          setQuestions(response.questions);
        }
      } catch (error) {
        console.error("Error fetching questionnaire:", error);
      }
    };
    fetchQuestionnaire();
  }, [id]); // Using 'id' for the useEffect dependency

  const handleQuestionChange = (index, field, value) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
      return updatedQuestions;
    });
  };

  const addOption = (index) => {
    setQuestions((prevQuestions) => {
      return prevQuestions.map((q, i) =>
        i === index ? { ...q, options: [...q.options, ""] } : q
      );
    });
  };

  const handleOptionChange = (qId, optionIndex, value) => {
    setQuestions((prevQuestions) => {
      return prevQuestions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            options: q.options.map((opt, oi) =>
              oi === optionIndex ? value : opt
            ),
          };
        }
        return q;
      });
    });
  };

  const removeQuestion = (index) => {
    setQuestions((prevQuestions) =>
      prevQuestions.filter((_, i) => i !== index)
    );
  };

  const removeOption = (qId, optionIndex) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      const question = updatedQuestions.find((q) => q.id === qId);
      if (question) {
        question.options.splice(optionIndex, 1);
      }
      return updatedQuestions;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reorderedQuestions = arrayMove(questions, oldIndex, newIndex);
      setQuestions(reorderedQuestions);
    }
  };

  const handleDragEndOption = (event, questionIndex, questionId) => {
    const { active, over } = event;
    if (!over) return;

    const oldOptionIndex = questions[questionIndex].options.findIndex(
      (opt) =>
        `${questionId}-option-${questions[questionIndex].options.indexOf(
          opt
        )}` === active.id
    );
    const newOptionIndex = questions[questionIndex].options.findIndex(
      (opt) =>
        `${questionId}-option-${questions[questionIndex].options.indexOf(
          opt
        )}` === over.id
    );

    if (oldOptionIndex !== -1 && newOptionIndex !== -1) {
      const newOptions = arrayMove(
        questions[questionIndex].options,
        oldOptionIndex,
        newOptionIndex
      );

      setQuestions((prevQuestions) => {
        const updatedQuestions = [...prevQuestions];
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          options: newOptions,
        };
        return updatedQuestions;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedQuestionnaire = {
        name,
        description,
        questions,
      };
      await updateQuestionnaire(id, updatedQuestionnaire);
      alert("Questionnaire updated successfully!");
      navigate("/")
    } catch (error) {
      console.error("Error updating questionnaire:", error);
    }
  };

  return (
    <div>
      <h1>Edit Questionnaire</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Questionnaire Name"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {questions.map((question, index) => (
              <SortableItem
                key={question.id}
                index={index}
                question={question}
                handleQuestionChange={handleQuestionChange}
                removeQuestion={removeQuestion}
                handleOptionChange={handleOptionChange}
                addOption={addOption}
                removeOption={removeOption}
                handleDragEndOption={handleDragEndOption}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button type="button" onClick={addQuestion}>
          Add Question
        </button>
        <div>
          <button type="submit">Update Questionnaire</button>
        </div>
      </form>
    </div>
  );
};

export default QuestionnaireEditor;
