/* jshint camelcase:false */

var fs = require('fs');
var hostname = require('os').hostname();
var mailer = require('nodemailer');

var NODE_ENV = process.env.NODE_ENV;

function FailMailer(options) {
    options = options || {};
    this.to = typeof options.to === 'string' ? options.to : null;
    this.from = options.from;
    this.logger = options.logger || null;

    if (!this.to && options.localSettingsFilePath) {
        try {
            var uberFacts = JSON.parse(
                fs.readFileSync(options.localSettingsFilePath));
            this.addRecipient(uberFacts.uber_owner);
        } catch (e) { }
    }

    this.transport = options.transport || mailer.createTransport("SMTP", {
        host: options.host,
        port: options.port,
        secureConnection: Boolean(options.ssl),
        auth: {
            user: options.sgusername,
            pass: options.sgpassword
        }
    });

}

FailMailer.prototype.addRecipient = function addRecipient(emailAddress) {
    this.to = this.to ? this.to + ", " + emailAddress : emailAddress;
};

FailMailer.prototype.send = function send(options, callback) {
    if (NODE_ENV !== 'production') {
        if (typeof callback === 'function') {
            callback();
        }
        return;
    }

    var subject = options.subject;
    var body = options.body;
    var to = options.to;
    var cc = options.cc;

    if (to === undefined) {
        to = this.to;
    }

    var logger = this.logger;

    if (hostname) {
        subject = '[' + hostname + ']' + subject;
    }

    if (!to) {
        if (logger) {
            logger.error("Failmailer.send() was called, but there" +
                " is no 'uber_owner' in /etc/facts.d/uber.json",
                { subject: subject, body: body });
        }
    } else {
        var mailOptions = {
            to: to,
            cc: cc,
            from: this.from,
            subject: subject,
            body: body
        };

        this.transport.sendMail(mailOptions, callback || function (err) {
            if (err && logger) logger.error("Failed to send failmail: " + err);
        });
    }
};

module.exports = FailMailer;
