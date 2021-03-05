class NewError {
  constructor(status, field, message, errors) {
    this.status = status;
    this.field = field;
    this.message = message;
    this.errors = errors || []
  }

  setStatus(v) {
    this.status = v;
    return this;
  }

  setField(v) {
    this.field = v;
    return this;
  }

  setMessage(v) {
    if (Array.isArray(v)) {
      this.message = v[0];
    } else {
      this.message = v;
    }

    return this;
  }

  setMultiple(v) {
    this.errors = v.map(item => {
      return {
        field: item.path || item.field,
        message: item.message
      }
    })
    return this;
  }

  _formatMultiple(arr) {
    return arr.map(item => {
      return {
        path: item.field,
        message: item.message
      }
    })
  }

  v() {
    const DEFAULT_STATUS = 500;
    const DEFAULT_FIELD = 'error';
    const DEFAULT_MESSAGE = 'Something went wrong';

    const errors = this.errors.length ? this._formatMultiple(this.errors) : [
      {
        path: this.field || DEFAULT_FIELD,
        message: this.message || DEFAULT_MESSAGE,
      },
    ];  

    return {
      status: this.status || DEFAULT_STATUS,
      errors
    };
  }
}

const buildErrors = (err) => {
  const errors = err.errors;
  const newErrors = {};

  errors.forEach((err) => {
    if (newErrors[err.path]) {
      newErrors[err.path].push(err.message);
      return;
    }

    newErrors[err.path] = [err.message];
  });

  return newErrors;
};

const madeErr = (status, key, message) => {
  return new NewError(status, key, message);
};

const handleSchemaError = (err, next) => {
  const { path, errors } = err;

  if (path) {
    return next(madeErr().setStatus(400).setMessage(errors).setField(path).v());
  }

  const formatted = err.inner.map((err) => {
    return {
      path: err.path,
      message: err.errors[0],
    };
  });

  return next(madeErr().setStatus(400).setMultiple(formatted).v());
};

module.exports = { buildErrors, madeErr, handleSchemaError, NewError };
