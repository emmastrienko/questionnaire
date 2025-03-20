import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getQuestionnaireStatistics } from "../services/api";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from "chart.js";
import "../styles/QuestionnaireStatistics.css";

// Register necessary chart components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
);

const QuestionnaireStatistics = () => {
  const { id } = useParams();
  const [statistics, setStatistics] = useState({
    averageCompletionTime: 0,
    totalResponses: 0,
    dailyResponsesCount: 0,
    weeklyResponsesCount: 0,
    monthlyResponsesCount: 0,
    pieChartData: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const data = await getQuestionnaireStatistics(id);
        console.log("API Response:", data);
        setStatistics(data);
      } catch (error) {
        setError("Error fetching statistics: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [id]);

  if (loading) {
    return <div>Loading statistics...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const averageCompletionTimeInMinutes = (
    statistics.averageCompletionTime / 60
  ).toFixed(2);

  const dailyCompletionsData = {
    labels: ["Day"],
    datasets: [
      {
        label: "Completions per Day",
        data: [statistics.dailyResponsesCount],
        backgroundColor: "rgba(75,192,192,1)",
      },
    ],
  };

  const weeklyCompletionsData = {
    labels: ["Week"],
    datasets: [
      {
        label: "Completions per Week",
        data: [statistics.weeklyResponsesCount],
        backgroundColor: "rgba(153,102,255,1)",
      },
    ],
  };

  const monthlyCompletionsData = {
    labels: ["Month"],
    datasets: [
      {
        label: "Completions per Month",
        data: [statistics.monthlyResponsesCount],
        backgroundColor: "rgba(255,159,64,1)",
      },
    ],
  };

  const pieChartData = {
    labels: Object.keys(statistics.pieChartData),
    datasets: [
      {
        data: Object.values(statistics.pieChartData),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#FF9F40",
        ],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="statistics-container">
      <h1>Questionnaire Statistics</h1>
      <div className="stat-item">
        <h2>Average Completion Time</h2>
        <p>{averageCompletionTimeInMinutes} minutes</p>
      </div>

      <div className="flex">
        <div className="chart-container">
          <h2>Completions per Day</h2>
          <div className="chart">
            <Bar data={dailyCompletionsData} />
          </div>
        </div>

        <div className="chart-container">
          <h2>Completions per Week</h2>
          <div className="chart">
            <Bar data={weeklyCompletionsData} />
          </div>
        </div>

        <div className="chart-container">
          <h2>Completions per Month</h2>
          <div className="chart">
            <Bar data={monthlyCompletionsData} />
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h2>Question-wise Answer Distribution</h2>
        <div className="chart">
          <Pie data={pieChartData} />
        </div>
      </div>

      <Link to={`/`}>Return to main page</Link>
    </div>
  );
};

export default QuestionnaireStatistics;
