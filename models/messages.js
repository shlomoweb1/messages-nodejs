// http://mongoosejs.com/docs/guide.html
var mongoose = require('mongoose');  
var messagesSchema = new mongoose.Schema({  
  title: {type: String, index: false},
  message: {type: String, index: false},
  attachment: {type: String, index: false},
  originalFilename : {type: String, index: false},
  created: { type: Date, default: Date.now, index: true }
});
mongoose.model('Messages', messagesSchema);