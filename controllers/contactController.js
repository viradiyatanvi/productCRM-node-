const Contact = require('../models/Contact');
const User = require('../models/User');
const Client=require('../models/Client');
const ClientSource = require('../models/ClientSource');

exports.listContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .populate("assignedTo")
      .populate({
        path: 'client',
        select: 'clientName'
      })
      .populate({
        path: 'clientSource',
        select: 'name'
      });
    
    res.render('contact/list', {
      contacts,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).render('error', {
      message: "Failed to load contacts",
      user: req.session.user
    });
  }
};

exports.getAddContactForm = async (req, res) => {
  try {
    const users = await User.find();
    const clients = await Client.find({ status: 'Active' }).sort({ clientName: 1 });
    const sources = await ClientSource.find({ status: 'active' }).sort({ name: 1 });
    
    res.render('contact/add', {
      users,
      clients,
      sources,
      error: null,
      user: req.session.user
    });
  } catch (err) {
    console.log("Error rendering add page", err);
    res.render('contact/add', {
      users: [],
      clients: [],
      sources: [],
      error: "Something went wrong",
      user: req.session.user
    });
  }
};

exports.postAddContact = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      client,
      phoneNumber,
      jobTitle,
      email,
      fax,
      clientSource,
      billingStreet,
      billingCity,
      billingState,
      billingCode,
      billingCountry,
      shippingSameAsBilling,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingCode,
      shippingCountry,
      assignedTo
    } = req.body;

    if (!firstName || !lastName || !phoneNumber || !email ||
      !billingStreet || !billingCity || !billingState || !billingCode || !billingCountry) {
      const users = await User.find();
      const clients = await Client.find({ status: 'Active' }).sort({ clientName: 1 });
      const sources = await ClientSource.find({ status: 'active' }).sort({ name: 1 });
      
      return res.render('contact/add', {
        users,
        clients,
        sources,
        error: "Required fields are missing",
        user: req.session.user
      });
    }

    const contactData = {
      firstName,
      lastName,
      client: client || null,
      phoneNumber,
      jobTitle,
      email,
      fax,
      clientSource: clientSource === 'Other' ? null : clientSource,
      billingStreet,
      billingCity,
      billingState,
      billingCode,
      billingCountry,
      shippingSameAsBilling: shippingSameAsBilling === 'on',
      assignedTo
    };

    if (!contactData.shippingSameAsBilling) {
      contactData.shippingStreet = shippingStreet;
      contactData.shippingCity = shippingCity;
      contactData.shippingState = shippingState;
      contactData.shippingCode = shippingCode;
      contactData.shippingCountry = shippingCountry;
    }

    await Contact.create(contactData);
    res.redirect('/contact');
  } catch (err) {
    console.error("Save Error:", err);
    const users = await User.find();
    const clients = await Client.find({ status: 'Active' }).sort({ clientName: 1 });
    const sources = await ClientSource.find({ status: 'active' }).sort({ name: 1 });
    
    res.render('contact/add', {
      users,
      clients,
      sources,
      error: "Something went wrong while saving",
      user: req.session.user
    });
  }
};

exports.postAddContact = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      client,
      phoneNumber,
      jobTitle,
      email,
      fax,
      source,
      ClientSource,
      billingStreet,
      billingCity,
      billingState,
      billingCode,
      billingCountry,
      shippingSameAsBilling,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingCode,
      shippingCountry,
      assignedTo
    } = req.body;

    if (!firstName || !lastName || !phoneNumber || !email ||
      !billingStreet || !billingCity || !billingState || !billingCode || !billingCountry) {
      const users = await User.find();
      return res.render('contact/add', {
        users,
        error: "Required fields are missing",
        user: req.session.user
      });
    }

    const contactData = {
      firstName,
      lastName,
      client: client || null,
      phoneNumber,
      jobTitle,
      email,
      fax,
      source,
      ClientSource,
      billingStreet,
      billingCity,
      billingState,
      billingCode,
      billingCountry,
      shippingSameAsBilling: shippingSameAsBilling === 'on',
      assignedTo
    };

    // Only add shipping details if not same as billing
    if (!contactData.shippingSameAsBilling) {
      contactData.shippingStreet = shippingStreet;
      contactData.shippingCity = shippingCity;
      contactData.shippingState = shippingState;
      contactData.shippingCode = shippingCode;
      contactData.shippingCountry = shippingCountry;
    }

    await Contact.create(contactData);
    res.redirect('/contact');
  } catch (err) {
    console.error("Save Error:", err);
    const users = await User.find();
    const clients = await Client.find({ status: 'Active' }).sort({ clientName: 1 });
    res.render('contact/add', {
      users,
      clients,
      error: "Something went wrong while saving",
      user: req.session.user
    });
  }
};