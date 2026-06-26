export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ 
    key: process.env.REACT_APP_ANTHROPIC_KEY 
  });
}
