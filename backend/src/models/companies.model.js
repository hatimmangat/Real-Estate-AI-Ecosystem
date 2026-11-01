import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    companyTitle: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    website: {
      type: String
    },
    address: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    mobile: {
      type: String,
      required: true
    },
    landline: {
      type: String
    },
    agencyLogo: {
      type: String
    },
    ceoName: {
      type: String,
      required: true
    },
    ceoDesignation: {
      type: String
    },
    ceoMessage: {
      type: String
    },
    ceoProfilePicture: {
      type: String
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Company = mongoose.model('Company', CompanySchema);

export default Company;