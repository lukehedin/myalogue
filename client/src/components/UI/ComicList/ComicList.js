import React, { Component } from 'react';
import Util from '../../../Util';

import Comic from '../../UI/Comic/Comic';
import Dropdown from '../../UI/Dropdown/Dropdown'
import Button from '../../UI/Button/Button';
import Checkbox from '../Checkbox/Checkbox';

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

		this.fetchTimeout = null;

		this.setIncludeAnonymous = this.setIncludeAnonymous.bind(this);
		this.fetchData = this.fetchData.bind(this);
	}
	componentDidMount() {
		this.fetchData();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.template.templateId !== prevProps.template.templateId;
	}
	componentDidUpdate(prevProps, prevState, isNewTemplateId) {
		if(isNewTemplateId) this.resetFetch();
	}
	resetFetch() {
		clearTimeout(this.fetchTimeout);

		this.setState({
			createdAtBefore: new Date(),
			offset: 0,
			isNoMore: false,
			comics: []
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
	fetchData() {
		this.setState({
			isLoading: true
		});
		
		this.fetchTimeout = setTimeout(() => {
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
						comics: [...this.state.comics, ...result],
						isLoading: false,
						offset: this.state.offset + this.state.limit,
						isNoMore: result.length < this.state.limit
					});
				}
			});
		}, this.props.fetchDelay || 0);
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
					<Checkbox 
						isSwitch={true}
						onChange={this.setIncludeAnonymous} 
						value={this.state.includeAnonymous}
						label="Show anonymous authors"
					/>
				</div>
			<div className="comic-list-inner">
				{this.state.comics.map(comic => {
					return <Comic key={comic.comicId} template={this.props.template} comic={comic} />
				})}
				{this.state.isLoading 
					? <div className={`loader ${Util.array.any(this.state.comics) ? 'masked' : ''}`}></div> 
					: this.state.isNoMore
						? <p className="empty-text">
							{Util.array.none(this.state.comics) 
								? `No comics have been made using this template. You could make the very first one!`
								: `Phew! That's all the comics that have been made with this template.`
							}
						</p>
						: <Button label="Load more" colour="pink" onClick={() => this.fetchData()} leftIcon={Util.icon.download} />
				}
				<Button label="Back to top" onClick={() => Util.selector.getRootScrollElement().scrollTo(0, 0)} colour="black" leftIcon={Util.icon.home} />
			</div>
		</div>;
	}
}