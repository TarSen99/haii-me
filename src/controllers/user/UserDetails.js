const User = require('@/models/user/User');
const Image = require('@/models/image/Image.js');
const optimize = require('@/services/OptimizeImageService.js');
const {
  StepOneSchemaCelebrity,
  StepOneSchemaSimple,
} = require('@/validators/user/StepOne.js');
const { Op } = require('sequelize');

const {
  getPresignedUrl,
  getFullFilePath,
  getName,
  getFileRelativePath,
  deleteObject,
} = require('@/services/Aws.js');

const {
  MEDIA_TYPES_KEYS,
  IMAGE_TYPE,
  VIDEO_TYPE,
  IMAGE_OPTIMIZED,
} = require('@/config/constants.js');

const { madeErr, handleSchemaError } = require('@/helpers/buildErrors');

const getUserOwnDetails = async (req, res) => {
  const { id } = req.info;

  const userDetails = await User.findOne({
    where: {
      id,
    },
    include: Image,
  });

  const data = userDetails.toJSON();

  delete data.password;
  delete data.activationToken;

  return res.status(200).json({
    details: data,
  });
};

const celebrityValuesToUpdate = [
  'name',
  'category',
  'pricePerVideo',
  'pricePerVideoBusiness',
  'currency',
  'availableForBusinessRequest',
  'description',
];

const simpleValuesToUpdate = ['name', 'description'];

const updateUserDetails = async (req, res, next) => {
  const { id } = req.info;
  const dataToUpdate = {};
  const baseData = { ...req.info.user };

  const isCelebrity = req.info.user.spendMoney;

  const valuesToUpdate = isCelebrity
    ? celebrityValuesToUpdate
    : simpleValuesToUpdate;

  for (let i of valuesToUpdate) {
    if (baseData[i]) {
      dataToUpdate[i] = baseData[i];
    }

    if (req.body[i]) {
      dataToUpdate[i] = req.body[i];
    }
  }

  try {
    if (isCelebrity) {
      await StepOneSchemaCelebrity.validate(dataToUpdate, {
        abortEarly: false,
      });
    } else {
      await StepOneSchemaSimple.validate(dataToUpdate, { abortEarly: false });
    }
  } catch (err) {
    return handleSchemaError(err, next);
  }

  await User.update(dataToUpdate, {
    where: {
      id,
    },
  });

  return res.status(200).json({
    success: true,
  });
};

const removeFromS3 = async (image) => {
  return new Promise(async (resolve, reject) => {
    try {
      const imageToDeleteData = image.toJSON();

      if (image.originalUrl) {
        const imageToDeleteRelativePath = getFileRelativePath(
          imageToDeleteData.fileType,
          IMAGE_TYPE,
          imageToDeleteData.name
        );

        await deleteObject(imageToDeleteRelativePath);
      }

      if (image.optimizedUrl) {
        const imageToDeleteOptimized = getFileRelativePath(
          'jpg',
          IMAGE_OPTIMIZED,
          imageToDeleteData.name
        );

        await deleteObject(imageToDeleteOptimized);
      }

      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const updateImage = async (req, res, next) => {
  const { id } = req.info;
  const headers = req.headers;
  const type = headers['content-type'];
  const imageFileType = type.split('/')[1];

  const imagesToDelete = await Image.findAll({
    where: {
      userId: id,
      optimizedUrl: null,
    },
  });

  if (imagesToDelete) {
    imagesToDelete.forEach(async (item) => {
      await removeFromS3(item);
      await item.destroy();
    });
  }

  if (!ALLOWED_TYPES.includes(type)) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('image')
        .setMessage('Image type is not supported')
        .v()
    );
  }

  const fileName = getName();
  // images/image.jpg
  const relativePath = getFileRelativePath(imageFileType, IMAGE_TYPE, fileName);

  const assignedUrl = await getPresignedUrl(relativePath).catch((err) => {
    res.status(400).json(err);
  });

  if (!assignedUrl) {
    return;
  }

  const image = await Image.create({
    userId: id,
    name: fileName,
    fileType: imageFileType,
    originalUrl: getFullFilePath(relativePath),
  });

  return res.status(200).json({
    success: true,
    url: assignedUrl,
    imageData: image,
  });
};

const handleImageWasUploaded = async (req, res, next) => {
  const { id } = req.info;
  const { id: imageId } = req.query;

  const image = await Image.findOne({
    where: {
      id: imageId,
      optimizedUrl: null,
    },
  });

  if (!image) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('image')
        .setMessage('Image not found')
        .v()
    );
  }

  const imageToDelete = await Image.findOne({
    where: {
      id: {
        [Op.ne]: imageId,
      },
      userId: {
        [Op.eq]: id,
      },
    },
  });

  try {
    await removeFromS3(imageToDelete);

    await Image.destroy({
      where: {
        id: {
          [Op.ne]: imageId,
        },
        userId: {
          [Op.eq]: id,
        },
      },
    });
  } catch (e) {
    console.log(e);
  }

  const imageData = image.toJSON();

  const originalRelativePath = getFileRelativePath(
    imageData.fileType,
    IMAGE_TYPE,
    imageData.name
  );

  const optimizedRelativePath = getFileRelativePath(
    'jpg',
    IMAGE_OPTIMIZED,
    imageData.name
  );

  const result = await optimize(originalRelativePath, optimizedRelativePath);

  if (!result) {
    return next(
      madeErr()
        .setStatus(500)
        .setField('system')
        .setMessage('Internal server Error')
        .v()
    );
  }

  if (result.statusCode && result.statusCode >= 400) {
    console.log(result);
    return next(
      madeErr()
        .setStatus(500)
        .setField('system')
        .setMessage('Internal server Error')
        .v()
    );
  }

  if (result.error) {
    console.log(result);
    return next(
      madeErr()
        .setStatus(500)
        .setField('system')
        .setMessage('Internal server Error')
        .v()
    );
  }

  const optimizedFullpath = getFullFilePath(optimizedRelativePath);

  await Image.update(
    {
      optimizedUrl: optimizedFullpath,
    },
    {
      where: {
        id: imageData.id,
      },
    }
  );

  const updatedImage = await Image.findOne({
    where: {
      id: imageData.id,
    },
  });

  return res.status(200).json({
    success: true,
    ...updatedImage.toJSON(),
  });
};

// const updateVideo = async (req, res, next) => {
//   const { id } = req.info;
//   const headers = req.headers
//   const type = headers['content-type']
//   const videoType = type.split('/')[1]

//   const { assignedUrl, relativePath } = await getPresignedUrl({
//     type: 'video',
//     fileType: videoType,
//   }).catch((err) => {
//     res.status(400).json(err);
//   });

//   if(!assignedUrl) {
//     return
//   }

//   await User.update({
//     signedUrl: getFullFilePath(relativePath)
//   }, {
//     where: {
//       id,
//     },
//   });

//   return res.status(200).json({
//     success: true,
//     url: assignedUrl,
//   });
// };

module.exports = {
  getUserOwnDetails,
  updateUserDetails,
  updateImage,
  handleImageWasUploaded,
};
