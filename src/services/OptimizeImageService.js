const request = require('request');

const OPTIMIZE_SERVICE_API_URL = 'https://1cub263iz4.execute-api.eu-central-1.amazonaws.com/dev/optimize-image'

const optimize = async (srcKey, newKey) => {
  const URL = `?srcKey=${srcKey}&newKey=${newKey}`

  return new Promise((resolve, rej) => {
    request(`${OPTIMIZE_SERVICE_API_URL}${URL}`, (err, res, body) => {
      if(err) {
        rej(err)
        return
      }

      resolve(JSON.parse(res.body))
    })
  })
} 

module.exports = optimize