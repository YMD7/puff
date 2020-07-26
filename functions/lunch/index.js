exports.function = async (req, res) => {

  const verifyWebhook = (req) => {
    let text = req.query.text;
    console.log(text);
    res.send(`${text}, Puff!`);
  }

  try {
    if (req.method !== 'GET') {
      const error = new Error('Only POST requests are accepted');
      error.code = 405;
      throw error;
    }

    verifyWebhook(req);

  } catch (err) {
    console.error(err);
    res.status(err.code || 500).send(err);
    return Promise.reject(err);
  }
};

