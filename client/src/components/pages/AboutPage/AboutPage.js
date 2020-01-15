import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';
import Button from '../../UI/Button/Button';

export default class AboutPage extends Component {
	render() {
		return <div className="page-about">
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<h1 className="page-title">About</h1>
						<p>Two important sources of inspiration for <b>Speak<span className="pink">4</span>Yourself</b> are <a target="_blank" rel="noopener noreferrer" href="https://drawception.com/">Drawception</a> (a game of drawing and miscommunication) and <a target="_blank" rel="noopener noreferrer" href="http://www.qwantz.com/index.php">Dinosaur Comics</a> (a webcomic where every comic uses the same panels but different dialogue).</p>
						<p>If you have questions, suggestions, issues or just feel like a chat:</p>
						<div className="button-container justify-start">
							<Button size="sm" leftIcon={Util.icon.discord} label="Discord" href="https://discord.gg/TcQPjvf" />
							<Button size="sm" leftIcon={Util.icon.twitter} label="Twitter" href="https://twitter.com/imdoodlir" />
							<Button size="sm" leftIcon={Util.icon.facebook} label="Facebook" href="https://www.facebook.com/114737053250842" />
						</div>
						<p>Created by <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/imdoodlir/">imdoodlir</a>.</p>
						<p className="sm"><Link to={Util.route.termsOfService()}>Terms of Service</Link> | <Link to={Util.route.privacyPolicy()}>Privacy Policy</Link></p>
						<p className="sm">SVG Icons made by <a target="_blank" rel="noopener noreferrer" href="https://www.flaticon.com/authors/pixel-perfect" title="Pixel perfect">Pixel perfect</a> and <a target="_blank" rel="noopener noreferrer" href="https://www.flaticon.com/authors/dave-gandy" title="Dave Gandy">Dave Gandy</a> from <a target="_blank" rel="noopener noreferrer" href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></p>
					</div>
				</div>
			</div>
		</div>;
	}
}