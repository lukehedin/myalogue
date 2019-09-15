import React, { Component } from 'react';
import { connect } from 'react-redux';
import { closeModal } from './redux/actions';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Util from './Util';
import Div100vh from 'react-div-100vh';

import loaderImage from './images/loader.png';

import Customers from './components/UI/Customers/Customers';
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
				<img src={loaderImage} />
			</div>
			: <Router>
				<AppHeader />
				<Switch>
					<Route exact path="/" render={({ match }) => <TemplatePage />} />
					<Route exact path="/template/:ordinal" render={({ match }) => <TemplatePage ordinal={match.params.ordinal} />} />
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
					? <div className="modal-overlay" onClick={(e) => {
						e.stopPropagation();
						if(e.target.classList.contains('modal-overlay')) this.props.closeModal(null);
					}}>
						{this.props.modals.map(modal => <Modal key={modal.modalId} modal={modal} />)}
					</div>
					: null
				}
			</Router>;

		return <Div100vh className="app">
			{content}
		</Div100vh>;
	}
}

const mapStateToProps = state => ({
	modals: state.modalReducer.modals
});

export default connect(mapStateToProps, { closeModal })(App);