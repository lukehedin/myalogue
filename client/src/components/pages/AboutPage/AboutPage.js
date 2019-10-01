import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

export default class AboutPage extends Component {
	render() {
		return <div className="page-about">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">About</h1>
						<p className="center">Two important source of inspiration for <b>Speak<span className="pink">4</span>Yourself</b> are <a target="_blank" rel="noopener noreferrer" href="https://drawception.com/">Drawception</a> (a game of drawing and miscommunication) and <a target="_blank" rel="noopener noreferrer" href="http://www.qwantz.com/index.php">Dinosaur Comics</a> (a webcomic where every comic uses the same panels, but different dialogue).</p>
						<p className="center">If you have questions, suggestions or problems, please send an email to <a rel="noopener noreferrer" href="mailto:admin@s4ycomic.com">admin@s4ycomic.com</a>.</p>
						<p className="center">Created by <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/imdoodlir/">imdoodlir</a>.</p>
						<p className="center sm"><Link to={Util.route.termsOfService()}>Terms of Service</Link> | <Link to={Util.route.privacyPolicy()}>Privacy Policy</Link></p>
						<p className="center sm">SVG icons made by <a target="_blank" rel="noopener noreferrer" href="https://www.flaticon.com/authors/gregor-cresnar" title="Gregor Cresnar">Gregor Cresnar</a> and <a target="_blank" rel="noopener noreferrer" href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a target="_blank" rel="noopener noreferrer" href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></p>
					</div>
				</div>
			</div>
		</div>;
	}
}