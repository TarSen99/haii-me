const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('@/config/constants');

const setToken = (data, res) => {
  const authToken = jwt.sign(data, SECRET_KEY);

  res.cookie('auth', authToken, {
    maxAge: 1000 * 60 * 60 * 24 * 7, //will expire after 1 week
  });
};

const verifyToken = (token) => {
  try {
    const data = jwt.verify(token, SECRET_KEY)

    return data
  } catch(e) {
    return false
  }
}

module.exports = { setToken, verifyToken };
