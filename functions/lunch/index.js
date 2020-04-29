exports.puffLunch = (req, res) => {
  let body = req.query.text;
  res.send('Hello, text = ' + body);
};
