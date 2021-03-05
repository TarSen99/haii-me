const yup = require('yup');

// name: 'Taras Seniv',
// category: 'Blogger',
// availableForBusinessRequest: true,
// pricePerVideo: 100,
// pricePerVideoBusiness: 1000,
// description: 'Hello world',
// currency: 'UAN',

const StepOneSchemaSimple = yup.object().shape({
  name: yup
    .string('Name should be a string')
    .required('Name can not be blank')
    .max(100, 'Name length can not be greater than 100'),
  description: yup
    .string('Description should be a string')
    .required('Description can not be blank')
    .max(250, 'Description length can not be greater than 250'),
});

const StepOneSchemaCelebrity = yup.object().shape({
  name: yup
    .string('Name should be a string')
    .required('Name can not be blank')
    .max(100, 'Name length can not be greater than 100'),
  category: yup
    .string('Category should be a string')
    .required('Category can not be blank')
    .max(100, 'Category length can not be greater than 100'),
  availableForBusinessRequest: yup.boolean(
    'Available for business request should be true of false'
  ),
  pricePerVideo: yup
    .number('Price per video should be a number')
    .required('Price per video can not be blank')
    .min(0, 'Price per video can not be less than 0')
    .max(100000, 'Price per video can not be greater than 100000'),
  pricePerVideoBusiness: yup.number().when('availableForBusinessRequest', {
    is: true,
    then: yup
      .number('Price per video for business should be a number')
      .required('Price per video for business can not be blank')
      .min(0, 'Price per video for business can not be less than 0')
      .max(
        100000,
        'Price per video for business can not be greater than 100000'
      ),
    otherwise: yup.number().notRequired(),
  }),
  description: yup
    .string('Description should be a string')
    .required('Description can not be blank')
    .max(250, 'Description length can not be greater than 250'),
  currency: yup.string().required('Currency can not be blank').max(50),
});

module.exports = { StepOneSchemaCelebrity, StepOneSchemaSimple };
