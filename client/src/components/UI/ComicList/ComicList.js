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
			
			sortBy: this.props.sortBy || Util.enum.ComicSortBy.TopRated,
			limit: 5,
			offset: 0,
			createdAtBefore: new Date(), //if people make comics as we view, we'll get lots of dupes!
			
			comics: [],
			isNoMore: false
		};

		this.fetchTimeout = null;

		this.fetchData = this.fetchData.bind(this);
	}
	componentDidMount() {
		this.fetchData();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.templateId !== prevProps.templateId;
	}
	componentDidUpdate(prevProps, prevState, isNewTemplateId) {
		if(isNewTemplateId) this.resetFetch(this.props.fetchDelay);
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
	fetchData(fetchDelay) {
		this.setState({
			isLoading: true
		});
		
		this.fetchTimeout = setTimeout(() => {
			let isRandomSort = this.state.sortBy === Util.enum.ComicSortBy.Random;
			let templateId = this.props.templateId;

			Util.api.post('/api/getComics', {
				//Optional
				templateId: templateId,
				authorUserId: this.props.authorUserId,

				createdAtBefore: this.state.createdAtBefore,
				sortBy: this.state.sortBy,
				limit: this.state.limit,
				offset: isRandomSort ? 0 : this.state.offset,
				idNotIn: isRandomSort
					? this.state.comics.map(comic => comic.comicId)
					: []
			})
			.then(result => {
				if(!result.error) {
					//There is a reasonable chance the selected template has changed since the request began
					//There will be another request lagging behind, so don't do anything and wait for that one
					if(templateId === this.props.templateId) {
						if(this.props.skipTopComic) {
							let topComic = Util.context.getTopComicByTemplateId(templateId);
							if(topComic) result = result.filter(comic => comic.comicId !== topComic.comicId);
						}
	
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
									: <Button label="Load more" colour="pink" onClick={() => this.fetchData()} leftIcon={Util.icon.download} />
								}
							</div>
						</div>
					}
				</div>
			</div>
		</div>;
	}
}