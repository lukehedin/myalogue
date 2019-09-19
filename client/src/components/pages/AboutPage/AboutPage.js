import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

export default class AboutPage extends Component {
	render() {
		return <div className="page-about">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>About</h2>
						<p>Speak 4 Yourself is a game that allows you to put your own words into a comic. Your words can match a character's expression, contradict it, or complicate it.</p>
						<p>Players can rate the comics that are submitted, with the top rated comics for each game securing a place in the <Link to={Util.route.hallOfFame()}>Hall of Fame</Link>.</p>
						<p>If you have questions, suggestions or problems with this service, you can send an email to <a rel="noopener noreferrer" href="mailto:s4ycomic@gmail.com">s4ycomic@gmail.com</a>.</p>
						<p>Created by <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/imdoodlir/">imdoodlir</a>.</p>
						<p className="sm"><Link to={Util.route.termsOfService()}>Terms of Service</Link> | <Link to={Util.route.privacyPolicy()}>Privacy Policy</Link></p>
						<p className="sm">SVG icons made by <a target="_blank" rel="noopener noreferrer" href="https://www.flaticon.com/authors/gregor-cresnar" title="Gregor Cresnar">Gregor Cresnar</a> from <a target="_blank" rel="noopener noreferrer" href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></p>
					</div>
				</div>
			</div>
		</div>;
	}
}