const API_KEY = process.env.SERVER_API_KEY;

module.exports = (req, res, next) => {
  const key = req.headers['x-api-key'];
  
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Invalid or missing API key.' });
  }
  
  next();
};