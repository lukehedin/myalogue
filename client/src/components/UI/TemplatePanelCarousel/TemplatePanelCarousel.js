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
			redirectTo: null
		};

		this.setRedirectTo = this.setRedirectTo.bind(this);
	}
	setRedirectTo(to) {
		this.setState({
			redirectTo: to
		});
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

				return <div key={template.templateId} className="template-panel-item" onDoubleClick={() => this.setRedirectTo(Util.route.template(template.templateId))}>
					<ComicPanel readOnly={true} templatePanelId={firstTemplatePanel.templatePanelId} />
				</div>;
			})}
			</Slider>
		</div>;
	}
}