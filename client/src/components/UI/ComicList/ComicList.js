import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import Comic from '../../UI/Comic/Comic';
import Dropdown from '../../UI/Dropdown/Dropdown'
import Button from '../../UI/Button/Button';

//this.props.template
export default class ComicList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			
			includeAnonymous: false,
			comics: [],
			orderBy: 1,
			limit: 3,
			skip: 0
		};

		this.setIncludeAnonymous = this.setIncludeAnonymous.bind(this);
	}
	componentDidMount() {
		this.setState({
			isLoading: true
		});

		Util.api.post('/api/getComics', {
			templateId: this.props.template.templateId,
			limit: this.state.limit,
			skip: this.state.skip
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					comics: result,
					isLoading: false
				});
			}
		});
	}
	setIncludeAnonymous(includeAnonymous) {
		this.setState({
			includeAnonymous: includeAnonymous
		});
	}
	render() {
		return <div className="comic-list">
			<div className="container">
				<div className="row">
					<div className="filters">
						<Dropdown displayProp='label' valueProp='type' options={[
							{
								type: 1,
								label: 'Top Rated'
							}, {
								type: 2,
								label: 'Newest'
							}, {
								type: 3,
								label: 'Random'
							}
						]} />
						<div className="flex-spacer"></div>
						<Button size="sm" label={`Include anonymous (${this.state.includeAnonymous ? 'ON' : 'OFF'})`} icon={Util.icon.avatar} isHollow={!this.state.includeAnonymous} onClick={() => this.setIncludeAnonymous(!this.state.includeAnonymous)} />
					</div>
				</div>
				<div className="comic-list-inner">
					{this.state.comics.map(comic => {
						return <Comic key={comic.comicId} template={this.props.template} comic={comic} />
					})}
					{!this.state.isLoading && Util.array.none(this.state.comics) ? <p>No comics using this template have been made yet!</p> : null}
					{this.state.isLoading ? <div className="loader"></div> : null}
				</div>
			</div>
		</div>;
	}
}