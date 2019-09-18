import React, { Component } from 'react';
import Util from '../../../Util';

import Comic from '../../UI/Comic/Comic';
import Dropdown from '../../UI/Dropdown/Dropdown'
import Button from '../../UI/Button/Button';
import Checkbox from '../Checkbox/Checkbox';

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
		return this.props.gameId !== prevProps.gameId;
	}
	componentDidUpdate(prevProps, prevState, isNewGameId) {
		if(isNewGameId) this.resetFetch(this.props.fetchDelay);
	}
	resetFetch(fetchDelay) {
		clearTimeout(this.fetchTimeout);

		this.setState({
			createdAtBefore: new Date(),
			offset: 0,
			isNoMore: false,
			comics: []
		}, () => this.fetchData(fetchDelay));
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
	fetchData(fetchDelay) {
		this.setState({
			isLoading: true
		});
		
		this.fetchTimeout = setTimeout(() => {
			let isRandomSort = this.state.sortBy === Util.enum.ComicSortBy.Random;

			Util.api.post('/api/getComics', {
				//Optional
				gameId: this.props.gameId,
				authorUserId: this.props.authorUserId,

				createdAtBefore: this.state.createdAtBefore,
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
		}, fetchDelay || 0);
	}
	render() {
		return <div className="comic-list">
				{this.props.title ? <h3 className="comic-list-title">{this.props.title}</h3> : null}
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
					{this.props.authorUserId
						? null
						: <div className="flex-spacer"></div>
					}
					{this.props.authorUserId
						? null
						: <Checkbox 
							isSwitch={true}
							onChange={this.setIncludeAnonymous} 
							value={this.state.includeAnonymous}
							label="Anonymous authors"
						/>
					}
				</div>
			<div className="comic-list-inner">
				{this.state.comics.map(comic => {
					return <Comic key={comic.comicId} comic={comic} />
				})}
				{this.state.isLoading 
					? <div className={`loader ${Util.array.any(this.state.comics) ? 'masked' : ''}`}></div> 
					: <div>
						{this.state.isNoMore
							? <p className="empty-text">
								{Util.array.none(this.state.comics) 
									? (this.props.emptyText || 'No comics to display.')
									: (this.props.noMoreText || 'No more comics to display.')
								}
							</p>
							: null
						}
						<div className="button-container">
							<Button label="Back to top" onClick={() => Util.selector.getRootScrollElement().scrollTo(0, 0)} colour="black" />
							{this.state.isNoMore
								? null
								: <Button label="Load more" colour="pink" onClick={() => this.fetchData()} leftIcon={Util.icon.download} />
							}
						</div>
					</div>
				}
			</div>
		</div>;
	}
}