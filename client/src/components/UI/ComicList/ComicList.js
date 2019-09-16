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
			
			includeAnonymous: true,
			sortBy: this.props.sortBy || Util.enum.ComicSortBy.TopRated,
			limit: 5,
			offset: 0,
			createdAtBefore: new Date(), //if people make comics as we view, we'll get lots of dupes!
			
			comics: [],
			isNoMore: false
		};

		this.setIncludeAnonymous = this.setIncludeAnonymous.bind(this);
		this.fetchData = this.fetchData.bind(this);
	}
	componentDidMount() {
		this.fetchData();
	}
	fetchData(isReset = false) {
		this.setState({
			isLoading: true
		});

		let isRandomSort = this.state.sortBy === Util.enum.ComicSortBy.Random;

		Util.api.post('/api/getComics', {
			createdAtBefore: this.state.createdAtBefore,
			templateId: this.props.template.templateId,
			sortBy: this.state.sortBy,
			limit: this.state.limit,
			includeAnonymous: this.state.includeAnonymous,
			offset: isRandomSort ? 0 : this.state.offset,
			idNotIn: isRandomSort
				? this.state.comics.map(comic => comic.comicId)
				: []
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					comics: isReset ? result : [...this.state.comics, ...result],
					isLoading: false,
					offset: this.state.offset + this.state.limit,
					isNoMore: result.length < this.state.limit
				});
			}
		});
	}
	resetFetch() {
		this.setState({
			createdAtBefore: new Date(),
			offset: 0,
			isNoMore: false
		}, () => this.fetchData(true));
	}
	setSortBy(sortBy) {
		this.setState({
			comics: [], //Otherwise random will use these to filter out
			sortBy: sortBy
		}, this.resetFetch);
	}
	setIncludeAnonymous(includeAnonymous) {
		this.setState({
			includeAnonymous: includeAnonymous
		}, this.resetFetch);
	}
	render() {
		return <div className="comic-list">
				<div className="filters">
					<Dropdown 
						value={this.state.sortBy}
						onChange={value => this.setSortBy(value)}
						displayProp='label' 
						valueProp='type' 
						options={[
							{
								type: Util.enum.ComicSortBy.TopRated,
								label: 'Top Rated'
							}, {
								type: Util.enum.ComicSortBy.Newest,
								label: 'Newest'
							}, {
								type: Util.enum.ComicSortBy.Random,
								label: 'Random'
							}
						]} 
					/>
					<div className="flex-spacer"></div>
					<Button
						size="sm" 
						label={`Anonymous authors ${this.state.includeAnonymous ? 'ON' : 'OFF'}`} 
						leftIcon={Util.icon.avatar} 
						isHollow={!this.state.includeAnonymous} 
						onClick={() => this.setIncludeAnonymous(!this.state.includeAnonymous)}
					/>
				</div>
			<div className="comic-list-inner">
				{this.state.comics.map(comic => {
					return <Comic key={comic.comicId} template={this.props.template} comic={comic} />
				})}
				{this.state.isLoading 
					? <div className="loader masked"></div> 
					: this.state.isNoMore
						? <div>
							{Util.array.none(this.state.comics) 
								? <p className="empty-text">No comics have been made using this template. You could make the first one! Think of the possibilities!</p> 
								: <p className="empty-text">Phew! That's all the comics that have been made with this template.</p>
							}
						</div>
						: <Button label="Load more comics" colour="pink" onClick={() => this.fetchData()} />
				}
			</div>
		</div>;
	}
}