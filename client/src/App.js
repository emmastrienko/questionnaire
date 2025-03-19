import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import QuestionnaireCatalog from "./components/QuestionnaireCatalog";
import QuestionnaireBuilder from "./components/QuestionnaireBuilder";
import EditPage from "./components/EditQuestionnaire";
import InteractiveQuestionnaire from "./components/InteractiveQuestionnaire";
import QuestionnaireStatistics from "./components/QuestionnaireStatistics";
import "./global.css"

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<QuestionnaireCatalog />} />
        <Route path="/create" element={<QuestionnaireBuilder />} />
        {/* Fixed the component prop to element */}
        <Route path="/edit/:id" element={<EditPage />} />
        <Route
          path="/run/:id"
          element={<InteractiveQuestionnaire />}
        />
        <Route
          path="/statistics/:id"
          element={<QuestionnaireStatistics  />}
        />
      </Routes>
    </Router>
  );
};

export default App;
