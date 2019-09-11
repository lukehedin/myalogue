import React, { Component } from 'react';
import Util from '../../../Util';

export default class Customers extends Component {
	constructor(props) {
		super(props);

		this.state = {
			customers: []
		};
	}
	componentDidMount() {
		Util.api.post('/api/customers', {
			a: 3,
			b: 1
		})
		.then(customers => this.setState({ customers }));
	}
	render() {
		return (
			<div>
				<h2>Customers</h2>
				<ul>
				{this.state.customers.map(customer => 
					<li key={customer.username}>{customer.username}</li>
				)}
				</ul>
			</div>
		);
	}
}