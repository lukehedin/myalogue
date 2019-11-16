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
			
			includeAnonymous: Util.context.setting.getShowAnonymousComics(),
			sortBy: this.props.sortBy || Util.enums.ComicSortBy.TopAll,
			limit: 5,
			offset: 0,
			completedAtBefore: new Date(), //if people make comics as we view, we'll get lots of dupes!
			
			comics: [],
			isNoMore: false
		};

		this.fetchTimeout = null;

		this.setSortBy = this.setSortBy.bind(this);
		this.setIncludeAnonymous = this.setIncludeAnonymous.bind(this);
		this.fetchData = this.fetchData.bind(this);
	}
	componentDidMount() {
		this.fetchData();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.templateId !== prevProps.templateId || this.props.authorUserId !== prevProps.authorUserId;
	}
	componentDidUpdate(prevProps, prevState, isNewProps) {
		if(isNewProps) this.resetFetch(this.props.fetchDelay);
	}
	resetFetch(fetchDelay) {
		clearTimeout(this.fetchTimeout);

		this.setState({
			completedAtBefore: new Date(),
			offset: 0,
			isNoMore: false,
			comics: [] //Otherwise random will use these to filter out
		}, () => this.fetchData(fetchDelay));
	}
	setSortBy(sortBy) {
		this.setState({
			sortBy: sortBy
		}, this.resetFetch);
	}
	setIncludeAnonymous(includeAnonymous) {
		Util.context.setting.setShowAnonymousComics(includeAnonymous);
		this.setState({
			includeAnonymous: includeAnonymous
		}, this.resetFetch);
	}
	fetchData(fetchDelay) {
		this.setState({
			isLoading: true
		});
		
		this.fetchTimeout = setTimeout(() => {
			let isRandomSort = this.state.sortBy === Util.enums.ComicSortBy.Random;
			let templateId = this.props.templateId;

			Util.api.post('/api/getComics', {
				//Optional
				templateId: templateId,
				authorUserId: this.props.authorUserId,

				completedAtBefore: this.state.completedAtBefore,
				sortBy: this.state.sortBy,
				includeAnonymous: this.state.includeAnonymous,
				limit: this.state.limit,
				offset: isRandomSort ? 0 : this.state.offset,
				ignoreComicIds: [
					...(this.props.ignoreComicIds || []),
					...(isRandomSort
						? this.state.comics.map(comic => comic.comicId)
						: [])
					]
			})
			.then(result => {
				if(!result.error) {
					//There is a reasonable chance the selected template has changed since the request began
					//There will be another request lagging behind, so don't do anything and wait for that one
					if(templateId === this.props.templateId) {
						this.setState({
							comics: [...this.state.comics, ...result],
							isLoading: false,
							offset: this.state.offset + this.state.limit,
							isNoMore: result.length < this.state.limit
						});
					}
				}
			});
		}, fetchDelay || 0);
	}
	render() {
		return <div className="comic-list">
				{this.props.title 
					? <h3 className="comic-list-title">{this.props.title}</h3> 
					: null
				}
				<div className="comic-list-filters comic-width">
					<Dropdown 
						value={this.state.sortBy}
						onChange={value => this.setSortBy(value)}
						displayProp='label' 
						valueProp='type' 
						options={[{
								type: Util.enums.ComicSortBy.Hot,
								label: 'Hot'
							}, {
								type: Util.enums.ComicSortBy.Newest,
								label: 'Newest'
							}, {
								type: Util.enums.ComicSortBy.TopToday,
								label: 'Top (today)'
							}, {
								type: Util.enums.ComicSortBy.TopWeek,
								label: 'Top (week)'
							}, {
							// 	type: Util.enums.ComicSortBy.TopMonth,
							// 	label: 'Top (month)'
							// }, {
								type: Util.enums.ComicSortBy.TopAll,
								label: 'Top (all)'
							}, {
								type: Util.enums.ComicSortBy.Random,
								label: 'Random'
							}
						]} 
					/>
					{this.props.authorUserId
						? null
						: <Checkbox className="anonymous-switch" isSwitch={true} value={this.state.includeAnonymous} label="Show comics with anonymous authors" onChange={this.setIncludeAnonymous} />
					}
				</div>
			<div className="comic-list-inner">
				{this.state.comics.map(comic => {
					return <Comic key={comic.comicId} comic={comic} />
				})}
				<div className="comic-list-bottom">
					{this.state.isLoading 
						? <div className="loader"></div> 
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
							<div className="button-container justify-center">
								<Button label="Back to top" onClick={() => Util.selector.getRootScrollElement().scrollTo(0, 0)} colour="black" />
								{this.state.isNoMore
									? null
									: <Button label="Load more" colour="pink" onClick={() => this.fetchData()} />
								}
							</div>
						</div>
					}
				</div>
			</div>
		</div>;
	}
}