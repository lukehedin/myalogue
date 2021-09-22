import React, { Component } from 'react';
import ComicPanel from '../ComicPanel/ComicPanel';

class GifComic extends Component {
	constructor(props) {
		super(props);

		this.state = {
			activePanelIdx: 0
		};
		
		this.activePanelTimeout;
	}
	componentDidMount() {
		this.readyNextFrame();
	}
	readyNextFrame() {
		this.activePanelTimeout = setTimeout(() => {
			const nextIdx = this.state.activePanelIdx + 1 >= this.props.comic.panelCount 
				? 0 
				: this.state.activePanelIdx + 1;

			this.setState({
				activePanelIdx:  nextIdx
			});

			this.readyNextFrame();
		}, Math.max((this.props.comic.comicPanels[this.state.activePanelIdx].value || '').match(/\S+/g).length * 500, 1500));
	}
	render() {
		return <div className="comic-panel-width comic-panel-height">
			{this.props.comic.comicPanels.map((comicPanel, idx) => {
				return <div className="gif-comic-panel-wrapper" style={{ opacity: idx === this.state.activePanelIdx ? '1' : '0' }}>
					<ComicPanel isColour={true} comicPanel={comicPanel} />
				</div>;
			})}
		</div>
	}
}

export default GifComic;