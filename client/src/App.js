import React, { Component } from 'react';
import { connect } from 'react-redux';
import { closeModal, closeAllModals } from './redux/actions';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import { detect as detectBrowser } from 'detect-browser';
import Util from './Util';
import Div100vh from 'react-div-100vh';

import loaderFace from './images/face_black.png';

import AppHeader from './components/UI/AppHeader/AppHeader';
import AppFooter from './components/UI/AppFooter/AppFooter';
import Modal from './components/UI/Modal/Modal';

import HomePage from './components/pages/HomePage/HomePage';
import RegisterPage from './components/pages/RegisterPage/RegisterPage';
import LoginPage from './components/pages/LoginPage/LoginPage';
import VerifyPage from './components/pages/VerifyPage/VerifyPage';
import TopComicsPage from './components/pages/TopComicsPage/TopComicsPage';
import ProfilePage from './components/pages/ProfilePage/ProfilePage';
import AboutPage from './components/pages/AboutPage/AboutPage';
import HowToPlayPage from './components/pages/HowToPlayPage/HowToPlayPage';
import Error404Page from './components/pages/Error404Page/Error404Page';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage/ForgotPasswordPage';
import SetPasswordPage from './components/pages/SetPasswordPage/SetPasswordPage';
import TermsOfServicePage from './components/pages/TermsOfServicePage/TermsOfServicePage';
import PrivacyPolicyPage from './components/pages/PrivacyPolicyPage/PrivacyPolicyPage';
import TemplatePage from './components/pages/TemplatePage/TemplatePage';
import ComicPage from './components/pages/ComicPage/ComicPage';
import PlayPage from './components/pages/PlayPage/PlayPage';

class App extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			isUnderMaintenance: false
		};
	}
	componentWillUnmount() {
		this.unlisten();
	}
	componentDidMount() {
		Util.analytics.init();
		Util.event.window.init();
		
		this.unlisten = this.props.history.listen((location, action) => {
			this.props.closeAllModals();
			Util.analytics.page();
			Util.selector.getRootScrollElement().scrollTo(0, 0);
		});

		Util.api.post('/api/authenticate')
			.then(result => {
				//An error also triggers maintenance mode
				if(!result.error && !result.isUnderMaintenance) {
					Util.context.set(result);
					Util.analytics.page();
				} else {
					//A failed authenticate should clear context
					if(result.error) Util.context.clear(true);
					
					//If errored or isUnderMaintenance, show the maintenance screen
					this.setState({
						isUnderMaintenance: true
					});
				}

				this.setState({
					isLoading: false
				});
			});
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

		let getApp = () => {
			return <div className="app">
				<AppHeader />
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

						<Route exact path="/template" render={() => <TemplatePage /> } />
						<Route exact path="/template/:templateId" render={({ match }) => <TemplatePage templateId={match.params.templateId} />} />

						<Route exact path="/top-comics" render={() => <TopComicsPage /> } />
						
						<Route exact path="/profile" render={() => ifAuthenticated(<Redirect to={Util.route.profile(Util.context.getUserId())} />)} />
						<Route exact path="/profile/:userId" render={({ match }) => <ProfilePage userId={match.params.userId} />} />
						
						<Route exact path="/how-to-play" render={() => <HowToPlayPage />} />
						<Route exact path="/about" render={() => <AboutPage />}/>
						<Route exact path="/privacy-policy" render={() => <PrivacyPolicyPage />}/>
						<Route exact path="/terms-of-service" render={() => <TermsOfServicePage />}/>
						
						{/* No other route match, 404 */}
						<Route render={({ match }) => <Error404Page />} />
					</Switch>
				</div>
				<AppFooter />
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
				: detectBrowser().name === "ie"
					? getSorryPanel(`Sorry, your browser isn't supported.`, `Speak4Yourself can't run on this browser. Please switch to a different browser if possible.`)
					: getApp();

		return <Div100vh className={`app-container ${Util.array.any(this.props.modals) ? 'no-scroll' : ''}`}>
			{content}
		</Div100vh>;
	}
}

const mapStateToProps = state => ({
	modals: state.modalReducer.modals
});

export default connect(mapStateToProps, { closeModal, closeAllModals })(withRouter(App));