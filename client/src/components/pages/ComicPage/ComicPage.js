import React, { Component } from 'react';
import Util from '../../../Util';
import moment from 'moment';

import Comic from '../../UI/Comic/Comic';
import ComicList from '../../UI/ComicList/ComicList';
import Button from '../../UI/Button/Button';
import ComicPanelAuthorList from '../../UI/ComicPanelAuthorList/ComicPanelAuthorList';

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
						<h1 className="page-title">Comic #{this.props.comicId}</h1>
						{this.state.comic
							? <p className="page-subtitle">Completed {moment(this.state.comic.completedAt).fromNow()}</p>
							: null
						}
						{this.state.comic
							? <p className="page-subtitle">Panels by <ComicPanelAuthorList comic={this.state.comic} /></p>
							: null
						}
						<div className="comic-featured">
							{this.state.isLoading
								? <div className="loader"></div>
								: !this.state.comic
									? <p className="empty-text">The bad news is that the requested comic no longer exists. The good news is that you can start a new one right now!</p>
									: <Comic key={this.state.comic.comicId} comic={this.state.comic} />
							}
						</div>
					</div>
				</div>
			</div>
			{this.state.isLoading
				? null
				: <div className="panel-inset">
					<div className="container">
						<div className="row">
							<div className="play-message">
							<p className="center">Did you like this comic, or could you do better?</p>
							<div className="button-container justify-center">
								<Button size="lg" colour="pink" label="Play" to={Util.route.play()} />
							</div>
						</div>
						</div>
					</div>
				</div>
			}
			<div className="panel-standard panel-template-feed">
				<div className="container">
					<div className="row">
						{!this.state.isLoading
							? <div className="template-feed">
								<ComicList
									title="Other comics using this template"
									emptyText={`No other comics have been completed with this template.`}
									noMoreText={`Phew! That's all the comics that have been completed using this template.`}
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