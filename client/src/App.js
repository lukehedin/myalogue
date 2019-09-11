import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Util from './Util';

import Customers from './components/UI/Customers/Customers';
import AppHeader from './components/UI/AppHeader/AppHeader';
import AppFooter from './components/UI/AppFooter/AppFooter';

import RegisterPage from './components/pages/RegisterPage/RegisterPage';
import LoginPage from './components/pages/LoginPage/LoginPage';

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
				if(result.success) {
					Util.auth.setToken(result.token);
					Util.auth.setUserDetails(result.userId, result.username);
				}
				
				this.setState({
					isLoading: false
				});
			});
	}
	render() {
		if(this.state.isLoading) return <div className="loader"></div>;

		return <div className="app">
			<Router>
				<AppHeader />
				<Switch>
					<Route exact path="/" render={({ match }) => <Customers />} />
					<Route exact path="/register" render={({ match }) => <RegisterPage />} />
					<Route exact path="/login" render={({ match }) => <LoginPage />} />
					<Route path="/about" render={({ match }) => <div>about</div>}/>
					<Route path="/user/:user" render={({ match }) => <div>user {match.params.user}</div>} />
					<Route render={({ match }) => <div>404</div>} />
				</Switch>
				<AppFooter />
			</Router>
		</div>;
	}
}

export default App;