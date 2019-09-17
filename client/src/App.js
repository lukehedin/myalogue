import React, { Component } from 'react';
import { connect } from 'react-redux';
import { closeModal, closeAllModals } from './redux/actions';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import Util from './Util';
import Div100vh from 'react-div-100vh';

import loaderFace from './images/face_black.png';

import AppHeader from './components/UI/AppHeader/AppHeader';
import AppFooter from './components/UI/AppFooter/AppFooter';
import Modal from './components/UI/Modal/Modal';
import RegisterPage from './components/pages/RegisterPage/RegisterPage';
import LoginPage from './components/pages/LoginPage/LoginPage';
import TemplatePage from './components/pages/TemplatePage/TemplatePage';
import VerifyPage from './components/pages/VerifyPage/VerifyPage';
import HallOfFamePage from './components/pages/HallOfFamePage/HallOfFamePage';
import ProfilePage from './components/pages/ProfilePage/ProfilePage';
import AboutPage from './components/pages/AboutPage/AboutPage';

class App extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true
		};
	}
	componentWillUnmount() {
		this.unlisten();
	}
	componentDidMount() {
		this.unlisten = this.props.history.listen((location, action) => {
			this.props.closeAllModals();
		});

		Util.api.post('/api/authenticate')
			.then(result => {
				if(!result.error) Util.context.set(result);

				this.setState({
					isLoading: false
				});
			});
	}
	render() {
		let ifNotAuthenticated = (component) => {
			return !Util.context.isAuthenticated()
				? component
				: <Redirect to={Util.route.home()} /> 
		};

		let content = this.state.isLoading
			? <div className="loader image-loader">
				<img alt="" src={loaderFace} />
			</div>
			: <div className="app">
				<AppHeader />
				<Switch>
					<Route exact path="/" render={() => <Redirect to={Util.route.template(Util.context.getLatestTemplateId())} />} />
					<Route exact path="/template/:templateId" render={({ match }) => <TemplatePage templateId={match.params.templateId} />} />
					<Route exact path="/template/:templateId/comic/:comicId" render={({ match }) => <TemplatePage templateId={match.params.templateId} comicId={match.params.comicId} />} />

					{/* If not authenticated */}
					<Route exact path="/register" render={({ match }) => ifNotAuthenticated(<RegisterPage />)} />
					<Route exact path="/login" render={({ match }) => ifNotAuthenticated(<LoginPage />)} />
					
					{/* Can verify even if already authenticated with same/another account (odd scenario but plausible) */}
					<Route exact path="/verify/:token" render={({ match }) => <VerifyPage token={match.params.token} />} />

					<Route exact path="/hall-of-fame" render={({ match }) => <Redirect to={Util.route.hallOfFame(Util.context.getLatestTemplateId())} /> } />
					<Route exact path="/hall-of-fame/:templateId" render={({ match }) => <HallOfFamePage templateId={match.params.templateId} />}/>
					
					<Route exact path="/profile/:userId" render={({ match }) => <ProfilePage userId={match.params.userId} />} />
					
					<Route exact path="/about" render={({ match }) => <AboutPage />}/>
					
					<Route exactrender={({ match }) => <div>404</div>} />
				</Switch>
				<div className="flex-spacer"></div>
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

		return <Div100vh onScroll={Util.array.any(this.props.modals) ? Util.event.absorb : null} className="app-container">
			{content}
		</Div100vh>;
	}
}

const mapStateToProps = state => ({
	modals: state.modalReducer.modals
});

export default connect(mapStateToProps, { closeModal, closeAllModals })(withRouter(App));