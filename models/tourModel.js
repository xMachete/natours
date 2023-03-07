// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');

const { default: slugify } = require('slugify');
const User = require('./userModel');

// const validator = require('validator');

const tourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'You have to fill name!'],
      minLength: [5, 'Name must be at least 5 char long'],
      maxLength: [30, 'Name must be maximum 30 characters long'],
      // validate: validator.isAlpha,
    },
    slug: String,

    price: {
      type: Number,
      required: true,
      default: 500,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Group must have group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'It shoould have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'The difficulty must be either easy, meddium or hard',
      },
    },
    ratingAvarage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true,
      required: [true, 'Tour must have summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'Tour must have cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: true,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      adderess: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        adderess: String,
        description: String,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual('durationWeek').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
//DOCUMENT MIDDLEWARE, RUNS BEFORE SAVE AND CREATE
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

// embedding user into tours
tourSchema.pre('save', async function (next) {
  const guidesPromises = this.guides.map(async (el) => await User.findById(el));
  this.guides = await Promise.all(guidesPromises);

  next();
});

//QUERY MIDDLEWARE

//Sve fje koje pocinju sa find primenjuju
// tourSchema.pre(/^find/, function (next) {
//   this.find({ secretTour: { $ne: true } });
//   this.startDate = Date.now();

//   next();
// });
tourSchema.index({ price: 1, ratingAvarage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});
tourSchema.post(/^find/, function (doces, next) {
  console.log(`Query took ${Date.now() - this.startDate} miliseconds`);
  next();
});

//Aggregation middleware
tourSchema.pre('aggregate', function (next) {
  this.pipline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
