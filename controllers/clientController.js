// controllers/clientController.js
const Client = require('../models/Client');
const Industry = require('../models/Industry');
const ClientSource = require('../models/ClientSource');
const fs = require('fs');
const path = require('path');

exports.index = async (req, res) => {
    try {
        const clients = await Client.find()
            .populate('industry')
            .populate('clientSource')
            .sort({ createdAt: -1 });

        res.render('clients/index', {
            title: 'Manage Clients',
            clients
        });
    } catch (err) {
        req.flash('error_msg', 'Error fetching clients');
        res.redirect('/');
    }
};

exports.create = async (req, res) => {
    try {
        const industries = await Industry.find({ status: 'active' });
        const clientSources = await ClientSource.find({ status: 'active' });

        res.render('clients/create', {
            title: 'Add New Client',
            industries,
            clientSources
        });
    } catch (err) {
        req.flash('error_msg', 'Error loading form');
        res.redirect('/clients');
    }
};

exports.store = async (req, res) => {
    try {
        const {
            clientName, fax, telegram, industry, about,
            contactNumber, website, server, clientSource,
            billingStreet, billingState, billingCountry,
            billingCity, billingCode, shippingStreet,
            shippingState, shippingCity, shippingCode
        } = req.body;

        const attachments = [];
        if (req.files) {
            req.files.forEach(file => {
                attachments.push({
                    filename: file.filename,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                });
            });
        }

        const newClient = new Client({
            clientName,
            fax,
            telegram,
            industry,
            about,
            contactNumber,
            website,
            server,
            clientSource,
            billingStreet,
            billingState,
            billingCountry,
            billingCity,
            billingCode,
            shippingStreet,
            shippingState,
            shippingCity,
            shippingCode,
            attachments
        });

        await newClient.save();
        req.flash('success_msg', 'Client created successfully');
        res.redirect('/clients');
    } catch (err) {
        if (err.name === 'ValidationError') {
            req.flash('error_msg', Object.values(err.errors).map(val => val.message));
        } else {
            req.flash('error_msg', 'Error creating client');
        }
        res.redirect('/clients/create');
    }
};

exports.view = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id)
            .populate('industry')
            .populate('clientSource');

        res.render('clients/view', {
            client,
            path: require('path')
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.edit = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        const industries = await Industry.find({ status: 'active' });
        const clientSources = await ClientSource.find({ status: 'active' });

        if (!client) {
            req.flash('error_msg', 'Client not found');
            return res.redirect('/clients');
        }

        res.render('clients/edit', {
            title: 'Edit Client',
            client,
            industries,
            clientSources
        });
    } catch (err) {
        req.flash('error_msg', 'Error loading edit form');
        res.redirect('/clients');
    }
};

exports.update = async (req, res) => {
    try {
        const {
            clientName, fax, telegram, industry, about,
            contactNumber, website, server, clientSource,
            billingStreet, billingState, billingCountry,
            billingCity, billingCode, shippingStreet,
            shippingState, shippingCity, shippingCode
        } = req.body;

        const client = await Client.findById(req.params.id);
        if (!client) {
            req.flash('error_msg', 'Client not found');
            return res.redirect('/clients');
        }

        // Handle new file uploads
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                client.attachments.push({
                    filename: file.filename,
                    originalname: file.originalname
                });
            });
        }

        // Update client fields
        client.clientName = clientName;
        client.fax = fax;
        client.telegram = telegram;
        client.industry = industry;
        client.about = about;
        client.contactNumber = contactNumber;
        client.website = website;
        client.server = server;
        client.clientSource = clientSource;
        client.billingStreet = billingStreet;
        client.billingState = billingState;
        client.billingCountry = billingCountry;
        client.billingCity = billingCity;
        client.billingCode = billingCode;
        client.shippingStreet = shippingStreet;
        client.shippingState = shippingState;
        client.shippingCity = shippingCity;
        client.shippingCode = shippingCode;

        await client.save();
        req.flash('success_msg', 'Client updated successfully');
        res.redirect(`/clients/${client._id}`);
    } catch (err) {
        if (err.name === 'ValidationError') {
            req.flash('error_msg', Object.values(err.errors).map(val => val.message));
        } else {
            req.flash('error_msg', 'Error updating client');
        }
        res.redirect(`/clients/${req.params.id}/edit`);
    }
};

exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const client = await Client.findById(id);
        
        if (!client) {
            req.flash('error_msg', 'Client not found');
            return res.redirect('/clients');
        }

        // Delete associated files
        if (client.attachments && client.attachments.length > 0) {
            client.attachments.forEach(attachment => {
                const filePath = path.join(__dirname, '../public/uploads', attachment.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }

        await Client.deleteOne({ _id: id });
        
        req.flash('success_msg', 'Client deleted successfully');
        res.redirect('/clients');
    } catch (err) {
        console.error('Delete error:', err);
        req.flash('error_msg', 'Error deleting client');
        res.redirect('/clients');
    }
};