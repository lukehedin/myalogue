import React, { Component } from 'react';
import { connect } from 'react-redux';
import { closeModal, closeAllModals } from './redux/actions';
import { Route, Switch, withRouter } from 'react-router-dom';
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

class App extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true
		};
	}
	componentWillMount() {
		this.unlisten = this.props.history.listen((location, action) => {
			this.props.closeAllModals();
		});
	}
	componentWillUnmount() {
		this.unlisten();
	}
	componentDidMount() {
		Util.api.post('/api/authenticate')
			.then(result => {
				if(!result.error) Util.auth.set(result);

				this.setState({
					isLoading: false
				});
			});
	}
	render() {
		let content = this.state.isLoading
			? <div className="loader image-loader">
				<img src={loaderFace} />
			</div>
			: <div className="app">
				<AppHeader />
				<Switch>
					<Route exact path="/" render={({ match }) => <TemplatePage />} />
					<Route exact path="/template/:templateId" render={({ match }) => <TemplatePage templateId={match.params.templateId} />} />
					<Route exact path="/template/:templateId/comic/:comicId" render={({ match }) => <TemplatePage templateId={match.params.templateId} comicId={match.params.comicId} />} />
					<Route exact path="/register" render={({ match }) => <RegisterPage />} />
					<Route exact path="/login" render={({ match }) => <LoginPage />} />
					<Route path="/about" render={({ match }) => <div>about</div>}/>
					<Route path="/user/:user" render={({ match }) => <div>user {match.params.user}</div>} />
					<Route path="/verify/:token" render={({ match }) => <VerifyPage token={match.params.token} />} />
					<Route render={({ match }) => <div>404</div>} />
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

		return <Div100vh className={`app-container ${Util.array.any(this.props.modals) ? 'modal-open' : ''}`}>
			{content}
		</Div100vh>;
	}
}

const mapStateToProps = state => ({
	modals: state.modalReducer.modals
});

export default connect(mapStateToProps, { closeModal, closeAllModals })(withRouter(App));