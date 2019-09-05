import React, { Component } from 'react';
import axios from 'axios';

class Customers extends Component {
  constructor() {
    super();
    this.state = {
      customers: []
    };
  }

  componentDidMount() {
	axios.post('/api/customers', {
		params: {
			a: 3,
			b: 1
		}
	})
	.then(response => {
		let customers = response.data;
		this.setState({customers}, () => console.log('Customers fetched...', customers))
	});
  }

  render() {
    return (
      <div>
        <h2>Customers</h2>
        <ul>
        {this.state.customers.map(customer => 
          <li key={customer.userId}>{customer.userName} {customer.email}</li>
        )}
        </ul>
      </div>
    );
  }
}

export default Customers;
