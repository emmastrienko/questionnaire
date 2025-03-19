import React, { useState, useEffect, useRef, useCallback } from "react";
import { getQuestionnaires, deleteQuestionnaire } from "../services/api";
import { Link } from "react-router-dom";
import "../styles/QuestionnaireCatalog.css";

const QuestionnaireCatalog = () => {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortCriterion, setSortCriterion] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [hasMore, setHasMore] = useState(true);

  const currentPageRef = useRef(1);
  const scrollTimeoutRef = useRef(null); // Prevents excessive calls

  const fetchQuestionnaires = useCallback(
    async (page, reset = false) => {
      if (loading || !hasMore) return;

      setLoading(true);
      try {
        const response = await getQuestionnaires(
          page,
          sortCriterion,
          sortOrder
        );
        const { data } = response;

        setQuestionnaires((prev) => (reset ? data : [...prev, ...data]));
        currentPageRef.current = page + 1;
        setHasMore(data.length > 0);
      } catch (error) {
        setError("Failed to fetch questionnaires");
      } finally {
        setLoading(false);
      }
    },
    [sortCriterion, sortOrder]
  );

  const handleDelete = async (id) => {
    try {
      await deleteQuestionnaire(id);
      setQuestionnaires((prev) => prev.filter((q) => q._id !== id));
    } catch (err) {
      setError("Failed to delete questionnaire");
    }
  };

  const handleSort = (criterion) => {
    const order =
      sortCriterion === criterion && sortOrder === "asc" ? "desc" : "asc";

    setSortCriterion(criterion);
    setSortOrder(order);
    currentPageRef.current = 1;
    setHasMore(true);
    setQuestionnaires([]);
  };

  useEffect(() => {
    fetchQuestionnaires(1, true);
  }, [fetchQuestionnaires]);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      if (scrollTimeoutRef.current) return; // Prevent spamming API calls

      scrollTimeoutRef.current = setTimeout(() => {
        if (
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 150
        ) {
          fetchQuestionnaires(currentPageRef.current);
        }
        scrollTimeoutRef.current = null;
      }, 300); // Debounce for 300ms
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [fetchQuestionnaires, hasMore, loading]);

  return (
    <div className="catalog-container">
      <h1 className="catalog-heading">Questionnaire Catalog</h1>

      {/* Sorting Controls */}
      <div className="sorting-controls">
        <button onClick={() => handleSort("name")}>
          Sort by Name{" "}
          {sortCriterion === "name" && (sortOrder === "asc" ? "↓" : "↑")}
        </button>
        <button onClick={() => handleSort("questions")}>
          Sort by Number of Questions{" "}
          {sortCriterion === "questions" && (sortOrder === "asc" ? "↓" : "↑")}
        </button>
        <button onClick={() => handleSort("totalCompletions")}>
          Sort by Completions{" "}
          {sortCriterion === "totalCompletions" &&
            (sortOrder === "asc" ? "↓" : "↑")}
        </button>
      </div>

      {/* List of Questionnaires */}
      <ul className="questionnaire-container">
        {questionnaires.map((questionnaire) => (
          <li key={questionnaire._id} className="questionnaire-card">
            <h3 className="questionnaire-title">{questionnaire.name}</h3>
            <p className="questionnaire-description">
              {questionnaire.description}
            </p>
            <p className="questionnaire-info">
              Questions: {questionnaire.questions.length}
            </p>
            <p className="questionnaire-info">
              Completions: {questionnaire.totalCompletions}
            </p>
            <div className="actions">
              <Link to={`/statistics/${questionnaire._id}`}>Statistics</Link>
              <Link to={`/edit/${questionnaire._id}`}>Edit</Link>
              <Link to={`/run/${questionnaire._id}`}>Run</Link>
              <button onClick={() => handleDelete(questionnaire._id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Loading & End Message */}
      {loading && <div>Loading more...</div>}
      <Link to={`/create`} className="create-btn">Create Questionnaire</Link>
    </div>
  );
};

export default QuestionnaireCatalog;
