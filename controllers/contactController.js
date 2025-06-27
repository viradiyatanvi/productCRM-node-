const Contact = require('../models/Contact');
const User = require('../models/User');

exports.listContacts = async (req, res) => {
  const contacts = await Contact.find().populate("assignedTo");
  res.render('contact/list', { contacts,user:req.session.user });
};


exports.getAddContactForm = async (req, res) => {
  try {
    const users = await User.find(); 
    res.render('contact/add', { users, error: null,user:req.session.user }); 
  } catch (err) {
    console.log("Error rendering add page", err);
    res.render('contact/add', { users: [], error: "Something went wrong" });
  }
};


exports.postAddContact = async (req, res) => {
  try {
    const { fullName, email, phone, city, assignedTo } = req.body;

    console.log("Form Data:", req.body); 

    if (!fullName || !phone) {
      const users = await User.find();
      return res.render('contact/add', { users, error: "Full name and phone are required",user:req.session.user  });
    }

    await Contact.create({ fullName, email, phone, city, assignedTo });
    res.redirect('/contact');
  } catch (err) {
    console.error("Save Error:", err); 
    const users = await User.find();
    res.render('contact/add', { users, error: "Something went wrong while saving" });
  }
};
