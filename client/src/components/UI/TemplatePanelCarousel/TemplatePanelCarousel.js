import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import Slider from "react-slick";
import Util from '../../../Util';

import lilbuddy1 from './lilbuddy1.png';

import "slick-carousel/slick/slick.css";

import ComicPanel from '../ComicPanel/ComicPanel';

export default class TemplatePanelCarousel extends Component {
	constructor(props) {
		super(props);

		this.state = {
			redirectTo: null,
			mouseDownPos: null
		};

		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
	}
	onMouseDown(e) {
		this.setState({
			mouseDownPos: {
				x: e.pageX,
				y: e.pageY
			}
		});
	}
	onMouseUp(e, templateId) {
		if(this.state.mouseDownPos) {
			let xDiff = Math.abs(e.pageX - this.state.mouseDownPos.x);
			let yDiff = Math.abs(e.pageY - this.state.mouseDownPos.y);
			
			if(xDiff < 4 && yDiff < 4) {
				this.setState({
					redirectTo: Util.route.template(templateId)
				});
			} else {
				this.setState({
					mouseDownPos: null
				});
			}
		}
	}
	render() {
		if(this.state.redirectTo) return <Redirect to={this.state.redirectTo} />;

		let templates = [...Util.referenceData.getTemplates()].reverse();

		const settings = {
			infinite: true,
			autoplay: true,
			autoplaySpeed: 4500,
			arrows: false,
			lazyLoad: 'ondemand'
		};

		return <div className={`template-panel-carousel ${this.props.withLilBuddy ? 'with-lil-buddy' : ''}`}>
			{this.props.withLilBuddy ? <img className="lil-buddy" src={lilbuddy1} /> : null}
			<Slider className="template-panel-carousel-slider comic-panel-width comic-panel-height" {...settings}>
			{templates.map(template => {
				let firstTemplatePanel = template.templatePanels[0];
				if(!firstTemplatePanel) return;

				return <div key={template.templateId} className="template-panel-item" onMouseDown={this.onMouseDown} onMouseUp={(e) => this.onMouseUp(e, template.templateId)}>
					<ComicPanel readOnly={true} isColour={true} templatePanelId={firstTemplatePanel.templatePanelId} />
				</div>;
			})}
			</Slider>
		</div>;
	}
}