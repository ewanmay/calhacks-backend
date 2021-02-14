const sgMail = require('@sendgrid/mail')
const ical = require('ical-generator');

const ics = require('ics')
const fs = require("fs");
// const event =

class Email {

  key: string;

  constructor(key: string) {
    this.key = key;
    sgMail.setApiKey(key)
  }

  sendEmailTest() {
    const cal = this.createCalendarInvite()

    // const pathToAttachment = `./tmp/cal-invite.ics`;
    // const attachment = fs.readFileSync(pathToAttachment).toString("base64");
    const attachment = cal.toString()
    console.log('attachment', attachment)
    const msg = {
      to: 'antoineb374@gmail.com', // Change to your recipient
      from: 'antoine.bizon1@ucalgary.ca', // Change to your verified sender
      subject: 'Sending with SendGrid is Fun',
      text: 'and easy to do anywhere, even with Node.js',
      html: '<strong>and easy to do anywhere, even with Node.js</strong>',
      attachments: [
        {
          content: attachment,
          filename: "cal-invite.ics",
          type: "application/ics",
          disposition: "inline",
          content_id: "calendar"
        }
      ]
    }

    sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error)
      })
  }

  createCalendarInvite() {
    const cal = ical({ domain: "mytestwebsite.com", name: 'My test calendar event' });

    return cal.createEvent({
      start: new Date(2020, 2, 14, 4, 30),
      duration: { hours: 6, minutes: 30 },
      title: 'Game night!',
      description: 'Time to drop what you\'re doing',
      location: 'Folsom Field, University of Colorado (finish line)',
      url: 'http://www.bolderboulder.com/',
      geo: { lat: 40.0095, lon: 105.2669 },
      categories: ['10k races', 'Memorial Day Weekend', 'Boulder CO'],
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'Admin', email: 'antoine.bizon1@ucalgary.ca' },
      attendees: [
        { name: 'Adam Gibbons', email: 'antoineb374@gmail.com', rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
        // { name: 'Brittany Seaton', email: 'brittany@example2.org', dir: 'https://linkedin.com/in/brittanyseaton', role: 'OPT-PARTICIPANT' }
      ]
    })
  }
}

module.exports = Email