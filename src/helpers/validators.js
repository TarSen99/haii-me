const isEmpty = (v) => {
  const currV = v || ''
  const formatted = currV.trim()

  if(!formatted) {
    throw new Error('Value can not be blank');
  }
}

module.exports = {
  isEmpty
}