import React, { Component } from 'react';
import Util from '../../../Util';

import Comic from '../../UI/Comic/Comic';
import ComicList from '../../UI/ComicList/ComicList';
import ComicTitle from '../../UI/ComicTitle/ComicTitle';
import Button from '../../UI/Button/Button';

//this.props.comicId
export default class ComicPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			comic: null
		};

		this.setComic = this.setComic.bind(this);
	}
	componentDidMount() {
		this.fetchData();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.comicId !== prevProps.comicId;
	}
	componentDidUpdate(prevProps, prevState, isNewComicId) {
		if(isNewComicId) this.fetchData();
	}
	setComic(comic) {
		this.setState({
			comic: comic
		});
	}
	fetchData() {
		//TODO: try to get from top comics first?

		Util.api.post('/api/getComicById', {
			comicId: this.props.comicId
		})
		.then(result => {
			if(!result.error) {
				this.setState({
					comic: result
				});
			}
			this.setState({
				isLoading: false
			})
		})
	}
	render() {
		return <div className="page-comic">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h2>Comic #{this.props.comicId}</h2>
					</div>
				</div>
			</div>
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<div className="comic-highlight-inner">
						{this.state.isLoading
							? <div className="loader"></div>
							: !this.state.comic
								? <div>
									<p className="empty-text">The bad news is that the requested comic no longer exists. The good news is that you can start a new one right now!</p>
									<Button colour="pink" label="Play" to={Util.route.play()} />
								</div>
								: <Comic key={this.state.comic.comicId} comic={this.state.comic} />
						}
						</div>
					</div>
				</div>
			</div>
			<div className="panel-standard panel-template-feed">
				<div className="container">
					<div className="row">
						{!this.state.isLoading
							? <div className="template-feed">
								<ComicList
									title="Other comics using this template"
									emptyText={`No other comics have been made with this template.`}
									noMoreText={`Phew! That's all the comics that have been made using this template.`}
									fetchDelay={700} //Prevent fast nav spamming
									sortBy={Util.enum.ComicSortBy.Random}
									templateId={this.state.comic.templateId}
									ignoreComicIds={[this.props.comicId]}
								/>
							</div>
							: null
						}
					</div>
				</div>
			</div>
		</div>;
	}
}