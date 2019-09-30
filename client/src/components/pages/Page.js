import React, { Component } from 'react';

export default class Page extends Component {
	render() {
		return <div className={`page-${this.props.pageClass || 'default'} ${this.props.className || ''}`}>
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						{this.props.title ? <h1 className="page-title">{this.props.title}</h1> : null}
						{this.props.subtitle ? <p className="page-subtitle center">{this.props.subtitle}</p> : null}
					</div>
				</div>
			</div>
			{this.props.children}
		</div>
	}
}