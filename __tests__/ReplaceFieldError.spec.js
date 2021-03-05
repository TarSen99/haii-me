const replacePathInError = require('@/helpers/replacePathInError.js')

const ERROR = {
  errors: [
    {
      path: 'test_path'
    },
    {
      path: 'path_to_change'
    }
  ]
}

const DONT_CHANGE_ARRAY_FIELDS = [
  ['test_path1', 'other_field']
]

const CHANGE_ARRAY_FIELDS = [
  ['path_to_change', 'changed_path']
]

describe('replacePathInError', () => {
  it('Return new object', () => {
    const newErr = replacePathInError(ERROR, DONT_CHANGE_ARRAY_FIELDS)

    expect(newErr).not.toBe(ERROR)
  })

  it('Dont affect source error', () => {
    const newErr = replacePathInError(ERROR, CHANGE_ARRAY_FIELDS)

    expect(newErr).not.toEqual(ERROR)
  })

  it('Field to change should be changed', () => {
    const newErr = replacePathInError(ERROR, CHANGE_ARRAY_FIELDS)

    expect(newErr.errors[1].path).toBe(CHANGE_ARRAY_FIELDS[0][1])
  })

  it('Field not to change shouldnt be changed', () => {
    const newErr = replacePathInError(ERROR, CHANGE_ARRAY_FIELDS)

    expect(newErr.errors[0].path).toBe(ERROR.errors[0].path)
  })

  it('Changed object should have different field than source object', () => {
    const newErr = replacePathInError(ERROR, CHANGE_ARRAY_FIELDS)

    expect(newErr.errors[1].path).not.toBe(ERROR.errors[1].path)
  })

  it('Dont change object', () => {
    const newErr = replacePathInError(ERROR, DONT_CHANGE_ARRAY_FIELDS)

    expect(newErr).toEqual(ERROR)
  })
})