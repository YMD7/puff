exports.function = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      const error = new Error('Only POST requests are accepted');
      error.code = 405;
      throw error;
    }
  } catch (err) {
    console.error(err);
    res.status(err.code || 500).send(err);
    return Promise.reject(err);
  }
};

