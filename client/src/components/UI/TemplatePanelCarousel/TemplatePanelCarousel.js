import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Slider from "react-slick";
import Util from '../../../Util';

import lilbuddy1 from './lilbuddy1.png';

import "slick-carousel/slick/slick.css";

import ComicPanel from '../ComicPanel/ComicPanel';

export default class TemplatePanelCarousel extends Component {
	render() {
		let templates = [...Util.referenceData.getTemplates()].reverse();

		const settings = {
			infinite: true,
			autoplay: this.props.autoplay,
			autoplaySpeed: 4500,
			arrows: false,
			lazyLoad: 'ondemand'
		};

		return <div className={`template-panel-carousel ${this.props.withLilBuddy ? 'with-lil-buddy' : ''}`}>
			{this.props.withLilBuddy ? <img className="lil-buddy" src={lilbuddy1} /> : null}
			<Slider className="template-panel-carousel-slider comic-panel-width comic-panel-height" {...settings}>
			{templates.map(template => {
				let firstTemplatePanel = template.templatePanels[0];

				return <div key={template.templateId} className="template-panel-item">
					<ComicPanel readOnly={true} templatePanelId={firstTemplatePanel.templatePanelId} />
					<Link to={Util.route.template(template.templateId)} />
				</div>;
			})}
			</Slider>
		</div>;
	}
}