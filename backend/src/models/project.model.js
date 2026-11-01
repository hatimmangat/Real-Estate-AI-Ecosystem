import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: false
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: false
    },
    city: {
      type: String,
      required: false
    },
    projectType: {
      type: String,
      enum: ['Residential', 'Commercial', 'Mixed-Use', 'Industrial', 'Other'],
      required: false
    },
    status: {
      type: String,
      enum: ['Planning', 'Under Progress', 'Completed', 'On Hold'],
      default: 'Planning'
    },
    startDate: {
      type: Date
    },
    completionDate: {
      type: Date
    },
    cost: {
      type: Number
    },
    amenities: [{
      type: String
    }],
    images: [{
      type: String
    }],
    coverImage: {
      type: String
    },

    contactPerson: {
      name: {
        type: String
      },
      phone: {
        type: String
      },
      email: {
        type: String
      }
    },
    featured: {
      type: Boolean,
      default: false
    },

  },
  {
    timestamps: true
  }
);

const Project = mongoose.model('Project', ProjectSchema);

export default Project;
