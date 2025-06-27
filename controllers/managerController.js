const Contact = require('../models/Contact');
const Manager = require('../models/Manager');


exports.createManager = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      alternatePhone,
      company,
      notes,
      addresses
    } = req.body;

    const addressArray = [];

    for (const key in addresses) {
      if (addresses.hasOwnProperty(key)) {
        addressArray.push(addresses[key]);
      }
    }

    const newManager = new Manager({
      fullName,
      email,
      phone,
      alternatePhone,
      company,
      notes,
      addresses: addressArray,
      createdBy: req.user._id
    });

    await newManager.save();
    res.redirect('/manager');
  } catch (err) {
    console.error("Add Manager Error:", err);
    res.status(500).send('Failed to add manager');
  }
};

// QUICK CREATE
exports.quickCreateFromContact = async (req, res) => {
  try {
    const { contactId } = req.body;
    if (!contactId) return res.status(400).send("contactId is required");

    const contact = await Contact.findById(contactId);
    if (!contact) return res.status(404).send("Contact not found");

    const already = await Manager.findOne({ contactId });
    if (already) return res.status(400).send("Already exists in Manager list");

    const addressObj = {
      address: contact.address || '',
      city: contact.city || '',
      state: contact.state || '',
      pincode: contact.pincode || ''
    };

    const newManager = new Manager({
      fullName: contact.fullName,
      email: contact.email || '',
      phone: contact.phone || '',
      alternatePhone: contact.alternatePhone || '',
      addresses: [addressObj],
      company: contact.company || '',
      notes: '',
      contactId: contact._id,
      createdBy: req.session?.user?._id || null
    });

    await newManager.save();
    res.redirect('/manager');
  } catch (err) {
    console.error("quickCreateFromContact:", err);
    res.status(500).send("Server Error while creating Manager");
  }
};

// GET ALL
exports.getAllManagers = async (req, res) => {
  try {
    const managers = await Manager.find().populate('contactId');
    res.render('manager/list', { managers, user: req.session.user });
  } catch (err) {
    console.error("getAllManagers:", err);
    res.status(500).send("Server Error loading managers");
  }
};

// EDIT PAGE
exports.getManagerEditPage = async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) return res.status(404).send("Manager not found");
    res.render('manager/edit', { manager, user: req.session.user });
  } catch (err) {
    console.error("getManagerEditPage:", err);
    res.status(500).send("Error loading edit page");
  }
};

// controllers/managerController.js
exports.updateManager = async (req, res) => {
  try {
    const { fullName, email, phone, alternatePhone, company, notes } = req.body;
    const rawAddresses = req.body.addresses;

    const addresses = [];

    if (rawAddresses && typeof rawAddresses === 'object') {
      for (let key in rawAddresses) {
        const addr = rawAddresses[key];

        const address = typeof addr.address === 'string' ? addr.address.trim() : '';
        const city = typeof addr.city === 'string' ? addr.city.trim() : '';
        const state = typeof addr.state === 'string' ? addr.state.trim() : '';
        const pincode = typeof addr.pincode === 'string' ? addr.pincode.trim() : '';

        if (address || city || state || pincode) {
          addresses.push({ address, city, state, pincode });
        }
      }
    }

    await Manager.findByIdAndUpdate(req.params.id, {
      fullName,
      email,
      phone,
      alternatePhone,
      company,
      notes,
      addresses
    });

    res.redirect('/manager');
  } catch (err) {
    console.error("updateManager error:", err);
    res.status(500).send("Server Error updating manager");
  }
};


// DELETE MANAGER
exports.deleteManager = async (req, res) => {
  try {
    await Manager.findByIdAndDelete(req.params.id);
    res.redirect('/manager');
  } catch (err) {
    console.error("Error deleting manager:", err);
    res.status(500).send("Error deleting manager");
  }
};