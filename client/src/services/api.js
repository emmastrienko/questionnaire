import axios from "axios";

// const apiUrl = import.meta.env.MODE === "development" 
//     ? "http://localhost:5000/api/questionnaires" 
//     : "/api/questionnaires";

const apiUrl = "/api/questionnaires"


// export const getQuestionnaires = async (page) => {
//   try {
//     const response = await axios.get(`${apiUrl}?page=${page}`); // Add the page query parameter
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching questionnaires:', error);
//     return []; // Return an empty array in case of error
//   }
// };

export const getQuestionnaires = async (page, sortCriterion, sortOrder) => {
  try {
    const response = await axios.get(
      `${apiUrl}?page=${page}&sortCriterion=${sortCriterion}&sortOrder=${sortOrder}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching questionnaires:", error);
    return []; // Return an empty array in case of error
  }
};

export const createQuestionnaire = async (questionnaireData) => {
  try {
    const response = await axios.post(`${apiUrl}/create`, questionnaireData);
    return response.data;
  } catch (error) {
    console.error("Error creating questionnaire:", error);
  }
};

// Function to get a questionnaire by ID
export const getQuestionnaireById = async (id) => {
  try {
    const response = await axios.get(`${apiUrl}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching questionnaire by ID:", error);
    return null; // Return null in case of error
  }
};

// Function to update a questionnaire by ID
export const updateQuestionnaire = async (id, updatedData) => {
  try {
    const response = await axios.put(`${apiUrl}/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating questionnaire:", error);
    return null; // Return null in case of error
  }
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`${apiUrl}/upload-image`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data.imageUrl; // Return uploaded image URL
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};

export const deleteQuestionnaire = async (id) => {
  try {
    await axios.delete(`${apiUrl}/${id}`);
  } catch (error) {
    console.error("Error deleting questionnaire:", error);
  }
};

// New function to submit the final answers
export const submitQuestionnaire = async (
  sessionId,
  questionnaireId,
  answers,
  timeSpent
) => {
  try {
    const response = await axios.post(`${apiUrl}/${questionnaireId}/submit`, {
      sessionId, // Use sessionId here as well
      answers,
      timeSpent,
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting questionnaire:", error);
  }
};

export const getQuestionnaireStatistics = async (questionnaireId) => {
  try {
    const response = await fetch(`${apiUrl}/${questionnaireId}/statistics`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    throw error;
  }
};
