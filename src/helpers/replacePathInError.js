const deepcopy = require('deep-copy')

const replaceErrorPath = (error, keysArray) => {
  const curr = {...error}
  const newErr = deepcopy(curr)

  const errors = newErr.errors;

  if(!errors) {
    return error
  }

  errors.forEach((err) => {
    const currKey = err.path

    const needToReplaceKey = keysArray.find(item => item[0] === currKey)

    if(needToReplaceKey) {
      err.path = needToReplaceKey[1]
    }
  });

  return newErr
};

module.exports = replaceErrorPath