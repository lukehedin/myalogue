import React, { Component } from 'react';
import Util from '../../../Util';

import ComicList from '../../UI/ComicList/ComicList';

export default class HallOfFamePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isSubmitted: false
		};
	}
	render() {
		return <div className="page-hall-of-fame">
			<div className="container">
				<div className="row">
					<h2>Hall of Fame</h2>
					<div className="hall-of-fame">
						{this.state.isLoading 
							? <div className="loader"></div>
							: this.state.comics.map(comic => {
								return <Comic key={comic.comicId} template={this.props.template} comic={comic} />
							})
						}
					</div>
				</div>
			</div>
		</div>;
	}
}