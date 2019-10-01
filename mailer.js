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
						<a style="color: #fff;" href="https://${mailer.host}">${mailer._host}</a>
					</div>
				</div>`
			});

			console.log('Mail send success');
		}
	},

	sendVerificationEmail: (toEmail, username, verificationToken) => {
		mailer._send(toEmail, 'Verify your email address', 
		`<h2>Hi ${username},</h2>
		<p><a href="https://${mailer._host}/verify/${verificationToken}">Click here to verify your email address</a>.</p>`
		);
	},

	sendForgotPasswordEmail: (toEmail, username, passwordResetToken) => {
		mailer._send(toEmail, 'Forgot password',
			`<h2>Hi ${username},</h2>
			<p>Someone requested a password reset for this email address.</p>
			<p><a href="https://${mailer._host}/set-password/${passwordResetToken}">Click here to reset your password</a>.</p>
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