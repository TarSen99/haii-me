const request = require('supertest');
const app = require('@/app');

const DEFAULT_REQUEST_DATA = {
  to: 'John',
  from: 'Taras',
  instructions: 'Please may him all the best to his birthday',
  category: 'Congratulations with birthday',
  email: 'john@mail.com',
  toUserId: 2,
  fromUserId: 1,
  dueDate: new Date(),
  type: 1,
  currency: 'UAN',
  price: 100,
};

const postData = (data = {}) => {
  const localData = {
    ...DEFAULT_REQUEST_DATA,
    ...data,
  };

  return request(app).post('/api/1.0/requests/request').send(localData);
};

module.exports = postData