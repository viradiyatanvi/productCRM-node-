const mongoose=require('mongoose');

const jobTypeSchema=new mongoose.Schema({
     name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
},{
    timestamps: true
});

const JobType=mongoose.model('JobType',jobTypeSchema);

module.exports=JobType;