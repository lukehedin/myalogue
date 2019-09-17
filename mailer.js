const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

mailer = {
	_host: 's4ycomic.com',

	_send: (toEmail, subject, html) => {
		if(process.env.NODE_ENV !== 'production' && toEmail !== process.env.DEV_EMAIL) {
			//Do not send
			console.log(`This email would have sent in prod: ${toEmail}, ${subject}`);
			console.log(html);
		} else {
			sgMail.send({
				to: toEmail,
				from: 'noreply@myalogue.com',
				subject: `${subject} - Speak 4 Yourself`,
				html: `<div>
					${html}
				</div>
				<div style="background-color:#ff1f67;color:#fff;">
					${mailer._host}
				</div>`
			});
		}
	},

	sendVerificationEmail: (toEmail, username, verificationToken) => {
		mailer._send(toEmail, 'Verify your email address', 
		`<h2>Hi ${username},</h2>
		<p>thanks for signing up to Speak 4 Yourself.</p>
		<p><a href="${mailer._host}/verify/${verificationToken}">Click here to verify your email address</a>.</p>`
		);
	},

	sendForgotPasswordEmail: (toEmail, passwordResetToken) => {
		mailer._send(toEmail, 'Request to reset password',
			`<h2>Hi ${username},</h2>
			<p>Someone requested a password reset for this email.</p>
			<p><a href="${mailer._host}/reset-password/${passwordResetToken}">Click here to reset your password</a>.</p>
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