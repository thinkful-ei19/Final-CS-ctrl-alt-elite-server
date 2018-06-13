'use strict';
require('dotenv').config();
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Appointment = require('../models/appointment');
const nodemailer = require('nodemailer');
const moment = require('moment');

//Create a new appointment.
router.post('/appointments/:id', (req, res, next) => {
  const { id } = req.params;

  const { time, client, notes } = req.body;

  const newApt = { time, client, notes };

  console.log(newApt);

  User.findById(id)
    .populate('appointments')
    .populate('clients')
    .then((result) => {
      let newUserInfo = result;
      Appointment.create(newApt)
        .then((result) => {
          newUserInfo.appointments.push(result.id);            
          User.findByIdAndUpdate(id, newUserInfo)
            .populate('appointments')
            .populate('clients')
            .then((result) => {
              let updatedResult = result;
              updatedResult.appointments = newUserInfo.appointments;
              res.json(updatedResult);
            })
            .catch(err => next(err));
        })
        .catch((err) => next(err));
    })
    .catch((err) => next(err));

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
      
  const appointmentTime = moment(newApt.time).format('MMMM Do YYYY, h:mm:ss a');

  let mailOptions = {
    from: 'CTRL ALT ELITE <ctrl.alt.elite.acjj@gmail.com>',
    to: `${newApt.client.email}`,  
    subject: `Your ${appointmentTime} Appointment with CTRL ALT ELITE`,
    html: `<p>Hi ${newApt.client.name}, <br/> Your appointment has been scheduled
        with CTRL ALT ELITE at ${newApt.time}. <br/>Thank you for scheduling with us.</p>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent', info.messageId);
  });
});


router.delete('/appointments/:id', (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.body;

  let deletedApt;
  let updateUser;


  User.findById(userId)
    .then((result) => {
      console.log('!!!!', result);
      let appointments = [];
      updateUser = result;
      updateUser.appointments.forEach((aptId) => {
        if (String(aptId) !== id) {
          appointments.push(aptId);
        }                
      });
      updateUser.appointments = appointments;
      return updateUser;
    })
    .then((result) => {
      User.findByIdAndUpdate(userId, updateUser);
      return;
    })
    .catch(err => next(err));
  Appointment.findById(id)
    .then((result) => {
      deletedApt = result;
      // console.log(deletedApt);
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });
    
      const appointmentTime = moment(deletedApt.time).format('MMMM Do YYYY, h:mm:ss a');
    
      let mailOptions = {
        from: 'CTRL ALT ELITE <ctrl.alt.elite.acjj@gmail.com>',
        to: `${deletedApt.client.email}`,  
        subject: `CANCELLATION: Your ${appointmentTime} Appointment with CTRL ALT ELITE`,
        html: `<p>Hello ${deletedApt.client.name}, <br/> Your appointment has successfully been cancelled. 
            <br/>Have a great day.</p>`
      };
    
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log('Message sent', info.messageId);
      });
    })
    .then(() => {
      Appointment.findByIdAndRemove(id)
        .then((result) => {
          res.status(204).end();
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch(err => next(err));
  

  
});

module.exports = router;