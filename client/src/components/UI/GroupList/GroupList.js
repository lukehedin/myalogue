import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import HTMLEllipsis from 'react-lines-ellipsis/lib/html';
import Util from '../../../Util';

export default class GroupList extends Component {
	render() {
		return <div className="group-list">
			{Util.array.any(this.props.groups)
				? this.props.groups.map(group => {
					return <div key={group.groupId} className="group-list-item">
						<Link className="group-name" to={Util.route.group(group.groupId)}>{group.name}</Link>
						{!this.props.hideDescription && group.description
							? <HTMLEllipsis
								className="description"
								unsafeHTML={Util.format.userStringToSafeHtml(group.description)}
								maxLine='3'
								ellipsis='...'
								basedOn='letters'
							/>
							: null
						}
						<p className="group-bottom sm">{group.groupUsers.length} {Util.format.pluralise(group.groupUsers, 'member')}{group.instruction ? ` - ${group.instruction}` : null}</p>
					</div>
				})
				: <p className="empty-text">No groups found.</p>
			}
		</div>
	}
}