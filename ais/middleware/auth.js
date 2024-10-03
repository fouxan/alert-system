const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

const authenticateToken = (req, res, next) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (token == null) return res.sendStatus(401);

	jwt.verify(token, SECRET_KEY, (err, decoded) => {
		if (err) return res.sendStatus(403);

		req.user = { id: decoded.userId };
		next();
	});
};

module.exports = authenticateToken;
