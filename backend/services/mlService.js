import axios from 'axios';

export const predictComplaintRisk = async ({ customerName, email, message }) => {
  const baseUrl = process.env.ML_SERVICE_URL;
  if (!baseUrl) return null;

  try {
    const response = await axios.post(
      `${baseUrl.replace(/\/$/, '')}/predict`,
      { customerName, email, message },
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    console.error('Python ML service failed:', error.response?.data || error.message);
    return null;
  }
};

export const getMlInsights = async (tickets) => {
  const baseUrl = process.env.ML_SERVICE_URL;
  if (!baseUrl) return null;

  try {
    const response = await axios.post(
      `${baseUrl.replace(/\/$/, '')}/insights`,
      { tickets },
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    console.error('Python ML insights failed:', error.response?.data || error.message);
    return null;
  }
};
