const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

mailer = {
	_send: (toEmail, subject, html) => {
		if(process.env.NODE_ENV !== 'production' && toEmail !== process.env.DEV_EMAIL) {
			//Do not send
			console.log(`This email would have sent in prod: ${toEmail}, ${subject}`);
			console.log(html);
		} else {
			sgMail.send({
				to: toEmail,
				from: 'noreply@myalogue.com',
				subject: subject,
				html: html
			});
		}
	},

	sendVerificationEmail: (toEmail, username, verificationToken) => {
		mailer._send(toEmail, 'Verify your email address', 
		`<p>Thanks for signing up.</p>
		<p><a href="">Click here to verify your email address</a>.</p>`
		);
	},

	sendForgotPasswordEmail: (toEmail, passwordResetToken) => {
		mailer._send(toEmail, 'Request to reset password',
			`<p>Someone requested a password reset for this email.</p>
			<p><a href="">Click here to reset your password</a>.</p>
			<p>If you did not make this request, you can ignore this email.</p>`)
	},

	sendForgotPasswordNoAccountEmail: (toEmail) => {
		mailer._send(toEmail, 'Request to reset password', 
		`<p>Someone requested a password reset for this email, but it doesn't have a registered account.</p>
		<p>If you made this request, please <a href="">register for an account</a> instead.</p>
		<p><p>If you did not make this request, you can ignore this email.</p>`);
	}
}

module.exports = mailer;