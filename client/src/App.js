import React, { Component } from 'react';
import { connect } from 'react-redux';
import { closeModal, closeAllModals } from './redux/actions';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import Div100vh from 'react-div-100vh';
import moment from 'moment';
import Util from './Util';

import loaderFace from './images/face_black.png';

import AppHeader from './components/UI/AppHeader/AppHeader';
import AppFooter from './components/UI/AppFooter/AppFooter';
import Modal from './components/UI/Modal/Modal';

import HomePage from './components/pages/HomePage/HomePage';
import RegisterPage from './components/pages/RegisterPage/RegisterPage';
import LoginPage from './components/pages/LoginPage/LoginPage';
import VerifyPage from './components/pages/VerifyPage/VerifyPage';
import LeaderboardsPage from './components/pages/LeaderboardsPage/LeaderboardsPage';
import ProfilePage from './components/pages/ProfilePage/ProfilePage';
import AboutPage from './components/pages/AboutPage/AboutPage';
import HowToPlayPage from './components/pages/HowToPlayPage/HowToPlayPage';
import Error404Page from './components/pages/Error404Page/Error404Page';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage/ForgotPasswordPage';
import SetPasswordPage from './components/pages/SetPasswordPage/SetPasswordPage';
import TermsOfServicePage from './components/pages/TermsOfServicePage/TermsOfServicePage';
import PrivacyPolicyPage from './components/pages/PrivacyPolicyPage/PrivacyPolicyPage';
import TemplatePage from './components/pages/TemplatePage/TemplatePage';
import TemplatesPage from './components/pages/TemplatesPage/TemplatesPage';
import ComicPage from './components/pages/ComicPage/ComicPage';
import PlayPage from './components/pages/PlayPage/PlayPage';
import SettingsPage from './components/pages/SettingsPage/SettingsPage';
import GroupPage from './components/pages/GroupPage/GroupPage';
import GroupsPage from './components/pages/GroupsPage/GroupsPage';
import GroupEditorPage from './components/pages/GroupEditorPage/GroupEditorPage';
import AchievementsPage from './components/pages/AchievementsPage/AchievementsPage';

class App extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			isUnderMaintenance: false,

			lastPingAt: null
		};

		this.pingInterval = null;

		this.authenticate = this.authenticate.bind(this);
		this.ping = this.ping.bind(this);
	}
	componentWillUnmount() {
		window.removeEventListener('focus', () => this.ping());
		clearInterval(this.pingInterval);

		this.unlisten();
	}
	componentDidMount() {
		this.unlisten = this.props.history.listen((location, action) => {
			this.props.closeAllModals();
			Util.analytics.page();
			Util.selector.getRootScrollElement().scrollTo(0, 0);
		});

		this.authenticate();
		
		if(Util.isDev) document.title = 'DEV - ' + document.title;
	}
	authenticate() {
		Util.api.post('/api/authenticate')
			.then(result => {
				//An error also triggers maintenance mode
				if(!result.error && !result.isUnderMaintenance) {
					Util.context.set(result);
				} else {
					//A failed authenticate should clear context
					if(result.error) Util.context.clear(true);
					
					//If errored or isUnderMaintenance, show the maintenance screen
					this.setState({
						isUnderMaintenance: true
					});
				}

				this.ping(true);
				window.addEventListener('focus', () => this.ping());
				this.pingInterval = setInterval(() => this.ping(), 15000);

				Util.analytics.init();
				Util.analytics.page();

				this.setState({
					isLoading: false
				});
			})
			.catch(err => {
				console.log(err);
				//If a 500 error, try again in a few secs
				setTimeout(this.authenticate, Util.isDev ? 200 : 5000);
			});
	}
	ping(ignoreConditions = false) {
		//If the document has focus and it has been more than a minute since last ping, do one now
		if(ignoreConditions || (document.hasFocus() && this.state.lastPingAt < moment().subtract(1, 'minute').toDate())) {
			this.setState({
				lastPingAt: new Date()
			});
	
			Util.api.post('/api/ping', {
				existingTemplateIds: Util.context.getTemplates().map(template => template.templateId),

			})
			.then(result => {
				if(!result.error) {
					Util.context.set({
						groupUsers: result.groupUsers, //Always update
						templates: [...Util.context.getTemplates(), ...result.newTemplates]
					});
				}
			});
		}
	}
	render() {
		let ifAuthenticated = (component) => {
			return Util.context.isAuthenticated()
				? component
				: <Redirect to={Util.route.register()} />;
		};

		let ifNotAuthenticated = (component) => {
			return !Util.context.isAuthenticated()
				? component
				: <Redirect to={Util.route.home()} />;
		};

		let getSorryPanel = (title, subtitle) => {
			return <div className="sorry-panel">
				<img alt="" src={loaderFace} />
				<h1 className="page-title">{title}</h1>
				<p className="page-subtitle">{subtitle}</p>
			</div>;
		};

		let newsMessage = null;
		//  <p className="sm">Join the S4Y Discord! <a target="_blank" rel="noopener noreferrer" href="https://discord.gg/TcQPjvf">https://discord.gg/TcQPjvf</a></p>

		let getApp = () => {
			return <div className="app">
				<AppHeader />
				{newsMessage
					? <div className="news-message">
						<div className="container">
							<div className="row">
								{newsMessage}
							</div>
						</div>
					</div>
					: null
				}
				<div className="app-inner">
					<Switch>
						{/* If NOT authenticated */}
						<Route exact path="/register" render={() => ifNotAuthenticated(<RegisterPage />)} />
						<Route exact path="/login" render={() => ifNotAuthenticated(<LoginPage />)} />
						<Route exact path="/forgot-password" render={() => ifNotAuthenticated(<ForgotPasswordPage /> )} />
						
						{/* Verification and password resets can happen even if logged in (odd scenario but plausible) */}
						<Route exact path="/verify/:token" render={({ match }) => <VerifyPage token={match.params.token} />} />
						<Route exact path="/set-password/:token" render={({ match }) => <SetPasswordPage token={match.params.token} />} />

						<Route exact path="/" render={() => <HomePage />} />
						
						<Route exact path="/play" render={() => <PlayPage />} />
						<Route exact path="/play/:templateId" render={({ match }) => <PlayPage templateId={match.params.templateId} />} />

						<Route exact path="/comic/:comicId" render={({ match }) => <ComicPage comicId={match.params.comicId} />} />
						<Route exact path="/comic/:comicId/comic/:comicId" render={({ match }) => <ComicPage comicId={match.params.comicId} />} />

						<Route exact path="/templates" render={() => <TemplatesPage />} />
						<Route exact path="/template" render={() => <TemplatePage />} />
						<Route exact path="/template/:templateId" render={({ match }) => <TemplatePage templateId={match.params.templateId} />} />

						<Route exact path="/leaderboards" render={() => <LeaderboardsPage />} />

						<Route exact path="/achievements" render={() => <AchievementsPage />} />

						<Route exact path="/group/:groupId" render={({ match }) => <GroupPage groupId={match.params.groupId} />} />
						<Route exact path="/groups" render={() => <GroupsPage />} />
						<Route exact path="/group-editor" render={() => <GroupEditorPage />} />
						<Route exact path="/group-editor/:groupId" render={({ match }) => <GroupEditorPage groupId={match.params.groupId} />} />

						<Route exact path="/profile" render={() => ifAuthenticated(<Redirect to={Util.route.profile(Util.context.getUsername())} />)} />
						<Route exact path="/profile/:userIdOrUserName" render={({ match }) => <ProfilePage userIdOrUserName={match.params.userIdOrUserName} />} />

						<Route exact path="/settings" render={() => ifAuthenticated(<SettingsPage />)} />

						<Route exact path="/how-to-play" render={() => <HowToPlayPage />} />
						<Route exact path="/about" render={() => <AboutPage />}/>
						<Route exact path="/privacy-policy" render={() => <PrivacyPolicyPage />}/>
						<Route exact path="/terms-of-service" render={() => <TermsOfServicePage />}/>
						
						{/* Legacy redirects */}
						<Route exact path="/top-comics" render={() => <Redirect to={Util.route.leaderboards()} />} />

						{/* No other route match, 404 */}
						<Route render={({ match }) => <Error404Page />} />
					</Switch>
					<AppFooter />
				</div>
				{Util.array.any(this.props.modals)
					? <div className="modal-overlay" onMouseDown={(e) => {
						e.stopPropagation();
						if(e.target.classList.contains('modal-overlay')) this.props.closeModal(null);
					}}>
						{this.props.modals.map(modal => <Modal key={modal.modalId} modal={modal} />)}
					</div>
					: null
				}
			</div>;
		}
	
		let content = this.state.isLoading
			? <div className="loader image-loader"><img alt="" src={loaderFace} /></div>
			: this.state.isUnderMaintenance
				? getSorryPanel(`Sorry, we are experiencing some technical difficulties.`, `Speak4Yourself is currently undergoing maintenance, but should be back online momentarily.`) 
				: Util.context.isBrowserSupported()
					? getApp()
					: getSorryPanel(`Sorry, your browser isn't supported.`, `Speak4Yourself can't run on this browser. Please switch to a different browser if possible.`);

		return <Div100vh className={`app-container ${Util.array.any(this.props.modals) ? `no-scroll ${Util.context.isTouchDevice() ? '' : 'scrollbar-margin'}` : ''}`}>
			{content}
		</Div100vh>;
	}
}

const mapStateToProps = state => ({
	modals: state.modalReducer.modals
});

export default connect(mapStateToProps, { closeModal, closeAllModals })(withRouter(App));