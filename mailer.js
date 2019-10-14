const https = require('https');
const settings = require('./settings');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(settings.SendgridApiKey);

const mailer = {
	_host: 's4ycomic.com',

	_send: (toEmail, subject, html) => {
		if(settings.IsDev && toEmail !== settings.DevEmail) {
			//Do not send
			console.log(`This email would have sent in prod: ${toEmail}, ${subject}`);
			console.log(html);
		} else {
			sgMail.send({
				to: toEmail,
				from: 'noreply@s4ycomic.com',
				subject: `${subject} - Speak4Yourself`,
				html: `<div style="max-width:500px; margin: 0 auto;">
					<div style="padding:8px; background-color:#ff1f67; color:#fff; text-align: center;">
						Speak4Yourself
					</div>
					<div style="padding: 8px; background-color: #efefef;">
						${html}
					</div>
					<div style="padding:8px; background-color:#ff1f67; color:#fff; text-align: center;">
						<a style="color: #fff;" href="http://${mailer.host}">${mailer._host}</a>
					</div>
				</div>`
			});

			console.log('Mail send success');
		}
	},

	isEmailAddressAcceptable: (email, callback) => {
		https.get(`https://open.kickbox.com/v1/disposable/${email}`, (response) => {
			let responseBody  = '';
			response.on('data', (chunk) => { responseBody += chunk; });
			response.on('end', () => {
				let responseJson = JSON.parse(responseBody);
				callback(responseJson && responseJson.hasOwnProperty('disposable') && !responseJson.disposable)
			});
		});
	},

	sendVerificationEmail: (toEmail, username, verificationToken) => {
		mailer._send(toEmail, 'Verify your email address', 
		`<h2>Hi ${username},</h2>
		<p><a href="http://${mailer._host}/verify/${verificationToken}">Click here to verify your email address</a>.</p>`
		);
	},

	sendForgotPasswordEmail: (toEmail, username, passwordResetToken) => {
		mailer._send(toEmail, 'Forgot password',
			`<h2>Hi ${username},</h2>
			<p>Someone requested a password reset for this email address.</p>
			<p><a href="http://${mailer._host}/set-password/${passwordResetToken}">Click here to reset your password</a>.</p>
			<p>If you did not make this request, you can simply ignore this email.</p>`)
	},

	// sendForgotPasswordNoAccountEmail: (toEmail) => {
	// 	mailer._send(toEmail, 'Forgot password', 
	// 	`<p>Someone requested a password reset for this email, but it doesn't have a registered account.</p>
	// 	<p>If you made this request, please <a href="">register for an account</a> instead.</p>
	// 	<p><p>If you did not make this request, you can ignore this email.</p>`);
	// }
}

module.exports = mailer;